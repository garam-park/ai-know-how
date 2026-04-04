# 06-B-06: SSH 배포 Action 설정 (appleboy/ssh-action)

| 속성 | 내용 |
|------|------|
| **번호** | 06-B-06 |
| **제목** | SSH 배포 Action 설정 (appleboy/ssh-action) |
| **유형** | 실습 (15~20분) |
| **이전** | GHCR에 push 자동화 (06-B-05) |
| **다음** | 서버 측 배포 쉘 스크립트 작성 (06-B-07) |

---

## 학습 목표

- SSH 키 쌍 생성 및 배포 서버에 등록하기
- GitHub Secrets에 SSH 개인 키 저장하기
- `appleboy/ssh-action`을 사용하여 원격 서버 명령 실행하기
- 배포 워크플로우에서 SSH를 통한 커뮤니케이션 구현하기
- SSH 배포의 보안 고려사항 이해하기

---

## 핵심 개념: FE 개발자를 위한 유추

FE 개발자가 SSH를 모르면 이렇게 비유할 수 있습니다:

```
SSH = 암호화된 원격 접속
    = VS Code의 Remote - SSH 확장으로 원격 서버 작업
    = GitHub의 SSH 키로 저장소 접근 (HTTPS 대신)

배포 자동화:
    CI (빌드)     →  SSH (원격 접속)  →  배포 서버 명령 실행
GitHub Actions → appleboy/ssh-action → deploy.sh 실행
```

**흐름:**
```
1. GitHub Actions에서 빌드 완료
2. SSH를 통해 배포 서버에 접속 (암호화된 연결)
3. 배포 서버에서 "docker pull && docker run" 명령 실행
4. 새 버전 배포 완료
```

---

## 실습 1단계: SSH 키 쌍 생성

### 목표
GitHub Actions가 배포 서버에 접속하기 위한 SSH 키 생성

### 완료 기준
- SSH 개인 키(private key) 생성
- SSH 공개 키(public key) 생성
- 키 쌍이 RSA 또는 ED25519 형식

### 단계별 작업

**1-1) 로컬 개발 환경에서 SSH 키 생성**

```bash
# SSH 키 생성 (ED25519 형식, 최신 권장)
ssh-keygen -t ed25519 -C "github-actions@deploy" -f ~/.ssh/deploy_rsa

# 프롬프트:
# Enter passphrase (empty for no passphrase): [엔터 (비번 없음)]
# Enter same passphrase again: [엔터]

# 또는 RSA 형식 (호환성 더 좋음)
ssh-keygen -t rsa -b 4096 -C "github-actions@deploy" -f ~/.ssh/deploy_rsa
```

**생성 결과:**

```
~/.ssh/deploy_rsa          (개인 키 - GitHub Secrets에 저장)
~/.ssh/deploy_rsa.pub      (공개 키 - 배포 서버에 저장)
```

**1-2) 키 파일 확인**

```bash
# 개인 키 내용 확인 (GitHub Secrets에 저장할 내용)
cat ~/.ssh/deploy_rsa

# 예상 출력:
# -----BEGIN OPENSSH PRIVATE KEY-----
# b3BlbnNzaC1rZXktdjEA...
# ... (중간 생략)
# -----END OPENSSH PRIVATE KEY-----
```

```bash
# 공개 키 내용 확인 (배포 서버의 authorized_keys에 저장)
cat ~/.ssh/deploy_rsa.pub

# 예상 출력:
# ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFrJ... github-actions@deploy
```

**1-3) 키 파일 권한 설정**

```bash
# 개인 키 권한 설정 (600 = 소유자만 읽기/쓰기)
chmod 600 ~/.ssh/deploy_rsa

# 공개 키 권한 설정 (644 = 소유자는 읽기/쓰기, 다른 사용자는 읽기)
chmod 644 ~/.ssh/deploy_rsa.pub

# 확인
ls -la ~/.ssh/deploy_rsa*
# -rw------- 1 user  group 3434 Apr  1 12:00 deploy_rsa
# -rw-r--r-- 1 user  group  739 Apr  1 12:00 deploy_rsa.pub
```

---

## 실습 2단계: 배포 서버에 공개 키 등록

### 목표
배포 서버가 GitHub Actions의 개인 키를 신뢰하도록 공개 키 등록

