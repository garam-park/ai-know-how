# 05-E-18 VACUUM & ANALYZE 이해 및 수동 실행

**타입**: 개념 | **소요시간**: 10분

---

## 이 파일에서 배우는 것

- PostgreSQL의 **VACUUM** 이 dead tuple 정리하고 디스크 공간을 재활용하는 방법
- **ANALYZE** 가 쿼리 플래너를 최적화하기 위해 통계를 갱신하는 방법
- VACUUM vs VACUUM FULL 의 차이와 선택 기준
- Supabase 환경에서 **autovacuum** 상태 확인 방법
- 수동 VACUUM 이 필요한 상황과 명령어

---

## 🧠 FE 개발자를 위한 비유

### VACUUM = JavaScript 가비지 컬렉션 (GC) + React cleanup

JavaScript에서:
- **메모리 누수**: 더 이상 참조되지 않는 객체가 메모리에 남아있음 → CPU, 메모리 낭비
- **GC 실행**: 주기적으로 불필요한 객체 정리 → 성능 회복

PostgreSQL에서:
- **Dead tuple**: UPDATE나 DELETE 후 남은 이전 버전의 행 데이터 (MVCC 때문)
- **VACUUM 실행**: Dead tuple 정리 → 디스크 공간 회수, 스캔 성능 향상

### ANALYZE = 브라우저의 레이아웃 캐시 갱신

브라우저 렌더링:
- 브라우저가 요소의 크기, 위치 등을 캐시해서 빠른 렌더링 결정

PostgreSQL 쿼리:
- 플래너가 통계 정보를 기반으로 최적의 실행 계획 선택
- ANALYZE로 통계를 갱신 → 플래너가 더 정확한 결정 가능

---

## 본문

### 1. PostgreSQL의 MVCC (Multi-Version Concurrency Control)와 Dead Tuple

PostgreSQL은 **동시성**을 위해 MVCC를 사용합니다.

```sql
-- 예: 트랜잭션 A가 행을 UPDATE
UPDATE users SET name = 'Bob' WHERE id = 1;

-- 이때 PostgreSQL은:
-- 1. 기존 행(id=1, name='Alice')을 "dead"로 표시 (DELETE 아님!)
-- 2. 새 행(id=1, name='Bob')을 생성
-- 3. 다른 트랜잭션은 여전히 이전 버전 읽을 수 있음 (격리 수준에 따라)
```

**Dead tuple**: 더 이상 활성(active) 트랜잭션이 읽지 않는 행의 이전 버전

```sql
-- DELETE도 마찬가지
DELETE FROM users WHERE id = 2;
-- → 행이 즉시 삭제되지 않고, dead tuple로 표시됨
```

**문제점**:
- Dead tuple은 여전히 **디스크 공간 차지**
- 테이블 스캔할 때 불필요한 데이터까지 읽음 → **성능 저하**
- 방치할수록 악화

---

### 2. VACUUM의 역할: Dead Tuple 정리 및 공간 재활용

**VACUUM**은 dead tuple을 정리하는 유지보수 작업입니다.

```sql
-- 기본 VACUUM: dead tuple을 정리하지만 디스크는 반환하지 않음
VACUUM;

-- 또는 특정 테이블만 정리
VACUUM users;
```

**VACUUM 수행 단계**:
1. Dead tuple 식별: 더 이상 필요 없는 행의 버전 찾기
2. 공간 표시: 이 공간을 "재사용 가능"으로 표시
3. 향후 INSERT/UPDATE가 이 공간 재활용

**효과**:
- 테이블 스캔 성능 향상 (불필요한 데이터 읽지 않음)
- 디스크 공간 재활용 → **디스크 사용량 증가 방지**

---

### 3. VACUUM vs VACUUM FULL: 차이점과 선택 기준

#### VACUUM (기본)
```sql
VACUUM;
-- 또는
VACUUM users;
```

**특징**:
- Dead tuple 공간을 재활용 가능으로 표시만 함
- **테이블 잠금 없음** → 쿼리 실행 중에도 가능
- 빠름 (대부분의 경우 권장)
- 디스크 사용량은 줄지 않을 수 있음 (공간 재활용만)

#### VACUUM FULL
```sql
VACUUM FULL users;
-- 또는 (같은 의미)
VACUUM FULL;
```

**특징**:
- Dead tuple을 완전히 제거
- 행들을 **재배치** (물리적으로 테이블 압축)
- **배타적 잠금** → 테이블에 접근할 수 없음
- 느림 (프로덕션에서는 신중히!)
- **디스크 공간을 실제로 반환** (OS에 반납)

#### 선택 기준

| 상황 | 추천 |
|------|-----|
| 정기적인 유지보수 | VACUUM |
| 대량 DELETE 후 성능 저하 | VACUUM |
| 디스크 공간 회수 필요 (오래된 데이터 대량 삭제) | VACUUM FULL (야간/휴무일) |
| 프로덕션 운영 중 | VACUUM (절대 FULL 금지) |

---

### 4. ANALYZE의 역할: 통계 갱신 → 쿼리 플래너 최적화

**ANALYZE**는 테이블의 통계 정보를 갱신합니다.

```sql
-- 기본 ANALYZE
ANALYZE;

-- 특정 테이블 분석
ANALYZE users;

-- 특정 컬럼만 분석
ANALYZE users(email);
```

