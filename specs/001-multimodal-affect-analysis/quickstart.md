# Quickstart: 대면 1:1 대화 멀티모달 감정 분석

## 준비물
- Ubuntu 22.04/24.04, NVIDIA GPU(VRAM 12GB+), CUDA 12 드라이버
- USB 카메라 2대(1080p 60fps), 핀마이크 2개 + 2채널 오디오 인터페이스
- Docker, Python 3.11, Node.js 20

## 실행

```bash
docker compose -f deploy/docker-compose.yml up -d     # redis, timescaledb
cd backend && uv sync && uv run python -m affectlens.models.download
uv run python -m affectlens.orchestrator              # 분석기 + API 기동
cd ../frontend && npm ci && npm run dev               # http://localhost:5173
```

## 검증 시나리오

1. **US1**: 장치 할당 → 두 참여자 동의 → 시작. 3초 이내 두 화자 지표가 표시되고, 미소 시 A의 AU12·valence가 상승하는지 확인한다.
2. **동의 차단**: 동의 없이 시작 → `409 consent_required` 표시를 확인한다.
3. **US2**: `uv run python -m affectlens.replay tests/fixtures/scripted_interrupt.mkv`로 재생 → 끼어들기 카운트와 상호 응시 구간이 대본과 일치하는지 확인한다.
4. **US3**: 기준선 90초 후 변화량(delta) 표시와, 얼굴 가림 시 신뢰도 하락을 확인한다.
5. **US4**: 종료 → 리포트 생성 30초 이내, PDF 다운로드를 확인한다.
6. **SC-008**: 세션 종료 후 `find / -xdev -newer <세션시작기준파일> \( -name "*.mkv" -o -name "*.mp4" -o -name "*.wav" \)` 결과가 0건인지 확인한다.
