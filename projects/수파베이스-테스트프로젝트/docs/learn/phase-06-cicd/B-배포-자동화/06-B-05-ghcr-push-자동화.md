# 06-B-05: GHCR에 push 자동화

| 속성 | 내용 |
|------|------|
| **번호** | 06-B-05 |
| **제목** | GHCR(GitHub Container Registry)에 push 자동화 |
| **유형** | 실습 (15~20분) |
| **이전** | Docker 이미지 빌드 자동화 Action 작성 (06-A-04) |
| **다음** | SSH 배포 Action 설정 (06-B-06) |

---

## 학습 목표

- GHCR(GitHub Container Registry)이 무엇이고 왜 사용하는지 이해하기
- GitHub 토큰을 생성하고 Secrets에 등록하기
- `docker/login-action`과 `docker/build-push-action`으로 이미지를 GHCR에 push하기
- 이미지 태깅 전략 구성하기
- push된 이미지가 올바르게 저장되는지 확인하기

---

## 핵심 개념: FE 개발자를 위한 유추

FE 개발자가 빌드된 번들을 npm 레지스트리에 publish하는 것처럼:

- **Docker 이미지 = npm 패키지**
- **GHCR = npm 레지스트리 (또는 GitHub Packages)**
- **이미지 태그 = 패키지 버전** (예: `v1.0.0`)
- **docker push = npm publish**

**개념 연결:**
```
로컬 개발               CI/CD                    배포
npm run build    →  docker build      →  docker push  →  원격 서버에서 pull
package.json         Dockerfile           GHCR           docker run
```

GHCR을 사용하면:
1. 빌드된 이미지를 중앙 저장소에 보관
2. 배포 서버에서 항상 최신 버전 pull 가능
3. Docker Hub처럼 공개/비공개 제어 가능

---

## 실습 1단계: GitHub Personal Access Token (PAT) 생성

### 목표
GHCR에 push하기 위한 인증 토큰 생성하고 로컬에서 테스트하기

### 완료 기준
- GitHub Personal Access Token 생성 완료
- `docker login ghcr.io` 명령어로 로그인 성공
- 로컬 환경에서 GHCR에 접근 가능 확인

### 단계별 작업

**1-1) GitHub 토큰 생성**

GitHub 웹사이트에서:

1. 우상단 프로필 아이콘 → **Settings**
2. 좌측 메뉴 → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. **Generate new token** → **Generate new token (classic)** 클릭

**필요한 권한 설정:**

```
✅ write:packages      (패키지 저장소에 쓰기)
✅ read:packages       (패키지 저장소에서 읽기)
✅ delete:packages     (패키지 삭제 - 선택사항)
```

**토큰 정보:**

| 필드 | 값 |
|-----|-----|
| **Token name** | `GHCR_PUSH_TOKEN` |
| **Expiration** | 90 days (또는 원하는 기간) |
| **Selected scopes** | write:packages, read:packages |

4. **Generate token** 버튼 클릭
5. 생성된 토큰 복사 (나중에 다시 볼 수 없음!)

**예시 토큰:**
```
ghp_1234567890abcdefghijklmnop1234567890
```

**1-2) GitHub Secrets에 토큰 등록**

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**

**New repository secret** 클릭:

| 필드 | 값 |
|-----|-----|
| **Name** | `GHCR_TOKEN` |
| **Secret** | (위에서 복사한 토큰 붙여넣기) |

또한 username secret도 필요:

| 필드 | 값 |
|-----|-----|
| **Name** | `GHCR_USERNAME` |
| **Secret** | (GitHub username, 예: `yourname`) |

**1-3) 로컬에서 GHCR 로그인 테스트 (선택사항)**

로컬에서 토큰이 제대로 작동하는지 확인:

```bash
# 방법 1: 토큰으로 로그인
echo "ghp_1234567890abcdefghijklmnop1234567890" | \
  docker login ghcr.io -u yourname --password-stdin

# 또는 방법 2: 대화형 로그인
docker login ghcr.io
# Username: yourname
# Password: (위의 토큰 입력)

# 성공 메시지
# Login Succeeded
```

---

## 실습 2단계: docker/login-action 설정

