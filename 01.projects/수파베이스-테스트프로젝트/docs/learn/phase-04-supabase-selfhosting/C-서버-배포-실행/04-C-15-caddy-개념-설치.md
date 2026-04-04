# 04-C-15 Caddy 개념 & 설치

> 유형: 실습 | 예상 소요 시간: 20~25분
> 이전: 컨테이너 첫 실행 & 상태 확인 | 다음: Caddyfile 작성 (Reverse Proxy 설정)

---

## 이 파일에서 하는 것

Caddy는 리버스 프록시(Reverse Proxy) 소프트웨어입니다. Ubuntu 서버에 설치하고 기본 원리를 이해합니다. Caddy를 통해 클라이언트의 요청을 Docker 내부에서 실행 중인 Supabase로 안전하게 전달하고, 자동으로 HTTPS 인증서를 발급받게 됩니다.

---

## 리버스 프록시란?

### FE 개발자 관점에서의 비유

Next.js의 `next.config.js` 또는 `vercel.json`에서 `rewrites` 또는 proxy 설정을 본 적이 있나요?

```javascript
// Next.js 예시
rewrites: async () => {
  return {
    beforeFiles: [
      {
        source: '/api/:path*',
        destination: 'http://backend.internal:3000/api/:path*',
      },
    ],
  };
}
```

**Caddy는 서버 수준에서 이 역할을 합니다.**

- **클라이언트** → 요청 → **Caddy (80/443 포트)** → 요청 전달 → **Supabase (내부 포트)**
- 클라이언트는 Caddy만 보고, 실제 백엔드(Supabase)의 위치는 숨겨집니다.
- 이를 **리버스 프록시**라고 부릅니다.

### 리버스 프록시의 역할

1. **포트 관리**: 외부에서는 80(HTTP)/443(HTTPS)로 접근하지만, 내부적으로는 Supabase의 여러 포트로 분기
2. **HTTPS 자동화**: Let's Encrypt와 연동하여 SSL/TLS 인증서를 자동 발급·갱신
3. **요청 분산**: 여러 백엔드 서비스로 요청 로드 밸런싱 (필요시)
4. **보안**: 내부 서비스의 포트를 숨기고, WAF(Web Application Firewall) 역할도 가능

---

## 왜 Caddy를 선택하는가?

### Caddy vs Nginx

| 항목 | Caddy | Nginx |
|------|-------|-------|
| **설정 파일** | Caddyfile (직관적) | nginx.conf (복잡함) |
| **HTTPS 인증서** | 자동 발급·갱신 | 수동 설정 필요 |
| **설정 난이도** | FE 개발자도 쉬움 | DevOps 전문가 권장 |
| **성능** | 중간 (충분함) | 높음 (고트래픽용) |
| **커뮤니티** | 작지만 증가 중 | 매우 큼 |

**결론**: Supabase 셀프호스팅 같은 중소 규모 프로젝트에는 Caddy가 더 적합합니다.

---

## 사전 조건

- Ubuntu 22.04 LTS 서버 (Docker & Compose 설치 완료)
- sudo 권한이 있는 사용자 계정
- 인터넷 연결
- 도메인 (Caddy의 자동 HTTPS 기능을 사용하려면 필수)

---

## 실습

### Step 1. Caddy 저장소 추가

Caddy 공식 저장소를 등록합니다.

```bash
sudo apt-get update
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
```

Caddy GPG 키를 등록합니다.

```bash
curl -1sLf 'https://dl.caddy.community/package.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-archive-keyring.gpg
```

Caddy 저장소를 apt 소스에 추가합니다.

```bash
echo "deb [signed-by=/usr/share/keyrings/caddy-archive-keyring.gpg] https://dl.caddy.community/debian generic main" | sudo tee /etc/apt/sources.list.d/caddy-stable.list
```

> `signed-by`: 디지털 서명으로 패키지 무결성 검증

### Step 2. Caddy 설치

apt 인덱스를 갱신하고 Caddy를 설치합니다.

```bash
sudo apt-get update
sudo apt-get install -y caddy
```

### Step 3. Caddy 설치 확인

Caddy 버전을 확인합니다.

```bash
caddy version
```

예상 출력:
```
v2.7.x
```

> v2.0 이상이면 OK입니다.

### Step 4. Caddy 데몬 상태 확인

Caddy가 systemd 서비스로 자동 등록되었는지 확인합니다.

```bash
sudo systemctl status caddy
```

예상 출력:
```
● caddy.service - Caddy
     Loaded: loaded (/etc/systemd/system/caddy.service; enabled; vendor preset: enabled)
     Active: inactive (dead)
```

아직 실행되지 않은 상태입니다. 나중에 Caddyfile을 작성한 후 시작합니다.

