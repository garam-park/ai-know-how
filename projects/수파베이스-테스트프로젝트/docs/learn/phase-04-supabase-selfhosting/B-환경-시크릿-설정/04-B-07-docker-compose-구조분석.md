# 04-B-07 공식 docker-compose.yml 전체 구조 분석

> 유형: 개념 | 예상 소요 시간: 10분
> 이전: Supabase Studio 이해 | 다음: .env 파일 필수 변수 목록 정리

---

## 이 파일에서 배우는 것

Supabase 공식 docker-compose.yml 파일이 어떻게 구성되어 있는지 배웁니다. 서비스들 간의 관계, 포트 매핑, 볼륨 구조를 이해하면 셀프호스팅 환경을 수정하거나 트러블슈팅할 때 훨씬 수월합니다.

---

## 본문

### docker-compose.yml의 역할

FE 개발자가 아는 개념으로 비유하면:
- **package.json의 dependencies**: 프로젝트에 필요한 라이브러리들과 버전을 정의
- **docker-compose.yml**: 애플리케이션에 필요한 서비스들(DB, API, 캐시 등)과 그들 간의 관계를 정의

docker-compose.yml은 "필요한 서비스들을 한 번에 띄우는 설정서"입니다.

### Supabase 공식 docker-compose.yml의 주요 서비스

Supabase가 동작하려면 다음 서비스들이 필요합니다:

```
┌─────────────────────────────────────────────────────────┐
│         Supabase Docker Compose Services               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  postgres (PostgreSQL 데이터베이스)                     │
│  └─ 모든 데이터가 저장되는 핵심 DB                      │
│                                                         │
│  kong (API 라우터)                                      │
│  └─ Express의 미들웨어 라우터처럼 요청을 분산           │
│     (REST API 요청 → PostgREST, Auth 요청 → Auth)      │
│                                                         │
│  postgrest (REST API 생성기)                            │
│  └─ PostgreSQL을 자동으로 REST API로 노출              │
│                                                         │
│  auth (인증 서비스)                                     │
│  └─ 회원가입, 로그인, JWT 토큰 발급                    │
│                                                         │
│  realtime (WebSocket 실시간 통신)                       │
│  └─ 클라이언트가 DB 변경사항을 실시간으로 감시         │
│                                                         │
│  storage (파일 저장소)                                  │
│  └─ 이미지, 문서 등 파일 저장 (S3처럼 동작)            │
│                                                         │
│  studio (관리 UI)                                       │
│  └─ 웹 브라우저에서 DB, 사용자, 파일을 관리            │
│                                                         │
│  vector (벡터 데이터베이스 - 선택사항)                  │
│  └─ AI 임베딩 저장 및 검색                             │
│                                                         │
│  edge (엣지 함수 - 선택사항)                            │
│  └─ CloudFlare Workers 같은 경량 함수 실행             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 서비스 간 의존성 (depends_on)

package.json의 dependencies처럼, 서비스들도 서로 의존합니다:

```
✓ postgres 는 독립적 (다른 서비스가 필요 없음)
✓ kong은 postgrest, auth, realtime이 준비될 때까지 대기
✓ postgrest는 postgres가 준비될 때까지 대기
✓ auth도 postgres가 준비될 때까지 대기
✓ realtime도 postgres가 준비될 때까지 대기
✓ storage는 postgres와 kong이 준비될 때까지 대기
✓ studio는 모든 서비스가 준비된 후에 시작
```

**왜 이런 순서가 중요한가?**
- kong이 postgrest 없이 시작되면 요청을 보낼 곳이 없음
- postgrest가 postgres 없이 시작되면 DB에 연결할 수 없음

### 포트 매핑 (ports)

"호스트 포트:컨테이너 포트" 형식입니다:

| 서비스 | 호스트 포트 | 용도 |
|--------|-----------|------|
| postgres | 5432 | SQL 클라이언트(psql, DBeaver)에서 직접 연결 |
| kong | 8000 | REST API 요청 (http://localhost:8000) |
| kong | 8443 | HTTPS API 요청 (https://localhost:8443) |
| studio | 3000 | 관리 UI (http://localhost:3000) |
| realtime | 4000 | WebSocket 연결 (ws://localhost:4000) |
| storage | (kong을 통해 제공) | /storage/v1 경로로 접근 |

**실제 사용 흐름:**
```
FE 클라이언트
  ↓
