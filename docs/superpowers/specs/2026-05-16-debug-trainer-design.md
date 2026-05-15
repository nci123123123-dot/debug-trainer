# Debug Trainer — 디자인 명세서

- 작성일: 2026-05-16
- 작성자: 남창인
- 상태: Draft (검토 대기)
- 다음 단계: 사용자 검토 후 구현 계획(implementation plan) 작성

---

## 1. 개요

Debug Trainer는 Java/Spring 실무 버그를 진단하고 수정하는 능력을 키우기 위한 학습 플랫폼이다. 사용자는 AI가 생성하고 운영자가 검수한 버그가 포함된 코드 스니펫을 받아 수정하고, Docker 샌드박스 환경에서 자동 채점을 받는다. 정답 후에는 AI가 생성한 해설을 통해 학습 효과를 극대화한다.

이 프로젝트의 1차 사용자는 작성자 본인이며, 동시에 금융권 개발자 채용을 위한 포트폴리오 역할을 한다.

## 2. 목적과 차별화

### 2.1 학습 측면

- 매일 켜게 만드는 학습 루프 (SRS 간격 반복 + 일일 챌린지) 제공
- LeetCode/백준이 다루지 않는 실무 버그(JPA N+1, 트랜잭션 격리, 동시성 등) 집중
- 정답 후 AI 해설로 "왜 이 버그가 위험한가" 즉시 학습

### 2.2 포트폴리오 측면

- Docker 샌드박스 보안 설계, SM-2 SRS 알고리즘 구현, 채점 파이프라인 등
  시스템 설계 어필 포인트 다수 확보
- AI 협업 워크플로우 자체가 README의 콘텐츠가 됨 (분담 모드 명시)

### 2.3 시장 차별화

- LeetCode/백준: 알고리즘 버그만 다룸. 실무 버그 부재
- HackerRank: 디버깅 문제 일부 존재하나 Java/Spring 실무 패턴 거의 없음
- Anki/Quizlet: 단순 카드 형식, 코드 실행 환경 없음

본 프로젝트는 "Java/Spring 실무 디버깅" + "SRS 학습 루프"의 교집합 시장을
점유한다.

## 3. 사용자 시나리오

### 시나리오 A: 일일 챌린지 (5분 학습)

1. 사용자가 사이트 접속 → 오늘의 챌린지 3문제 표시
2. 1문제 선택 → Monaco Editor에 버그 코드 로드
3. 사용자가 버그를 식별하고 수정 → 제출
4. 10초 이내에 채점 결과 표시 (PASS/FAIL/TIMEOUT/ERROR)
5. PASS 시 AI 해설 표시 → SRS 카드 업데이트 (다음 복습일 계산)

### 시나리오 B: 복습 큐 (10분 학습)

1. 사용자가 /review 진입 → SRS 알고리즘이 선정한 복습 대상 문제 N개
2. 이전에 풀었던 문제를 다시 풀이
3. 정답률에 따라 다음 복습 간격 조정

### 시나리오 C: 카테고리 학습 (30분 집중)

1. 사용자가 /problems 진입 → 카테고리(JPA·동시성·트랜잭션·NPE·컬렉션·Spring) 선택
2. 난이도 필터 적용 후 순차 풀이
3. 통계 대시보드에서 카테고리별 정답률 확인

## 4. 시스템 아키텍처

### 4.1 상위 구성

- 모듈러 모놀리스 백엔드 (Spring Boot 단일 애플리케이션, 내부 모듈 분리)
- Judge Worker 별도 컨테이너로 분리 (보안 격리)
- 메시지 큐(RabbitMQ)로 백엔드와 Judge Worker 비동기 통신
- Next.js 프론트엔드는 별도 배포 (Vercel)

### 4.2 컴포넌트 다이어그램

```
[Browser]
   |
   v (HTTPS)
[Next.js / Vercel]
   |
   v (REST + WebSocket)
[Spring Boot / Fly.io]
   |--- [PostgreSQL] (문제, 사용자, 제출, SRS)
   |--- [Redis] (세션, 해설 캐시, 일일챌린지)
   |--- [RabbitMQ] (채점 큐)
                 |
                 v
        [Judge Worker / 별도 컨테이너]
                 |
                 v
        [Docker Sandbox Pool (JDK 17, 격리됨)]
```

