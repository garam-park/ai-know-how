# 05-C-11 pg_restore로 복구하기

**실습 시간**: 15~20분
**난이도**: 초급
**필수 조건**: 05-C-10에서 생성한 백업 파일, PostgreSQL superuser 권한

---

## 이 파일에서 하는 것

pg_restore는 PostgreSQL의 백업 파일로부터 데이터베이스를 복구하는 도구입니다. `pg_dump`로 생성한 백업 스냅샷을 다시 데이터베이스에 적용하여 정확한 상태를 복원합니다.

**FE 개발자 관점**: `npm install`이 `package-lock.json`으로부터 정확한 패키지 상태를 복원하는 것처럼, `pg_restore`는 백업 파일로부터 데이터베이스의 정확한 상태를 복원합니다.

---

## 사전 조건 확인

```bash
# 백업 파일 확인
ls -lh ~/backups/

# PostgreSQL 접속 권한 확인
psql -U postgres -c "SELECT version();"
```

**확인 사항**:
- [ ] `~/backups/` 디렉토리에 SQL 형식 백업 파일 존재 (예: `mydb_20260401.sql`)
- [ ] 커스텀 포맷 백업 파일 존재 (예: `mydb_20260401.dump`)
- [ ] PostgreSQL superuser 권한 확인

---

## Step 1: SQL 형식 백업 복구하기

### 목표
SQL 형식으로 저장된 백업 파일을 psql의 리다이렉션으로 복구합니다.

**중요 구분**: SQL 형식 백업은 `psql`로 복구하고, 커스텀/디렉토리 포맷 백업은 `pg_restore`로 복구합니다. 이 두 도구는 호환되지 않습니다.

### 명령어 실행

```bash
# Docker 환경에서 SQL 파일로부터 데이터베이스 복구
docker exec -i supabase-db psql -U postgres < ~/backups/mydb_20260401.sql

# 또는 특정 데이터베이스에 복구
docker exec -i supabase-db psql -U postgres -d mydb < ~/backups/mydb_20260401.sql
```

### 상세 설명

- `-U postgres`: superuser로 연결
- `< file.sql`: SQL 파일의 내용을 psql의 stdin으로 전달
- `-d mydb`: 특정 데이터베이스를 대상으로 지정 (기본값: postgres)

**진행 화면 예시**:
```
CREATE DATABASE
CREATE TABLE
CREATE INDEX
INSERT 0 5
INSERT 0 3
...
```

### 완료 기준

- [ ] 오류 메시지 없이 스크립트 완료
- [ ] 데이터베이스 목록에서 복구된 데이터베이스 확인
  ```bash
  psql -U postgres -c "\l"
  ```
- [ ] 테이블 목록 확인
  ```bash
  psql -U postgres -d mydb -c "\dt"
  ```

---

## Step 2: 커스텀 포맷 백업 복구하기

### 목표
바이너리 형식의 커스텀 포맷 백업을 `pg_restore` 명령어로 복구합니다.

### 명령어 실행

```bash
# Docker 환경에서 커스텀 포맷 백업 복구
docker exec -i supabase-db pg_restore -U postgres -d mydb ~/backups/mydb_20260401.dump

# verbose 옵션으로 복구 과정 확인
docker exec -i supabase-db pg_restore -U postgres -d mydb -v ~/backups/mydb_20260401.dump

# 병렬 복구 (4개 작업 동시 실행, 대용량 파일에서 빠름)
docker exec -i supabase-db pg_restore -U postgres -d mydb -j 4 ~/backups/mydb_20260401.dump
```

### 상세 설명

- `pg_restore`: 바이너리/커스텀 포맷 백업을 복구하는 전용 도구
- `-d mydb`: 복구 대상 데이터베이스
- `-v`: verbose 출력 (진행 상황 상세 표시)
- `-j 4`: 병렬 복구 (쓰레드 4개 사용)

**FE 개발자 관점**: `-j 4`는 `npm install`의 병렬 다운로드처럼 복구 속도를 높입니다.

### 완료 기준

- [ ] 복구 완료 (timeout 없음)
- [ ] 복구된 테이블 행 수 확인
  ```bash
  psql -U postgres -d mydb -c "SELECT COUNT(*) FROM table_name;"
  ```
- [ ] 인덱스 존재 확인
  ```bash
  psql -U postgres -d mydb -c "\d table_name"
  ```

---

## Step 3: 특정 테이블만 복구하기

### 목표
전체 백업 중에서 필요한 테이블만 선택적으로 복구합니다.

### 명령어 실행

```bash
# 특정 테이블만 복구
pg_restore -U postgres -d mydb -t users ~/backups/mydb_20260401.dump

# 특정 테이블과 관련 스키마만 복구
pg_restore -U postgres -d mydb -t users -t orders ~/backups/mydb_20260401.dump

# 특정 테이블과 그 인덱스, 제약조건만 복구
pg_restore -U postgres -d mydb -t "public.users" ~/backups/mydb_20260401.dump
```

