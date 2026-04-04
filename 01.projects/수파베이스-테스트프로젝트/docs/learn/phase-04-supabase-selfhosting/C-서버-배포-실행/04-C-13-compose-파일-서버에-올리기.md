# 04-C-13 Supabase compose 파일 서버에 올리기

> 유형: 실습 | 예상 소요 시간: 15~20분
> 이전: 서버에 Docker & Compose 설치 | 다음: 컨테이너 첫 실행 & 상태 확인

---

## 이 파일에서 하는 것

Supabase 공식 저장소에서 Docker Compose 파일과 환경 설정 파일을 다운로드하여 서버에 업로드합니다. 이는 npm install을 하듯이, 로컬에서 프로젝트를 준비한 후 서버로 옮기는 과정입니다.

---

## 사전 조건

- 로컬 개발 머신에 git과 curl이 설치되어 있음
- 서버에 Docker & Docker Compose가 설치되어 있음 (이전 단계 완료)
- 서버에 SSH로 접속 가능
- 이전 그룹 B에서 생성한 시크릿 값들 (JWT_SECRET, ANON_KEY 등)을 준비해둠

---

## 실습

### Step 1: 로컬에서 Supabase 공식 파일 다운로드

Supabase 공식 GitHub 저장소에서 필요한 파일을 받아옵니다. 두 가지 방식 중 선택할 수 있습니다.

#### 방식 1: git clone (전체 저장소)

전체 저장소를 받고 싶다면:

```bash
git clone https://github.com/supabase/supabase.git
cd supabase/docker
```

이 방식은 Supabase의 모든 리소스를 다운로드하므로 시간이 오래 걸립니다.

#### 방식 2: curl로 필요한 파일만 다운로드 (권장)

필요한 파일만 빠르게 받으려면:

```bash
mkdir -p ~/supabase-selfhost
cd ~/supabase-selfhost

# docker-compose.yml 다운로드
curl -L https://raw.githubusercontent.com/supabase/supabase/master/docker/docker-compose.yml -o docker-compose.yml

# .env.example 다운로드
curl -L https://raw.githubusercontent.com/supabase/supabase/master/docker/.env.example -o .env.example
```

> **FE 비유**: npm install을 할 때, package.json과 package-lock.json만 있으면 되듯이, Supabase도 docker-compose.yml과 .env만 있으면 충분합니다.

### Step 2: 다운로드한 파일 확인

로컬에서 파일이 제대로 다운로드되었는지 확인합니다.

```bash
cd ~/supabase-selfhost
ls -la
```

다음 파일들이 보여야 합니다:
- `docker-compose.yml`
- `.env.example`

파일 내용을 간단히 확인:

```bash
# docker-compose.yml의 처음 20줄 확인
head -20 docker-compose.yml

# .env.example의 처음 20줄 확인
head -20 .env.example
```

### Step 3: 서버에 디렉토리 구조 생성

SSH로 서버에 접속하여 Supabase 파일들이 들어갈 디렉토리를 만듭니다.

```bash
# 서버에 접속
ssh user@your-server-ip

# Supabase 디렉토리 생성 (root 권한 필요할 수 있음)
sudo mkdir -p /opt/supabase
sudo chown $USER:$USER /opt/supabase

# 디렉토리 생성 확인
ls -ld /opt/supabase
```

> **참고**: `/opt/supabase` 경로는 관례입니다. 다른 경로 (예: `/home/user/supabase`) 사용 가능하며, 이 가이드에서는 `/opt/supabase` 기준으로 진행합니다.

### Step 4: 로컬에서 서버로 파일 전송

로컬 머신에서 다시 작업합니다. 준비된 파일들을 서버로 업로드합니다.

#### 방식 1: scp로 파일 전송 (간단함)

```bash
cd ~/supabase-selfhost

# docker-compose.yml 전송
scp docker-compose.yml user@your-server-ip:/opt/supabase/

# .env.example 전송
scp .env.example user@your-server-ip:/opt/supabase/
```

#### 방식 2: rsync로 전송 (권장 - 부분 동기화 가능)

```bash
cd ~/supabase-selfhost

rsync -avz --progress ./ user@your-server-ip:/opt/supabase/
```

> **차이점**: scp는 개별 파일을, rsync는 디렉토리 전체를 동기화합니다. rsync를 쓰면 파일이 많을 때 이미 전송된 파일은 스킵합니다.

### Step 5: 서버에서 파일 확인

서버에 다시 접속하여 파일이 제대로 올라갔는지 확인합니다.