### 4.3 모듈러 모놀리스를 선택한 이유

- 1인 개발 환경에서 마이크로서비스는 운영 부담만 증가
- 단일 트랜잭션 보장으로 데이터 정합성 단순화
- Judge Worker만 분리한 이유는 보안 격리가 필수이기 때문 (사용자 임의 코드 실행)

## 5. 기술 스택

| 영역 | 선택 | 선택 이유 |
|---|---|---|
| Frontend | Next.js 15 + TypeScript + Tailwind | SSR로 SEO 확보, App Router로 라우팅 단순화 |
| Code Editor | Monaco Editor | VS Code 엔진, 코드 에디터 사실상 표준 |
| Backend | Spring Boot 3.x + Java 21 | 본인 메인 스택, 디버깅 대상 언어와 일치 |
| DB | PostgreSQL 16 | 시계열 집계 강력, JSONB로 유연한 메타데이터 |
| Cache | Redis 7 | 해설 캐시 (Claude API 비용 절감), 세션 |
| Message Queue | RabbitMQ | 채점 비동기 처리, Spring AMQP 안정성 |
| Sandbox | Docker + Sysbox 또는 gVisor | 사용자 코드 격리 실행 |
| 인증 | Spring Security + GitHub OAuth 2.0 | 개발자 타겟에 적합 |
| AI 통신 | Anthropic Claude API | 해설 생성, 운영자 도구로 문제 생성 |
| 모니터링 | Sentry + Prometheus + Grafana | 에러 추적 + 메트릭 |
| CI/CD | GitHub Actions | PR 빌드/테스트, Docker 이미지 푸시 |
| Frontend 배포 | Vercel | Next.js 최적화 호스팅 |
| Backend 배포 | Fly.io 또는 Railway | 컨테이너 기반, 저비용 |

## 6. 핵심 컴포넌트

### 6.1 백엔드 모듈

| 모듈 | 책임 |
|---|---|
| auth | GitHub OAuth 2.0, JWT 발급, 인가 |
| problem | 문제 CRUD, 카테고리, 태그, 난이도 |
| submission | 코드 제출 접수, 결과 저장, WebSocket 푸시 |
| judge | RabbitMQ 발행, Judge Worker 결과 수신 |
| srs | SM-2 알고리즘, 복습 큐 관리 |
| daily-challenge | 매일 KST 00:00에 3문제 선정 (Spring Scheduler) |
| explanation | Claude API 호출, Redis 캐싱 |
| stats | 시계열 집계, 카테고리별 정답률 |

### 6.2 프론트엔드 라우트

| 경로 | 설명 |
|---|---|
| / | 랜딩 + 오늘의 챌린지 |
| /problems | 문제 목록 (필터: 카테고리·난이도·상태) |
| /problems/[id] | 풀이 페이지 (Monaco + 결과 패널) |
| /review | SRS 복습 큐 |
| /dashboard | 통계 대시보드 (Recharts) |
| /auth/login | GitHub OAuth 진입 |

### 6.3 Judge Worker

- 별도 컨테이너로 분리 운영 (트래픽 증가 시 별도 호스트로 확장 가능)
- Spring AMQP 컨슈머로 채점 작업 수신
- 컨테이너 풀(pool) 5개 사전 워밍업하여 채점 지연 최소화
- 작업 처리:
  1. 사용자 코드 + 테스트 코드 수신
  2. Docker 컨테이너 spawn (격리 옵션 적용)
  3. javac 컴파일 (타임아웃 5초)
  4. JUnit 실행 (타임아웃 10초)
  5. stdout/stderr 캡처
  6. 결과를 결과 큐로 발행

## 7. 데이터 모델

### 7.1 핵심 테이블