### 완료 기준
- 배포 서버의 `~/.ssh/authorized_keys`에 공개 키 추가
- SSH 접속 테스트 성공

### 단계별 작업

**2-1) 배포 서버에 공개 키 복사**

방법 1: `ssh-copy-id` 명령어 (권장, 가장 간단)

```bash
# root 사용자로 배포 서버에 공개 키 복사
ssh-copy-id -i ~/.ssh/deploy_rsa.pub root@deploy.example.com

# 프롬프트:
# root@deploy.example.com's password: [배포 서버 root 비번 입력]
# Number of key(s) added: 1
# Now try logging in with: "ssh -i ~/.ssh/deploy_rsa root@deploy.example.com"
```

방법 2: 수동으로 공개 키 추가

```bash
# 1. 배포 서버에 SSH 접속
ssh root@deploy.example.com

# 2. authorized_keys 파일에 공개 키 추가
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFrJ..." >> ~/.ssh/authorized_keys

# 3. 권한 설정
chmod 600 ~/.ssh/authorized_keys

# 4. 로그아웃
exit
```

**2-2) SSH 접속 테스트 (비밀번호 없이)**

```bash
# 개인 키로 배포 서버에 접속 (비밀번호 입력 안 함)
ssh -i ~/.ssh/deploy_rsa root@deploy.example.com

# 성공 메시지:
# root@deploy-server:~#

# 배포 서버에서 빠져나오기
exit
```

**2-3) 트러블슈팅**

| 오류 | 원인 | 해결 방법 |
|------|------|---------|
| `Permission denied (publickey)` | 공개 키가 authorized_keys에 없음 | 2-1 다시 실행 |
| `ssh: connect to host... Connection refused` | 배포 서버 SSH 서비스 비활성화 | 배포 서버에서 SSH 서비스 시작 |
| `WARNING: UNPROTECTED PRIVATE KEY FILE!` | 개인 키 권한이 너무 개방적 | `chmod 600 ~/.ssh/deploy_rsa` 실행 |
| `~/ssh/authorized_keys: No such file or directory` | .ssh 디렉토리 없음 | `mkdir -p ~/.ssh` 후 재시도 |

---

## 실습 3단계: GitHub Secrets에 SSH 개인 키 등록

### 목표
GitHub Actions가 배포 서버에 접속할 수 있도록 개인 키를 Secrets에 저장

### 완료 기준
- `SSH_PRIVATE_KEY` secret 등록
- `SERVER_HOST` 및 `SERVER_USER` secret 등록

### 단계별 작업

**3-1) GitHub Secrets 등록**

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**

**첫 번째 Secret: SSH 개인 키**

```
Name: SSH_PRIVATE_KEY
Secret: (다음 명령어로 복사한 전체 내용 붙여넣기)
```

개인 키 복사 (터미널):

```bash
cat ~/.ssh/deploy_rsa
```

전체 내용을 복사:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEA...
... (중간 생략) ...
-----END OPENSSH PRIVATE KEY-----
```

**두 번째 Secret: 배포 서버 주소**

```
Name: SERVER_HOST
Secret: deploy.example.com  (또는 IP 주소 192.168.1.100)
```

**세 번째 Secret: 배포 서버 사용자**

```
Name: SERVER_USER
Secret: root  (또는 다른 사용자명)
```

**세 번째 Secret (선택): SSH 포트**

```
Name: SERVER_PORT
Secret: 22  (기본값, 변경했다면 해당 포트 입력)
```

**3-2) Secrets 목록 확인**

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**

```
Repository secrets
├── SSH_PRIVATE_KEY     (클릭 후 값 보이지 않음 ✓ 보안됨)
├── SERVER_HOST         (deploy.example.com)
├── SERVER_USER         (root)
└── SERVER_PORT         (22)
```

---

## 실습 4단계: appleboy/ssh-action Workflow 작성

### 목표
GitHub Actions에서 `appleboy/ssh-action`을 사용하여 배포 서버에 명령 실행

### 완료 기준
- Deploy workflow 파일 작성 완료
- SSH를 통해 배포 서버에 연결되고 명령 실행 확인

### 단계별 작업

**4-1) Deploy Workflow 파일 작성**

`.github/workflows/deploy.yml` 생성:

```yaml
name: Deploy to Server

