# Contract: 대시보드 API (FastAPI, localhost 전용)

## REST

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/devices` | 연결된 카메라·마이크 목록 |
| GET | `/api/system` | GPU 모델·VRAM·온도, 전원 상태, 적용 하드웨어 프로필 |
| POST | `/api/sessions` | 세션 생성 `{title, mode, coach, sales_rep_id, topics[], baseline_sec, retention_days}` |
| POST | `/api/sessions/{id}/lighting-check` | 화자별 눈 영역 품질 점검 결과와 조명 조정 안내 |
| POST | `/api/sessions/{id}/participants` | 참여자·장치 할당 `{slot, role, camera_device, mic_channel}` |
| POST | `/api/participants/{id}/consent` | 동의 기록 `{scopes[]}` |
| DELETE | `/api/participants/{id}/consent` | 동의 철회 → 분석 중단·파기 |
| POST | `/api/sessions/{id}/start` | 시작. 동의 미완료 시 `409 consent_required`, `live_customer` 모드에서 고객 동의 없으면 `409 customer_consent_required` |
| POST | `/api/sessions/{id}/stop` | 종료 |
| GET | `/api/sessions/{id}/timeline?from&to&step` | 저장된 지표 조회 |
| POST | `/api/sessions/{id}/report` | 리포트 생성 |
| GET | `/api/sessions/{id}/report.pdf` | PDF 내보내기 |
| GET | `/api/sales-reps/{id}/progress` | 세션 간 지표 추이(말하기 비율, 질문 수, 독백, 눈맞춤) |

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
  "transcript": [{"slot": "A", "text": "...", "sentiment": 0.3, "is_question": true}],
  "key_moments": [{"ts": 12340.2, "topic": "가격", "customer_delta": -1.8}],
  "hints": [{"kind": "monologue", "detail": {"sec": 72}}],
  "devices": [{"device": "cam0", "status": "ok"}]
}
```

WebSocket 메시지는 코치 대시보드 전용이다. 고객이 볼 수 있는 화면으로 미러링하지 않는다(FR-014).
