# Phase 1: Foundation & Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프로젝트 골격(백엔드/프론트/judge-worker)을 세우고 CI/CD + Docker Compose 환경을 구축하여 헬스체크가 동작하는 상태로 만든다.

**Architecture:** 모듈러 모놀리스 Spring Boot 백엔드 + Next.js 프론트엔드 + 별도 judge-worker 컨테이너. Phase 1은 디렉토리 구조와 의존성, 빌드 파이프라인만 잡는다. 핵심 비즈니스 로직은 Phase 2부터.

**Tech Stack:** Spring Boot 3.3.x, Java 21, Gradle 8.x, Next.js 15, TypeScript, Tailwind 3.x, Docker, GitHub Actions.

**분담 모드 (페어 프로그래밍):**
- Phase 1은 스캐폴딩 중심 (AI 80% / 본인 20%)
- 본인은 ADR(3개) 작성 + 각 task 끝날 때 코드 이해도 체크 (자신에게 "왜 이렇게 짰지?" 설명할 수 있어야 함)

---

## File Structure

```
debug-trainer/
├── backend/                                    # Spring Boot 모듈러 모놀리스
│   ├── build.gradle
│   ├── settings.gradle
│   ├── gradle.properties
│   ├── src/main/java/com/debugtrainer/
│   │   ├── DebugTrainerApplication.java        # 부트 진입점
│   │   └── common/health/
│   │       └── HealthController.java           # GET /api/health
│   ├── src/main/resources/
│   │   └── application.yml
│   └── src/test/java/com/debugtrainer/
│       └── common/health/
│           └── HealthControllerTest.java       # health 통합 테스트
│
├── frontend/                                   # Next.js 15 App Router
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                            # 랜딩 (placeholder)
│   │   └── globals.css
│   └── __tests__/
│       └── page.test.tsx
│
├── judge-worker/                               # P2부터 본격 구현, 지금은 골격만
│   └── README.md                               # 향후 책임 명시
│
├── docker/
│   ├── docker-compose.yml                      # postgres + redis + rabbitmq
│   └── sandbox/
│       └── Dockerfile                          # JDK 17 샌드박스 이미지 (P2에서 사용)
│
├── docs/
│   ├── superpowers/
│   │   ├── specs/2026-05-16-debug-trainer-design.md
│   │   └── plans/2026-05-16-phase1-scaffolding.md  # (this file)
│   └── adr/
│       ├── 0001-modular-monolith.md            # 본인 작성
│       ├── 0002-judge-worker-isolation.md      # 본인 작성
│       └── 0003-rabbitmq-vs-kafka.md           # 본인 작성
│
├── .github/workflows/
│   ├── backend-ci.yml
│   └── frontend-ci.yml
│
├── .gitignore                                  # 이미 작성됨
├── README.md                                   # P1 완료 시 업데이트
└── docs/                                       # 위와 동일 (중복 제거)
```

---

## Task 1: 루트 디렉토리 골격 생성

**Files:**
- Create: `backend/`, `frontend/`, `judge-worker/`, `docker/`, `docker/sandbox/`, `docs/adr/`, `.github/workflows/`

- [ ] **Step 1: 디렉토리 일괄 생성**

PowerShell:
```powershell
$root = "C:\Users\남창인\projects\debug-trainer"
@(
  "backend\src\main\java\com\debugtrainer\common\health",
  "backend\src\main\resources",
  "backend\src\test\java\com\debugtrainer\common\health",
  "frontend\app",
  "frontend\__tests__",
  "judge-worker",
  "docker\sandbox",
  "docs\adr",
  ".github\workflows"
) | ForEach-Object { New-Item -ItemType Directory -Force "$root\$_" | Out-Null }
Get-ChildItem $root -Directory
```
Expected output: `backend`, `frontend`, `judge-worker`, `docker`, `docs`, `.github` 디렉토리가 표시되어야 함.

- [ ] **Step 2: judge-worker placeholder README 작성**

Create: `judge-worker/README.md`
```markdown
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
```

- [ ] **Step 3: 커밋**

