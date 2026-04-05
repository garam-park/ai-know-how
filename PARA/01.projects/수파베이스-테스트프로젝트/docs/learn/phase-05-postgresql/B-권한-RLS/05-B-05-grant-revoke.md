# 05-B-05 GRANT / REVOKE 권한 부여와 회수

**유형: 실습** | 15~20분

**이전**: 유저 & 역할(Role) 생성/관리
**다음**: pg_hba.conf 구조 이해

---

## 이 파일에서 하는 것

PostgreSQL의 **GRANT**와 **REVOKE** 명령어를 통해 데이터베이스 객체에 대한 접근 권한을 부여하고 회수하는 방법을 학습합니다.

- GRANT/REVOKE의 기본 문법 이해
- 테이블 및 스키마 단위로 권한 관리
- SELECT, INSERT, UPDATE, DELETE 등 개별 권한 부여
- ALL PRIVILEGES를 통한 일괄 권한 설정
- 실제로 테스트 역할을 생성하고 권한을 부여, 확인, 회수하는 실습

**FE 개발자 비유**: API 라우트에서 미들웨어를 통해 특정 사용자에게만 특정 엔드포인트 접근을 허용하거나 거부하는 것과 동일한 개념입니다. 권한 체계도 계층적으로 (전체 → 스키마 → 테이블 → 컬럼) 관리됩니다.

---

## 사전 조건

- PostgreSQL 또는 Supabase 셀프호스팅 인스턴스에 **superuser** 권한으로 접속 가능
- 이전 단계에서 생성한 데이터베이스 사용자들(예: `app_user`, `readonly_user` 등)
- 기본적인 테이블이 포함된 스키마 (없으면 실습 Step 1에서 생성)

---

## 실습 Step 1: 테스트 환경 준비

### 목표
테스트용 역할, 스키마, 테이블을 생성하고 초기 상태를 확인합니다.

### 명령어 실행

superuser 권한으로 PostgreSQL 또는 Supabase CLI를 통해 접속합니다.

```bash
# Supabase 셀프호스팅의 경우
psql -h localhost -U postgres -p 5432 -d postgres
```

다음 SQL을 순서대로 실행합니다:

```sql
-- 1. 테스트용 스키마 생성
CREATE SCHEMA test_schema;

-- 2. 테스트용 테이블 생성
CREATE TABLE test_schema.users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100)
);

CREATE TABLE test_schema.orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES test_schema.users(id),
  amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 테스트 데이터 삽입
INSERT INTO test_schema.users (name, email) VALUES
  ('Alice', 'alice@example.com'),
  ('Bob', 'bob@example.com');

INSERT INTO test_schema.orders (user_id, amount) VALUES
  (1, 100.50),
  (2, 250.00);

-- 4. 테스트용 역할 생성 (아직 권한 없음)
CREATE ROLE test_app WITH LOGIN PASSWORD 'test123!';
```

### 완료 기준
- `test_schema` 스키마가 생성됨
- `test_schema.users`, `test_schema.orders` 테이블이 생성됨
- 테스트 데이터가 2개씩 삽입됨
- `test_app` 역할이 생성됨 (로그인 가능)

---

## 실습 Step 2: 기본 권한 부여 (SELECT)

### 목표
특정 역할에게 특정 테이블에 대한 **SELECT** 권한만 부여합니다.

### 명령어 실행

```sql
-- test_app 역할에게 test_schema 스키마 사용 권한 부여
GRANT USAGE ON SCHEMA test_schema TO test_app;

-- test_schema 스키마의 모든 테이블에 SELECT 권한 부여
GRANT SELECT ON ALL TABLES IN SCHEMA test_schema TO test_app;

-- 향후 생성되는 테이블도 자동으로 SELECT 권한 부여 (선택사항)
ALTER DEFAULT PRIVILEGES IN SCHEMA test_schema GRANT SELECT ON TABLES TO test_app;
```

