# 06-B-08: Supabase CLI 설치 & 프로젝트 초기화

| 속성 | 내용 |
|------|------|
| **번호** | 06-B-08 |
| **제목** | Supabase CLI 설치 & 프로젝트 초기화 |
| **유형** | 실습 (15~20분) |
| **이전** | 서버 측 배포 쉘 스크립트 작성 (06-B-07) |
| **다음** | Supabase Migration 개념 & 파일 구조 (그룹 C) |

---

## 학습 목표

- Supabase CLI를 로컬 개발 환경과 배포 서버에 설치하기
- `supabase init`으로 프로젝트 초기화하기
- `supabase start`로 로컬 개발 환경 구성하기
- 원격 Supabase 프로젝트에 CLI 연결하기 (링크)
- 마이그레이션 파일 구조와 용도 이해하기

---

## 핵심 개념: FE 개발자를 위한 유추

Supabase CLI를 npm 생태계에 비유하면:

```
npm 패키지 관리          Supabase CLI 관리
├─ npm install          ├─ supabase init (프로젝트 초기화)
├─ npm run build        ├─ supabase start (로컬 개발 서버)
├─ npm test             ├─ supabase test (테스트 실행)
├─ npm run dev          └─ supabase db push (마이그레이션 적용)
└─ package.json 버전    └─ migrations/ 스크마 파일

package-lock.json = supabase/migrations/ (데이터베이스 버전 관리)
```

**Supabase CLI의 역할:**
```
로컬 개발                  원격 프로젝트
┌─────────────────────────────────────────┐
│ supabase start          Supabase Cloud   │
│ └─ PostgreSQL (로컬)   └─ PostgreSQL    │
│ └─ Auth DB (로컬)      └─ Auth, Storage │
│                                          │
│ supabase db push ──→ 마이그레이션 적용  │
│ supabase pull ←─── 원격 스크마 동기화   │
└─────────────────────────────────────────┘
```

---

## 실습 1단계: Supabase CLI 설치

### 목표
로컬 개발 환경과 배포 서버에 Supabase CLI 설치하기

### 완료 기준
- `supabase --version` 명령어로 설치 확인
- CLI 버전 1.x 이상

### 단계별 작업

**1-1) 로컬 개발 환경에 설치 (macOS/Linux)**

```bash
# 방법 1: Homebrew (macOS 권장)
brew install supabase/tap/supabase

# 방법 2: NPM
npm install -g @supabase/cli

# 방법 3: Yarn
yarn global add @supabase/cli

# 방법 4: 바이너리 다운로드 (Linux)
curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install.sh | sh
```

**1-2) 설치 확인**

```bash
# 버전 확인
supabase --version
# Supabase CLI version: 1.144.0

# 헬프 확인
supabase --help
# Usage: supabase <command>
#
# Commands:
#   init      Initialize a new Supabase project
#   start     Start the local development server
#   stop      Stop the local development server
#   push      Push database schema changes
#   pull      Pull database schema from remote
#   ...
```

**1-3) 배포 서버에 설치**

배포 서버에 SSH 접속 후:

```bash
# 1. 배포 서버에 SSH 접속
ssh root@deploy.example.com

# 2. Supabase CLI 설치
curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install.sh | sh

# 3. PATH 업데이트
export PATH="$PATH:$HOME/.supabase/bin"

# 4. 설치 확인
supabase --version

# 5. 로그아웃
exit
```

**1-4) Docker에서 Supabase CLI 사용 (선택사항)**

Docker 컨테이너 내에서 마이그레이션 실행할 때:

```dockerfile
# Dockerfile
FROM node:18-alpine

# Supabase CLI 설치
RUN npm install -g @supabase/cli

WORKDIR /app
COPY . .

# 마이그레이션 실행 스크립트
CMD ["supabase", "db", "push"]
```

---

## 실습 2단계: 프로젝트 초기화 (supabase init)

### 목표
Git 저장소에서 Supabase 프로젝트 초기화하기

### 완료 기준
- `supabase/` 디렉토리 생성
- 기본 설정 파일 생성 (`supabase/config.toml`)
- migrations 디렉토리 준비

### 단계별 작업

**2-1) 프로젝트 초기화**

프로젝트 루트에서:

```bash
# 1. Supabase 프로젝트 초기화
supabase init

# 프롬프트:
# What is your project name? [my-app]: my-app
# Where would you like to save the project? [./supabase]: supabase

# 생성되는 파일:
# supabase/
# ├── config.toml          (Supabase 설정)
# ├── migrations/          (마이그레이션 파일 디렉토리)
# │   └── 20260401000000_initial_schema.sql
# └── seed.sql             (초기 데이터 생성 스크립트)
```

