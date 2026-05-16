# Docker 인프라

Phase 1에서는 파일만 작성한다. 실제 컨테이너 기동/이미지 빌드는 본인의 Docker Desktop
환경이 준비되면 P2 시작 전에 검증한다.

## 컴포넌트

| 서비스 | 이미지 | 포트 | 용도 |
|---|---|---|---|
| postgres | postgres:16-alpine | 5432 | 문제·사용자·제출·SRS 저장 |
| redis | redis:7-alpine | 6379 | 해설 캐시, 세션 |
| rabbitmq | rabbitmq:3.13-management-alpine | 5672, 15672(관리 UI) | 채점 작업 큐 |
| sandbox | eclipse-temurin:17-jdk-alpine 기반 커스텀 | n/a | Judge Worker용 격리 이미지 |

## 사전 준비 (P2 시작 전 본인이 처리)

1. **가상화 활성화**: 관리자 PowerShell에서
   ```powershell
   wsl --install
   ```
   → PC 재부팅 → Docker Desktop 실행 → 트레이 아이콘 초록색 확인.

2. **환경 변수 파일 생성**:
   ```powershell
   Copy-Item .env.example .env
   # 필요 시 .env의 비밀번호 수정
   ```

## 기동 명령

```powershell
cd C:\dev\debug-trainer\docker
docker compose up -d
docker compose ps   # 모두 running + healthy 확인
```

## 샌드박스 이미지 빌드

```powershell
cd C:\dev\debug-trainer
docker build -t debug-trainer-sandbox:jdk17 -f docker/sandbox/Dockerfile docker/sandbox/
docker run --rm debug-trainer-sandbox:jdk17   # "openjdk version ..." 출력 확인
```

## 보안 옵션 적용 실행 (검증)

```powershell
docker run --rm `
  --network=none `
  --memory=256m `
  --cpus=0.5 `
  --pids-limit=50 `
  --read-only `
  --tmpfs /tmp:size=100m,exec `
  --cap-drop=ALL `
  --security-opt=no-new-privileges `
  debug-trainer-sandbox:jdk17 `
  java -version
```

자세한 격리 설계는 [디자인 명세서 9장](../docs/superpowers/specs/2026-05-16-debug-trainer-design.md#9-보안-설계-judge-worker-핵심) 참고.
