# 05-A-02 Docker exec로 psql 접속하는 법

> 유형: 실습 | 예상 소요 시간: 15~20분
> 이전: Supabase 맥락에서의 PostgreSQL 개요 | 다음: psql 핵심 명령어 모음

---

## 이 파일에서 하는 것

Docker로 실행 중인 Supabase의 PostgreSQL 컨테이너에 `docker compose exec` 명령으로 직접 접속합니다.
마치 브라우저의 개발자도구 Console에 접속하듯이, 데이터베이스의 명령줄 인터페이스인 psql에 진입하여 직접 쿼리를 실행할 수 있습니다.

---

## 사전 조건

- Supabase 셀프호스팅 환경이 Docker Compose로 실행 중 (`docker compose up -d` 완료)
- 로컬 머신에 Docker & Docker Compose 설치됨
- Supabase 프로젝트의 `docker-compose.yml` 파일 위치 확인 (보통 프로젝트 루트)
- 터미널/명령 프롬프트에 기본적인 CLI 사용 경험

---

## 실습

### Step 1: Docker Compose 실행 상태 확인

먼저 PostgreSQL 컨테이너가 정상적으로 실행 중인지 확인합니다.

```bash
docker compose ps
```

출력 예시:
```
NAME                COMMAND                  SERVICE             STATUS
supabase-db-1       "postgres"               db                  Up 2 hours
supabase-kong-1     "/docker-entrypoint.…"   kong                Up 2 hours
...
```

**확인 포인트**: `db` 또는 `postgres` 라는 이름의 컨테이너가 `Up` 상태인지 확인합니다.

---

### Step 2: psql 명령으로 PostgreSQL 접속

다음 명령을 터미널에 입력합니다.

```bash
docker compose exec db psql -U postgres
```

**명령 해석**:
- `docker compose exec`: Docker Compose 관리 컨테이너 내부에서 명령 실행
- `db`: 컨테이너명 (docker-compose.yml에서 정의된 서비스명)
- `psql`: PostgreSQL 명령줄 클라이언트
- `-U postgres`: postgres 사용자로 접속 (슈퍼유저)

---

### Step 3: 연결 정보 확인

psql 프롬프트(`postgres=#`)가 나타나면 성공입니다.

```bash
postgres=# \conninfo
```

출력 예시:
```
You are connected to database "postgres" as user "postgres" via socket in "/var/run/postgresql" at port 5432.
```

**의미**:
- 현재 접속한 데이터베이스: `postgres` (기본 DB)
- 사용자: `postgres` (슈퍼유저)
- 연결 방식: Unix socket (컨테이너 내부 로컬 연결)

---

### Step 4: 특정 데이터베이스에 접속 (선택)

Supabase의 실제 애플리케이션 데이터베이스(`postgres` 말고)에 접속하려면:

```bash
docker compose exec db psql -U postgres -d postgres
```

또는 접속 후에 데이터베이스 전환:

```bash
postgres=# \c postgres
```

**주요 데이터베이스**:
- `postgres`: 기본 시스템 데이터베이스
- `template1`, `template0`: 시스템 템플릿 (건드리지 않음)
- Supabase 세팅에서 생성된 프로젝트용 DB (프로젝트마다 다름)

---

### Step 5: 간단한 쿼리 실행

psql 프롬프트에서 SQL 쿼리를 직접 입력할 수 있습니다.

```sql
SELECT version();
```

또는 현재 데이터베이스의 모든 테이블 확인:

```bash
postgres=# \dt
```

---

### Step 6: psql 종료

psql 명령줄 인터페이스를 종료하려면:

```bash
postgres=# \q
```

또는 `Ctrl+D`를 누릅니다.

---

## 확인 방법

| 확인 항목 | 명령어 | 예상 결과 |
|---------|--------|----------|
| 컨테이너 실행 여부 | `docker compose ps` | db 서비스가 Up 상태 |
| psql 접속 성공 | `docker compose exec db psql -U postgres` | `postgres=#` 프롬프트 표시 |
| 연결 정보 | `\conninfo` (psql 내부) | database "postgres" as user "postgres" 표시 |
| psql 종료 | `\q` | 터미널로 돌아옴 |

---

## 자주 겪는 오류

| 오류 메시지 | 원인 | 해결 |
|-----------|------|------|
| `No such service: db` | docker-compose.yml에서 서비스명이 다름 | `docker compose ps`로 실제 컨테이너명 확인 후 사용 |
| `error: role "postgres" does not exist` | PostgreSQL 초기화 실패 | Docker 컨테이너 로그 확인: `docker compose logs db` |
| `command not found: docker compose` | Docker Compose 미설치 또는 구버전 | `docker --version` 확인, 필요시 최신 버전 설치 |
| `dial unix /var/run/postgresql/.s.PGSQL.5432: connect: no such file or directory` | 컨테이너가 실행 중이 아님 | `docker compose up -d` 실행 |
| `password authentication failed for user "postgres"` | docker-compose.yml의 POSTGRES_PASSWORD 값 불일치 | 환경변수 또는 설정 파일(.env) 확인 |

---

## GUI 도구를 사용한 접속 (선택사항)

명령줄이 어렵다면 다음 GUI 도구를 대신 사용할 수 있습니다:

### DBeaver (크로스 플랫폼)
1. DBeaver 다운로드 & 설치
2. `New Database Connection` → PostgreSQL 선택
3. 연결 정보 입력:
   - Host: `localhost`
   - Port: `5432` (docker-compose.yml에서 포트 매핑 확인)
   - Database: `postgres`
   - Username: `postgres`
   - Password: docker-compose.yml의 POSTGRES_PASSWORD 값
4. Test Connection으로 검증

### pgAdmin (웹 기반)
1. Supabase 셀프호스팅 스택에 pgAdmin이 포함되어 있는 경우가 있음
2. 웹 브라우저에서 pgAdmin 접속 (보통 `http://localhost:5050`)
3. 기본 로그인: 설정된 pgAdmin 관리자 계정

---

## 다음 파일 예고

다음 파일 **"psql 핵심 명령어 모음"**에서는:
- 데이터베이스 목록 조회 (`\l`)
- 테이블 목록 및 상세 정보 (`\dt`, `\d <table>`)
- 사용자 관리 (`\du`, `CREATE USER`)
- 기본 SQL 쿼리 작성 예제

등을 다루며, psql의 메타 명령어(역슬래시 `\`로 시작)를 체계적으로 학습합니다.