**2-2) 생성된 파일 구조**

```
supabase/
├── config.toml
│   ├─ [api]
│   │  └─ port = 54321
│   ├─ [db]
│   │  ├─ port = 54322
│   │  └─ major_version = 15
│   └─ [auth]
│      └─ enable_signup = true
│
├── migrations/
│   └─ 20260401000000_initial_schema.sql
│       (예: CREATE TABLE users ...)
│
└── seed.sql
    (개발 환경 초기 데이터)
```

**2-3) config.toml 상세 설명**

```toml
# supabase/config.toml

# API 설정 (PostgREST, GoTrue 등)
[api]
port = 54321                              # 로컬 API 포트
schemas = ["public", "storage", "graphql_public"]
max_rows = 1000

# 데이터베이스 설정
[db]
port = 54322                              # 로컬 PostgreSQL 포트
major_version = 15                        # PostgreSQL 버전
seed_file_path = "supabase/seed.sql"

# 인증 설정
[auth]
enable_signup = true                      # 회원가입 허용
jwt_expiry_secs = 3600                    # JWT 만료 시간
enable_manual_linking = false

# 로컬 개발 환경에만 적용
[studio]
enabled = true                            # Supabase Studio UI
```

**2-4) 초기화 후 디렉토리 구조 확인**

```bash
# 생성된 Supabase 파일 확인
ls -la supabase/

# .gitignore에 추가할 것들 확인
cat .gitignore

# 추가해야 할 항목:
# supabase/.branches/         (로컬 브랜치 정보)
# supabase/.temp/             (임시 파일)
```

---

## 실습 3단계: 로컬 개발 환경 구성 (supabase start)

### 목표
로컬에서 Supabase 개발 서버 실행하기

### 완료 기준
- `supabase start` 명령어로 로컬 개발 서버 시작
- PostgreSQL, API, Auth 서버 모두 정상 작동

### 단계별 작업

**3-1) 로컬 Supabase 시작**

```bash
# 1. 프로젝트 디렉토리에서 Supabase 시작
supabase start

# Docker 설치 필요 (처음 실행 시)
# 설치되지 않았다면: https://docs.docker.com/get-docker/

# 초기 실행 (5~10분 소요):
# Initializing Supabase...
# Pulling supabase/postgres:15.1.0.6...
# Pulling supabase/vector:0.0.0...
# ...
# Started supabase local development server.
#
# API URL: http://localhost:54321
# GraphQL URL: http://localhost:54321/graphql/v1
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
# Inbucket URL: http://localhost:54324
# Vector URL: http://localhost:54325

# 2. 표시된 URL 확인
# - API URL: REST API 서버
# - Studio URL: Supabase UI 관리 도구
# - DB URL: 데이터베이스 직접 접속
```

**3-2) 로컬 환경 변수 설정**

`.env.local` 또는 `.env.development` 파일:

```bash
# Supabase 로컬 개발 환경
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<로컬 anon key>
SUPABASE_DB_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

**로컬 anon key 가져오기:**

```bash
# 1. Supabase Studio UI에서 확인
# http://localhost:54323 → Settings → API

# 또는 2. CLI로 확인
supabase status

# 출력:
# API URL: http://localhost:54321
# Anon key: eyJhbGciOi...
# Service role key: eyJhbGciOi...
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
```

**3-3) 로컬 개발 서버 확인**

```bash
# 1. 로컬 API 헬스 체크
curl http://localhost:54321

# 예상 응답:
# {"version":"15.1.0.6"}

# 2. 로컬 데이터베이스 접속 테스트
psql postgresql://postgres:postgres@localhost:54322/postgres

# 프롬프트:
# postgres=#

# 테이블 확인
\dt

# 로그아웃
\q

# 3. Supabase Studio UI 접속
# 브라우저에서 http://localhost:54323 열기
# → Tables, SQL Editor 등 확인 가능
```

**3-4) 로컬 Supabase 중지**

```bash
# Supabase 종료
supabase stop

# 컨테이너 확인
docker ps | grep supabase
# (비어있어야 함)

