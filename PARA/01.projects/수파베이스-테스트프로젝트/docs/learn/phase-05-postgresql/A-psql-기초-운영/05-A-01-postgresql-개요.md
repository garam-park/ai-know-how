# 05-A-01 Supabase 맥락에서의 PostgreSQL 개요

> 유형: 개념 | 예상 소요 시간: 10분
> 이전: — (Phase 5 첫 파일) | 다음: Docker exec로 psql 접속하는 법

---

## 이 파일에서 배우는 것

Supabase가 PostgreSQL 위에서 어떻게 구축되었는지, 그리고 셀프호스팅 환경에서 PostgreSQL을 직접 다뤄야 하는 이유를 이해합니다. PostgreSQL의 기본 구조와 Supabase가 추가한 확장 기능들을 개괄적으로 살펴봅니다.

---

## 본문

### 1. PostgreSQL은 Supabase의 데이터 저장소

당신은 FE 개발자로서 `localStorage`와 `IndexedDB`를 알고 있을 겁니다. 브라우저에서 **모든 데이터는 이 두 저장소 중 하나에 저장**되고, 앱의 상태는 여기서 나옵니다.

**서버 세계에서 PostgreSQL의 위치가 정확히 같습니다.**

```
브라우저 세상:
localStorage/IndexedDB ← 모든 브라우저 데이터의 중심

서버 세상:
PostgreSQL ← Supabase의 모든 데이터의 중심
```

Supabase는 실은 **PostgreSQL이라는 검증된 데이터베이스 위에 편리한 계층을 얹은 것**입니다. Supabase가 관리형 서비스를 제공할 때, 내부적으로는 모두 PostgreSQL에서 일어나는 일입니다.

셀프호스팅 환경에서는 이 PostgreSQL을 직접 관리해야 하므로, **PostgreSQL의 동작 원리를 이해하는 것이 필수**입니다.

### 2. PostgreSQL의 기본 구조 — 계층적 모델

PostgreSQL의 데이터는 다음 순서로 정리됩니다:

```
PostgreSQL 서버
├── Database (데이터베이스) — 독립적인 공간
│   ├── Schema (스키마) — 테이블을 그룹화하는 네임스페이스
│   │   └── Table (테이블) — 실제 데이터
│   │       ├── Column (컬럼) — 데이터 필드
│   │       └── Row (행) — 데이터 레코드
│   ├── Index — 빠른 검색을 위한 구조
│   └── Function — 재사용 가능한 로직
└── Extension — 추가 기능 (JSON, UUID, Full-Text Search 등)
```

**FE 비유:**
- **Database** = 프로젝트 폴더
- **Schema** = 기능별 폴더 (components/, utils/, pages/ 같은 개념)
- **Table** = JSON 배열처럼 구조화된 데이터 모음

### 3. Supabase의 기본 스키마 구조

Supabase를 초기화하면 PostgreSQL에 자동으로 여러 스키마가 생성됩니다:

| 스키마 | 목적 | 예시 |
|--------|------|------|
| `public` | 당신이 만든 테이블 (기본값) | users, posts, products 등 |
| `auth` | 사용자 인증 정보 관리 | Supabase Auth가 관리 |
| `storage` | 파일 저장소의 메타데이터 | bucket info, file metadata |
| `extensions` | 추가 기능들 | UUID, JSON 처리 등 |
| `realtime` | 실시간 동기화 관련 | 웹소켓 기반 구독 정보 |

당신이 주로 작업하는 곳은 **`public` 스키마**입니다. 여기에 테이블을 만들고, 데이터를 저장하고, 조회합니다.

```
당신의 코드:
import { supabase } from './client'
const { data } = await supabase.from('users').select()
                ↓
실제 동작:
PostgreSQL public 스키마의 users 테이블에서 SELECT
```

### 4. Supabase가 PostgreSQL에 추가한 것들

PostgreSQL은 강력하지만 날것 그대로는 사용하기 어렵습니다. Supabase는 다음을 추가했습니다:

#### 4.1 RLS (Row Level Security)
테이블 행 단위의 접근 제어입니다.

```sql
-- 예: 자신의 게시물만 볼 수 있게
CREATE POLICY "Users can only view their own posts"
  ON posts
  FOR SELECT
  USING (auth.uid() = user_id);
```

**FE 비유:** React 컴포넌트의 권한 검사처럼, 쿼리 실행 시점에 "이 사용자가 이 데이터에 접근 가능한가?"를 확인합니다.

#### 4.2 Auth Schema & JWT
사용자 인증 정보는 `auth` 스키마에 저장되고, JWT 토큰으로 권한을 검증합니다.

#### 4.3 Real-time Extensions
PostgreSQL의 변경사항을 웹소켓을 통해 클라이언트에 즉시 전달합니다.

```javascript
// 이게 가능한 이유: Supabase가 Postgres의 변경을 감지하는 트리거 추가
supabase
  .from('messages')
  .on('*', payload => console.log('New message:', payload))
  .subscribe()
```

#### 4.4 Extensions (확장 기능)
PostgreSQL의 기본 기능을 확장합니다:

- `uuid-ossp` — UUID 자동 생성
- `pgcrypto` — 암호화
- `pg_trgm` — 전문 검색
- `pgjwt` — JWT 검증

### 5. 왜 PostgreSQL을 직접 다뤄야 하는가?

Supabase 대시보드의 GUI는 편하지만, 이것만으로는 부족한 상황들이 있습니다:

1. **복잡한 마이그레이션**: 대량의 데이터 변환이 필요할 때
2. **직접 트리거/함수 작성**: 자동화된 로직이 필요할 때
3. **성능 최적화**: 인덱스 분석, 쿼리 최적화가 필요할 때
4. **문제 진단**: 데이터 일관성 문제나 성능 저하의 원인을 찾을 때
5. **셀프호스팅 운영**: 컨테이너 환경에서 데이터베이스 백업, 복구, 업그레이드

즉, **Supabase 대시보드는 기초 작업용, PostgreSQL CLI(psql)는 고급 작업용**입니다.

### 6. Phase 5에서 배울 순서

이 문서 이후로는 이런 흐름을 따릅니다:

1. **psql 접속 방법** — Docker 컨테이너의 PostgreSQL에 연결
2. **데이터베이스 조사** — 현재 구조 파악 (`\dt`, `\ds`, `SELECT` 등)
3. **기본 SQL 작업** — 테이블 생성, 데이터 CRUD
4. **고급 기능** — 함수, 트리거, RLS 정책
5. **성능 최적화** — 인덱스, 쿼리 분석
6. **백업 & 복구** — 데이터 안전성 확보

---

## 핵심 정리

- **PostgreSQL은 Supabase의 중심**: localStorage가 브라우저 데이터의 중심이듯, PostgreSQL은 서버의 모든 데이터를 저장합니다.
- **계층 구조**: Database → Schema → Table → Column/Row로 이루어지며, Supabase는 `public`, `auth`, `storage` 등 여러 기본 스키마를 자동으로 생성합니다.
- **Supabase의 추가 가치**: RLS, Auth, Real-time, Extensions로 PostgreSQL을 더 쉽고 강하게 만들었습니다.
- **왜 직접 다루는가**: GUI로는 못 하는 복잡한 작업과 운영 작업을 위해 PostgreSQL 명령어를 알아야 합니다.

---

## 다음 파일 예고

다음 파일에서는 실제로 Docker 컨테이너 내 PostgreSQL에 **psql을 사용해 접속하고 기본 명령어를 실행**해봅니다. 당신의 데이터가 정말로 여기에 저장되어 있음을 직접 확인하게 됩니다.