```powershell
git -C "C:\Users\남창인\projects\debug-trainer" add .
git -C "C:\Users\남창인\projects\debug-trainer" commit -m "chore: 프로젝트 디렉토리 골격 생성"
```

---

## Task 2: 백엔드 Gradle 빌드 설정

**Files:**
- Create: `backend/settings.gradle`
- Create: `backend/build.gradle`
- Create: `backend/gradle.properties`

- [ ] **Step 1: settings.gradle 작성**

Create: `backend/settings.gradle`
```groovy
rootProject.name = 'debug-trainer-backend'
```

- [ ] **Step 2: gradle.properties 작성**

Create: `backend/gradle.properties`
```properties
org.gradle.jvmargs=-Xmx2g -Dfile.encoding=UTF-8
org.gradle.caching=true
org.gradle.parallel=true
```

- [ ] **Step 3: build.gradle 작성**

Create: `backend/build.gradle`
```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.3.5'
    id 'io.spring.dependency-management' version '1.1.6'
    id 'jacoco'
}

group = 'com.debugtrainer'
version = '0.1.0-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Web
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'

    // Test
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

tasks.named('test') {
    useJUnitPlatform()
    finalizedBy jacocoTestReport
}

jacocoTestReport {
    dependsOn test
    reports {
        xml.required = true
        html.required = true
    }
}

jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = 0.80
            }
        }
    }
}
```

- [ ] **Step 4: Gradle Wrapper 생성**

PowerShell:
```powershell
cd "C:\Users\남창인\projects\debug-trainer\backend"
gradle wrapper --gradle-version 8.10
```
Expected: `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar`, `gradle/wrapper/gradle-wrapper.properties` 생성.

만약 시스템에 `gradle` 명령 없으면: `winget install Gradle.Gradle` 또는 SDKMAN 설치 후 재시도.

- [ ] **Step 5: 빌드 확인**

```powershell
cd "C:\Users\남창인\projects\debug-trainer\backend"
.\gradlew.bat build -x test
```
Expected: `BUILD SUCCESSFUL` 메시지. (테스트는 아직 없으므로 -x test로 건너뜀)

- [ ] **Step 6: 커밋**

```powershell
git -C "C:\Users\남창인\projects\debug-trainer" add backend/
git -C "C:\Users\남창인\projects\debug-trainer" commit -m "build(backend): Spring Boot 3.3 + Java 21 + Jacoco 80% 커버리지 설정"
```

---

## Task 3: 백엔드 Application + Health Endpoint (TDD)

**Files:**
- Create: `backend/src/main/java/com/debugtrainer/DebugTrainerApplication.java`
- Create: `backend/src/main/resources/application.yml`
- Test: `backend/src/test/java/com/debugtrainer/common/health/HealthControllerTest.java`
- Create: `backend/src/main/java/com/debugtrainer/common/health/HealthController.java`

- [ ] **Step 1: 실패 테스트 작성 (RED)**

Create: `backend/src/test/java/com/debugtrainer/common/health/HealthControllerTest.java`
```java
package com.debugtrainer.common.health;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getHealth_returnsOkAndStatusUp() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("debug-trainer-backend"));
    }
}
```

- [ ] **Step 2: application.yml 작성**

Create: `backend/src/main/resources/application.yml`
```yaml
spring:
  application:
    name: debug-trainer-backend
server:
  port: 8080
management:
  endpoints:
    web:
      exposure:
        include: health, info, prometheus
```

- [ ] **Step 3: Application 클래스 작성**

Create: `backend/src/main/java/com/debugtrainer/DebugTrainerApplication.java`
```java
package com.debugtrainer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DebugTrainerApplication {
    public static void main(String[] args) {
        SpringApplication.run(DebugTrainerApplication.class, args);
    }
}
```

- [ ] **Step 4: 테스트 실패 확인**

```powershell
cd "C:\Users\남창인\projects\debug-trainer\backend"
.\gradlew.bat test --tests "com.debugtrainer.common.health.HealthControllerTest"
```
Expected: FAILURE — 404 Not Found (컨트롤러 아직 없음)

- [ ] **Step 5: HealthController 구현 (GREEN)**