# 로컬 상태 초기화 (선택사항)
supabase reset
# ⚠️ 경고: 로컬 데이터 모두 삭제
```

---

## 실습 4단계: 원격 Supabase 프로젝트 연결

### 목표
로컬 CLI를 원격 Supabase 프로젝트와 연결하기

### 완료 기준
- `supabase link`로 원격 프로젝트 연결
- 원격 프로젝트와 로컬 마이그레이션 동기화 가능

### 단계별 작업

**4-1) Supabase 프로젝트 준비**

[Supabase 대시보드](https://app.supabase.com)에서:

1. 프로젝트 생성 또는 선택
2. **Settings** → **API** 탭
3. **Project ID** 복사 (예: `abcdefghijklmnop`)
4. **Service Role Secret** 복사

**4-2) 로컬 CLI에서 원격 프로젝트 연결**

```bash
# 1. 원격 프로젝트 링크
supabase link

# 프롬프트:
# Linked to your Supabase project: [abcdefghijklmnop]
# 로컬 프로젝트와 원격 프로젝트가 연결됨

# 확인: supabase status에서 원격 정보 표시됨
supabase status
# Supabase CLI version: 1.144.0
#
# Project ID: abcdefghijklmnop
# Local DB started: yes
# Local API: http://localhost:54321
# Remote DB: postgresql://...supabase.co/postgres
```

**4-3) 원격 프로젝트 정보 가져오기**

```bash
# 원격 프로젝트의 현재 스크마 가져오기
supabase pull

# 생성되는 파일:
# supabase/migrations/
# └─ 20260401120000_remote_schema.sql
#    (원격 프로젝트의 현재 스크마)

# 확인
ls -la supabase/migrations/
```

**4-4) 환경 변수 설정 (.env.production)**

배포 환경용:

```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon key>
SUPABASE_SERVICE_ROLE_KEY=<Service role key>
SUPABASE_DB_URL=postgresql://postgres:<password>@db.abcdefghijklmnop.supabase.co:5432/postgres
```

**값 가져오기:**

```bash
# Supabase 대시보드에서:
# Settings → API → Project URL (NEXT_PUBLIC_SUPABASE_URL)
# Settings → API → anon public (NEXT_PUBLIC_SUPABASE_ANON_KEY)
# Settings → API → Service role (SUPABASE_SERVICE_ROLE_KEY)
# Settings → Database → Connection string (SUPABASE_DB_URL)
```

---

## 실습 5단계: 마이그레이션 파일 이해

### 목표
마이그레이션 파일의 구조와 명명 규칙 이해하기

### 완료 기준
- 마이그레이션 파일 생성 및 작성 가능
- 파일 명명 규칙 이해

### 단계별 작업

**5-1) 마이그레이션 파일 구조**

```
supabase/migrations/
├─ 20260401000000_initial_schema.sql
│   └─ CREATE TABLE users ...
│   └─ CREATE TABLE profiles ...
│
├─ 20260402150000_add_posts_table.sql
│   └─ CREATE TABLE posts ...
│
└─ 20260403100000_add_auth_policies.sql
    └─ CREATE POLICY ...
```

**파일명 규칙:**
```
{YYYYMMDDHHMMSS}_{description}.sql

20260401000000 = 2026년 4월 1일 00:00:00
_initial_schema = 마이그레이션 설명 (언더스코어로 단어 연결)
```

**5-2) 마이그레이션 파일 작성**

새로운 테이블 추가 마이그레이션:

```bash
# 1. 마이그레이션 파일 생성
cat > supabase/migrations/20260401150000_add_posts_table.sql << 'EOF'
-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can read all posts" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
EOF

# 2. 파일 확인
cat supabase/migrations/20260401150000_add_posts_table.sql
```

**5-3) 마이그레이션 적용**

로컬에서:

```bash
# 1. 로컬에 마이그레이션 적용 (자동)
supabase start
# 자동으로 모든 migrations/ 파일 순서대로 적용

# 2. 또는 명시적으로 push (원격에만 적용)
supabase db push
# 원격 Supabase 프로젝트에 마이그레이션 적용

# 3. 마이그레이션 이력 확인
supabase migration list
# 20260401000000_initial_schema      ✓ Applied
# 20260402150000_add_posts_table      ✓ Applied
# 20260403100000_add_auth_policies   ✓ Applied
```

**5-4) 마이그레이션 되돌리기 (주의!)**

```bash
# ⚠️ 로컬 마이그레이션 초기화 (데이터 손실!)
supabase reset