### 목표
GitHub Actions workflow에서 GHCR에 자동으로 로그인하기

### 완료 기준
- Workflow 파일에 `docker/login-action` 설정됨
- GitHub Actions 실행 시 GHCR 로그인 단계 성공

### 단계별 작업

**2-1) Workflow 파일 수정**

`.github/workflows/docker-build.yml` 파일을 열고, build job 내에 로그인 단계 추가:

```yaml
name: Docker Build & Push

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

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

      # Step 2: Docker Buildx 설정
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # ✅ Step 3: GHCR 로그인 (새로 추가)
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ secrets.GHCR_USERNAME }}
          password: ${{ secrets.GHCR_TOKEN }}

      # Step 4: 메타데이터 생성
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: |
            ghcr.io/${{ github.repository_owner }}/my-app
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha,prefix={{branch}}-

      # Step 5: 이미지 빌드 & push (수정됨)
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true  # ✅ 이제 push: true로 변경
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**2-2) 주요 변경 사항**

| 항목 | 이전 (06-A-04) | 변경 후 (06-B-05) | 이유 |
|------|----------------|------------------|------|
| `push` | `false` | `true` | 빌드 후 GHCR에 push |
| `registry` | - | `ghcr.io` | GHCR 레지스트리 지정 |
| `images` | `my-registry.azurecr.io/my-app` | `ghcr.io/${{ github.repository_owner }}/my-app` | GitHub 레지스트리로 변경 |

**2-3) 문법 설명**

```yaml
${{ github.repository_owner }}
```

- GitHub Actions 내장 변수
- 저장소 소유자의 username 자동 입력
- 예: `yourname` (if personal repo) 또는 `organization-name` (if org repo)

**2-4) 로그인 액션 상세 설명**

```yaml
- name: Login to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io           # GHCR 레지스트리 (기본값)
    username: ${{ secrets.GHCR_USERNAME }}  # GitHub username
    password: ${{ secrets.GHCR_TOKEN }}     # Personal Access Token
```

| 파라미터 | 설명 | 예시 |
|---------|------|------|
| `registry` | Docker 레지스트리 주소 | `ghcr.io`, `docker.io`, `azurecr.io` |
| `username` | 인증 사용자명 | GitHub username |
| `password` | 인증 토큰/비밀번호 | Personal Access Token |

---

## 실습 3단계: 이미지 태깅 전략 설정

### 목표
빌드된 이미지에 의미 있는 태그를 붙여 버전 관리하기

### 완료 기준
- 이미지가 여러 태그로 저장됨 (branch, commit hash 등)
- 각 태그의 용도를 이해

### 단계별 작업

**3-1) 태깅 전략 이해**

GHCR에 push될 때 이미지가 여러 태그로 저장됨:

```yaml
tags: |
  type=ref,event=branch              # main, develop 브랜치명
  type=semver,pattern={{version}}    # v1.0.0 형식 (git tag)
  type=sha,prefix={{branch}}-        # main-abc123def (commit hash)
```

**결과 예시:**

```
ghcr.io/yourname/my-app:main              # 현재 main 브랜치
ghcr.io/yourname/my-app:develop           # 현재 develop 브랜치
ghcr.io/yourname/my-app:v1.0.0            # git tag가 있으면
ghcr.io/yourname/my-app:main-abc123def    # 현재 commit hash
ghcr.io/yourname/my-app:latest            # 가장 최신 (선택사항)
```

**3-2) 태깅 전략 상세 설명**

| 태그 유형 | 설명 | 언제 사용? |
|---------|------|----------|
| `type=ref,event=branch` | 브랜치명 태그 (main, develop) | 개발 중 최신 이미지 |
| `type=semver` | Semantic 버전 태그 (v1.0.0) | 릴리스 버전 고정 |
| `type=sha` | Commit hash 기반 태그 | 정확한 소스 추적 |
| `type=raw` | 사용자 정의 태그 (latest) | 항상 최신 버전 |

**3-3) 프로덕션 권장 태깅 전략**

실무에서 자주 사용되는 설정:

```yaml
- name: Extract metadata
  id: meta
  uses: docker/metadata-action@v5
  with:
    images: ghcr.io/${{ github.repository_owner }}/my-app
    tags: |
      # 1. 브랜치명 (개발/스테이징용)
      type=ref,event=branch

      # 2. 릴리스 버전 (프로덕션용)
      type=semver,pattern={{version}}
      type=semver,pattern={{major}}.{{minor}}

      # 3. Commit hash (추적 목적)
      type=sha,prefix={{branch}}-,suffix=-{{date 'YYYYMMDD'}}

      # 4. Latest 태그 (main 브랜치만)
      type=raw,value=latest,enable={{is_default_branch}}
