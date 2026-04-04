# 05-D-16. EXPLAIN ANALYZE 읽는 법 기초

**타입**: 개념 (10분)
**선행학습**: pg_stat_statements 설치 및 쿼리 분석
**다음단계**: 인덱스 기초 — 언제 왜 쓰는가

---

## 이 파일에서 배우는 것

EXPLAIN ANALYZE 출력을 읽고 쿼리 성능 병목을 찾는 방법입니다.

느리거나 버그 같은 쿼리를 만났을 때, **어디서 시간이 낭비되는지** 시각적으로 확인할 수 있습니다.

**FE 개발자에게 비유하자면**: React DevTools의 Profiler flamegraph처럼, EXPLAIN ANALYZE는 쿼리 실행 트리를 보여줍니다. 각 노드는 얼마나 오래 걸렸는지 표시하고, 마치 컴포넌트 렌더링 시간을 확인하는 것처럼 병목을 찾을 수 있습니다.

---

## EXPLAIN vs EXPLAIN ANALYZE: 예상 vs 실제

### EXPLAIN (Planner 예상)
```sql
EXPLAIN SELECT * FROM users WHERE age > 30;
```
**출력 예시**:
```
Seq Scan on users  (cost=0.00..35.50 rows=500 width=100)
  Filter: (age > 30)
```

**의미**:
- 쿼리를 **실제로 실행하지 않고**, 플래너가 예상하는 비용만 표시
- `cost=0.00..35.50` = 첫 행까지 0, 전체 행까지 35.50의 추정 비용
- `rows=500` = 500개 행이 반환될 것으로 예상
- 빠르지만 **부정확할 수 있음** (통계가 오래되면)

### EXPLAIN ANALYZE (실제 실행)
```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE age > 30;
```
**출력 예시**:
```
Seq Scan on users  (cost=0.00..35.50 rows=500 width=100)
                   (actual time=0.123..45.678 rows=487)
  Filter: (age > 30)
    Rows Removed by Filter: 13
```

**의미**:
- 쿼리를 **실제로 실행**하고 결과 측정
- `actual time=0.123..45.678` = 첫 행까지 0.123ms, 전체 행까지 45.678ms
- `rows=487` = 실제로 487개 행이 반환됨
- **EXPLAIN vs ANALYZE 비교**:
  - 예상: rows=500 / 실제: rows=487 → 거의 정확 ✓
  - 만약 예상: rows=500 / 실제: rows=10 → 플래너가 오판했다는 신호

**주의**: `EXPLAIN ANALYZE`는 실제로 쿼리를 실행하므로, UPDATE/DELETE 같은 쓰기 쿼리에서는 데이터가 변경됩니다. 테스트할 때는 트랜잭션으로 롤백하세요:
```sql
BEGIN;
EXPLAIN ANALYZE UPDATE users SET status='active' WHERE id=1;
ROLLBACK;
```

---

## 출력 구조 읽기

### 기본 구조
```
Node Type (operation)  [cost=시작..끝 rows=예상행 width=평균바이트]
                       [actual time=시작..끝 rows=실제행]
  → 자식 노드
    └─ 손자 노드
```

### 각 항목의 의미

| 항목 | 의미 | 예시 |
|------|------|------|
| `cost=0.00..35.50` | 첫 행까지 0, 모든 행까지 35.50 추정 비용 | cost가 높으면 비효율 |
| `rows=500` | **예상** 행 개수 | 플래너의 통계 기반 예측 |
| `actual time=0.123..45.678` | 첫 행까지 0.123ms, 마지막 행까지 45.678ms | `rows=`와 함께 정확도 판단 |
| `rows=487` | **실제** 반환 행 개수 | 예상과 크게 차면 플래너 재학습 필요 |
| `width=100` | 평균 행 크기(바이트) | 메모리 사용량 추정에 사용 |
| `Rows Removed by Filter` | 필터링으로 제거된 행 | 많으면 먼저 필터링할 수 있는지 고려 |

### 읽는 순서
```
Seq Scan on users          ← 최상위: 전체 쿼리의 root
  Filter: (age > 30)       ← 자식: 이 노드가 어떤 작업을 하는지
```

**실행 순서는 아래에서 위로**: 자식 노드가 먼저 실행되고, 그 결과를 부모 노드가 받습니다.

---

## 주요 노드 타입 설명

### 1. Seq Scan (Sequential Scan)
전체 테이블을 처음부터 끝까지 스캔합니다.

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE age > 30;
```
```
Seq Scan on users  (cost=0.00..35.50 rows=500 width=100)
                   (actual time=0.234..45.678 rows=487)
  Filter: (age > 30)
    Rows Removed by Filter: 13
