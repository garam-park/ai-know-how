# 05-D-15. pg_stat_statements 설치 및 쿼리 분석

**번호**: 05-D-15
**제목**: pg_stat_statements 설치 및 쿼리 분석
**유형**: 실습 (15~20분)
**선행 학습**: 슬로우 쿼리 로그 활성화 및 확인
**다음 단계**: EXPLAIN ANALYZE 읽는 법 기초

---

## 이 파일에서 하는 것

FE 개발자들이 **로그를 찾아가는 수동적인 성능 분석**에서 벗어나, **모든 쿼리의 성능 통계를 자동으로 수집하고 분석**하는 방법을 배웁니다.

### FE 개발자를 위한 비유
- **Lighthouse, Web Vitals처럼** 웹 성능 점수를 자동으로 측정하듯이
- **pg_stat_statements는 모든 SQL 쿼리의 성능 메트릭(실행 시간, 호출 횟수, 평균 시간 등)을 자동으로 기록**합니다
- 로그를 하나하나 뒤지는 대신, "지난 1시간 동안 가장 느렸던 쿼리가 뭐지?"를 한 SQL 쿼리로 찾을 수 있습니다

---

## 사전 조건

✅ **요구사항**
- PostgreSQL 슈퍼유저 권한 필요
- Supabase 또는 self-hosted PostgreSQL 접속 가능 상태
- 주의: 일반적으로 pg_stat_statements는 이미 설치되어 있음

✅ **준비물**
- pgAdmin, psql, 또는 Supabase Studio 콘솔 접속

---

## Step 1: pg_stat_statements 설치 확인 및 활성화

> **Supabase 환경**: Supabase 셀프호스팅 Docker 이미지에는 pg_stat_statements가 기본적으로 설치 및 활성화되어 있습니다. 아래 명령어로 확인만 하면 됩니다.

**목표**: pg_stat_statements 확장 모듈 설치 상태 확인 및 활성화

### 1.1 확장 설치 상태 확인

```sql
-- 설치된 확장 목록 확인
SELECT extname FROM pg_extension WHERE extname = 'pg_stat_statements';
```

**예상 결과**:
- 이미 설치됨 → `pg_stat_statements` 행이 보임
- 미설치 → 결과 없음

### 1.2 확장 설치 (미설치인 경우에만)

```sql
-- pg_stat_statements 확장 설치
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

**완료 기준**:
- `CREATE EXTENSION` 메시지 또는 `CREATE EXTENSION`의 응답
- 오류 없이 실행됨

### 1.3 shared_preload_libraries 설정 확인

```sql
-- PostgreSQL 서버 설정 확인
SHOW shared_preload_libraries;
```

**예상 결과**:
- `pg_stat_statements`를 포함한 값이 보여야 함
- 예: `pg_stat_statements, pgaudit, ...`

**설정이 없다면**:
- PostgreSQL 설정 파일 (`postgresql.conf`) 수정 필요
- 라인 찾기: `shared_preload_libraries = 'pg_stat_statements'`
- 서버 재시작 필요 (Supabase에서는 관리자가 담당)

### 1.4 확인 쿼리

```sql
-- pg_stat_statements 뷰에 접근 가능한지 확인
SELECT * FROM pg_stat_statements LIMIT 1;
```

**성공 조건**: 오류 없이 결과 반환 또는 "0개 행"

---

## Step 2: 기본 통계 조회

**목표**: pg_stat_statements가 수집 중인 기본 메트릭 이해

### 2.1 핵심 컬럼 설명

```sql
-- 기본 통계 조회 (가독성 개선)
SELECT
    query,                    -- 실행된 SQL 쿼리 (정규화됨)
    calls,                    -- 쿼리 실행 횟수
    total_exec_time,          -- 총 실행 시간 (ms)
    mean_exec_time,           -- 평균 실행 시간 (ms)
    max_exec_time,            -- 최대 실행 시간 (ms)
    min_exec_time,            -- 최소 실행 시간 (ms)
    rows                      -- 반환된 행 수 (합계)
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 5;
```

### 2.2 각 메트릭의 의미

| 컬럼명 | 의미 | FE 비유 |
|--------|------|--------|
| `calls` | 쿼리 실행 횟수 | 페이지 방문 횟수 |
| `total_exec_time` | 총 실행 시간(ms) | 누적 로딩 시간 |
| `mean_exec_time` | 평균 실행 시간(ms) | 평균 로딩 시간 (CLS 같은) |
| `max_exec_time` | 최악의 실행 시간(ms) | 최악의 로딩 시간 |
| `rows` | 반환된 행 수 | 로드된 데이터 크기 |

### 2.3 실습: 현재 상태 확인

```sql
-- 현재 수집된 통계 개수
SELECT COUNT(*) as query_count
FROM pg_stat_statements;

