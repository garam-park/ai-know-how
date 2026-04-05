# 06-E-17: Supabase 버전 확인 & 업그레이드 전략

| 속성 | 내용 |
|------|------|
| **번호** | 06-E-17 |
| **제목** | Supabase 버전 확인 & 업그레이드 전략 |
| **유형** | 개념 (15분) |
| **이전** | [06-D-16: 디스크/메모리 경보 규칙 설정](../D-모니터링-알림/) |
| **다음** | [06-E-18: docker compose pull & rolling update 실습](./06-E-18-docker-compose-rolling-update.md) |

---

## 학습 목표

- Supabase 버전을 확인하고 이해하기
- Release cycle과 changelog 읽기
- Major vs Minor vs Patch 업데이트 판단하기
- npm 패키지 업데이트와의 유사점 파악하기
- 안전한 업그레이드 체크리스트 작성하기

---

## FE 개발자를 위한 유추

npm 패키지 업데이트를 생각해보세요. React 18.0 → 18.2로 업데이트할 때처럼:

- **Patch (18.2.1 → 18.2.3)**: 버그 수정, 안전하게 업데이트 가능 (React Critical Fix)
- **Minor (18.1 → 18.2)**: 새 기능 추가, 하위 호환성 유지, 테스트 후 업데이트
- **Major (17 → 18)**: 대규모 변경, Breaking Changes 있음, 꼼꼼한 준비 필요

Supabase도 동일합니다. 자동 업데이트가 없으므로 **직접 관리**해야 합니다.

---

## 핵심 개념

### 1. Supabase 버전 체계

Supabase는 **의미 있는 버전 관리(Semantic Versioning)**를 따릅니다:

```
버전 형식: MAJOR.MINOR.PATCH
예: 1.45.3
  - 1: Major (대규모 변경)
  - 45: Minor (새 기능)
  - 3: Patch (버그 수정)
```

**각 구성 요소의 의미:**

| 버전 타입 | 변경 내용 | 업그레이드 난이도 | 빈도 | 예시 |
|-----------|---------|-----------------|------|------|
| **Major** | DB 스키마 변경, API 변경, 마이그레이션 필요 | 높음 | 분기별 | 1.0 → 2.0 |
| **Minor** | 새 기능, 성능 개선 | 중간 | 월별 | 1.45 → 1.46 |
| **Patch** | 버그 수정, 보안 업데이트 | 낮음 | 주별 | 1.45.2 → 1.45.3 |

---

### 2. Release Cycle 이해하기

**Supabase의 공식 릴리스 주기:**

- **Stable**: 프로덕션 환경에서 안정적으로 실행된 버전 (권장)
- **Latest**: 최신 기능이 포함된 버전 (테스트용)
- **LTS (Long-Term Support)**: 확장된 보안 지원 (중요한 프로덕션은 이것 사용)

**실제 업데이트 전략:**

```
프로덕션 환경
├─ Stable 버전 사용 (안정성 우선)
├─ 월 1회 Minor/Patch 검토
└─ Major는 분기별 계획과 함께

개발/스테이징 환경
├─ Latest 버전 테스트 (새 기능 체험)
└─ 차기 프로덕션 버전 사전 검증
```

---

### 3. 현재 버전 확인 방법

**Self-hosted Supabase에서 버전 확인:**

```bash
# docker-compose.yml이 있는 디렉토리에서
cat docker-compose.yml | grep -E "image:|version:"

# 또는 특정 서비스의 이미지 태그 확인
grep "supabase/postgres" docker-compose.yml
grep "supabase/realtime" docker-compose.yml
```

**실행 중인 컨테이너에서 버전 확인:**

```bash
# 각 서비스의 정확한 버전 확인
docker exec supabase-postgres postgres --version
docker logs supabase-api 2>&1 | grep -i version | head -5
```

**Changelog 확인 위치:**

1. **GitHub Releases**: https://github.com/supabase/supabase/releases
2. **공식 문서**: https://supabase.com/docs/guides/self-hosting/releases
3. **Release Notes**: 각 버전별 새로운 기능, 수정 사항, Breaking Changes 기록

---

### 4. Changelog 읽는 법

**Release Notes 템플릿:**

```
[Supabase v1.45.0] (2025-12-01)

🎉 New Features
- PostgreSQL 16 지원 추가
- Real-time 성능 50% 개선

🐛 Bug Fixes
- 대용량 파일 업로드 시 타임아웃 수정
- JWT 만료 시간 계산 오류 수정

⚠️ Breaking Changes
- Deprecated: auth.users.metadata 필드
  → 대신 auth.users.raw_user_meta_data 사용
- API v1 지원 종료 (v1 → v2 마이그레이션 필요)

📚 Migration Guide
- https://supabase.com/docs/guides/v1-to-v2-migration
```

**Changelog 확인 체크리스트:**

```
[ ] Breaking Changes 섹션 읽기
[ ] 프로젝트에서 사용하는 기능과 연관성 확인
[ ] Migration Guide 필요한지 판단
[ ] 보안 업데이트 포함 여부 확인
[ ] 이전 버전의 알려진 버그 수정 여부 확인
```

---

### 5. 업그레이드 판단 기준

**즉시 업그레이드 (24시간 내):**