```

**결과:**
```
ghcr.io/yourname/my-app:main              (브랜치)
ghcr.io/yourname/my-app:1.0.0             (버전)
ghcr.io/yourname/my-app:1.0                (메이저.마이너)
ghcr.io/yourname/my-app:main-abc123-20260401  (commit + 날짜)
ghcr.io/yourname/my-app:latest             (최신, main일 때만)
```

---

## 실습 4단계: 이미지 빌드 & push 자동화

### 목표
GitHub Actions workflow가 자동으로 이미지를 빌드하고 GHCR에 push하기

### 완료 기준
- Git push 시 workflow 자동 실행
- 이미지 빌드 완료 (5~10분)
- GHCR에 여러 태그로 이미지 저장됨

### 단계별 작업

**4-1) 최종 Workflow 파일 확인**

`.github/workflows/docker-build.yml` 전체:

```yaml
name: Docker Build & Push

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # GHCR 로그인
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ secrets.GHCR_USERNAME }}
          password: ${{ secrets.GHCR_TOKEN }}

      # 메타데이터 & 태그 생성
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository_owner }}/my-app
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha,prefix={{branch}}-

      # 빌드 & push
      - name: Build and push Docker image to GHCR
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**4-2) 배포 워크플로우 로직**

```
Git push → GitHub Actions 실행
    ↓
docker/login-action → GHCR 로그인 (username + token)
    ↓
docker/metadata-action → 이미지 태그 생성
    ↓
docker/build-push-action → Docker 이미지 빌드 & GHCR에 push
    ↓
GHCR에 여러 태그로 저장 완료
```

---

## 실습 5단계: GHCR에 저장된 이미지 확인

### 목표
GitHub web UI에서 push된 이미지 확인하기

### 완료 기준
- GitHub 저장소의 Packages 섹션에서 이미지 확인
- 이미지의 여러 태그 확인
- 이미지 pull command 확인

### 단계별 작업

**5-1) GitHub 웹에서 확인**

1. GitHub 저장소 → **Packages** 탭 (또는 우측 사이드바 **Packages**)
2. 푸시된 이미지 이름 클릭 (예: `my-app`)
3. 이미지 상세 페이지:

```
Packages
├── my-app (Container image)
│   ├── Latest version: main (2 days ago)
│   ├── Total size: 450 MB
│   └── Visibility: Private
│
├── Tags:
│   ├── main          (sha: abc123def)
│   ├── develop       (sha: xyz789abc)
│   ├── v1.0.0        (sha: def456xyz)
│   └── main-abc123def
│
└── Pull command:
    docker pull ghcr.io/yourname/my-app:main
```

**5-2) 명령어로 확인 (로컬)**

```bash
# 1. 로컬에서 GHCR에 로그인 (이전에 했다면 생략 가능)
echo "ghp_1234567890..." | docker login ghcr.io -u yourname --password-stdin

# 2. 원격 레지스트리에서 이미지 메타데이터 확인
docker images ghcr.io/yourname/my-app:*

# 3. 원격 레지스트리의 모든 태그 확인
docker manifest inspect ghcr.io/yourname/my-app:main

# 예상 출력:
# {
#   "schemaVersion": 2,
#   "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
#   "config": {
#     "size": 7893,
#     "digest": "sha256:abc123def456..."
#   }
# }
```

**5-3) GitHub Actions 로그 확인**

1. GitHub 저장소 → **Actions** 탭
2. 최근 실행된 workflow 선택
3. `Build and push Docker image to GHCR` 단계의 로그:

```
...
#7 naming to ghcr.io/yourname/my-app:main
#7 naming to ghcr.io/yourname/my-app:main-abc123def
#7 pushing to registry
#7 pushing ghcr.io/yourname/my-app:main
#7 pushing layer sha256:abc123... 125MB
#7 pushing layer sha256:def456... 89MB
...
✅ Successfully pushed to GHCR!
```

---

## 실습 6단계: 배포 서버에서 이미지 pull 테스트

### 목표
배포 서버에서 GHCR의 이미지를 pull하고 실행할 수 있는지 확인

### 완료 기준
- 배포 서버(또는 로컬 테스트)에서 GHCR 이미지 pull 성공
- Docker 컨테이너 실행 성공

### 단계별 작업

**6-1) 배포 서버에서 GHCR 로그인**

배포 서버(Hetzner 등)에서 실행:

```bash
# 1. GHCR 로그인
docker login ghcr.io

# 프롬프트:
# Username: yourname
# Password: (Personal Access Token 입력)

# 성공 메시지:
# Login Succeeded

# 2. 로그인 정보 확인 (선택사항)
cat ~/.docker/config.json
```

**6-2) 이미지 pull 및 실행**

```bash
# 1. 이미지 pull
docker pull ghcr.io/yourname/my-app:main

# 예상 로그:
# main: Pulling from yourname/my-app
# 6c40cc604d8e: Pull complete
# a3ed95caeb02: Pull complete
# ...
# Digest: sha256:abc123def456...
# Status: Downloaded newer image for ghcr.io/yourname/my-app:main

# 2. 이미지 확인
docker images | grep ghcr.io
# REPOSITORY                        TAG    IMAGE ID      CREATED      SIZE
# ghcr.io/yourname/my-app           main   abc123def456  2 hours ago  450MB

# 3. 컨테이너 실행
docker run -d -p 3000:3000 --name my-app ghcr.io/yourname/my-app:main

# 4. 컨테이너 상태 확인
docker ps | grep my-app
# CONTAINER ID  IMAGE                             COMMAND  CREATED       STATUS
# xyz789abc123  ghcr.io/yourname/my-app:main      ...      2 min ago     Up 2 minutes

# 5. 앱 접속 테스트
curl http://localhost:3000
# (또는 브라우저에서 http://your-server-ip:3000)
```

**6-3) 트러블슈팅**

| 오류 | 원인 | 해결 방법 |
|------|------|---------|
| `Error response from daemon: unauthorized` | GHCR 로그인 실패 | `docker login ghcr.io` 재실행, 토큰 확인 |
| `image not found` | 이미지가 GHCR에 없음 | GitHub Actions 실행 상태 확인, push 로그 확인 |
| `port 3000 already in use` | 포트 충돌 | `docker run -p 8080:3000` 등으로 포트 변경 |
| `image pull timeout` | 네트워크 문제 | 배포 서버의 인터넷 연결 확인 |

---

## 핵심 요약

| 개념 | 설명 | 사용처 |
|------|------|--------|
| **GHCR** | GitHub Container Registry (Docker 이미지 저장소) | 빌드된 이미지 저장 |
| **PAT (Personal Access Token)** | GitHub 계정 인증용 토큰 | docker login 및 CI/CD 인증 |
| **docker/login-action** | GitHub Actions에서 Docker 레지스트리 로그인 | GHCR 또는 Docker Hub 접속 |
| **docker/metadata-action** | 이미지 태그 자동 생성 | branch, version, commit hash 태그 |
| **tag 전략** | 이미지 버전 관리 방법 | 개발/프로덕션 구분, 버전 추적 |

---

## 다음 단계

- ✅ 현재: GHCR에 push 자동화 완료
- ⏭️ 다음: **SSH 배포 Action 설정** → 빌드된 이미지를 배포 서버에 전달

---

## 참고 자료

- [GitHub Container Registry 공식 문서](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [docker/login-action](https://github.com/docker/login-action)
- [docker/build-push-action](https://github.com/docker/build-push-action)
- [docker/metadata-action](https://github.com/docker/metadata-action)
- [Personal Access Token 생성 가이드](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
