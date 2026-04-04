# 04-C-12 서버에 Docker & Compose 설치

> 유형: 실습 | 예상 소요 시간: 15~20분
> 이전: 나머지 시크릿 설정 (Postgres 비밀번호 등) | 다음: Supabase compose 파일 서버에 올리기

---

## 이 파일에서 하는 것

Ubuntu 22.04 서버에 Docker Engine과 Docker Compose를 설치합니다. FE 개발 관점에서, npm/yarn이 로컬 패키지 런타임이듯 Docker는 서버에서 앱을 실행하는 런타임입니다. Supabase를 컨테이너로 배포하려면 필수입니다.

---

## 사전 조건

- Ubuntu 22.04 LTS 서버 (Hetzner Cloud CX22 권장)
- sudo 권한이 있는 사용자 계정
- 인터넷 연결

---

## 실습

### Step 1. 기존 Docker 버전 제거 (선택사항)

기존에 Docker가 설치되어 있다면 제거합니다. 처음 설치하는 경우 이 단계는 스킵 가능합니다.

```bash
sudo apt-get remove docker docker-engine docker.io containerd runc
```

> 경고가 나와도 괜찮습니다. 설치되지 않은 패키지는 자동으로 스킵됩니다.

### Step 2. apt 저장소 설정

Docker 공식 저장소를 등록합니다. 이는 npm registry처럼 공식 Docker 이미지를 받기 위한 설정입니다.

먼저 필요한 도구를 설치합니다.

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release
```

> `ca-certificates`: HTTPS 통신 시 인증서 검증
> `curl`: 웹에서 파일 다운로드
> `gnupg`: GPG 서명 검증 (보안)
> `lsb-release`: Ubuntu 버전 정보

### Step 3. Docker GPG 키 등록

Docker의 서명을 검증하기 위한 공개 키를 등록합니다.

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

> `fsSL`: curl 옵션 (-f: 에러 시 실패, -s: 진행 표시 없음, -S: 에러는 표시, -L: 리다이렉트 따라가기)

### Step 4. Docker 저장소 추가

apt가 Docker 저장소에서 패키지를 받도록 설정합니다.

```bash
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

> `lsb_release -cs`: 현재 Ubuntu 릴리스명 (jammy, focal 등)을 자동으로 입력합니다.

### Step 5. Docker Engine 설치

apt 인덱스를 갱신하고 Docker를 설치합니다.

```bash
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

> `docker-ce`: Docker Community Edition (엔진)
> `docker-ce-cli`: Docker 명령어 도구
> `containerd.io`: 컨테이너 런타임
> `docker-buildx-plugin`: 멀티 플랫폼 이미지 빌드 (필수는 아니지만 권장)
> `docker-compose-plugin`: Docker Compose V2 플러그인

### Step 6. Docker 설치 확인

Hello World 이미지를 실행하여 Docker가 정상 작동하는지 확인합니다.

```bash
sudo docker run hello-world
```

예상 출력:
```
Hello from Docker!
This message shows that your installation appears to be working correctly.
...
```

> 첫 실행 시 `hello-world` 이미지를 다운로드하므로 몇 초 걸립니다.

### Step 7. Docker Compose 설치 확인

Docker Compose V2 버전을 확인합니다.

```bash
docker compose version
```

예상 출력:
```
Docker Compose version v2.xx.x, build xxxxxxxx
```

> V2 이상이 설치되었으면 OK입니다. (V1과 문법이 다르므로 주의)

### Step 8. 현재 사용자를 docker 그룹에 추가 (선택: sudo 없이 실행하려면)

매번 `sudo`를 입력하지 않으려면 현재 사용자를 docker 그룹에 추가합니다.

```bash
sudo usermod -aG docker $USER
```

이후 새 터미널 세션에서부터 적용됩니다. (로그아웃 후 다시 접속)

```bash
# 재로그인 후 확인
docker ps
```

> 주의: docker 그룹의 사용자는 root 권한과 동등하므로 신뢰할 수 있는 사용자만 추가하세요.

---

## 확인 방법

설치 완료 후 다음 세 가지를 확인합니다.

1. **Docker 버전 확인**
   ```bash
   docker --version
   ```
   Docker version 20.10 이상이면 OK

2. **Docker 데몬 상태 확인**
   ```bash
   sudo systemctl status docker
   ```
   `active (running)` 상태여야 함

3. **Docker Compose 버전 확인**
   ```bash
   docker compose version
   ```
   `Docker Compose version v2.x.x` 이상이면 OK

---

## 자주 겪는 오류

| 오류 메시지 | 원인 | 해결 |
|---|---|---|
| `Got permission denied while trying to connect to the Docker daemon socket` | docker 그룹에 추가되지 않음 (sudo 없이 실행하려고 함) | `sudo docker` 로 실행하거나 Step 8 실행 후 로그아웃/로그인 |
| `E: The following signatures couldn't be verified because the public key is not available` | Docker GPG 키 등록 실패 | Step 3 재실행, 또는 `sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys <KEY_ID>` 사용 |
| `curl: (7) Failed to connect to download.docker.com` | 인터넷 연결 문제 또는 방화벽 차단 | 인터넷 연결 확인, 또는 VPN 사용 |
| `docker: command not found` | Docker CLI 설치 안 됨 | Step 5 재실행 또는 `sudo apt-get install docker-ce-cli` |
| `docker compose: command not found` | Docker Compose 플러그인 설치 안 됨 | `sudo apt-get install docker-compose-plugin` |
| `Cannot connect to Docker daemon` | Docker 데몬이 실행되지 않음 | `sudo systemctl start docker` |

---

## 다음 파일 예고

다음에는 Supabase compose.yml 파일을 서버에 업로드하고 환경 설정을 완료합니다.
