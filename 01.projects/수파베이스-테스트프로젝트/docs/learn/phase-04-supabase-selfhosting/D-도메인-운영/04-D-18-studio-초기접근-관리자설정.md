# 04-D-18 Studio 초기 접근 & 관리자 설정

> 유형: 실습 | 예상 소요 시간: 30~40분
> 이전: 도메인 연결 & 자동 SSL 확인 | 다음: 포트 & 방화벽(ufw) 최종 정리

---

## 이 파일에서 하는 것

Supabase Studio(관리자 UI)에 처음 접속하고, 실제 테이블을 생성하거나 쿼리를 실행해봅니다. FE 개발자가 Firebase Console에 처음 접속하는 것과 같은 경험입니다. 이번 실습에서는 다음을 배웁니다:

- Studio 로그인 및 대시보드 둘러보기
- Table Editor로 테이블 생성
- SQL Editor에서 SELECT 쿼리 실행
- API 문서 자동 생성 확인
- Studio 보안 설정 재확인 (Basic Auth, IP 제한)
- 자주 겪는 오류 진단

---

## 사전 조건

- 04-C-16 Caddyfile 작성 완료
- 도메인이 서버 IP로 연결됨 (04-D-17 완료)
- Supabase 컨테이너 모두 정상 실행 중 (`docker compose ps` 확인)
- 브라우저에서 https://studio.your-domain.com 접속 가능
- Studio 초기 로그인 정보 준비 (DASHBOARD_USERNAME, DASHBOARD_PASSWORD from .env)

---

## 실습

### Step 1. Studio URL로 접속

웹 브라우저에서 Studio에 접속합니다. (04-C-16에서 설정한 도메인)

```
https://studio.your-domain.com
```

> `your-domain.com` 부분을 실제 도메인으로 변경하세요. 예: `studio.mycompany.com`

**예상:**
- Studio 로그인 페이지가 표시됨
- 이메일과 비밀번호 입력 폼이 보임
- 페이지 좌측에 Supabase 로고 표시

**만약 접속되지 않으면:**
- DNS 반영 대기 (최대 24시간, 보통 5~10분)
- Caddy 상태 확인: `sudo systemctl status caddy`
- SSL 인증서 확인: `curl -v https://studio.your-domain.com`

---

### Step 2. 로그인

04-C-13에서 .env에 설정한 DASHBOARD_USERNAME과 DASHBOARD_PASSWORD를 입력합니다.

```
이메일 (username): your-email@example.com  # DASHBOARD_USERNAME
비밀번호: your-password                     # DASHBOARD_PASSWORD
```

> 이 정보는 시스템 초기 로그인용이며, 실제 프로덕션에서는 나중에 변경하는 것을 권장합니다.

**로그인 버튼 클릭 후 예상:**
- 로그인 프로세스 진행 (3~5초)
- Studio 대시보드가 표시됨
- 좌측 사이드바에 메뉴 항목들이 보임

---

### Step 3. Studio 첫 화면 둘러보기

Studio 대시보드의 주요 섹션을 확인합니다. FE 개발자라면 Firebase Console과 비교하면 쉽습니다.

#### 좌측 사이드바 메뉴

| 메뉴 항목 | 설명 | FE 비유 |
|---------|------|--------|
| **Project** | 프로젝트 정보, 설정 | Firebase 프로젝트 설정 |
| **Table Editor** | 테이블 CRUD, 데이터 보기 | Firestore 콘솔의 데이터 뷰 |
| **SQL Editor** | SQL 쿼리 직접 실행 | 데이터베이스 관리 도구 |
| **Auth** | 사용자 인증, 역할 관리 | Firebase Authentication |
| **Storage** | 파일 업로드, 관리 | Firebase Storage |
| **Realtime** | 실시간 구독 설정 | Firebase Realtime Database |
| **Vector** | 벡터 검색 설정 | 하이브리드 검색 기능 |
| **Logs** | 쿼리, API 로그 | 서버 로그 뷰어 |
| **Database** | 데이터베이스 전체 구조 | 스키마 관리 도구 |