```
User
  id           BIGINT PK
  github_id    VARCHAR UNIQUE
  username     VARCHAR
  created_at   TIMESTAMP

Problem
  id                BIGINT PK
  title             VARCHAR
  description       TEXT
  category          VARCHAR  -- JPA / CONCURRENCY / TRANSACTION / NPE / COLLECTION / SPRING
  difficulty        SMALLINT -- 1-5
  buggy_code        TEXT
  test_code         TEXT
  explanation_seed  TEXT     -- Claude에 전달할 컨텍스트 (운영자 작성)
  tags              JSONB
  created_at        TIMESTAMP

Submission
  id            BIGINT PK
  user_id       BIGINT FK
  problem_id    BIGINT FK
  code          TEXT
  status        VARCHAR  -- PENDING / PASS / FAIL / TIMEOUT / COMPILE_ERROR / RUNTIME_ERROR
  test_output   TEXT
  duration_ms   INTEGER
  submitted_at  TIMESTAMP

SrsCard
  user_id          BIGINT
  problem_id       BIGINT
  repetition       INTEGER DEFAULT 0
  ease_factor      NUMERIC DEFAULT 2.5
  interval_days    INTEGER DEFAULT 1
  next_review_at   TIMESTAMP
  last_reviewed_at TIMESTAMP
  PRIMARY KEY (user_id, problem_id)

DailyChallenge
  date         DATE PK
  problem_ids  JSONB  -- [pid1, pid2, pid3]
  created_at   TIMESTAMP

ExplanationCache
  problem_id    BIGINT PK
  content       TEXT
  model         VARCHAR  -- claude-opus-4-7 등
  generated_at  TIMESTAMP
```

### 7.2 인덱스 전략

- `Submission(user_id, submitted_at DESC)` — 사용자 최근 제출 조회
- `Submission(problem_id, status)` — 문제별 정답률 집계
- `SrsCard(user_id, next_review_at)` — 복습 큐 조회
- `Problem(category, difficulty)` — 필터링

### 7.3 통계 집계 전략

- 실시간 정답률은 Redis 카운터 + 주기적 Postgres 동기화
- 일별 누적 그래프는 materialized view (1시간 단위 새로고침)

## 8. 데이터 플로우

### 8.1 제출 처리

```
1. 프론트 → POST /api/submissions { problem_id, code }
2. Spring (submission 모듈)
   a. Submission INSERT (status = PENDING)
   b. RabbitMQ 작업 큐로 메시지 발행 { submission_id, problem_id, code }
   c. 클라이언트에 submission_id 반환 (HTTP 202 Accepted)
3. 프론트 → WebSocket으로 submission_id 구독 (결과 대기)
4. Judge Worker
   a. RabbitMQ에서 메시지 수신
   b. Docker 컨테이너 풀에서 워커 1개 할당
   c. 사용자 코드 + test_code 컨테이너 내부에 전송
   d. javac → JUnit 실행
   e. 결과 큐로 발행 { submission_id, status, output, duration_ms }
5. Spring (judge 모듈)
   a. 결과 큐 컨슈머가 결과 수신
   b. Submission UPDATE
   c. WebSocket으로 프론트에 푸시
   d. PASS 시 SrsCard 업데이트 (다음 복습일 SM-2 계산)
   e. 해설 캐시 조회, 미스면 Claude API 호출 후 캐시 저장
6. 프론트
   a. WebSocket으로 결과 수신 → 결과 표시
   b. PASS면 해설 영역 fetch → 표시
```

### 8.2 SM-2 알고리즘 (SRS 핵심)

정답률에 따라 다음 복습 간격을 계산한다.

```
quality: 0(완전 실패) ~ 5(완벽)
   - PASS 1회 시도: quality = 5
   - PASS 2-3회 시도: quality = 4
   - PASS 4회 이상: quality = 3
   - FAIL 후 PASS: quality = 2
   - 시간 초과 PASS: quality = 1

if quality < 3:
  repetition = 0
  interval_days = 1
else:
  if repetition == 0: interval_days = 1
  elif repetition == 1: interval_days = 6
  else: interval_days = round(interval_days * ease_factor)
  repetition += 1

ease_factor = max(1.3, ease_factor + (0.1 - (5-quality) * (0.08 + (5-quality)*0.02)))
next_review_at = now() + interval_days days
```

