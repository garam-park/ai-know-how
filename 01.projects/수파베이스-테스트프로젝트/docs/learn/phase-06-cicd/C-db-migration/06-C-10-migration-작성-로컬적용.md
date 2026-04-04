# 06-C-10 Migration 파일 작성 & 로컬 적용

| 속성 | 내용 |
|------|------|
| **번호** | 06-C-10 |
| **제목** | Migration 파일 작성 & 로컬 적용 |
| **유형** | 실습 (15~20분) |
| **이전** | Supabase Migration 개념 & 파일 구조 (06-C-09) |
| **다음** | CI 파이프라인에서 Migration 자동 적용 (06-C-11) |

---

## 학습 목표

- `supabase migration new` 명령어로 migration 파일 생성하기
- SQL로 테이블 생성, 수정, 삭제하기
- `supabase db reset`으로 로컬에서 migration 적용하기
- 여러 migration을 순서대로 실행하기
- 마이그레이션 적용 상태 확인하기

---

## 핵심 개념: FE 개발자를 위한 유추

Migration 작성은 **데이터베이스 작업을 코드로 문서화하는 과정**입니다:

| 프론트엔드 | 데이터베이스 |
|-----------|-----------|
| `npm install package` → package.json 수정 | Migration 파일 작성 → supabase/migrations 수정 |
| `git add package.json` → 커밋 | Migration 파일을 Git에 커밋 |
| 다른 개발자: `npm install` 실행 → 동일한 의존성 | 다른 개발자: `supabase db reset` → 동일한 DB 스키마 |

**핵심**: Migration = "데이터베이스 설치 명령어" ✓

---

## 실습 1단계: 첫 번째 Migration 생성 - Users 테이블

### 목표

`users` 테이블을 만드는 migration 파일을 생성하고 로컬 DB에 적용하기

### 완료 기준

- ✅ Migration 파일이 `supabase/migrations/` 디렉토리에 생성됨
- ✅ 파일명이 `YYYYMMDDhhmmss_create_users_table.sql` 형식
- ✅ `supabase db reset` 실행 후 오류 없음
- ✅ 로컬 DB에 `users` 테이블이 생성됨

### 단계별 작업

#### Step 1-1: Migration 파일 생성

```bash
cd /your-project

supabase migration new create_users_table
```

**출력 예시**:
```
✓ Created migration 20260401081234_create_users_table.sql
```

**생성된 파일 위치**:
```
supabase/migrations/20260401081234_create_users_table.sql
```

파일을 열어보면:
```sql
-- 파일이 비어있거나 기본 주석만 있음
```

#### Step 1-2: SQL 작성

생성된 파일에 다음 SQL을 작성합니다:

```sql
-- Migration: Create users table
-- Purpose: Store user account information
-- Date: 2026-04-01

CREATE TABLE IF NOT EXISTS public.users (
  -- 기본 필드
  id bigserial PRIMARY KEY,

  -- 인증 정보
  email text UNIQUE NOT NULL,
  password_hash text,

  -- 프로필 정보
  full_name text,
  avatar_url text,

  -- 메타데이터
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 인덱스 생성 (검색 성능 개선)
CREATE INDEX users_email_idx ON public.users(email);
CREATE INDEX users_created_at_idx ON public.users(created_at DESC);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 데이터만 볼 수 있음
CREATE POLICY "Users can view their own data"
  ON public.users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- RLS 정책: 사용자는 자신의 데이터만 수정 가능
CREATE POLICY "Users can update their own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid()::text = id::text);
```

**파일 구조 설명**:
| 섹션 | 설명 |
|------|------|
| **주석** | 목적과 날짜 기록 |
| **CREATE TABLE** | 테이블 구조 정의 |
| **CREATE INDEX** | 검색 성능을 위한 인덱스 |
| **ENABLE RLS** | 행 레벨 보안 활성화 |
| **CREATE POLICY** | RLS 접근 제어 규칙 |

#### Step 1-3: 파일 저장 확인

