# 05-A-03 psql 핵심 명령어 모음

> 유형: 실습 | 예상 소요 시간: 20분
> 이전: Docker exec로 psql 접속하기 | 다음: 유저 & 역할(Role) 생성/관리

---

## 이 파일에서 배우는 것

PostgreSQL의 대화형 클라이언트인 psql에서 자주 쓰는 메타 명령어와 SQL 쿼리를 정리합니다. FE 개발자가 DevTools에서 자주 쓰는 단축키처럼, psql도 몇 가지 명령어만 알면 DB를 효과적으로 탐색하고 관리할 수 있습니다.

---

## 사전 조건

- Docker 컨테이너 안의 PostgreSQL이 실행 중
- psql로 접속 완료 (전 파일 참고)
- 기본 SQL 문법의 이해

---

## 핵심 개념: 메타 명령어 vs SQL 명령어

psql에서는 두 가지 종류의 명령어를 사용합니다:

| 구분 | 형태 | 설명 | 예제 |
|------|------|------|------|
| **메타 명령어** | `\` 로 시작 | psql 자체의 기능 (DB 내용 조회, 설정 등) | `\l`, `\dt`, `\du` |
| **SQL 명령어** | 일반 SQL | 데이터베이스에 전달되는 쿼리 | `SELECT * FROM users;` |

> FE 비유: 메타 명령어 = 브라우저 DevTools 자체의 단축키, SQL 명령어 = 웹페이지에 보내는 요청

---

## 실습: 자주 쓰는 메타 명령어

### 1. 데이터베이스 목록 보기: `\l`

**목표**: 현재 PostgreSQL 서버에 있는 모든 데이터베이스 확인

**명령어**:
```bash
\l
```

**예상 출력**:
```
                                  List of databases
   Name    |  Owner   | Encoding |  Collate   |   Ctype    |   Access privileges
-----------+----------+----------+------------+------------+-----------------------
 postgres  | postgres | UTF8     | en_US.UTF-8| en_US.UTF-8|
 template0 | postgres | UTF8     | en_US.UTF-8| en_US.UTF-8| =c/postgres
 template1 | postgres | UTF8     | en_US.UTF-8| en_US.UTF-8| =c/postgres
(3 rows)
```

**설명**:
- `postgres`: 기본 관리자 데이터베이스
- `template0`, `template1`: 새 DB 생성 시 템플릿으로 쓰이는 DB들
- FE 비유: npm의 `npm list` 같은 느낌. 설치된 패키지(= DB) 확인

### 2. 데이터베이스 전환: `\c dbname`

**목표**: 특정 데이터베이스로 이동 (접속 변경)

**명령어**:
```bash
\c postgres
```

또는 더 상세한 정보와 함께:
```bash
\c postgres postgres localhost 5432
```

**예상 출력**:
```
You are now connected to database "postgres" as user "postgres" on host "localhost" at port "5432".
```

**설명**:
- FE 비유: `cd` 명령어처럼 현재 작업 디렉토리를 바꾸는 것과 비슷
- 일단 `\c dbname`로 DB를 전환해야 그 DB의 테이블들을 조회할 수 있음

### 3. 현재 DB의 테이블 목록: `\dt`

**목표**: 현재 연결된 데이터베이스의 모든 테이블 확인

**명령어**:
```bash
\dt
```

**예상 출력** (Supabase 초기 상태):
```
          List of relations
 Schema |        Name        | Type  | Owner
--------+--------------------+-------+----------
 public | users              | table | postgres
 public | posts              | table | postgres
 public | comments           | table | postgres
(3 rows)
```

**설명**:
- `Schema`: 네임스페이스. `public`은 기본 공개 영역
- FE 비유: 폴더 구조 보기 (`ls` 명령어). "이 폴더에 어떤 파일들이 있나?" 하는 것처럼 "이 DB에 어떤 테이블이 있나?" 확인

### 4. 테이블 상세 정보: `\dt+`

**목표**: 테이블 목록에 크기, 용량 등 추가 정보 포함

**명령어**:
```bash
\dt+
```

**예상 출력**:
```
                    List of relations
 Schema |      Name      | Type  | Owner    |  Size   | Description
