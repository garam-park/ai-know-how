# 06-A-04: Docker 이미지 빌드 자동화 Action 작성

| 속성 | 내용 |
|------|------|
| **번호** | 06-A-04 |
| **제목** | Docker 이미지 빌드 자동화 Action 작성 |
| **유형** | 실습 (15~20분) |
| **이전** | GitHub Secrets 등록 & 참조 방법 (06-A-03) |
| **다음** | GHCR에 push 자동화 (그룹 B) |

---

## 학습 목표

- Docker 빌드 과정을 GitHub Actions으로 자동화하기
- `docker/build-push-action`으로 효율적인 이미지 빌드 구성하기
- 빌드 캐시를 활용하여 CI 속도 최적화하기
- Multi-stage build로 최종 이미지 크기 줄이기

---

## 핵심 개념: FE 개발자를 위한 유추

FE 개발자가 매번 `npm run build`를 수동으로 실행하지 않고, Git push 시 자동으로 빌드가 되도록 CI를 구성하는 것처럼:

- **Docker build = 서버 전체 패키징** (`npm run build`보다 범위가 더 큼)
- **GitHub Actions = 자동 빌드 시스템** (CI 파이프라인)
- **빌드 캐시 = node_modules 캐싱** (중복 작업 건너뛰기)
- **Multi-stage build = 번들링 최적화** (필요한 것만 최종 이미지에 포함)

---

## 실습 1단계: Dockerfile 준비

### 목표
간단한 Node.js/Next.js 서버를 Docker 이미지로 패키징할 수 있는 Dockerfile 작성하기

### 완료 기준
- Dockerfile이 프로젝트 루트에 존재
- 멀티스테이지 빌드로 구성 (builder + runtime)
- 최종 이미지 크기가 원본보다 50% 이상 감소

### 단계별 작업

**1-1) 기본 Dockerfile 작성 (Node.js 기반)**

프로젝트 루트에 `Dockerfile` 생성:

```dockerfile
# === Stage 1: Builder (빌드 전용)
FROM node:18-alpine AS builder

WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치 (production 포함 모든 의존성)
RUN npm ci

# 소스 코드 복사
COPY . .

# 빌드 실행 (Next.js의 경우)
RUN npm run build

# === Stage 2: Runtime (최종 이미지)
FROM node:18-alpine

WORKDIR /app

# builder에서 node_modules 복사
COPY --from=builder /app/node_modules ./node_modules

# builder에서 빌드 결과 복사 (Next.js의 경우 .next 디렉토리)
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package*.json ./

# 필요한 런타임 파일만 복사
COPY .env.production .

# 포트 노출
EXPOSE 3000

# 애플리케이션 시작
CMD ["npm", "start"]
```

**1-2) Dockerfile 분석: 왜 멀티스테이지일까?**

| Stage | 목적 | 최종 이미지에 포함? |
|-------|------|-------------------|
| **Builder** | npm ci, npm run build 실행 | ❌ 아니오 |
| **Runtime** | 패키징된 앱 실행 | ✅ 예 |

**의미:**
- Builder 단계의 임시 파일(빌드 도구, 소스 코드 등)은 최종 이미지에 포함되지 않음
- 최종 이미지는 **필요한 것만** 포함 → 이미지 크기 대폭 감소

**예시 비교:**
```
❌ 싱글 스테이지: 1.2GB
✅ 멀티 스테이지: 450MB (37% 크기)
```

### 판단 기준

- **Next.js 프로젝트인가?** → `.next` 디렉토리 포함
- **Express/Fastify 서버?** → `dist` 또는 `build` 디렉토리 포함
- **환경 변수 필요?** → `.env.production` 파일 추가

---

## 실습 2단계: GitHub Actions Workflow 작성

### 목표
`docker/build-push-action`을 사용하여 자동 빌드 workflow 작성하기

### 완료 기준
- `.github/workflows/docker-build.yml` 파일 생성
- Git push 시 자동으로 Docker 빌드 트리거됨
- 빌드 로그가 Actions 탭에서 확인 가능

### 단계별 작업

**2-1) Workflow 파일 생성**

`.github/workflows/docker-build.yml` 생성:

```yaml
name: Docker Build

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

jobs:
  build:
    runs-on: ubuntu-latest

    permissions:
      contents: read
      packages: write

    steps:
      # Step 1: 코드 체크아웃
      - name: Checkout code
        uses: actions/checkout@v4

      # Step 2: Docker Buildx 설정 (빌드 캐시 활용)
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # Step 3: 메타데이터 생성 (이미지 태그, 레이블)
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: |
            my-registry.azurecr.io/my-app
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha

      # Step 4: Docker 이미지 빌드 (push는 아직 안 함)
      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**2-2) Workflow 단계별 설명**

| Step | 역할 | 주요 파라미터 |
|------|------|-------------|
| `actions/checkout@v4` | Git 저장소 코드 다운로드 | - |
| `docker/setup-buildx-action@v3` | Docker Buildx 초기화 (고급 빌드 기능) | - |
| `docker/metadata-action@v5` | 빌드 메타데이터 생성 (태그, 레이블) | `images`, `tags` |
| `docker/build-push-action@v5` | 실제 빌드 실행 | `context`, `push`, `cache-from` |

**주의:** `push: false`로 설정했으므로, 이 단계에서는 **빌드만 수행**하고 push하지 않음

### 판단 기준

- **언제 빌드를 트리거할 것인가?**
  - `push` → 모든 push 시 빌드 (권장)
  - `pull_request` → PR 생성/수정 시만 빌드 (선택사항)

- **어떤 브랜치에서만 빌드할 것인가?**
  - `main`, `develop` → 주요 브랜치만 (비용 절감)
  - 모든 브랜치 → 개발 단계에서는 `*` 사용 가능

---

## 실습 3단계: 빌드 캐시 설정

### 목표
동일한 코드에 대해 반복 빌드 시 캐시를 활용하여 빌드 시간 단축하기

### 완료 기준
- 첫 번째 빌드: 3~5분 (풀 빌드)
- 두 번째 빌드 (변경 없음): 1분 이내 (캐시 히트)

### 단계별 작업

**3-1) GitHub Actions 캐시 활용**

위의 Workflow 파일에서 이미 다음 설정이 포함됨:

```yaml
cache-from: type=gha  # GitHub Actions 캐시에서 읽기
cache-to: type=gha,mode=max  # GitHub Actions 캐시에 저장
```

**의미:**
- `type=gha` = GitHub Actions 제공 스토리지 사용
- `mode=max` = 모든 빌드 레이어 캐시 (최대 캐시)

**3-2) Docker 레이어 캐시 최적화**

Dockerfile을 다음과 같이 수정:

```dockerfile
# === Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# ✅ 캐시 전략: package*.json만 먼저 복사
# 코드가 변경되어도 의존성이 안 변했으면 이 레이어 캐시 사용
COPY package*.json ./
RUN npm ci

# 그 다음 소스 코드 복사
COPY . .
RUN npm run build

# === Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package*.json ./
COPY .env.production .

EXPOSE 3000
CMD ["npm", "start"]
```

**캐시 전략 분석:**

```
❌ 나쁜 방식:
COPY . .              # 모든 파일 복사 (코드 변경 시 캐시 무효화)
RUN npm ci            # 매번 재실행

✅ 좋은 방식:
COPY package*.json ./ # 패키지 파일만 복사
RUN npm ci            # 패키지가 안 바뀌면 캐시 사용
COPY . .              # 그 다음 나머지 복사
```

**3-3) 빌드 캐시 모니터링**

GitHub Actions 탭에서 빌드 로그 확인:

```
Step 3: Build Docker image
  ...
  #3 [builder  2/5] COPY package*.json ./
  #3 CACHED     0.1s
  #3 [builder  3/5] RUN npm ci
  #3 CACHED     2.5s  ← 캐시 히트!
  #3 [builder  4/5] COPY . .
  #3 CACHED     0.2s
```

**"CACHED"가 표시되면 캐시 사용 중인 상태**

---

## 실습 4단계: Multi-stage Build 심화

### 목표
Multi-stage build의 실제 이점 이해하고, 프로덕션 최적화 빌드 구성하기

### 완료 기준
- 최종 이미지에 devDependencies 없음
- 불필요한 파일(소스 코드, 빌드 도구) 제외됨

### 단계별 작업

**4-1) 고급 Multi-stage Build 예시**

```dockerfile
# === Stage 1: Dependencies (의존성 설치)
FROM node:18-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

