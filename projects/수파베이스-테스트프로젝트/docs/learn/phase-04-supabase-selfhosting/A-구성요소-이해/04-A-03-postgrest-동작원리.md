# 04-A-03 PostgREST 동작 원리

> 유형: 개념 | 예상 소요 시간: 10분
> 이전: Kong API Gateway 역할 이해 | 다음: GoTrue (Auth 서버) 이해

---

## 이 파일에서 배우는 것

PostgREST가 어떻게 DB 테이블을 자동으로 REST API로 변환하는지 이해합니다.
Supabase 클라이언트에서 `.from('todos').select('*')`를 호출하면 내부적으로 무슨 일이 벌어지는지 흐름을 파악합니다.

---

## 본문

### PostgREST란?

PostgREST는 PostgreSQL 데이터베이스를 **자동으로 RESTful API로 노출**시켜주는 독립 서버입니다. 코드를 한 줄도 쓰지 않아도, 테이블을 만들면 바로 CRUD API가 생깁니다.

FE 비유: Express에서 라우터와 컨트롤러를 일일이 만드는 대신, DB 스키마를 읽고 자동으로 라우트를 만들어주는 코드 제너레이터가 항상 돌아가고 있다고 생각하면 됩니다.

### 요청 흐름 예시

Supabase 클라이언트에서 이렇게 호출하면:

```javascript
const { data } = await supabase
  .from('todos')
  .select('*')
  .eq('user_id', 'abc123')
```

내부적으로 이런 HTTP 요청이 만들어집니다:

```
GET /rest/v1/todos?select=*&user_id=eq.abc123
Authorization: Bearer <JWT_TOKEN>
apikey: <ANON_KEY>
```

이 요청의 여정:

```
1. 클라이언트 → Caddy (HTTPS 처리)
2. Caddy → Kong (API Gateway, 포트 8000)
3. Kong → PostgREST (포트 3000)
4. PostgREST → PostgreSQL (SQL 실행)
5. PostgreSQL → PostgREST → Kong → Caddy → 클라이언트
```

### PostgREST가 지원하는 HTTP 메서드

| HTTP 메서드 | SQL 동작 | Supabase 클라이언트 |
|---|---|---|
| `GET` | `SELECT` | `.select()` |
| `POST` | `INSERT` | `.insert()` |
| `PATCH` | `UPDATE` | `.update()` |
| `DELETE` | `DELETE` | `.delete()` |

### 스키마(Schema) 개념

PostgREST는 특정 PostgreSQL 스키마의 테이블만 API로 노출합니다. Supabase에서는 기본적으로 `public` 스키마를 사용합니다.

```
PostgreSQL
├── public 스키마     ← PostgREST가 노출 (API로 접근 가능)
│   ├── todos
│   ├── profiles
│   └── ...
├── auth 스키마       ← GoTrue 전용 (직접 접근 불가)
├── storage 스키마    ← Storage 전용
└── extensions 스키마 ← 확장 기능용
```

FE 비유: `public` 폴더에 넣은 파일만 웹에서 접근 가능한 것과 비슷합니다. `public` 스키마에 있는 테이블만 REST API로 접근됩니다.

### RLS와의 관계

PostgREST는 요청자의 JWT 토큰을 PostgreSQL의 `role`로 변환합니다.

- ANON key로 요청 → PostgreSQL `anon` 역할로 쿼리 실행
- 로그인한 사용자의 JWT → PostgreSQL `authenticated` 역할로 쿼리 실행
- SERVICE key로 요청 → PostgreSQL `service_role` 역할로 쿼리 실행 (RLS 무시)

이 역할에 따라 RLS(Row Level Security) 정책이 적용되므로, **PostgREST 자체가 보안을 담당하는 것이 아니라 PostgreSQL의 보안 기능을 그대로 활용**하는 구조입니다.

### 셀프호스팅에서 알아야 할 포인트

1. PostgREST는 **stateless** 서버입니다. DB 연결 정보와 JWT 시크릿만 환경변수로 받으면 동작합니다.
2. 테이블 구조가 바뀌면 PostgREST가 자동으로 스키마를 다시 읽습니다 (`NOTIFY pgrst` 신호 활용).
3. `.env` 파일에서 `PGRST_JWT_SECRET`이 잘못 설정되면 모든 API 요청이 401 에러를 반환합니다.

---

## 핵심 정리

- PostgREST는 PostgreSQL 테이블을 **자동으로 REST API로 노출**하는 서버다.
- Supabase 클라이언트의 `.from().select()` 등의 호출은 내부적으로 PostgREST에 HTTP 요청을 보내는 것이다.
- PostgREST는 JWT 토큰을 PostgreSQL 역할로 변환하여 **DB 수준의 보안(RLS)**을 활용한다.

---

## 다음 파일 예고

회원가입과 로그인을 담당하는 GoTrue(Auth 서버)가 어떻게 JWT 토큰을 발급하고, 이 토큰이 PostgREST와 어떻게 연결되는지 살펴봅니다.