Create: `backend/src/main/java/com/debugtrainer/common/health/HealthController.java`
```java
package com.debugtrainer.common.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public Map<String, String> health() {
        return Map.of(
                "status", "UP",
                "service", "debug-trainer-backend"
        );
    }
}
```

- [ ] **Step 6: 테스트 통과 확인**

```powershell
.\gradlew.bat test --tests "com.debugtrainer.common.health.HealthControllerTest"
```
Expected: BUILD SUCCESSFUL, 1 test passed.

- [ ] **Step 7: 부트 실행 확인 (수동)**

```powershell
.\gradlew.bat bootRun
```
별도 터미널에서:
```powershell
curl http://localhost:8080/api/health
```
Expected: `{"status":"UP","service":"debug-trainer-backend"}`

확인 후 bootRun은 Ctrl+C로 종료.

- [ ] **Step 8: 커밋**

```powershell
git -C "C:\Users\남창인\projects\debug-trainer" add backend/
git -C "C:\Users\남창인\projects\debug-trainer" commit -m "feat(backend): /api/health 엔드포인트 추가 + 통합 테스트"
```

---

## Task 4: 프론트엔드 Next.js 초기화

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.mjs`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/postcss.config.mjs`
- Create: `frontend/app/layout.tsx`
- Create: `frontend/app/page.tsx`
- Create: `frontend/app/globals.css`

- [ ] **Step 1: package.json 작성**

Create: `frontend/package.json`
```json
{
  "name": "debug-trainer-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest"
  },
  "dependencies": {
    "next": "15.0.3",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9",
    "eslint-config-next": "15.0.3",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 2: tsconfig.json 작성**

Create: `frontend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Next/Tailwind/PostCSS 설정**

Create: `frontend/next.config.mjs`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
```

Create: `frontend/tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

Create: `frontend/postcss.config.mjs`
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 4: 기본 페이지 + 레이아웃**

Create: `frontend/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Create: `frontend/app/layout.tsx`
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Debug Trainer',
  description: 'Java/Spring 실무 버그 디버깅 학습 플랫폼',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

Create: `frontend/app/page.tsx`
```tsx
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold">Debug Trainer</h1>
      <p className="mt-4 text-lg text-gray-600">
        Java/Spring 실무 버그 디버깅 학습 플랫폼 (Phase 1)
      </p>
    </main>
  );
}
```

- [ ] **Step 5: 의존성 설치**

```powershell
cd "C:\Users\남창인\projects\debug-trainer\frontend"
npm install
```
Expected: `node_modules` 생성, `package-lock.json` 생성, 에러 없음.

- [ ] **Step 6: 빌드 확인**

```powershell
npm run build
```
Expected: `.next/` 생성. 빌드 성공.

- [ ] **Step 7: 커밋**

```powershell
git -C "C:\Users\남창인\projects\debug-trainer" add frontend/
git -C "C:\Users\남창인\projects\debug-trainer" commit -m "feat(frontend): Next.js 15 + Tailwind + 랜딩 페이지 초기화"
```

---

## Task 5: 프론트엔드 첫 테스트 (Jest + Testing Library)

**Files:**
- Create: `frontend/jest.config.mjs`
- Create: `frontend/jest.setup.ts`
- Create: `frontend/__tests__/page.test.tsx`

- [ ] **Step 1: Jest 설정**

Create: `frontend/jest.config.mjs`
```javascript
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  setupFilesAfterEach: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default createJestConfig(customJestConfig);
```

Create: `frontend/jest.setup.ts`
```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 2: 실패 테스트 작성 (RED)**