-- 가장 오래 실행 중인 쿼리들
SELECT
    SUBSTRING(query, 1, 80) as query_snippet,
    total_exec_time,
    calls,
    ROUND(mean_exec_time, 2) as avg_time_ms
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

**완료 기준**: 쿼리 목록과 통계 수치가 보임

---

## Step 3: 가장 느린 쿼리 TOP 10 조회

**목표**: 성능 개선이 필요한 쿼리 식별

### 3.1 총 실행 시간 기준 (가장 많은 리소스를 쓴 쿼리)

```sql
-- 누적 실행 시간으로 정렬 (가장 무거운 쿼리)
SELECT
    query,
    calls,
    ROUND(total_exec_time, 2) as total_time_ms,
    ROUND(mean_exec_time, 2) as mean_time_ms,
    ROUND(max_exec_time, 2) as max_time_ms
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'  -- 자체 쿼리 제외
ORDER BY total_exec_time DESC
LIMIT 10;
```

**해석 방법**:
- 이 쿼리들이 **전체 데이터베이스 성능의 80%를 차지**할 가능성 높음
- 개선하면 가장 큰 효과 기대

### 3.2 평균 실행 시간 기준 (가장 느린 개별 쿼리)

```sql
-- 평균 시간으로 정렬 (한 번에 가장 오래 걸리는 쿼리)
SELECT
    query,
    calls,
    ROUND(mean_exec_time, 2) as mean_time_ms,
    ROUND(max_exec_time, 2) as max_time_ms,
    ROUND(stddev_exec_time, 2) as stddev_ms
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
    AND calls > 1  -- 최소 2회 이상 실행
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**해석 방법**:
- `stddev_exec_time`: 실행 시간의 편차 (높을수록 불안정)
- 편차가 크면 → 특정 데이터에서만 느림 (인덱스 부족 가능성)

### 3.3 완료 기준

✅ 느린 쿼리 목록이 보임
✅ 상위 3개 쿼리의 실행 시간을 기록할 수 있음

---

## Step 4: 가장 자주 호출되는 쿼리 TOP 10 조회

**목표**: "자주 실행되는 쿼리"의 성능 최적화 기회 발견

### 4.1 호출 횟수 기준

```sql
-- 가장 자주 실행되는 쿼리
SELECT
    query,
    calls,
    ROUND(total_exec_time, 2) as total_time_ms,
    ROUND(mean_exec_time, 2) as mean_time_ms,
    ROUND(total_exec_time / calls, 2) as per_call_ms
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY calls DESC
LIMIT 10;
```

### 4.2 실무 활용 패턴

**경우 1**: 호출 횟수 높음 + 평균 시간 짧음
→ 자주 실행되지만 대부분 빠름 (정상)

**경우 2**: 호출 횟수 높음 + 평균 시간 높음
→ **즉시 최적화 대상** (작은 개선도 큰 효과)

**예시**:
```
호출 1000회 × 10ms = 10,000ms (10초)
→ 평균 시간을 1ms로 줄이면 = 1,000ms (1초) 절감
```

### 4.3 완료 기준

✅ 자주 호출되는 쿼리 TOP 5 확인
✅ "최적화할 가치 있는 쿼리"를 판단할 수 있음

---

## Step 5: 통계 리셋

**목표**: 특정 시점부터의 통계만 추적하기 (배포 전후 비교 등)

### 5.1 전체 통계 리셋

```sql
-- 현재 축적된 모든 통계 삭제 (초기화)
SELECT pg_stat_statements_reset();
```

**결과**: `(NULL)` 반환 → 성공

### 5.2 선택적 리셋 (특정 쿼리)

```sql
-- 특정 쿼리만 리셋 (PostgreSQL 13+)
SELECT pg_stat_statements_reset(userid, dbid, queryid);
```

**주의**: 버전에 따라 미지원될 수 있음

### 5.3 실습: 리셋 후 통계 확인

```bash
# 1. 통계 리셋
psql -U postgres -d your_database -c "SELECT pg_stat_statements_reset();"