---

### Step 4. Table Editor 살펴보기

Table Editor 메뉴를 클릭합니다.

```
좌측 메뉴 > Table Editor
```

**예상 화면:**
- 현재 테이블 목록 (초기 상태라면 'auth' 관련 테이블들만 존재)
- "New Table" 버튼
- 검색 필터

> 'public.users', 'public.audit_log_entries' 등은 Supabase 내부용 시스템 테이블입니다. 무시해도 됩니다.

---

### Step 5. 간단한 테이블 만들어보기

FE의 useState를 만드는 것처럼, 간단한 테이블을 생성합니다.

#### Step 5.1. "New Table" 클릭

```
Table Editor > New Table 버튼
```

**입력 폼:**
- **Table Name**: `articles` (소문자, 영문)
- **Description**: (선택사항) "Blog articles"
- **Enable Realtime**: 체크 (실시간 데이터 동기화)
- **Enable RLS (Row Level Security)**: 체크 (권장)

#### Step 5.2. 컬럼 추가

테이블을 생성한 후, 컬럼을 추가합니다.

```
Column Name     | Type         | Default Value | Nullable | Notes
------------------------------------------------------------------
id              | uuid         | gen_random_uuid() | No   | Primary Key
title           | text         | -             | No       | 기사 제목
slug            | text         | -             | Yes      | URL-friendly 이름
content         | text         | -             | Yes      | 기사 내용
author_id       | uuid         | -             | Yes      | 작성자 ID
published       | boolean      | false         | No       | 공개 여부
created_at      | timestamp    | now()         | No       | 생성 시간
updated_at      | timestamp    | now()         | No       | 수정 시간
```

**클릭하여 추가:**

1. Table Editor에서 `articles` 테이블을 선택
2. "+" 버튼 또는 "Add Column" 클릭
3. 각 컬럼 정보 입력 후 저장

> 마우스로 클릭하거나, 위의 정보를 참고해 SQL로도 입력 가능합니다.

**완료 기준:**
- `articles` 테이블이 Table Editor 목록에 보임
- 컬럼 7개가 모두 생성됨

---

### Step 6. 샘플 데이터 삽입

Table Editor에서 직접 데이터를 입력합니다.

#### Step 6.1. Insert Row

```
Table Editor > articles 선택 > Insert Row 버튼
```

**입력값 예시:**

| 필드 | 값 |
|-----|-----|
| title | "Getting Started with Supabase" |
| slug | "getting-started-supabase" |
| content | "This is a test article about Supabase self-hosting." |
| author_id | (비워두기 — NULL 허용) |
| published | `true` (체크박스) |

> `id`, `created_at`, `updated_at`은 자동으로 생성되므로 입력하지 않습니다.

#### Step 6.2. 데이터 확인

삽입 후 Table Editor의 `articles` 탭에 새 행이 보이는지 확인합니다.

**예상:**
```
id                                  | title                           | slug                      | published | created_at
f8d4c2a1-e5f7-4b2c-9e1a-3d6f8c2a... | Getting Started with Supabase | getting-started-supabase | true      | 2026-04-01T...
```

---

### Step 7. SQL Editor에서 SELECT 쿼리 실행

이제 SQL로 데이터를 조회합니다. FE 개발에서 `fetch('/api/articles')`를 호출하는 것과 같습니다.

#### Step 7.1. SQL Editor 열기

```
좌측 메뉴 > SQL Editor
```

#### Step 7.2. 쿼리 작성

새 쿼리를 만들고 다음을 입력합니다.

```sql
SELECT id, title, slug, published, created_at
FROM public.articles
WHERE published = true
ORDER BY created_at DESC;
```

#### Step 7.3. 쿼리 실행