Create: `frontend/__tests__/page.test.tsx`
```tsx
import { render, screen } from '@testing-library/react';
import HomePage from '../app/page';

describe('HomePage', () => {
  it('렌더링 시 "Debug Trainer" 타이틀이 보인다', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1, name: /Debug Trainer/i }))
      .toBeInTheDocument();
  });

  it('Phase 1 안내 문구가 보인다', () => {
    render(<HomePage />);
    expect(screen.getByText(/Phase 1/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: 테스트 실행 확인**

```powershell
cd "C:\Users\남창인\projects\debug-trainer\frontend"
npm test
```
Expected: 2 tests passed. (Task 4의 page.tsx 내용이 위 테스트 기대값과 이미 일치하므로 처음부터 GREEN. 이는 의도된 것 — Task 4와 5가 짝이지만 step 단위로 검증 가능하게 분리)

- [ ] **Step 4: 커밋**

```powershell
git -C "C:\Users\남창인\projects\debug-trainer" add frontend/
git -C "C:\Users\남창인\projects\debug-trainer" commit -m "test(frontend): HomePage 렌더링 테스트 추가 (Jest + RTL)"
```

---

## Task 6: Docker Compose — Postgres / Redis / RabbitMQ

**Files:**
- Create: `docker/docker-compose.yml`
- Create: `docker/.env.example`

- [ ] **Step 1: docker-compose.yml 작성**

Create: `docker/docker-compose.yml`
```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: debug-trainer-postgres
    environment:
      POSTGRES_DB: debugtrainer
      POSTGRES_USER: ${POSTGRES_USER:-debugtrainer}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-debugtrainer}"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: debug-trainer-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: ["redis-server", "--appendonly", "yes"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    container_name: debug-trainer-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:-debugtrainer}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD:-changeme}
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

- [ ] **Step 2: .env.example 작성**

Create: `docker/.env.example`
```dotenv
POSTGRES_USER=debugtrainer
POSTGRES_PASSWORD=changeme
RABBITMQ_USER=debugtrainer
RABBITMQ_PASSWORD=changeme
```

`.env` 파일은 본인이 별도로 생성 (실제 비밀번호로). `.gitignore`에 이미 `.env` 차단되어 있음.

- [ ] **Step 3: 컨테이너 기동 확인**

PowerShell (Docker Desktop 실행 중이어야 함):
```powershell
cd "C:\Users\남창인\projects\debug-trainer\docker"
Copy-Item .env.example .env
docker compose up -d
docker compose ps
```
Expected: 3개 서비스 모두 `running` + `healthy` 상태로 표시.

확인 후:
```powershell
docker compose down
```

- [ ] **Step 4: 커밋**

```powershell
git -C "C:\Users\남창인\projects\debug-trainer" add docker/
git -C "C:\Users\남창인\projects\debug-trainer" commit -m "infra(docker): Postgres + Redis + RabbitMQ Compose 설정 추가"
```

---

## Task 7: JDK 17 샌드박스 Docker 이미지 (P2 사용 준비)

**Files:**
- Create: `docker/sandbox/Dockerfile`

- [ ] **Step 1: Dockerfile 작성**

Create: `docker/sandbox/Dockerfile`
```dockerfile
# Judge Worker가 사용자 코드 실행 시 사용하는 격리 이미지
# 보안: 최소 권한, 네트워크 없음 (런타임에 --network=none 적용)

FROM eclipse-temurin:17-jdk-alpine

# 비루트 사용자 생성
RUN addgroup -S sandbox && adduser -S -G sandbox sandbox

# 작업 디렉토리 (tmpfs로 마운트 예정)
WORKDIR /workspace

# JUnit 5 + Hamcrest 의존성 (오프라인 실행을 위해 미리 다운로드)
# Phase 2에서 채점 실행 스크립트와 함께 사용
RUN mkdir -p /opt/junit && \
    wget -O /opt/junit/junit-platform-console-standalone.jar \
      https://repo1.maven.org/maven2/org/junit/platform/junit-platform-console-standalone/1.11.3/junit-platform-console-standalone-1.11.3.jar

USER sandbox

# 실제 실행은 docker run 시 --entrypoint으로 덮어쓰기
CMD ["java", "-version"]
```

- [ ] **Step 2: 이미지 빌드 확인**

```powershell
cd "C:\Users\남창인\projects\debug-trainer"
docker build -t debug-trainer-sandbox:jdk17 -f docker/sandbox/Dockerfile docker/sandbox/
docker run --rm debug-trainer-sandbox:jdk17
```
Expected: `openjdk version "17..."` 출력.

- [ ] **Step 3: 보안 옵션 적용 실행 확인**

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
Expected: 정상 출력. (보안 옵션이 자바 실행 자체에는 영향 없음을 확인)

- [ ] **Step 4: 커밋**

