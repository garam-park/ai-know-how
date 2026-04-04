# 05-B-06 pg_hba.conf 구조 이해

**유형: 개념 | 10분**

**이전:** [05-B-05 GRANT / REVOKE 권한 부여와 회수](05-B-05-grant-revoke.md)
**다음:** [05-B-07 Supabase 기본 역할 구조](05-B-07-supabase-roles.md)

---

## 이 파일에서 배우는 것

pg_hba.conf는 PostgreSQL의 **접속 통제** 파일입니다. 데이터베이스 사용자가 "누가 어디서 어떤 방식으로 접속할 수 있는지"를 정의합니다. 마치 Express에서 CORS를 설정하는 것처럼, 네트워크 레벨에서 접속을 허가하거나 거부합니다.

---

## 본문

### pg_hba.conf란 무엇인가

**pg_hba.conf**(PostgreSQL Host-Based Authentication Configuration)는 PostgreSQL 서버의 클라이언트 인증 규칙을 정의하는 파일입니다.

- **위치:** PostgreSQL 데이터 디렉토리 (예: `/var/lib/postgresql/data/pg_hba.conf`)
- **역할:** 특정 호스트(Host)에서 특정 사용자(User)가 특정 데이터베이스(Database)에 접속할 때 **어떤 인증 방식을 사용할지** 결정
- **우선순위:** 위에서 아래로 순차 검사하여 **첫 번째 매칭되는 규칙** 적용

### FE 개발자를 위한 비유: Express의 CORS 설정

Express에서 CORS를 설정할 때를 생각해봅시다:

```javascript
// Express CORS 설정
app.use(cors({
  origin: ['http://localhost:3000', 'https://example.com'],
  credentials: true
}));
```

이것은 "어느 출처(origin)의 요청을 허용할 것인가"를 정의합니다.

**pg_hba.conf도 같은 개념입니다:**

```
# pg_hba.conf
local   all             all                                     trust
host    mydb            myuser      192.168.1.0/24              md5
host    mydb            myuser      0.0.0.0/0                   reject
```

- `local all all trust` = "로컬 Unix 소켓은 모든 사용자/DB 접속 허용"
- `host mydb myuser 192.168.1.0/24 md5` = "192.168.1.0/24 대역에서 myuser가 mydb 접속할 땐 md5 인증 사용"
- `host mydb myuser 0.0.0.0/0 reject` = "나머지는 모두 거부"

### 파일 형식: TYPE DATABASE USER ADDRESS METHOD

pg_hba.conf의 각 규칙은 **5개 항목**으로 구성됩니다:

```
TYPE      DATABASE    USER        ADDRESS         METHOD
local     all         all                         trust
host      postgres    postgres    127.0.0.1/32    scram-sha-256
hostssl   myapp       appuser     192.168.0.0/16  md5
```

#### 1. **TYPE** (연결 타입)

| 값 | 의미 |
|----|------|
| `local` | Unix 도메인 소켓 (같은 머신에서 로컬 접속) |
| `host` | TCP/IP 접속 (암호화 없음) |
| `hostssl` | TCP/IP 접속 (SSL 필수) |
| `hostnossl` | TCP/IP 접속 (SSL 금지) |

**FE 개발자 관점:**
- 개발 환경: `local` (로컬 소켓)
- 프로덕션: `hostssl` (암호화된 연결)

#### 2. **DATABASE** (데이터베이스 이름)

- 특정 데이터베이스: `postgres`, `mydb`
- 모든 데이터베이스: `all`
- 복수: `db1,db2,db3`

#### 3. **USER** (사용자 이름)

- 특정 사용자: `postgres`, `appuser`
- 모든 사용자: `all`
- 복수: `user1,user2,user3`

#### 4. **ADDRESS** (접속 출처 주소)

- `127.0.0.1/32` = localhost만 허용
- `192.168.0.0/16` = 192.168.0.0 ~ 192.168.255.255 허용
- `0.0.0.0/0` = 모든 주소 허용
- Unix 소켓은 ADDRESS 항목 생략

#### 5. **METHOD** (인증 방식)

pg_hba.conf에서 가장 중요한 부분입니다.

### 인증 방법 (METHOD)

