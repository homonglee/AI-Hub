# Data Model: 대면 1:1 대화 멀티모달 감정 분석

## Session
| 필드 | 타입 | 설명 |
|---|---|---|
| id | UUID | |
| title | text | 세션 이름 |
| operator | text | 진행자 |
| status | enum | `preparing` → `baseline` → `live` → `ended` → `purged` |
| started_at / ended_at | timestamptz | |
| baseline_sec | int | 기준선 구간 길이(기본 90초) |
| retention_days | int | 보유기간(기본 30일) |
| store_raw_media | bool | 원본 저장 옵트인(기본 false) |

**상태 전이**: `preparing`에서 모든 Participant의 Consent가 유효할 때만 `baseline`으로 이동. 동의 철회 시 즉시 `ended` 후 해당 참여자 데이터 파기.

## Participant
| 필드 | 타입 | 설명 |
|---|---|---|
| id | UUID | |
| session_id | FK Session | |
| slot | enum | `A`, `B` |
| role | text | 예: interviewer, interviewee |
| camera_device / mic_channel | text / int | 할당된 장치 |
| baseline | jsonb | 지표별 평균·표준편차 |

## Consent
| 필드 | 타입 | 설명 |
|---|---|---|
| participant_id | FK | |
| scopes | text[] | `face`, `gaze`, `voice`, `transcript`, `raw_media` |
| agreed_at | timestamptz | |
| withdrawn_at | timestamptz? | |

**규칙**: 분석기는 Consent.scopes에 포함된 모달리티만 실행한다.

## FeatureFrame (hypertable)
| 필드 | 타입 | 설명 |
|---|---|---|
| ts | double | LSL 시계(초) |
| session_id, slot | | |
| modality | enum | `face`, `gaze`, `voice`, `text` |
| features | jsonb | 예: `{valence, arousal, au: {AU06, AU12, ...}}` |
| confidence | real 0–1 | |
| missing | bool | 결측 여부 |

## FusedState (hypertable)
| 필드 | 타입 | 설명 |
|---|---|---|
| window_start / window_end | double | |
| session_id, slot | | |
| valence, arousal | real | 융합값 |
| valence_delta, arousal_delta | real | 기준선 대비 z-score |
| confidence | real | |
| contributing | text[] | 기여한 모달리티 |

## InteractionMetric (hypertable)
| 필드 | 타입 | 설명 |
|---|---|---|
| window_start / window_end | double | |
| session_id | | |
| talk_share_a / talk_share_b | real | 발화 점유율 |
| turn_gap_ms | real? | 턴 전환 지연 |
| interruptions_a / interruptions_b | int | 끼어들기 |
| mutual_gaze_ratio | real | 상호 응시 비율 |
| synchrony | real? | 표정·운율 동조성 |

## TranscriptSegment
| 필드 | 타입 | 설명 |
|---|---|---|
| session_id, slot | | |
| start_ts / end_ts | double | |
| text | text | |
| sentiment | real -1–1 | |
| confidence | real | |

## Report
| 필드 | 타입 | 설명 |
|---|---|---|
| session_id | FK | |
| generated_at | timestamptz | |
| summary | jsonb | 주요 변화 구간, 역학 요약 |
| pdf_path | text | |
