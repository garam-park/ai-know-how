# 06-D-13: Slack / Discord 웹훅 알림 연결

**번호**: 06-D-13 | **타입**: 실습 | **학습 시간**: 약 25분

**이전 학습**: Uptime Kuma 설치 & 모니터 등록 (06-D-12)
**다음 학습**: Prometheus 개념 & Supabase 메트릭 수집 설정 (06-D-14)

---

## 개요

Uptime Kuma가 문제를 감지하면 자동으로 Slack 또는 Discord로 메시지를 보냅니다. 이는 **웹훅(webhook)**이라는 기술로 작동하며, 이벤트 발생 시 미리 정한 URL로 자동 POST 요청을 보내는 방식입니다.

### FE 개발자를 위한 비유

| 개념 | 폴링 방식 | 웹훅 방식 |
|------|---------|---------|
| **방식** | "상태 확인해?" → 계속 물어봄 | "상태 바뀌면 알려줄게" → 한 번만 등록 |
| **예시** | `setInterval()` 로 반복 확인 | `addEventListener()` 로 이벤트 리스닝 |
| **효율** | 비효율 (불필요한 요청 많음) | 효율적 (필요할 때만 실행) |
| **API 호출** | FE → 계속 백엔드 폴링 | 백엔드 → 이벤트 발생 시만 FE로 POST |

---

## 학습 목표

1. Discord / Slack 웹훅 URL 생성
2. Uptime Kuma에 웹훅 알림 채널 추가
3. 모니터 DOWN/UP 시 알림 테스트
4. 알림 메시지 커스터마이징 (선택사항)

---

## 실습: Discord 웹훅 설정

### Step 1: Discord 서버 및 채널 준비

