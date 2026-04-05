# 06-C-09 Supabase Migration 개념 & 파일 구조

| 속성 | 내용 |
|------|------|
| **번호** | 06-C-09 |
| **제목** | Supabase Migration 개념 & 파일 구조 |
| **유형** | 개념 (10분) |
| **이전** | Supabase CLI 설치 & 프로젝트 초기화 (06-B-08) |
| **다음** | Migration 파일 작성 & 로컬 적용 (06-C-10) |

---

## 학습 목표

- Migration의 개념과 왜 필요한지 이해하기
- Supabase Migration 파일의 구조와 저장 위치 파악하기
- 타임스탬프 기반의 파일 네이밍 규칙 이해하기
- Git의 커밋 개념과 DB 마이그레이션의 유사성 파악하기

---

## 핵심 개념: FE 개발자를 위한 유추

### Migration이 뭔가요?

**Database Migration**은 **데이터베이스 스키마를 변경하고 기록하는 과정**입니다.

FE 개발자 입장에서는 이렇게 생각하면 됩니다:

| Git | Database |
|-----|----------|
| `git commit`으로 코드 변경을 기록 | `migration` 파일로 DB 스키마 변경을 기록 |
| `git log`로 커밋 이력 확인 | `supabase/migrations/` 폴더로 마이그레이션 이력 확인 |
| 이전 커밋으로 checkout | 특정 마이그레이션 상태로 DB 복원 가능 |
| Pull Request로 코드 변경 검토 | Migration 파일로 DB 변경 내용 검토 |

**핵심**: Migration = DB 버전 관리 ✓

### 왜 Migration이 필요한가요?

1. **협업 시 안전한 DB 변경 공유**
   - 팀원이 새로운 테이블을 추가했을 때, `migration` 파일로 공유
   - 모두 같은 DB 스키마 상태 유지

2. **자동 배포 시 DB 변경 자동 적용**
   - CI/CD 파이프라인에서 자동으로 migration 실행
   - 개발자가 수동으로 `ALTER TABLE` 할 필요 없음

3. **프로덕션 DB 변경의 추적성**
   - 언제, 누가, 무엇을 변경했는지 기록
   - 문제 발생 시 이전 상태로 롤백 가능

4. **로컬 ↔ 프로덕션 DB 동기화**
   - 로컬에서 작성한 migration을 프로덕션에 자동 적용
   - "내 로컬에서는 되는데 프로덕션에서 안 되는" 문제 해결

### FE 개발자와의 연관성

**"왜 백엔드/DevOps만의 일인가?"**라고 생각할 수 있지만:

- **Supabase self-hosted**: FE 개발자도 DB를 직접 운영
- **전체 스택 이해**: 배포 자동화 설정할 때 migration 이해 필수
- **Next.js App Router**: 상황에 따라 DB 스키마 변경 필요
  - 예: 새 기능 개발 → 테이블 추가 → migration 생성 → CI로 자동 배포

---

## Supabase Migration 파일 구조

### 파일 저장 위치

```
your-project/
├── supabase/
│   ├── config.toml          # Supabase 로컬 설정
│   ├── migrations/          # 모든 migration 파일 저장
│   │   ├── 20260401080000_create_users_table.sql
│   │   ├── 20260401090500_add_posts_table.sql
│   │   └── 20260401091000_add_user_id_to_posts.sql
│   └── seed.sql            # 로컬 개발용 더미 데이터
└── README.md
```

**중요**: `supabase/migrations/` 폴더는 **Git으로 추적해야 합니다**.
- `.gitignore`에서 제외할 때 실수하지 않기
- 모든 migration 파일이 저장소에 커밋되어야 함

### Migration 파일의 네이밍 규칙

```
{TIMESTAMP}_{설명}.sql
```

**타임스탬프 포맷**: `YYYYMMDDhhmmss`

**예시**:
```
20260401080000_create_users_table.sql
├─ 2026      : 연도
├─ 04        : 월
├─ 01        : 일
├─ 08        : 시간 (UTC)
├─ 00        : 분
├─ 00        : 초
└─ _create_users_table : 설명 (영문, 언더스코어로 공백 표현)
```

**또 다른 예시**:
```
20260401090530_add_email_verification.sql
20260401091045_create_posts_table.sql
20260402100000_add_indexes_for_performance.sql
```

**명명 규칙**:
- 타임스탐프 必須 (자동으로 생성됨)
- 설명은 **작업 내용**을 명확하게 (영문만 사용)
- 과거 날짜로 변경하지 말 것 (마이그레이션 순서 보장)
- 공백은 언더스코어로 표현

---

## Migration 파일의 내용 구조

### 기본 SQL 구조

```sql
-- 테이블 생성 예시
CREATE TABLE public.users (
  id bigserial primary key,
  email text unique not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 인덱스 생성
CREATE INDEX users_email_idx ON public.users(email);

-- RLS 정책 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);
```

### 중요 원칙

1. **멱등성 (Idempotency)**
   ```sql
   -- ✅ 좋음 (이미 있으면 넘어감)
   CREATE TABLE IF NOT EXISTS public.users (...)

   -- ❌ 피할 것 (중복 실행 시 오류)
   CREATE TABLE public.users (...)
   ```