### 상세 설명

- `-t table_name`: 복구할 테이블 지정 (여러 개 가능)
- `public.users`: 스키마를 포함한 전체 이름 (같은 이름의 테이블이 다른 스키마에 있을 경우 필수)

### 완료 기준

- [ ] 지정한 테이블만 복구됨 (다른 테이블 없음)
  ```bash
  psql -U postgres -d mydb -c "\dt"
  ```
- [ ] 해당 테이블의 데이터 행 수 확인
  ```bash
  psql -U postgres -d mydb -c "SELECT COUNT(*) FROM users;"
  ```

---

## Step 4: 새 데이터베이스에 복구하기

### 목표
기존 데이터베이스에 영향을 주지 않고, 새로운 데이터베이스에 백업을 복구합니다. (테스트, 개발 용도)

### 명령어 실행

```bash
# 1단계: 새 데이터베이스 생성
createdb -U postgres mydb_restored

# 2단계: 백업에서 복구
pg_restore -U postgres -d mydb_restored ~/backups/mydb_20260401.dump

# 한 줄로 실행
createdb -U postgres mydb_restored && pg_restore -U postgres -d mydb_restored ~/backups/mydb_20260401.dump
```

또는 `--create` 옵션으로 자동 생성:

```bash
# --create 옵션: 백업에 포함된 CREATE DATABASE 명령을 실행
pg_restore -U postgres --create -d postgres ~/backups/mydb_20260401.dump
```

**주의**: `--create` 사용 시, 대상 데이터베이스 이름이 이미 존재하면 에러 발생

### 상세 설명

- `createdb`: PostgreSQL 데이터베이스 생성 도구
- `--create`: 백업 파일에 포함된 CREATE DATABASE 명령 실행
- `-d postgres`: `--create` 사용 시에는 postgres 데이터베이스에 연결 (이미 존재하는 시스템 DB)

### 완료 기준

- [ ] 새 데이터베이스 생성 확인
  ```bash
  psql -U postgres -c "\l" | grep mydb_restored
  ```
- [ ] 원본과 복구본의 테이블 개수 동일 확인
  ```bash
  psql -U postgres -d mydb -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
  psql -U postgres -d mydb_restored -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
  ```

---

## Step 5: --clean 옵션으로 기존 데이터 삭제 후 복구

### 목표
기존 데이터베이스의 모든 내용을 삭제하고 백업으로 완전히 덮어씁니다. (위험한 작업)

### 명령어 실행

```bash
# --clean 옵션: 복구 전에 기존 객체 삭제 (DROP TABLE 등)
pg_restore -U postgres -d mydb --clean ~/backups/mydb_20260401.dump

# --clean 과 --if-exists 함께 사용 (객체가 없으면 에러 무시)
pg_restore -U postgres -d mydb --clean --if-exists ~/backups/mydb_20260401.dump
```

### 상세 설명

- `--clean`: 복구 전에 데이터베이스의 모든 객체 삭제 (CREATE 전에 DROP 실행)
- `--if-exists`: DROP 명령이 실패해도 무시하고 계속 진행
- 사용 사례: 프로덕션 환경에서 정확한 시점의 백업으로 복원할 때

### 완료 기준

- [ ] 복구 완료
- [ ] 기존 데이터는 모두 삭제됨
  ```bash
  psql -U postgres -d mydb -c "SELECT COUNT(*) FROM users;"
  # 백업의 행 수와 동일해야 함
  ```

**주의 사항**:
```
⚠️ 주의: --clean 옵션은 기존 데이터를 완전히 삭제합니다.
        프로덕션 환경에서 사용할 때 매우 주의가 필요합니다.
```

---

## Step 6: 복구 후 데이터 검증하기

### 목표
복구된 데이터가 정확하게 복원되었는지 검증합니다.

### 검증 명령어

**1. 행 수 비교**

```bash
# 원본 데이터베이스의 테이블과 스키마 확인
psql -U postgres -d mydb << EOF
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public';
EOF

# 복구된 데이터베이스의 테이블과 스키마 확인
psql -U postgres -d mydb_restored << EOF
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public';
EOF
```

더 간단한 방법:

```bash
# 각 테이블의 행 수 조회
psql -U postgres -d mydb -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public'" | while read table; do
  echo -n "$table: "
  psql -U postgres -d mydb -t -c "SELECT COUNT(*) FROM $table"
done

# 복구본도 동일하게
psql -U postgres -d mydb_restored -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public'" | while read table; do
  echo -n "$table: "
  psql -U postgres -d mydb_restored -t -c "SELECT COUNT(*) FROM $table"
done
```