# 2. 몇 가지 쿼리 실행
psql -U postgres -d your_database -c "SELECT COUNT(*) FROM users;"

# 3. 통계 확인 (방금 실행한 쿼리만 보임)
psql -U postgres -d your_database -c "SELECT * FROM pg_stat_statements LIMIT 5;"
```

### 5.4 완료 기준

✅ `pg_stat_statements_reset()` 실행 성공
✅ 리셋 후 통계가 초기화되었는지 확인

---

## Step 6: 실무 활용 패턴

**목표**: 지속적인 성능 모니터링 전략 수립

### 6.1 배포 전후 비교

```sql
-- [배포 전] 현재 상태 저장
CREATE TABLE query_stats_before_deployment AS
SELECT
    query,
    calls,
    mean_exec_time,
    total_exec_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%';

-- [배포 진행]

-- [배포 후] 비교 쿼리
SELECT
    a.query,
    b.calls - a.calls as new_calls,
    ROUND(b.mean_exec_time - a.mean_exec_time, 2) as time_diff_ms
FROM query_stats_before_deployment a
JOIN pg_stat_statements b ON a.query = b.query
WHERE (b.calls - a.calls) > 0  -- 배포 후 새로운 실행
    AND b.mean_exec_time > a.mean_exec_time  -- 시간 증가
ORDER BY time_diff_ms DESC;
```

### 6.2 주기적 모니터링 스크립트

```bash
#!/bin/bash
# 매일 자정에 실행 → 쿼리 성능 통계 CSV로 내보내기

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/log/pg_stats"

mkdir -p $BACKUP_DIR

psql -U postgres -d your_database \
    -c "COPY (
        SELECT
            NOW() as snapshot_time,
            query,
            calls,
            total_exec_time,
            mean_exec_time
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY total_exec_time DESC
    ) TO STDOUT WITH CSV HEADER" \
    > "$BACKUP_DIR/pg_stats_$TIMESTAMP.csv"

echo "Saved to $BACKUP_DIR/pg_stats_$TIMESTAMP.csv"
```

### 6.3 성능 기준선 설정 (SLO)

```sql
-- "정상 범위"를 벗어난 쿼리 찾기
SELECT
    query,
    mean_exec_time,
    CASE
        WHEN mean_exec_time > 1000 THEN '🔴 Critical (>1s)'
        WHEN mean_exec_time > 500 THEN '🟡 Warning (>500ms)'
        ELSE '🟢 OK'
    END as severity
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
    AND calls > 10
ORDER BY mean_exec_time DESC;
```

---

## 확인 방법

### 체크리스트

- [ ] pg_stat_statements 확장 설치 확인
- [ ] 기본 쿼리 실행 후 통계 수집 확인
- [ ] TOP 10 느린 쿼리 조회 성공
- [ ] TOP 10 자주 호출되는 쿼리 조회 성공
- [ ] 통계 리셋 후 초기화 확인
- [ ] 배포 전후 비교 스크립트 이해

### 검증 명령어

```sql
-- 모든 Step 한 번에 확인
SELECT
    '확장 설치 상태' as check_item,
    CASE WHEN EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements')
         THEN '✅ 설치됨' ELSE '❌ 미설치' END as status
