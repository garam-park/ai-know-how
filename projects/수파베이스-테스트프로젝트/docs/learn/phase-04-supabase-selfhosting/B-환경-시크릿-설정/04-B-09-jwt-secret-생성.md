# 04-B-09 JWT Secret 생성 및 설정

> 유형: 실습 | 예상 소요 시간: 15~20분
> 이전: .env 파일 필수 변수 목록 정리 | 다음: ANON key / SERVICE key 생성

---

## 이 파일에서 하는 것

JWT Secret을 생성하여 `.env` 파일에 설정합니다. JWT Secret은 Supabase의 모든 인증 토큰을 암호화하는 비밀키로, 안전한 토큰 발급과 검증이 가능하도록 합니다.

---

## 사전 조건

- `.env` 파일이 `/sessions/ecstatic-relaxed-wozniak/mnt/claude-code-know-how/projects/수파베이스-테스트프로젝트/docker` 디렉토리에 생성되어 있어야 합니다.
- `openssl` 명령어를 사용할 수 있는 터미널 환경이 필요합니다. (macOS, Linux는 기본 내장, Windows는 WSL 또는 Git Bash 사용)

---

## JWT Secret이 무엇인가요? (FE 개발자 관점)

**비유: NextAuth의 NEXTAUTH_SECRET과 같은 역할**

Next.js에서 NextAuth를 사용할 때, `NEXTAUTH_SECRET` 환경변수가 필요합니다. 이것이 세션 쿠키를 암호화하는 비밀키입니다.

Supabase의 **JWT Secret**도 동일한 역할을 합니다:
- 회원가입/로그인 후 발급되는 JWT 토큰을 암호화합니다
- 클라이언트가 보낸 토큰이 위변조되지 않았는지 검증합니다
- 이 비밀키가 노출되면, 공격자가 위조된 토큰을 만들어 권한 없이 API에 접근할 수 있습니다

### 어떤 서비스들이 이 Secret을 사용하나요?

```
┌────────────────────────────────────────────────────────┐
│              Supabase 내 서비스들                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  GoTrue (인증 서비스)                                   │
│  → JWT 토큰을 발급할 때 이 Secret으로 암호화            │
│                                                        │
│  Kong (API 라우터)                                      │
│  → 모든 REST API 요청에 포함된 JWT 토큰을 검증          │
│     (이 Secret을 사용해서 토큰이 유효한지 확인)         │
│                                                        │
│  PostgREST (REST API)                                  │
│  → 요청의 JWT 토큰에서 사용자 정보를 추출              │
│     (Row Level Security에 사용)                        │
│                                                        │
│  Realtime (WebSocket)                                  │
│  → WebSocket 연결 시 JWT 토큰을 검증                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**중요:** 모든 서비스가 동일한 Secret을 사용해야 합니다. 하나의 서비스만 다른 Secret을 쓰면 토큰 검증이 실패합니다.

---

## 실습

### Step 1. 안전한 JWT Secret 생성하기

`openssl` 명령어로 암호학적으로 안전한 랜덤 문자열을 생성합니다.

```bash
openssl rand -base64 32
```

**실행 결과 예시:**
```
T3Hk8bLqP2vN9xZmW5cRjY1oFdE7gQaS/kLjUvI+xM4=
```

> **설명:** 이 명령어는 32바이트의 랜덤 데이터를 base64로 인코딩합니다. base64 형식이 나머지 환경변수와 호환성이 좋고 보안상 충분합니다.

### Step 2. 생성한 Secret 확인하기

터미널에서 복사한 값을 메모장이나 텍스트 에디터에 임시로 붙여넣습니다. (이 값을 잠시 가지고 있어야 합니다)

```bash
# 생성한 Secret 값:
T3Hk8bLqP2vN9xZmW5cRjY1oFdE7gQaS/kLjUvI+xM4=
```

> **팁:** 터미널에서 직접 환경변수로 저장하려면 다음 명령어를 사용할 수도 있습니다:
> ```bash
> JWT_SECRET=$(openssl rand -base64 32)
> echo $JWT_SECRET
> ```
> 이렇게 하면 터미널 변수 `$JWT_SECRET`에 저장되며, 이후 단계에서 참조할 수 있습니다.

### Step 3. .env 파일에 설정하기

`.env` 파일을 텍스트 에디터로 엽니다.

```bash
# 파일 경로
/sessions/ecstatic-relaxed-wozniak/mnt/claude-code-know-how/projects/수파베이스-테스트프로젝트/docker/.env
```

다음 라인을 추가하거나 기존 라인이 있다면 수정합니다:

```env
JWT_SECRET=T3Hk8bLqP2vN9xZmW5cRjY1oFdE7gQaS/kLjUvI+xM4=
```

> **주의:** 실제 값을 Step 1에서 생성한 값으로 바꿔야 합니다. 위의 예시는 샘플입니다.

**예시 .env 파일 (전체 구조):**
```env
# PostgreSQL 설정
POSTGRES_HOST=postgres
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password