```powershell
git -C "C:\Users\남창인\projects\debug-trainer" add docker/sandbox/
git -C "C:\Users\남창인\projects\debug-trainer" commit -m "infra(sandbox): JDK 17 격리 이미지 + JUnit 콘솔 추가"
```

---

## Task 8: GitHub Actions — 백엔드 CI

**Files:**
- Create: `.github/workflows/backend-ci.yml`

- [ ] **Step 1: 워크플로 작성**

Create: `.github/workflows/backend-ci.yml`
```yaml
name: backend-ci

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/backend-ci.yml'
  pull_request:
    paths:
      - 'backend/**'
      - '.github/workflows/backend-ci.yml'

jobs:
  build-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'

      - name: Cache Gradle packages
        uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
          restore-keys: ${{ runner.os }}-gradle-

      - name: Grant execute permission for gradlew
        run: chmod +x ./gradlew

      - name: Build and test
        run: ./gradlew clean build

      - name: Upload Jacoco report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: jacoco-report
          path: backend/build/reports/jacoco/test/
```

- [ ] **Step 2: 푸시 후 CI 통과 확인**

```powershell
git -C "C:\Users\남창인\projects\debug-trainer" add .github/workflows/backend-ci.yml
git -C "C:\Users\남창인\projects\debug-trainer" commit -m "ci(backend): GitHub Actions 백엔드 빌드+테스트 워크플로"
git -C "C:\Users\남창인\projects\debug-trainer" push
gh run watch
```
Expected: 워크플로가 success로 완료. (Actions 탭에서도 확인 가능)

---

## Task 9: GitHub Actions — 프론트엔드 CI

**Files:**
- Create: `.github/workflows/frontend-ci.yml`

- [ ] **Step 1: 워크플로 작성**

Create: `.github/workflows/frontend-ci.yml`
```yaml
name: frontend-ci

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-ci.yml'
  pull_request:
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-ci.yml'

jobs:
  build-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test -- --ci

      - name: Build
        run: npm run build
```

- [ ] **Step 2: 푸시 후 CI 통과 확인**

```powershell
git -C "C:\Users\남창인\projects\debug-trainer" add .github/workflows/frontend-ci.yml
git -C "C:\Users\남창인\projects\debug-trainer" commit -m "ci(frontend): GitHub Actions 프론트엔드 lint+test+build 워크플로"
git -C "C:\Users\남창인\projects\debug-trainer" push
gh run watch
```
Expected: 워크플로 success.

---

## Task 10: ADR-001 모듈러 모놀리스 선택 이유 (본인 작성)

**Files:**
- Create: `docs/adr/0001-modular-monolith.md`

이 task는 **본인이 직접 작성**한다. AI가 초안을 제시하지 않는다. 페어 프로그래밍 모드 B의 핵심: 의사결정 근거를 본인 언어로 정리하는 것이 면접 임팩트의 70%.

- [ ] **Step 1: ADR 템플릿 채우기 (본인 작성)**

Create: `docs/adr/0001-modular-monolith.md`

다음 항목을 본인이 답하면서 작성:
- **상태**: Accepted (2026-05-16)
- **컨텍스트**: 1인 개발 + 9개월 일정 + 학습 목적이라는 제약 조건 명시
- **결정**: 모듈러 모놀리스 채택
- **고려한 대안**: (1) MSA, (2) 단순 모놀리스, (3) 모듈러 모놀리스
- **각 대안의 trade-off**: 운영 부담, 개발 속도, 학습 가치, 면접 어필 측면에서 비교
- **결과**: 왜 모듈러 모놀리스가 가장 적합한가
- **부작용 / 감수할 위험**: 모듈 간 경계가 흐려질 수 있음 → 패키지 컨벤션으로 방어

분량 권장: 200~400자.

면접 질문 대비 셀프 점검:
- "왜 마이크로서비스 안 썼어요?" 30초 안에 답할 수 있어야 함.
- "모듈러 모놀리스에서 모듈 경계 어떻게 강제했어요?" 답 준비 (예: ArchUnit 도입 검토).

- [ ] **Step 2: 커밋**

