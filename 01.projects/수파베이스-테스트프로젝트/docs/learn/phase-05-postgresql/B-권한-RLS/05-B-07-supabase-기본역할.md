# 05-B-07: Supabase 기본 역할 구조 (anon / authenticated / service_role)

**번호**: 05-B-07
**제목**: Supabase 기본 역할 구조
**유형**: 개념
**대상**: FE 개발자
**이전**: pg_hba.conf 구조 이해
**다음**: Row Level Security (RLS) 개념

---

## 개요

Supabase는 PostgreSQL 위에 구축된 백엔드 플랫폼으로, 데이터베이스 접근을 관리하기 위해 **세 가지 기본 역할(Role)**을 자동으로 생성합니다. 각 역할은 특정한 용도와 권한을 가지고 있으며, JWT 토큰의 `role` 클레임을 통해 사용자의 신원을 매핑합니다. FE 개발자는 이 역할 구조를 이해해야 API 호출 시 적절한 권한으로 요청을 보낼 수 있습니다.

---

## 1. Supabase 기본 역할의 목적

### 1.1 세 가지 기본 역할

Supabase가 PostgreSQL에 생성하는 기본 역할들:

| 역할명 | 용도 | 로그인 상태 | 권한 수준 |
|--------|------|-----------|---------|
| **anon** | 비로그인 사용자 요청 | 로그인 전 | 최소 권한 |
| **authenticated** | 로그인한 사용자 요청 | 로그인 후 | 중간 권한 |
| **service_role** | 서버/관리자 작업 | 특수 토큰 | 최대 권한 |

### 1.2 역할의 위치

```
PostgreSQL 데이터베이스
├── public 스키마
│   ├── 테이블들
│   └── RLS 정책들
├── auth 스키마 (Supabase 인증)
├── 역할 (Roles)
│   ├── anon
│   ├── authenticated
│   └── service_role
```

---

## 2. 각 역할의 역할과 특징

### 2.1 anon (비로그인 사용자)

**목적**: 로그인하지 않은 사용자가 공개 데이터에 접근할 수 있도록 함

**특징**:
- 로그인 전 클라이언트의 모든 요청
- JWT 토큰 없이 실행되는 PostgREST 요청
- 최소한의 권한만 가짐
- "게스트 접근"에 해당

**사용 예시**:
```javascript
// Supabase 초기화 (로그인 전)
const supabase = createClient(url, anonKey);

// 이 요청은 'anon' 역할로 실행됨
const { data } = await supabase
  .from('public_posts')
  .select('*');
```

**권한 설정 예**:
```sql
-- anon 역할이 public_posts 테이블의 공개 행만 조회 가능
GRANT SELECT ON public.public_posts TO anon;

-- RLS 정책: 공개 상태인 행만 조회
CREATE POLICY "public_access" ON public.public_posts
  FOR SELECT
  USING (is_public = true);
```

### 2.2 authenticated (로그인한 사용자)

**목적**: 로그인한 사용자가 자신의 데이터와 제한된 공유 데이터에 접근

**특징**:
- 로그인 후 클라이언트의 모든 요청
- JWT 토큰에 담긴 사용자 정보와 함께 실행
- 중간 수준의 권한
- "회원 접근"에 해당

**사용 예시**:
```javascript
// 로그인 후
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// 이제 'authenticated' 역할로 실행됨
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', user.id);
```

**권한 설정 예**:
```sql
-- authenticated 역할이 user_profiles에 더 많은 권한
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

-- RLS 정책: 자신의 프로필만 수정 가능
CREATE POLICY "user_own_profile" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);
```

### 2.3 service_role (서버/관리자 작업)

**목적**: 백엔드 서버나 관리자 작업에서 RLS를 우회하고 모든 데이터에 접근

**특징**:
- 서버 환경에서만 사용 (클라이언트에서 노출 금지)
- 최대 권한 보유
- RLS 정책을 무시하고 직접 데이터 접근
- "관리자 접근"에 해당

**사용 예시**:
```javascript
// 서버 환경에서만 사용
const supabase = createClient(url, serviceRoleKey);

// RLS를 무시하고 모든 사용자 프로필 조회
const { data } = await supabase
  .from('user_profiles')
  .select('*');
  // 어떤 RLS 정책도 적용되지 않음
```

**주의사항**:
```javascript
// ❌ 절대 금지: 클라이언트 환경에서 service_role 키 노출
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ✅ 올바름: 서버 환경 (.env.local, 서버 코드)에만 보관
// .env.local (클라이언트 볼 수 없음)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## 3. FE 비유: 웹 애플리케이션의 라우트와 역할 매핑

**개념 비유**로 이해하면 더 쉽습니다:

```
웹 애플리케이션 라우트 구조
├── Public 라우트 (/about, /pricing)
│   ├── 로그인 불필요
│   ├── 누구나 접근 가능
│   └── → anon 역할 (PostgreSQL)
│
├── Private 라우트 (/dashboard, /profile)
│   ├── 로그인 필요
│   ├── 로그인한 사용자만 접근
│   └── → authenticated 역할 (PostgreSQL)
│
└── Admin 라우트 (/admin/users, /admin/settings)
    ├── 특수 권한 필요
    ├── 서버 환경에서만 실행
    └── → service_role 역할 (PostgreSQL)
