# 06-A-03 | GitHub Secrets 등록 & 참조 방법

## 📋 개요

| 항목 | 내용 |
|-----|-----|
| **번호** | 06-A-03 |
| **제목** | GitHub Secrets 등록 & 참조 방법 |
| **타입** | 실습 (15~20분) |
| **선행학습** | workflow.yml 파일 구조 직접 분석 (06-A-02) |
| **다음단계** | Docker 이미지 빌드 자동화 Action 작성 (06-A-04) |

---

## 🎯 학습 목표

이 단계를 완료하면 다음을 할 수 있습니다:

- [ ] GitHub에서 민감한 정보(API 키, 비밀번호)를 안전하게 보관하는 이유 이해
- [ ] Repository Secrets을 등록하고 workflow에서 참조하기
- [ ] Environment Secrets과 Repository Secrets의 차이 구분
- [ ] workflow에서 secrets이 마스킹되는 원리 확인
- [ ] 실제 배포 환경에 필요한 secrets 설정하기

---

## 🔑 개념: GitHub Secrets란?

### FE 개발자에게 친숙한 비유

```
GitHub Secrets = .env.local (로컬 환경변수)
              = Vercel Environment Variables (프로덕션 환경변수)
```

Vercel이나 Next.js 프로젝트에서:
- `.env.local` 파일에 `NEXT_PUBLIC_API_KEY` 를 저장했잖아요?
- GitHub Actions도 동일한 개념입니다!
- 단, GitHub이 자동으로 마스킹하고 암호화해줍니다.

### 왜 필요한가?

```bash
# ❌ 절대 하면 안 되는 것 (코드에 직접 입력)
DOCKER_TOKEN=dckr_pat_abc123xyz...
SSH_KEY=-----BEGIN PRIVATE KEY-----...
API_PASSWORD=super_secret_password
```

**문제점:**
1. GitHub 저장소가 public이면 누구나 볼 수 있음
2. git history에 영구 기록됨
3. 누군가 API 토큰을 악용 가능

**GitHub Secrets의 해결책:**
1. 민감한 정보를 GitHub 서버에 암호화되어 저장
2. workflow 실행 시에만 복호화되어 주입
3. 로그에 자동으로 마스킹됨

---

## 🚀 Step 1: Repository Secrets 등록하기

### 1-1. Settings 페이지 접근

1. GitHub 저장소 → **Settings** 탭 클릭
2. 좌측 메뉴 → **Secrets and variables** → **Actions** 선택

```
Settings
  └─ Secrets and variables
       └─ Actions  ← 여기 선택
```

### 1-2. New repository secret 버튼 클릭

- **Name**: 시크릿의 이름 (대문자 권장, 예: `DOCKER_TOKEN`)
- **Secret**: 실제 값 입력 (예: `dckr_pat_abc123xyz...`)

### 1-3. 실습: 3가지 secrets 등록하기

#### 시크릿 #1: Docker Registry Token

| 필드 | 값 |
|-----|-----|
| **Name** | `DOCKER_TOKEN` |
| **Secret** | (실제 Docker Hub 토큰 입력) |

**설명:** Docker Hub에 이미지를 push할 때 인증용

#### 시크릿 #2: SSH Private Key

| 필드 | 값 |
|-----|-----|
| **Name** | `SSH_KEY` |
| **Secret** | (실제 SSH private key 전체 복사) |

**설명:** 배포 서버에 SSH 접속할 때 사용

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEA...
... (중간 생략)
-----END OPENSSH PRIVATE KEY-----
```

#### 시크릿 #3: 배포 서버 정보

| 필드 | 값 |
|-----|-----|
| **Name** | `SERVER_HOST` |
| **Secret** | `deploy.example.com` |

**설명:** 배포할 서버의 IP 또는 도메인

---

## 📝 Step 2: Workflow에서 Secrets 참조하기

### 2-1. 기본 문법

```yaml
# workflow.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Check out code
        uses: actions/checkout@v4

      - name: Login to Docker
        run: |
          echo "${{ secrets.DOCKER_TOKEN }}" | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
