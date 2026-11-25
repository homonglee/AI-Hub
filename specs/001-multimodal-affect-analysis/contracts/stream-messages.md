# Contract: 내부 스트림 메시지 (Redis Streams)

모든 메시지는 msgpack으로 직렬화하며 아래 공통 헤더를 가진다. 스키마 위반 메시지는 `affect:deadletter`로 보낸다.

```json
{
  "schema": "affectlens.v1",
  "type": "feature | fused | interaction | transcript | device",
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
| `affect:{sid}:gaze` | gaze analyzer | fusion, storage | `{yaw, pitch, target: "partner_face"\|"away"\|"unknown", blink}` |
| `affect:{sid}:voice` | voice analyzer | fusion, storage | `{speaking, f0_mean, loudness, speech_rate, valence, arousal}` |
| `affect:{sid}:text` | text analyzer | fusion, storage, api | `{start_ts, end_ts, text, sentiment}` |
| `affect:{sid}:fused` | fusion | api, storage | FusedState 필드 |
| `affect:{sid}:interaction` | fusion | api, storage | InteractionMetric 필드 |
| `affect:{sid}:device` | capture | api | `{device, status: "ok"\|"lost"\|"degraded", detail}` |

## 불변 조건

- `ts`는 LSL 시계 기준이며 스트림 안에서 단조 증가한다.
- `missing: true`이면 `payload`의 수치 필드는 `null`이다.
- 판정성 필드(예: `pass`, `lie`, `score_final`)는 스키마에 존재하지 않는다(헌장 II).
