# 05-E-19: Supabase Studio에서 DB 모니터링하기

## 개요

| 항목 | 내용 |
|------|------|
| 유형 | 실습 |
| 소요시간 | 15~20분 |
| 이전 문서 | 05-E-18: VACUUM & ANALYZE 이해 및 수동 실행 |
| 다음 문서 | 05-E-20: PostgreSQL 로그 파일 위치 & 분석법 |
| 사전 조건 | Supabase self-hosted 실행 중, Studio 접근 가능 (04-D-18에서 설정 완료) |

---

## 이 파일에서 하는 것

Supabase Studio는 PostgreSQL 데이터베이스의 **웹 기반 GUI 모니터링 도구**입니다.

**FE 개발자 관점에서의 비유:**
- Vercel Dashboard → 배포된 Next.js 앱의 상태, 빌드 로그, 성능 지표 실시간 확인
- Firebase Console → Firestore DB 크기, 읽기/쓰기 비용, 활성 사용자 추적
- **Supabase Studio** → PostgreSQL 테이블 데이터, DB 크기, 활성 연결, 로그 확인

이 파일에서는 **Studio GUI를 활용하여** CLI 명령어 없이 DB 상태를 모니터링하는 방법을 학습합니다.

---

## Step 1: Studio 로그인 및 대시보드 탐색

### 목표
Supabase Studio에 접속하여 프로젝트 대시보드 구조를 파악합니다.

### 실행 방법

1. 브라우저에서 Supabase Studio 접속
   ```
   http://localhost:3000
   ```
   (self-hosted 기본 포트가 3000이 아닐 수도 있으니 04-D-18의 설정 확인)

2. 좌측 사이드바에서 프로젝트 선택
   - 프로젝트명 클릭 → 프로젝트 대시보드 진입

3. 상단 네비게이션 탭 확인
   ```
   [Overview] [Editor] [Auth] [Storage] [Logs] [Database] [...기타]
   ```

### 완료 기준
- [ ] Studio에 로그인 완료
- [ ] 프로젝트 선택 후 대시보드 진입
- [ ] 상단 네비게이션 탭이 모두 보임

---

## Step 2: Table Editor에서 테이블 구조/데이터 확인

### 목표
생성된 테이블 목록과 데이터 구조를 GUI로 확인합니다.

### 실행 방법

1. 좌측 사이드바에서 **"SQL Editor"** 또는 **"Table Editor"** 클릭
   - (UI 버전에 따라 이름이 다를 수 있음)

2. 테이블 목록 확인
   ```
   public 스키마 아래 생성한 모든 테이블이 나열됨
   예: users, products, orders, logs 등
   ```

3. 테이블 선택 → 우측 패널에서 확인
   - **구조 탭**: 컬럼명, 타입, NULL 가능 여부, 기본값 확인
   - **데이터 탭**: 실제 저장된 데이터 확인
   - **쿼리 탭**: 해당 테이블 조회 쿼리 자동 생성

### 완료 기준
- [ ] 최소 2개 이상의 테이블 구조 확인
- [ ] 각 테이블의 샘플 데이터 시각화
- [ ] 컬럼의 타입과 제약 조건 파악

---

## Step 3: SQL Editor에서 모니터링 쿼리 실행

### 목표
SQL 쿼리를 직접 실행하여 DB의 상태 지표를 수집합니다.

### 실행 방법

#### 3.1 전체 DB 크기 확인

1. **SQL Editor** 탭 열기

2. 다음 쿼리 복사 후 실행:
   ```sql
   SELECT pg_size_pretty(pg_database_size(current_database()));
   ```

3. 결과 해석
   ```
   pg_size_pretty
   ────────────────
   45 MB          ← 전체 데이터베이스 크기
   ```

**의미:** 현재 PostgreSQL 클러스터의 총 용량. 15MB 이상이면 정리 고려.

---

#### 3.2 테이블별 크기 확인

1. SQL Editor에 새로운 쿼리 입력:
   ```sql
   SELECT
     relname,
     pg_size_pretty(pg_total_relation_size(relid)) AS size
   FROM pg_stat_user_tables
   ORDER BY pg_total_relation_size(relid) DESC;
   ```

2. 결과 예시:
   ```
   relname      │ size
   ─────────────┼──────────
   products     │ 12 MB
   orders       │ 8 MB
   logs         │ 20 MB
   users        │ 1 MB
   ```

**의미:** 테이블별로 얼마나 디스크 공간을 차지하는지 확인. `logs` 테이블이 너무 크면 VACUUM 필요.

---

#### 3.3 활성 연결 수 확인

1. 쿼리 실행:
   ```sql
   SELECT count(*) AS active_connections
   FROM pg_stat_activity;
   ```

2. 결과 예시:
   ```
   active_connections
   ───────────────────
   5
   ```

**의미:** 현재 DB에 연결된 클라이언트 수. 정상은 2~10 정도. 100을 넘으면 연결 누수 의심.

---