1. Discord 개발자 서버 또는 팀 서버에 접속
2. 알림을 받을 채널 선택 (예: #alerts, #monitoring)
3. 채널명 옆 설정 아이콘 클릭 → **Integrations** → **Webhooks**

### Step 2: 웹훅 URL 생성

**Webhooks** 페이지에서:
1. **New Webhook** 클릭
2. 이름 설정: "Uptime Kuma"
3. 채널 선택: #alerts
4. **Copy Webhook URL** 클릭 - URL을 안전한 곳에 저장

예시:
```
https://discordapp.com/api/webhooks/1234567890/abcdefghijk...
```

**중요**: 이 URL은 누구에게도 공유하지 마세요. 누구든 이 URL로 메시지를 보낼 수 있습니다.

### Step 3: Uptime Kuma에서 Discord 알림 채널 추가

1. Uptime Kuma 대시보드 접속 (`https://uptime.yourdomain.com`)
2. 좌측 메뉴 → **Notifications** 클릭
3. **Add Notification** 클릭

#### Discord 알림 채널 설정

```
Notification Type: Discord
Friendly Name: Discord Alerts
Discord Webhook URL: [Step 2에서 복사한 URL]
Display Name: 🚨 Uptime Alert
Icon Emoji: 🔔 (선택)
```

4. **Save** 클릭
5. **Test** 버튼 클릭 → Discord 채널에 테스트 메시지 도착 확인

### Step 4: 모니터에 알림 채널 연결

1. 좌측 메뉴 → **Monitors** 클릭
2. 각 모니터 (예: "Supabase API (REST)") 선택
3. **Notifications** 탭 → "Discord Alerts" 체크
4. **Save** 클릭

모든 모니터에 반복.

---

## 실습: Slack 웹훅 설정 (선택사항)

Slack을 선호한다면 다음 단계를 따르세요.

### Step 1: Slack 앱 생성

1. [Slack API Dashboard](https://api.slack.com/apps) 접속
2. **Create New App** → **From scratch** 선택
3. 앱 이름: "Uptime Kuma"
4. 워크스페이스 선택
5. **Create App** 클릭

### Step 2: 들어오는 웹훅(Incoming Webhooks) 활성화

좌측 메뉴에서:
1. **Incoming Webhooks** 선택
2. 토글 ON
3. **Add New Webhook to Workspace** 클릭
4. 알림을 받을 채널 선택 (예: #alerts)
5. **Allow** 클릭

**Webhook URL** 복사 - 예시:
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
```

### Step 3: Uptime Kuma에서 Slack 알림 채널 추가

1. Uptime Kuma 대시보드 → **Notifications** 클릭
2. **Add Notification** 클릭

#### Slack 알림 채널 설정

```
Notification Type: Slack
Friendly Name: Slack Alerts
Slack Webhook URL: [위에서 복사한 URL]
Bot Display Name: Uptime Kuma
Icon Emoji: 🔔
```

3. **Save** 클릭
4. **Test** 버튼으로 Slack 채널 확인

### Step 4: 모니터에 Slack 채널 연결

1. 각 모니터 선택
2. **Notifications** 탭 → "Slack Alerts" 체크
3. **Save** 클릭

---

## 알림 테스트

### 실제 다운 시뮬레이션 (테스트용)

모니터가 제대로 작동하는지 확인하려면:

#### 방법 1: 모니터 일시 중지

1. Uptime Kuma → Monitors → 모니터 선택
2. **Pause** 클릭 (또는 모니터 URL을 의도적으로 잘못된 것으로 변경)
3. Max Retries 동안 기다리기
4. Discord/Slack 메시지 수신 확인

예상 메시지:
```
🔴 Supabase API (REST) is DOWN
Last check: 2min ago
Uptime: 99.5%
```

#### 방법 2: 실제 테스트 버튼 사용

모니터 상세 화면의 **Test Notification** 버튼으로 즉시 알림 발송 가능.

### 모니터 복구 시 알림

모니터가 다시 UP 상태가 되면:

```
✅ Supabase API (REST) is UP
Last check: 1min ago
Response time: 234ms
Uptime: 99.6%
```

---

## 고급: 알림 메시지 커스터마이징

### Discord 메시지 포맷

Uptime Kuma는 기본적으로 다음 정보를 Discord에 포스팅합니다:

```
[모니터 이름] is [DOWN/UP]
Status Code: [HTTP 상태]
Response Time: [ms]
Uptime: [%]
```

### Slack 메시지 커스터마이징

Slack에서 더 정교한 포맷을 원한다면, **Notifications** 설정에서 **Slack JSON Payload** 옵션을 사용할 수 있습니다 (고급 기능).

기본값으로도 충분하므로 여기서는 생략합니다.

---

## 핵심 개념: 웹훅 동작 원리

### 웹훅 흐름도

```
┌─────────────┐ (1) 모니터 실행
│ Uptime Kuma │
└──────┬──────┘
       │
       ├─→ (2) API 체크: https://api.supabase.co/health
       │        ↓ 타임아웃 또는 500 에러
       │
       ├─→ (3) Max Retries 체크
       │        재시도 3회 다 실패
       │
       └─→ (4) 웹훅 발동
            POST https://hooks.slack.com/services/...

            Body:
            {
              "text": "🔴 Supabase API is DOWN",
              "attachments": [...]
            }

┌────────────────────┐
│ Slack / Discord    │ ← (5) 메시지 수신
│ (#alerts 채널)     │      자동 알림
└────────────────────┘
```

### 주요 특징

| 특징 | 설명 |
|------|------|
| **HTTP POST** | 웹훅은 JSON 본문을 포함한 HTTP POST 요청 |
| **비동기** | 알림 발송은 모니터링과 독립적으로 동작 |
| **재시도** | 웹훅 전송 실패 시 자동 재시도 (설정 가능) |
| **Rate Limiting** | Slack/Discord의 rate limit 자동 준수 |

---

## 트러블슈팅

### 알림이 안 옵니다

**확인사항:**

1. **웹훅 URL 유효성**
   ```bash
   # 웹훅 테스트 (curl)
   curl -X POST https://discordapp.com/api/webhooks/YOUR_URL \
     -H "Content-Type: application/json" \
     -d '{"content":"Test message"}'
   ```
   성공하면 Discord에 메시지 나타남.

2. **모니터 상태 확인**
   - Uptime Kuma 모니터 목록에서 실제로 DOWN 표시되는지 확인
   - Test 버튼으로 강제 알림 발송

3. **Uptime Kuma 로그 확인**
   ```bash
   docker-compose logs uptime-kuma | grep -i "webhook\|notification"
   ```

4. **방화벽/네트워크**
   - Uptime Kuma 컨테이너가 외부 인터넷 접근 가능한지 확인
   - Docker 네트워크 설정 재검토

### Discord 메시지가 이상합니다

- 웹훅 URL이 정확한지 다시 확인
- Discord 채널 권한 확인 (메시지 전송 권한 필수)

### Slack 연결 오류

- Workspace Admin 권한 필요 (앱 생성 시)
- 웹훅 URL에 오타가 있는지 확인

---

## 핵심 요약

| 항목 | 내용 |
|------|------|
| **웹훅이란** | 이벤트 발생 시 미리 등록한 URL로 POST 요청 보내기 |
| **Discord 설정** | Webhook URL 생성 → Uptime Kuma Notification 추가 → 모니터에 연결 |
| **Slack 설정** | Slack API > Incoming Webhooks > URL 생성 → 동일 과정 |
| **알림 조건** | 모니터 실패 × Max Retries 횟수 = DOWN 판정 후 웹훅 발동 |
| **복구 알림** | 모니터 다시 UP 상태 → 복구 알림 자동 발송 |
| **보안** | 웹훅 URL은 민감한 정보 - 절대 공개 저장소에 커밋 금지 |
| **테스트** | Uptime Kuma의 "Test" 버튼으로 즉시 확인 가능 |

---

## 다음 단계

이제 Uptime Kuma로 기본 모니터링과 알림을 설정했습니다.

다음 단계 06-D-14에서는 더 상세한 성능 메트릭을 수집하는 **Prometheus**를 설정합니다. Uptime Kuma는 "서비스가 온라인인가?"만 확인하지만, Prometheus는 "CPU는 몇 %? 메모리는? DB 응답 시간은?"같은 세부 정보를 수집합니다.

### 다음 학습을 위한 준비
- Docker Compose 파일 백업 (Prometheus 추가 전)
- Hetzner CX22 서버 여유 리소스 확인 (Prometheus + Grafana는 추가 리소스 필요)