```
Run 버튼 (또는 Ctrl+Enter)
```

**예상 결과:**
```
id                                  | title                           | slug                      | published | created_at
--------------------------------------------------
f8d4c2a1-e5f7-4b2c-9e1a-3d6f8c2a... | Getting Started with Supabase | getting-started-supabase | true      | 2026-04-01T12:34:56.000Z
```

> 만약 `SELECT 1` 같은 간단한 쿼리를 먼저 실행하면, 데이터베이스 연결을 확인할 수 있습니다.

---

### Step 8. API 자동 생성 확인

Supabase의 핵심 기능: PostgREST가 테이블에서 자동으로 REST API를 생성합니다.

#### Step 8.1. API 문서 보기

Studio에서:

```
좌측 메뉴 > Project > API > API Docs
```

또는 브라우저에서 직접 접속:

```
https://studio.your-domain.com/api/docs
```

#### Step 8.2. API 확인

API 목록에서 `articles` 테이블이 보이는지 확인합니다.

**자동 생성된 엔드포인트:**

```
GET    /rest/v1/articles
POST   /rest/v1/articles
PATCH  /rest/v1/articles
DELETE /rest/v1/articles
```

> FE 개발자라면, Swagger UI 형태의 API 문서가 자동으로 생성되는 것에 놀라움을 느낄 것입니다. 이는 PostgREST가 PostgreSQL 스키마를 분석해 자동으로 만드는 것입니다.

#### Step 8.3. 실제 API 호출 테스트 (선택사항)

API 문서에서 "Try it out" 버튼을 클릭하여 실제로 호출할 수 있습니다.

**GET /rest/v1/articles 예시:**

```bash
# 터미널에서 직접 호출
curl -s \
  -H "apikey: YOUR_ANON_KEY" \
  "https://api.your-domain.com/rest/v1/articles?published=eq.true" | jq
```

> `YOUR_ANON_KEY`는 04-B-10에서 생성한 익명 사용자 키입니다.

예상 응답:
```json
[
  {
    "id": "f8d4c2a1-e5f7-4b2c-9e1a-3d6f8c2a...",
    "title": "Getting Started with Supabase",
    "slug": "getting-started-supabase",
    "published": true,
    "created_at": "2026-04-01T12:34:56.000Z"
  }
]
```

---

### Step 9. Auth(인증) 메뉴 탐색

Studio의 Auth 섹션을 확인합니다.

```
좌측 메뉴 > Auth > Users
```

**표시 내용:**
- 현재 가입된 사용자 목록
- 각 사용자의 이메일, 가입 날짜, 마지막 로그인
- 수동으로 사용자 추가/삭제 기능

> 초기 상태에서는 관리자 계정(DASHBOARD_USERNAME)만 있을 수 있습니다. 나중에 클라이언트 앱에서 `supabase.auth.signUp()`을 호출하면 여기에 표시됩니다.

---

### Step 10. Storage 메뉴 탐색

파일 업로드 기능을 확인합니다.

```
좌측 메뉴 > Storage
```

**기본 구조:**
- 여러 버킷(폴더 개념) 생성 가능
- 각 버킷은 액세스 권한(public/private) 설정 가능
- 파일 업로드, 다운로드, 삭제 관리

> FE 비유: Firebase Storage의 버킷과 동일합니다.

**간단한 테스트:**

1. "New Bucket" 클릭
2. Bucket name: `test-files`
3. Public access 체크 (테스트용)
4. Create Bucket
5. 파일 업로드 또는 폴더 생성

---

### Step 11. Logs 확인

API 요청, 데이터베이스 쿼리의 로그를 봅니다.

```
좌측 메뉴 > Logs
```

**표시 내용:**
- SQL 쿼리 로그 (Step 7에서 실행한 SELECT 포함)
- API 요청 로그 (Step 8에서 호출한 REST API)
- 실행 시간, 상태 코드, 요청 크기 등