# JWT Secret (방금 생성한 값)
JWT_SECRET=T3Hk8bLqP2vN9xZmW5cRjY1oFdE7gQaS/kLjUvI+xM4=

# 기타 필수 변수들...
SITE_URL=http://localhost:3000
API_EXTERNAL_URL=http://localhost:8000
```

### Step 4. 파일 저장하기

`.env` 파일을 저장합니다.

> **경고:** `.env` 파일은 **절대 Git에 커밋하면 안 됩니다**. `.gitignore`에 이 파일을 추가하세요.
> ```
> # .gitignore에 추가
> docker/.env
> .env
> ```

### Step 5. JWT Secret 길이 및 형식 검증하기 (선택사항)

생성한 Secret이 권장 기준을 충족하는지 확인합니다.

```bash
# 터미널에서 다음 명령어로 길이를 확인할 수 있습니다
echo "T3Hk8bLqP2vN9xZmW5cRjY1oFdE7gQaS/kLjUvI+xM4=" | wc -c
```

**결과:** 약 44-48 글자 (base64로 인코딩된 32바이트)

> **권장사항:**
> - **최소 길이:** 32자 이상 (32바이트를 base64로 인코딩하면 약 44자)
> - **형식:** base64 또는 HEX 형식 권장
> - **특수문자 포함:** `/`, `+`, `=` 등이 포함되어도 괜찮습니다 (base64 표준)

---

## 확인 방법

### 방법 1. .env 파일 내용 확인

```bash
cat /sessions/ecstatic-relaxed-wozniak/mnt/claude-code-know-how/projects/수파베이스-테스트프로젝트/docker/.env | grep JWT_SECRET
```

**예상 결과:**
```
JWT_SECRET=T3Hk8bLqP2vN9xZmW5cRjY1oFdE7gQaS/kLjUvI+xM4=
```

### 방법 2. docker-compose 시작 후 GoTrue 로그 확인

이후 단계에서 `docker compose up`으로 Supabase를 시작한 후, GoTrue 서비스가 정상 시작되는지 로그를 확인합니다.

```bash
docker compose logs auth | grep "initialized"
```

**정상 메시지 (예시):**
```
auth_1  | [info] Server listening on port 9999
```

### 방법 3. 수동으로 JWT 생성 후 검증 (고급)

Docker 컨테이너가 실행 중이면, GoTrue 내부에서 JWT가 정상 생성/검증되는지 확인할 수 있습니다. 이는 다음 실습 단계에서 수행합니다.

---

## 자주 겪는 오류

| 오류 메시지 | 원인 | 해결 |
|---|---|---|
| `Error: invalid token` | JWT Secret이 `.env`에 설정되지 않음 | `.env` 파일에 `JWT_SECRET` 라인이 있는지 확인하고, `docker compose restart`로 재시작 |
| `JWTVerificationFailed` 또는 `Unauthorized` | docker-compose를 시작한 후 JWT Secret을 변경함 | 컨테이너들이 이미 로드한 환경변수는 파일 변경으로 업데이트되지 않음. `docker compose down` 후 `.env` 수정, 다시 `docker compose up` |
| `openssl: command not found` | `openssl`이 설치되지 않음 | **macOS/Linux:** 일반적으로 기본 내장. 터미널 재시작 후 재시도 / **Windows:** WSL 또는 Git Bash 사용 / 또는 온라인 random 생성기 사용 (보안상 자체 서버에서 생성 권장) |
| `JWT_SECRET` 값에 공백이 포함됨 | 복사-붙여넣기 과정에서 앞뒤 공백이 추가됨 | `.env`에서 `JWT_SECRET=값앞뒤공백없음` 형식으로 수정. 양 끝에 공백이 없어야 함 |
| 여러 환경(개발, 스테이징)에서 다른 Secret 사용 | 각 환경마다 별도 `.env` 파일 또는 `.env.{환경}` 파일 생성 | 각 환경의 docker-compose에서 올바른 `.env` 파일을 로드하는지 확인. (docker-compose.yml의 `env_file:` 설정) |

---

## 다음 파일 예고

이제 JWT Secret을 이용해 ANON key와 SERVICE key를 생성합니다. ANON key는 클라이언트에서 공개적으로 사용할 수 있는 키이고, SERVICE key는 서버-투-서버 통신에서만 사용하는 비밀키입니다.
