# 05-E-20: PostgreSQL 로그 파일 위치 & 분석법

**타입**: 참고 (필요할 때)
**이전**: Supabase Studio에서 DB 모니터링하기
**다음**: GitHub Actions 핵심 개념 (Phase 6 시작)

---

## 이 파일에서 다루는 것

PostgreSQL도 **브라우저의 console.log처럼** 모든 일을 기록합니다.
- 에러, 경고, 연결 정보, 쿼리 실행 시간...
- **Docker logs** = 브라우저 DevTools의 Console 탭
- 문제가 생기면 로그를 읽어야 원인을 알 수 있습니다.

이 문서는 **참고용**이므로, 문제가 발생했을 때 필요한 부분을 찾아서 쓰면 됩니다.

---

## 1. Docker 환경에서 로그 확인하기

### 1.1 기본: 전체 로그 보기

```bash
# Supabase DB 컨테이너의 모든 로그 출력
docker logs supabase-db
```

### 1.2 최근 N줄만 보기

```bash
# 마지막 100줄만 출력
docker logs --tail 100 supabase-db

# 마지막 50줄
docker logs --tail 50 supabase-db
```

### 1.3 실시간 모니터링 (tail -f 처럼)

```bash
# 실시간으로 로그 추적 (Ctrl+C로 중단)
docker logs -f supabase-db

# 마지막 50줄부터 실시간 추적
docker logs --tail 50 -f supabase-db
```

### 1.4 타임스탬프 포함해서 보기

```bash
# 각 로그 라인에 타임스탐프 추가
docker logs --timestamps supabase-db

# 실시간 추적하면서 타임스탬프 보기
docker logs --timestamps -f supabase-db
```

---

## 2. 로그 레벨 이해하기

PostgreSQL은 메시지의 중요도를 레벨로 구분합니다. **로그에서 자주 마주치는 레벨**:

| 레벨 | 의미 | 예시 |
|------|------|------|
| **DEBUG** | 개발자 정보 (기본적으로 안 나옴) | 쿼리 계획 상세 정보 |
| **LOG** | 일반 정보성 메시지 | 데이터베이스 시작됨, 체크포인트 완료 |
| **INFO** | 정보 | (거의 안 나옴) |
| **NOTICE** | 주의할 점 | 암묵적 시퀀스 생성됨 |
| **WARNING** | 경고 | 인덱스 누락, 설정 경고 |
| **ERROR** | 오류 (쿼리 실패, 연결 종료 안 함) | 문법 오류, 권한 오류 |
| **FATAL** | 심각한 오류 (연결 강제 종료) | 비밀번호 인증 실패, 메모리 부족 |
| **PANIC** | 초긴급 (DB 시스템 문제) | 데이터 손상 감지 (거의 안 나옴) |

> **팁**: 문제가 생기면 **ERROR와 FATAL만 먼저 찾기**

---

## 3. 주요 로그 패턴과 의미

### 3.1 연결 오류들

**비밀번호 인증 실패**
```
FATAL: password authentication failed for user "postgres"
```
- 원인: 잘못된 비밀번호 또는 Supabase 권한 설정 실패
- 해결: `.env` 파일의 데이터베이스 비밀번호 확인

**특정 호스트에서의 연결 거부**
```
FATAL: no pg_hba.conf entry for host "192.168.1.100", user "app_user", database "mydb", SSL off
```
- 원인: `pg_hba.conf` 설정에 해당 호스트가 없음
- 해결: Supabase Network 설정에서 IP 화이트리스트 추가

### 3.2 슬로우 쿼리 (성능 이슈)

```
LOG: duration: 1234.567 ms execute <query> SELECT * FROM users WHERE ...
```
- 의미: 이 쿼리가 **1.2초 이상** 걸렸다는 뜻
- 기본값: 1초 이상 걸리면 로그에 기록
- 해결: 인덱스 추가, 쿼리 최적화 필요

### 3.3 데드락 (Deadlock)

```
ERROR: deadlock detected
DETAIL: Process 12345 waits for ShareLock on transaction 67890;
        blocked by process 54321.
```
- 의미: 두 개의 트랜잭션이 서로를 기다리고 있음
- 발생 상황: 같은 테이블 여러 행을 다른 순서로 수정할 때
- 해결: 트랜잭션 순서 재정렬, 필요시 격리 수준 조정

### 3.4 메모리 부족

```
FATAL: out of memory
DETAIL: Failed while allocating block of X bytes in memory context "ExecutorState".
```
- 의미: DB가 메모리 부족 상태
- 원인: 너무 큰 데이터셋 조회, 메모리 누수
- 해결: Docker 메모리 할당 증가, 쿼리 최적화

### 3.5 디스크 가득참