```bash
# Migration 파일이 제대로 생성되었는지 확인
cat supabase/migrations/20260401081234_create_users_table.sql | head -20
```

**출력 예시**:
```
-- Migration: Create users table
-- Purpose: Store user account information
-- Date: 2026-04-01

CREATE TABLE IF NOT EXISTS public.users (
...
```

#### Step 1-4: 로컬 DB에 적용 (Reset)

```bash
# 로컬 Docker DB를 초기화하고 모든 migration 적용
supabase db reset
```

**출력 예시**:
```
✓ Stopping Supabase local development setup
✓ Removing Docker containers
✓ Starting Supabase local development setup
✓ Creating initial schemas
✓ Applying migration: 20260401081234_create_users_table.sql
✓ Seeding data from seed.sql (if exists)
✓ Supabase local development setup complete
```

**중요**: `supabase db reset`은 **로컬 DB를 완전히 초기화**합니다.
- 기존 데이터 모두 삭제
- 모든 migration을 처음부터 다시 실행
- 개발 중에만 사용 (프로덕션에서는 절대 금지!)

#### Step 1-5: 테이블 생성 확인

```bash
# Supabase 로컬 대시보드에서 확인
# http://localhost:54323

# 또는 CLI로 확인
supabase db query
```

**대시보드 확인 방법**:
1. 브라우저에서 `http://localhost:54323` 열기
2. 좌측 메뉴 → SQL Editor
3. 다음 쿼리 실행:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

**출력 예시**:
```
table_name
-----------
users
```

#### Step 1-6: 테이블 구조 확인

```sql
-- Supabase 대시보드의 SQL Editor에서 실행
\d public.users
```

**출력 예시**:
```
                                    Table "public.users"
   Column    |           Type           | Collation | Nullable |            Default
-------------|--------------------------|-----------|----------|---------------------------
 id          | bigint                   |           | not null | nextval('users_id_seq')
 email       | text                     |           | not null |
 password_hash | text                   |           |          |
 full_name   | text                     |           |          |
 avatar_url  | text                     |           |          |
 created_at  | timestamp with time zone |           | not null | timezone('utc'::text, now())
 updated_at  | timestamp with time zone |           | not null | timezone('utc'::text, now())
Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "users_email_idx" btree (email)
    "users_created_at_idx" btree (created_at DESC)
```

#### 완료 확인

- ✅ `supabase/migrations/20260401081234_create_users_table.sql` 파일 생성됨
- ✅ `supabase db reset` 성공 (오류 없음)
- ✅ Supabase 대시보드에서 `users` 테이블 확인
- ✅ 컬럼, 인덱스, RLS 정책이 모두 생성됨

---

## 실습 2단계: 두 번째 Migration 생성 - Posts 테이블

### 목표

사용자가 작성한 게시물을 저장하는 `posts` 테이블을 생성하는 migration 작성하기

### 완료 기준

- ✅ 두 번째 migration 파일이 생성됨
- ✅ `posts` 테이블이 `users.id`를 외래키로 참조
- ✅ `supabase db reset` 후 `posts` 테이블 확인 가능
- ✅ 테이블 간 관계 (posts.user_id → users.id) 정상 작동

### 단계별 작업

#### Step 2-1: 두 번째 Migration 생성

```bash
supabase migration new create_posts_table
```

**출력 예시**:
```
✓ Created migration 20260401082500_create_posts_table.sql
```

**주의**: 타임스탬프가 첫 번째 migration보다 뒤여야 함
- 1번 migration: `20260401081234`
- 2번 migration: `20260401082500` ← 더 뒤의 시간

#### Step 2-2: SQL 작성

