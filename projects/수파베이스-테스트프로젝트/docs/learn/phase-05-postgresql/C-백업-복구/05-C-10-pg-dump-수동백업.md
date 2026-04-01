# 05-C-10 pg_dump로 수동 백업하기

**유형**: 실습 (15~20분)
**이전 학습**: RLS 정책 작성 실습 (그룹 B)
**다음 학습**: pg_restore로 복구하기

---

## 이 파일에서 하는 것

### pg_dump는 뭔가요?

`pg_dump`는 PostgreSQL 데이터베이스의 **완전한 스냅샷을 파일로 저장**하는 도구입니다. 여기에는 테이블 구조, 데이터, 인덱스, 권한 등 모든 것이 포함됩니다.

### 왜 수동 백업이 필요한가요?

- **자동 백업 실패에 대비**: Supabase의 자동 백업이 실패했을 때 직접 백업을 만들 수 있습니다
- **특정 시점 복구**: 특정 시간의 데이터베이스 상태로 돌아가야 할 때
- **개발/테스트 환경 관리**: 프로덕션 데이터를 로컬이나 테스트 서버에 복사

### FE 개발자 관점에서 이해하기

FE 개발자라면 이렇게 생각해보세요:

- **`npm pack`처럼**: 프로젝트를 `.tar.gz`로 압축하듯이, `pg_dump`도 데이터베이스를 파일로 "패킹"합니다
- **소스코드 백업처럼**: Git에 코드를 저장하듯이, `pg_dump`로 DB를 저장하는 것입니다
- **번들 파일처럼**: Webpack으로 번들을 만들듯이, `pg_dump`는 DB의 모든 것을 한 파일로 묶습니다

백업 파일 = 데이터베이스의 **완전한 스냅샷** ✓

---

## 사전 조건

| 항목 | 필수 사항 |
|------|---------|
| **환경** | Supabase self-hosted 실행 중 |
| **접근 권한** | PostgreSQL superuser (`postgres` 사용자) |
| **도구** | `docker`, `psql` 설치됨 |
| **저장 공간** | 백업 파일 크기만큼 여유 공간 (보통 DB 크기의 1-1.5배) |

---

## Docker 환경 주의사항

**중요**: pg_dump는 **컨테이너 내부**에서 실행되지만, 백업 파일은 **호스트 파일시스템**에 저장해야 합니다.

- `>` 리다이렉트 사용: 백업 파일을 호스트로 직접 저장
  ```bash
  docker exec supabase-db pg_dump -U postgres -d postgres > ~/backups/backup.sql
  ```
  이 명령은 표준 출력을 호스트의 `backup.sql`로 리다이렉트합니다.

- ❌ `-f` 옵션 피하기: `-f backup.sql`을 사용하면 파일이 **컨테이너 내부**에만 저장됩니다.
  ```bash
  # 하지 말 것!
  docker exec supabase-db pg_dump -U postgres -d postgres -f backup.sql
  ```

- 컨테이너 내부 저장 후 복사: 디렉토리 포맷(`-Fd`)처럼 파이프가 불가능한 경우, 컨테이너에 먼저 저장한 후 `docker cp`로 복사합니다.
  ```bash
  docker exec supabase-db pg_dump -U postgres -d postgres -Fd -f /tmp/backup_dir
  docker cp supabase-db:/tmp/backup_dir ~/backups/
  ```

---

## 실습 단계

### Step 1: pg_dump 기본 사용법 (전체 DB 백업)

**목표**: 전체 데이터베이스를 SQL 포맷으로 백업

#### 명령어 실행

```bash
# Supabase Docker 컨테이너에서 pg_dump 실행
docker exec supabase-db pg_dump -U postgres -d postgres > backup.sql
```

| 옵션 | 설명 |
|------|------|
| `-U postgres` | superuser로 접근 |
| `-d postgres` | `postgres` 데이터베이스 백업 (전체 DB) |
| `> backup.sql` | 결과를 `backup.sql` 파일로 저장 |

#### 실행 후 확인

```bash
# 백업 파일 생성 확인
ls -lh backup.sql

# 파일 내용 미리보기 (처음 20줄)
head -20 backup.sql
```