```
ERROR: could not extend file "base/16384/12345": No space left on device
```
- 의미: 디스크 공간 부족
- 해결: Docker 볼륨 크기 증가, 오래된 로그 정리

### 3.6 연결 수 초과

```
FATAL: remaining connection slots are reserved for non-replication superuser connections
```
- 의미: 최대 동시 연결 수 도달
- 기본값: Supabase 무료는 보통 20-40개
- 해결: 커넥션 풀링 사용, 불필요한 연결 정리

---

## 4. 유용한 grep/필터 패턴 모음

### 4.1 오류만 추출하기

```bash
# FATAL 오류만 보기
docker logs supabase-db | grep FATAL

# ERROR나 FATAL 모두 보기
docker logs supabase-db | grep -E 'ERROR|FATAL'

# 경고와 오류만 보기
docker logs supabase-db | grep -E 'WARNING|ERROR|FATAL'
```

### 4.2 특정 사용자 관련 로그

```bash
# 특정 사용자의 연결 시도 모두 보기
docker logs supabase-db | grep 'user "postgres"'

# 특정 사용자의 인증 실패만 보기
docker logs supabase-db | grep 'user "postgres"' | grep 'authentication failed'
```

### 4.3 슬로우 쿼리만 뽑기

```bash
# 실행 시간이 기록된 모든 쿼리 보기
docker logs supabase-db | grep 'duration:'

# 1초 이상 걸린 쿼리만 보기 (단순 방식)
docker logs supabase-db | grep 'duration:' | grep -E 'duration: [1-9][0-9]{3,}'
```

### 4.4 특정 시간대의 로그만 보기

```bash
# 예: 2026-04-01 10:30 ~ 10:40 사이의 로그
docker logs supabase-db | grep '2026-04-01T10:3[0-9]'
docker logs supabase-db | grep '2026-04-01T10:4[0-9]'
```

### 4.5 특정 테이블 관련 로그

```bash
# "users" 테이블 관련 모든 로그
docker logs supabase-db | grep 'users'

# "users" 테이블 관련 오류만
docker logs supabase-db | grep 'users' | grep -E 'ERROR|FATAL'
```

### 4.6 일반적인 문제 패턴

```bash
# 연결 문제만
docker logs supabase-db | grep -E 'connection|FATAL.*password'

# 권한 관련 오류
docker logs supabase-db | grep -E 'permission denied|role'

# 잠금 관련
docker logs supabase-db | grep -E 'lock|deadlock'
```

---

## 5. 로그 설정 변경하기

> **주의**: Supabase Studio에서 관리하는 것이 더 안전합니다. 필요한 경우만 수동으로 변경하세요.

### 5.1 로그 레벨 변경

```sql
-- 현재 설정 확인
SHOW log_min_duration_statement;  -- 슬로우 쿼리 기준 (ms)
SHOW log_statement;                -- 어떤 쿼리를 로그할지

-- 슬로우 쿼리 기준을 500ms로 변경 (기본 1000ms)
ALTER SYSTEM SET log_min_duration_statement = 500;

-- 모든 쿼리를 로그 (개발 중에만, 매우 무거움)
ALTER SYSTEM SET log_statement = 'all';

-- 변경사항 적용 (DB 재시작 또는 reload)
SELECT pg_reload_conf();
```

### 5.2 자동 슬로우 쿼리 로깅 설정

```sql
-- 2초 이상 걸리는 쿼리만 기록
ALTER SYSTEM SET log_min_duration_statement = 2000;

-- 실행 시간이 500ms 이상인 prepared statement도 로그
ALTER SYSTEM SET log_min_duration_statement = 500;

-- 설정 적용
SELECT pg_reload_conf();
```

### 5.3 특정 세션에서만 로그 활성화

```sql
-- 현재 연결(세션)에서만 모든 쿼리 로그
SET log_statement = 'all';

-- 또는 슬로우 쿼리만 로그 (100ms 이상)
SET log_min_duration_statement = 100;

-- 이 설정은 현재 세션이 닫히면 자동으로 해제됨
```

---

## 6. 로그 로테이션 설정

PostgreSQL은 로그 파일이 계속 커지는 것을 방지하기 위해 자동으로 로그를 분할할 수 있습니다.

### 6.1 Docker Compose에서 로그 설정 (권장)

```yaml
# docker-compose.yml
services:
  supabase-db:
    image: supabase/postgres:latest
    environment:
      POSTGRES_INITDB_ARGS: >
        -c log_statement=all
        -c log_duration=on
        -c log_min_duration_statement=1000
        -c logging_collector=on
        -c log_directory='/var/log/postgresql'
        -c log_filename='postgresql-%Y-%m-%d_%H%M%S.log'
        -c log_truncate_on_rotation=on
        -c log_rotation_age=1440
        -c log_rotation_size=104857600
```