# ⚠️ 원격 마이그레이션 되돌리기
# Supabase 대시보드에서 수동으로 처리
# (CLI로는 원격 데이터베이스 되돌리기 불가)
```

---

## 실습 6단계: Docker Compose에서 마이그레이션 자동 실행

### 목표
배포 시 Docker 컨테이너에서 마이그레이션을 자동으로 실행하기

### 완료 기준
- `docker-compose.yml`에 마이그레이션 서비스 추가
- 배포 시 자동으로 마이그레이션 실행

### 단계별 작업

**6-1) docker-compose.yml 구성**

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 애플리케이션
  app:
    image: ghcr.io/yourname/my-app:main
    container_name: my-app
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    depends_on:
      - db-migration
    restart: unless-stopped

  # 데이터베이스 마이그레이션 (선택사항)
  db-migration:
    image: ghcr.io/yourname/my-app:main
    command: supabase db push
    environment:
      - SUPABASE_PROJECT_ID=${SUPABASE_PROJECT_ID}
      - SUPABASE_DB_PASSWORD=${SUPABASE_DB_PASSWORD}
    depends_on:
      - postgres
    restart: on-failure

  # PostgreSQL 로컬 개발용 (선택사항)
  postgres:
    image: postgres:15-alpine
    container_name: my-postgres
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

**6-2) .env.production 파일**

```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
SUPABASE_PROJECT_ID=abcdefghijklmnop
SUPABASE_DB_PASSWORD=<db password>
```

**6-3) 배포 시 마이그레이션 자동 실행**

```bash
# 배포 서버에서
docker-compose up -d

# 마이그레이션 로그 확인
docker logs my-migration

# 예상 출력:
# Applying migration: 20260401000000_initial_schema
# Applying migration: 20260402150000_add_posts_table
# All migrations applied successfully!
```

---

## 핵심 요약

| 개념 | 설명 | 명령어 |
|------|------|--------|
| **Supabase CLI** | Supabase 프로젝트 관리 도구 | `supabase --version` |
| **supabase init** | 프로젝트 초기화 | `supabase init` |
| **supabase start** | 로컬 개발 서버 시작 | `supabase start` |
| **supabase link** | 원격 프로젝트 연결 | `supabase link` |
| **supabase db push** | 마이그레이션 적용 | `supabase db push` |
| **마이그레이션** | 데이터베이스 스크마 변경 파일 | `migrations/*.sql` |

---

## 다음 단계

- ✅ 현재: Supabase CLI 설치 & 초기화 완료
- ⏭️ 다음 (그룹 C): **Supabase Migration 개념 & 파일 구조** → 마이그레이션 작성 및 관리 심화

---

## 참고 자료

- [Supabase CLI 공식 문서](https://supabase.com/docs/reference/cli/supabase-init)
- [Supabase 로컬 개발](https://supabase.com/docs/guides/cli/local-development)
- [데이터베이스 마이그레이션 가이드](https://supabase.com/docs/guides/cli/managing-migrations)
- [PostgreSQL 마이그레이션 모범 사례](https://www.postgresql.org/docs/current/migrate-all.html)
- [Supabase Docker 이미지](https://hub.docker.com/u/supabase)

---

## 부록: 문제 해결 (FAQ)

### Q1: `supabase start` 실행 시 Docker 오류가 발생합니다

**A:** Docker가 설치되지 않았거나 실행 중이 아닙니다.

```bash
# Docker 설치 확인
docker --version

# Docker 실행 확인
docker ps

# Docker 시작 (필요하면)
# macOS: Docker Desktop 앱 실행
# Linux: sudo systemctl start docker
```

### Q2: 로컬과 원격 스크마가 다릅니다

**A:** `supabase pull`로 원격 스크마를 먼저 가져오세요.

```bash
# 원격 스크마 가져오기
supabase pull

# 로컬 마이그레이션 확인
git diff supabase/migrations/

# 필요하면 merge 또는 새 마이그레이션 생성
```

### Q3: 마이그레이션 파일을 삭제하면 어떻게 되나요?

**A:** 삭제된 파일의 변경 사항을 되돌리는 새 마이그레이션을 생성해야 합니다.

```bash
# 예: users 테이블 삭제 마이그레이션
cat > supabase/migrations/20260404100000_drop_users_table.sql << 'EOF'
DROP TABLE IF EXISTS users CASCADE;
EOF
```

### Q4: 로컬 데이터베이스를 초기화하고 싶습니다

**A:** `supabase reset` 명령어를 사용하세요 (모든 데이터 손실).

```bash
# 로컬 데이터베이스 완전 초기화
supabase reset

# 또는 특정 마이그레이션부터 다시 시작
supabase reset --skip-seed
```