**PostgreSQL이 수집하는 통계**:
- 행 개수 (row count)
- 컬럼 값 분포 (히스토그램)
- NULL 비율
- 인덱스 선택도 (selectivity)

**쿼리 플래너가 이 통계를 사용해서**:
```sql
-- 플래너: "users 테이블에 100만 행이 있고,
--         email 컬럼은 95% 유니크하니까 인덱스 스캔 사용하자"
SELECT * FROM users WHERE email = 'alice@example.com';
```

**통계가 오래되면**:
```sql
-- 플래너: "users 테이블에 1000행 있는줄 알았는데 실제로 100만 행?"
--         → 잘못된 실행 계획 선택 → 성능 저하
SELECT * FROM users WHERE created_at > '2025-01-01';
```

**효과**:
- **쿼리 성능 최적화** (올바른 실행 계획 선택)
- 인덱스 활용도 향상

---

### 5. VACUUM과 ANALYZE를 함께 사용

가장 흔한 조합:

```sql
-- VACUUM으로 dead tuple 정리 + ANALYZE로 통계 갱신
VACUUM ANALYZE;

-- 또는 특정 테이블
VACUUM ANALYZE users;
```

**실무 패턴**:
- 야간 배치 작업에서 주기적으로 실행
- 대량 INSERT/DELETE 후 즉시 실행
- 성능 저하 감지 시 응급 조치로 실행

---

### 6. PostgreSQL의 Autovacuum: 자동 정리

PostgreSQL은 **자동으로** VACUUM과 ANALYZE를 실행합니다.

```sql
-- Autovacuum 설정 확인 (PostgreSQL 기본값)
SHOW autovacuum;  -- on

-- Autovacuum 간격 설정
SHOW autovacuum_naptime;  -- 1분 (기본값)

-- 테이블별 임계값
SHOW autovacuum_vacuum_threshold;        -- 50 (행 수)
autovacuum_vacuum_scale_factor;          -- 0.1 (10% of total rows)
```

**Autovacuum 동작 원리**:
```
매 1분마다 체크:
├─ 테이블 A: 1000행 중 150행 DELETE → 임계값 초과? → VACUUM 실행
├─ 테이블 B: 100행 중 5행 DELETE → 임계값 이하 → 패스
└─ ...
```

**Supabase에서 확인하는 방법**:

Supabase는 기본 autovacuum을 활성화하고 있습니다. 설정 확인:

```sql
-- Supabase에서 쿼리 실행
SELECT name, setting FROM pg_settings
WHERE name LIKE 'autovacuum%';

-- 결과 예:
-- autovacuum              | on
-- autovacuum_naptime      | 60 (1분)
-- autovacuum_vacuum_cost_delay | 2
-- ...
```

---

### 7. 수동 VACUUM이 필요한 상황

#### 상황 1: 대량 DELETE 후 성능 저하

```sql
-- DELETE 대량 실행
DELETE FROM logs WHERE created_at < '2026-01-01';  -- 1천만 행 삭제

-- Autovacuum 기다리지 말고 즉시 정리
VACUUM ANALYZE logs;
```

#### 상황 2: 성능 저하 감지 (쿼리 느려짐)

```sql
-- 통계 갱신으로 최적 계획 다시 생성
ANALYZE users;

-- 전체 DB 정리
VACUUM ANALYZE;
```

#### 상황 3: 디스크 공간 회수 필요 (신중!)

```sql
-- 야간/휴무일에만 실행 (테이블 잠금 발생)
VACUUM FULL users;
```

**주의**: VACUUM FULL은 테이블을 잠금하므로 프로덕션 중에는 절대 금지!

---

### 8. Supabase 환경에서의 실행

#### 수동 VACUUM 실행

Supabase Studio에서:

```sql
-- SQL Editor에서 직접 실행
VACUUM ANALYZE public.users;

-- 또는 특정 테이블 최적화
VACUUM FULL public.orders;  -- 야간 유지보수 시간에만!
```

#### 실행 상태 확인

```sql
-- Autovacuum 프로세스 모니터링
SELECT schemaname, relname, last_vacuum, last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY last_autovacuum DESC;

-- 결과 예:
-- schemaname | relname | last_vacuum | last_autovacuum
-- -----------+---------+-------------+------------------
-- public     | users   | NULL        | 2026-03-30 14:32:10
-- public     | logs    | 2026-03-30  | 2026-03-30 15:01:00
```

---

## 핵심 정리

| 개념 | 역할 | 실행 | 잠금 |
|------|------|------|------|
| **VACUUM** | Dead tuple 정리, 공간 재활용 | `VACUUM;` | 없음 ✅ |
| **VACUUM FULL** | Dead tuple 제거, 디스크 반환 | `VACUUM FULL;` | 있음 ⚠️ |
| **ANALYZE** | 통계 갱신, 쿼리 최적화 | `ANALYZE;` | 없음 ✅ |
| **VACUUM ANALYZE** | VACUUM + ANALYZE 동시 실행 | `VACUUM ANALYZE;` | 없음 ✅ |
| **Autovacuum** | PostgreSQL 자동 실행 | 설정만 확인 | 상황따라 |

---

## 다음 학습

다음 파일에서는 **Supabase Studio**를 통해 실제로 데이터베이스 모니터링을 하는 방법을 배웁니다.
- 쿼리 성능 분석
- 인덱스 활용도 모니터링
- Autovacuum 상태 확인
- 성능 저하 원인 진단

---

**작성일**: 2026-04-01
