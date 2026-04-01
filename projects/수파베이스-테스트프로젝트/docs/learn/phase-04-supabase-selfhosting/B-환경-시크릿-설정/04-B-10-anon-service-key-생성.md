# 04-B-10 ANON key / SERVICE_ROLE key 생성

> 유형: 실습 | 예상 소요 시간: 15~20분
> 이전: JWT Secret 생성 및 설정 | 다음: 나머지 시크릿 설정 (Postgres 비밀번호 등)

---

## 이 파일에서 하는 것

Supabase 클라이언트와 서버 간 통신을 위한 두 가지 JWT 토큰 키를 생성합니다. ANON key는 프론트엔드에서 사용하는 공개 키이고, SERVICE_ROLE key는 백엔드에서만 사용하는 비밀 키입니다.

---

## 사전 조건

- 이전 단계에서 `JWT_SECRET` 환경변수 설정이 완료된 상태
- `jwt.io` 웹사이트 접근 또는 JWT 생성 CLI 도구 설치

---

## 실습

### Step 1. ANON key와 SERVICE_ROLE key 이해하기

ANON key와 SERVICE_ROLE key는 모두 JWT(JSON Web Token) 형태의 토큰입니다. 차이점은 다음과 같습니다.

| 속성 | ANON key | SERVICE_ROLE key |
|---|---|---|
| **사용처** | 프론트엔드 (클라이언트) | 백엔드 (서버) |
| **RLS 적용** | O (Row Level Security 적용됨) | X (RLS 우회) |
| **공개 여부** | 공개 (프론트엔드 코드에 노출되어도 안전) | 비밀 (서버에만 보관) |
| **역할** | 일반 사용자 권한 | 관리자 권한 |

**FE 비유:** ANON key는 공개 API key (누구나 알아도 되는), SERVICE_ROLE key는 secret API key (서버만 알아야 하는) 같은 개념입니다.

### Step 2. JWT_SECRET 환경변수 확인

먼저 이전 단계에서 설정한 `JWT_SECRET`을 확인합니다.

```bash
echo $JWT_SECRET
```

> 32자 이상의 랜덤 문자열이 출력되어야 합니다. 예: `your-super-secret-jwt-secret-key-here-32-chars-or-more`

### Step 3. jwt.io에서 ANON key 생성하기

#### 3-1. jwt.io 접속
`https://jwt.io` 에 접속합니다.

#### 3-2. Payload 설정 (ANON key용)

jwt.io의 "Payload" 섹션에 다음 JSON을 입력합니다.

```json
{
  "iss": "https://your-supabase-instance.com",
  "sub": "authenticated",
  "aud": "authenticated",
  "role": "authenticated",
  "exp": 2524608000,
  "iat": 1711929600
}
```

**각 필드 설명:**
- `iss` (issuer): 토큰 발급자. Supabase 인스턴스 URL로 설정합니다.
- `sub` (subject): 토큰 주체. `authenticated`는 인증된 사용자를 의미합니다.
- `aud` (audience): 토큰 대상. `authenticated`로 설정합니다.
- `role`: 사용자 역할. `authenticated`는 일반 사용자입니다.
- `exp` (expiration): 토큰 만료 시간 (Unix timestamp). 2050년 이후로 설정하면 장기간 유효합니다.
- `iat` (issued at): 토큰 발급 시간 (Unix timestamp).

#### 3-3. Secret 설정

jwt.io 오른쪽 하단의 "Secret" 필드에 이전 단계에서 설정한 `JWT_SECRET` 값을 붙여넣습니다.

```
your-super-secret-jwt-secret-key-here-32-chars-or-more
```

#### 3-4. Encoded 토큰 복사