--------+----------------+-------+----------+---------+--------------
 public | users          | table | postgres | 8192 kB |
 public | posts          | table | postgres | 5120 kB |
 public | comments       | table | postgres | 2048 kB |
(3 rows)
```

**설명**:
- 각 테이블이 차지하는 저장소 크기 확인 가능
- DB 성능 분석 시 유용

### 5. 테이블 구조 확인: `\d tablename`

**목표**: 특정 테이블의 컬럼, 데이터 타입, 제약 조건 확인

**명령어**:
```bash
\d users
```

**예상 출력**:
```
                Table "public.users"
   Column   |           Type           | Collation | Nullable | Default
------------+--------------------------+-----------+----------+---------
 id         | bigint                   |           | not null | nextval('users_id_seq'::regclass)
 email      | character varying(255)   |           | not null |
 name       | character varying(255)   |           |          |
 created_at | timestamp with time zone |           |          | now()
 updated_at | timestamp with time zone |           |          |

Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
    "users_email_key" UNIQUE, btree (email)

Foreign-key constraints:
    "users_posts_fk" FOREIGN KEY (id) REFERENCES posts(user_id)
```

**설명**:
- FE 비유: TypeScript 인터페이스를 보는 것과 비슷
  ```typescript
  interface User {
    id: number;           // bigint, not null
    email: string;        // varchar(255), not null
    name?: string;        // varchar(255), nullable
    created_at?: Date;    // timestamp, not null (기본값 now())
    updated_at?: Date;    // timestamp
  }
  ```
- **Indexes**: 빠른 검색을 위한 인덱스들 (데이터베이스 최적화)
- **Primary Key**: 각 행을 유일하게 구분하는 컬럼
- **Unique**: 중복 없음을 보장하는 컬럼 (예: email)
- **Foreign Key**: 다른 테이블과의 관계

> 팁: `\d 테이블명` 후 `q` 키를 눌러 결과를 빠져나옵니다

### 6. 스키마 목록: `\dn`

**목표**: PostgreSQL 데이터베이스의 모든 스키마(네임스페이스) 확인

**명령어**:
```bash
\dn
```

**예상 출력**:
```
          List of schemas
   Name   | Owner
----------+----------
 auth     | postgres
 public   | postgres
 storage  | postgres
(3 rows)
```

**설명**:
- Supabase 셀프호스팅 기본 스키마:
  - `public`: 기본, 가장 자주 쓰는 영역
  - `auth`: GoTrue(인증 서비스)의 사용자 정보 저장
  - `storage`: 파일 스토리지 메타데이터
  - `realtime`: Realtime 기능 관련 (Supabase 특화)
- FE 비유: 프로젝트의 여러 폴더들 (예: `/src`, `/pages`, `/api`)

### 7. 유저 & 역할 목록: `\du`

**목표**: PostgreSQL의 모든 사용자(역할, Role)와 그들의 권한 확인

**명령어**:
```bash
\du
```

**예상 출력**:
```
                          List of roles
 Role name |                         Attributes                          | Member of
-----------+--------------------------------------------------------------+-----------
 anon      | Cannot login                                                | {}
 postgres  | Superuser, Can create roles, Can create DB, Replication   | {}
 service_role | Cannot login                                            | {}
 supabase_admin | Superuser, Can create roles, Can create DB           | {}
(4 rows)
```

**설명**:
- `postgres`: 기본 관리자 계정
- `supabase_admin`: Supabase 전용 관리자 계정
- `anon`: 익명(로그인 없음) 사용자 - PostgREST 공개 API 요청 시 사용
- `service_role`: 서버 측 작업용 고권한 역할
- `Cannot login`: 웹에서 직접 로그인할 수 없으며, 역할으로만 사용됨

### 8. 확장 출력 토글: `\x`

**목표**: 쿼리 결과를 세로 방식으로 출력 (넓은 테이블이 보기 쉬워짐)

**명령어**:
```bash
\x
```

**예상 출력**:
```
Expanded display is on.
```

다시 입력하면 꺼집니다:
```bash
\x
```

**예제**:
```bash
# \x ON 상태에서 쿼리 실행
SELECT * FROM users WHERE id = 1;

