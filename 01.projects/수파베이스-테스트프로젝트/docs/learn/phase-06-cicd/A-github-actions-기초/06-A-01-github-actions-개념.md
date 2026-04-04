# 06-A-01 GitHub Actions 핵심 개념 (trigger, job, step)

**번호**: 06-A-01 | **타입**: 개념 | **학습 시간**: 약 10분

**이전 학습**: PostgreSQL 로그 파일 위치 & 분석법 (Phase 5)
**다음 학습**: workflow.yml 파일 구조 직접 분석 (06-A-02)

---

## 개요

GitHub Actions는 GitHub 저장소에서 코드 변경을 감지하여 **자동으로 작업을 실행**하는 CI/CD 플랫폼입니다.

FE 개발자가 이미 사용해본 Vercel의 자동 배포 시스템과 동일한 개념이지만, **더 세밀한 제어**가 가능합니다.

### FE 개발자를 위한 비유

| 개념 | Vercel에서 | GitHub Actions에서 |
|------|-----------|------------------|
| **Trigger** | git push (main branch) | git push, pull_request, 스케줄, 수동 실행 등 다양한 이벤트 |
| **Job** | 빌드 프로세스 (build & deploy) | 전체 작업 흐름 (예: lint → test → build → deploy) |
| **Step** | 각 npm 명령어 | `npm run lint`, `npm run test`, `npm run build` 등 개별 명령어 |
| **Workflow** | package.json의 scripts 섹션 | `.github/workflows/ci.yml` 파일에 자동화 규칙 작성 |

---

## 1. Trigger (트리거): 무엇이 작업을 시작하는가?

**Trigger**는 GitHub Actions 워크플로우를 **언제 실행할지 결정**하는 이벤트입니다.

### 주요 Trigger 종류

#### 1-1. **push** - 코드 푸시 시 실행
```yaml
on:
  push:
    branches:
      - main
      - develop
```
- `main` 또는 `develop` 브랜치에 푸시할 때마다 워크플로우 실행
- FE 프로젝트에서: 코드 변경 → 자동 테스트 & 빌드

#### 1-2. **pull_request** - PR 생성/업데이트 시 실행
```yaml
on:
  pull_request:
    branches:
      - main
```
- PR이 열리거나 새로운 커밋이 추가될 때 실행
- FE 프로젝트에서: PR 검토 전에 자동으로 lint & test 실행 → 코드 품질 보증

#### 1-3. **schedule** - 정해진 시간에 반복 실행
```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # 매일 오전 2시 (UTC)
```
- Cron 표현식으로 정해진 시간에 자동 실행
- FE 프로젝트에서: 매일 밤 번들 크기 분석, 의존성 업데이트 체크

#### 1-4. **workflow_dispatch** - 수동 실행
```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: '배포 환경'
        required: true
        default: 'staging'
```
- GitHub UI에서 직접 버튼을 눌러 실행
- FE 프로젝트에서: 긴급 배포, 특정 환경에만 배포할 때 유용

### 실제 예시: 이 프로젝트의 경우

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # 매주 일요일 자동 테스트
```

---

## 2. Job (작업): 여러 Step의 모음

**Job**은 **여러 Step을 순차적으로 실행하는 단위**입니다. 같은 워크플로우 내에서 여러 Job을 **병렬로** 실행할 수 있습니다.

### Job의 구조

```yaml
jobs:
  lint-and-test:  # Job 이름
    runs-on: ubuntu-latest  # 실행 환경 (Runner)
    steps:
      - uses: actions/checkout@v4  # Step 1
      - name: Install dependencies  # Step 2
        run: npm install
      - name: Lint code  # Step 3
        run: npm run lint
```

### Job 간 병렬 실행

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm run test

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm run build
```

**`lint`, `test`, `build` Job이 동시에 실행됩니다.**
(FE 프로젝트에서 병렬 실행으로 총 실행 시간 단축)

### Job 간 의존성 설정

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run test

  deploy:
    runs-on: ubuntu-latest
    needs: test  # test Job이 성공해야만 실행
    steps:
      - uses: actions/checkout@v4
      - run: npm run build
      - run: npm run deploy
```

---

## 3. Step (단계): 실제 명령어 실행

**Step**은 Job 내에서 **개별 작업의 최소 단위**입니다.

### Step의 두 가지 유형

#### 3-1. **uses** - 사전 정의된 Action 사용
```yaml
- uses: actions/checkout@v4
```
- GitHub 또는 커뮤니티에서 만든 **재사용 가능한 Action** 사용
- `actions/checkout`: 저장소 코드 다운로드
- `actions/setup-node`: Node.js 설정

#### 3-2. **run** - 직접 명령어 실행
```yaml
- name: Install dependencies
  run: npm install

- name: Run tests
  run: npm run test
```
- 로컬 개발 환경에서 실행하는 것과 동일한 명령어
- FE 프로젝트의 package.json scripts와 일치

### 실제 예시: FE 프로젝트 CI 파이프라인

```yaml
steps:
  - uses: actions/checkout@v4
    # → 저장소의 모든 코드를 다운로드

  - uses: actions/setup-node@v4
    with:
      node-version: '18'
      cache: 'npm'
    # → Node.js 18 버전 설정, npm 캐시 활성화 (속도 향상)

  - name: Install dependencies
    run: npm ci
    # → package-lock.json 기준으로 정확한 버전 설치

  - name: Lint code
    run: npm run lint
    # → ESLint 실행

  - name: Run tests
    run: npm run test
    # → Jest 테스트 실행

  - name: Build
    run: npm run build
    # → 프로덕션 번들 생성