### Step 5. 포트 확인

Caddy가 사용할 80번(HTTP)과 443번(HTTPS) 포트가 비어있는지 확인합니다.

```bash
sudo ss -tlnp | grep -E ':(80|443)'
```

아무 출력이 없으면 포트가 비어있는 것입니다. 만약 이미 사용 중이면 다른 서비스를 중단해야 합니다.

> `ss`: socket statistics (netstat의 최신 버전)
> `tlnp`: t(TCP), l(listening), n(numeric), p(process)

### Step 6. 기본 Caddyfile 생성 (임시)

나중에 작성할 Caddyfile의 디렉토리를 미리 생성합니다.

```bash
sudo mkdir -p /etc/caddy
sudo touch /etc/caddy/Caddyfile
```

> Caddy 설치 시 자동으로 생성되지만, 권한 설정을 위해 명시적으로 생성합니다.

### Step 7. Caddy 설정 디렉토리 권한 확인

Caddy가 설정을 읽고 HTTPS 인증서를 저장할 수 있도록 권한을 확인합니다.

```bash
sudo chown -R caddy:caddy /etc/caddy
sudo ls -la /etc/caddy
```

예상 출력:
```
drwxr-xr-x 2 caddy caddy 4096 Apr  1 12:34 .
```

---

## Caddy의 자동 HTTPS 원리

### Let's Encrypt 자동 인증서 발급

Caddy는 **Caddyfile에서 도메인을 지정하는 것만으로** 자동으로 Let's Encrypt에서 SSL/TLS 인증서를 발급받습니다.

**과정:**
1. 사용자가 Caddyfile에 도메인 지정 (예: `api.example.com`)
2. Caddy 시작 시 Let's Encrypt에 인증서 요청
3. Let's Encrypt가 도메인 소유 확인 (ACME challenge)
4. 인증서 자동 발급 (90일 유효)
5. 갱신 시기가 되면 자동으로 갱신

### FE 비유

**Vercel에 배포한 Next.js 앱:**
```
https://myapp.vercel.app
```

배포하는 순간 자동으로 HTTPS가 적용됩니다. 인증서 설정? 없습니다. Vercel이 대신 처리합니다.

**Caddy도 동일합니다:**
```
api.yourdomain.com {
  reverse_proxy localhost:8000
}
```

이 세 줄만으로:
- `yourdomain.com` 도메인에 HTTPS 자동 적용
- Let's Encrypt에서 인증서 자동 발급
- 90일마다 자동 갱신

---

## 확인 방법

설치 완료 후 다음 세 가지를 확인합니다.

1. **Caddy 버전 확인**
   ```bash
   caddy version
   ```
   `v2.x.x` 이상이면 OK

2. **Caddy 바이너리 위치 확인**
   ```bash
   which caddy
   ```
   `/usr/bin/caddy` 또는 `/usr/local/bin/caddy`로 표시되면 OK

3. **Caddy 서비스 등록 확인**
   ```bash
   sudo systemctl is-enabled caddy
   ```
   `enabled` 또는 `disabled`가 출력되면 OK

---

## 자주 겪는 오류

| 오류 메시지 | 원인 | 해결 |
|---|---|---|
| `E: The following signatures couldn't be verified` | Caddy GPG 키 등록 실패 | Step 1의 GPG 키 등록 재실행 |
| `caddy: command not found` | Caddy 바이너리가 PATH에 없음 | 로그아웃 후 재로그인, 또는 전체 경로로 실행 (`/usr/bin/caddy version`) |
| `listen tcp :80: bind: permission denied` | 80번 포트에 접근 권한 없음 | `sudo` 로 실행하거나, Caddy를 root 권한의 systemd 서비스로 실행 |
| `listen tcp :443: bind: permission denied` | 443번 포트에 접근 권한 없음 | 동일 (이미 다른 서비스가 점유 가능) |
| `failed to obtain certificate` | Let's Encrypt 인증서 발급 실패 | 도메인이 실제로 존재하고 DNS가 올바르게 설정되었는지 확인 |
| `ACME challenge timed out` | DNS 설정 문제 또는 Let's Encrypt 접근 불가 | 도메인의 A 레코드가 서버 IP를 가리키는지 확인 |
| `Caddyfile syntax error` | Caddyfile 문법 오류 | `caddy fmt` 로 형식 검사, 또는 다음 파일에서 예시 확인 |

---

## 다음 파일 예고

다음에는 Caddyfile을 작성하여 리버스 프록시를 구성합니다. Supabase의 여러 서비스(API, Auth, Realtime 등)를 도메인의 다양한 경로로 분기하는 방법을 배웁니다.