on:
  push:
    branches:
      - main
  workflow_dispatch:  # 수동 실행 가능

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # Step 1: 코드 체크아웃 (선택사항, SSH 명령에만 필요한 경우 생략 가능)
      - name: Checkout code
        uses: actions/checkout@v4

      # Step 2: 배포 서버에 SSH 접속 및 명령 실행
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SERVER_PORT }}

          # 배포 서버에서 실행할 명령어 (쉘 스크립트)
          script: |
            cd /opt/my-app
            docker pull ghcr.io/yourname/my-app:main
            docker-compose down
            docker-compose up -d
            docker ps
```

**4-2) appleboy/ssh-action 파라미터 설명**

| 파라미터 | 설명 | 예시 |
|---------|------|------|
| `host` | 배포 서버 주소 | `deploy.example.com` 또는 `192.168.1.100` |
| `username` | SSH 접속 사용자 | `root` 또는 `deploy` |
| `key` | SSH 개인 키 (전체 내용) | `-----BEGIN OPENSSH...` |
| `port` | SSH 포트 (선택사항) | `22` (기본값) |
| `script` | 배포 서버에서 실행할 명령어 | bash 스크립트 |
| `timeout` | 명령 실행 타임아웃 (선택사항) | `30s`, `5m` |
| `command_timeout` | 각 명령 타임아웃 (선택사항) | `10m` |

**4-3) Script 상세 설명**

```yaml
script: |
  cd /opt/my-app                                   # 앱 디렉토리로 이동
  docker pull ghcr.io/yourname/my-app:main        # 최신 이미지 다운로드
  docker-compose down                             # 기존 컨테이너 중지 & 삭제
  docker-compose up -d                            # 새 이미지로 컨테이너 시작
  docker ps                                        # 실행 중인 컨테이너 확인