### 완료 기준
- `test_app` 역할이 `test_schema`의 모든 테이블을 조회할 수 있음
- INSERT, UPDATE, DELETE는 불가능

---

## 실습 Step 3: 세분화된 권한 부여 (테이블별, 작업별)

### 목표
서로 다른 역할에게 서로 다른 권한을 부여하여 권한의 세분화를 이해합니다.

### 명령어 실행

```sql
-- 1. 읽기 전용 역할 생성
CREATE ROLE readonly_role WITH LOGIN PASSWORD 'readonly123!';
GRANT USAGE ON SCHEMA test_schema TO readonly_role;
GRANT SELECT ON ALL TABLES IN SCHEMA test_schema TO readonly_role;

-- 2. 데이터 입력용 역할 생성
CREATE ROLE data_entry_role WITH LOGIN PASSWORD 'entry123!';
GRANT USAGE ON SCHEMA test_schema TO data_entry_role;
-- SELECT와 INSERT만 허용
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA test_schema TO data_entry_role;
-- INSERT 시 SERIAL(시퀀스) 사용 권한도 필요
GRANT USAGE ON ALL SEQUENCES IN SCHEMA test_schema TO data_entry_role;

-- 3. 전체 권한용 역할 생성 (test_app 업그레이드)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA test_schema TO test_app;
```

### 완료 기준
- `readonly_role`: 조회만 가능
- `data_entry_role`: 조회 및 입력만 가능
- `test_app`: 조회, 입력, 수정, 삭제 모두 가능

---

## 실습 Step 4: ALL PRIVILEGES를 통한 일괄 권한 부여

### 목표
한 번에 모든 권한을 부여하는 방법을 학습합니다.

### 명령어 실행

```sql
-- 관리자 역할 생성 및 전체 권한 부여
CREATE ROLE admin_role WITH LOGIN PASSWORD 'admin123!';
GRANT USAGE ON SCHEMA test_schema TO admin_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA test_schema TO admin_role;

-- 시퀀스(sequence)에 대한 권한도 부여 (ID 자동 생성 시 필요)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA test_schema TO admin_role;
```

### 완료 기준
- `admin_role`이 모든 작업(조회, 입력, 수정, 삭제)을 수행할 수 있음
- 새로운 시퀀스도 관리 가능

---

## 실습 Step 5: 권한 확인

### 목표
부여된 권한을 확인하고 검증합니다.

### 명령어 실행

```sql
-- 1. 현재 역할의 권한 조회
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'test_schema' AND table_name = 'users';

-- 2. 역할별 권한 상세 조회
\du
\dp test_schema.users
\dp test_schema.orders
```

### 각 역할으로 접속하여 권한 테스트

**Terminal 1: readonly_role로 접속**
```bash
psql -h localhost -U readonly_role -d postgres
```

```sql
-- 성공: SELECT 실행 가능
SELECT * FROM test_schema.users;

-- 실패: INSERT 불가능
INSERT INTO test_schema.users (name, email) VALUES ('Charlie', 'charlie@example.com');
```

**Terminal 2: data_entry_role로 접속**
```bash
psql -h localhost -U data_entry_role -d postgres
```

```sql
-- 성공: 조회 가능
SELECT * FROM test_schema.orders;

-- 성공: 데이터 삽입 가능
INSERT INTO test_schema.orders (user_id, amount) VALUES (1, 500.00);

-- 실패: UPDATE 불가능
UPDATE test_schema.orders SET amount = 600.00 WHERE id = 1;
```

### 완료 기준
- 각 역할이 할당된 권한만 사용 가능함을 확인
- 불가능한 작업은 권한 오류(`ERROR: permission denied`) 발생

---

## 실습 Step 6: 권한 회수 (REVOKE)

### 목표
부여된 권한을 선택적으로 또는 전체 회수합니다.

### 명령어 실행