```
✅ Patch 업데이트 (보안 패치)
✅ Major 보안 취약점 수정
✅ 프로덕션 환경의 심각한 버그 수정
```

**계획된 업그레이드 (주간):**

```
📅 Minor 업데이트 (새 기능, 성능 개선)
📅 Breaking Changes 없는 업데이트
📅 스테이징에서 충분히 테스트된 버전
```

**신중한 업그레이드 (분기별):**

```
⚠️ Major 업데이트
⚠️ Breaking Changes 포함
⚠️ 데이터베이스 마이그레이션 필요
⚠️ API 변경 포함
```

**업그레이드 지연:**

```
❌ 알려진 회귀 버그 (regression bug)
❌ 프로덕션에서 Critical 이슈 미해결
❌ 필수 의존 라이브러리 미업데이트
❌ LTS → Latest 급진적 점프
```

---

### 6. 백업 전 확인 체크리스트

**업그레이드 24시간 전:**

```bash
# 1️⃣ 최근 백업 확인
ls -lh /backup/supabase*.sql | tail -3

# 2️⃣ 데이터베이스 건강 상태 확인
docker exec supabase-postgres pg_isready
# 응답: accepting connections

# 3️⃣ 모니터링 시스템 정상 작동 확인
curl -s http://localhost:3001/api/health | jq .

# 4️⃣ 현재 로그 크기 확인 (백업 직후 로그 초기화 필수)
docker logs supabase-api --timestamps 2>&1 | wc -l

# 5️⃣ 디스크 여유 공간 확인 (업그레이드 중 필요)
df -h / | tail -1

# 6️⃣ 모든 서비스 정상 작동 확인
docker ps --filter "label=service=supabase" \
  --format "table {{.Names}}\t{{.Status}}"
```

**출력 예시 (정상):**

```
NAME                              STATUS
supabase-postgres                 Up 45 days
supabase-api                      Up 45 days
supabase-realtime                 Up 45 days
supabase-storage                  Up 45 days
supabase-vector                   Up 45 days
```

---

### 7. npm 패키지 업데이트와의 차이점

| 비교 항목 | npm 패키지 | Supabase (Self-hosted) |
|---------|-----------|----------------------|
| **업데이트 방식** | `npm update`, `npm install` | `docker-compose pull`, `docker-compose up` |
| **자동 업데이트** | `npm outdated` 명령으로 확인 | 수동 모니터링 필요 |
| **테스트 환경** | 로컬 dev 서버 | 스테이징 서버 필수 |
| **롤백** | `git revert`, `npm install 이전버전` | 이전 이미지 태그 사용 |
| **영향 범위** | 애플리케이션만 | 전체 인프라 (DB, API, Real-time) |
| **다운타임** | 거의 없음 (HMR) | 계획된 다운타임 필요 (또는 rolling update) |
| **Breaking Changes** | 직접 코드 수정 | 마이그레이션 스크립트 + 코드 수정 |

---

### 8. 업그레이드 계획 템플릿

**월간 검토 (매달 1일):**

```
[ ] GitHub Releases 방문 → 새 버전 확인
[ ] Changelog 읽기 → Breaking Changes 파악
[ ] 현재 버전과 비교 → 필요성 판단
[ ] 팀 회의 → 업그레이드 일정 결정
```

**업그레이드 실행 1주일 전:**

```
[ ] 스테이징 환경에서 테스트 시작
[ ] 모든 주요 기능 테스트 (Auth, API, Real-time)
[ ] 성능 벤치마크 수집
[ ] 롤백 계획 수립
```

**업그레이드 실행 당일:**

```
[ ] 팀에 공지 (Slack, Email)
[ ] 전체 백업 실행
[ ] 서비스 내리기 (또는 유지하고 rolling update)
[ ] 이미지 업데이트
[ ] 헬스 체크
[ ] 모니터링 강화 (1시간)
[ ] 롤백 준비 유지 (24시간)
```

---

## 핵심 요약

| 항목 | 내용 |
|------|------|
| **버전 체계** | Semantic Versioning (MAJOR.MINOR.PATCH) 사용 |
| **Patch** | 즉시 업그레이드, 안전함 |
| **Minor** | 계획 후 업그레이드, 테스트 필요 |
| **Major** | 신중한 계획, 마이그레이션 가이드 필수 |
| **Changelog** | GitHub Releases와 공식 문서에서 확인 |
| **백업** | 모든 업그레이드 전 필수 |
| **테스트** | 스테이징 환경에서 우선 실행 |
| **npm 차이점** | 전체 인프라 영향, 더 신중한 계획 필요 |

---

## 다음 단계

다음 파일 [06-E-18: docker compose pull & rolling update 실습](./06-E-18-docker-compose-rolling-update.md)에서는:

- 실제로 `docker-compose pull` 명령 실행하기
- 무중단 업데이트 (rolling update) 수행하기
- 각 서비스의 헬스 체크하기
- 롤백 시나리오 준비하기

**연습 문제:**

1. 현재 Supabase 버전을 확인하고, 최신 Stable 버전과 비교하세요
2. 최신 Changelog를 읽고 Breaking Changes를 정리하세요
3. "6개월 동안 업그레이드하지 않았다면" 어떤 점을 먼저 확인해야 할까요?
