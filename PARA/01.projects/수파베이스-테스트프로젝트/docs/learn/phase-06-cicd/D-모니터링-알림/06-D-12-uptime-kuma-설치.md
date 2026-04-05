# 06-D-12: Uptime Kuma 설치 & 모니터 등록

**번호**: 06-D-12 | **타입**: 실습 | **학습 시간**: 약 30분

**이전 학습**: CI 파이프라인에서 Migration 자동 적용 (06-C-11)
**다음 학습**: Slack / Discord 웹훅 알림 연결 (06-D-13)

---

## 개요

**Uptime Kuma**는 자체 호스팅 모니터링 서비스로, Vercel의 status page처럼 서버와 애플리케이션이 온라인 상태인지 지속적으로 확인합니다.

Uptime Kuma 없이 Supabase가 다운되더라도 당신의 Slack에서 누가 알려주지 않습니다. Uptime Kuma를 사용하면 문제가 발생하면 즉시 Discord나 Slack으로 알림을 받을 수 있습니다.

### FE 개발자를 위한 비유

| 개념 | FE에서 | 백엔드 모니터링 |
|------|--------|-------------|
| **상태 확인** | `fetch('/api/health')` 주기적 호출 | HTTP GET 요청으로 엔드포인트 헬스 체크 |
| **응답 시간** | `performance.measure()` | 응답 시간 측정 (느린 API 감지) |
| **다운타임 감지** | 404 또는 타임아웃 캐치 | HTTP 상태 코드 모니터링 |
| **알림** | 사용자 UI에 에러 표시 | 관리자에게 자동 통지 |
| **대시보드** | 개발자 도구 Network 탭 | Uptime Kuma 웹 UI |

---

## 학습 목표

1. Docker Compose로 Uptime Kuma 설치 및 실행
2. Supabase 주요 엔드포인트 모니터링 설정
3. 모니터 체크 간격 및 실패 임계값 구성
4. 상태 페이지 생성 및 공유 방법 이해

---

## 실습: Uptime Kuma 설치 및 설정

### Step 1: docker-compose.yml에 Uptime Kuma 추가

기존 docker-compose.yml 파일에 Uptime Kuma 서비스를 추가합니다.

```bash
# 먼저 현재 docker-compose.yml 확인
cat ~/docker-compose.yml
```

아래 내용을 docker-compose.yml에 추가합니다 (PostgreSQL, Supabase 다음에):

```yaml
  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: uptime-kuma
    restart: always
    volumes:
      - uptime-kuma-data:/app/data
    ports:
      - "3001:3001"
    networks:
      - default
    environment:
      - TZ=Asia/Seoul
```

volumes 섹션에도 추가:

```yaml
volumes:
  uptime-kuma-data:
```

### Step 2: Uptime Kuma 컨테이너 시작

```bash
docker-compose up -d uptime-kuma
```

로그 확인:

```bash
docker-compose logs -f uptime-kuma
```

"Listening on 0.0.0.0:3001" 메시지가 보일 때까지 기다립니다.

### Step 3: Caddy 리버스 프록시 설정

Caddyfile을 열어 Uptime Kuma를 공개 URL로 노출합니다:

```bash
nano /etc/caddy/Caddyfile
```

다음 블록을 추가 (기존 항목 아래):

```
uptime.yourdomain.com {
    reverse_proxy localhost:3001
    encode gzip
}
```

Caddy 리로드:

```bash
sudo systemctl reload caddy
```

### Step 4: 초기 설정 및 로그인

1. 브라우저에서 `https://uptime.yourdomain.com` 접속 (또는 로컬에서는 `http://localhost:3001`)
2. 계정 생성 (초기 사용자만 가능)
   - 사용자명: admin
   - 비밀번호: 강력한 비밀번호 설정
3. 로그인

### Step 5: Supabase API 모니터링 추가

Uptime Kuma 대시보드에서 **Add Monitor** 클릭.

#### 모니터 1: Supabase REST API 헬스 체크

```
Monitor Type: HTTP(s)
Friendly Name: Supabase API (REST)
URL: https://your-project.supabase.co/rest/v1/health
Method: GET
Timeout: 10 seconds
Interval: 60 (매 1분마다 체크)
Max Retries: 1
Expected Status Code: 200
```

**저장 후 테스트 클릭** - 즉시 상태 확인 가능

#### 모니터 2: Supabase Auth 엔드포인트

```
Monitor Type: HTTP(s)
Friendly Name: Supabase Auth
URL: https://your-project.supabase.co/auth/v1/health
Method: GET
Timeout: 10 seconds
Interval: 60
Max Retries: 1
Expected Status Code: 200
```