```

**프런트엔드 코드 예시**:
```javascript
// Public 라우트: 인증 없이 접근
const publicData = await supabase
  .from('public_articles')
  .select('*');  // anon 역할로 실행

// Private 라우트: 로그인 후 접근
if (user) {
  const privateData = await supabase
    .from('user_posts')
    .select('*');  // authenticated 역할로 실행
}

// Admin 라우트: 백엔드 API 호출
// 프런트엔드는 POST /api/admin/delete-user 같은 엔드포인트 호출
const response = await fetch('/api/admin/delete-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: '123' })
});
// 백엔드는 service_role로 실행
```

---

## 4. JWT 토큰과 역할 매핑

### 4.1 JWT 토큰의 `role` 클레임

Supabase 인증 후 발급되는 JWT 토큰에는 사용자가 어떤 역할인지 명시된 `role` 클레임이 있습니다.

**로그인 전 (anon)**:
```javascript
// 토큰 없음 또는 토큰 없이 요청
// PostgREST가 anon 역할로 자동 실행
```

**로그인 후 (authenticated)**:
```javascript
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// 반환되는 토큰의 페이로드 (예)
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "email_confirmed_at": "2026-04-01T00:00:00Z",
  "phone": "",
  "phone_confirmed_at": null,
  "confirmed_at": "2026-04-01T00:00:00Z",
  "role": "authenticated",  // ← 역할 클레임
  "aud": "authenticated",
  "created_at": "2026-04-01T00:00:00Z",
  "updated_at": "2026-04-01T00:00:00Z"
}
```

**service_role (서버)**:
```javascript
// 서버에서 발급된 토큰 또는 특수 토큰
{
  "role": "service_role",  // ← 최고 권한
  // ... 기타 클레임
}
```

### 4.2 토큰을 어디에 보내는가?

```
클라이언트 요청
↓
Authorization: Bearer eyJhbGc... (JWT 토큰)
↓
PostgREST API
↓
토큰에서 role 클레임 추출
↓
해당 역할(anon/authenticated/service_role)로 쿼리 실행
↓
PostgreSQL RLS 정책 적용
↓
결과 반환
```

---

## 5. PostgREST가 역할을 어떻게 사용하는가?

### 5.1 요청 처리 흐름

```
HTTP 요청 수신 (GET /rest/v1/posts)
    ↓
Authorization 헤더 파싱
    ↓
┌─ 토큰 있음? ─ JWT 검증 ─ role 클레임 추출 → "authenticated"
│
└─ 토큰 없음? ─ 기본 역할 사용 → "anon"
    ↓
PostgreSQL 연결에 SET ROLE 실행
    ↓
SELECT * FROM posts;  (이 쿼리는 설정된 역할로 실행됨)
    ↓
RLS 정책 자동 적용
    ↓
필터링된 결과 반환
```

### 5.2 SET ROLE 예시

```javascript
// 클라이언트 요청 (로그인 전)
GET /rest/v1/posts HTTP/1.1
// Authorization 헤더 없음

// 백엔드 (PostgREST)에서 실행되는 SQL:
SET ROLE anon;
SELECT * FROM public.posts WHERE is_public = true;
// RLS 정책이 자동으로 적용됨
```

```javascript
// 클라이언트 요청 (로그인 후)
GET /rest/v1/posts HTTP/1.1
Authorization: Bearer eyJhbGc...

// 백엔드 (PostgREST)에서 실행되는 SQL:
SET ROLE authenticated;
SET claim.sub = '550e8400-e29b-41d4-a716-446655440000';
SELECT * FROM public.posts WHERE user_id = auth.uid() OR is_public = true;
// RLS 정책이 auth.uid() 값과 함께 적용됨
```

### 5.3 RLS와 역할의 관계

```sql
-- RLS 정책 (역할별 접근 제어)
CREATE POLICY "anon_can_see_public" ON public.posts
  FOR SELECT
  USING (is_public = true);
  -- 이 정책은 anon 역할 사용자에게만 공개 게시물을 보여줌

CREATE POLICY "authenticated_can_see_own_or_public" ON public.posts
  FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);
  -- 이 정책은 authenticated 역할 사용자에게 자신의 게시물과 공개 게시물을 보여줌

CREATE POLICY "service_role_can_see_all" ON public.posts
  FOR SELECT
  USING (true);
  -- service_role은 RLS를 무시하므로 이 정책도 불필요 (모두 볼 수 있음)