> 문제 해결 시 가장 먼저 확인할 항목입니다. "쿼리가 느리다"고 하면 여기서 실행 시간을 봅니다.

---

### Step 12. Studio 보안 재확인

### Step 12.1. Basic Auth 확인

Studio에 처음 접속할 때 Basic Auth(username:password 팝업)가 나타났나요?

**설정 확인:**

```bash
# Caddy 설정에서 Basic Auth 설정 확인
sudo cat /etc/caddy/Caddyfile | grep -A5 basicauth
```

예상 출력:
```
studio.your-domain.com {
  basicauth * {
    admin P@ssw0rd
  }
  reverse_proxy localhost:3000
}
```

> Basic Auth를 설정했다면, 도메인 접속 전 먼저 사용자명/비밀번호를 입력해야 합니다. (추가 보안 계층)

### Step 12.2. IP 제한 확인

특정 IP에서만 접속하도록 제한했는지 확인합니다.

**설정 확인:**

```bash
sudo cat /etc/caddy/Caddyfile | grep -A3 "@restricted"
```

예상 출력:
```
studio.your-domain.com {
  @restricted {
    not remote_ip 203.0.113.0/24
  }
  respond @restricted "Forbidden" 403
  reverse_proxy localhost:3000
}
```

> 이 설정이 있으면 특정 IP 범위만 접속 가능하므로, 다른 위치에서 접속할 때 오류가 발생할 수 있습니다.

---

## 자주 겪는 오류와 해결

### 오류 1: `ERR_SSL_VERSION_OR_CIPHER_MISMATCH` 또는 SSL 오류

**원인:** SSL 인증서가 유효하지 않거나 아직 발급되지 않음.

**확인:**

```bash
# SSL 인증서 상태 확인
sudo caddy list-certs
```

**해결:**

```bash
# Caddy 재시작 (SSL 인증서 자동 갱신)
sudo systemctl restart caddy

# 상태 확인
sudo systemctl status caddy
```

---

### 오류 2: `Connection refused` 또는 `502 Bad Gateway`

**원인:** Supabase 컨테이너가 실행되지 않거나, Kong/Studio 포트가 변경됨.

**확인:**

```bash
# Supabase 컨테이너 상태 확인
cd ~/supabase
docker compose ps
```

**해결:**

모든 컨테이너가 `healthy` 상태인지 확인합니다. 만약 Kong 또는 Studio가 `unhealthy`라면:

```bash
# 해당 컨테이너 재시작
docker compose restart kong studio

# 전체 재시작
docker compose down
docker compose up -d
```

---

### 오류 3: Studio 로그인 실패 (`401 Unauthorized`)

**원인:** DASHBOARD_USERNAME 또는 DASHBOARD_PASSWORD가 잘못됨.

**확인:**

```bash
# .env 파일에서 올바른 값 확인
cat ~/supabase/.env | grep DASHBOARD
```

예상 출력:
```
DASHBOARD_USERNAME=your-email@example.com
DASHBOARD_PASSWORD=your-secure-password
```

**해결:**

1. .env 파일의 값이 정확한지 다시 확인
2. 기본값으로 로그인 재시도
3. 여전히 실패하면 컨테이너 재시작

```bash
docker compose restart studio
```

---

### 오류 4: `Table or column "..." does not exist` (SQL 쿼리 실행 오류)

**원인:** 테이블 이름이나 스키마가 잘못됨.

**확인:**

```sql
-- SQL Editor에서 실행
SELECT * FROM information_schema.tables
WHERE table_schema = 'public';
```

이 쿼리로 생성된 테이블 목록을 확인할 수 있습니다.

**해결:**

- 테이블명이 정확한지 확인 (대소문자 구분)
- 테이블이 `public` 스키마에 있는지 확인
- Table Editor에서 테이블이 보이는지 다시 확인

---

