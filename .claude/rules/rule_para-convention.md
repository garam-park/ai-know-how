# PARA 상세 컨벤션

이 파일은 필요할 때 참조하는 상세 규칙 문서다.
핵심 규칙은 `.claude/CLAUDE.md`를 우선 참조하라.

---

## Prefix 세트

### Projects/

| Prefix   | 용도                       |
| -------- | -------------------------- |
| `build_` | 제작 중인 것 (코드 + 문서) |
| `learn_` | 학습 중 (실습 코드 + 노트) |
| `cert_`  | 자격증 준비                |
| `read_`  | 책/강의 정리               |
| `plan_`  | 기획/설계 단계             |
| `fix_`   | 문제 해결, 트러블슈팅      |

### Areas/

| Prefix     | 용도                    |
| ---------- | ----------------------- |
| `work_`    | 직무 관련 지속 관리     |
| `manage_`  | 운영 중인 서비스/시스템 |
| `health_`  | 건강, 루틴 등 개인 영역 |
| `finance_` | 재무 관리               |

### Resources/

| Prefix      | 용도                |
| ----------- | ------------------- |
| `ref_`      | 참고 자료, 레퍼런스 |
| `note_`     | 완료된 학습 노트    |
| `snippet_`  | 재사용 코드 조각    |
| `template_` | 템플릿              |

### 규칙

- DO: 위에 정의된 prefix만 사용
- DO NOT: 이 파일을 업데이트하지 않고 새 prefix 임의 생성
- DO: 새 prefix가 필요하면 사용자에게 먼저 확인

---

## 프로젝트 내부 구조 (통합 워크스페이스)

문서와 코드를 한 프로젝트 안에서 함께 관리한다.

````
Projects/build_example-project/
├── README.md          # 프로젝트 개요, 목표, 현재 상태
├── CLAUDE.md          # 이 프로젝트 전용 AI 지시사항
├── docs/
│   ├── plan.md        # 기획 노트
│   ├── research.md    # 조사 및 리서치
│   └── decisions.md   # 기술 선택 이유 (ADR)
└── src/               # 소스 코드
```

### 규칙
- DO: 새 프로젝트 시작 시 반드시 `README.md` 생성
- DO: 기술적 결정 사항은 `docs/decisions.md`에 기록
- DO: 프로젝트별 AI 지시사항은 `CLAUDE.md`에 작성
- DO NOT: `src/` 외부에 소스 코드 배치
- DO NOT: 루트 레벨에서 문서와 소스 코드 혼용
- DO NOT: PARA 루트 하위 2단계를 초과하는 디렉토리 생성

---

## 프로젝트별 CLAUDE.md 템플릿

```markdown
# [프로젝트명]

## 기술 스택
- 사용 중인 기술 목록

## 규칙
- 이 프로젝트 전용 DO / DO NOT 지시사항

## DO NOT
- 이 프로젝트에서 AI가 절대 하면 안 되는 것
```

---

## docs/decisions.md 형식 (ADR)

```markdown
## [결정 제목]
- Date: YYYY-MM-DD
- Status: accepted | deprecated | superseded

### 배경
이 결정이 필요했던 이유.

### 결정 내용
무엇을 결정했는가.

### 결과
트레이드오프 및 영향.
```

---

## 라이프사이클

```
Projects/learn_X    →  (완료 시)          →  Resources/note_X
Resources/note_X    →  (더 이상 안 볼 때)  →  Archive/note_X
Projects/build_X    →  (완료 시)          →  Archive/build_X
```

### 규칙
- DO: 완료된 Projects는 Resources 또는 Archive로 이동
- DO NOT: 완료된 프로젝트 삭제 — 반드시 Archive로 이동
- DO: Archive 이동 전 `README.md`에 완료 날짜 기록

---

## 새 파일/디렉토리 생성 시 절차

1. `.claude/CLAUDE.md` 네이밍 규칙 확인
2. 올바른 PARA 카테고리 결정
3. 이 문서의 Prefix 세트에서 적절한 prefix 선택
4. 새 프로젝트면 `README.md` 함께 생성
5. 불확실하면 진행 전 사용자에게 확인
````