# 모든 의존성 설치 (dev 포함)
RUN npm ci

# === Stage 2: Builder (빌드)
FROM node:18-alpine AS builder

WORKDIR /app

# 의존성 복사
COPY --from=dependencies /app/node_modules ./node_modules

# 소스 코드 복사
COPY . .

# 빌드 실행
RUN npm run build

# === Stage 3: Production Dependencies (프로덕션 의존성만)
FROM node:18-alpine AS prod-dependencies

WORKDIR /app

COPY package*.json ./

# 프로덕션 의존성만 설치 (--omit=dev)
RUN npm ci --omit=dev

# === Stage 4: Runtime (최종 이미지)
FROM node:18-alpine

WORKDIR /app

# 프로덕션 의존성만 복사
COPY --from=prod-dependencies /app/node_modules ./node_modules

# 빌드 결과 복사
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package*.json ./

# 필요한 설정 파일만 복사
COPY .env.production .
COPY next.config.js ./

EXPOSE 3000

# 헬스체크 추가 (선택사항)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "start"]
```

**4-2) 각 Stage의 역할**

| Stage | 역할 | 최종 이미지 포함 |
|-------|------|-----------------|
| `dependencies` | npm ci 실행 | ❌ |
| `builder` | npm run build 실행 | ❌ |
| `prod-dependencies` | 프로덕션 의존성만 추출 | ✅ |
| `runtime` | 최종 패키징 | ✅ |

**이미지 크기 비교:**

```
❌ 싱글 스테이지: 1.2GB (모든 devDependencies 포함)
⚠️  2단계: 650MB (의존성 구분 없음)
✅ 4단계: 380MB (프로덕션 의존성만 + 최적화)
```

---

## 실습 5단계: 빌드 테스트 및 확인

### 목표
실제로 빌드가 자동으로 트리거되고 성공하는지 확인하기

### 완료 기준
- Git push 후 GitHub Actions 탭에서 workflow 실행 확인
- 빌드 상태가 ✅ "passed"로 표시됨
- 빌드 로그를 읽고 캐시 히트 확인 가능

### 단계별 작업

**5-1) 로컬에서 Dockerfile 테스트**

push 하기 전에 로컬에서 빌드 테스트:

```bash
# Docker 이미지 빌드
docker build -t my-app:latest .

# 빌드 결과 확인
docker images | grep my-app

# 이미지 실행해서 테스트 (선택사항)
docker run -p 3000:3000 my-app:latest
```

**5-2) Git push 및 Actions 확인**

```bash
# 변경 사항 스테이징
git add .github/workflows/docker-build.yml Dockerfile

# 커밋
git commit -m "feat: add docker build automation with GitHub Actions"

# push (자동 workflow 트리거)
git push origin main
```

**5-3) GitHub Actions 탭에서 확인**

GitHub 저장소 → **Actions** 탭 클릭:

```
Workflow runs
├── Docker Build (main)
│   ├── Status: ✅ passed (또는 진행 중 🟡)
│   ├── Commit: feat: add docker build automation...
│   ├── Duration: 5 min 23 sec
│   └── [View Details] 클릭
│
└── Logs:
    ├── Set up Docker Buildx
    ├── Extract metadata
    └── Build Docker image
        ├── #1 [builder 1/5] FROM node:18-alpine
        ├── #1 [builder 2/5] COPY package*.json ./
        ├── #1 CACHED (캐시 히트!)
        ├── #1 [builder 3/5] RUN npm ci
        ├── #1 [runtime 1/4] FROM node:18-alpine
        ├── #1 [runtime 2/4] COPY --from=builder...
        └── ✅ Build complete: ...
```

**5-4) 빌드 성능 모니터링**

Workflow 로그에서 이 부분 확인:

```
Docker Build (main)
├── Run time: 5m 23s
├── Cache hit: yes ✅
└── Image layers:
    ├── builder [1/5] FROM: 0.2s (cached)
    ├── builder [2/5] COPY: 0.1s (cached)
    ├── builder [3/5] RUN npm ci: 2.5s (cached)
    ├── builder [4/5] COPY: 0.3s
    ├── builder [5/5] RUN npm build: 1m 42s
    ├── runtime [1/4] FROM: 0.1s (cached)
    ├── runtime [2/4] COPY: 0.2s (cached)
    └── Complete: ✅
