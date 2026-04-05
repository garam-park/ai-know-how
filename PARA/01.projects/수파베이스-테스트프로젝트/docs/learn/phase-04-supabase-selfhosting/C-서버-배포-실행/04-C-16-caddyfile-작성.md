# 04-C-16 Caddyfile 작성 — Reverse Proxy 설정

> 유형: 실습 | 예상 소요 시간: 20~25분
> 이전: Caddy 개념 & 설치 | 다음: 도메인 연결 & 자동 SSL 확인 (그룹 D)

---

## 이 파일에서 하는 것

Reverse Proxy(리버스 프록시)의 설정 파일 Caddyfile을 작성하여 외부 도메인을 Kong(API)과 Studio(관리 UI)로 연결합니다.

FE 개발에서 `next.config.js`의 `rewrites`로 API 경로를 리라우팅하듯이, Caddyfile은 **서버 레벨에서 URL을 리라우팅하는 선언적 설정**입니다.

---

## 사전 조건

- 서버에 Caddy가 설치되어 있음 (이전 단계 완료)
- Supabase 컨테이너가 실행 중 (Kong은 포트 8000, Studio는 포트 3000)
- 연결할 도메인 2개 준비 (예: `api.example.com`, `studio.example.com`)
- 도메인의 DNS 레코드가 서버 IP로 설정되어 있음 (다음 단계에서 확인)

---

## 실습

### Step 1: Caddyfile 위치 확인

Caddy의 설정 파일은 일반적으로 다음 위치에 있습니다.

```bash
# Caddyfile 위치 확인
sudo ls -l /etc/caddy/Caddyfile
```

만약 파일이 없다면:

```bash
# Caddyfile 생성 (빈 파일)
sudo touch /etc/caddy/Caddyfile
```

---

### Step 2: 기본 Caddyfile 구조 이해

Caddyfile의 기본 문법입니다. FE의 함수 문법이라고 생각하면 됩니다.

```
# 주석은 # 으로 시작

domain.com {
  # 이 블록 안에 domain.com의 설정이 들어감
  reverse_proxy localhost:3000
}
```

| 요소 | 설명 |
|---|---|
| **domain.com** | 들어오는 요청의 도메인 (Host 헤더 매칭) |
| **reverse_proxy** | 내부 주소로 요청을 넘기는 지시어 |
| **localhost:3000** | 요청을 보낼 내부 서버의 주소:포트 |

---

### Step 3: Kong(API)용 Caddyfile 작성

텍스트 에디터로 Caddyfile을 열어 Kong 설정을 추가합니다.

```bash
sudo nano /etc/caddy/Caddyfile
```

다음 내용을 입력합니다. (`api.example.com` 부분을 실제 도메인으로 바꾸세요)

```
# Supabase API Gateway (Kong) - 포트 8000
api.example.com {
  # Kong은 내부적으로 localhost:8000에서 수신
  reverse_proxy localhost:8000
}
```

> **FE 비유**: Next.js의 `rewrites`에서 `source: '/api/v1/*'` → `destination: 'http://api-server:8000/v1/*'`처럼 URL을 매핑하는 것과 동일합니다.

---

### Step 4: Studio(관리 UI)용 Caddyfile 추가

같은 Caddyfile에 Studio 설정도 추가합니다. nano 에디터에서 위 내용 아래에 다음을 입력합니다.

```
# Supabase Studio (관리자 UI) - 포트 3000
studio.example.com {
  reverse_proxy localhost:3000
}
```

이제 Caddyfile은 다음과 같은 형태여야 합니다:

```
api.example.com {
  reverse_proxy localhost:8000
}

studio.example.com {
  reverse_proxy localhost:3000
}
```

nano 에디터에서 저장하고 종료합니다:
- `Ctrl + O` (저장)
- `Enter` (파일명 확인)
- `Ctrl + X` (종료)

---

### Step 5: Caddyfile 포맷 검증

Caddyfile의 문법이 올바른지 확인합니다.

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
```

예상 출력:
```
✓ Config is valid
```

만약 오류가 나면 Caddyfile의 들여쓰기나 괄호를 다시 확인하세요.

---

### Step 6: 들여쓰기 자동 수정

Caddyfile 문법이 복잡해지면 들여쓰기 실수가 발생할 수 있습니다. `caddy fmt` 명령으로 자동 포맷팅합니다.

```bash
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
```

포맷된 파일 확인:

```bash
sudo cat /etc/caddy/Caddyfile
```

---

### Step 7: Caddy 설정 적용

Caddyfile을 수정한 후, Caddy가 이를 다시 로드하도록 합니다.

```bash
sudo caddy reload --config /etc/caddy/Caddyfile
```

예상 출력:
```
2026/04/01 10:00:00.000 INFO    using config from file    path=/etc/caddy/Caddyfile
```

> **reload vs restart**: `reload`는 설정만 다시 읽고 기존 연결은 유지합니다 (무중단). `restart`는 프로세스를 완전히 재시작합니다.

---

### Step 8: Caddy 상태 확인

Caddy 프로세스가 정상 실행되는지 확인합니다.

```bash
sudo systemctl status caddy
```

예상 출력:
```
● caddy.service - Caddy
   Loaded: loaded (/lib/systemd/system/caddy.service; enabled; vendor preset: enabled)
   Active: active (running) since Wed 2026-04-01 10:00:00 UTC; 30s ago