```

**FE 비유**: 모든 컴포넌트를 렌더링해서 DOM을 전부 스캔하는 것. 큰 리스트는 느립니다.

**언제 최적인가**:
- 테이블이 매우 작음 (< 1000행)
- 필터 조건이 거의 모든 행을 반환할 때

**개선 방법**: 인덱스 추가

---

### 2. Index Scan
인덱스를 사용해서 필요한 행만 찾습니다.

```sql
-- users.age에 인덱스가 있다고 가정
EXPLAIN ANALYZE SELECT * FROM users WHERE age > 30;
```
```
Index Scan using idx_users_age on users  (cost=0.42..15.50 rows=500 width=100)
                                          (actual time=0.156..23.456 rows=487)
  Index Cond: (age > 30)
```

**FE 비유**: 특정 컴포넌트만 lazy load해서 필요한 것만 렌더링하는 것. 훨씬 빠릅니다.

**cost가 낮음** (0.42..15.50 vs 0.00..35.50) → Seq Scan보다 효율적

---

### 3. Bitmap Index Scan + Bitmap Heap Scan
인덱스 결과를 비트맵으로 변환한 후 테이블에 접근합니다.

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE age > 30 AND city = 'Seoul';
```
```
Bitmap Heap Scan on users  (cost=12.50..50.00 rows=250 width=100)
                           (actual time=2.345..28.900 rows=245)
  Recheck Cond: ((age > 30) AND (city = 'Seoul'))
  → Bitmap Index Scan using idx_users_age  (cost=0.00..5.00 rows=300 width=0)
      Index Cond: (age > 30)
```

**복잡한 필터**: 여러 인덱스를 조합할 때 PostgreSQL이 자동으로 선택하는 방식

---

### 4. Nested Loop Join
한 테이블의 각 행에 대해, 다른 테이블을 반복 검색합니다.

```sql
EXPLAIN ANALYZE
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.age > 30;
```
```
Nested Loop  (cost=0.42..100.00 rows=500 width=150)
             (actual time=0.234..567.890 rows=487)
  → Seq Scan on users u  (cost=0.00..35.50 rows=500 width=100)
                         (actual time=0.123..45.678 rows=487)
        Filter: (age > 30)
  → Index Scan using idx_orders_user_id on orders o  (cost=0.42..0.65 rows=1 width=50)
                                                      (actual time=0.001..0.002 rows=1)
        Index Cond: (user_id = u.id)
```

**의미**: users에서 각 행을 가져온 후, 그 user_id로 orders를 찾습니다. (반복)

**FE 비유**: 각 사용자 컴포넌트마다 그들의 주문 목록을 개별적으로 fetch하는 것. N+1 쿼리 문제와 유사.

**느린 이유**: outer loop(users) 행 수 × inner loop(orders) 검색 비용

---

### 5. Hash Join
두 테이블을 해시 테이블로 변환해서 조인합니다.

```sql
EXPLAIN ANALYZE
SELECT u.name, COUNT(*)
FROM users u
JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;
```
```
HashAggregate  (cost=50.00..60.00 rows=500 width=50)
               (actual time=45.678..48.900 rows=500)
  → Hash Join  (cost=35.50..50.00 rows=1000 width=100)
               (actual time=23.456..40.123 rows=1000)
        Hash Cond: (u.id = o.user_id)
        → Seq Scan on users u  (cost=0.00..35.50 rows=500 width=100)
                               (actual time=0.123..45.678 rows=500)
        → Hash  (cost=25.00..25.00 rows=1000 width=50)
                (actual time=15.234..15.234 rows=1000)
              → Seq Scan on orders o  (cost=0.00..25.00 rows=1000 width=50)
                                      (actual time=0.456..12.345 rows=1000)
```

**의미**: orders 테이블을 메모리의 해시 테이블로 로드한 후, users의 각 행과 빠르게 매칭

**빠른 이유**: 해시 테이블 조회는 O(1)에 가까움

**조건**: 메모리가 충분해야 함 (work_mem 설정 확인)

---

### 6. Merge Join
양쪽 테이블을 정렬한 후, 차례로 비교하면서 조인합니다.

```
Merge Join  (cost=100.00..150.00 rows=1000 width=150)
            (actual time=50.234..120.456 rows=1000)
  Merge Cond: (u.id = o.user_id)
  → Sort  (cost=50.00..55.00 rows=500 width=100)
          (actual time=30.123..32.456 rows=500)
        → Seq Scan on users u  (cost=0.00..35.50 rows=500 width=100)
  → Sort  (cost=50.00..55.00 rows=1000 width=50)
          (actual time=45.678..48.900 rows=1000)
        → Seq Scan on orders o  (cost=0.00..25.00 rows=1000 width=50)
```

**특징**: 양쪽 모두 정렬 필요 (cost 높음), 하지만 결과 행이 정렬된 상태

