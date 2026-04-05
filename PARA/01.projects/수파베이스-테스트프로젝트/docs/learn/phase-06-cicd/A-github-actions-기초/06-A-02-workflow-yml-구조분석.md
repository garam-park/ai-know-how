# 06-A-02: workflow.yml 파일 구조 직접 분석

| 정보 | 내용 |
|------|------|
| 번호 | 06-A-02 |
| 제목 | workflow.yml 파일 구조 직접 분석 |
| 타입 | 개념 (10분) |
| 이전 | GitHub Actions 핵심 개념 |
| 다음 | GitHub Secrets 등록 & 참조 방법 |

---

## 목표

workflow.yml 파일의 각 섹션을 이해하고, 실제 CI/CD 파이프라인에서 어떻게 작동하는지 파악한다.

---

## FE 개발자를 위한 비유

**workflow.yml = next.config.js + docker-compose.yml**

```
next.config.js처럼
- 앱의 빌드 설정, 플러그인 등록
- 언제 빌드할지 정의

docker-compose.yml처럼
- 여러 서비스가 순차적으로 실행
- 각 서비스의 환경변수, 볼륨 정의
```

---

## workflow.yml 주요 키 맵핑

당신이 이미 아는 개념과 연결:

| workflow.yml | 유사 개념 | 설명 |
|--------------|---------|------|
| `name` | 프로젝트명 | CI 파이프라인 이름 |
| `on` | package.json의 `scripts` trigger | 언제 실행할지 정의 |
| `env` | `.env.local` | 전역 환경변수 |
| `jobs` | npm scripts의 복수 태스크 | build, test, deploy 같은 작업 단위 |
| `runs-on` | Docker 이미지 선택 | Ubuntu, Windows 등 OS 선택 |
| `steps` | Dockerfile의 RUN 명령어 | 순차 실행되는 명령어 리스트 |
| `uses` | npm 패키지 설치 | 재사용 가능한 Action 사용 |
| `run` | npm 스크립트 실행 | shell 명령어 직접 실행 |
| `with` | props 전달 | Action에 파라미터 전달 |
| `needs` | 의존성 | 이전 job이 완료될 때까지 대기 |
| `if` | 조건부 렌더링 | 특정 조건에서만 step 실행 |

---

## workflow.yml 최상위 구조

```yaml
name: 워크플로우 이름

on: 트리거 조건

env: 전역 환경변수

jobs:
  job1:
    # 첫 번째 작업
  job2:
    # 두 번째 작업
```

---

## 1. `name`: 워크플로우의 이름

```yaml
name: Build and Deploy App
```

- GitHub Actions 탭에서 표시되는 이름
- 여러 workflow가 있을 때 구분 목적
- **예시**: "PR Check", "Deploy to Production"

---

## 2. `on`: 워크플로우 트리거 (언제 실행?)

```yaml
on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
  schedule:
    - cron: '0 9 * * *'  # 매일 9시
  workflow_dispatch:      # 수동 실행
```

| 트리거 | 언제 실행 | FE 비유 |
|--------|---------|--------|
| `push` | 코드 푸시 | git push 후 자동 |
| `pull_request` | PR 생성/수정 | "코드 리뷰 전에 테스트해줄래?" |
| `schedule` | 정기적으로 (cron) | 매일 자정에 백업 |
| `workflow_dispatch` | 수동 버튼 클릭 | GitHub UI에서 "Run" 버튼 |

---

## 3. `env`: 전역 환경변수

```yaml
env:
  NODE_ENV: production
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
```

- 모든 job과 step에서 접근 가능
- `${{ }}` 문법으로 context 변수 활용
- **비유**: `.env` 파일처럼 동작

---

## 4. `jobs`: 실행할 작업들

```yaml
jobs:
  build:
    # 빌드 작업
  test:
    # 테스트 작업
    needs: build  # build 완료 후 실행
  deploy:
    # 배포 작업
    needs: test   # test 완료 후 실행
```

**중요**:
- 기본적으로 모든 job은 **병렬 실행**
- `needs`로 순차 실행 강제 가능
- **FE 비유**: npm scripts에서 `"build:css && build:js && deploy"`

---

## 5. `runs-on`: 실행 환경 (OS 선택)

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
```

| 옵션 | 설명 |
|------|------|
| `ubuntu-latest` | Ubuntu 최신 버전 (권장) |
| `macos-latest` | macOS |
| `windows-latest` | Windows |
| `ubuntu-22.04` | 특정 버전 지정 |

**비유**: Docker의 `FROM ubuntu:latest` 선택

---

## 6. `steps`: 순차 실행되는 작업 단계

각 step은 순서대로 실행되며, 하나라도 실패하면 다음 step은 실행되지 않습니다.

### 6-1. `uses`: 마켓플레이스 Action 사용

```yaml
steps:
  - uses: actions/checkout@v4
    # 코드 다운로드 (깃허브에서 제공하는 공식 Action)

  - uses: actions/setup-node@v4
    with:
      node-version: '18'
      # 라이브러리처럼 재사용 가능한 Action