```

> `Active: active (running)` 상태여야 정상입니다.

---

### Step 9: 포트 수신 확인

Caddy가 HTTP/HTTPS 포트(80, 443)를 수신 중인지 확인합니다.

```bash
sudo netstat -tlnp | grep caddy
```

또는 최신 서버:

```bash
sudo ss -tlnp | grep caddy
```

예상 출력:
```
LISTEN  0  512  0.0.0.0:80          0.0.0.0:*  users:(("caddy",pid=1234,fd=X))
LISTEN  0  512  0.0.0.0:443         0.0.0.0:*  users:(("caddy",pid=1234,fd=X))
```

> 80(HTTP), 443(HTTPS)을 수신 중이면 정상입니다.

---

### Step 10: Kong 연결 테스트

curl로 Caddy를 통해 Kong에 접근 가능한지 테스트합니다.

```bash
# 로컬 서버에서 테스트 (도메인 DNS 설정 전)
curl -H "Host: api.example.com" http://localhost/rest/v1/
```

또는 도메인이 DNS에 등록되면:

```bash
# 원격 테스트
curl -X OPTIONS https://api.example.com/rest/v1/ -v
```

예상 응답:
```
HTTP/2 200
```

> Kong의 헬스 체크 응답이 200이면 연결 성공입니다.

---

### Step 11 (선택): WebSocket 프록시 설정 (Realtime 용)

Supabase Realtime은 WebSocket을 사용합니다. 만약 Realtime도 외부에서 접근해야 한다면:

```
realtime.example.com {
  reverse_proxy localhost:8001 {
    # WebSocket 헤더 설정
    header_up Connection "upgrade"
    header_up Upgrade "websocket"
  }
}
```

전체 Caddyfile:

```
api.example.com {
  reverse_proxy localhost:8000
}

studio.example.com {
  reverse_proxy localhost:3000
}

realtime.example.com {
  reverse_proxy localhost:8001 {
    header_up Connection "upgrade"
    header_up Upgrade "websocket"
  }
}
```

설정 후 reload:

```bash
sudo caddy reload --config /etc/caddy/Caddyfile
```

---

## 확인 방법

설정 완료 후 다음을 확인합니다.

1. **Caddyfile 문법 검증**
   ```bash
   sudo caddy validate --config /etc/caddy/Caddyfile
   ```
   ✓ Config is valid 가 나와야 함

2. **Caddy 프로세스 실행 확인**
   ```bash
   sudo systemctl status caddy
   ```
   Active: active (running) 상태여야 함

3. **포트 수신 확인**
   ```bash
   sudo ss -tlnp | grep caddy
   ```
   80과 443이 LISTEN 상태여야 함

4. **Kong 연결 확인** (도메인 DNS 설정 후)
   ```bash
   curl -X OPTIONS https://api.example.com/rest/v1/ -v
   ```
   HTTP 200 응답이 나와야 함

---

## 자주 겪는 오류

| 오류 메시지 | 원인 | 해결 |
|---|---|---|
| `Error parsing config: malformed` | 들여쓰기 오류 또는 괄호 불일치 | `sudo caddy fmt --overwrite /etc/caddy/Caddyfile` 실행 |
| `permission denied while trying to connect to the Docker daemon socket` | Caddy가 Kong(localhost:8000)에 접근 불가 | Kong 컨테이너가 실행 중인지 확인: `docker ps` |
| `context deadline exceeded` | Kong 응답이 너무 느림 (시간 초과) | Kong 로그 확인: `docker logs supabase-kong` |
| `connect: connection refused` | Kong 포트(8000)가 열리지 않음 | Kong 설정이나 컨테이너 상태 확인 |
| `502 Bad Gateway` | Caddy가 Kong에 연결했지만 Kong이 요청 처리 실패 | Kong의 라우팅 설정(`kong.yml`) 확인 |
| `error reloading config: unable to listen on port 80` | 포트 80이 이미 사용 중 | 다른 프로세스 확인: `sudo lsof -i :80` |
| `error reloading config: unable to listen on port 443` | 포트 443이 이미 사용 중 (보통 nginx, Apache) | `sudo systemctl stop nginx` 또는 다른 서비스 중지 |
| `tls: failed to obtain certificate` | HTTPS 설정 중 Let's Encrypt 인증서 발급 실패 (다음 단계) | 도메인 DNS 레코드가 올바른지 확인 |
| `DNS resolution failed` | 도메인이 서버 IP로 설정되지 않음 | DNS 레코드 (A 레코드) 확인: `dig api.example.com` |

---

## Caddyfile 고급 설정 (참고)

### 여러 도메인 한 번에 설정

```
api.example.com, api-backup.example.com {
  reverse_proxy localhost:8000
}
```

### 경로 기반 라우팅

```
example.com {
  handle /api/* {
    reverse_proxy localhost:8000
  }

  handle /studio/* {
    reverse_proxy localhost:3000
  }
}
```

### 헤더 추가

```
api.example.com {
  reverse_proxy localhost:8000 {
    header_up X-Forwarded-Host {host}
    header_up X-Forwarded-Proto {scheme}
  }
}
```

---

## 다음 파일 예고

다음 단계(그룹 D)에서는 도메인의 DNS 레코드를 확인하고, HTTPS 자동 설정(Let's Encrypt)이 정상 작동하는지 검증합니다.

- 도메인 DNS A 레코드 설정 확인
- `dig` 명령으로 DNS 조회 결과 확인
- Caddy 자동 인증서 발급 확인 (Let's Encrypt)
- 브라우저에서 https://api.example.com 접속 테스트