**설정 항목 설명**:
- `logging_collector=on`: 로그 수집 활성화
- `log_filename`: 로그 파일명 (시간 변수 가능)
- `log_rotation_age=1440`: 1440분(24시간)마다 새 파일 생성
- `log_rotation_size=104857600`: 파일이 100MB 이상이면 새 파일 생성

### 6.2 직접 수정하기 (SQL)

```sql
-- PostgreSQL 설정 파일 위치 확인
SHOW config_file;  -- 보통 /var/lib/postgresql/data/postgresql.conf

-- 로그 수집 설정
ALTER SYSTEM SET logging_collector = on;
ALTER SYSTEM SET log_directory = '/var/log/postgresql';
ALTER SYSTEM SET log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log';
ALTER SYSTEM SET log_rotation_age = 1440;  -- 24시간
ALTER SYSTEM SET log_rotation_size = 104857600;  -- 100MB

-- 변경사항 적용
SELECT pg_reload_conf();
```

---

## 7. 자주 겪는 오류와 해결 방법

| 오류 메시지 | 원인 | 해결 방법 |
|-----------|------|---------|
| `FATAL: password authentication failed` | 잘못된 비밀번호 | `.env`와 Supabase 비밀번호 일치 확인 |
| `ERROR: permission denied for schema public` | 사용자 권한 부족 | `GRANT` 명령으로 권한 부여 |
| `FATAL: out of memory` | 메모리 부족 | Docker 메모리 할당 증가, 쿼리 최적화 |
| `ERROR: could not extend file` | 디스크 부족 | Docker 볼륨 크기 증가 |
| `ERROR: deadlock detected` | 트랜잭션 충돌 | 쿼리 순서 재정렬, 트랜잭션 시간 단축 |
| `LOG: duration: 5000ms execute` | 슬로우 쿼리 | 인덱스 추가, EXPLAIN ANALYZE로 분석 |
| `FATAL: remaining connection slots reserved` | 연결 수 초과 | 커넥션 풀 사용, 불필요한 연결 종료 |
| `ERROR: syntax error at or near "SELECT"` | SQL 문법 오류 | SQL 쿼리 검토 및 수정 |
| `NOTICE: sequence created for SERIAL type` | 시퀀스 자동 생성 | 정상 동작 (무시해도 됨) |

---

## 8. 로그 분석 워크플로우

실제로 문제가 발생했을 때의 순서:

### Step 1: 최근 오류 빠르게 확인

```bash
docker logs --tail 200 supabase-db | grep -E 'ERROR|FATAL'
```

### Step 2: 오류 발생 시간 근처 상세 로그 확인

```bash
docker logs --timestamps supabase-db | grep '2026-04-01T10:3[0-9]'
```

### Step 3: 특정 원인 분석

- **비밀번호 오류**? → `.env` 확인
- **권한 오류**? → `GRANT` 권한 확인
- **슬로우 쿼리**? → `EXPLAIN ANALYZE` 로 분석
- **데드락**? → 트랜잭션 순서 확인

### Step 4: 실시간 모니터링으로 문제 재현 확인

```bash
docker logs -f --tail 50 supabase-db
```

---

## 9. FE 개발자가 알면 유용한 팁

### 로그를 자주 확인해야 하는 경우

1. **로컬 개발 중 DB 연결 안 됨** → 오류 로그를 먼저 봅시다
2. **API 응답이 갑자기 느려짐** → 슬로우 쿼리 로그로 확인
3. **같은 유저가 중복 생성되는 버그** → 데드락 로그 확인
4. **production에서 오류 보고됨** → Supabase Studio 로그 + 백엔드 로그 함께 확인

### 더 깊이 공부하려면

- `EXPLAIN ANALYZE` 명령으로 쿼리 실행 계획 분석
- PostgreSQL 공식 문서: [Logging](https://www.postgresql.org/docs/current/runtime-config-logging.html)
- Supabase 문서: Database Logs in Studio

---

## 10. Phase 5 마무리 및 다음 단계 예고

### Phase 5에서 배운 것 정리

- ✅ Supabase Studio에서 실시간 모니터링
- ✅ SQL 성능 분석 (EXPLAIN ANALYZE)
- ✅ PostgreSQL 로그 읽고 분석하기

**이제 데이터베이스 문제가 발생해도 자신감 있게 대처할 수 있습니다!**

### 다음: Phase 6 – GitHub Actions 자동화

Phase 6에서는 데이터베이스뿐 아니라 **전체 애플리케이션 배포를 자동화**합니다.

- 코드 푸시 → 자동 테스트 → 자동 배포
- GitHub Actions workflow 작성
- 환경별 설정 관리
- 배포 자동화의 장점과 주의사항

**계속 화이팅!** 🚀