**2. 스키마 비교**

```bash
# 테이블 정의 비교
psql -U postgres -d mydb -c "\d users"
psql -U postgres -d mydb_restored -c "\d users"

# 인덱스 비교
psql -U postgres -d mydb -c "\di"
psql -U postgres -d mydb_restored -c "\di"

# 외래키 제약조건 비교
psql -U postgres -d mydb -c "\d table_name" | grep -i constraint
```

**3. 데이터 샘플 비교**

```bash
# 처음 5행 비교
echo "=== Original DB ==="
psql -U postgres -d mydb -c "SELECT * FROM users LIMIT 5;"

echo "=== Restored DB ==="
psql -U postgres -d mydb_restored -c "SELECT * FROM users LIMIT 5;"
```

### 완료 기준

- [ ] 모든 테이블의 행 수가 동일
- [ ] 테이블 구조(컬럼, 타입) 동일
- [ ] 인덱스 개수 동일
- [ ] 제약조건 동일
- [ ] 샘플 데이터 값 동일

---

## 확인 체크리스트

복구가 정상적으로 완료되었는지 확인하세요:

```bash
# 1. 데이터베이스 연결 확인
psql -U postgres -d mydb -c "SELECT NOW();"

# 2. 모든 테이블 목록 확인
psql -U postgres -d mydb -c "\dt"

# 3. 테이블별 행 수 확인
psql -U postgres -d mydb -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"

# 4. 복구된 시간 확인 (pg_dump시 사용한 시점)
psql -U postgres -d mydb -c "\dn"  # 스키마 정보

# 5. 권한 확인
psql -U postgres -d mydb -c "SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name='users';"
```

---

## 자주 겪는 오류 및 해결방법

| 오류 메시지 | 원인 | 해결방법 |
|-----------|------|---------|
| `ERROR: role "username" does not exist` | 백업에 포함된 역할(사용자)이 존재하지 않음 | `-j 1` 옵션 사용 또는 먼저 역할 생성: `CREATE ROLE username;` |
| `ERROR: relation "table_name" already exists` | 대상 DB에 같은 이름의 테이블 존재 | `--clean` 옵션으로 기존 객체 삭제 후 복구 |
| `ERROR: duplicate key value violates unique constraint` | 기존 데이터와 백업 데이터의 PK 충돌 | `--clean` 옵션으로 기존 데이터 먼저 삭제 |
| `ERROR: unsupported magic number` | 백업 파일이 손상됨 | 파일 무결성 확인: `file ~/backups/mydb.dump` |
| `ERROR: encoding "UTF8" does not match server encoding "LATIN1"` | 백업과 서버의 문자 인코딩 불일치 | 데이터베이스 재생성 또는 iconv로 변환 |
| `ERROR: permission denied for schema public` | 사용자 권한 부족 | superuser로 복구 또는 권한 변경 |
| `pg_restore: error: could not read input file` | 백업 파일 경로 오류 또는 파일 없음 | 파일 경로 확인: `ls -lh ~/backups/mydb.dump` |

---

## 실습 팁

### 1. 안전하게 테스트하기

```bash
# 새 데이터베이스를 만들어서 복구 테스트
createdb -U postgres test_restore
pg_restore -U postgres -d test_restore ~/backups/mydb_20260401.dump

# 테스트 완료 후 삭제
dropdb -U postgres test_restore
```

### 2. 큰 백업 파일 복구하기

```bash
# 병렬 복구로 속도 향상 (-j 8은 8개 병렬)
pg_restore -U postgres -d mydb -j 8 ~/backups/large_backup.dump

# 백그라운드 실행 + 진행 상황 모니터링
pg_restore -U postgres -d mydb -j 4 ~/backups/large_backup.dump &
# 다른 터미널에서
ps aux | grep pg_restore
```

### 3. 복구 시간 측정하기

```bash
# 소요 시간 측정
time pg_restore -U postgres -d mydb ~/backups/mydb_20260401.dump
```

---

## 다음 학습

**05-C-12: cron + 백업 쉘 스크립트 작성**

- 매일 자동으로 백업하는 쉘 스크립트 작성
- cron 스케줄러에 등록하여 정기적 백업 자동화
- 백업 파일 용량 관리 및 오래된 백업 자동 삭제
- 백업 실패 시 이메일 알림 설정

이제 `pg_dump`와 `pg_restore`로 수동 백업과 복구가 가능해졌습니다. 다음 파일에서는 이 과정을 자동화하는 방법을 배웁니다.

---

**생성 일시**: 2026-04-01
**관련 파일**: 05-C-10 (pg_dump로 수동 백업하기) → 05-C-11 (pg_restore로 복구하기) → 05-C-12 (cron + 백업 쉘 스크립트)