| 방식 | 설명 | 보안 | 사용 시기 |
|------|------|------|----------|
| `trust` | 인증 없음, 무조건 허용 | ⚠️ 매우 낮음 | 개발 환경 (로컬만) |
| `reject` | 무조건 거부 | ✅ 차단 | 특정 주소 명시적 거부 |
| `md5` | MD5 해시 기반 | ⚠️ 낮음 (구형) | 레거시 시스템 |
| `scram-sha-256` | SCRAM 프로토콜 | ✅ 권장 | 현대 프로덕션 |
| `password` | 평문 비밀번호 | ❌ 매우 위험 | 사용 금지 |
| `peer` | OS 사용자명 검증 | ✅ 높음 | 로컬 Unix 소켓 |
| `ident` | IDENT 서버 검증 | 중간 | 레거시 네트워크 |

**가장 자주 보는 세 가지:**

```
# 로컬 개발: 인증 생략
local   all             all                          trust

# 프로덕션: 강력한 인증
host    myapp           appuser     192.168.1.0/24   scram-sha-256

# 명시적 거부
host    postgres        all         0.0.0.0/0        reject
```

### Supabase Docker에서의 기본 pg_hba.conf 설정

Supabase를 Docker로 셀프호스팅할 때 기본 설정입니다:

```
# 로컬 Unix 소켓: 모든 접속 허용
local   all             postgres                            peer
local   all             all                                 trust

# 로컬 호스트에서 TCP 접속: 인증 필요
host    all             all             127.0.0.1/32        scram-sha-256
host    all             all             ::1/128             scram-sha-256

# 원격 접속: md5 또는 scram-sha-256
host    all             all             0.0.0.0/0           md5
host    all             all             ::/0                md5
```

**각 규칙의 의미:**

1. **`local all postgres peer`**
   - postgres 사용자가 Unix 소켓으로 접속 → OS 사용자명으로 인증

2. **`local all all trust`**
   - 모든 로컬 사용자가 Unix 소켓으로 접속 → 인증 없음 (개발용)

3. **`host all all 127.0.0.1/32 scram-sha-256`**
   - localhost에서 TCP 접속 → 암호 인증

4. **`host all all 0.0.0.0/0 md5`**
   - 모든 원격 주소에서 접속 → MD5 인증 (구형, 보안 약함)

### pg_hba.conf 수정 후 적용

pg_hba.conf를 수정한 후 **PostgreSQL을 재로드**해야 적용됩니다:

```sql
-- SQL에서 재로드 (SELECT 권한 필요)
SELECT pg_reload_conf();

-- 또는 Linux 셸에서
sudo systemctl reload postgresql

-- Docker에서
docker exec supabase-postgres pg_ctl reload -D /var/lib/postgresql/data
```

### Supabase 셀프호스팅에서 왜 알아야 하는가

1. **접속 문제 디버깅**
   - "permission denied" 오류 → pg_hba.conf 규칙 확인
   - "FATAL: no pg_hba.conf entry" → 규칙 추가 필요

2. **보안 강화**
   - Docker에 기본 설정된 `md5`는 구형 보안
   - `scram-sha-256`으로 업그레이드 권장

3. **원격 접속 설정**
   - 기본적으로 localhost만 허용
   - 특정 IP/대역에서만 접속 허용하도록 제한

4. **환경별 구분**
   - 개발: `trust` (간편성)
   - 스테이징/프로덕션: `scram-sha-256` (보안)

**예: 특정 개발팀 IP에서만 접속 허용**

```
# 개발팀 IP (203.0.113.0/24)에서만 접속 허용
host    myapp           appuser     203.0.113.0/24       scram-sha-256

# 나머지는 모두 거부
host    all             all         0.0.0.0/0            reject
```

---

## 핵심 정리

| 항목 | 내용 |
|------|------|
| **pg_hba.conf** | "누가 어디서 어떻게 접속할 수 있는지" 정의하는 PostgreSQL 인증 규칙 파일 |
| **비유** | Express의 CORS 설정처럼 네트워크 레벨에서 접속 통제 |
| **5가지 요소** | TYPE (로컬/TCP), DATABASE (DB 이름), USER (사용자), ADDRESS (출처), METHOD (인증 방식) |
| **주요 인증 방식** | `trust` (개발용), `scram-sha-256` (권장), `md5` (구형), `reject` (거부) |
| **적용 방법** | `pg_reload_conf()` 또는 `pg_ctl reload` 재로드 |
| **Supabase에서** | 기본값은 `md5` → `scram-sha-256`으로 업그레이드 권장 |

---

## 다음 파일 예고

다음에는 **Supabase 기본 역할 구조**를 배웁니다. PostgreSQL의 역할(Role)이 어떻게 계층화되어 있고, Supabase가 기본으로 만드는 역할(postgres, authenticator, anon, authenticated)의 역할과 권한을 학습합니다.
