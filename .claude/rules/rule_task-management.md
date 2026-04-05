# Task 관리 규칙

## 1. 작업 상태 (Status)

```
tasks/
├── backlog/         # 아직 시작하지 않은 작업
├── in-progress/     # 현재 진행 중인 작업
├── review-ready/    # 검토 대기 중인 작업
├── reviewed/        # 검토 완료된 작업
└── done/            # 완료된 작업
```

| 상태           | 설명           | 다음 상태                            |
| -------------- | -------------- | ------------------------------------ |
| `backlog`      | 대기 중인 작업 | `in-progress`                        |
| `in-progress`  | 작업 중        | `review-ready`                       |
| `review-ready` | 검토 요청됨    | `reviewed` 또는 `in-progress` (반려) |
| `reviewed`     | 검토 통과      | `done`                               |
| `done`         | 최종 완료      | —                                    |

### 상태 이동

```bash
mv tasks/backlog/feat-user-auth.md tasks/in-progress/
mv tasks/in-progress/feat-user-auth.md tasks/review-ready/
mv tasks/review-ready/feat-user-auth.md tasks/reviewed/    # 검토 통과
mv tasks/review-ready/feat-user-auth.md tasks/in-progress/ # 검토 반려
mv tasks/reviewed/feat-user-auth.md tasks/done/
```

---

## 2. 작업 유형 (Type)

파일명: `{type}-{short-description}.md`

| Type       | 용도           | 예시                       |
| ---------- | -------------- | -------------------------- |
| `feat`     | 신규 기능      | `feat-user-auth.md`        |
| `fix`      | 버그 수정      | `fix-login-bug.md`         |
| `refactor` | 리팩토링       | `refactor-api-response.md` |
| `docs`     | 문서 작업      | `docs-setup-guide.md`      |
| `chore`    | 기타 잡무      | `chore-update-deps.md`     |
| `spike`    | 조사/실험 작업 | `spike-db-comparison.md`   |

---

## 3. 우선순위 (Priority)

작업 파일 메타데이터에 `Priority` 필드로 표시.

| 레벨 | 의미 | 기준                                    |
| ---- | ---- | --------------------------------------- |
| `P0` | 긴급 | 즉시 처리 필요. 다른 작업 중단하고 우선 |
| `P1` | 높음 | 현재 스프린트 내 필수 완료              |
| `P2` | 보통 | 기본 우선순위. 백로그에서 순차 처리     |
| `P3` | 낮음 | 여유 있을 때 처리                       |

---

## 4. 작업 분해 (Breakdown)

작업은 다음 기준으로 분해한다.

- **1개 작업 = 2시간 ~ 1일** 범위
- 그 이상 소요되면 하위 작업으로 분할
- 의존성이 있는 작업은 별도 파일로 분리하고 `Related` 필드에 링크

---

## 5. 메타데이터 (Metadata)

모든 작업 파일은 다음 형식을 따른다.

```markdown
# {작업 제목}

- Status: backlog
- Priority: P2
- Type: feat
- Created: YYYY-MM-DD
- Updated: YYYY-MM-DD
- Assignee: {이름}
- Related: [관련 작업 링크]

## 개요

작업에 대한 간단한 설명

## 체크리스트

- [ ] TODO 1
- [ ] TODO 2
- [ ] TODO 3

## 참고 사항

- 관련 문서 링크
- 특이 사항
```

### 필드 규칙

| 필드       | 필수 | 설명                             |
| ---------- | ---- | -------------------------------- |
| `Status`   | 필수 | 현재 상태 디렉토리와 일치해야 함 |
| `Priority` | 필수 | P0 ~ P3                          |
| `Type`     | 필수 | 파일명 prefix와 일치해야 함      |
| `Created`  | 필수 | 최초 생성일                      |
| `Updated`  | 필수 | 마지막 수정일                    |
| `Assignee` | 선택 | 담당자                           |
| `Related`  | 선택 | 의존/관련 작업 링크              |

---

## 6. 리뷰 프로세스 (Review)

### 검토 기준

- [ ] 체크리스트의 모든 항목이 완료되었는가
- [ ] `Updated` 날짜가 최신인가
- [ ] 참고 사항에 필요한 링크/정보가 포함되었는가

### 검토 후 조치

- **통과**: `reviewed/`로 이동, Status를 `reviewed`로 변경
- **반려**: `in-progress/`로 이동, 파일에 반려 사유 기록

---

## 7. 로그 연동 (Logging)

작업 시작/완료 시 `logs/YYYY-MM-DD.md`에 기록한다.

```markdown
## 작업 기록

- {HH:MM} `tasks/in-progress/feat-user-auth.md` 작업 시작
- {HH:MM} `tasks/review-ready/feat-user-auth.md` 검토 요청
- {HH:MM} `tasks/done/feat-user-auth.md` 완료
```

### 규칙

- DO: 상태 변경 시 로그에 기록
- DO: 하루 단위 요약도 허용 (아침 계획 / 저녁 회고)
- DO NOT: 로그를 생략하고 작업만 완료

---

## 8. 보관 규칙 (Archive)

### done → Archive 이동

- **주기**: 월 1회 또는 프로젝트 종료 시
- **기준**: 완료 후 30일 이상 경과한 작업
- **방법**: `tasks/done/`에서 `Archive/tasks/`로 이동

### 규칙

- DO: Archive 이동 전 `README.md`에 완료 날짜 기록
- DO NOT: 완료된 작업 삭제 — 반드시 Archive로 이동
- DO: Archive 디렉토리는 연/월 기준으로 정리 권장

---

## 9. private vs project workspace 차이

| 항목        | private/PARA/Projects/ | workspaces/{project-name}/      |
| ----------- | ---------------------- | ------------------------------- |
| 공유        | 본인만                 | 팀원 선택적 공유                |
| granularity | 개인 학습/실험 단위    | 프로젝트 기능/이슈 단위         |
| 연동        | logs/ 와 선택적 연동   | logs/YYYY-MM-DD.md 와 연동 권장 |
