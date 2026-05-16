# Judge Worker

사용자 제출 코드를 Docker 샌드박스 환경에서 격리 실행하고, JUnit 채점 결과를 반환하는 컴포넌트.

Phase 2에서 본격 구현 예정. 현재는 디렉토리 골격만 존재.

## 책임

- RabbitMQ 채점 큐 컨슈머
- Docker 컨테이너 풀 관리 (사전 워밍업)
- 사용자 코드 + 테스트 코드 격리 실행
- 결과 큐로 발행

## 보안

자세한 격리 옵션은 [디자인 명세서 9장](../docs/superpowers/specs/2026-05-16-debug-trainer-design.md) 참고.