UNION ALL
SELECT
    '수집된 통계',
    COUNT(*) || ' 개 쿼리' FROM pg_stat_statements
UNION ALL
SELECT
    '가장 느린 쿼리 (ms)',
    ROUND(MAX(mean_exec_time), 2)::text FROM pg_stat_statements
UNION ALL
SELECT
    '가장 자주 호출 (회)',
    MAX(calls)::text FROM pg_stat_statements;
```

---

## 자주 겪는 오류

### ❌ ERROR: extension "pg_stat_statements" does not exist

**원인**: pg_stat_statements 모듈이 설치되지 않음

**해결**:
```sql
-- 1. 슈퍼유저 확인
SELECT current_user, usesuper FROM pg_user WHERE usename = current_user;

-- 2. 설치 시도
CREATE EXTENSION pg_stat_statements;

-- 3. 여전히 실패 → PostgreSQL 관리자에게 문의
-- (Supabase라면 지원팀 연락)
```

---

### ❌ ERROR: permission denied for relation pg_stat_statements

**원인**: 슈퍼유저 권한 부족

**해결**:
```bash
# psql로 슈퍼유저로 접속
psql -U postgres -d your_database
```

---

### ❌ pg_stat_statements가 데이터를 수집하지 않음

**원인**: shared_preload_libraries에 등록되지 않음

**확인**:
```sql
SHOW shared_preload_libraries;
-- 결과에 pg_stat_statements가 없으면 설정 필요
```

**해결** (Supabase self-hosted):
1. `postgresql.conf` 수정
2. `shared_preload_libraries = 'pg_stat_statements'` 추가
3. PostgreSQL 재시작

---

### ❌ 통계가 너무 많이 쌓임 (메모리 부족)

**증상**: pg_stat_statements 조회가 느려짐

**해결**:
```sql
-- 주기적으로 리셋
SELECT pg_stat_statements_reset();

-- 또는 오래된 통계만 삭제 (설정에 따라)
-- postgresql.conf: pg_stat_statements.max = 10000 (기본값)
```

---

## 실습 예제

### 실습 1: 가장 오래 걸리는 쿼리 찾기

```sql
-- 쿼리 실행 (예: 무거운 집계 쿼리)
SELECT user_id, COUNT(*) as orders_count
FROM orders
GROUP BY user_id;

-- 통계 확인
SELECT
    SUBSTRING(query, 1, 100) as query,
    mean_exec_time,
    calls
FROM pg_stat_statements
WHERE query LIKE '%GROUP BY%'
ORDER BY mean_exec_time DESC;
```

### 실습 2: N+1 쿼리 패턴 찾기

```sql
-- 비슷한 쿼리가 많이 반복되는지 확인
SELECT
    SUBSTRING(query, 1, 80) as query_pattern,
    calls,
    SUM(calls) OVER (PARTITION BY SUBSTRING(query, 1, 80)) as similar_queries
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY calls DESC
LIMIT 10;
```

---

## 다음 단계

**다음 파일**: EXPLAIN ANALYZE 읽는 법 기초 (05-D-16)

현재 "느린 쿼리가 뭐지?"를 찾았으니, 다음은:
1. **왜 느린가?** → EXPLAIN ANALYZE 실행
2. **어떻게 빠르게 할 것인가?** → 인덱스, 조인 전략 등 분석

---

## 추가 자료

**PostgreSQL 공식 문서**:
- [pg_stat_statements](https://www.postgresql.org/docs/current/pgstatstatements.html)

**관련 확장**:
- `pg_stat_kcache`: 디스크 I/O 통계
- `auto_explain`: 느린 쿼리 자동 EXPLAIN

---

**작성일**: 2026-04-01
**대상**: FE 개발자, DevOps 초급