## 9. 보안 설계 (Judge Worker 핵심)

### 9.1 컨테이너 격리 옵션

```
docker run \
  --network=none \                  # 네트워크 차단
  --read-only \                     # 루트 파일시스템 읽기 전용
  --tmpfs /tmp:size=100m,exec \     # tmpfs만 쓰기 허용
  --cap-drop=ALL \                  # 모든 capability 제거
  --security-opt=no-new-privileges \
  --user=nobody:nogroup \
  --memory=256m \
  --memory-swap=256m \
  --cpus=0.5 \
  --pids-limit=50 \
  --ulimit nofile=64:64 \
  java-sandbox:jdk17
```

### 9.2 추가 격리 (선택)

- Sysbox: Docker-in-Docker 격리 (rootless)
- gVisor: 사용자 공간 커널로 syscall 차단

### 9.3 입력 검증

- 코드 길이: 최대 50KB
- 금지 패턴 사전 차단 (Runtime.exec, ProcessBuilder, JNI 로드 등)
  주의: 우회 가능하므로 컨테이너 격리가 1차 방어선

### 9.4 출력 sanitize

- 컨테이너 stdout/stderr를 화이트리스트로 필터링 후 사용자에 노출
- 호스트 경로, 환경 변수 등 노출 방지

### 9.5 타임아웃

- 컴파일 5초
- 실행 10초
- 결과 수집 + 정리 5초
- 총 20초 초과 시 강제 종료

## 10. 단계적 출시 일정

전체 10주, 단계별 출시.

| Phase | 기간 | 산출물 | AI 비중 | 본인 학습 포인트 |
|---|---|---|---|---|
| P1 | W1-2 | 스캐폴딩, 의존성, CI/CD, Docker 기본 | 80% | 프로젝트 구조 익히기 |
| P2 | W3-5 | problem·submission 도메인 + Judge Worker 기본 + 풀이 페이지 (v0.1) | 30% | 도메인 모델링, 보안 설계 |
| P3 | W6-7 | Claude 해설 + Redis 캐싱 + GitHub OAuth (v0.2) | 50% | 외부 API 통합, 캐싱 전략 |
| P4 | W8-9 | SM-2 SRS + 복습 큐 + 일일 챌린지 (v0.3) | 20% | 알고리즘 구현 |
| P5 | W10 | 통계 대시보드 + 배포 + 모니터링 (v1.0) | 60% | 시계열 쿼리, 운영 |
| P6 | 지속 | 문제 콘텐츠 200개 제작 | 90% | 도메인 지식 축적 |

### 분담 모드 (페어 프로그래밍)

AI 담당:
- 스캐폴딩 (폴더 구조, 의존성, CI 설정)
- 인터페이스/시그니처 설계
- 보일러플레이트 코드
- 코드 리뷰
- 막히는 부분 가이드

본인 담당:
- 핵심 비즈니스 로직 (SRS, 채점 로직)
- Docker 샌드박스 보안 설계
- DB 스키마 구체화
- API 컨트롤러
- 의사결정 기록 (ADR)

면접 어필 포인트: "Claude Code를 페어로 활용했으나, SRS 알고리즘·샌드박스 보안·트랜잭션 격리 같은 핵심은 직접 설계했습니다."

## 11. 테스트 전략

### 11.1 커버리지 목표

전체 80% 이상 (라인 + 분기).

### 11.2 테스트 종류

| 종류 | 도구 | 대상 |
|---|---|---|
| 단위 | JUnit 5 + Mockito | 서비스 로직, SRS 알고리즘 (특히 quality→interval 매핑) |
| 통합 | Testcontainers | Postgres + Redis + RabbitMQ 포함 시나리오 |
| E2E | Playwright | 제출→채점→해설 풀 시나리오 |
| 부하 | k6 | 동시 채점 100건, 평균 응답 3초 이하 |
| 보안 | 자체 슈트 | 악성 코드 샘플 30개로 샌드박스 탈출 시도 |

### 11.3 보안 테스트 샘플