**출력 예시**:
```sql
--
-- PostgreSQL database dump
--
-- Dumped from database version 14.x

SET statement_timeout = 0;
SET lock_timeout = 0;
...
```

#### 완료 기준

- ✅ `backup.sql` 파일이 생성됨
- ✅ 파일 크기가 1MB 이상 (데이터가 있을 경우)
- ✅ 파일 내용이 SQL 주석으로 시작함

---

### Step 2: 특정 스키마만 백업

**목표**: `public` 스키마만 선택적으로 백업

#### 명령어 실행

```bash
# public 스키마만 백업
docker exec supabase-db pg_dump -U postgres -d postgres --schema=public > backup_public.sql

# 여러 스키마 백업 (예: public, auth)
docker exec supabase-db pg_dump -U postgres -d postgres --schema=public --schema=auth > backup_multi.sql
```

| 옵션 | 설명 |
|------|------|
| `--schema=public` | 특정 스키마만 포함 |
| `--schema=auth` | 여러 번 사용하여 여러 스키마 포함 |

#### 실행 후 확인

```bash
# 스키마별 백업 파일 비교
ls -lh backup*.sql

# 파일이 더 작은지 확인
wc -l backup.sql backup_public.sql
```

**파일 크기 비교**:
- `backup.sql` (전체): 5.2 MB
- `backup_public.sql` (public만): 2.1 MB ← 훨씬 작음!

#### 완료 기준

- ✅ `backup_public.sql` 파일 생성
- ✅ 전체 백업보다 파일 크기 작음
- ✅ SQL 내용에 `public` 스키마의 테이블만 포함

---

### Step 3: 특정 테이블만 백업

**목표**: 특정 테이블 하나 또는 여러 개만 백업

#### 명령어 실행

```bash
# 단일 테이블 백업
docker exec supabase-db pg_dump -U postgres -d postgres -t public.users > backup_users.sql

# 여러 테이블 백업
docker exec supabase-db pg_dump -U postgres -d postgres \
  -t public.users \
  -t public.posts \
  -t public.comments > backup_content.sql
```

| 옵션 | 설명 |
|------|------|
| `-t schema.table` | 특정 테이블만 포함 |
| 여러 번 사용 | 여러 테이블 선택 가능 |

#### 실행 후 확인

```bash
# 백업된 테이블 확인
grep "CREATE TABLE" backup_users.sql

# 행 수 확인
wc -l backup_users.sql
```

**출력 예시**:
```
CREATE TABLE public.users (
    id bigint NOT NULL,
    email text NOT NULL,
    ...
)
```

#### 완료 기준

- ✅ `backup_users.sql` 파일 생성
- ✅ 파일 크기가 매우 작음 (1개 테이블이므로)
- ✅ 다중 테이블 백업시 모든 테이블 포함 확인

---

### Step 4: 커스텀 포맷 백업 (압축 + 병렬 복구 가능)

**목표**: 바이너리 커스텀 포맷으로 백업 (더 효율적)

#### 명령어 실행

```bash
# 커스텀 포맷 (압축됨)
docker exec supabase-db pg_dump -U postgres -d postgres \
  -Fc -v > backup_custom.dump

# 더 빠른 병렬 처리 옵션
docker exec supabase-db pg_dump -U postgres -d postgres \
  -Fc -j 4 > backup_custom_parallel.dump
```

| 옵션 | 설명 |
|------|------|
| `-Fc` | **Custom** format (바이너리, 압축됨) |
| `-v` | 진행 상황 표시 (verbose) |
| `-j 4` | 4개 병렬 프로세스 (더 빠름) |
| `>` | 출력을 호스트 파일로 리다이렉트 |

#### 포맷 비교

```bash
# SQL 포맷 vs 커스텀 포맷 크기 비교
ls -lh backup.sql backup_custom.dump
```

**출력 예시**:
```
-rw-r--r-- 1 user user  5.2M Apr  1 10:15 backup.sql
-rw-r--r-- 1 user user  1.8M Apr  1 10:18 backup_custom.dump  ← 훨씬 작음!
```