### 오류 5: API 응답이 `[]` (빈 배열)

**원인:** 쿼리 필터가 맞지 않거나 데이터가 없음.

**확인:**

```bash
# 전체 데이터 조회
curl -s \
  -H "apikey: YOUR_ANON_KEY" \
  "https://api.your-domain.com/rest/v1/articles" | jq
```

**해결:**

1. Table Editor에서 직접 데이터 확인
2. 필터 조건 (WHERE 절) 제거하고 재시도
3. 데이터가 실제로 삽입되었는지 확인

---

### 오류 6: Basic Auth 팝업이 자꾸 뜸

**원인:** 브라우저에서 자격증명을 저장하지 않았거나, 인증 헤더가 누락됨.

**해결:**

```bash
# curl 테스트할 때 Basic Auth 포함
curl -u admin:password \
  -H "apikey: YOUR_ANON_KEY" \
  "https://studio.your-domain.com"
```

브라우저에서는 팝업에 사용자명/비밀번호를 입력하고 "Remember for this site" 체크.

---

### 오류 7: `Request timed out` 또는 느린 응답

**원인:** 데이터베이스 쿼리가 복잡하거나, 네트워크 지연.

**확인:**

Studio > Logs에서 쿼리 실행 시간 확인.

```bash
# 데이터베이스 성능 확인
docker compose logs postgres | tail -20
```

**해결:**

- SELECT 쿼리에서 불필요한 컬럼 제거
- WHERE 조건으로 데이터 필터링
- 인덱스 생성 (SQL Editor에서)

```sql
CREATE INDEX idx_articles_published ON public.articles(published);
```

---

## FE 개발자를 위한 팁

### Supabase Client 라이브러리와의 연결

Studio에서 테스트한 API는 FE에서 다음과 같이 호출합니다.

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://api.your-domain.com",
  "YOUR_ANON_KEY"
);

// Table Editor에서 생성한 articles 테이블 조회
const { data, error } = await supabase
  .from("articles")
  .select("*")
  .eq("published", true)
  .order("created_at", { ascending: false });
```

> 이 코드는 Studio의 SQL Editor에서 실행한 것과 동일합니다.

### API 응답 형식 확인

PostgREST가 생성한 API 응답은 항상 다음 형식입니다.

**성공 (200 OK):**
```json
[
  { "id": "...", "title": "...", "content": "..." },
  { "id": "...", "title": "...", "content": "..." }
]
```

**에러 (400, 401, 500 등):**
```json
{
  "message": "JWT expired",
  "code": "PGRST301",
  "details": null,
  "hint": null
}
```

---

## 다음 단계

다음 파일 (04-D-19)에서:

- 포트 & 방화벽(ufw) 설정으로 외부 접속 제한
- Kong과 Studio 포트 변경
- 보안 강화를 위한 추가 설정

---

## 핵심 정리

- **Studio 접속**: `https://studio.your-domain.com` (브라우저)
- **로그인**: DASHBOARD_USERNAME / DASHBOARD_PASSWORD (04-C-13의 .env)
- **Table Editor**: 테이블 생성, 데이터 CRUD (GUI)
- **SQL Editor**: SQL 쿼리 직접 실행 (터미널 느낌)
- **API 자동 생성**: PostgREST가 모든 테이블을 자동으로 REST API화
- **Auth**: 사용자 관리, 권한 설정
- **Storage**: 파일 업로드, 버킷 관리
- **Logs**: 쿼리/API 요청 기록, 문제 해결용
- **보안**: Basic Auth, IP 제한으로 접속 제어

---

## 다음 파일 예고

포트 & 방화벽(ufw) 최종 정리에서는:

- 불필요한 포트 차단 (ufw 설정)
- Kong과 Studio의 포트 변경
- 외부에서는 443(HTTPS)만 접근 가능하도록 제한
- 내부 접속 (localhost)만 허용하는 포트 설정