```sql
-- Migration: Create posts table
-- Purpose: Store user-generated posts
-- Date: 2026-04-01

CREATE TABLE IF NOT EXISTS public.posts (
  -- 기본 필드
  id bigserial PRIMARY KEY,

  -- 관계 필드
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- 콘텐츠
  title text NOT NULL,
  content text NOT NULL,

  -- 상태
  published boolean DEFAULT false,

  -- 메타데이터
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 인덱스
CREATE INDEX posts_user_id_idx ON public.posts(user_id);
CREATE INDEX posts_created_at_idx ON public.posts(created_at DESC);

-- RLS 활성화
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 자신의 게시물만 조회 가능
CREATE POLICY "Users can view published posts or their own posts"
  ON public.posts
  FOR SELECT
  USING (
    published = true
    OR auth.uid()::text = user_id::text
  );

-- 자신의 게시물만 수정 가능
CREATE POLICY "Users can update their own posts"
  ON public.posts
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- 자신의 게시물만 삭제 가능
CREATE POLICY "Users can delete their own posts"
  ON public.posts
  FOR DELETE
  USING (auth.uid()::text = user_id::text);
```

**새 개념 설명**:

| SQL 문법 | 설명 |
|---------|------|
| `REFERENCES public.users(id)` | 외래키 - posts.user_id는 users.id를 참조 |
| `ON DELETE CASCADE` | 사용자 삭제 시 그 사용자의 모든 게시물도 자동 삭제 |
| `UNIQUE` | 중복 값 불가 |
| `DEFAULT false` | 값 입력 없으면 자동으로 false |

#### Step 2-3: 로컬 DB 재설정

```bash
supabase db reset
```

**출력 예시**:
```
✓ Stopping Supabase local development setup
✓ Removing Docker containers
✓ Starting Supabase local development setup
✓ Creating initial schemas
✓ Applying migration: 20260401081234_create_users_table.sql
✓ Applying migration: 20260401082500_create_posts_table.sql ← 자동으로 순서대로 실행
✓ Seeding data from seed.sql (if exists)
✓ Supabase local development setup complete
```

**중요**: 두 migration이 **자동으로 순서대로** 실행됨!

#### Step 2-4: 테이블 관계 확인

```sql
-- Supabase 대시보드 SQL Editor에서 실행

-- posts 테이블 구조 확인
\d public.posts
```

**출력 예시**:
```
                                   Table "public.posts"
    Column    |           Type           | Collation | Nullable |           Default
-------------|--------------------------|-----------|----------|----------------------------
 id          | bigint                   |           | not null | nextval('posts_id_seq')
 user_id     | bigint                   |           | not null |
 title       | text                     |           | not null |
 content     | text                     |           | not null |
 published   | boolean                  |           |          | false
 created_at  | timestamp with time zone |           | not null | timezone('utc'::text, now())
 updated_at  | timestamp with time zone |           | not null | timezone('utc'::text, now())
Indexes:
    "posts_pkey" PRIMARY KEY, btree (id)
    "posts_user_id_idx" btree (user_id)
    "posts_created_at_idx" btree (created_at DESC)
Foreign-key constraints:
    "posts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
```

#### Step 2-5: 외래키 관계 테스트

```sql
-- 외래키 제약이 정상 작동하는지 테스트

-- 1. 존재하지 않는 user_id로 게시물 만들기 시도 (실패해야 함)
INSERT INTO public.posts (user_id, title, content)
VALUES (999, 'Test Post', 'Content');

-- 결과: Error! foreign key violation
-- ✓ 정상 (999번 사용자가 없으므로 삽입 불가)

-- 2. 사용자 없이 먼저 posts 삽입 시도
INSERT INTO public.users (email) VALUES ('test@example.com');
-- 결과: INSERT INTO users (id, email, ...) VALUES (1, 'test@example.com', ...)

INSERT INTO public.posts (user_id, title, content)
VALUES (1, 'My First Post', 'This is my first post');
-- 결과: 성공! user_id=1이 존재하므로 삽입 가능
```

#### 완료 확인

- ✅ 두 번째 migration 파일 생성됨
- ✅ `supabase db reset` 실행 후 두 migration 모두 자동 적용됨
- ✅ `posts` 테이블이 생성됨
- ✅ `user_id` 외래키가 `users.id`를 정상 참조
- ✅ ON DELETE CASCADE 정책이 작동

---

## 실습 3단계: 기존 테이블 수정 - 새 컬럼 추가

