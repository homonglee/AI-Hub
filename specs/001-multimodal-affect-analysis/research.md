# Research: 대면 1:1 대화 멀티모달 감정 분석

## 미결 사항에 대한 결정 (spec의 NEEDS CLARIFICATION)

### R1. 주 사용 목적 (FR-016)
- **Decision**: v1은 연구·상담 보조 용도로 한정한다. 채용 평가 모드는 제공하지 않는다.
- **Rationale**: 채용·교육 분야 감정 인식은 EU AI Act 금지 대상이고, 국내에서도 AI 면접 설명 의무와 편향 문제가 있다. 연구·상담 보조는 사람 판단을 돕는 형태로 위험이 낮다.
- **Alternatives considered**: 채용 면접 보조 — 법률 검토와 편향 감사가 선행되어야 하므로 v2 이후로 연기.

### R2. 시선 정밀도 (FR-017)
- **Decision**: RGB 기반 시선 추정(L2CS-Net)을 기본으로 하고, `GazeSource` 인터페이스로 Tobii/Pupil Labs 아이트래커를 나중에 연결할 수 있게 한다.
- **Rationale**: 1:1 대화에서 핵심 지표는 "상대 얼굴을 보는가"이며, 1m 거리에서 얼굴 영역은 약 10° 이상이라 3~5° 오차로도 판정 가능하다. 아이트래커 착용 부담을 피한다.
- **Alternatives considered**: 안경형 아이트래커 기본 탑재 — 정밀하지만 비용과 착용 부담이 크다.

### R3. 배포 형태 (FR-018)
- **Decision**: 고정형 인터뷰실 워크스테이션(RTX 4070 Ti 이상, VRAM 12GB+).
- **Rationale**: 2인 × 4모달리티 동시 추론과 ASR을 지연 목표 안에 처리하려면 데스크톱 GPU가 단순하고 저렴하다.
- **Alternatives considered**: Jetson AGX Orin 이동형 — TensorRT 최적화 부담이 커서 v2 이후.

## 기술 선택

### R4. 시간 동기화
- **Decision**: 모든 장치를 단일 호스트에서 캡처하고, 캡처 시점에 `pylsl.local_clock()` 타임스탬프를 붙인다. 오디오는 블록 단위 타임스탬프에 샘플 오프셋을 더한다.
- **Rationale**: 단일 단조 시계로 20ms 정렬 목표를 맞출 수 있고, 외부 장치(아이트래커, 생체신호)도 LSL로 붙일 수 있다.

### R5. 얼굴 분석
- **Decision**: MediaPipe Face Landmarker(검출·랜드마크·블렌드셰이프) → 정렬된 얼굴 크롭을 LibreFace(AU 강도)와 HSEmotion(valence/arousal)에 입력한다.
- **Rationale**: MediaPipe는 CPU에서도 빠르고, LibreFace·HSEmotion은 ONNX 변환이 가능하다.
- **Alternatives considered**: OpenFace 2.0 — 정확하지만 C++ 빌드 의존성이 무겁다. Py-Feat — 편리하지만 실시간에는 느리다.

### R6. 음성·텍스트
- **Decision**: Silero VAD → 발화 구간별 openSMILE eGeMAPS(운율), emotion2vec(음성 VA), faster-whisper large-v3(한국어 ASR, int8_float16) → 한국어 감성 분류 모델(KcELECTRA 계열 파인튜닝).
- **Rationale**: 화자별 채널 분리로 diarization이 불필요하다. faster-whisper는 실시간 스트리밍 청크 처리가 가능하다.
- **Alternatives considered**: 클라우드 STT — 헌장 I(온프레미스) 위반.

### R7. 메시지 버스
- **Decision**: Redis Streams(로컬 Docker), 메시지 직렬화는 msgpack, 스키마는 pydantic으로 검증.
- **Rationale**: 소비자 그룹과 재생(replay)을 지원하고 운영이 단순하다.
- **Alternatives considered**: ZeroMQ — 더 빠르지만 영속·재생을 직접 구현해야 한다. Kafka — 단일 장비에는 과하다.

### R8. 융합
- **Decision**: 1초 윈도우(0.5초 hop)로 모달리티별 지표를 평균하고, 신뢰도 가중 평균을 기본으로 한다. 라벨 데이터가 확보되면 LightGBM 융합기로 교체한다.
- **Rationale**: 헌장 VI(Simplicity First). 결측 처리가 쉽다.

### R9. 한국어 검증 데이터
- **Decision**: AI-Hub 공개 한국어 감정 음성·영상 데이터셋으로 파인튜닝·검증하고, 자체 연출 세션 20건 이상을 사람 라벨링해 SC-006·SC-007 평가셋으로 쓴다.
- **Rationale**: 공개 모델 대부분이 서구권 데이터로 학습되어 한국인 화자 성능을 검증해야 한다.
