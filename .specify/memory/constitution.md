# Affect Lens Constitution

## Core Principles

### I. Privacy by Design (NON-NEGOTIABLE)
- 원본 영상·음성은 기본적으로 메모리에서만 처리하고 디스크에 저장하지 않는다. 저장은 세션별 명시적 옵트인일 때만 허용한다.
- 모든 처리는 온프레미스(로컬 장비)에서 수행한다. 외부 클라우드 API로 원본 미디어를 전송하지 않는다.
- 모든 참여자의 명시적 동의가 기록되기 전에는 분석 파이프라인이 시작되지 않는다.

### II. Human-in-the-Loop, No Automated Judgment
- 시스템은 관찰 가능한 행동 지표(Action Unit, 시선, 운율)와 연속값(valence/arousal)을 제공하며, 사람에 대한 합격·불합격, 진실·거짓 같은 판정을 출력하지 않는다.
- 모든 지표는 신뢰도(confidence)와 함께 표시한다.

### III. Modular Pipeline
- 각 모달리티(얼굴, 시선, 음성, 텍스트) 분석기는 독립 모듈이며, 공통 메시지 스키마로만 통신한다.
- 모듈은 단독으로 실행·테스트할 수 있어야 하고, 녹화 파일을 입력으로 받는 오프라인 모드를 지원해야 한다.

### IV. Test-First with Recorded Fixtures
- 모듈마다 고정된 녹화 샘플로 결정적(deterministic) 회귀 테스트를 작성한다.
- 지연(latency)과 정확도 지표는 CI에서 측정해 기준선 대비 회귀를 차단한다.

### V. Measured Real-Time Performance
- 영상 지표 지연 p95 100ms 이하, 음성 감정 1s 이하, ASR 2s 이하를 목표로 하며, 모든 메시지에 단조 증가 타임스탬프를 붙인다.
- 성능 주장은 측정값으로만 한다.

### VI. Simplicity First
- Late fusion 같은 단순한 방법으로 먼저 동작을 증명하고, 복잡한 모델(cross-modal Transformer)은 라벨 데이터와 측정 근거가 있을 때만 도입한다.

## Legal & Ethical Constraints

- 표정·시선·음성 특징은 개인정보보호법상 민감정보로 취급한다. 별도 동의, 보유기간, 파기 절차를 갖춘다.
- 채용·교육 평가 용도로 배포할 때는 자동 판정 기능을 비활성화하고 사람의 검토를 필수로 한다(EU AI Act 직장·교육 감정인식 금지 조항 참고).
- 한국인 화자 데이터로 성능과 편향(성별·연령)을 검증한 뒤에 정식 사용한다.

## Development Workflow

- Spec Kit 순서(constitution → specify → clarify → plan → tasks → implement)를 따른다.
- 모든 PR은 이 헌장의 원칙 위반 여부를 점검하고, 위반이 있으면 plan.md의 Complexity Tracking에 근거를 남긴다.

## Governance

이 헌장은 다른 모든 관행보다 우선한다. 개정에는 변경 근거, 영향 범위, 마이그레이션 계획이 필요하며 버전은 MAJOR.MINOR.PATCH로 관리한다.

**Version**: 1.0.0 | **Ratified**: 2026-11-25 | **Last Amended**: 2026-11-25