```

---

## 4. Runner (실행 환경)

**Runner**는 Step의 명령어를 **실제로 실행하는 서버**입니다.

### 주요 Runner 종류

```yaml
runs-on: ubuntu-latest      # Ubuntu 최신 버전 (Linux)
runs-on: windows-latest     # Windows 최신 버전
runs-on: macos-latest       # macOS 최신 버전
```

### FE 프로젝트에서 Runner 선택 기준

| Runner | 용도 | 장점 | 단점 |
|--------|------|------|------|
| `ubuntu-latest` | 대부분의 FE 프로젝트 | 가장 빠르고 안정적 | - |
| `windows-latest` | Windows 환경에서만 작동하는 라이브러리 테스트 | Windows 호환성 검증 | 더 느림 |
| `macos-latest` | macOS/iOS 앱 빌드 | macOS 환경 검증 | 가장 느림, 비용 높음 |

**FE 프로젝트 권장**: `ubuntu-latest` (대부분의 경우 충분)

---

## 5. YAML 파일 구조 미리보기

GitHub Actions의 워크플로우는 `.github/workflows/` 디렉토리 내 `*.yml` 파일로 정의됩니다.

### 최소 구조

```yaml
name: CI Pipeline                    # 워크플로우 이름

on:                                  # Trigger 정의
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:                              # Job 이름
    runs-on: ubuntu-latest           # Runner

    steps:                           # Step들
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

---

## 6. 무료 사용량 & 비용

### GitHub Actions 무료 요금제

| 항목 | 월간 무료 사용량 | 초과 시 비용 |
|------|-----------------|------------|
| ubuntu 실행 | 2,000 분 | $0.008/분 |
| windows 실행 | 2,000 분 | $0.016/분 |
| macos 실행 | 200 분 | $0.016/분 |
| 저장소당 Job 동시 실행 | 20개 | 초과 시 대기 |

### FE 프로젝트의 예상 비용

```
예시 프로젝트:
- 매일 30회 push/PR
- 1회 실행에 3분 소요
- ubuntu-latest만 사용

월간 사용량: 30 × 3 × 30 = 2,700분
→ 2,000분 무료 + 700분 × $0.008 = $5.60

대부분의 FE 프로젝트는 무료 범위 내에서 사용 가능
```

---

## 7. FE 프로젝트에서의 활용 사례

### 사례 1: 자동화된 코드 품질 검사

```yaml
on: [push, pull_request]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint           # ESLint
      - run: npm run type-check     # TypeScript
      - run: npm run test           # Jest
      - run: npm run build          # 빌드 가능성 검증
```

**효과**: PR 검토 전에 코드 문제 조기 발견

### 사례 2: 환경별 배포 자동화

```yaml
on:
  push:
    branches:
      - main      # main → production
      - develop   # develop → staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to ${{ github.ref_name == 'main' && 'Production' || 'Staging' }}
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            npm run deploy:prod
          else
            npm run deploy:staging
          fi
```

### 사례 3: 정기적인 번들 크기 분석

```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # 매주 일요일 자동 실행

jobs:
  bundle-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Analyze bundle size
        run: npm run analyze
```

---

## 8. 주요 용어 정리

| 용어 | 설명 |
|------|------|
| **Workflow** | 전체 자동화 규칙 (`.yml` 파일) |
| **Trigger** | 워크플로우를 시작하는 이벤트 |
| **Job** | 여러 Step의 모음 |
| **Step** | 개별 작업 단위 (Action 또는 명령어) |
| **Action** | 재사용 가능한 작업 모듈 |
| **Runner** | 코드를 실제로 실행하는 서버 |
| **Artifact** | Job에서 생성된 파일 (빌드 결과 등) |
| **Secret** | 암호화된 환경 변수 (API 키, 토큰 등) |

---

## 9. 학습 체크리스트

다음 내용을 이해했는지 확인하세요:

- [ ] Trigger의 4가지 주요 유형 (push, pull_request, schedule, workflow_dispatch) 이해
- [ ] Job과 Step의 관계 및 차이점 이해
- [ ] Job 간 병렬 실행과 의존성 설정의 개념 이해
- [ ] Runner의 역할과 FE 프로젝트에서의 선택 기준 이해
- [ ] 무료 사용량 확인 및 예상 비용 계산 가능
- [ ] 자신의 FE 프로젝트에 GitHub Actions 적용 시나리오 상상 가능

---

## 10. 다음 단계

**다음 학습 (06-A-02)**: [workflow.yml 파일 구조 직접 분석](./06-A-02-workflow-yml-구조분석.md)

실제 `.github/workflows/ci.yml` 파일을 열어서:
- Trigger 위치 파악
- Job 이름과 개수 파악
- 각 Step의 용도 이해
- 전체 파이프라인 흐름 그리기

---

**학습 팁**: GitHub Actions 공식 문서의 [Introduction to GitHub Actions](https://docs.github.com/en/actions/learn-github-actions)도 함께 읽어보세요. 한국어 번역도 있습니다.