```

각 줄은 bash 명령어이며, 하나라도 실패하면 배포 중단됨

**4-4) Secrets 변수 활용 패턴**

```yaml
host: ${{ secrets.SERVER_HOST }}        # GitHub Secrets에서 읽기
username: ${{ secrets.SERVER_USER }}    # GitHub Secrets에서 읽기
key: ${{ secrets.SSH_PRIVATE_KEY }}     # GitHub Secrets에서 읽기
port: ${{ secrets.SERVER_PORT }}        # GitHub Secrets에서 읽기
```

---

## 실습 5단계: 다중 명령어 및 조건부 실행

### 목표
더 복잡한 배포 로직을 구현하기 (헬스 체크, 롤백 등)

### 완료 기준
- 배포 전 헬스 체크
- 배포 실패 시 롤백 로직
- 배포 성공 시 알림

### 단계별 작업

**5-1) 헬스 체크를 포함한 배포 스크립트**

`.github/workflows/deploy.yml` 수정:

```yaml
- name: Deploy via SSH
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SERVER_HOST }}
    username: ${{ secrets.SERVER_USER }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    port: ${{ secrets.SERVER_PORT }}

    script: |
      set -e  # 오류 발생 시 즉시 중단

      # 배포 전 현재 상태 저장 (롤백용)
      echo "=== Saving current state for rollback ==="
      BACKUP_DIR="/opt/my-app/backup-$(date +%s)"
      mkdir -p $BACKUP_DIR
      docker images ghcr.io/yourname/my-app:main --format "{{.ID}}" > $BACKUP_DIR/image.id

      # 최신 이미지 pull
      echo "=== Pulling latest image ==="
      docker pull ghcr.io/yourname/my-app:main

      # 기존 컨테이너 중지
      echo "=== Stopping old container ==="
      cd /opt/my-app
      docker-compose down --remove-orphans || true

      # 새 이미지로 컨테이너 시작
      echo "=== Starting new container ==="
      docker-compose up -d

      # 헬스 체크 (30초 대기)
      echo "=== Health check ==="
      for i in {1..30}; do
        if curl -f http://localhost:3000/health 2>/dev/null; then
          echo "✓ Health check passed"
          break
        fi
        echo "Waiting... ($i/30)"
        sleep 1
      done

      # 헬스 체크 실패 시 롤백
      if ! curl -f http://localhost:3000/health 2>/dev/null; then
        echo "❌ Health check failed! Rolling back..."
        docker-compose down
        docker load < $BACKUP_DIR/image.tar.gz || true
        docker-compose up -d
        echo "Rollback completed"
        exit 1
      fi

      echo "✅ Deployment successful"
      docker ps
```

**5-2) 스크립트 주요 기능**

| 단계 | 목적 | 명령어 |
|------|------|--------|
| 상태 저장 | 롤백용 백업 생성 | `docker images ... > image.id` |
| 이미지 pull | 최신 이미지 다운로드 | `docker pull` |
| 컨테이너 중지 | 기존 컨테이너 제거 | `docker-compose down` |
| 컨테이너 시작 | 새 이미지로 시작 | `docker-compose up -d` |
| 헬스 체크 | 앱 정상 작동 확인 | `curl /health` (30초 대기) |
| 롤백 | 실패 시 이전 상태로 복구 | 저장한 상태 복원 |

---

## 실습 6단계: SSH 배포 테스트 및 모니터링

### 목표
실제 배포 workflow를 실행하고 결과 확인

### 완료 기준
- GitHub Actions Deploy workflow 수동 실행 성공
- 배포 서버에서 새 이미지 실행 확인
- 배포 로그 확인 가능

### 단계별 작업

**6-1) GitHub Actions에서 Deploy Workflow 수동 실행**

GitHub 저장소 → **Actions** → **Deploy to Server**

```
Deploy to Server (Workflow)
├── [Run workflow] 버튼 클릭
├── Branch: main
└── [Run workflow] 실행
```

**6-2) 배포 로그 확인**

GitHub Actions 탭 → Deploy to Server 선택 → 실행 상태 확인:

```
Deploy to Server (main)
├── Status: ✅ In progress (또는 ✅ Passed)
├── Duration: 2 min 34 sec
└── Logs:
    ├── Deploy via SSH
    │   ├── host: deploy.example.com
    │   ├── username: root
    │   ├── port: 22
    │   ├── Saving current state for rollback
    │   ├── Pulling latest image
    │   │   ├── ghcr.io/yourname/my-app:main
    │   │   ├── Pulling from yourname/my-app
    │   │   ├── Digest: sha256:abc123def456
    │   │   └── Status: Downloaded newer image
    │   ├── Stopping old container
    │   ├── Starting new container
    │   ├── Health check
    │   │   ├── Waiting... (1/30)
    │   │   ├── Waiting... (2/30)
    │   │   └── ✓ Health check passed
    │   └── ✅ Deployment successful
    │       ├── CONTAINER ID  IMAGE                           NAMES
    │       └── abc123def456  ghcr.io/yourname/my-app:main    my-app
    └── ✅ Success
```

**6-3) 배포 서버에서 확인 (선택사항)**

배포 서버에 SSH 접속해서 직접 확인:

```bash
# 1. 배포 서버에 접속
ssh root@deploy.example.com

# 2. 실행 중인 컨테이너 확인
docker ps
# CONTAINER ID  IMAGE                           STATUS        NAMES
# abc123def456  ghcr.io/yourname/my-app:main   Up 2 minutes  my-app

# 3. 컨테이너 로그 확인
docker logs -f my-app
# [서버 애플리케이션 로그]

# 4. 앱 접속 테스트
curl http://localhost:3000
# [HTML 응답 또는 API 응답]

# 5. 로그아웃
exit
```

**6-4) 배포 실패 시 디버깅**

| 오류 메시지 | 원인 | 해결 방법 |
|-----------|------|---------|
| `connection refused` | 배포 서버에 접속 불가 | Secrets의 SERVER_HOST 확인, 배포 서버 상태 확인 |
| `permission denied (publickey)` | SSH 공개 키 미등록 | 실습 2단계 재실행 |
| `command not found: docker-compose` | docker-compose 미설치 | 배포 서버에 docker-compose 설치 |
| `docker pull: no such image` | 이미지가 GHCR에 없음 | GHCR에 push 완료 확인 (06-B-05) |
| `Health check failed` | 앱이 /health 응답 안 함 | 배포 서버에서 `docker logs my-app` 확인 |

---

## 실습 7단계: SSH 배포 보안 고려사항

### 목표
SSH 배포의 보안 모범 사례 이해하기

### 완료 기준
- SSH 키 보안 정책 이해
- 배포 서버 방화벽 설정 확인

### 단계별 작업

**7-1) SSH 키 보안 체크리스트**

```
✅ SSH 개인 키 보안 관리
  ├─ GitHub Secrets에만 저장 (로컬 Git에 커밋하면 안 됨)
  ├─ .gitignore에 ~/.ssh/ 추가
  ├─ 개인 키 파일 권한 600으로 설정
  └─ 주기적으로 키 로테이션 (90일마다)

✅ 배포 서버 SSH 보안 설정
  ├─ SSH 기본 포트(22) 변경 (선택사항)
  ├─ 비밀번호 로그인 비활성화 (키 기반만 허용)
  ├─ root 직접 로그인 비활성화 (deploy 사용자 권장)
  └─ firewall으로 특정 IP에서만 22번 포트 허용

✅ SSH 설정 파일 확인
  ├─ 배포 서버: /etc/ssh/sshd_config 파일
  └─ 권장 설정:
      ├─ PermitRootLogin no       (root 로그인 금지)
      ├─ PasswordAuthentication no (비밀번호 로그인 금지)
      ├─ PubkeyAuthentication yes  (공개 키만 허용)
      └─ Port 22 (또는 다른 포트)
```

**7-2) GitHub Actions 보안 모범 사례**

```yaml
# ✅ 권장: Secrets 사용
script: |
  docker login ghcr.io -u ${{ secrets.GHCR_USERNAME }} \
    -p ${{ secrets.GHCR_TOKEN }}

# ❌ 위험: 코드에 직접 입력
script: |
  docker login ghcr.io -u myname -p ghp_1234567...
```

**7-3) 배포 서버 방화벽 설정**

Hetzner 또는 AWS의 보안 그룹 설정:

```
SSH (포트 22)
├─ 허용 출발지: GitHub Actions 서버 IP 범위
│   (또는 모든 출발지 * - 덜 안전)
└─ 허용 트래픽: TCP 22

HTTP/HTTPS (포트 80/443)
├─ 허용 출발지: 모든 곳 (0.0.0.0/0)
└─ 허용 트래픽: TCP 80, 443
```

**7-4) SSH 키 로테이션 프로세스**

90일마다 새 키 생성:

```bash
# 1. 새 키 생성
ssh-keygen -t ed25519 -C "github-actions-new" -f ~/.ssh/deploy_rsa_new

# 2. 배포 서버에 새 공개 키 추가
ssh-copy-id -i ~/.ssh/deploy_rsa_new.pub root@deploy.example.com

# 3. GitHub Secrets 업데이트
# → Settings → Secrets → SSH_PRIVATE_KEY 수정 (새 개인 키로 교체)

# 4. 이전 키 삭제
rm ~/.ssh/deploy_rsa{,.pub}

# 5. 배포 서버에서 이전 공개 키 제거
# → ~/.ssh/authorized_keys 에서 이전 키 라인 삭제
```

---

## 핵심 요약

| 개념 | 설명 | 사용처 |
|------|------|--------|
| **SSH 키 쌍** | 공개 키(배포 서버) + 개인 키(GitHub) | 원격 서버 인증 |
| **appleboy/ssh-action** | GitHub Actions SSH 실행 액션 | 배포 서버에 명령 실행 |
| **authorized_keys** | 배포 서버가 신뢰하는 공개 키 목록 | SSH 접속 인증 |
| **GitHub Secrets** | 개인 키를 암호화해서 저장 | 민감한 정보 보호 |
| **Health check** | 배포 후 앱 정상 작동 확인 | 자동 롤백 트리거 |

---

## 다음 단계

- ✅ 현재: SSH 배포 Action 설정 완료
- ⏭️ 다음: **서버 측 배포 쉘 스크립트 작성** → 더 복잡한 배포 로직 (docker-compose, 헬스 체크 등)

---

## 참고 자료

- [appleboy/ssh-action 공식 저장소](https://github.com/appleboy/ssh-action)
- [SSH 공개 키 인증 가이드](https://en.wikipedia.org/wiki/Public_key_infrastructure)
- [ssh-keygen 상세 설명서](https://linux.die.net/man/1/ssh-keygen)
- [GitHub Actions 보안 모범 사례](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [배포 서버 SSH 설정 (sshd_config)](https://linux.die.net/man/5/sshd_config)