# 결과 (세로 방식):
-[ RECORD 1 ]-----
id        | 1
email     | user@example.com
name      | John Doe
created_at| 2026-04-01 10:30:00+00
updated_at| 2026-04-01 10:30:00+00

# \x OFF 상태:
 id |      email       |   name   |       created_at       |       updated_at
----+------------------+----------+------------------------+------------------------
  1 | user@example.com | John Doe | 2026-04-01 10:30:00+00 | 2026-04-01 10:30:00+00
```

**설명**:
- 컬럼이 많은 테이블을 조회할 때 매우 유용
- `\x on`, `\x off`로 명시적 제어도 가능

### 9. 쿼리 실행 시간 측정: `\timing`

**목표**: 각 SQL 쿼리가 얼마나 걸리는지 측정 (성능 분석)

**명령어**:
```bash
\timing
```

**예상 출력**:
```
Timing is on.
```

다시 입력하면 꺼집니다.

**예제**:
```bash
SELECT * FROM users;

# 결과 아래 시간 표시:
Time: 5.234 ms
```

**설명**:
- FE 비유: 브라우저 DevTools의 Network 탭에서 요청 시간 보는 것과 비슷
- 쿼리 최적화 필요성 판단 가능 (100ms 이상이면 느린 편)

### 10. SQL 파일 실행: `\i filename`

**목표**: 저장된 SQL 파일을 한 번에 실행

**명령어**:
```bash
\i /path/to/script.sql
```

또는 현재 디렉토리의 파일:
```bash
\i script.sql
```

**예제** (script.sql 파일 내용):
```sql
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT now()
);

INSERT INTO posts (user_id, title, content) VALUES
(1, 'First Post', 'Hello World'),
(1, 'Second Post', 'PostgreSQL is awesome');
```

**실행**:
```bash
\i script.sql
```

**설명**:
- FE 비유: `npm install` 하나로 여러 패키지 설치하는 것처럼, 여러 SQL 명령어를 한 번에 실행
- DB 초기화, 마이그레이션 작업에 유용

---

## 실습: 자주 쓰는 SQL 쿼리

### 1. 기본 데이터 조회

```sql
SELECT * FROM users LIMIT 10;
```

### 2. 특정 컬럼만 조회

```sql
SELECT id, email, name FROM users;
```

### 3. 조건부 조회

```sql
SELECT * FROM posts WHERE user_id = 1;
```

### 4. 데이터 개수 확인

```sql
SELECT COUNT(*) FROM users;
```

### 5. 정렬된 조회

```sql
SELECT * FROM posts ORDER BY created_at DESC LIMIT 5;
```

### 6. 조인 (여러 테이블 함께 조회)

```sql
SELECT u.email, p.title, p.created_at
FROM users u
JOIN posts p ON u.id = p.user_id
WHERE u.id = 1;
```

---

## 자주 쓰는 메타 명령어 조합 패턴

### 패턴 1: 새 데이터베이스에 처음 들어갔을 때

```bash
# 1단계: 현재 서버의 DB 목록 확인
\l

# 2단계: 원하는 DB로 전환
\c postgres

# 3단계: 이 DB에 있는 테이블 목록 확인
\dt

# 4단계: 주요 테이블의 구조 확인
\d users
\d posts
```

### 패턴 2: 테이블 구조를 빠르게 파악할 때

```bash
# 확장 출력 켜기 (넓은 결과 보기 쉽게)
\x

# 테이블 상세 정보 조회
\d+ tablename

# 샘플 데이터 몇 줄 확인
SELECT * FROM tablename LIMIT 5;

# 확장 출력 끄기
\x
```

### 패턴 3: 느린 쿼리 찾을 때

```bash
# 쿼리 실행 시간 측정 켜기
\timing

# 의심되는 쿼리 실행
SELECT * FROM large_table WHERE complex_condition;

# 결과의 Time: xxx ms 확인
# 100ms 이상이면 인덱스 추가 또는 쿼리 최적화 필요
```

### 패턴 4: 권한 구조 파악할 때

```bash
# 1. 모든 역할(사용자) 확인
\du