좌측 "Encoded" 섹션에 생성된 JWT 토큰을 전체 복사합니다. 이것이 **ANON key**입니다.

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3lvdXItc3VwYWJhc2UtaW5zdGFuY2UuY29tIiwic3ViIjoiYXV0aGVudGljYXRlZCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImV4cCI6MjUyNDYwODAwMCwiaWF0IjoxMjM0NTY3ODkwfQ.SIGNATURE_HERE
```

### Step 4. jwt.io에서 SERVICE_ROLE key 생성하기

#### 4-1. Payload 수정 (SERVICE_ROLE key용)

Payload를 다음과 같이 수정합니다.

```json
{
  "iss": "https://your-supabase-instance.com",
  "sub": "service_role",
  "aud": "authenticated",
  "role": "service_role",
  "exp": 2524608000,
  "iat": 1711929600
}
```

**변경 사항:**
- `sub`: `service_role`로 변경
- `role`: `service_role`로 변경

> 나머지 필드와 Secret은 동일하게 유지합니다.

#### 4-2. Encoded 토큰 복사

좌측 "Encoded" 섹션에서 생성된 JWT 토큰을 전체 복사합니다. 이것이 **SERVICE_ROLE key**입니다.

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3lvdXItc3VwYWJhc2UtaW5zdGFuY2UuY29tIiwic3ViIjoic2VydmljZV9yb2xlIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJleHAiOjI1MjQ2MDgwMDAsImlhdCI6MTIzNDU2Nzg5MH0.SIGNATURE_HERE
```

### Step 5. .env 파일에 키 설정하기

생성한 두 키를 `.env` 파일에 추가합니다.

```bash
cat >> .env << 'EOF'
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3lvdXItc3VwYWJhc2UtaW5zdGFuY2UuY29tIiwic3ViIjoiYXV0aGVudGljYXRlZCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImV4cCI6MjUyNDYwODAwMCwiaWF0IjoxMjM0NTY3ODkwfQ.SIGNATURE_HERE
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3lvdXItc3VwYWJhc2UtaW5zdGFuY2UuY29tIiwic3ViIjoic2VydmljZV9yb2xlIiwiYXVkIjoiYXV0aGVudGljYXRlZCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJleHAiOjI1MjQ2MDgwMDAsImlhdCI6MTIzNDU2Nzg5MH0.SIGNATURE_HERE
EOF
```

> 반드시 위의 예시 토큰이 아닌, Step 3과 Step 4에서 실제로 생성한 토큰을 입력해야 합니다.

### Step 6. 환경변수 확인

```bash
source .env
echo "ANON_KEY: $ANON_KEY"
echo "SERVICE_ROLE_KEY: $SERVICE_ROLE_KEY"
```

> 두 개의 JWT 토큰이 정상 출력되면 성공입니다.

---

## 확인 방법

### 1. 환경변수 로드 확인
```bash
grep -E "^(ANON_KEY|SERVICE_ROLE_KEY)" .env
```
> 두 개의 키가 출력되어야 합니다.

### 2. JWT 토큰 유효성 확인
jwt.io에서 생성한 토큰을 Encoded 필드에 붙여넣고, Secret이 일치하면 "Signature Verified"라는 메시지가 보입니다.

### 3. Docker 컨테이너에서 접근 확인
```bash
docker exec supabase_auth env | grep -E "^(ANON_KEY|SERVICE_ROLE_KEY)"
```
> Supabase가 실행 중이면 환경변수가 출력됩니다.

---

## 자주 겪는 오류

| 오류 메시지 | 원인 | 해결 |
|---|---|---|
| `Signature Verification Failed` on jwt.io | jwt.io의 Secret이 JWT_SECRET과 불일치 | jwt.io의 Secret 필드에 정확한 JWT_SECRET 값을 다시 입력 |
| ANON key로 쿼리 시 `401 Unauthorized` | Payload의 `role` 필드가 `authenticated`가 아님 | Payload를 다시 확인하여 `role: "authenticated"` 설정 |
| SERVICE_ROLE key로 쿼리 시 `403 Forbidden` | Payload의 `role` 필드가 `service_role`이 아님 | Payload를 다시 확인하여 `role: "service_role"` 설정 |
| 토큰이 너무 길어서 복사 실패 | 단순 UI 문제 | jwt.io의 Encoded 영역을 우클릭 > "모두 선택"으로 복사 |
| 환경변수가 로드되지 않음 | `source .env` 명령 미실행 또는 .env 파일 경로 오류 | 현재 디렉토리에 .env 파일이 있는지 확인 후 `source .env` 재실행 |

---

## 다음 파일 예고

다음 단계에서는 Postgres 데이터베이스 비밀번호, Postgres URI, 그 외 필요한 시크릿들을 .env 파일에 설정합니다.