```

### 2-2. 문법 설명

```yaml
${{ secrets.SECRET_NAME }}
```

- `secrets.`: GitHub가 제공하는 특수 객체
- `SECRET_NAME`: GitHub Settings에서 등록한 이름 (대문자)
- `${{ ... }}`: GitHub Actions 표현식 문법

### 2-3. 환경변수로도 전달 가능

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest

    env:
      DOCKER_TOKEN: ${{ secrets.DOCKER_TOKEN }}
      SSH_KEY: ${{ secrets.SSH_KEY }}
      SERVER_HOST: ${{ secrets.SERVER_HOST }}

    steps:
      - name: Deploy using secrets
        run: |
          echo "Deploying to $SERVER_HOST"
          # SSH_KEY와 DOCKER_TOKEN은 환경변수로 자동 주입됨
```

---

## 🔒 Step 3: 마스킹 원리 확인

### 3-1. Secrets는 자동으로 마스킹됨

```yaml
# workflow.yml
steps:
  - name: Test secret masking
    run: echo "Token is ${{ secrets.DOCKER_TOKEN }}"
```

**실행 결과 (GitHub Actions 로그):**
```
Token is ***
```

- 실제 토큰값은 보이지 않음
- `***` 로 마스킹됨
- 로그 다운로드해도 마스킹 유지

### 3-2. 실습: 마스킹 테스트

1. workflow 파일 생성:

```yaml
# .github/workflows/test-secrets.yml
name: Test Secrets

on:
  workflow_dispatch:  # 수동 실행

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Show secret (마스킹됨)
        run: echo "Secret value: ${{ secrets.DOCKER_TOKEN }}"

      - name: Show as env var
        env:
          TOKEN: ${{ secrets.DOCKER_TOKEN }}
        run: echo "Token from env: $TOKEN"
```

2. GitHub Actions 탭 → **Test Secrets** → **Run workflow** 클릭
3. 로그에서 `***` 로 마스킹된 것 확인

---

## 🎯 Step 4: Repository Secrets vs Environment Secrets

### 4-1. Repository Secrets (저장소 전체)

**사용처:** 모든 workflow에서 사용 가능

```yaml
${{ secrets.DOCKER_TOKEN }}  # 어느 workflow에서든 접근 가능
```

**등록위치:** Settings → Secrets and variables → Actions

**사용 시나리오:**
- 대부분의 프로젝트에서 공통으로 사용하는 토큰
- 예: Docker Hub 토큰, 공용 API 키

### 4-2. Environment Secrets (특정 환경만)

**사용처:** 특정 environment에서만 사용

```yaml
environment: production

steps:
  - run: echo ${{ secrets.PROD_API_KEY }}  # production 환경에서만 접근 가능
```

**등록위치:** Settings → Environments → 특정환경 → Secrets

**사용 시나리오:**
- 개발/스테이징/프로덕션 환경별로 다른 키
- 프로덕션 배포만 특정 권한 필요

---

## 💻 Step 5: 실제 배포 workflow 작성 (종합)

### 5-1. 전체 workflow 예시

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

env:
  DOCKER_REGISTRY: docker.io
  IMAGE_NAME: myproject/myapp

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      # 1. 코드 체크아웃
      - name: Checkout code
        uses: actions/checkout@v4

      # 2. Docker에 로그인 (secrets 사용)
      - name: Login to Docker Hub
        run: |
          echo "${{ secrets.DOCKER_TOKEN }}" | docker login \
            -u "${{ secrets.DOCKER_USERNAME }}" \
            --password-stdin

      # 3. Docker 이미지 빌드
      - name: Build Docker image
        run: |
          docker build -t ${{ env.DOCKER_REGISTRY }}/${{ env.IMAGE_NAME }}:latest .

      # 4. Docker 이미지 푸시
      - name: Push to Docker Hub
        run: |
          docker push ${{ env.DOCKER_REGISTRY }}/${{ env.IMAGE_NAME }}:latest

      # 5. SSH로 배포 서버에 접속 및 배포
      - name: Deploy to server
        env:
          SSH_KEY: ${{ secrets.SSH_KEY }}
          SERVER_HOST: ${{ secrets.SERVER_HOST }}
          SERVER_USER: deploy
        run: |
          mkdir -p ~/.ssh
          echo "$SSH_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa

          ssh -o StrictHostKeyChecking=no \
              -i ~/.ssh/id_rsa \
              $SERVER_USER@$SERVER_HOST \
              "cd /app && docker-compose pull && docker-compose up -d"

      # 6. 완료 알림
      - name: Notify deployment success
        run: echo "✅ Deployment completed successfully"
