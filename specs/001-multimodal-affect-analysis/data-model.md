# Data Model: 대면 세일즈 미팅 멀티모달 코칭 분석

## Session
| 필드 | 타입 | 설명 |
|---|---|---|
| id | UUID | |
| title | text | 세션 이름 |
| mode | enum | `roleplay`(기본), `live_customer` |
| coach | text | 코치 |
| sales_rep_id | FK SalesRep | 코칭 대상 |
| topics | text[] | 핵심 주제 키워드(가격, 경쟁사 등) |
| status | enum | `preparing` → `baseline` → `live` → `ended` → `purged` |
| started_at / ended_at | timestamptz | |
| baseline_sec | int | 기준선 구간 길이(기본 90초) |
| retention_days | int | 보유기간(기본 30일) |
| store_raw_media | bool | 원본 저장 옵트인(기본 false) |

**상태 전이**: `preparing`에서 모든 Participant의 Consent가 유효할 때만 `baseline`으로 이동. `live_customer` 모드는 슬롯 B(고객) 동의가 추가로 필요하다. 동의 철회 시 즉시 `ended` 후 해당 참여자 데이터 파기.

## Participant
| 필드 | 타입 | 설명 |
|---|---|---|
| id | UUID | |
| session_id | FK Session | |
| slot | enum | `A`(영업 담당자), `B`(고객 또는 고객 역할) |
| role | enum | `sales_rep`, `customer`, `customer_roleplayer` |
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
| features | jsonb | 예: `{valence, arousal, au: {AU06, AU12, ...}}`, 시선: `{yaw, pitch, target, eye_quality, speaking_state}` |
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
| talk_share_a / talk_share_b | real | 말하기·듣기 비율 |
| longest_monologue_a_sec | real | 영업 담당자 최장 독백 |
| questions_a / questions_b | int | 질문 수 |
| turn_gap_ms | real? | 턴 전환 지연 |
| interruptions_a / interruptions_b | int | 끼어들기 |
| mutual_gaze_ratio | real | 상호 응시 비율 |
| gaze_speaking_a / gaze_listening_a | real | 영업 담당자가 말할 때·들을 때 고객 얼굴 응시 비율 |
| synchrony | real? | 표정·운율 동조성 |

## TranscriptSegment
| 필드 | 타입 | 설명 |
|---|---|---|
| session_id, slot | | |
| start_ts / end_ts | double | |
| text | text | |
| sentiment | real -1–1 | |
| is_question | bool | 의문문 여부 |
| topics | text[] | 언급된 핵심 주제 |
| confidence | real | |

## Report
| 필드 | 타입 | 설명 |
|---|---|---|
| session_id | FK | |
| generated_at | timestamptz | |
| summary | jsonb | 주요 변화 구간, 역학 요약 |
| pdf_path | text | |

## SalesRep
| 필드 | 타입 | 설명 |
|---|---|---|
| id | UUID | |
| display_name | text | 표시 이름(가명 허용) |
| goals | jsonb | 코칭 목표(예: 말하기 비율 50% 이하) |

**규칙**: 성장 추적은 본인과 담당 코치만 조회한다. 등급·순위 필드는 두지 않는다.

## KeyMoment
| 필드 | 타입 | 설명 |
|---|---|---|
| session_id | FK | |
| ts | double | |
| topic | text | 트리거한 핵심 주제 |
| customer_delta | real | 고객 반응 변화량(z) |
| modalities | text[] | 변화가 나타난 모달리티 |

## CoachingHint
| 필드 | 타입 | 설명 |
|---|---|---|
| session_id | FK | |
| ts | double | |
| kind | enum | `pace_fast`, `monologue`, `few_questions`, `low_eye_contact`, `interruption` |
| detail | jsonb | 근거 수치 |