#### 3.4 Dead Tuple 확인 (정리 필요 여부)

1. 쿼리 실행:
   ```sql
   SELECT
     relname,
     n_dead_tup,
     CASE
       WHEN n_live_tup + n_dead_tup = 0 THEN 0
       ELSE round(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
     END AS dead_ratio
   FROM pg_stat_user_tables
   WHERE n_dead_tup > 0
   ORDER BY n_dead_tup DESC;
   ```

2. 결과 예시:
   ```
   relname    │ n_dead_tup │ dead_ratio
   ────────────┼────────────┼───────────
   logs       │ 5000       │ 25.50
   products   │ 120        │ 2.10
   ```

**의미:** 삭제된 행(dead tuple)이 많을수록 VACUUM 실행이 필요함.
- `dead_ratio > 10%` → VACUUM 권장
- `dead_ratio > 30%` → VACUUM 필수

### 완료 기준
- [ ] 4가지 모니터링 쿼리 모두 실행
- [ ] 각 결과의 의미 이해
- [ ] 이상 상태(예: dead_ratio > 50%) 발견 시 메모

---

## Step 4: Authentication 탭에서 사용자 관리

### 목표
Studio에서 사용자(로그인 계정) 현황을 확인합니다.

### 실행 방법

1. 상단 네비게이션에서 **"Auth"** 탭 클릭

2. 사용자 목록 확인
   - 이메일, 가입 날짜, 최근 로그인, 상태 등 표시

3. 사용자 상세 정보 클릭
   - JWT 토큰 생성 시간
   - 다중 인증(MFA) 설정 여부
   - 롤(Role) 확인

4. 필요시 사용자 삭제/비활성화
   - 메뉴 → "Delete user" 또는 "Disable user"

### 완료 기준
- [ ] Auth 탭에서 최소 1명 이상의 사용자 확인
- [ ] 사용자 상세 정보 페이지 확인
- [ ] (선택) 테스트 사용자 1명 추가 후 목록에서 확인

---

## Step 5: Logs 탭에서 서비스별 로그 확인

### 목표
Supabase 각 서비스(API, Auth, Realtime)의 실시간 로그를 모니터링합니다.

### 실행 방법

1. 상단 네비게이션에서 **"Logs"** 탭 클릭

2. 서비스 필터 확인
   ```
   [All Services] [Postgres] [PostgREST] [GoTrue] [Realtime] [Storage]
   ```

3. **Postgres** 로그 선택
   ```
   [2026-04-01 10:30:15.123] LOG: VACUUM started on table "public.logs"
   [2026-04-01 10:30:45.456] LOG: VACUUM completed
   ```

4. **PostgREST** 로그 확인 (API 서버)
   ```
   [2026-04-01 10:30:20.789] INFO: GET /rest/v1/products?select=*
   [2026-04-01 10:30:21.012] INFO: 200 OK - 25ms
   ```

5. 시간 범위 필터 설정
   - "Last 1 hour", "Last 24 hours" 등 선택

### 완료 기준
- [ ] 최소 3가지 서비스 로그 확인
- [ ] PostgreSQL 로그에서 쿼리 실행 기록 발견
- [ ] 시간 필터로 특정 기간 로그 추출

---

## Step 6: Database 탭에서 역할/확장/타입 관리

### 목표
데이터베이스 수준의 고급 설정(역할, 확장, 사용자 정의 타입)을 확인합니다.

### 실행 방법

1. 상단 네비게이션에서 **"Database"** 탭 클릭

2. **Roles** 섹션
   - 기본 역할 확인: `postgres`, `anon`, `authenticated`
   - 각 역할의 권한 확인
   - 필요시 새로운 역할 생성

3. **Extensions** 섹션
   - 설치된 확장 확인
   ```
   pgcrypto    - 암호화 함수
   uuid-ossp   - UUID 생성
   plpgsql     - 저장 프로시저 언어
   ```

4. **Types** 섹션
   - 기본 데이터 타입 확인
   - (선택) 사용자 정의 타입 생성

### 완료 기준
- [ ] 기본 역할 3개 이상 확인
- [ ] 설치된 확장 최소 3개 확인
- [ ] Types 섹션 방문

---

## 확인 방법 (체크리스트)

다음 항목들을 모두 확인하고 체크하세요.

### 기본 모니터링
- [ ] Studio에 정상 로그인
- [ ] 프로젝트의 모든 테이블 목록 시각화
- [ ] 테이블별 크기를 내림차순으로 확인
- [ ] 현재 활성 연결 수 < 50

### 상태 지표 확인
- [ ] DB 크기 (pg_size_pretty) 기록
- [ ] Dead tuple 비율 중 가장 높은 테이블 식별
- [ ] 마지막 VACUUM 시간 기록 (가능하면)

### 운영 정보
- [ ] 현재 활성 사용자 수 확인
- [ ] 최근 1시간 로그 중 에러 메시지 유무 확인
- [ ] 설치된 확장 목록 메모