#### 모니터 3: Supabase Studio (웹 UI)

```
Monitor Type: HTTP(s)
Friendly Name: Supabase Studio
URL: https://app.supabase.com
Method: GET
Timeout: 15 seconds
Interval: 300 (5분마다)
Max Retries: 2
Expected Status Code: 200
```

#### 모니터 4: 데이터베이스 TCP 연결

```
Monitor Type: TCP
Friendly Name: Supabase DB (TCP)
Hostname: your-project.supabase.co
Port: 5432
Timeout: 5 seconds
Interval: 120 (2분마다)
Max Retries: 1
```

### Step 6: 상태 페이지 생성

1. Uptime Kuma 좌측 메뉴에서 **Status Page** 클릭
2. **Create Status Page** 클릭
3. 설정:
   - Slug: `status` (URL: `uptime.yourdomain.com/status`)
   - Title: "Supabase Infra Status"
   - Description: "실시간 시스템 상태 모니터"
   - Theme: Dark (또는 선호하는 테마)

4. 각 모니터를 상태 페이지에 추가
   - 좌측 "Monitors" 섹션에서 위에서 만든 4개 모니터 체크

5. **Save** 클릭

### Step 7: 상태 페이지 공유

상태 페이지 URL: `https://uptime.yourdomain.com/status`

이 URL을 공개하면:
- 팀원들이 시스템 상태 실시간 확인 가능
- API 다운 시 "Investigating" 상태 수동 업데이트 가능
- 사건(Incident) 관리 및 히스토리 추적 가능

### Step 8: 설정 확인 및 최적화

#### 모니터 설정 검증

```bash
# Uptime Kuma 데이터베이스 확인
docker-compose exec uptime-kuma sqlite3 /app/data/kuma.db ".tables"
```

#### 권장 설정값

| 설정 | 값 | 이유 |
|------|-----|------|
| **REST API 체크 간격** | 60초 | API 응답성 중시 |
| **DB TCP 체크 간격** | 120초 | 과도한 연결 방지 |
| **Max Retries** | 1-2회 | 일시적 오류로 인한 알림 방지 |
| **Timeout** | REST: 10초, DB: 5초 | 실제 다운과 지연 구분 |

---

## 핵심 개념: Uptime Kuma 동작 원리

### Pull 기반 모니터링

```
┌─────────────┐         매 60초마다          ┌──────────────┐
│ Uptime Kuma │ ──────────────────────────→ │ Supabase API │
│ (모니터)    │                             │ (엔드포인트) │
└─────────────┘ ←──────────────────────────  └──────────────┘
               HTTP 200 OK 또는 타임아웃 수신
```

1. **Uptime Kuma**가 주기적으로 (예: 60초마다) Supabase로 HTTP 요청 전송
2. **응답 수신** → 상태 코드, 응답 시간, 데이터 크기 기록
3. **실패 감지** → Max Retries 횟수 만큼 재시도 후에도 실패 시 알림 트리거
4. **히스토리 저장** → SQLite 데이터베이스에 모든 체크 결과 저장

### 알림 조건

```
연속 실패 횟수 >= Max Retries
              ↓
            알림 발송
          (Slack, Discord 등)
              ↓
        모니터 상태: DOWN
```

---

## 핵심 요약

| 항목 | 내용 |
|------|------|
| **설치 방법** | Docker Compose로 louislam/uptime-kuma:1 이미지 실행 |
| **접근 URL** | Caddy 리버스 프록시를 통해 `https://uptime.yourdomain.com` 공개 |
| **모니터링 대상** | REST API, Auth, Studio, Database TCP 4개 엔드포인트 |
| **체크 주기** | REST API 60초, Database 120초 |
| **실패 임계값** | Max Retries 1-2회 이후 알림 |
| **상태 페이지** | 공개 URL로 팀원들과 공유 가능 |
| **데이터 저장** | Docker volume (uptime-kuma-data)에 SQLite 저장 |
| **보안** | Caddy가 HTTPS 자동으로 처리, 강력한 초기 비밀번호 필수 |

---

## 다음 단계

다음 학습 06-D-13에서는 이 모니터들이 감지한 문제를 **Slack과 Discord로 즉시 알리는** 웹훅 연결을 설정합니다.

모니터링 없이 알림이 없다면, Supabase가 다운되어도 몇 시간 후에야 알게 됩니다. 알림 설정으로 문제에 재빨리 대응할 수 있게 됩니다.

### 준비 사항
- Slack 워크스페이스 또는 Discord 서버 접근 권한
- 웹훅 URL 생성 가능한 관리자 권한