2. **한 파일 = 한 가지 작업**
   ```
   ✅ 20260401080000_create_users_table.sql
   ✅ 20260401090000_add_email_index.sql

   ❌ 20260401080000_create_users_and_posts_and_comments.sql (너무 많은 작업)
   ```

3. **주석으로 목적 설명**
   ```sql
   -- Migration: Add email verification status
   -- Purpose: Track which users have verified their email addresses
   -- Date: 2026-04-01

   ALTER TABLE public.users ADD COLUMN email_verified boolean default false;
   ```

---

## Migration 파일 vs 수동 SQL의 차이

### 수동 SQL (❌ 피해야 함)

```
문제점:
1. "누가 언제 변경했는지" 기록 안 됨
2. 다른 개발자는 모르고 같은 작업 중복 실행 가능
3. 프로덕션에서만 변경되고 로컬과 차이 발생
4. 실수로 이전 상태로 돌리기 어려움
```

**상황**: DBeaver에서 직접 `ALTER TABLE users ADD COLUMN`을 실행

### Migration 파일 (✅ 권장)

```
장점:
1. 모든 변경이 파일로 기록됨 → Git 히스토리에서 추적
2. 팀원이 같은 변경을 중복으로 할 수 없음
3. 자동 배포 시 이 파일들이 자동으로 실행됨
4. 타임스탬프 순서대로 순차 실행 보장
```

**상황**: `supabase migration new` 명령어로 파일 생성 → SQL 작성 → Git 커밋

---

## Migration 실행 순서와 메커니즘

### 어떻게 순서를 보장하나?

```
1. Supabase는 모든 migration 파일을 타임스탬프 순서대로 정렬
2. 데이터베이스의 내부 테이블 (supabase_migrations)에서 "어떤 migration이 실행됐는지" 기록
3. 새 migration이 추가되면, 아직 실행되지 않은 파일들만 실행
```

**supabase_migrations 테이블**:
```
version     | name                                  | statements | hash  | executed_at
------------|---------------------------------------|------------|-------|------------------------
1           | 20260401080000_create_users_table     | 3          | abc.. | 2026-04-01 08:00:05
2           | 20260401090500_add_posts_table        | 2          | def.. | 2026-04-01 09:05:10
3           | 20260401091000_add_user_id_to_posts   | 1          | ghi.. | 2026-04-01 09:10:15
```

**핵심**: 타임스탬프 순서 = 실행 순서 ✓

---

## UP / DOWN 개념 (선택 사항)

### Traditional Migration Framework의 UP/DOWN

일부 마이그레이션 도구(Rails, Sequelize 등)는:
```
up:   새 스키마로 변경하는 SQL
down: 이전 스키마로 되돌리는 SQL
```

### Supabase의 경우

```
특징:
- UP만 구현 (down은 없음)
- 이유: 프로덕션에서 롤백이 간단하지 않음
- 대신: 새로운 migration으로 "이전 상태로 돌리는" SQL 작성
```

**예시**:
```
Migration 1: CREATE TABLE users
Migration 2: ALTER TABLE users ADD COLUMN email
Migration 3: ALTER TABLE users DROP COLUMN email (롤백)
```

**장점**:
- 데이터 손실 방지
- 모든 변경이 기록됨
- "롤백"도 하나의 migration으로 추적

---

## Migration 파일 실행 흐름 (요약)

```
┌─────────────────────────────────────────────────────┐
│ 1. 개발자: supabase migration new "add_posts_table" │
│    → 타임스탬프_add_posts_table.sql 파일 생성      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. 개발자: SQL 작성                                  │
│    CREATE TABLE public.posts (...)                   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. 로컬 테스트: supabase db reset                   │
│    → 로컬 DB에 모든 migration 순서대로 적용        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 4. Git 커밋: migration 파일 + 코드 커밋             │
│    git commit -m "feat: add posts table"             │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 5. CI/CD: GitHub Actions에서 자동 실행              │
│    supabase db push (원격 DB에 migration 적용)     │
└─────────────────────────────────────────────────────┘
```

---

## 핵심 요약

| 항목 | 설명 |
|------|------|
| **Migration** | DB 스키마 변경을 버전 관리하는 방식 |
| **파일 위치** | `supabase/migrations/` |
| **파일명** | `YYYYMMDDhhmmss_설명.sql` |
| **실행 순서** | 타임스탬프 순 (자동 정렬) |
| **기록 방식** | DB 내부 테이블에 기록 |
| **Git 관리** | 모든 파일을 저장소에 커밋 |
| **자동 배포** | CI/CD에서 자동으로 실행 |
| **롤백** | 새 migration으로 이전 상태로 변경 |

---

## 다음 단계

**06-C-10 Migration 파일 작성 & 로컬 적용**

- `supabase migration new` 명령어로 파일 생성하기
- CREATE TABLE, ALTER TABLE 등 실제 SQL 작성하기
- `supabase db reset`으로 로컬에서 테스트하기
- 여러 migration을 순서대로 실행하기
- Migration 적용 상태 확인하기

---

## 참고 자료

**Supabase 공식 문서**:
- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/managing-db-migrations)
- [Database Migrations Best Practices](https://supabase.com/docs/guides/database)

**개념 연관**:
- Git의 커밋 개념과 유사
- 모든 변경을 기록 → 추적 가능 → 협업 가능
- 프로덕션 배포 자동화의 필수 요소
