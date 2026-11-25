# Implementation Plan: 대면 1:1 대화 멀티모달 감정 분석

**Branch**: `001-multimodal-affect-analysis` | **Date**: 2026-11-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-multimodal-affect-analysis/spec.md`

## Summary

화자별 카메라·마이크 스트림을 단일 호스트에서 수집해 LSL 시계로 동기화하고, 얼굴(표정·AU), 시선, 음성(VAD·운율·음성 감정·ASR), 텍스트 감성 분석기를 독립 프로세스로 실행한다. 분석 결과는 공통 메시지 스키마로 Redis Streams에 발행되고, 융합 서비스가 0.5~2초 윈도우로 정렬해 late fusion과 대화 역학 지표를 계산한다. FastAPI WebSocket이 React 대시보드로 실시간 전송하며, 특징값만 TimescaleDB에 저장해 사후 리포트를 만든다.

spec의 NEEDS CLARIFICATION 3건은 [research.md](./research.md)에서 기본값으로 결정했다(연구·상담 보조 용도, RGB 시선 추정 + 아이트래커 어댑터 인터페이스, 고정형 워크스테이션).

## Technical Context

**Language/Version**: Python 3.11 (파이프라인·API), TypeScript 5 + React 18 (대시보드)

**Primary Dependencies**: OpenCV, PyAV, sounddevice, pylsl, MediaPipe Face Landmarker, LibreFace(AU), HSEmotion(VA), L2CS-Net(시선), Silero VAD, faster-whisper, openSMILE(eGeMAPS), emotion2vec, ONNX Runtime/TensorRT, Redis Streams, FastAPI, Vite, ECharts

**Storage**: TimescaleDB(PostgreSQL 16) — 특징 시계열, 세션 메타데이터. 원본 미디어는 기본 미저장

**Testing**: pytest, pytest-benchmark(지연 측정), 녹화 fixture 기반 회귀 테스트, Playwright(대시보드 E2E)

**Target Platform**: Ubuntu 22.04/24.04 x86_64 + NVIDIA GPU(VRAM 12GB 이상, CUDA 12)

**Project Type**: 로컬 데스크톱형 웹 애플리케이션(멀티프로세스 백엔드 + 브라우저 프론트엔드)

**Performance Goals**: 화자 2명 × 영상 30~60fps 처리, 영상 지표 p95 100ms, 음성 감정 1s, ASR 2s, 대시보드 1Hz 이상 갱신

**Constraints**: 완전 오프라인 동작, 모달리티 간 정렬 오차 20ms 이내, 60분 세션 연속 동작, 원본 미디어 디스크 미기록

**Scale/Scope**: 장비 1대당 동시 세션 1개, 화자 2명, 세션 최대 120분

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 점검 | 결과 |
|---|---|---|
| I. Privacy by Design | 원본은 공유 메모리 링버퍼에서만 처리, 저장은 옵트인 플래그 필요. 외부 API 호출 없음. 동의 기록 전 파이프라인 시작 차단(FR-001) | PASS |
| II. No Automated Judgment | 출력 스키마에 판정 필드 없음, 모든 지표에 confidence 필수(FR-008, FR-015) | PASS |
| III. Modular Pipeline | 분석기별 독립 프로세스 + 공통 스키마(contracts/), 각 분석기 파일 입력 모드 지원 | PASS |
| IV. Test-First with Fixtures | `tests/fixtures/` 녹화 샘플, 분석기별 회귀·지연 테스트 | PASS |
| V. Measured Performance | 모든 메시지에 LSL 타임스탬프, CI 지연 벤치마크 | PASS |
| VI. Simplicity First | v1은 late fusion(가중 평균 + GBM), Transformer 융합은 범위 밖 | PASS |

Phase 1 설계 후 재점검: Redis·TimescaleDB 두 개의 저장 계층이 추가되지만 각각 실시간 버스와 영속 저장으로 역할이 다르므로 위반 아님.

## Project Structure

### Documentation (this feature)

```text
specs/001-multimodal-affect-analysis/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── stream-messages.md
│   └── rest-api.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/affectlens/
│   ├── capture/        # 카메라·마이크 수집, LSL 타임스탬프, 링버퍼
│   ├── analyzers/
│   │   ├── face/       # 랜드마크, AU, valence/arousal
│   │   ├── gaze/       # 시선 추정, 응시 대상 판정, 깜빡임
│   │   ├── voice/      # VAD, 운율, 음성 감정
│   │   └── text/       # ASR, 텍스트 감성
│   ├── fusion/         # 윈도우 정렬, late fusion, 기준선, 대화 역학
│   ├── bus/            # Redis Streams 발행/구독, 스키마 검증
│   ├── storage/        # TimescaleDB 저장, 보유기간 파기
│   ├── api/            # FastAPI REST + WebSocket
│   ├── report/         # 사후 리포트, PDF 내보내기
│   ├── consent/        # 동의 기록·철회
│   └── orchestrator.py # 프로세스 기동·감시
└── tests/
    ├── fixtures/       # 녹화 샘플(동의 받은 합성/연출 세션)
    ├── contract/
    ├── integration/
    ├── unit/
    └── bench/

frontend/
├── src/
│   ├── pages/          # 세션 준비, 실시간 대시보드, 리포트
│   ├── components/     # 타임라인 차트, 화자 패널, 장치 상태
│   └── services/       # WebSocket·REST 클라이언트
└── tests/

deploy/
├── docker-compose.yml  # redis, timescaledb
└── models/             # ONNX/TensorRT 모델 다운로드 스크립트
```

**Structure Decision**: 실시간 분석은 Python 생태계 모델이 대부분이므로 백엔드를 Python 단일 패키지(`backend/src/affectlens`)로 두고, 분석기는 같은 패키지 안의 모듈이지만 독립 프로세스로 실행한다. 대시보드는 별도 `frontend/`로 분리한다.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 분석기별 멀티프로세스 | GIL과 GPU 모델 간 간섭 없이 2인 × 4모달리티를 지연 목표 내 처리 | 단일 프로세스 스레드 구조는 ASR이 영상 처리를 막아 p95 100ms를 맞추지 못함 |