### 목표

기존 `users` 테이블에 `bio` 컬럼을 추가하는 migration 작성하기

### 완료 기준

- ✅ 세 번째 migration 파일이 생성됨
- ✅ `ALTER TABLE`로 컬럼 추가
- ✅ `supabase db reset` 후 컬럼이 존재
- ✅ 기존 데이터가 손상되지 않음

### 단계별 작업

#### Step 3-1: 새 Migration 생성

```bash
supabase migration new add_bio_to_users
```

**출력 예시**:
```
✓ Created migration 20260401083700_add_bio_to_users.sql
```

#### Step 3-2: SQL 작성

```sql
-- Migration: Add bio column to users table
-- Purpose: Allow users to add a personal biography
-- Date: 2026-04-01

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio text;

-- 인덱스 추가 (선택사항 - 검색이 필요하면)
-- 이 경우 bio는 검색 필요 없으므로 인덱스 생략
```

**ALTER TABLE 문법**:

| 명령어 | 설명 |
|--------|------|
| `ADD COLUMN IF NOT EXISTS` | 컬럼이 없으면 추가 (중복 실행 가능) |
| `DROP COLUMN IF EXISTS` | 컬럼이 있으면 삭제 |
| `RENAME COLUMN old TO new` | 컬럼명 변경 |
| `ALTER COLUMN name SET DEFAULT` | 기본값 변경 |

#### Step 3-3: DB 재설정 및 확인

```bash
supabase db reset
```

**출력 예시**:
```
✓ Applying migration: 20260401081234_create_users_table.sql
✓ Applying migration: 20260401082500_create_posts_table.sql
✓ Applying migration: 20260401083700_add_bio_to_users.sql ← 새로 추가됨!
```

#### Step 3-4: 컬럼 추가 확인

```sql
-- Supabase 대시보드에서 실행
\d public.users
```

**출력 예시**:
```
                                    Table "public.users"
   Column    |           Type           | Collation | Nullable |            Default
-------------|--------------------------|-----------|----------|---------------------------
 id          | bigint                   |           | not null |
 email       | text                     |           | not null |
 password_hash | text                   |           |          |
 full_name   | text                     |           |          |
 avatar_url  | text                     |           |          |
 bio         | text                     |           |          | ← 새로 추가됨!
 created_at  | timestamp with time zone |           | not null |
 updated_at  | timestamp with time zone |           | not null |
```

#### 완료 확인

- ✅ 세 번째 migration 파일 생성됨
- ✅ `bio` 컬럼이 `users` 테이블에 추가됨
- ✅ 기존 컬럼들이 손상되지 않음
- ✅ `supabase db reset` 후에도 모든 migration이 정상 적용됨

---

## 실습 4단계: Migration 파일 확인 및 Git 커밋

### 목표

모든 migration 파일을 확인하고 Git에 커밋하기

### 완료 기준

- ✅ 3개의 migration 파일이 `supabase/migrations/` 디렉토리에 존재
- ✅ 파일명이 타임스탬프 순서대로 정렬됨
- ✅ 모든 파일이 Git에 커밋됨
- ✅ `.gitignore`에 migration 파일이 제외되지 않음

### 단계별 작업

#### Step 4-1: Migration 파일 목록 확인

```bash
# 타임스탬프 순서대로 파일 확인
ls -1 supabase/migrations/

# 또는 더 자세히 보기
ls -lh supabase/migrations/
```

**출력 예시**:
```
20260401081234_create_users_table.sql
20260401082500_create_posts_table.sql
20260401083700_add_bio_to_users.sql
```

**확인 체크리스트**:
- ✅ 타임스탬프가 앞에서 뒤로 증가
- ✅ 각 파일이 고유한 시간값
- ✅ 영문 소문자와 언더스코어만 사용

#### Step 4-2: 각 Migration 파일 내용 확인

