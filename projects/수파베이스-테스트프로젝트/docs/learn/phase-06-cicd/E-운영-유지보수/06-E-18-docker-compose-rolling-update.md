# 06-E-18: docker compose pull & rolling update 실습

| 속성 | 내용 |
|------|------|
| **번호** | 06-E-18 |
| **제목** | docker compose pull & rolling update 실습 |
| **유형** | 실습 (30분) |
| **이전** | [06-E-17: Supabase 버전 확인 & 업그레이드 전략](./06-E-17-supabase-버전-업그레이드.md) |
| **다음** | [06-E-19: 장애 대응 런북(Runbook) 템플릿 작성](./06-E-19-장애대응-런북.md) |

---

## 학습 목표

- `docker-compose pull`로 최신 이미지 다운로드하기
- 무중단 업데이트(rolling update) 실행하기
- 업데이트 중 각 서비스의 헬스 체크하기
- 마이그레이션 처리하기 (필요시)
- 롤백 전략 준비하기

---

## FE 개발자를 위한 유추

`npm update` 후 앱이 충돌하면 `npm install` 이전 버전으로 해결하던 경험이 있나요?

Supabase도 비슷합니다:

```javascript
// npm의 경우
npm install react@17.0.0  // 롤백

// Supabase의 경우
docker-compose pull postgres:15.1  // 특정 태그로 롤백
docker-compose up -d
```

차이점은 **데이터베이스를 다루므로 더 신중해야 한다**는 것입니다.

---

## 핵심 개념

### 1. 이미지 태그(Tag) 이해하기

Docker 이미지는 **태그**로 버전을 관리합니다:

```
supabase/postgres:15.1
                   ↑ 태그
```

**주요 태그 규칙:**

```
latest        → 최신 개발 버전 (불안정할 수 있음)
15.1          → 안정 버전 (권장)
15.1-rc1      → 릴리스 후보 (테스트용)
15.1-alpine   → 경량 버전 (모바일)
main          → 개발 중인 최신 코드
```

**docker-compose.yml 예시:**

```yaml
services:
  postgres:
    image: supabase/postgres:15.1  # ← 안정 버전 권장
    # image: supabase/postgres:latest  # ← 피하기 (언제 바뀔지 모름)

  api:
    image: supabase/postgres:15.1
    # 이미지 업데이트 시 이 태그들을 새로운 버전으로 변경
```

---

### 2. docker-compose pull 실행

**사전 확인:**

```bash
# 현재 위치 확인 (docker-compose.yml이 있는 곳)
pwd
# 출력: /opt/supabase

ls docker-compose.yml
# 출력: docker-compose.yml

# 현재 실행 중인 서비스 확인
docker-compose ps
```

**이미지 업데이트 전 현재 상태 기록:**

```bash
# 현재 실행 중인 이미지 저장 (롤백용)
docker-compose images > /backup/images-before-upgrade.txt
cat /backup/images-before-upgrade.txt
```

**출력 예시:**

```
REPOSITORY                          TAG     IMAGE ID      SIZE
supabase/postgres                   15.0    a1b2c3d4e5    500MB
supabase/rest-api                   1.44.0  f6g7h8i9j0    200MB
supabase/realtime                   2.23.1  k1l2m3n4o5    150MB
supabase/storage-api                1.8.2   p6q7r8s9t0    180MB
supabase/vector                     0.2.1   u1v2w3x4y5    100MB
```

**최신 이미지 다운로드:**

```bash
# 모든 서비스의 이미지 다운로드 (docker-compose.yml에 지정된 태그들)
docker-compose pull

# 출력:
# Pulling postgres      ... done
# Pulling api           ... done
# Pulling realtime      ... done
# [... 모든 서비스 ...]
```

**다운로드 진행 상황 모니터링:**

```bash
# 다운로드 용량 확인 (실시간)
docker system df

# 출력:
# Images          5           3          1.2GB       500MB
# Containers      5           3          0          0B
# Volumes         8           8          5.3GB      0B
```

---

### 3. Rolling Update 실행

**무중단 업데이트 방식 선택:**

```bash
# 옵션 1: 전체 서비스 재시작 (권장 - 마이그레이션 필요시)
docker-compose up -d

# 옵션 2: 특정 서비스만 재시작 (최소 영향)
docker-compose up -d postgres
docker-compose up -d rest-api
docker-compose up -d realtime

# 옵션 3: 실시간 모니터링 (문제 즉시 감지)
docker-compose up -d && docker-compose logs -f
```