---

### 7. Sort
행을 정렬합니다.

```sql
EXPLAIN ANALYZE SELECT * FROM users ORDER BY age DESC LIMIT 10;
```
```
Limit  (cost=35.50..35.75 rows=10 width=100)
       (actual time=23.456..23.500 rows=10)
  → Sort  (cost=35.50..40.50 rows=500 width=100)
          (actual time=23.234..23.450 rows=500)
        Sort Key: age DESC
        → Seq Scan on users  (cost=0.00..35.50 rows=500 width=100)
                             (actual time=0.123..12.345 rows=500)
```

**문제점**:
- 500개 행을 모두 메모리에 로드해서 정렬한 후, 처음 10개만 반환
- 비효율적 (메모리, CPU 사용)

**개선**: `age DESC` 인덱스 추가 → 정렬 생략

---

### 8. Aggregate (GROUP BY, COUNT, SUM)
행을 그룹화하고 집계합니다.

```sql
EXPLAIN ANALYZE SELECT age, COUNT(*) FROM users GROUP BY age;
```
```
HashAggregate  (cost=35.50..45.50 rows=50 width=8)
               (actual time=15.234..18.456 rows=50)
  Group Key: age
  → Seq Scan on users  (cost=0.00..35.50 rows=500 width=8)
                       (actual time=0.123..12.345 rows=500)
```

**유형**:
- `HashAggregate`: 일반적으로 빠름 (메모리 해시 테이블 사용)
- `GroupAggregate`: 정렬된 입력이 필요할 때

---

## 예시 쿼리와 EXPLAIN ANALYZE 해석

### 예시 1: 느린 쿼리 진단

**쿼리**:
```sql
EXPLAIN ANALYZE
SELECT u.id, u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id, u.name
ORDER BY order_count DESC;
```

**출력** (가정):
```
Sort  (cost=150.00..155.00 rows=5000 width=120)
      (actual time=500.234..510.456 rows=5000)
  Sort Key: (count(*)) DESC
  → HashAggregate  (cost=100.00..110.00 rows=5000 width=120)
                   (actual time=350.123..380.456 rows=5000)
        Group Key: u.id, u.name
        → Nested Loop Left Join  (cost=0.42..100.00 rows=10000 width=100)
                                 (actual time=1.234..450.678 rows=10000)
              → Seq Scan on users u  (cost=0.00..50.00 rows=5000 width=50)
                                     (actual time=0.123..100.234 rows=5000)
                    Filter: (created_at > '2024-01-01')
                    Rows Removed by Filter: 5000
              → Seq Scan on orders o  (cost=0.00..0.50 rows=2 width=50)
                                      (actual time=0.001..0.002 rows=2)
                    Filter: (user_id = u.id)
```

**병목 분석**:
1. **Nested Loop이 느림** (actual time=1.234..450.678)
   - users 테이블의 각 행(5000개)마다 orders를 스캔
   - 이는 5000 × orders스캔 = 비효율적
   - **해결**: `o.user_id`에 인덱스 추가

2. **Sort가 느림** (actual time=500.234..510.456)
   - 모든 5000개 행을 메모리에서 정렬
   - **해결**: 필요없으면 ORDER BY 제거, 또는 애플리케이션에서 처리

3. **예상과 실제 불일치** 없음 (rows 예상치가 정확)
   - 플래너가 올바르게 판단했음

---

### 예시 2: 최적화된 쿼리

같은 쿼리에 인덱스를 추가한 후:

```sql
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_users_created_at ON users(created_at);

EXPLAIN ANALYZE ...  (동일한 쿼리)
```

**출력** (개선됨):
```
Sort  (cost=120.00..125.00 rows=5000 width=120)
      (actual time=50.234..60.456 rows=5000)
  Sort Key: (count(*)) DESC
  → HashAggregate  (cost=50.00..60.00 rows=5000 width=120)
                   (actual time=30.123..40.456 rows=5000)
        Group Key: u.id, u.name
        → Nested Loop Left Join  (cost=0.42..50.00 rows=10000 width=100)
                                 (actual time=1.234..25.678 rows=10000)
              → Index Scan using idx_users_created_at on users u  (cost=0.42..20.00 rows=5000 width=50)
                                                                   (actual time=0.123..10.234 rows=5000)
                    Index Cond: (created_at > '2024-01-01')
              → Index Scan using idx_orders_user_id on orders o  (cost=0.42..0.65 rows=2 width=50)
                                                                  (actual time=0.001..0.002 rows=2)
                    Index Cond: (user_id = u.id)
```

**개선 결과**:
- 전체 시간: 450ms → 25ms (18배 빠름!)
- Seq Scan → Index Scan 변환
- 플래너가 더 효율적인 계획 수립