```bash
# 첫 번째 migration (테이블 생성)
head -5 supabase/migrations/20260401081234_create_users_table.sql

# 두 번째 migration (외래키 관계)
head -5 supabase/migrations/20260401082500_create_posts_table.sql

# 세 번째 migration (컬럼 추가)
cat supabase/migrations/20260401083700_add_bio_to_users.sql
```

#### Step 4-3: .gitignore 확인

```bash
# .gitignore에서 migration 파일이 무시되지 않는지 확인
cat .gitignore | grep -i migration

# 만약 supabase/migrations/ 이 .gitignore에 있으면 제거해야 함
```

**만약 .gitignore에 migration이 등록되어 있다면**:

```bash
# .gitignore 수정 (제거)
# ❌ 나쁜 예: supabase/migrations/
# ✅ 좋은 예: (migration 파일은 버전 관리해야 함)

# 이미 무시된 파일들을 추적 시작하기
git add -f supabase/migrations/
```

#### Step 4-4: Git 상태 확인

```bash
# Git 상태 확인
git status

# 예상 출력:
# On branch develop
#
# Untracked files:
#   (use "git add <file>..." to include in what will be committed)
#         supabase/migrations/20260401081234_create_users_table.sql
#         supabase/migrations/20260401082500_create_posts_table.sql
#         supabase/migrations/20260401083700_add_bio_to_users.sql
```

#### Step 4-5: Git에 커밋

```bash
# Migration 파일 추가
git add supabase/migrations/

# 커밋 메시지 작성 (타입: feat / fix / docs 등)
git commit -m "feat: add database migrations for users and posts tables

- Create users table with authentication fields
- Create posts table with user_id foreign key
- Add bio column to users table
- Enable RLS policies for data security"

# 확인
git log --oneline | head -3
```

**좋은 커밋 메시지 예시**:
```
feat: add database migrations for users and posts
feat(db): initialize schema with users and posts tables
refactor: rename comments table column for clarity
fix(migration): add missing NOT NULL constraint
```

#### 완료 확인

- ✅ 3개 migration 파일 모두 `supabase/migrations/`에 존재
- ✅ 파일명 타임스탬프가 오름차순
- ✅ Git에 커밋됨 (`git log`에서 확인)
- ✅ `.gitignore`에서 migration이 제외되지 않음

---

## 실습 5단계: Migration 상태 확인 및 로컬 DB 최종 검증

### 목표

Supabase 대시보드를 통해 모든 migration이 정상 적용되었는지 최종 확인하기

### 완료 기준

- ✅ Supabase 대시보드 접속 성공
- ✅ `supabase_migrations` 테이블에 3개 migration 기록 확인
- ✅ 모든 테이블과 컬럼이 정상 생성됨
- ✅ RLS 정책이 모두 활성화됨

### 단계별 작업

#### Step 5-1: Supabase 대시보드 접속

```bash
# 브라우저에서 열기
# http://localhost:54323

# 또는 명령어로 오픈 (macOS/Linux)
open http://localhost:54323

# Windows PowerShell
Start-Process http://localhost:54323
```

#### Step 5-2: Migration 이력 확인

대시보드 → **SQL Editor** → 다음 쿼리 실행:

```sql
-- Migration 실행 이력 확인
SELECT version, name, executed_at
FROM supabase_migrations
ORDER BY version;
```

**출력 예시**:
```
version |                         name                          |         executed_at
--------|--------------------------------------------------|----------------------------
      1 | 20260401081234_create_users_table.sql         | 2026-04-01 08:12:34+00:00
      2 | 20260401082500_create_posts_table.sql         | 2026-04-01 08:25:00+00:00
      3 | 20260401083700_add_bio_to_users.sql           | 2026-04-01 08:37:00+00:00
```

**확인 사항**:
- ✅ 3개 migration 모두 `executed_at` 값이 있음 (성공적으로 실행됨)
- ✅ version 번호가 1, 2, 3 순서 (실행 순서 정상)

#### Step 5-3: 테이블 목록 확인

대시보드 → **Table Editor** → 좌측 테이블 목록에서:

```
✅ users     ← 생성됨
✅ posts     ← 생성됨
```

