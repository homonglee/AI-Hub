---

description: "Task list for 001-multimodal-affect-analysis (v2: 세일즈 코칭)"
---

# Tasks: 대면 세일즈 미팅 멀티모달 코칭 분석

**Input**: Design documents from `/specs/001-multimodal-affect-analysis/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: 헌장 IV(Test-First with Recorded Fixtures)에 따라 각 스토리에 테스트 작업을 포함한다. 테스트를 먼저 작성하고 실패를 확인한 뒤 구현한다. 성능 테스트는 최소 사양인 RTX 4070 노트북에서 실행한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 가능(다른 파일, 의존성 없음)
- **[Story]**: US1~US4

---

## Phase 1: Setup

- [ ] T001 `backend/`(uv, Python 3.11, 패키지 `affectlens`)와 `frontend/`(Vite + React + TS) 구조 생성
- [ ] T002 [P] ruff, mypy, pytest 설정 in `backend/pyproject.toml`
- [ ] T003 [P] ESLint, Prettier, Playwright 설정 in `frontend/`
- [ ] T004 [P] Redis, TimescaleDB 컨테이너 정의 in `deploy/docker-compose.yml`
- [ ] T005 [P] ONNX 모델 다운로드·체크섬 스크립트(프로필별 모델 선택) in `backend/src/affectlens/models/download.py`
- [ ] T006 [P] 하드웨어 프로필 정의(laptop: 720p30·whisper turbo int8 / desktop: 1080p60·whisper large-v3) in `deploy/profiles/`
- [ ] T007 [P] 동의 받은 세일즈 롤플레이 녹화 fixture 4종(기본, 긴 독백·끼어들기, 가격 제시, 얼굴 가림·조명 변화) in `backend/tests/fixtures/`
- [ ] T008 [P] 조명·카메라·마이크 설치 가이드(거리, 각도, 색온도) in `docs/hardware-setup.md`

---

## Phase 2: Foundational (Blocking)

**⚠️ CRITICAL**: 이 단계 완료 전에는 어떤 스토리도 시작하지 않는다.

- [ ] T009 공통 메시지 스키마(pydantic) in `backend/src/affectlens/bus/schema.py` — contracts/stream-messages.md
- [ ] T010 [P] 스키마 contract 테스트(판정성 필드 부재, missing 시 null) in `backend/tests/contract/test_stream_schema.py`
- [ ] T011 Redis Streams 발행·구독 래퍼, deadletter 처리 in `backend/src/affectlens/bus/redis_bus.py`
- [ ] T012 [P] TimescaleDB 스키마·마이그레이션(Session, Participant, SalesRep, Consent, hypertables) in `backend/src/affectlens/storage/migrations/`
- [ ] T013 LSL 시계 기반 카메라(MJPEG)·마이크 캡처와 공유 메모리 링버퍼 in `backend/src/affectlens/capture/`
- [ ] T014 [P] 녹화 파일 입력 재생 모드 in `backend/src/affectlens/replay.py`
- [ ] T015 [P] 캡처 동기화 테스트(정렬 오차 20ms 이하, 노트북 USB 구성) in `backend/tests/integration/test_sync.py`
- [ ] T016 동의 서비스(롤플레이/실제 미팅 모드별 조건)와 시작 차단 in `backend/src/affectlens/consent/service.py`
- [ ] T017 [P] 동의 테스트(미동의 409, 고객 동의 없는 실제 미팅 409, 철회 시 중단·파기) in `backend/tests/integration/test_consent.py`
- [ ] T018 하드웨어 감시(GPU 메모리·온도·클록, AC 전원)와 과열 시 fps 단계 하향 in `backend/src/affectlens/hw/monitor.py`
- [ ] T019 프로세스 오케스트레이터(프로필 로드, 기동, 헬스체크, 재시작) in `backend/src/affectlens/orchestrator.py`
- [ ] T020 [P] 원본 미디어 미기록 보장 테스트(SC-010) in `backend/tests/integration/test_no_raw_media.py`

**Checkpoint**: 노트북에서 녹화 fixture가 동기화된 타임스탬프로 버스에 흐르고, 동의 조건이 지켜진다.

---

## Phase 3: User Story 1 - 실시간 코칭 모니터링 (P1) 🎯 MVP

**Goal**: 영업 담당자의 발화 속도·음량·표정 활성도와 고객의 표정·음성 반응이 1초 단위로 표시되고, 발화 속도 힌트가 코치 화면에 뜬다.

**Independent Test**: quickstart 시나리오 0~2

### Tests (먼저 작성)

- [ ] T021 [P] [US1] 얼굴 분석기 회귀 테스트(미소 구간 AU12·valence 상승) in `backend/tests/unit/test_face.py`
- [ ] T022 [P] [US1] 음성 운율·발화 속도·음성 감정 회귀 테스트 in `backend/tests/unit/test_voice.py`
- [ ] T023 [P] [US1] 노트북 RTX 4070 지연·VRAM 벤치마크(얼굴 p95 100ms, 음성 1s, VRAM 6GB 이하) in `backend/tests/bench/test_latency.py`
- [ ] T024 [P] [US1] WebSocket contract 테스트 in `backend/tests/contract/test_ws.py`

### Implementation

- [ ] T025 [P] [US1] MediaPipe 랜드마크·홍채 + 얼굴 정렬 in `backend/src/affectlens/analyzers/face/landmarks.py`
- [ ] T026 [US1] LibreFace AU + HSEmotion VA 추론(ONNX Runtime GPU) in `backend/src/affectlens/analyzers/face/affect.py`
- [ ] T027 [P] [US1] Silero VAD + openSMILE eGeMAPS 운율·발화 속도 in `backend/src/affectlens/analyzers/voice/prosody.py`
- [ ] T028 [US1] emotion2vec 음성 VA in `backend/src/affectlens/analyzers/voice/emotion.py`
- [ ] T029 [US1] 발화 속도 코칭 힌트 규칙 in `backend/src/affectlens/coaching/hints.py`
- [ ] T030 [US1] 특징 저장 소비자 in `backend/src/affectlens/storage/writer.py`
- [ ] T031 [US1] 세션·장치·동의·시스템 상태 REST API in `backend/src/affectlens/api/rest.py` — contracts/rest-api.md
- [ ] T032 [US1] WebSocket 1Hz 집계 push(코치 전용) in `backend/src/affectlens/api/ws.py`
- [ ] T033 [P] [US1] 세션 준비 화면(모드 선택, 장치 할당, 동의, 핵심 주제 입력) in `frontend/src/pages/SessionSetup.tsx`
- [ ] T034 [US1] 코치 대시보드(영업 담당자·고객 패널, 타임라인, 힌트, 신뢰도·결측, 장치·GPU 상태) in `frontend/src/pages/CoachDashboard.tsx`
- [ ] T035 [US1] E2E: 세션 시작 → 3초 내 지표 표시 in `frontend/tests/live.spec.ts`

**Checkpoint**: MVP — 노트북으로 10분 롤플레이 세션이 동작한다.

---

## Phase 4: User Story 2 - 시선 및 대화 역학 (P2)

**Goal**: 말하기·듣기 비율, 최장 독백, 끼어들기, 질문 수, 말할 때·들을 때 눈맞춤 비율 표시.

**Independent Test**: quickstart 시나리오 3, SC-006·SC-007

### Tests

- [ ] T036 [P] [US2] 조명 품질 점수 테스트(역광·저조도 fixture에서 경고) in `backend/tests/unit/test_eye_quality.py`
- [ ] T037 [P] [US2] 응시 판정 정확도 테스트(카메라 단독 vs 마이크 보정, 사람 주석 대비 85% 이상) in `backend/tests/integration/test_gaze_accuracy.py`
- [ ] T038 [P] [US2] 대화 역학 테스트(독백·끼어들기 fixture 대본 일치, 말하기 비율 ±3%p) in `backend/tests/integration/test_interaction.py`

### Implementation

- [ ] T039 [P] [US2] `GazeSource` 인터페이스 + L2CS-Net 시선 추정 in `backend/src/affectlens/analyzers/gaze/estimator.py`
- [ ] T040 [P] [US2] 눈 영역 품질(밝기, 대비, 반사) 측정과 조명 조정 안내 in `backend/src/affectlens/analyzers/gaze/eye_quality.py`
- [ ] T041 [US2] 세션 전 조명 점검 API·화면 in `backend/src/affectlens/api/rest.py`, `frontend/src/components/LightingCheck.tsx`
- [ ] T042 [US2] 카메라 배치 캘리브레이션(상대 얼굴 위치 → 응시 판정) in `backend/src/affectlens/analyzers/gaze/calibration.py`
- [ ] T043 [US2] 마이크 발화 상태 결합 HMM 응시 평활화(말할 때·들을 때 구분) in `backend/src/affectlens/analyzers/gaze/speech_fusion.py`
- [ ] T044 [P] [US2] 깜빡임 검출(EAR) in `backend/src/affectlens/analyzers/gaze/blink.py`
- [ ] T045 [P] [US2] (선택) 850nm 근적외선 조명 + IR 카메라 동공 검출 어댑터 in `backend/src/affectlens/analyzers/gaze/ir_pupil.py`
- [ ] T046 [US2] 세일즈 대화 역학 계산기 in `backend/src/affectlens/fusion/interaction.py`
- [ ] T047 [US2] 독백·눈맞춤 부족·끼어들기 힌트 규칙 in `backend/src/affectlens/coaching/hints.py`
- [ ] T048 [US2] 대시보드 대화 역학 패널 in `frontend/src/components/InteractionPanel.tsx`

**Checkpoint**: US1과 US2가 각각 독립적으로 동작한다.

---

## Phase 5: User Story 3 - 고객 반응 융합과 핵심 순간 (P3)

**Goal**: 고객 반응 융합 지표를 기준선 대비 변화량으로 표시하고, 핵심 주제 언급 후 반응 변화를 핵심 순간으로 기록.

**Independent Test**: 가격 제시 fixture에서 핵심 순간 표시, SC-005·SC-008

### Tests

- [ ] T049 [P] [US3] 결측 모달리티 시 신뢰도 하락 테스트 in `backend/tests/unit/test_fusion.py`
- [ ] T050 [P] [US3] 기준선 z-score 계산 테스트 in `backend/tests/unit/test_baseline.py`
- [ ] T051 [P] [US3] 한국어 CER 평가(SC-005, 프로필별) in `backend/tests/bench/test_asr_cer.py`
- [ ] T052 [P] [US3] 핵심 순간 탐지 테스트(가격 제시 구간) in `backend/tests/integration/test_key_moment.py`

### Implementation

- [ ] T053 [P] [US3] faster-whisper 스트리밍 ASR(프로필별 모델) in `backend/src/affectlens/analyzers/text/asr.py`
- [ ] T054 [US3] 한국어 텍스트 감성 + 의문문 판별 + 주제 키워드 태깅 in `backend/src/affectlens/analyzers/text/nlp.py`
- [ ] T055 [US3] 질문 부족 힌트 규칙 in `backend/src/affectlens/coaching/hints.py`
- [ ] T056 [US3] 윈도우 정렬 + 신뢰도 가중 late fusion in `backend/src/affectlens/fusion/late_fusion.py`
- [ ] T057 [US3] 기준선 측정·변화량 산출 in `backend/src/affectlens/fusion/baseline.py`
- [ ] T058 [US3] 핵심 순간 탐지 in `backend/src/affectlens/fusion/key_moments.py`
- [ ] T059 [US3] 대시보드 전사·고객 반응·핵심 순간 표시 in `frontend/src/components/CustomerPanel.tsx`
- [ ] T060 [US3] 롤플레이 세션 20건 주석 + 평가 스크립트(SC-005~SC-008, 성별·연령 편향) in `backend/scripts/evaluate.py`

---

## Phase 6: User Story 4 - 코칭 리포트와 성장 추적 (P4)

**Goal**: 세션 코칭 리포트, PDF 내보내기, 영업 담당자별 세션 간 추이.

**Independent Test**: quickstart 시나리오 5

- [ ] T061 [P] [US4] 리포트 생성 30초 이내 테스트 in `backend/tests/integration/test_report.py`
- [ ] T062 [P] [US4] 보유기간 파기 테스트 in `backend/tests/integration/test_retention.py`
- [ ] T063 [P] [US4] 성장 추적 접근 제어 테스트(본인·담당 코치만 조회) in `backend/tests/integration/test_progress_access.py`
- [ ] T064 [US4] 코칭 포인트 요약(핵심 순간, 힌트 빈도, 목표 대비) in `backend/src/affectlens/report/summary.py`
- [ ] T065 [US4] PDF 렌더링 in `backend/src/affectlens/report/pdf.py`
- [ ] T066 [US4] 세션 간 지표 추이 API in `backend/src/affectlens/coaching/progress.py`
- [ ] T067 [US4] 보유기간 파기 스케줄러 in `backend/src/affectlens/storage/retention.py`
- [ ] T068 [US4] 리포트 화면(타임라인 클릭 → 시점 지표·전사) in `frontend/src/pages/Report.tsx`
- [ ] T069 [US4] 성장 추적 화면 in `frontend/src/pages/Progress.tsx`

---

## Phase 7: Polish & Cross-Cutting

- [ ] T070 [P] TensorRT 변환으로 노트북 GPU 지연 최적화 in `deploy/models/`
- [ ] T071 노트북 60분 연속 안정성 테스트(프레임 드롭 2% 이하, 과열 대응, SC-004) in `backend/tests/bench/test_soak.py`
- [ ] T072 [P] 데스크톱 프로필 성능 검증(1080p60) in `backend/tests/bench/test_desktop_profile.py`
- [ ] T073 [P] 코치 운영 가이드, 영업 담당자·고객 동의서 양식 in `docs/`
- [ ] T074 개인정보 영향평가(PIA)와 직장 내 사용 점검(인사평가 미사용 확인, EU 배포 시 직원 감정 추정 비활성화 설정)
- [ ] T075 quickstart.md 전체 시나리오 검증

---

## Dependencies & Execution Order

- Phase 1 → Phase 2(모든 스토리 차단) → US1(MVP) → US2, US3 병렬 가능 → US4 → Polish
- US2의 마이크 보정(T043)은 US1의 VAD(T027) 출력을 사용한다.
- US3의 융합(T056)은 US1 분석기 출력을 사용하지만, 시선이 없어도 동작해야 한다.
- US4는 US1 데이터만으로도 리포트를 생성할 수 있어야 하며, US2·US3 결과가 있으면 더 풍부해진다.
- 각 스토리 안에서는 테스트 → 분석기 → 융합/코칭 → API → 프론트엔드 순서.

## Parallel Example: Phase 2 이후

```text
개발자 A: T025 → T026 (얼굴)
개발자 B: T027 → T028 → T029 (음성, 발화 속도 힌트)
개발자 C: T033 → T034 (프론트엔드, WebSocket mock 사용)
```

## Implementation Strategy

1. **Week 1–2**: Phase 1–2 (동기화, 버스, 동의, 하드웨어 프로필·감시)
2. **Week 3–5**: US1 → 노트북으로 롤플레이 MVP 데모
3. **Week 6–8**: US2(시선: 카메라 + 조명 + 마이크) + US3 병렬, 롤플레이 주석 데이터 수집
4. **Week 9–10**: US4 + Polish, 한국어 성능·편향 평가, 파일럿 코칭 시작(SC-009는 파일럿 4주 후 측정)