```

**비유**: npm 패키지 설치하는 것처럼, 이미 만들어진 Action을 "사용"

---

### 6-2. `run`: 셸 명령어 직접 실행

```yaml
steps:
  - run: npm install
  - run: npm run build
  - run: npm test
```

**비유**: 터미널에서 직접 명령어 입력하는 것과 동일

---

### 6-3. `with`: Action에 파라미터 전달

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '18'      # 파라미터 1
    cache: 'npm'            # 파라미터 2
```

**비유**: 함수에 props 전달

```javascript
// JS 비유
<SetupNode nodeVersion="18" cache="npm" />
```

---

## 7. `name` (step): 각 step의 이름

```yaml
- name: Install dependencies
  run: npm install

- name: Build application
  run: npm run build
```

- 실행 로그에서 표시되는 이름
- 디버깅할 때 어느 step에서 실패했는지 파악 용이

---

## 8. `if`: 조건부 실행

```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: npm run deploy
```

**비유**: React의 조건부 렌더링

```javascript
{branch === 'main' && <Deploy />}
```

---

## 9. `needs`: Job 간 의존성

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build

  test:
    runs-on: ubuntu-latest
    needs: build        # build 완료 후 실행
    steps:
      - run: npm test

  deploy:
    runs-on: ubuntu-latest
    needs: test         # test 완료 후 실행
    steps:
      - run: npm run deploy
```

**실행 순서**: build → test → deploy (순차)

---

## 완전한 예시: Build + Test + Deploy 워크플로우

```yaml
# 파일명: .github/workflows/ci-cd.yml

# [1] 워크플로우 이름
name: Build, Test & Deploy

# [2] 트리거: main 브랜치에 push하거나 PR 생성 시
on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

# [3] 전역 환경변수
env:
  NODE_ENV: production
  REGISTRY: ghcr.io

# [4] 작업들
jobs:
  # ====== JOB 1: 빌드 ======
  build:
    # [5] 실행 환경: Ubuntu 최신
    runs-on: ubuntu-latest

    # [6] 이 job의 출력값 정의 (다른 job에서 사용 가능)
    outputs:
      build-number: ${{ steps.get-build-number.outputs.number }}

    # [7] 순차 실행될 작업들
    steps:
      # [8] 액션: 코드 체크아웃
      - name: Checkout code
        uses: actions/checkout@v4
        # → 현재 리포지토리의 코드를 CI 환경에 다운로드

      # [9] 액션: Node.js 설정
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
        # → Node.js 18 버전 설치, npm 캐시 활성화

      # [10] 일반 명령: npm 의존성 설치
      - name: Install dependencies
        run: npm ci  # ci = clean install (프로덕션용)

      # [11] 빌드 번호 생성 (다른 job에 전달)
      - name: Get build number
        id: get-build-number
        run: echo "number=${{ github.run_number }}" >> $GITHUB_OUTPUT
        # → $GITHUB_OUTPUT에 값 저장 → 다른 step에서 사용 가능

      # [12] Next.js 빌드
      - name: Build application
        run: npm run build
        # → next build 실행

      # [13] 빌드 산출물 업로드 (다른 job에서 사용)
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-output
          path: .next/
          # → .next 폴더를 artifact로 저장

  # ====== JOB 2: 테스트 (빌드 완료 후) ======
  test:
    # 빌드 job이 완료될 때까지 대기
    needs: build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      # [14] 조건부 실행: PR일 때만 전체 테스트
      - name: Run all tests
        if: github.event_name == 'pull_request'
        run: npm test -- --coverage
        # → github.event_name으로 어떤 이벤트인지 확인

      # [15] 조건부 실행: push일 때만 빠른 테스트
      - name: Run quick tests
        if: github.event_name == 'push'
        run: npm test -- --testNamePattern="critical"

      # [16] 린트 실행
      - name: Run linter
        run: npm run lint
        # 실패해도 다음 step 실행하도록 설정
        continue-on-error: true

      # [17] 테스트 결과 보고 (junit 포맷)
      - name: Publish test results
        if: always()  # 테스트 성공/실패 여부 상관없이 실행
        uses: dorny/test-reporter@v1
        with:
          name: Test Results
          path: 'reports/junit.xml'
          reporter: 'jest-junit'

  # ====== JOB 3: 배포 (테스트 완료 후, main 브랜치만) ======
  deploy:
    # test job이 완료될 때까지 대기
    needs: test
    runs-on: ubuntu-latest

    # 조건: main 브랜치에 push할 때만 배포
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # [18] 배포 키 설정
      - name: Configure deploy credentials
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.DEPLOY_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
        # → GitHub Secrets에서 배포 키 가져오기

      # [19] 빌드 산출물 다운로드
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-output
          path: .next/
        # → build job에서 업로드한 .next 폴더 가져오기

      # [20] 서버에 배포
      - name: Deploy to production
        run: |
          ssh -i ~/.ssh/deploy_key user@prod-server.com \
            "cd /app && git pull && npm ci && npm run build && pm2 restart app"
        # → 실제 배포 서버에 명령어 실행

      # [21] Slack 알림
      - name: Notify Slack
        if: success()  # 배포 성공시만 알림
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "✅ 배포 성공!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Build #${{ github.run_number }} 배포 완료\nCommit: ${{ github.sha }}"
                  }
                }
              ]
            }