#### 완료 기준

- ✅ `.dump` 파일 생성
- ✅ SQL 포맷보다 크기 작음 (보통 30-50%)
- ✅ 파일이 바이너리 형식 (텍스트 편집기로 읽을 수 없음)

---

### Step 5: 백업 파일 검증

**목표**: 백업 파일이 유효한지 확인

#### SQL 포맷 검증

```bash
# 파일 크기 확인
ls -lh backup.sql

# 파일의 구조 확인 (처음과 끝을 봄)
head -5 backup.sql && echo "---중간 생략---" && tail -5 backup.sql

# SQL 문법 검증 (옵션: 실제 복구는 하지 않음)
docker exec supabase-db psql -U postgres -d postgres \
  --single -v ON_ERROR_STOP=on < backup.sql | head
```

**검증 체크리스트**:
```bash
# 1. 주요 테이블이 백업되었는지 확인
grep "CREATE TABLE public" backup.sql | wc -l

# 2. 데이터가 포함되었는지 확인
grep "COPY.*FROM stdin" backup.sql | head -3

# 3. 인덱스가 포함되었는지 확인
grep "CREATE INDEX" backup.sql | wc -l
```

#### 커스텀 포맷 검증

```bash
# .dump 파일의 목록 보기 (실제 복구 없이 내용만 확인)
docker exec supabase-db pg_restore --list backup_custom.dump | head -20

# 통계 확인
docker exec supabase-db pg_restore --list backup_custom.dump | grep -c "TABLE DATA"
```

**출력 예시**:
```
;
; Archive created at 2026-04-01 10:18:30
; dbname: postgres
; TOC entries: 247 (Table Data: 156; Table Structure: 42)
;
```

#### 완료 기준

- ✅ 파일 크기가 1MB 이상 (데이터 있을 경우)
- ✅ `pg_restore --list` 명령어 정상 실행
- ✅ 주요 테이블과 데이터가 포함되어 있음

---

### Step 6: 디렉토리 포맷 백업 (고급)

**⚠️ 주의**: 디렉토리 포맷(`-Fd`)은 stdout으로 파이프할 수 없으므로, 반드시 컨테이너 내부에 저장한 후 `docker cp`로 호스트로 복사해야 합니다.

**목표**: 디렉토리 구조 형식으로 병렬 처리 가능한 백업

#### 명령어 실행

```bash
# 호스트에 디렉토리 생성
mkdir -p ~/backups

# 컨테이너 내부 임시 디렉토리 생성 및 백업 (파이프 불가능)
docker exec supabase-db mkdir -p /tmp/backup_dir

docker exec supabase-db pg_dump -U postgres -d postgres \
  -Fd \
  -j 4 \
  -v \
  -f /tmp/backup_dir

# 컨테이너에서 호스트로 복사
docker cp supabase-db:/tmp/backup_dir ~/backups/postgres_20260401

# 백업 내용 확인
ls -la ~/backups/postgres_20260401/
```

| 옵션 | 설명 |
|------|------|
| `-Fd` | **Directory** format (폴더 구조) |
| `-j 4` | 4개 병렬 프로세스 (빠름) |
| `-f /tmp/backup_dir` | 컨테이너 내부 임시 디렉토리에 저장 |
| `docker cp` | 컨테이너에서 호스트로 복사 |

#### 디렉토리 포맷의 구조

```bash
# 생성된 파일 구조
tree backups/postgres_20260401/ -L 2
```

**출력 예시**:
```
backups/postgres_20260401/
├── toc.dat          ← 목차 파일 (복구 시 참고)
├── 1.dat.gz         ← 테이블 1의 데이터
├── 2.dat.gz         ← 테이블 2의 데이터
├── ...
└── restore.log      ← 복구 로그
```

#### 완료 기준

- ✅ `~/backups/postgres_20260401/` 디렉토리가 호스트에 생성됨
- ✅ `docker cp`로 컨테이너에서 호스트로 복사 완료
- ✅ `toc.dat` 파일 포함
- ✅ 여러 `.dat.gz` 파일이 병렬로 생성됨