```sql
-- 1. 특정 권한만 회수
-- test_app에서 INSERT 권한 회수
REVOKE INSERT ON ALL TABLES IN SCHEMA test_schema FROM test_app;

-- 2. 특정 테이블의 권한만 회수
-- readonly_role에서 test_schema.users 테이블의 SELECT 권한 회수
REVOKE SELECT ON test_schema.users FROM readonly_role;

-- 3. 모든 권한 회수
-- data_entry_role의 모든 권한 회수
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA test_schema FROM data_entry_role;
REVOKE USAGE ON SCHEMA test_schema FROM data_entry_role;

-- 4. 역할 삭제 (권한 회수 후 진행)
DROP ROLE data_entry_role;
```

### 완료 기준
- 특정 권한이 정상 회수됨
- 회수된 권한으로 작업 시 오류 발생
- 역할을 삭제할 수 있음

---

## 실습 Step 7: 실제 스냅샷 생성 및 비교

### 목표
권한 부여 전후 상태를 기록하고 비교합니다.

### 명령어 실행

```sql
-- 권한 상태를 파일로 저장 (superuser로 실행)
\! pg_dump -h localhost -U postgres -d postgres --schema-only \
  -t test_schema.users -t test_schema.orders > /tmp/schema_before.sql

-- 권한 정보 조회
SELECT
  rolname,
  rolcanlogin
FROM pg_roles
WHERE rolname LIKE '%role' OR rolname = 'test_app';
```

### 완료 기준
- 권한 상태를 스냅샷으로 기록
- 부여 전후 권한 목록의 변화를 확인

---

## 확인 방법

### 체크리스트

- [ ] `test_schema` 스키마 및 테이블 생성 완료
- [ ] 각 역할(readonly_role, data_entry_role, test_app, admin_role)이 정상 생성됨
- [ ] readonly_role로 SELECT는 성공, INSERT는 실패 확인
- [ ] data_entry_role로 SELECT/INSERT는 성공, UPDATE/DELETE는 실패 확인
- [ ] test_app 역할에서 SELECT는 성공하지만 INSERT는 실패 (Step 6 이후)
- [ ] REVOKE 후 권한이 정상 회수되었는지 확인
- [ ] \dp 명령어로 권한 목록 출력 가능

### 권한 조회 쿼리

```sql
-- 현재 설정된 모든 권한 조회
SELECT
  table_schema,
  table_name,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'test_schema'
ORDER BY table_name, grantee;
```

---

## 자주 겪는 오류

| 오류 | 원인 | 해결 |
|------|------|------|
| `ERROR: permission denied for schema test_schema` | 역할이 스키마에 USAGE 권한이 없음 | `GRANT USAGE ON SCHEMA test_schema TO role_name;` 실행 |
| `ERROR: permission denied for table users` | 테이블 권한이 부여되지 않음 | `GRANT SELECT ON test_schema.users TO role_name;` 실행 |
| `ERROR: role "role_name" does not exist` | 역할이 존재하지 않음 | `CREATE ROLE role_name WITH LOGIN;` 으로 역할 생성 |
| `ERROR: role "role_name" cannot be dropped because some objects depend on it` | 역할이 소유한 객체가 있음 | `REASSIGN OWNED BY role_name TO postgres;` 후 삭제 |
| `ERROR: permission denied to create role` | superuser 권한이 없음 | superuser 계정으로 재접속 |
| `FATAL: password authentication failed for user "test_app"` | 역할 생성 시 입력한 비밀번호와 다름 | 비밀번호 변경: `ALTER ROLE test_app WITH PASSWORD 'newpass';` |

---

## 다음 파일 예고

다음 단계 **05-B-06 pg_hba.conf 구조 이해**에서는:

- PostgreSQL의 클라이언트 인증 설정 파일(`pg_hba.conf`)의 구조와 역할
- 특정 IP 주소나 사용자별 인증 방식 설정
- Supabase 셀프호스팅에서 네트워크 보안을 위한 pg_hba.conf 구성
- 로컬 개발 환경과 프로덕션 환경의 차이

을 배우게 됩니다.