**선택 가이드:**

| 상황 | 방식 | 이유 |
|------|------|------|
| Patch 업데이트 | 전체 재시작 | 마이그레이션 불필요, 빠름 |
| Minor 업데이트 | 특정 서비스 | API만 변경되면 API만 재시작 |
| Major 업데이트 | 전체 + 마이그레이션 | DB 스키마 변경 필요 |
| 심각한 버그 | 즉시 전체 | 롤백 위험도 낮음 |

---

### 4. 단계별 실습: 완전한 Rolling Update

**Step 1: 사전 점검 (5분)**

```bash
# 1-1. 현재 버전 기록
echo "=== Before Upgrade ===" > /tmp/upgrade-log.txt
docker-compose ps >> /tmp/upgrade-log.txt
docker-compose images >> /tmp/upgrade-log.txt

# 1-2. 디스크 여유 공간 확인
df -h / | tee -a /tmp/upgrade-log.txt
# 최소 2GB 필요

# 1-3. 모든 컨테이너 정상 작동 확인
docker-compose ps | grep "Up"
# 모든 컨테이너가 "Up" 상태여야 함

# 1-4. 모니터링 시스템 준비
# Uptime Kuma나 Grafana 열어두기
# → http://모니터링-서버/dashboard
```

**Step 2: 백업 실행 (10분) - 필수**

```bash
# 데이터베이스 전체 백업 (혹시 모를 상황 대비)
docker exec supabase-postgres pg_dump \
  -U postgres -d postgres \
  --format=custom \
  > /backup/supabase-before-upgrade-$(date +%Y%m%d-%H%M%S).sql.gz

# 확인
ls -lh /backup/supabase-before-upgrade-*.sql.gz | tail -1
```

**Step 3: 이미지 다운로드 (5분)**

```bash
# docker-compose.yml이 있는 디렉토리로 이동
cd /opt/supabase

# 이미지 다운로드 (인터넷 상태에 따라 5-15분 소요)
docker-compose pull

# 각 이미지 크기 확인
docker-compose images
```

**Step 4: 서비스 재시작 (rolling update)**

```bash
# 옵션 A: 한 번에 모든 서비스 업데이트 (권장)
docker-compose up -d

# 옵션 B: 서비스별로 순차 업데이트 (더 안전)
# 각 서비스 재시작 사이 10-15초 대기

docker-compose up -d postgres
sleep 10

docker-compose up -d api
sleep 10

docker-compose up -d realtime
sleep 10

docker-compose up -d storage
sleep 10

docker-compose up -d vector
```

**수행 중 로그 확인:**

```bash
# 별도 터미널에서 실시간 로그 모니터링
docker-compose logs -f --tail=50

# 특정 서비스만 모니터링
docker-compose logs -f postgres
```

**Step 5: 헬스 체크 (5분)**

```bash
# 5-1. 모든 컨테이너 상태 확인
docker-compose ps

# 예상 출력:
# NAME                    STATUS
# supabase-postgres       Up 15 seconds
# supabase-api            Up 12 seconds
# supabase-realtime       Up 8 seconds
# supabase-storage        Up 3 seconds

# 5-2. 각 서비스 헬스 체크 스크립트
cat << 'EOF' > /tmp/health-check.sh
#!/bin/bash

echo "=== Health Check After Upgrade ==="
echo ""

# PostgreSQL
echo "1. PostgreSQL..."
docker exec supabase-postgres pg_isready -U postgres
echo ""

# REST API
echo "2. REST API..."
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8000/health || echo "FAILED"
echo ""

# Realtime
echo "3. Realtime..."
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8001/status || echo "FAILED"
echo ""

# Storage
echo "4. Storage API..."
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:5000/status || echo "FAILED"
echo ""

# Vector (pgvector 확장)
echo "5. Vector..."
docker exec supabase-postgres psql -U postgres -c "SELECT version();" || echo "FAILED"
echo ""

echo "=== Upgrade Successful! ==="
EOF

chmod +x /tmp/health-check.sh
bash /tmp/health-check.sh
```

**예상 출력 (정상):**