```

---

## 라인별 해석 요약

| 라인 | 개념 | 역할 |
|------|------|------|
| `[1]` name | 파이프라인 이름 | 로그 탭에서 표시 |
| `[2]` on | 트리거 | 언제 실행할지 결정 |
| `[3]` env | 전역 환경변수 | 모든 job에서 접근 |
| `[4]` jobs | 작업 정의 | build, test, deploy 구성 |
| `[5]` runs-on | OS 선택 | Ubuntu 실행 환경 |
| `[6]` outputs | job 출력값 | 다른 job에 데이터 전달 |
| `[7]` steps | 순차 실행 단계 | 명령어 리스트 |
| `[8]` uses | 외부 Action | 코드 체크아웃 |
| `[9]` with | 파라미터 | Node 버전, npm 캐시 설정 |
| `[10]` run | 셸 명령 | npm ci 실행 |
| `[11]` id | step 식별자 | 출력값 참조 시 사용 |
| `[12]` run | 빌드 명령 | npm run build |
| `[13]` upload-artifact | 파일 저장 | .next 폴더 저장 |
| `[14]` if | 조건부 실행 | PR일 때만 전체 테스트 |
| `[15]` if | 조건부 실행 | push일 때만 빠른 테스트 |
| `[16]` continue-on-error | 실패 무시 | 린트 실패해도 계속 진행 |
| `[17]` always() | 항상 실행 | 성공/실패 상관없이 보고 |
| `[18]` secrets | 민감한 데이터 | 배포 키 참조 |
| `[19]` download-artifact | 파일 가져오기 | 빌드 산출물 다운로드 |
| `[20]` run (multiline) | 다중 명령 | SSH로 서버 배포 |
| `[21]` success() | 성공 조건 | 배포 성공시 Slack 알림 |

---

## 실행 흐름 시각화

```
Event: git push to main
  ↓
[Trigger: on.push]
  ↓
[Job: build] (runs-on: ubuntu-latest)
  ├─ Checkout code
  ├─ Setup Node.js
  ├─ Install dependencies
  ├─ Get build number
  ├─ Build application
  └─ Upload artifacts ✓
  ↓
[Job: test] (needs: build)
  ├─ Checkout code
  ├─ Setup Node.js
  ├─ Install dependencies
  ├─ Run tests (if: PR) OR Run quick tests (if: push)
  ├─ Run linter
  └─ Publish results ✓
  ↓
[Job: deploy] (needs: test, if: main && push)
  ├─ Checkout code
  ├─ Configure credentials
  ├─ Download artifacts
  ├─ Deploy SSH command
  └─ Slack notification ✓
```

---

## 핵심 개념 정리

### 1. Context 변수 (${{ }})

```yaml
${{ github.ref }}           # 현재 브랜치 (refs/heads/main)
${{ github.sha }}           # 커밋 해시
${{ github.event_name }}    # 트리거 종류 (push, pull_request)
${{ secrets.SECRET_NAME }}  # GitHub Secrets
${{ steps.step-id.outputs.output-name }}  # 이전 step 출력값
```

### 2. 조건부 실행 (`if`)

```yaml
if: github.ref == 'refs/heads/main'        # main 브랜치만
if: github.event_name == 'pull_request'    # PR만
if: success()                              # 이전 step 성공시
if: failure()                              # 이전 step 실패시
if: always()                               # 항상 실행
```

### 3. Job 의존성 (`needs`)

```yaml
jobs:
  job1: # 병렬 실행
  job2: # 병렬 실행
  job3:
    needs: [job1, job2]  # job1, job2 모두 완료 후 실행
```

### 4. 아티팩트 (파일 전달)

```yaml
# job1에서 생성
- uses: actions/upload-artifact@v3
  with:
    name: my-files
    path: dist/

# job2에서 사용
- uses: actions/download-artifact@v3
  with:
    name: my-files
    path: ./downloaded/
```

---

## 체크리스트

workflow.yml을 분석할 때 다음을 확인하세요:

- [ ] `name`: 파이프라인의 목적이 명확한가?
- [ ] `on`: 어떤 상황에 트리거되는가? (push, PR, 스케줄)
- [ ] `env`: 전역 변수는 제대로 설정되었는가?
- [ ] `jobs`: 각 job이 무엇을 하는가?
- [ ] `runs-on`: 올바른 OS를 선택했는가?
- [ ] `needs`: job 간 의존성이 올바른가?
- [ ] `if`: 불필요한 배포는 방지되는가?
- [ ] `secrets`: 민감한 정보는 Secrets에서 참조되는가?
- [ ] `artifacts`: job 간에 필요한 파일이 전달되는가?

---

## 다음 단계

다음 문서에서는 **GitHub Secrets 등록 & 참조 방법**을 배웁니다.
- 배포 키, API 토큰 같은 민감한 정보를 안전하게 관리하는 방법
- workflow에서 secrets를 참조하는 방법