다음 카테고리의 악성 코드 샘플로 샌드박스 검증:
- 무한루프, 메모리 폭탄, 포크 폭탄
- 네트워크 호출 시도 (HTTP, DNS, raw socket)
- 파일시스템 쓰기 시도 (/, /etc, /proc)
- Runtime.exec, ProcessBuilder
- 시스템 종료 시도 (System.exit)

## 12. 모니터링 / 운영

### 12.1 메트릭

- 채점 처리량 (submissions per second)
- 채점 평균 시간 (p50, p95, p99)
- 큐 길이 (RabbitMQ)
- Claude API 호출 수 + 캐시 히트율
- 에러율 (Sentry)

### 12.2 알람

- Judge Worker 큐 길이 > 50 → Slack 웹훅
- 채점 p95 응답 > 15초 → Slack 웹훅
- 5xx 에러율 > 1% → Slack 웹훅

### 12.3 로그

- 구조화 로그 (JSON), Spring Boot Logback + Logstash encoder
- 보안 이벤트는 별도 로그 토픽 (악성 코드 탐지, 컨테이너 강제 종료)

## 13. 비기능 요구사항

| 항목 | 목표 |
|---|---|
| 채점 응답 시간 | p95 < 10초 |
| 사용자 동시 접속 | 100명 (MVP), 1000명 (v2) |
| 가용성 | 99% (월 ~7시간 다운 허용) |
| AI 해설 비용 | 월 50 USD 이하 (캐시 적극 활용) |
| 회복 시간 (RTO) | 30분 |
| 데이터 백업 | 일 1회 Postgres dump → 외부 스토리지 |

## 14. 미정 사항 / 추후 결정

- 컨테이너 오케스트레이션: 초기는 단일 호스트, v2에서 K8s 도입 검토
- 결제: MVP에는 없음. 무료 운영
- 다국어: 한국어만. v2에서 일본어 추가 검토 (사용자 N1 보유)
- 일본어 진출 시 일본 금융권 도메인 예제 추가 가능

## 15. 부록

### 15.1 핵심 의존성 (예정)

Backend:
- spring-boot-starter-web, security, data-jpa, validation, amqp, websocket, actuator
- spring-cloud-starter-vault (Claude API key 관리, 선택)
- com.fasterxml.jackson.module:jackson-module-kotlin (필요 시)
- org.testcontainers:postgresql, rabbitmq, junit-jupiter
- io.sentry:sentry-spring-boot-starter
- io.micrometer:micrometer-registry-prometheus

Frontend:
- next, react, react-dom, typescript
- @monaco-editor/react
- tailwindcss
- recharts
- @tanstack/react-query

### 15.2 디렉토리 구조 (예정)

```
debug-trainer/
├── backend/                     # Spring Boot
│   ├── src/main/java/com/debugtrainer/
│   │   ├── auth/
│   │   ├── problem/
│   │   ├── submission/
│   │   ├── judge/
│   │   ├── srs/
│   │   ├── dailychallenge/
│   │   ├── explanation/
│   │   ├── stats/
│   │   └── common/
│   └── src/test/...
├── frontend/                    # Next.js
│   ├── app/
│   ├── components/
│   └── lib/
├── judge-worker/                # Docker 컨테이너 관리 워커
├── docs/
│   ├── superpowers/specs/
│   ├── adr/                     # Architecture Decision Records
│   └── runbook/
├── scripts/
│   └── generate-problems.ts     # Claude로 문제 생성
└── docker/
    ├── sandbox/Dockerfile       # JDK 17 샌드박스 이미지
    └── docker-compose.yml
```

### 15.3 ADR (Architecture Decision Record) 작성 항목

P1 단계에 다음 ADR을 작성한다.

1. 모듈러 모놀리스 선택 이유
2. Judge Worker 분리 이유
3. RabbitMQ vs Kafka 선택 이유
4. Postgres vs MongoDB 선택 이유
5. SM-2 알고리즘 선택 이유
6. Next.js App Router 선택 이유

---

## 변경 이력

| 일자 | 작성자 | 변경 |
|---|---|---|
| 2026-05-16 | 남창인 | 초안 작성 |
