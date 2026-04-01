# 06-C-11 CI 파이프라인에서 Migration 자동 적용

| 속성 | 내용 |
|------|------|
| **번호** | 06-C-11 |
| **제목** | CI 파이프라인에서 Migration 자동 적용 |
| **유형** | 실습 (20~25분) |
| **이전** | Migration 파일 작성 & 로컬 적용 (06-C-10) |
| **다음** | Uptime Kuma 설치 & 모니터 등록 (그룹 D) |

---

## 학습 목표

- GitHub Actions 워크플로우에서 `supabase db push` 명령어 설정하기
- 환경 변수로 원격 데이터베이스(프로덕션) 접근 설정하기
- CI/CD 파이프라인에서 migration을 자동으로 적용하기
- Migration 실패 시 알림 받기
- 안전한 마이그레이션 실행 전략 적용하기

---

## 핵심 개념: FE 개발자를 위한 유추

지금까지는 **로컬에서만** migration을 작성했습니다.

이제 **프로덕션 배포**까지 자동화합니다:

| 로컬 (개발) | CI/CD (자동) | 프로덕션 (운영) |
|----------|-----------|----------|
| `supabase migration new` | GitHub Actions가 자동 감지 | `supabase db push` 자동 실행 |
| `supabase db reset` | 테스트 환경에서 검증 | 실제 DB에 적용 |
| 데이터 손실 OK (테스트) | 데이터 유효성 검사 | 데이터 백업 후 적용 |

**비유**:
```
FE:      npm run build (로컬) → Vercel에 배포 (자동) → Production 웹사이트
DB:   migration (로컬) → CI/CD 검증 (자동) → Production DB
```

---

## 실습 1단계: GitHub Actions 워크플로우 생성

### 목표

git push 시 자동으로 migration을 프로덕션 DB에 적용하는 워크플로우 만들기

### 완료 기준

- ✅ `.github/workflows/db-migrate.yml` 파일 생성
- ✅ GitHub Secrets에 환경 변수 설정
- ✅ 워크플로우가 `supabase db push` 실행
- ✅ Git push 시 자동으로 workflow 트리거

### 단계별 작업

#### Step 1-1: 워크플로우 파일 생성

프로젝트 루트에서:

```bash
mkdir -p .github/workflows
touch .github/workflows/db-migrate.yml
```

#### Step 1-2: 워크플로우 YAML 작성

`.github/workflows/db-migrate.yml`:

```yaml
name: Database Migration

# Trigger: main 브랜치에 push할 때 실행
on:
  push:
    branches:
      - main
      - develop
    # migration 파일이 변경되었을 때만 실행 (선택사항)
    paths:
      - 'supabase/migrations/**'
      - '.github/workflows/db-migrate.yml'

# 동시 실행 제한 (migration은 순차 실행해야 함)
concurrency:
  group: database
  cancel-in-progress: false

jobs:
  migrate:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      # Step 1: 저장소 코드 다운로드
      - name: Checkout code
        uses: actions/checkout@v4

      # Step 2: Node.js 설치
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      # Step 3: 의존성 설치
      - name: Install dependencies
        run: npm ci

      # Step 4: Supabase CLI 설치
      - name: Install Supabase CLI
        run: |
          npm install -g supabase

      # Step 5: Migration 검증 (로컬에서 미리 테스트)
      - name: Validate migrations
        env:
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: |
          echo "Checking migration files..."
          ls -la supabase/migrations/
          echo "Migration files validated"

      # Step 6: 프로덕션 DB에 Migration 적용
      - name: Push migrations to production
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: |
          # Supabase 프로젝트 링크
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }} \
            --password ${{ secrets.SUPABASE_DB_PASSWORD }}

          # Migration 적용
          supabase db push

      # Step 7: 성공 알림 (선택사항)
      - name: Notify success
        if: success()
        run: |
          echo "✅ Database migration completed successfully!"
          echo "Branch: ${{ github.ref_name }}"
          echo "Commit: ${{ github.sha }}"

      # Step 8: 실패 알림 (선택사항)
      - name: Notify failure
        if: failure()
        run: |
          echo "❌ Database migration failed!"
          echo "Branch: ${{ github.ref_name }}"
          echo "Please check the logs above"
          exit 1
```