---

## 확인 방법

### 백업 작업 완료 체크리스트

| 항목 | 체크 |
|------|------|
| ✅ 전체 DB 백업 (`backup.sql`) | `[ ]` |
| ✅ 스키마별 백업 (`backup_public.sql`) | `[ ]` |
| ✅ 테이블별 백업 (`backup_users.sql`) | `[ ]` |
| ✅ 커스텀 포맷 백업 (`.dump`) | `[ ]` |
| ✅ 백업 파일 검증 완료 | `[ ]` |
| ✅ 디렉토리 포맷 백업 (선택사항) | `[ ]` |

### 실습 완료 확인

```bash
# 모든 백업 파일 확인
ls -lh backup* backups/

# 각 포맷별 크기 비교
echo "=== 포맷별 백업 크기 비교 ===" && \
ls -lh backup.sql backup_public.sql backup_users.sql backup_custom.dump 2>/dev/null | \
awk '{print $9, "(" $5 ")"}'
```

**예상 출력**:
```
backup.sql (5.2M)
backup_public.sql (2.1M)
backup_users.sql (245K)
backup_custom.dump (1.8M)
```

---

## 자주 겪는 오류 및 해결법

| 오류 | 원인 | 해결법 |
|------|-----|-------|
| **Permission denied** | superuser 권한 없음 | `-U postgres` 확인, 도커 접근 권한 확인 |
| **Database does not exist** | 잘못된 DB 이름 | `psql -l`로 DB 목록 확인 후 `-d` 옵션 수정 |
| **No space left on device** | 디스크 부족 | `df -h` 확인, 불필요한 파일 삭제 후 재시도 |
| **NOTICE: CREATE INDEX ... (비정상 종료 아님)** | 인덱스 생성 시 일반 경고 | 무시 가능, 정상 동작 |
| **binary format not recognized** | 파일 손상 또는 잘못된 포맷 | 백업 파일 다시 생성 |
| **pg_restore: [archiver] unsupported version** | 포맷 버전 호환성 문제 | PostgreSQL 버전 확인, 동일 버전으로 백업 |
| **FATAL: Ident authentication failed** | 인증 설정 문제 | Docker 컨테이너 내부에서 실행 확인 |

### 디버깅 팁

```bash
# 더 자세한 에러 메시지 보기
docker exec supabase-db pg_dump -U postgres -d postgres -v > backup_debug.sql 2>&1

# Docker 컨테이너 상태 확인
docker ps | grep supabase-db

# PostgreSQL 버전 확인
docker exec supabase-db psql -U postgres -c "SELECT version();"
```

---

## 실습 정리

### 배운 것

- ✅ **pg_dump 기본 문법**: 전체, 스키마, 테이블별 백업
- ✅ **백업 포맷의 선택**:
  - **SQL 포맷** (`>` 리다이렉트): 텍스트, 편집 가능, 버전 호환성 높음
  - **커스텀 포맷** (`-Fc`): 바이너리, 압축, 크기 작음
  - **디렉토리 포맷** (`-Fd`): 병렬 처리, 대용량 DB에 효율적
- ✅ **백업 검증 방법**: 파일 크기, `pg_restore --list`, 내용 확인

### 다음 단계

다음 학습에서는 **pg_restore**를 사용해서 이 백업 파일들을 복구하는 방법을 배웁니다!

---

## 다음 학습

**05-C-11 pg_restore로 복구하기**

- 백업 파일로부터 DB 복원하기
- 선택적 복구 (특정 테이블만)
- 병렬 복구로 빠르게 복원하기
- 복구 과정 모니터링

---

## 참고 자료

**PostgreSQL 공식 문서**:
- [pg_dump - PostgreSQL Database Dump Utility](https://www.postgresql.org/docs/current/app-pgdump.html)
- [pg_restore - Restore a PostgreSQL Database](https://www.postgresql.org/docs/current/app-pgrestore.html)

**실무 팁**:
- 백업은 정기적으로 (매일, 주 단위)
- 백업 파일의 체크섬 저장 (손상 감지용)
- 테스트 환경에서 주기적으로 복구 테스트
