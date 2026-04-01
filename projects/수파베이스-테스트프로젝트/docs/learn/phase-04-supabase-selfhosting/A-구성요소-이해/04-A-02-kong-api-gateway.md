# 04-A-02 Kong API Gateway 역할 이해

> 유형: 개념 | 예상 소요 시간: 10분
> 이전: Supabase 전체 아키텍처 지도 | 다음: PostgREST 동작 원리

---

## 이 파일에서 배우는 것

Supabase에서 Kong이 왜 필요한지, 클라이언트 요청이 Kong을 거쳐 어떻게 각 서비스에 도달하는지 이해합니다.
API Gateway 패턴이 FE의 어떤 개념과 비슷한지 감을 잡습니다.

---

## 본문

### API Gateway란?

FE 개발에서 `middleware.ts`(Next.js)나 Express의 미들웨어 체인을 떠올려 보세요. 모든 요청이 먼저 미들웨어를 거치고, 거기서 인증 확인, 라우팅, 로깅 등을 처리한 뒤 실제 핸들러로 넘어갑니다.

API Gateway는 **서버 세계의 미들웨어 라우터**입니다. 클라이언트의 모든 요청을 한 곳에서 받아서 적절한 백엔드 서비스로 전달합니다.

### Supabase에서 Kong의 위치

```
클라이언트
   │
   │  https://your-domain.com/rest/v1/todos
   │  https://your-domain.com/auth/v1/signup
   │  https://your-domain.com/storage/v1/object/...
   │
   ▼
┌──────────────────────────────┐
│           Kong               │
│  (포트 8000에서 수신)         │
│                              │
│  /rest/v1/*   → PostgREST    │
│  /auth/v1/*   → GoTrue       │
│  /realtime/*  → Realtime     │
│  /storage/v1/*→ Storage      │
└──────────────────────────────┘
```

### Kong이 하는 일

| 역할 | 설명 | FE 비유 |
|---|---|---|
| **라우팅** | URL 경로를 보고 어떤 서비스로 보낼지 결정 | `next.config.js`의 `rewrites` |
| **인증 검증** | 요청 헤더의 JWT 토큰을 검증 | `middleware.ts`에서 세션 체크 |
| **Rate Limiting** | 과도한 요청 차단 | API 호출 횟수 제한 |
| **CORS 처리** | Cross-Origin 요청 허용/차단 | Express의 `cors()` 미들웨어 |

### Kong 설정 파일

Supabase의 Kong 설정은 `volumes/api/kong.yml` 파일에 정의되어 있습니다. 이 파일에서 각 서비스의 라우팅 규칙과 플러그인을 설정합니다.

```yaml
# kong.yml 구조 (간략화)
services:
  - name: rest        # PostgREST 서비스
    url: http://rest:3000
    routes:
      - paths: ["/rest/v1/"]

  - name: auth        # GoTrue 서비스
    url: http://auth:9999
    routes:
      - paths: ["/auth/v1/"]

  - name: storage     # Storage 서비스
    url: http://storage:5000
    routes:
      - paths: ["/storage/v1/"]
```

### 셀프호스팅에서 알아야 할 포인트

1. **Kong 컨테이너가 죽으면 전체 API가 불통**됩니다. 가장 중요한 컨테이너 중 하나입니다.
2. 외부에서 접근하는 **유일한 진입점**이 Kong입니다. PostgreSQL이나 PostgREST에 직접 접근하면 안 됩니다.
3. 나중에 Caddy(리버스 프록시)가 Kong 앞에 하나 더 붙습니다: `클라이언트 → Caddy(HTTPS) → Kong → 각 서비스`

### ANON key와 SERVICE key

Kong은 요청에 포함된 API 키(ANON key 또는 SERVICE key)를 보고 **권한 수준을 판단**합니다.

- **ANON key**: 일반 사용자용. RLS(Row Level Security) 정책 적용
- **SERVICE key**: 서버 사이드용. RLS 우회 가능 (관리자 권한)

이 키들은 Phase 4 그룹 B에서 직접 생성합니다.

---

## 핵심 정리

- Kong은 Supabase의 **단일 진입점(API Gateway)**으로, 모든 클라이언트 요청을 받아 적절한 서비스로 라우팅한다.
- URL 경로(`/rest/`, `/auth/`, `/storage/`)를 기준으로 PostgREST, GoTrue, Storage 등에 요청을 분배한다.
- ANON key / SERVICE key를 통해 **권한 수준**을 구분한다.

---

## 다음 파일 예고

Kong이 `/rest/v1/` 경로로 들어온 요청을 넘기는 대상인 PostgREST가 어떻게 DB 테이블을 자동으로 REST API로 만드는지 알아봅니다.