# 2. 특정 역할의 상세 정보
\du+ rolename

# 3. 특정 테이블의 권한 확인
\d tablename

# 4. 스키마별 권한 확인
\dn+
```

---

## psql 필수 단축키 & 명령어

| 단축키/명령어 | 설명 |
|---|---|
| `\h` | SQL 명령어 도움말 (예: `\h SELECT`) |
| `\h SELECT` | SELECT 문법 상세 도움말 |
| `?` | psql 메타 명령어 전체 목록 |
| `\?` | 메타 명령어 도움말 페이지 (위아래 화살표로 스크롤, `q` 로 종료) |
| `\e` | 기본 텍스트 에디터로 쿼리 작성 (nano, vim 등) |
| `\s` | 이전에 입력한 쿼리 히스토리 확인 |
| `\q` | psql 종료 |
| `Ctrl+C` | 실행 중인 쿼리 취소 |
| `Ctrl+L` | 화면 클리어 |

---

## Docker 컨테이너에서 접속했을 때 psql 명령어 한 줄 실행

Docker에서 psql을 실행하되, 명령어 하나를 바로 실행하고 종료하려면:

```bash
docker exec -i postgres_container_name psql -U postgres -d postgres -c "\dt"
```

또는 SQL 쿼리 실행:

```bash
docker exec -i postgres_container_name psql -U postgres -d postgres -c "SELECT * FROM users LIMIT 5;"
```

**옵션 설명**:
- `-c`: 명령어 실행 후 종료 (대화형 모드 아님)
- `-U`: 사용자명 (username)
- `-d`: 데이터베이스명

---

## 자주 겪는 오류

| 오류 | 원인 | 해결 |
|------|------|------|
| `\dt: command not found` | 메타 명령어를 psql 밖에서 실행함 | psql 대화형 모드 내에서만 `\` 명령어 사용 가능 |
| `FATAL: database does not exist` | 존재하지 않는 DB로 접속 시도 | `\l`로 DB 목록 확인 후 `\c` 로 올바른 DB 선택 |
| `ERROR: relation "tablename" does not exist` | 테이블이 없거나 스키마가 다름 | `\dt`로 테이블 목록 확인. 필요시 `\d public.tablename` |
| `ERROR: permission denied for database` | 해당 역할에 권한이 없음 | 관리자 역할(`postgres`, `supabase_admin`)로 접속 |
| `password authentication failed` | 비밀번호 오입력 또는 사용자 없음 | 비밀번호 재확인. PostgreSQL 환경 변수 확인 |

---

## 핵심 정리

- **메타 명령어** (`\l`, `\dt`, `\d` 등)는 psql의 대화형 클라이언트 내에서만 사용
- **SQL 쿼리**는 PostgreSQL 데이터베이스 엔진으로 전달되어 실행됨
- **FE 개발 관점**: 메타 명령어 = DevTools 단축키, SQL = 웹페이지 로직
- 데이터베이스 탐색, 구조 파악, 권한 관리 대부분을 이 10개 메타 명령어로 해결 가능

---

## 실습 체크리스트

- [ ] Docker PostgreSQL 컨테이너에 psql로 접속됨
- [ ] `\l` 로 데이터베이스 목록 확인 가능
- [ ] `\c postgres` 로 데이터베이스 전환 가능
- [ ] `\dt` 로 테이블 목록 확인 가능
- [ ] `\d users` (또는 다른 테이블)로 구조 확인 가능
- [ ] `\du` 로 역할 목록 확인 가능
- [ ] `\x` 토글로 확장 출력 전환 가능
- [ ] `\timing` 켜고 간단한 SELECT 쿼리 실행 후 시간 측정 가능
- [ ] `\q` 로 psql 종료 가능

---

## 다음 파일 예고

다음에는 PostgreSQL의 사용자와 역할(Role)을 생성하고 권한을 관리하는 방법을 배웁니다. Supabase의 `anon`, `service_role` 같은 역할들이 왜 필요하고 어떻게 설정하는지 이해하게 됩니다.