---

## 성능 병목 찾는 팁

### 1. actual time이 큰 노드 찾기
```
큰 시간 값 = 병목
```

출력을 읽을 때 **actual time의 끝 값**이 큰 노드를 주목하세요:
```
Seq Scan on large_table  (actual time=0.123..450.678 rows=50000)
↑ 450ms 걸림 = 이것이 병목
```

### 2. rows: 예상 vs 실제 불일치 확인
```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE age > 30);
```
```
Seq Scan on orders  (cost=0.00..50.00 rows=10000 width=50)
                    (actual time=0.123..25.678 rows=100)
  Filter: (user_id = ANY($1))
```

**문제**: 예상 rows=10000인데 실제 rows=100 (100배 차이!)
- 플래너가 통계를 잘못 학습함
- **해결**: `ANALYZE orders;` 실행해서 통계 업데이트

### 3. Rows Removed by Filter 확인
```
Filter: (status = 'active')
  Rows Removed by Filter: 9900
```

**의미**: 10000개 중 9900개를 필터링 (거의 대부분 버림)
- **개선**: 미리 필터링할 수 있는 인덱스 추가

### 4. Sequential Scan 찾기
```
Seq Scan on users  (cost=0.00..35.50 rows=500)
```
- 이 노드가 자주 실행되는 쿼리라면 인덱스 추가 고려

### 5. Sort 비용 확인
```
Sort  (cost=35.50..40.50 rows=500 width=100)
      (actual time=23.234..23.450 rows=500)
```
- 메모리 소비 + CPU 시간 많음
- **개선**: ORDER BY 제거 또는 인덱스로 정렬 상태 유지

---

## EXPLAIN의 추가 옵션

### BUFFERS: 디스크 I/O 분석
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM users WHERE age > 30;
```

**출력**:
```
Seq Scan on users  (cost=0.00..35.50 rows=500 width=100)
                   (actual time=0.234..45.678 rows=487)
  Buffers: shared hit=50 read=10
```

**의미**:
- `shared hit=50`: 캐시에서 50개 버퍼 읽음 (빠름)
- `shared read=10`: 디스크에서 10개 버퍼 읽음 (느림)
- 대부분 캐시 히트면 좋음 (성능 양호)

---

### FORMAT JSON: 프로그래밍 가능한 형식
```sql
EXPLAIN (ANALYZE, FORMAT JSON)
SELECT * FROM users WHERE age > 30;
```

**출력** (JSON):
```json
[
  {
    "Plan": {
      "Node Type": "Seq Scan",
      "Relation Name": "users",
      "Actual Rows": 487,
      "Actual Total Time": 45.678,
      "Startup Cost": 0.00,
      "Total Cost": 35.50
    }
  }
]
```

**용도**:
- 프로그래밍 언어에서 EXPLAIN 결과 파싱
- 모니터링 도구 연동
- 자동화된 성능 분석

---

### VERBOSE: 상세 정보
```sql
EXPLAIN (ANALYZE, VERBOSE)
SELECT u.id, u.name FROM users u WHERE age > 30;
```

**추가 표시**:
- 각 노드에서 사용되는 정확한 컬럼명
- 조인 조건 상세 정보
- 정렬 키 상세 정보

---

## 핵심 정리

| 개념 | 의미 | 팁 |
|------|------|-----|
| **EXPLAIN** | 예상 비용 (실행 안 함) | 빠르지만 부정확할 수 있음 |
| **EXPLAIN ANALYZE** | 실제 실행 + 측정 | 정확하지만 쓰기 쿼리 시 데이터 변경 |
| **cost** | 추정 비용 (낮을수록 좋음) | Seq Scan > Index Scan |
| **rows** | 예상 행 개수 | 실제 rows와 크게 다르면 통계 업데이트 |
| **actual time** | 실제 실행 시간 (ms) | 가장 큰 시간값이 병목 |
| **Nested Loop** | 반복 검색 (N+1 같음) | 느림, 인덱스 필요 |
| **Hash Join** | 해시 테이블 조인 | 빠르지만 메모리 필요 |
| **Sort** | 정렬 | 많은 행을 정렬하면 느림 |
| **Index Scan** | 인덱스 사용 | Seq Scan보다 대부분 빠름 |

---

## 다음 파일 예고: 인덱스 기초 — 언제 왜 쓰는가

EXPLAIN ANALYZE를 읽으면 "여기 인덱스 필요하다"는 것이 보입니다.

다음 파일에서는:
- 인덱스의 종류 (B-tree, Hash, GiST, BRIN)
- 언제 인덱스를 만들어야 하는가
- 인덱스를 만들 때 실수하는 것들
- 인덱스 성능을 측정하는 법

을 배웁니다.