```powershell
git -C "C:\Users\남창인\projects\debug-trainer" add docs/adr/0001-modular-monolith.md
git -C "C:\Users\남창인\projects\debug-trainer" commit -m "docs(adr): 0001 모듈러 모놀리스 선택 이유"
```

---

## Task 11: ADR-002 Judge Worker 분리 이유 (본인 작성)

**Files:**
- Create: `docs/adr/0002-judge-worker-isolation.md`

이 task도 **본인이 직접 작성**한다. 보안 관련 의사결정 = 금융권 면접 핵심.

- [ ] **Step 1: ADR 작성 (본인 작성)**

다음 항목을 답하면서 작성:
- **상태**: Accepted (2026-05-16)
- **컨텍스트**: 사용자가 임의 Java 코드를 서버에서 실행해야 함. 보안 위험 종류 (RCE, DoS, 데이터 탈취) 나열
- **결정**: Judge Worker를 백엔드 본체와 분리된 컨테이너로 운영하고, 코드 실행은 추가로 격리 Docker 컨테이너에서 수행 (이중 격리)
- **고려한 대안**:
  - (a) 백엔드 프로세스 내부에서 ProcessBuilder로 실행 → 격리 부족
  - (b) 같은 호스트의 별도 프로세스 → 커널 공유, OS 자원 공유 → 위험
  - (c) 별도 컨테이너 + 컨테이너 안에서 또 격리 컨테이너 → 채택
  - (d) Firecracker MicroVM → 운영 복잡도 과다, MVP 부적합
- **격리 옵션**: 9장의 docker run 옵션 그대로 인용
- **부작용 / 감수할 위험**: 호스트 커널 공유는 여전. gVisor / Sysbox로 Phase 5에서 강화

면접 질문 대비:
- "샌드박스 탈출 가능성은요?" — 호스트 커널 취약점 인정 + gVisor 도입 계획
- "왜 Lambda나 Cloud Run 같은 매니지드 안 썼어요?" — 비용, 콜드스타트, 컨테이너 풀 워밍업

- [ ] **Step 2: 커밋**

```powershell
git -C "C:\Users\남창인\projects\debug-trainer" add docs/adr/0002-judge-worker-isolation.md
git -C "C:\Users\남창인\projects\debug-trainer" commit -m "docs(adr): 0002 Judge Worker 격리 설계"
```

---

## Task 12: ADR-003 RabbitMQ vs Kafka 선택 (본인 작성)

**Files:**
- Create: `docs/adr/0003-rabbitmq-vs-kafka.md`

- [ ] **Step 1: ADR 작성 (본인 작성)**

다음 항목을 답하면서 작성:
- **상태**: Accepted (2026-05-16)
- **컨텍스트**: 채점 요청 비동기 처리에 메시지 큐 필요. 처리량 + 운영 복잡도 + 학습 가치 고려
- **결정**: RabbitMQ 채택
- **고려한 대안**:
  - RabbitMQ: AMQP, 작업 큐 모델, 운영 단순, 100 TPS 이하에 충분
  - Kafka: 스트리밍, 높은 처리량(1만 TPS+), 운영 복잡 (Zookeeper / KRaft), 디스크 보존이 강점
  - Redis Streams: 가볍지만 메시지 신뢰성 약함
- **결과**: 현재 처리량 요구사항(100 TPS 이하)에 RabbitMQ가 적합. Kafka는 v2 이상에서 검토
- **부작용 / 감수할 위험**: 메시지 보존 부족, 트래픽 폭증 시 마이그레이션 필요

면접 질문 대비:
- "왜 Kafka 안 썼어요?" — 처리량 vs 운영 복잡도 trade-off
- "지금 시스템이 1만 TPS 가야 한다면?" — 마이그레이션 시나리오 답변 준비

- [ ] **Step 2: 커밋**

```powershell
git -C "C:\Users\남창인\projects\debug-trainer" add docs/adr/0003-rabbitmq-vs-kafka.md
git -C "C:\Users\남창인\projects\debug-trainer" commit -m "docs(adr): 0003 RabbitMQ vs Kafka 선택 이유"
```

---

## Task 13: README 업데이트 (Phase 1 완료 반영)