```

---

## 6. 실전 시나리오: 역할이 어떻게 작동하는가?

### 시나리오: 블로그 애플리케이션

**데이터베이스 테이블**: `posts`
- `id`: 게시물 ID
- `title`: 제목
- `content`: 내용
- `user_id`: 작성자 ID
- `is_public`: 공개 여부

### 6.1 상황 1: 로그인하지 않은 사용자 (anon)

```javascript
// 프런트엔드 코드
const { data } = await supabase
  .from('posts')
  .select('*');
```

**실행 과정**:
1. JWT 토큰 없이 요청 전송
2. PostgREST가 `anon` 역할로 설정
3. 데이터베이스에서:
   ```sql
   SET ROLE anon;
   SELECT * FROM public.posts;
   -- RLS 정책: is_public = true인 행만 반환
   ```
4. 공개 게시물만 반환됨

**결과**: `[{ id: 1, title: "Hello World", ... }, { id: 2, ... }]`

### 6.2 상황 2: 로그인한 사용자 (authenticated)

```javascript
// 프런트엔드 코드
const { data: { user } } = await supabase.auth.getUser();

const { data } = await supabase
  .from('posts')
  .select('*');
```

**실행 과정**:
1. JWT 토큰과 함께 요청 전송
2. PostgREST가 `authenticated` 역할로 설정
3. 토큰에서 `auth.uid()` 값 추출 (예: `user-123`)
4. 데이터베이스에서:
   ```sql
   SET ROLE authenticated;
   SET claim.sub = 'user-123';
   SELECT * FROM public.posts;
   -- RLS 정책: is_public = true 또는 user_id = 'user-123'인 행만 반환
   ```
5. 공개 게시물 + 자신이 작성한 게시물 모두 반환됨

**결과**: `[{ id: 1, ... }, { id: 3, ... }, { id: 5, ... }]` (공개 게시물 + 자신의 게시물)

### 6.3 상황 3: 백엔드 서버 작업 (service_role)

```javascript
// 백엔드 API 엔드포인트 (Node.js/Express)
app.post('/api/admin/stats', async (req, res) => {
  const supabase = createClient(url, serviceRoleKey);

  const { data } = await supabase
    .from('posts')
    .select('*');

  // 전체 게시물 통계 계산
  const stats = {
    total: data.length,
    public: data.filter(p => p.is_public).length,
    private: data.filter(p => !p.is_public).length
  };

  res.json(stats);
});
```

**실행 과정**:
1. service_role 키로 요청 전송
2. PostgREST가 `service_role` 역할로 설정
3. 데이터베이스에서:
   ```sql
   SET ROLE service_role;
   SELECT * FROM public.posts;
   -- RLS 정책이 무시되고 모든 행 반환
   ```
4. 모든 게시물 데이터 반환 (공개/비공개 구분 없음)

**결과**: `[{ id: 1, ... }, { id: 2, ... }, { id: 3, ... }, ...]` (모든 게시물)

---

## 7. 중요한 보안 원칙

### 7.1 키 관리

| 키 | 노출 위치 | 사용 시기 |
|----|----------|---------|
| **Anon Key** | 프런트엔드, 클라이언트 환경 | 로그인 전 요청 |
| **Service Role Key** | 백엔드, 환경변수 (.env) | 서버 작업만 |

```javascript
// ✅ 올바른 사용
// 프런트엔드 (.env.local, 공개 가능)
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJhbGc...

// 백엔드 (.env, 비공개)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

// ❌ 잘못된 사용
// 프런트엔드에 service_role 키 노출
const supabase = createClient(url, serviceRoleKey); // 위험!
```

### 7.2 RLS는 필수

```sql
-- RLS 활성화 (중요!)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 역할별 정책 필수
CREATE POLICY "anon_read_public" ON public.posts
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "authenticated_read_own_or_public" ON public.posts
  FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);
```

---

## 8. 요약

| 항목 | anon | authenticated | service_role |
|------|------|---------------|--------------|
| **사용자 상태** | 로그인 전 | 로그인 후 | 서버/관리자 |
| **JWT 토큰** | 없음 | 있음 (`role: authenticated`) | 있음 (`role: service_role`) |
| **권한 수준** | 최소 | 중간 | 최대 |
| **RLS 적용** | YES | YES | NO (무시) |
| **접근 범위** | 공개 데이터만 | 공개 + 자신의 데이터 | 모든 데이터 |
| **키 위치** | 클라이언트 (anon key) | 클라이언트 (anon key) | 서버 (service_role key) |

---

## 9. 다음 단계

다음 섹션인 **"Row Level Security (RLS) 개념"**에서는:
- RLS 정책을 자세히 살펴봅니다
- 정책 문법과 `auth.uid()` 함수 사용법을 배웁니다
- 역할별 정책 작성 실전 예제를 다룹니다