```

### 5-2. 이 workflow에서 사용된 secrets

| Secret 이름 | 용도 | 등록 필요 |
|-----------|------|---------|
| `DOCKER_TOKEN` | Docker Hub 인증 | ✅ 필수 |
| `DOCKER_USERNAME` | Docker 사용자명 | ✅ 필수 |
| `SSH_KEY` | SSH private key | ✅ 필수 |
| `SERVER_HOST` | 배포 서버 주소 | ✅ 필수 |

---

## ✅ Step 6: 체크리스트 & 완료 기준

### 완료 기준

- [ ] GitHub Settings → Secrets 페이지에 접근 가능함
- [ ] `DOCKER_TOKEN`, `SSH_KEY`, `SERVER_HOST` 등 3개 이상의 secrets 등록함
- [ ] workflow에서 `${{ secrets.NAME }}` 문법으로 secrets 참조함
- [ ] GitHub Actions 로그에서 secrets이 `***` 로 마스킹되는 것 확인함
- [ ] Repository Secrets과 Environment Secrets의 차이 설명 가능함
- [ ] 배포용 workflow yml 파일 작성 완료함

### 검증 방법

1. **Secrets 등록 확인:**
   ```
   GitHub → Settings → Secrets and variables → Actions
   → DOCKER_TOKEN, SSH_KEY, SERVER_HOST 표시되는지 확인
   ```

2. **Workflow 실행 테스트:**
   - workflow_dispatch 트리거로 수동 실행
   - Actions 탭에서 로그 확인
   - secrets 값이 `***` 로 마스킹되는지 확인

3. **문법 검증:**
   - `${{ secrets.NAME }}` 형식이 올바르게 작성되었는지 확인
   - YAML 들여쓰기 및 문법 오류 없는지 확인

---

## 🎓 추가 학습 자료

### Secrets 관리 Best Practices

```yaml
# ✅ 올바른 방법
- name: Deploy
  env:
    TOKEN: ${{ secrets.DOCKER_TOKEN }}
  run: docker login --password-stdin < token.txt

# ❌ 피해야 할 방법
- name: Deploy
  run: docker login --password "${{ secrets.DOCKER_TOKEN }}"
  # 명령어 전체가 로그에 기록될 수 있음
```

### Secrets Rotation (주기적 갱신)

- 3개월마다 secrets 값 변경 권장
- 누군장 가져간 토큰의 유효기간 제한
- Docker Hub, SSH 키 설정에서 만료 정책 설정

### Multi-environment 배포

```yaml
# 개발 환경과 프로덕션 환경의 secrets 분리
jobs:
  deploy-dev:
    environment: development
    steps:
      - run: echo ${{ secrets.DEV_DATABASE_URL }}

  deploy-prod:
    environment: production
    steps:
      - run: echo ${{ secrets.PROD_DATABASE_URL }}
```

---

## 📚 연관 개념 복습

| 개념 | 설명 | 이전 단계 |
|-----|------|---------|
| **workflow.yml** | GitHub Actions 정의 파일 | 06-A-02 |
| **환경변수 (env)** | workflow 내 변수 선언 | 기본 개념 |
| **Docker 인증** | registry login | 다음 단계 (06-A-04) |
| **SSH 배포** | 서버로의 안전한 접속 | 다음 단계 (06-A-05) |

---

## 🔗 다음 단계

**06-A-04: Docker 이미지 빌드 자동화 Action 작성**

- 이 단계에서 학습한 secrets을 활용하여 Docker 이미지 빌드 & 푸시
- `docker/build-push-action` 공식 Action 사용
- 자동으로 레지스트리에 이미지 배포하기
