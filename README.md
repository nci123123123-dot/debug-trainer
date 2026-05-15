# Debug Trainer

Java/Spring 실무 버그를 진단하고 수정하는 능력을 키우기 위한 학습 플랫폼.

## 개요

LeetCode/백준이 다루지 않는 실무 버그(JPA N+1, 트랜잭션 격리, 동시성, NPE 등)를
Docker 샌드박스 환경에서 채점하고, AI 해설과 SRS(간격 반복) 학습 루프로
디버깅 역량을 체계적으로 훈련한다.

## 주요 기능 (예정)

- Java/Spring 실무 버그 코드 풀이 (200문제 이상)
- Docker 샌드박스에서 JUnit 자동 채점
- Claude API 기반 AI 해설
- SM-2 알고리즘 SRS (간격 반복 학습)
- 일일 챌린지 (오늘의 3문제)
- 카테고리별 정답률 통계 대시보드

## 기술 스택

- Backend: Spring Boot 3.x + Java 21 + PostgreSQL 16 + Redis 7 + RabbitMQ
- Frontend: Next.js 15 + TypeScript + Tailwind + Monaco Editor
- Sandbox: Docker + Sysbox/gVisor
- AI: Anthropic Claude API
- 인증: GitHub OAuth 2.0
- 모니터링: Sentry + Prometheus + Grafana

자세한 내용은 [디자인 명세서](docs/superpowers/specs/2026-05-16-debug-trainer-design.md) 참고.

## 개발 방식

Claude Code와 페어 프로그래밍 모드로 개발한다.

- AI 담당: 스캐폴딩, 보일러플레이트, 인터페이스 설계, 코드 리뷰
- 본인 담당: 핵심 비즈니스 로직 (SRS 알고리즘, Docker 샌드박스 보안 설계,
  트랜잭션 격리, DB 스키마)
- 검증: AI 리뷰 후 본인이 수정 반영

## 상태

현재 단계: P1 (스캐폴딩, 디자인 검증)

## 라이선스

MIT
