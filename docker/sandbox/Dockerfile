# Judge Worker가 사용자 코드 실행 시 사용하는 격리 이미지
# 보안: 최소 권한, 네트워크 없음 (런타임에 --network=none 적용)

FROM eclipse-temurin:17-jdk-alpine

# 비루트 사용자 생성
RUN addgroup -S sandbox && adduser -S -G sandbox sandbox

# 작업 디렉토리 (tmpfs로 마운트 예정)
WORKDIR /workspace

# JUnit 5 콘솔 (오프라인 실행을 위해 미리 다운로드)
# Phase 2에서 채점 실행 스크립트와 함께 사용
RUN mkdir -p /opt/junit && \
    wget -O /opt/junit/junit-platform-console-standalone.jar \
      https://repo1.maven.org/maven2/org/junit/platform/junit-platform-console-standalone/1.11.3/junit-platform-console-standalone-1.11.3.jar

USER sandbox

# 실제 실행은 docker run 시 --entrypoint으로 덮어쓰기
CMD ["java", "-version"]
