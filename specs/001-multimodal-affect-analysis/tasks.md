---

description: "Task list for 001-multimodal-affect-analysis"
---

# Tasks: 대면 1:1 대화 멀티모달 감정 분석

**Input**: Design documents from `/specs/001-multimodal-affect-analysis/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: 헌장 IV(Test-First with Recorded Fixtures)에 따라 각 스토리에 테스트 작업을 포함한다. 테스트를 먼저 작성하고 실패를 확인한 뒤 구현한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 가능(다른 파일, 의존성 없음)
- **[Story]**: US1~US4

---

## Phase 1: Setup

- [ ] T001 `backend/`(uv, Python 3.11, 패키지 `affectlens`)와 `frontend/`(Vite + React + TS) 구조 생성
- [ ] T002 [P] ruff, mypy, pytest 설정 in `backend/pyproject.toml`
- [ ] T003 [P] ESLint, Prettier, Playwright 설정 in `frontend/`
- [ ] T004 [P] Redis, TimescaleDB 컨테이너 정의 in `deploy/docker-compose.yml`
- [ ] T005 [P] ONNX 모델 다운로드·체크섬 스크립트 in `backend/src/affectlens/models/download.py`
- [ ] T006 [P] 동의 받은 연출 녹화 fixture 3종(기본, 끼어들기, 얼굴가림) 준비 in `backend/tests/fixtures/`

---

## Phase 2: Foundational (Blocking)

**⚠️ CRITICAL**: 이 단계 완료 전에는 어떤 스토리도 시작하지 않는다.

- [ ] T007 공통 메시지 스키마(pydantic) 구현 in `backend/src/affectlens/bus/schema.py` — contracts/stream-messages.md
- [ ] T008 [P] 스키마 contract 테스트(판정성 필드 부재, missing 시 null) in `backend/tests/contract/test_stream_schema.py`
- [ ] T009 Redis Streams 발행·구독 래퍼, deadletter 처리 in `backend/src/affectlens/bus/redis_bus.py`
- [ ] T010 [P] TimescaleDB 스키마·마이그레이션(Session, Participant, Consent, hypertables) in `backend/src/affectlens/storage/migrations/`
- [ ] T011 LSL 시계 기반 카메라·마이크 캡처와 공유 메모리 링버퍼 in `backend/src/affectlens/capture/`
- [ ] T012 [P] 녹화 파일 입력 재생 모드(실시간 속도 재현) in `backend/src/affectlens/replay.py`
- [ ] T013 [P] 캡처 동기화 테스트(정렬 오차 20ms 이하) in `backend/tests/integration/test_sync.py`
- [ ] T014 동의 서비스와 시작 차단 로직 in `backend/src/affectlens/consent/service.py`
- [ ] T015 [P] 동의 테스트(미동의 409, 철회 시 중단·파기) in `backend/tests/integration/test_consent.py`
- [ ] T016 프로세스 오케스트레이터(기동, 헬스체크, 재시작) in `backend/src/affectlens/orchestrator.py`
- [ ] T017 [P] 원본 미디어 미기록 보장 테스트(SC-008) in `backend/tests/integration/test_no_raw_media.py`

**Checkpoint**: 녹화 fixture가 동기화된 타임스탬프로 버스에 흐르고, 동의 없이 시작이 거부된다.

---

## Phase 3: User Story 1 - 실시간 단일 모달리티 모니터링 (P1) 🎯 MVP

**Goal**: 두 화자의 표정·운율 지표가 대시보드에 1초 단위로 표시된다.

**Independent Test**: quickstart 시나리오 1, 2

### Tests (먼저 작성)

- [ ] T018 [P] [US1] 얼굴 분석기 회귀 테스트(fixture 미소 구간 AU12·valence 상승) in `backend/tests/unit/test_face.py`
- [ ] T019 [P] [US1] 음성 운율·음성 감정 회귀 테스트 in `backend/tests/unit/test_voice.py`
- [ ] T020 [P] [US1] 지연 벤치마크(얼굴 p95 100ms, 음성 1s) in `backend/tests/bench/test_latency.py`
- [ ] T021 [P] [US1] WebSocket contract 테스트 in `backend/tests/contract/test_ws.py`

### Implementation

- [ ] T022 [P] [US1] MediaPipe 랜드마크 + 얼굴 정렬 in `backend/src/affectlens/analyzers/face/landmarks.py`
- [ ] T023 [US1] LibreFace AU + HSEmotion VA 추론(ONNX Runtime GPU) in `backend/src/affectlens/analyzers/face/affect.py`
- [ ] T024 [P] [US1] Silero VAD + openSMILE eGeMAPS 운율 in `backend/src/affectlens/analyzers/voice/prosody.py`
- [ ] T025 [US1] emotion2vec 음성 VA in `backend/src/affectlens/analyzers/voice/emotion.py`
- [ ] T026 [US1] 특징 저장 소비자 in `backend/src/affectlens/storage/writer.py`
- [ ] T027 [US1] 세션·장치·동의 REST API in `backend/src/affectlens/api/rest.py` — contracts/rest-api.md
- [ ] T028 [US1] WebSocket 1Hz 집계 push in `backend/src/affectlens/api/ws.py`
- [ ] T029 [P] [US1] 세션 준비 화면(장치 할당, 동의 체크) in `frontend/src/pages/SessionSetup.tsx`
- [ ] T030 [US1] 실시간 대시보드(화자 패널, 타임라인 차트, 신뢰도·결측 표시, 장치 상태) in `frontend/src/pages/LiveDashboard.tsx`
- [ ] T031 [US1] E2E: 세션 시작 → 3초 내 지표 표시 in `frontend/tests/live.spec.ts`

**Checkpoint**: MVP — 실제 장비로 5분 세션이 동작하고 지표가 반응한다.

---

## Phase 4: User Story 2 - 시선 및 대화 역학 (P2)

**Goal**: 상호 응시, 시선 회피, 발화 점유율, 턴 전환 지연, 끼어들기 표시.

**Independent Test**: quickstart 시나리오 3

### Tests

- [ ] T032 [P] [US2] 응시 대상 판정 테스트(partner_face/away) in `backend/tests/unit/test_gaze.py`
- [ ] T033 [P] [US2] 대화 역학 테스트(끼어들기 fixture 대본 일치) in `backend/tests/integration/test_interaction.py`

### Implementation

- [ ] T034 [P] [US2] `GazeSource` 인터페이스 + L2CS-Net 구현 in `backend/src/affectlens/analyzers/gaze/`
- [ ] T035 [US2] 카메라 배치 캘리브레이션(상대 얼굴 위치 → 응시 판정) in `backend/src/affectlens/analyzers/gaze/calibration.py`
- [ ] T036 [P] [US2] 깜빡임 검출(EAR) in `backend/src/affectlens/analyzers/gaze/blink.py`
- [ ] T037 [US2] 대화 역학 계산기 in `backend/src/affectlens/fusion/interaction.py`
- [ ] T038 [US2] 대시보드 역학 패널 in `frontend/src/components/InteractionPanel.tsx`

**Checkpoint**: US1과 US2가 각각 독립적으로 동작한다.

---

## Phase 5: User Story 3 - 융합과 개인 기준선 (P3)

**Goal**: 표정·음성·텍스트 융합 지표를 기준선 대비 변화량으로 표시.

**Independent Test**: 라벨링 평가셋에서 융합 CCC > 단일 최고 모달리티(SC-006)

### Tests

- [ ] T039 [P] [US3] 결측 모달리티 시 신뢰도 하락 테스트 in `backend/tests/unit/test_fusion.py`
- [ ] T040 [P] [US3] 기준선 z-score 계산 테스트 in `backend/tests/unit/test_baseline.py`
- [ ] T041 [P] [US3] 한국어 CER 평가(SC-005) in `backend/tests/bench/test_asr_cer.py`

### Implementation

- [ ] T042 [P] [US3] faster-whisper 스트리밍 ASR in `backend/src/affectlens/analyzers/text/asr.py`
- [ ] T043 [US3] 한국어 텍스트 감성 in `backend/src/affectlens/analyzers/text/sentiment.py`
- [ ] T044 [US3] 윈도우 정렬 + 신뢰도 가중 late fusion in `backend/src/affectlens/fusion/late_fusion.py`
- [ ] T045 [US3] 기준선 측정·변화량 산출 in `backend/src/affectlens/fusion/baseline.py`
- [ ] T046 [US3] 대시보드 전사·delta 표시 in `frontend/src/components/FusedPanel.tsx`
- [ ] T047 [US3] 자체 연출 세션 20건 라벨링 + 평가 스크립트(SC-006, SC-007 그룹별 편향) in `backend/scripts/evaluate.py`

---

## Phase 6: User Story 4 - 사후 리포트 (P4)

**Goal**: 타임라인, 주요 변화 구간, 역학 요약, 전사 리포트 생성·PDF 내보내기.

**Independent Test**: quickstart 시나리오 5

- [ ] T048 [P] [US4] 리포트 생성 30초 이내 테스트 in `backend/tests/integration/test_report.py`
- [ ] T049 [P] [US4] 보유기간 파기 테스트 in `backend/tests/integration/test_retention.py`
- [ ] T050 [US4] 변화 구간 탐지·요약 in `backend/src/affectlens/report/summary.py`
- [ ] T051 [US4] PDF 렌더링 in `backend/src/affectlens/report/pdf.py`
- [ ] T052 [US4] 보유기간 파기 스케줄러 in `backend/src/affectlens/storage/retention.py`
- [ ] T053 [US4] 리포트 화면(타임라인 클릭 → 시점 지표·전사) in `frontend/src/pages/Report.tsx`

---

## Phase 7: Polish & Cross-Cutting

- [ ] T054 [P] TensorRT 변환으로 GPU 지연 최적화 in `deploy/models/`
- [ ] T055 60분 연속 안정성 테스트(프레임 드롭 1% 이하, SC-004) in `backend/tests/bench/test_soak.py`
- [ ] T056 [P] 조명·얼굴 품질 경고 in `backend/src/affectlens/analyzers/face/quality.py`
- [ ] T057 [P] 운영자 가이드·동의서 양식 in `docs/`
- [ ] T058 개인정보 영향평가(PIA) 체크리스트 작성 및 헌장 준수 점검
- [ ] T059 quickstart.md 전체 시나리오 검증

---

## Dependencies & Execution Order

- Phase 1 → Phase 2(모든 스토리 차단) → US1(MVP) → US2, US3 병렬 가능 → US4 → Polish
- US3의 융합(T044)은 US1 분석기 출력을 사용하지만, 시선이 없어도 동작해야 한다.
- US4는 저장 계층(T026)과 융합 결과(T044)가 있으면 더 풍부하지만 US1 데이터만으로도 생성 가능해야 한다.
- 각 스토리 안에서는 테스트 → 분석기 → 융합/API → 프론트엔드 순서.

## Parallel Example: Phase 2 이후

```text
개발자 A: T022 → T023 (얼굴)
개발자 B: T024 → T025 (음성)
개발자 C: T029 → T030 (프론트엔드, WebSocket mock 사용)
```

## Implementation Strategy

1. **Week 1–2**: Phase 1–2 (동기화·버스·동의 기반)
2. **Week 3–5**: US1 → 실제 장비로 MVP 데모
3. **Week 6–8**: US2 + US3 병렬, 라벨링 데이터 수집 시작
4. **Week 9–10**: US4 + Polish, 한국어 성능·편향 평가 보고
