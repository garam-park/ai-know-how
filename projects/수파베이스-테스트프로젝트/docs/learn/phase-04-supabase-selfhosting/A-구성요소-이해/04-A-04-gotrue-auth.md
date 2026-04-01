# 04-A-04 GoTrue (Auth 서버) 이해

> 유형: 개념 | 예상 소요 시간: 10분
> 이전: PostgREST 동작 원리 | 다음: Realtime & Storage 이해

---

## 이 파일에서 배우는 것

Supabase의 인증(Auth) 기능을 담당하는 GoTrue 서버의 역할과 동작 흐름을 이해합니다.
JWT 토큰이 어떻게 생성되고 다른 서비스와 연결되는지 전체 그림을 파악합니다.

---

## 본문

### GoTrue란?

GoTrue는 Netlify에서 만든 오픈소스 인증 서버를 Supabase가 포크(fork)하여 사용하는 **인증 전용 마이크로서비스**입니다.

FE 비유: NextAuth.js나 Firebase Auth 같은 인증 라이브러리가 **독립 서버로 분리**되어 돌아가는 것입니다. 클라이언트에서 `supabase.auth.signUp()`을 호출하면 내부적으로 GoTrue 서버의 API를 호출합니다.

### GoTrue가 담당하는 기능

| 기능 | API 경로 | Supabase 클라이언트 |
|---|---|---|
| 회원가입 | `POST /auth/v1/signup` | `supabase.auth.signUp()` |
| 로그인 | `POST /auth/v1/token?grant_type=password` | `supabase.auth.signInWithPassword()` |
| OAuth 로그인 | `GET /auth/v1/authorize` | `supabase.auth.signInWithOAuth()` |
| 토큰 갱신 | `POST /auth/v1/token?grant_type=refresh_token` | 자동 처리 |
| 로그아웃 | `POST /auth/v1/logout` | `supabase.auth.signOut()` |
| 비밀번호 재설정 | `POST /auth/v1/recover` | `supabase.auth.resetPasswordForEmail()` |

### JWT 토큰의 흐름

GoTrue가 발급하는 JWT 토큰은 Supabase 전체 시스템의 **인증 기반**입니다.

```
1. 사용자가 로그인 요청
   └→ Kong → GoTrue

2. GoTrue가 DB에서 사용자 확인
   └→ GoTrue → PostgreSQL (auth.users 테이블)

3. GoTrue가 JWT 토큰 발급 (JWT_SECRET으로 서명)
   └→ GoTrue → 클라이언트

4. 이후 클라이언트가 API 요청 시 JWT 포함
   └→ Kong이 JWT 검증 → PostgREST에 전달
   └→ PostgREST가 JWT의 role 정보로 RLS 적용
```

### JWT 토큰 내부 구조

GoTrue가 발급하는 JWT 토큰에는 이런 정보가 들어있습니다:

```json
{
  "sub": "user-uuid-here",
  "email": "user@example.com",
  "role": "authenticated",
  "aud": "authenticated",
  "exp": 1714000000,
  "iat": 1713996400
}
```

- `sub`: 사용자의 고유 UUID
- `role`: PostgreSQL에서 사용할 역할 (`authenticated`)
- `exp`: 토큰 만료 시간

이 `role` 값이 PostgREST에서 RLS 정책을 적용하는 기준이 됩니다.

### auth 스키마

GoTrue는 PostgreSQL의 `auth` 스키마에 자체 테이블을 생성합니다:

```
auth 스키마
├── auth.users          ← 사용자 계정 정보
├── auth.identities     ← OAuth 연동 정보
├── auth.sessions       ← 세션 관리
├── auth.refresh_tokens ← 리프레시 토큰
└── auth.mfa_factors    ← 2FA 설정
```

이 테이블들은 `public` 스키마가 아니므로 PostgREST API로 직접 접근할 수 없습니다. GoTrue API를 통해서만 조작됩니다.

### 셀프호스팅에서 알아야 할 포인트

1. **JWT_SECRET이 가장 중요한 시크릿**입니다. Kong, PostgREST, GoTrue가 모두 같은 값을 공유해야 합니다. 하나라도 다르면 인증이 깨집니다.
2. OAuth(Google, GitHub 로그인 등)를 사용하려면 GoTrue의 환경변수에 **각 프로바이더의 Client ID/Secret**을 추가해야 합니다.
3. 이메일 인증을 사용하려면 **SMTP 서버 설정**이 필요합니다 (환경변수: `GOTRUE_SMTP_HOST`, `GOTRUE_SMTP_PORT` 등).

---

## 핵심 정리

- GoTrue는 Supabase의 **인증 전용 서버**로, 회원가입/로그인/토큰 관리를 담당한다.
- 발급된 JWT 토큰은 Kong에서 검증되고, PostgREST에서 RLS 정책 적용의 기준이 된다.
- 셀프호스팅에서 **JWT_SECRET 통일**이 가장 중요하며, OAuth/이메일 기능은 추가 설정이 필요하다.

---

## 다음 파일 예고

실시간 데이터 동기화를 담당하는 Realtime 서버와, 파일 업로드/다운로드를 담당하는 Storage 서버를 함께 알아봅니다.