### 이상 신호 검토
- [ ] 특정 테이블 크기가 비정상적으로 큼 (>100MB)
- [ ] Dead ratio > 50%인 테이블 있는가
- [ ] 로그에 "ERROR" 또는 "FATAL" 메시지 있는가
- [ ] 활성 연결이 비정상적으로 많음 (>100)

---

## 자주 겪는 오류

### 오류 1: "Studio에 접속할 수 없습니다"

**증상:**
```
연결 시간 초과 (Connection timeout)
또는 "Cannot reach http://localhost:3000"
```

**원인:**
- Supabase self-hosted 서버가 실행 중이지 않음
- 포트 번호 잘못됨 (04-D-18 재확인)
- 방화벽 차단

**해결법:**
```bash
# Docker로 실행 확인
docker ps | grep supabase

# 포트 확인
netstat -an | grep LISTEN | grep 3000

# Supabase 로그 확인
docker logs <supabase-container-id>
```

---

### 오류 2: "권한 오류: permission denied"

**증상:**
```
쿼리 실행 시:
ERROR: permission denied for schema public
```

**원인:**
- 로그인한 역할이 적절한 권한이 없음
- Studio가 `anon` 역할로 연결됨

**해결법:**
```sql
-- postgres 역할로 재연결
-- Studio 설정에서 "Connection" 확인

-- 또는 역할에 권한 부여
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
```

---

### 오류 3: "SQL Editor 쿼리 실행 안 됨"

**증상:**
```
버튼 클릭 후 로딩만 계속 표시
또는 "Request timeout"
```

**원인:**
- 복잡한 쿼리 (시간이 오래 걸림)
- 데이터베이스 잠금 (Lock)
- Studio 세션 만료

**해결법:**
1. 페이지 새로고침 (F5)
2. Studio 다시 로그인
3. 쿼리 단순화 (LIMIT 1000 추가)
4. 다른 클라이언트 연결 확인 및 종료

---

### 오류 4: "테이블이 보이지 않음"

**증상:**
```
Table Editor에 아무 테이블도 나열되지 않음
또는 생성한 테이블이 사라짐
```

**원인:**
- 테이블이 `public` 스키마가 아닌 다른 곳에 생성됨
- 역할의 권한 부족

**해결법:**
```sql
-- 모든 테이블 확인
SELECT * FROM information_schema.tables
WHERE table_schema != 'pg_catalog'
AND table_schema != 'information_schema';

-- 특정 스키마의 테이블 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

---

### 오류 5: "Dead ratio가 계속 높음 (>50%)"

**증상:**
```
pg_stat_user_tables 쿼리 결과에서
n_dead_tup이 계속 증가
```

**원인:**
- 자동 VACUUM이 비활성화됨
- VACUUM 주기가 너무 김
- 테이블 데이터 삭제가 많음

**해결법:**
```sql
-- 수동 VACUUM 즉시 실행
VACUUM ANALYZE <table_name>;

-- 자동 VACUUM 설정 확인
SHOW autovacuum;        -- on이어야 함
SHOW autovacuum_naptime; -- 기본 1분

-- 공격적 VACUUM 설정 (옵션)
ALTER TABLE <table_name> SET (autovacuum_vacuum_scale_factor = 0.01);
```

---

## 모니터링 주기 추천

| 빈도 | 항목 | 언제 |
|------|------|------|
| **매일** | 활성 연결 수, 에러 로그 | 아침 9시 / 오후 6시 |
| **주 1회** | DB 크기, Dead ratio | 월요일 오전 |
| **월 1회** | 사용자 계정 정리, 확장 업데이트 | 월초 |
| **필요시** | 느린 쿼리 로그 | 성능 저하 발생 시 |

---

## 학습 완료 후 다음 단계

이제 Supabase Studio GUI를 통해 DB를 모니터링하는 방법을 익혔습니다.

다음 문서에서는:
- **PostgreSQL 로그 파일의 물리적 위치**
- **로그 파일 직접 분석** (Studio가 아닌 파일 시스템 접근)
- **느린 쿼리 탐지** (slow query log)

를 학습하게 됩니다.

---

## 요약

| 항목 | 내용 |
|------|------|
| **핵심 개념** | Supabase Studio = PostgreSQL의 웹 GUI 대시보드 |
| **모니터링 주요 지표** | DB 크기, 테이블별 크기, 활성 연결, Dead tuple 비율 |
| **SQL Editor 역할** | CLI 없이 쿼리 실행 및 결과 확인 |
| **로그 확인** | Logs 탭에서 Postgres, API, Auth 등 서비스 로그 추적 |
| **역할 관리** | Database 탭에서 권한 제어 |
| **FE 개발자 관점** | 백엔드 DB의 "배포 상태 대시보드"로 생각 |

---

**참고:** 이 문서는 Supabase self-hosted 환경을 기준으로 작성되었습니다. 클라우드 호스팅 환경에서는 UI가 약간 다를 수 있습니다.
