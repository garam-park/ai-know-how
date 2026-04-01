# 04-A-01 Supabase 전체 아키텍처 지도

> 유형: 개념 | 예상 소요 시간: 10분
> 이전: — (첫 번째 파일) | 다음: Kong API Gateway 역할 이해

---

## 이 파일에서 배우는 것

Supabase가 내부적으로 어떤 서비스들로 구성되어 있는지 전체 그림을 파악합니다.
"Supabase = 여러 오픈소스 도구의 조합"이라는 핵심 개념을 이해합니다.

---

## 본문

### Supabase는 하나의 프로그램이 아니다

FE 개발자에게 익숙한 비유로 설명하면, Supabase는 **모노레포(monorepo) 안에 여러 마이크로서비스가 돌아가는 구조**입니다. Next.js 앱 하나가 아니라, 여러 독립 서버가 Docker 컨테이너로 묶여서 함께 동작하는 형태입니다.

### 주요 구성요소 한눈에 보기

```
클라이언트 (브라우저/앱)
        │
        ▼
   ┌─────────┐
   │  Kong    │  ← API Gateway (라우터 역할)
   └────┬────┘
        │
   ┌────┴────────────────────────────┐
   │         │          │            │
   ▼         ▼          ▼            ▼
PostgREST  GoTrue   Realtime     Storage
 (REST API) (Auth)  (WebSocket)  (파일 저장)
   │         │          │            │
   └────┬────┘──────────┘────────────┘
        │
        ▼
   ┌──────────┐
   │ PostgreSQL│  ← 모든 데이터의 중심
   └──────────┘

   ┌──────────┐
   │  Studio   │  ← 관리 대시보드 (웹 UI)
   └──────────┘    위 모든 서비스에 연결하여 관리
```

> **참고:** 이 문서에서는 핵심 7개 서비스만 다룹니다. Supabase에는 Edge Functions, Webhooks 등 추가 서비스도 있지만, 셀프호스팅 기본 구성에 포함되지 않으므로 여기서는 생략합니다.

### 각 구성요소의 역할 요약

| 구성요소 | 역할 | FE 비유 |
|---|---|---|
| **PostgreSQL** | 핵심 데이터베이스. 모든 데이터가 여기에 저장됨 | `localStorage`의 서버 버전 (하지만 훨씬 강력) |
| **PostgREST** | DB 테이블을 자동으로 REST API로 노출 | Express 라우터가 자동 생성되는 것과 비슷 |
| **Kong** | 모든 요청을 받아서 적절한 서비스로 라우팅 | Next.js의 `middleware.ts` + API 라우팅 |
| **GoTrue** | 회원가입, 로그인, JWT 토큰 발급 담당 | NextAuth.js 같은 인증 라이브러리 |
| **Realtime** | DB 변경사항을 WebSocket으로 실시간 전달 | Socket.io 서버 |
| **Storage** | 이미지, 파일 등 오브젝트 스토리지 | Cloudinary나 S3 클라이언트 |
| **Studio** | 웹 기반 DB 관리 대시보드 | phpMyAdmin의 현대판 |

### 셀프호스팅에서 이 구조가 중요한 이유

Supabase Cloud를 쓸 때는 이 구성요소들을 신경 쓸 필요가 없습니다. 하지만 셀프호스팅에서는 **각 서비스의 컨테이너를 직접 관리**해야 합니다. 어떤 컨테이너가 죽으면 어떤 기능이 멈추는지 알아야 장애 대응이 가능합니다.

예를 들어:

- **GoTrue 컨테이너가 죽으면** → 로그인/회원가입 불가
- **PostgREST 컨테이너가 죽으면** → REST API 전체 불통
- **PostgreSQL이 죽으면** → 전체 서비스 다운

### docker-compose로 묶이는 방식

이 모든 서비스는 하나의 `docker-compose.yml` 파일로 정의됩니다. `docker compose up` 한 번이면 전체가 올라가고, `docker compose down`이면 전체가 내려갑니다. 이 파일은 Phase 4 그룹 B에서 상세히 분석합니다.

---

## 핵심 정리

- Supabase는 PostgreSQL, PostgREST, Kong, GoTrue, Realtime, Storage, Studio 등 **7개 이상의 서비스 조합**이다.
- 모든 요청은 **Kong(API Gateway)**을 거쳐 각 서비스로 라우팅된다.
- 셀프호스팅에서는 각 서비스가 **독립 Docker 컨테이너**로 돌아가며, 어떤 것이 죽으면 해당 기능이 멈춘다.

---

## 다음 파일 예고

Kong API Gateway가 구체적으로 어떤 역할을 하는지, 요청이 어떻게 라우팅되는지 살펴봅니다.