또는 SQL로 확인:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**출력 예시**:
```
table_name
-----------
posts
users
```

#### Step 5-4: RLS 정책 확인

대시보드 → **Authentication** → **Policies** 또는 SQL로:

```sql
-- RLS 정책 확인
SELECT tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

**출력 예시**:
```
tablename | policyname | permissive | roles | qual | with_check
-----------|-----------|-----------|----------|------|----------
users | Users can view their own data | PERMISSIVE | {authenticated} | ... |
users | Users can update their own data | PERMISSIVE | {authenticated} | ... |
posts | Users can view published posts or their own posts | PERMISSIVE | {authenticated} | ... |
posts | Users can update their own posts | PERMISSIVE | {authenticated} | ... |
posts | Users can delete their own posts | PERMISSIVE | {authenticated} | ... |
```

#### Step 5-5: 전체 스키마 다이어그램 확인

대시보드 → **Database** → **Schemas** → **public** → 테이블 관계 시각화:

```
┌────────────┐
│   users    │
│ (id, ...) │
└────────────┘
      ▲
      │ (foreign key)
      │
┌────────────┐
│   posts    │
│ (user_id) │
└────────────┘
```

#### 완료 확인

- ✅ Supabase 대시보드 접속 가능
- ✅ `supabase_migrations` 테이블에 3개 migration 기록 확인
- ✅ `users`, `posts` 테이블 모두 생성됨
- ✅ `bio` 컬럼이 users에 추가됨
- ✅ RLS 정책 5개 모두 활성화됨
- ✅ 외래키 관계 정상 작동

---

## 핵심 요약

| 항목 | 설명 |
|------|------|
| **Migration 생성** | `supabase migration new <name>` |
| **SQL 작성** | CREATE TABLE, ALTER TABLE, 인덱스, RLS 정책 등 |
| **로컬 적용** | `supabase db reset` (모든 migration 순서대로 실행) |
| **여러 Migration** | 타임스탬프로 자동 정렬 → 순서 보장 |
| **외래키** | `REFERENCES table(column) ON DELETE CASCADE` |
| **기존 테이블 수정** | `ALTER TABLE ... ADD/DROP/RENAME COLUMN` |
| **Git 커밋** | migration 파일도 버전 관리 필수 |
| **확인 방법** | Supabase 대시보드 또는 `supabase_migrations` 테이블 |

---

## 다음 단계

**06-C-11 CI 파이프라인에서 Migration 자동 적용**

- GitHub Actions에서 `supabase db push` 명령어 설정하기
- 환경 변수로 원격 DB 접근 설정하기
- CI에서 자동으로 production migration 적용하기
- 마이그레이션 실패 시 자동 롤백 전략
- 프로덕션 DB의 migration 상태 모니터링

---

## 자주 겪는 오류 및 해결법

| 오류 | 원인 | 해결법 |
|------|-----|-------|
| **Foreign key violation** | 참조하는 테이블이 없음 | migration 순서 확인 (부모 테이블이 먼저 생성되어야 함) |
| **Column already exists** | `ADD COLUMN`을 두 번 실행 | `IF NOT EXISTS` 사용 |
| **Cannot drop table** | 다른 테이블이 외래키로 참조 중 | 자식 테이블을 먼저 삭제하고 `CASCADE` 옵션 사용 |
| **Invalid SQL syntax** | 쿼리 문법 오류 | SQL 문법 재확인 (특히 따옴표, 세미콜론) |
| **supabase db reset fails** | 로컬 Docker 상태 이상 | `docker restart supabase_db` 실행 |

---

## 참고 자료

**Supabase 공식 문서**:
- [Supabase CLI - DB Migrations](https://supabase.com/docs/reference/cli/supabase-migration-new)
- [SQL Language Reference](https://www.postgresql.org/docs/current/sql.html)

**FE 개발자를 위한 팁**:
- Migration은 "DB의 버전 관리"
- 모든 팀원이 같은 스키마 유지
- 다음 수업에서 CI/CD로 자동 배포!
