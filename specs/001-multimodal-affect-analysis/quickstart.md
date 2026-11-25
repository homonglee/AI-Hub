# Quickstart: 대면 세일즈 미팅 멀티모달 코칭 분석

## 준비물
- RTX 4070 이상 GPU(VRAM 12GB+) 데스크톱, Ubuntu 22.04/24.04, CUDA 12 드라이버
- USB 카메라 2대(1080p 60fps, MJPEG 지원) — 메인보드 후면 USB 3 포트에 나눠 연결
- 확산형 LED 패널 2개(5600K, 화자 정면 상단 30~45°). 선택: 850nm 근적외선 보조 조명
- 핀마이크 2개 + 2채널 USB 오디오 인터페이스
- Docker, Python 3.11, Node.js 20

## 실행

```bash
docker compose -f deploy/docker-compose.yml up -d     # redis, timescaledb
cd backend && uv sync && uv run python -m affectlens.models.download
uv run python -m affectlens.orchestrator --config ../deploy/config.yaml
cd ../frontend && npm ci && npm run dev               # http://localhost:5173
```

## 검증 시나리오

0. **조명 점검**: 세션 준비 화면에서 조명 점검을 실행해 두 화자의 눈 영역 품질이 기준 이상인지 확인한다.
1. **US1**: 롤플레이 모드로 장치 할당 → 두 참여자 동의 → 시작. 3초 이내 지표가 표시되고, 고객 역할이 미소 지을 때 B의 AU12·valence가 상승하는지, 빠르게 말할 때 코치 화면에 발화 속도 힌트가 뜨는지 확인한다.
2. **동의 차단**: 동의 없이 시작 → `409 consent_required`, 실제 미팅 모드에서 고객 동의 없이 시작 → `409 customer_consent_required`를 확인한다.
3. **US2**: `uv run python -m affectlens.replay tests/fixtures/scripted_interrupt.mkv`로 재생 → 독백 경고, 끼어들기, 질문 수, 말할 때·들을 때 눈맞춤 비율이 대본과 일치하는지 확인한다.
4. **US3**: 기준선 90초 후 변화량 표시, 가격 언급 후 고객 반응 변화 시 핵심 순간 표시, 얼굴 가림 시 신뢰도 하락을 확인한다.
5. **US4**: 종료 → 코칭 리포트 30초 이내 생성, PDF 다운로드, 같은 영업 담당자 세션 3건 이상의 성장 추적 차트를 확인한다.
6. **장시간 부하**: 60분 세션 동안 `/api/system`의 VRAM 사용 10GB 이하, 프레임 드롭 1% 이하를 확인한다.
7. **SC-010**: 세션 종료 후 `find / -xdev -newer <세션시작기준파일> \( -name "*.mkv" -o -name "*.mp4" -o -name "*.wav" \)` 결과가 0건인지 확인한다.