http://localhost:8000/rest/v1/users  ← kong (포트 8000)
  ↓
kong이 postgrest로 라우팅
  ↓
postgrest가 postgres와 통신
  ↓
결과 반환
```

### 볼륨 매핑 (volumes)

볼륨은 "컨테이너 내부의 폴더 ↔ 호스트 컴퓨터의 폴더" 연결입니다.
컨테이너가 중지되어도 데이터가 손실되지 않도록 합니다:

```
구조:
  volumes:
    postgres_data:       ← postgres가 저장한 데이터
    postgrest_config:    ← postgrest 설정
    storage_data:        ← 업로드된 파일들
    realtime_config:     ← realtime 설정
```

**호스트에서 실제 위치:**
```
프로젝트 폴더
├── volumes/
│   ├── postgres/           ← DB 데이터
│   ├── storage/            ← 업로드된 파일
│   └── ...
```

**중요: 호스트 컴퓨터와 동기화**
- 컨테이너 안에서 파일이 변경되면 호스트에도 반영됨
- 호스트에서 파일을 추가하면 컨테이너에서 접근 가능

### 네트워크 구성

docker-compose가 자동으로 네트워크를 생성합니다:

```
docker-compose 내부 네트워크 (컨테이너끼리만 통신)
  ├── postgres:5432          (다른 컨테이너는 이름으로 접근)
  ├── postgrest:3000
  ├── auth:9999
  ├── kong:8000
  ├── realtime:4000
  └── storage:5000

호스트(당신의 컴퓨터) ↔ 외부 노출 (포트 매핑으로만)
  ├── localhost:5432   → postgres
  ├── localhost:8000   → kong
  ├── localhost:3000   → studio
  └── ...
```

**비유:**
- 컨테이너들은 같은 사무실 건물 (내부 네트워크)
- 포트 매핑은 건물 출입구 (호스트와의 연결)
- 방문객(호스트)은 출입구로만 들어올 수 있음

### 환경 변수 (environment)

각 서비스는 .env 파일에서 환경 변수를 받습니다:

```yaml
postgres:
  environment:
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # .env에서 값을 가져옴
    POSTGRES_DB: ${POSTGRES_DB}

kong:
  environment:
    KONG_DATABASE: postgres
    KONG_PG_HOST: postgres  # 같은 네트워크이므로 서비스명으로 접근
```

**${변수명} 형식:**
- docker-compose가 실행될 때 .env 파일의 값으로 치환됨
- 마치 JavaScript의 템플릿 리터럴 같음

### 실제 docker-compose.yml의 구조

공식 파일의 대략적 구조:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ...
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  postgrest:
    image: postgrest/postgrest
    depends_on:
      - postgres
    environment:
      PGRST_DB_URI: postgres://...
    ports:
      - "3000:3000"

  auth:
    image: supabase/auth
    depends_on:
      - postgres
    ports:
      - "9999:9999"

  kong:
    image: kong:latest
    depends_on:
      - postgrest
      - auth
    ports:
      - "8000:8000"
      - "8443:8443"

  realtime:
    image: supabase/realtime
    depends_on:
      - postgres

  storage:
    image: supabase/storage-api
    depends_on:
      - postgres
      - kong

  studio:
    image: supabase/studio
    depends_on:
      - postgres
      - postgrest
      - auth

volumes:
  postgres_data:
  ...
```

---

## 핵심 정리

- **docker-compose.yml은 필요한 서비스들의 레시피**: package.json처럼 필요한 것들을 정의
- **서비스들은 의존 관계가 있음**: depends_on으로 시작 순서를 제어 (마치 import 순서처럼)
- **포트 매핑으로 외부 접근 허용**: localhost:8000 → kong 컨테이너, 나머지는 내부 네트워크
- **볼륨으로 데이터 보존**: DB 데이터, 업로드된 파일이 컨테이너 중지 후에도 유지
- **환경 변수로 설정 주입**: .env 파일의 값이 ${변수명}으로 치환
- **kong은 라우터**: Express 미들웨어처럼 요청을 적절한 서비스로 분산

---

## 다음 파일 예고

이제 docker-compose.yml이 동작하려면 어떤 환경 변수들이 필수인지 살펴봅니다.