```bash
ssh user@your-server-ip

cd /opt/supabase
ls -la
```

다음과 같이 보여야 합니다:
```
-rw-r--r-- 1 user user XXXX Apr  1 10:00 docker-compose.yml
-rw-r--r-- 1 user user XXXX Apr  1 10:00 .env.example
```

### Step 6: .env 파일 생성 및 시크릿 값 설정

`.env.example`을 `.env`로 복사합니다.

```bash
cd /opt/supabase

# .env 파일 생성
cp .env.example .env

# 파일 내용 확인
cat .env
```

이제 `.env` 파일을 편집하여 시크릿 값들을 설정합니다. 이전 그룹 B에서 생성한 값들을 입력합니다.

```bash
# 나노 에디터로 열기
nano .env
```

또는 sed를 사용하여 직접 설정할 수도 있습니다:

```bash
# JWT_SECRET 설정 (이전 단계에서 생성한 값 사용)
sed -i 's/^JWT_SECRET=.*/JWT_SECRET=your-jwt-secret-here/' .env

# ANON_KEY 설정
sed -i 's/^ANON_KEY=.*/ANON_KEY=your-anon-key-here/' .env

# SERVICE_ROLE_KEY 설정
sed -i 's/^SERVICE_ROLE_KEY=.*/SERVICE_ROLE_KEY=your-service-role-key-here/' .env
```

> **주의**: `your-jwt-secret-here` 등의 값을 실제 시크릿 값으로 교체해야 합니다. 이전 단계에서 생성한 값을 사용하세요.

확인:

```bash
# JWT 관련 설정 확인
grep "JWT_SECRET\|ANON_KEY\|SERVICE_ROLE_KEY" .env
```

### Step 7: 권한 설정

`.env` 파일의 권한을 제한합니다 (민감한 정보 보호).

```bash
cd /opt/supabase

chmod 600 .env
ls -la .env
```

결과:
```
-rw------- 1 user user XXX Apr  1 10:00 .env
```

> **보안**: 600 권한은 소유자만 읽고 쓸 수 있도록 제한합니다. 다른 사용자는 접근할 수 없습니다.

---

## 확인 방법

터미널에서 다음 명령어로 준비 상태를 확인합니다.

```bash
cd /opt/supabase

# 파일 목록 확인
ls -la

# docker-compose.yml의 서비스 이름 확인 (postgres, kong, studio 등이 보여야 함)
grep "^\s*[a-z].*:" docker-compose.yml | head -10

# .env 파일의 필수 환경변수 확인
grep -E "^(JWT_SECRET|ANON_KEY|SERVICE_ROLE_KEY|POSTGRES_PASSWORD)=" .env
```

모든 항목이 설정되어 있으면 준비 완료입니다.

---

## 자주 겪는 오류

| 오류 메시지 | 원인 | 해결 |
|---|---|---|
| `Permission denied` (docker-compose.yml 생성 시) | /opt/supabase 디렉토리 소유권이 다른 사용자 | `sudo chown $USER:$USER /opt/supabase` 실행 |
| `curl: (7) Failed to connect to raw.githubusercontent.com` | 인터넷 연결 문제 또는 GitHub 접근 불가 | VPN 확인, 방화벽 규칙 확인, 또는 git clone 방식 사용 |
| `scp: command not found` | 로컬 머신에 OpenSSH 미설치 | Windows: Git Bash 또는 PowerShell의 scp 사용, Mac/Linux: openssh-client 설치 |
| `Host key verification failed` (scp 시) | 처음으로 서버에 접속할 때 호스트 키 검증 | 서버에 먼저 SSH로 접속하여 `~/.ssh/known_hosts`에 등록 후 scp 시도 |
| `.env 파일이 없어서 컨테이너 실행 실패` | .env 파일을 생성하지 않고 .env.example만 있음 | `cp .env.example .env` 명령어 실행 |
| `POSTGRES_PASSWORD가 빈 값` | .env 파일에서 비밀번호를 설정하지 않음 | 이전 단계에서 생성한 안전한 비밀번호를 .env에 설정 |

---

## 다음 파일 예고

다음 단계에서는 준비된 compose 파일을 이용하여 Supabase 컨테이너를 첫 실행하고, 각 서비스의 상태를 확인합니다.

- `docker-compose up -d` 명령어로 컨테이너 시작
- `docker-compose ps`로 각 서비스 상태 확인
- 포트가 제대로 열렸는지 확인 (5432, 8000, 3000 등)
