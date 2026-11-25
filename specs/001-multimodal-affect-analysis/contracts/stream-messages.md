# Contract: 내부 스트림 메시지 (Redis Streams)

모든 메시지는 msgpack으로 직렬화하며 아래 공통 헤더를 가진다. 스키마 위반 메시지는 `affect:deadletter`로 보낸다.

```json
{
  "schema": "affectlens.v1",
  "type": "feature | fused | interaction | transcript | key_moment | hint | device",
  "session_id": "uuid",
  "slot": "A | B | null",
  "ts": 12345.678,
  "confidence": 0.0,
  "missing": false,
  "payload": {}
}
```

## 스트림 키

| 키 | 생산자 | 소비자 | payload |
|---|---|---|---|
| `affect:{sid}:face` | face analyzer | fusion, storage | `{valence, arousal, au: {AU01..AU45}, face_quality}` |
| `affect:{sid}:gaze` | gaze analyzer | fusion, storage | `{yaw, pitch, target: "partner_face"\|"away"\|"unknown", target_raw, eye_quality, speaking_state, blink}` |
| `affect:{sid}:voice` | voice analyzer | fusion, storage | `{speaking, f0_mean, loudness, speech_rate, valence, arousal}` |
| `affect:{sid}:text` | text analyzer | fusion, storage, api | `{start_ts, end_ts, text, sentiment, is_question, topics}` |
| `affect:{sid}:fused` | fusion | api, storage | FusedState 필드 |
| `affect:{sid}:interaction` | fusion | api, storage | InteractionMetric 필드 |
| `affect:{sid}:key_moment` | fusion | api, storage | KeyMoment 필드 |
| `affect:{sid}:hint` | coaching | api(코치 화면 전용), storage | CoachingHint 필드 |
| `affect:{sid}:device` | capture, system | api | `{device, status: "ok"\|"lost"\|"degraded", detail}` — 조명 품질 경고, VRAM 한도 초과 포함 |

## 불변 조건

- `ts`는 LSL 시계 기준이며 스트림 안에서 단조 증가한다.
- `missing: true`이면 `payload`의 수치 필드는 `null`이다.
- 판정성 필드(예: `grade`, `will_buy`, `lie`, `score_final`)는 스키마에 존재하지 않는다(헌장 II).
- 시선 `target`은 `target_raw`(카메라 단독 판정)에 마이크 발화 상태 기반 HMM 평활화를 적용한 값이다.