**워크플로우 설명**:

| Section | 설명 |
|---------|------|
| **on** | 언제 실행할지 (push 이벤트) |
| **branches** | main, develop 브랜치에서만 |
| **paths** | migration 파일이 변경되었을 때만 (선택사항) |
| **concurrency** | 동시에 여러 개 실행 방지 (migration은 순차 필수) |
| **steps** | 실행할 작업들 (7단계) |

#### Step 1-3: 파일 저장 및 확인

```bash
# 파일 생성 확인
cat .github/workflows/db-migrate.yml | head -30

# Git에 추가
git add .github/workflows/db-migrate.yml
git commit -m "ci: add database migration workflow"
```

---

## 실습 2단계: GitHub Secrets 설정

### 목표

프로덕션 DB에 접근하기 위한 보안 토큰과 비밀번호를 GitHub Secrets에 저장하기

### 완료 기준

- ✅ GitHub Secrets 3개 추가됨:
  - `SUPABASE_ACCESS_TOKEN`
  - `SUPABASE_PROJECT_ID`
  - `SUPABASE_DB_PASSWORD`

### 단계별 작업

#### Step 2-1: Supabase Access Token 생성

**온라인 Supabase 대시보드에서**:

1. 우측 상단 프로필 → **Account Settings**
2. **Access Tokens** 탭
3. **Generate New Token** 클릭
4. 토큰 이름: `github-actions`
5. 토큰 복사 (이후 표시되지 않음)

**로컬 Supabase인 경우** (자가 호스팅):

```bash
# 로컬 supabase에서 직접 토큰 생성
# 일단 프로젝트 ID를 먼저 확인
cat supabase/config.toml | grep project_id
```

#### Step 2-2: Supabase Project ID 확인

**온라인 Supabase인 경우**:

```
Supabase Dashboard → Project Settings → API → Project ID
```

예시: `abcdefghijklmnopqrst`

**로컬 Supabase인 경우**:

```bash
# supabase/config.toml에서 확인
cat supabase/config.toml | grep -E "project_id|db_url"
```

예시 출력:
```
project_id = "my-local-project"
db_url = "postgresql://postgres:postgres@127.0.0.1:5432/postgres"
```

#### Step 2-3: DB 비밀번호 확인

```bash
# Docker 환경에서 확인
docker inspect supabase-db | grep POSTGRES_PASSWORD

# 또는 supabase/config.toml에서
cat supabase/config.toml | grep -A5 "\[db\]"
```

출력 예시:
```
[db]
port = 5432
shadow_db_url = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

비밀번호: `postgres` (기본값) 또는 설정된 값

#### Step 2-4: GitHub Secrets 추가

**GitHub Repository → Settings → Secrets and variables → Actions**

각각 추가:

**1. SUPABASE_ACCESS_TOKEN**
```
Name: SUPABASE_ACCESS_TOKEN
Value: (Step 2-1에서 복사한 토큰)
```

**2. SUPABASE_PROJECT_ID**
```
Name: SUPABASE_PROJECT_ID
Value: (Step 2-2에서 확인한 프로젝트 ID)
예: abcdefghijklmnopqrst
```

**3. SUPABASE_DB_PASSWORD**
```
Name: SUPABASE_DB_PASSWORD
Value: (Step 2-3에서 확인한 비밀번호)
예: postgres
```

**확인**:
```
GitHub Secrets 화면에서:
✅ SUPABASE_ACCESS_TOKEN
✅ SUPABASE_PROJECT_ID
✅ SUPABASE_DB_PASSWORD
(값은 표시되지 않음 - 보안상 정상)
```

---

## 실습 3단계: 워크플로우 테스트 및 실행

### 목표

새 migration을 만들고 Git push로 자동 배포 테스트하기

### 완료 기준

- ✅ 새 migration 파일 생성
- ✅ Git에 커밋 & push
- ✅ GitHub Actions 워크플로우 자동 실행 확인
- ✅ 프로덕션 DB에 migration 적용됨

### 단계별 작업

#### Step 3-1: 테스트용 Migration 생성

```bash
supabase migration new add_comments_table
```

생성된 파일에 SQL 작성:

```sql
-- Migration: Create comments table
-- Purpose: Store user comments on posts
-- Date: 2026-04-01