```
=== Health Check After Upgrade ===

1. PostgreSQL...
accepting connections

2. REST API...
HTTP 200

3. Realtime...
HTTP 200

4. Storage API...
HTTP 200

5. Vector...
 PostgreSQL 15.1 on x86_64-pc-linux-gnu, ...

=== Upgrade Successful! ===
```

**Step 6: 애플리케이션 테스트 (5분)**

```bash
# FE 앱에서 테스트 (또는 Postman/curl)

# 6-1. Auth 테스트
curl -X POST http://localhost:8000/auth/v1/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# 6-2. API 테스트
curl http://localhost:8000/rest/v1/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 6-3. Real-time 테스트 (WebSocket)
# 클라이언트에서 supabase.from('table').on('*', ...).subscribe()
```

---

### 5. 마이그레이션 처리

**Major 업데이트 시 필요한 경우:**

```bash
# 마이그레이션이 필요한 경우 (changelog에 명시됨)

# 1. 데이터베이스 마이그레이션 스크립트 실행
docker exec supabase-postgres psql -U postgres < /opt/supabase/migrations/v1.45-to-v1.46.sql

# 2. 마이그레이션 상태 확인
docker exec supabase-postgres psql -U postgres \
  -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;"

# 3. 오류 발생 시 로그 확인
docker logs supabase-postgres | grep -i error | tail -20
```

---

### 6. 롤백 전략

**긴급 롤백 (업그레이드 후 문제 발생):**

```bash
# 옵션 A: 이전 이미지 태그로 즉시 복구
# (docker-compose.yml을 이전 버전으로 변경)

# 현재 docker-compose.yml 백업
cp docker-compose.yml docker-compose.yml.backup-1.46

# git에서 이전 버전 복구
git checkout HEAD~1 docker-compose.yml
# 또는 수동으로 이미지 태그 변경
# 예: postgres:15.1 → postgres:15.0

# 서비스 재시작 (이전 이미지로)
docker-compose pull
docker-compose up -d

# 롤백 완료 확인
docker-compose ps
```

**롤백 체크리스트:**

```bash
# 롤백 후 같은 헬스 체크 실행
bash /tmp/health-check.sh

# 데이터 무결성 확인
docker exec supabase-postgres psql -U postgres \
  -c "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM posts;"

# 모니터링 대시보드에서 에러율 확인
# → Grafana: http://모니터링-서버/dashboard
```

---

### 7. 무중단 업데이트를 위한 고급 기법

**Kubernetes 또는 Docker Swarm 환경 (선택사항):**

```bash
# Docker Swarm 환경에서 rolling update
# (true zero-downtime update)

docker service update --image supabase/postgres:15.1 supabase_postgres

# 상태 모니터링
watch -n 1 'docker service ps supabase_postgres'
```

**로드 밸런서 사용 시:**

```
Client
  ↓
Caddy (Load Balancer)
  ├─ API Instance 1 (Old)
  ├─ API Instance 2 (New) ← 업데이트 중
  └─ API Instance 3 (Old)

트래픽 자동 분산 → 다운타임 없음
```

---

## 핵심 요약

| 단계 | 작업 | 예상 시간 | 명령어 |
|------|------|---------|--------|
| 1 | 사전 점검 | 5분 | `docker-compose ps` |
| 2 | 백업 | 10분 | `pg_dump` |
| 3 | 이미지 다운로드 | 5-15분 | `docker-compose pull` |
| 4 | 서비스 재시작 | 5분 | `docker-compose up -d` |
| 5 | 헬스 체크 | 5분 | `pg_isready`, `curl` |
| 6 | 앱 테스트 | 5분 | 실제 요청 테스트 |
| **총 소요 시간** | | **35-50분** | |

**롤백 대기 시간:** 24시간 (문제 발견 시 즉시 실행)

---

## 다음 단계

다음 파일 [06-E-19: 장애 대응 런북 템플릿](./06-E-19-장애대응-런북.md)에서는:

- 업그레이드 중 발생 가능한 장애 대응
- 각 장애별 디버깅 방법
- 팀과 공유할 수 있는 런북 템플릿
- Post-mortem 작성법

**연습 문제:**

1. 스테이징 환경에서 한 번 전체 롤링 업데이트를 직접 실행해보세요
2. 업그레이드 전후 `/tmp/health-check.sh`를 실행하고 결과를 비교하세요
3. 롤백이 필요한 상황을 시뮬레이션하고 실제 롤백을 수행해보세요
