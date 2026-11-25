# Contract: 대시보드 API (FastAPI, localhost 전용)

## REST

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/devices` | 연결된 카메라·마이크 목록 |
| POST | `/api/sessions` | 세션 생성 `{title, operator, baseline_sec, retention_days}` |
| POST | `/api/sessions/{id}/participants` | 참여자·장치 할당 `{slot, role, camera_device, mic_channel}` |
| POST | `/api/participants/{id}/consent` | 동의 기록 `{scopes[]}` |
| DELETE | `/api/participants/{id}/consent` | 동의 철회 → 분석 중단·파기 |
| POST | `/api/sessions/{id}/start` | 시작. 동의 미완료 시 `409 consent_required` |
| POST | `/api/sessions/{id}/stop` | 종료 |
| GET | `/api/sessions/{id}/timeline?from&to&step` | 저장된 지표 조회 |
| POST | `/api/sessions/{id}/report` | 리포트 생성 |
| GET | `/api/sessions/{id}/report.pdf` | PDF 내보내기 |

## WebSocket

`GET /ws/sessions/{id}` — 서버가 1Hz 이상으로 다음 메시지를 push한다.

```json
{
  "ts": 12345.5,
  "participants": {
    "A": {"face": {...}, "gaze": {...}, "voice": {...}, "fused": {...}},
    "B": {...}
  },
  "interaction": {...},
  "transcript": [{"slot": "A", "text": "...", "sentiment": 0.3}],
  "devices": [{"device": "cam0", "status": "ok"}]
}
```