**Files:**
- Modify: `README.md`

- [ ] **Step 1: README 보강**

기존 README의 "## 상태" 섹션을 다음으로 교체:

```markdown
## 상태

- [x] **Phase 1 (W1-2): 스캐폴딩** — 완료 2026-MM-DD
  - 백엔드 Spring Boot 3.3 + Java 21 + Jacoco 80% 커버리지 게이트
  - 프론트엔드 Next.js 15 + Tailwind + Jest
  - Docker Compose (Postgres / Redis / RabbitMQ)
  - JDK 17 샌드박스 이미지
  - GitHub Actions CI (백엔드/프론트엔드 분리)
  - ADR 3건 (모듈러 모놀리스, Judge Worker 격리, RabbitMQ 선택)
- [ ] Phase 2 (W3-5): Problem · Submission 도메인 + Judge Worker 기본
- [ ] Phase 3 (W6-7): Claude 해설 + Redis 캐싱 + GitHub OAuth
- [ ] Phase 4 (W8-9): SM-2 SRS + 복습 큐 + 일일 챌린지
- [ ] Phase 5 (W10): 통계 대시보드 + 배포 + 모니터링
- [ ] Phase 6 (지속): 문제 콘텐츠 200개 제작

## 로컬 개발 시작

### 사전 요구 사항

- JDK 21
- Node 20+
- Docker Desktop
- Git, GitHub CLI

### 부팅

```powershell
# 인프라
cd docker
Copy-Item .env.example .env  # 필요 시 비밀번호 수정
docker compose up -d

# 백엔드
cd ..\backend
.\gradlew.bat bootRun

# 프론트엔드 (별도 터미널)
cd ..\frontend
npm install
npm run dev
```

- 백엔드: http://localhost:8080/api/health
- 프론트엔드: http://localhost:3000

### 테스트

```powershell
# 백엔드
cd backend
.\gradlew.bat test jacocoTestReport

# 프론트엔드
cd frontend
npm test
```
```

(MM-DD 부분은 실제 완료일로 본인이 채움)

- [ ] **Step 2: 커밋 + 푸시**

```powershell
git -C "C:\Users\남창인\projects\debug-trainer" add README.md
git -C "C:\Users\남창인\projects\debug-trainer" commit -m "docs(readme): Phase 1 완료 상태 + 로컬 개발 가이드 추가"
git -C "C:\Users\남창인\projects\debug-trainer" push
```

---

## Phase 1 완료 체크리스트

모든 task를 완료하면 다음이 만족되어야 한다.

- [ ] `backend/`, `frontend/`, `judge-worker/`, `docker/`, `docs/adr/`, `.github/workflows/` 디렉토리가 모두 존재
- [ ] `cd backend && .\gradlew.bat test` 통과 (1 test passed)
- [ ] `cd frontend && npm test` 통과 (2 tests passed)
- [ ] `docker compose up -d` 후 3개 서비스가 healthy
- [ ] `docker run debug-trainer-sandbox:jdk17` 정상 동작
- [ ] GitHub Actions 워크플로 2개 모두 green
- [ ] ADR 3건이 본인 언어로 작성되어 있음 (AI가 대신 쓴 게 아님 — 셀프 점검: "이 의사결정 30초 안에 면접관에게 설명 가능한가?")
- [ ] README의 Phase 1 체크박스가 [x]로 표시

---

## Phase 2 미리보기 (다음 plan 작성 예정)

Phase 1 완료 후 Phase 2 plan을 별도로 작성한다. 다음 내용을 포함할 예정:

- Problem 도메인 (Entity, Repository, Service, Controller) + 시드 데이터 5개
- Submission 도메인 + WebSocket 결과 푸시
- Judge Worker 본격 구현 (RabbitMQ 컨슈머 + Docker 컨테이너 풀)
- 프론트엔드 풀이 페이지 (Monaco Editor + 결과 패널)
- 분담 모드: AI 30% / 본인 70% (도메인 모델링과 보안 설계는 본인 손)

---

## 변경 이력

| 일자 | 작성자 | 변경 |
|---|---|---|
| 2026-05-16 | Claude + 남창인 | Phase 1 초안 작성 |