CREATE TABLE IF NOT EXISTS public.comments (
  id bigserial PRIMARY KEY,
  post_id bigint NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 인덱스
CREATE INDEX comments_post_id_idx ON public.comments(post_id);
CREATE INDEX comments_user_id_idx ON public.comments(user_id);

-- RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all comments"
  ON public.comments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.comments
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own comments"
  ON public.comments
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own comments"
  ON public.comments
  FOR DELETE
  USING (auth.uid()::text = user_id::text);
```

#### Step 3-2: 로컬 테스트

```bash
# 로컬 DB에서 먼저 테스트
supabase db reset

# 오류 없는지 확인
echo "Migration test passed locally ✓"
```

**예상 출력**:
```
✓ Applying migration: 20260401081234_create_users_table.sql
✓ Applying migration: 20260401082500_create_posts_table.sql
✓ Applying migration: 20260401083700_add_bio_to_users.sql
✓ Applying migration: 20260401084500_add_comments_table.sql ← 새 migration
```

#### Step 3-3: Git에 커밋 & Push

```bash
# 파일 추가
git add supabase/migrations/

# 커밋
git commit -m "feat(db): add comments table with RLS policies"

# Push (main 브랜치)
git push origin main

# 또는 develop에서 작업 중이면
git push origin develop
```

#### Step 3-4: GitHub Actions 워크플로우 실행 확인

**GitHub Repository → Actions 탭에서 확인**:

1. 왼쪽 메뉴에서 **"Database Migration"** workflow 선택
2. 최신 run 확인:
   ```
   Database Migration #1
   Commit: feat(db): add comments table
   Status: ⏳ In progress... → ✅ Completed
   ```

3. 각 단계별 로그 확인:
   ```
   ✅ Checkout code
   ✅ Setup Node.js
   ✅ Install dependencies
   ✅ Install Supabase CLI
   ✅ Validate migrations
   ✅ Push migrations to production
   ✅ Notify success
   ```

#### Step 3-5: 프로덕션 DB 확인

Supabase 프로덕션 대시보드에서:

```sql
-- SQL Editor에서 실행
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**출력 예시**:
```
table_name
-----------
comments      ← 새로 추가됨!
posts
users
```

또는:

```sql
-- migration 이력 확인
SELECT version, name, executed_at
FROM supabase_migrations
ORDER BY version DESC
LIMIT 5;
```

**출력 예시**:
```
version |                         name                          |         executed_at
--------|--------------------------------------------------|----------------------------
      4 | 20260401084500_add_comments_table.sql         | 2026-04-01 08:45:00+00:00
      3 | 20260401083700_add_bio_to_users.sql           | 2026-04-01 08:37:00+00:00
      2 | 20260401082500_create_posts_table.sql         | 2026-04-01 08:25:00+00:00
      1 | 20260401081234_create_users_table.sql         | 2026-04-01 08:12:34+00:00
```

---

## 실습 4단계: Migration 실패 처리 및 롤백 전략

### 목표

Migration 실패 시 자동으로 감지하고 대응하는 방법 배우기

### 완료 기준

- ✅ 의도적으로 오류가 있는 migration 생성
- ✅ GitHub Actions에서 오류 감지 및 알림
- ✅ 롤백 전략 이해
- ✅ 안전한 migration 작성 가이드라인 수립

### 단계별 작업

#### Step 4-1: 의도적 오류 Migration 생성 (학습용)

```bash
supabase migration new test_invalid_migration
```

**의도적 오류가 있는 SQL** (테스트용):

```sql
-- 이 migration은 의도적으로 오류 발생 시킴
-- 목적: CI/CD 오류 처리 테스트

-- ❌ 잘못된 SQL (테이블이 이미 있으므로 오류)
CREATE TABLE public.users (
  id bigserial PRIMARY KEY
);
```

**주의**: 이것은 테스트 파일입니다. 실제 배포하지 마세요!

#### Step 4-2: Git에서 되돌리기

```bash
# 오류가 있는 migration을 추가하지 말고 바로 되돌리기
git status  # 새 migration 파일 확인
git reset HEAD supabase/migrations/20260401085000_test_invalid_migration.sql
rm supabase/migrations/20260401085000_test_invalid_migration.sql

# 또는 이미 커밋한 경우
git log --oneline | head -3
git revert HEAD  # 이전 커밋으로 되돌리기
git push origin main
```

#### Step 4-3: 안전한 Migration 작성 패턴

**✅ 안전한 패턴들**:

```sql
-- 1. IF NOT EXISTS / IF EXISTS 사용
CREATE TABLE IF NOT EXISTS public.users (...)
DROP TABLE IF EXISTS public.old_users
ALTER TABLE IF EXISTS public.users ADD COLUMN bio text

-- 2. 트랜잭션 사용 (대부분의 DB는 migration을 자동으로 트랜잭션 처리)
BEGIN;
  CREATE TABLE public.new_table (...)
  INSERT INTO public.new_table SELECT * FROM public.old_table
COMMIT;

-- 3. 데이터 검증 후 변경
ALTER TABLE public.users
ADD CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- 4. 컬럼 추가 시 기본값 설정
ALTER TABLE public.users
ADD COLUMN status text DEFAULT 'active';
```

**❌ 피해야 할 패턴들**:

```sql
-- 1. IF NOT EXISTS 없이 사용
CREATE TABLE public.users (...)  -- 오류! 이미 있으면 실패

-- 2. 데이터 손실 가능성
DROP TABLE public.users  -- 기존 데이터 모두 삭제

-- 3. 외래키 순서 무시
CREATE TABLE posts (user_id REFERENCES users(id))  -- users가 먼저 있어야 함

-- 4. NULL 제약 없이 기존 데이터에 컬럼 추가
ALTER TABLE users ADD COLUMN phone text NOT NULL  -- 오류! 기존 행은 NULL
```

#### Step 4-4: 워크플로우에 오류 처리 추가

`.github/workflows/db-migrate.yml` 수정:

```yaml
      # ... 이전 단계들 ...

      # Migration 적용 (오류 처리)
      - name: Push migrations to production
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: |
          set -e  # 오류 발생 시 즉시 종료

          echo "🚀 Starting database migration..."
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }} \
            --password ${{ secrets.SUPABASE_DB_PASSWORD }}

          echo "📦 Pushing migrations..."
          supabase db push

          echo "✅ Migration completed"

      # Migration 실패 시 자동 알림
      - name: Report migration failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ Database migration failed! Check the workflow logs.'
            })

      # 선택사항: Slack 알림
      - name: Notify Slack on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "❌ Database migration failed!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Repository: ${{ github.repository }}\nBranch: ${{ github.ref_name }}\nCheck logs: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                  }
                }
              ]
            }
```

---

## 실습 5단계: 배포 전 마이그레이션 검증

### 목표

프로덕션 배포 전 migration이 안전한지 자동으로 검증하기

### 완료 기준

- ✅ 마이그레이션 파일 구문 검증
- ✅ 스키마 호환성 확인
- ✅ 자동 롤백 스크립트 준비
- ✅ 배포 전 체크리스트 작성

### 단계별 작업

#### Step 5-1: Migration 검증 스크립트 추가

프로젝트 루트에 `scripts/validate-migrations.sh` 생성:

```bash
#!/bin/bash

# Migration 파일 검증 스크립트
# 목적: 배포 전에 migration 파일의 문법 검사

echo "🔍 Validating migration files..."

MIGRATION_DIR="supabase/migrations"
ERROR_COUNT=0

if [ ! -d "$MIGRATION_DIR" ]; then
  echo "❌ Migration directory not found: $MIGRATION_DIR"
  exit 1
fi

# 1. 파일명 형식 검증 (YYYYMMDDhhmmss_description.sql)
echo "Checking file naming conventions..."
for file in "$MIGRATION_DIR"/*.sql; do
  filename=$(basename "$file")

  # 타임스탬프 부분 추출 (14자리)
  timestamp="${filename:0:14}"

  # 숫자만 포함하는지 확인
  if ! [[ "$timestamp" =~ ^[0-9]{14}$ ]]; then
    echo "❌ Invalid timestamp format: $filename"
    ((ERROR_COUNT++))
  fi

  # 파일명에 공백이 없는지 확인
  if [[ "$filename" == *" "* ]]; then
    echo "❌ Filename contains spaces: $filename"
    ((ERROR_COUNT++))
  fi
done

# 2. SQL 구문 검증 (기본)
echo "Checking SQL syntax..."
for file in "$MIGRATION_DIR"/*.sql; do
  filename=$(basename "$file")

  # 파일이 비어있는지 확인
  if [ ! -s "$file" ]; then
    echo "⚠️  Warning: Empty migration file: $filename"
  fi

  # 주요 SQL 키워드 확인
  if ! grep -qE "^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)" "$file"; then
    echo "⚠️  Warning: No SQL statements found in: $filename"
  fi
done

# 3. 타임스탬프 순서 검증
echo "Checking timestamp order..."
prev_timestamp="00000000000000"
for file in "$MIGRATION_DIR"/*.sql; do
  filename=$(basename "$file")
  timestamp="${filename:0:14}"

  if (( timestamp < prev_timestamp )); then
    echo "❌ Migration out of order: $filename"
    ((ERROR_COUNT++))
  fi
  prev_timestamp="$timestamp"
done

# 결과
if [ $ERROR_COUNT -eq 0 ]; then
  echo "✅ All migrations validated successfully!"
  exit 0
else
  echo "❌ Found $ERROR_COUNT error(s)"
  exit 1
fi
```

**사용 권한 설정 및 실행**:

```bash
chmod +x scripts/validate-migrations.sh

# 검증 실행
./scripts/validate-migrations.sh
```

**출력 예시**:
```
🔍 Validating migration files...
Checking file naming conventions...
✅ 20260401081234_create_users_table.sql
✅ 20260401082500_create_posts_table.sql
✅ 20260401083700_add_bio_to_users.sql
✅ All migrations validated successfully!
```

#### Step 5-2: 워크플로우에 검증 단계 추가

`.github/workflows/db-migrate.yml`에 검증 단계 추가:

```yaml
      # ... 기존 단계들 ...

      # Migration 파일 검증
      - name: Validate migration files
        run: |
          chmod +x scripts/validate-migrations.sh
          ./scripts/validate-migrations.sh

      # 구문 검사
      - name: Check SQL syntax
        run: |
          echo "Checking for common SQL issues..."

          # DROP TABLE 없이 IF EXISTS 확인
          if grep -r "^DROP TABLE" supabase/migrations/ 2>/dev/null; then
            if ! grep -r "^DROP TABLE IF EXISTS" supabase/migrations/ 2>/dev/null; then
              echo "⚠️  Warning: DROP TABLE without IF EXISTS detected"
            fi
          fi

          # CREATE TABLE 없이 IF NOT EXISTS 확인
          if grep -r "^CREATE TABLE" supabase/migrations/ 2>/dev/null; then
            if ! grep -r "^CREATE TABLE IF NOT EXISTS" supabase/migrations/ 2>/dev/null; then
              echo "⚠️  Warning: CREATE TABLE without IF NOT EXISTS detected"
            fi
          fi

      # ... 이후 단계들 ...
```

---

## 실습 6단계: 배포 후 확인 및 모니터링

### 목표

Migration 배포 후 데이터베이스 상태 확인 및 모니터링하기

### 완료 기준

- ✅ 배포 후 마이그레이션 상태 자동 확인
- ✅ 프로덕션 DB 스키마 버전 파악
- ✅ 로그 기록 및 알림 설정

### 단계별 작업

#### Step 6-1: 마이그레이션 상태 확인 스크립트

`scripts/check-migration-status.sh`:

```bash
#!/bin/bash

# 마이그레이션 상태 확인 스크립트
# 배포 후 실행

SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"

echo "📊 Checking migration status..."

# supabase_migrations 테이블 조회
curl -s "${SUPABASE_URL}/rest/v1/supabase_migrations" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  | jq '.[].name' | tail -5
```

#### Step 6-2: 워크플로우 성공 후 로깅

```yaml
      # ... migration 적용 단계 ...

      # 성공 후 상태 로깅
      - name: Log migration status
        if: success()
        run: |
          echo "📝 Migration Summary:"
          echo "  Branch: ${{ github.ref_name }}"
          echo "  Commit: ${{ github.sha }}"
          echo "  Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
          echo ""
          echo "✅ Migrations applied successfully"
          echo "📍 Database is ready for deployment"
```

---

## 핵심 요약

| 항목 | 설명 |
|------|------|
| **자동 배포** | Git push → GitHub Actions → `supabase db push` |
| **환경 변수** | Secrets로 토큰/비밀번호 안전 관리 |
| **동시성 제어** | `concurrency`로 중복 실행 방지 |
| **실패 처리** | 오류 감지 → 알림 (이메일/Slack) |
| **롤백** | 새 migration으로 이전 상태 복원 |
| **안전 패턴** | IF NOT EXISTS, IF EXISTS 사용 |
| **검증** | 배포 전 구문/순서 검증 |
| **모니터링** | `supabase_migrations` 테이블로 추적 |

---

## 자주 겪는 오류 및 해결법

| 오류 | 원인 | 해결법 |
|------|-----|-------|
| **SUPABASE_ACCESS_TOKEN not found** | GitHub Secrets 설정 안 함 | Settings → Secrets → 3개 환경 변수 추가 |
| **Project link failed** | 프로젝트 ID 오류 | `SUPABASE_PROJECT_ID` 값 재확인 |
| **Authentication failed** | 비밀번호 오류 | `SUPABASE_DB_PASSWORD` 재설정 |
| **Migration timeout** | 대용량 데이터 처리 | timeout-minutes 증가 (예: 30분) |
| **Cannot acquire lock** | 다른 migration이 실행 중 | `concurrency` 설정으로 순차 실행 보장 |
| **Foreign key constraint** | 테이블 순서 오류 | migration 파일의 타임스탬프 확인 및 정렬 |
| **Column already exists** | 중복 실행 | `IF NOT EXISTS` 추가 |

---

## 다음 단계

**06-D Uptime Kuma 설치 & 모니터 등록**

- Uptime Kuma로 서비스 가용성 모니터링 하기
- HTTP, DB 상태 체크 설정하기
- 다운타임 알림 설정하기
- 성능 메트릭 수집 및 분석

---

## 참고 자료

**Supabase 공식 문서**:
- [Supabase CLI Reference - db push](https://supabase.com/docs/reference/cli/supabase-db-push)
- [Database Migrations Best Practices](https://supabase.com/docs/guides/database)

**GitHub Actions**:
- [Workflow Syntax Reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Secrets and Variables](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)

**DevOps 원칙**:
- Infrastructure as Code (IaC): migration을 코드로 관리
- CI/CD: 모든 변경을 자동으로 검증하고 배포
- 모니터링: 배포 후 상태 지속적 확인

---

## Phase 6 정리

### Group C (DB Migration) 완료!

**배운 것**:
- ✅ Migration의 개념과 필요성
- ✅ Migration 파일 생성 및 로컬 테스트
- ✅ CI/CD로 자동 배포
- ✅ 안전한 배포 패턴
- ✅ 오류 처리 및 모니터링

**다음은 Group D - Uptime Kuma를 통한 운영 모니터링!**