```

---

## 실습 6단계: 빌드 실패 디버깅

### 목표
빌드 실패 시 원인을 파악하고 해결하는 방법 학습하기

### 완료 기준
- 빌드 오류 로그를 읽고 문제점 파악 가능
- 일반적인 오류에 대한 해결 방법 알기

### 단계별 작업

**6-1) 일반적인 빌드 오류와 해결 방법**

| 오류 | 원인 | 해결 방법 |
|------|------|---------|
| `npm ERR! code E404` | 패키지 버전 없음 | `package.json`에서 버전 확인, `package-lock.json` 삭제 후 재커밋 |
| `ENOENT: no such file or directory` | 빌드 결과 디렉토리 없음 | Dockerfile에서 복사 경로 확인 (`.next`, `dist` 등) |
| `OOM killer` | 메모리 부족 | 빌드 최적화 또는 더 큰 러너 사용 |
| `npm install` 시간 초과 | 네트워크 문제 | `npm ci` 대신 `npm install --prefer-offline` 사용 |
| `port 3000 already in use` | 포트 충돌 | Dockerfile에서 EXPOSE 포트 변경 |

**6-2) 빌드 로그 읽기**

GitHub Actions 로그에서 에러 찾기:

```
❌ Failed step: Build Docker image
   Error: docker build failed

   Relevant logs:
   Step 5/10: RUN npm run build
   > next build

   ✖ Linting and type checking
   ✖ pages/api/hello.ts:15:10
     Type 'unknown' is not assignable to type 'string'

   Error: Building failed (exit code 1)
```

**해결 방법:**
1. 로컬에서 `npm run build` 실행해서 같은 에러 재현
2. 타입스크립트 에러 수정
3. 로컬에서 `npm run build` 성공 확인
4. Git push로 재시도

**6-3) 로컬 디버깅 팁**

workflow와 같은 환경에서 테스트:

```bash
# 1. 로컬에서 Docker 빌드 테스트
docker build -t my-app:test .

# 2. 이미지 크기 확인
docker images my-app:test
# REPOSITORY   TAG      IMAGE ID      CREATED      SIZE
# my-app       test     abc123def456  2 mins ago   450MB

# 3. 컨테이너 실행해서 동작 확인
docker run -it my-app:test bash
# root@container# npm run build  # 재빌드 테스트
# root@container# npm start      # 앱 실행 테스트

# 4. 레이어별 빌드 시간 확인
docker build --progress=plain -t my-app:test . 2>&1 | grep "RUN"
```

**6-4) 캐시 문제 해결**

캐시로 인해 오래된 빌드 결과가 사용되는 경우:

```bash
# 로컬 캐시 무효화해서 풀 빌드
docker build --no-cache -t my-app:test .

# GitHub Actions에서 캐시 무효화
# 방법 1: Workflow 수동 실행 (캐시 무효화 옵션)
#   → Actions 탭 → Docker Build → Run workflow → "Clear caches" 체크

# 방법 2: Workflow 파일에서 캐시 비활성화 (임시)
# cache-from 과 cache-to 라인을 주석 처리 후 push
```

---

## 핵심 요약

| 개념 | 설명 | 효과 |
|------|------|------|
| **Multi-stage Build** | Builder + Runtime 분리 | 이미지 크기 50~70% 감소 |
| **빌드 캐시** | 동일 레이어 재사용 | 반복 빌드 시간 80% 단축 |
| **docker/build-push-action** | GitHub Actions 빌드 자동화 | 매번 수동 빌드 불필요 |
| **.env.production** | 프로덕션 환경 변수 | 배포 환경별 설정 분리 |

---

## 다음 단계

- ✅ 현재: Docker 빌드 자동화 완료
- ⏭️ 다음 (그룹 B): **GHCR에 push 자동화** → 빌드된 이미지를 Docker 레지스트리에 저장

---

## 참고 자료

- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [docker/build-push-action](https://github.com/docker/build-push-action)
- [GitHub Actions 캐시](https://github.com/actions/cache)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
