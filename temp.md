# 워크스페이스 컨벤션

이 파일은 워크스페이스의 규칙을 정의한다.
모든 AI 에이전트(Claude Code, OpenCode 등)는 이 규칙을 항상 따라야 한다.

---

## 네이밍 컨벤션

### 규칙

````text
[category]_[subject-detail]
```text

### 문자 규칙
- DO: 소문자 ASCII만 사용
- DO: 카테고리 구분은 `_` 사용
- DO: 단어 구분은 `-` 사용
- DO: 약어는 대문자 허용 (예: `SQLD`, `AWS`, `API`)
- DO NOT: 파일/디렉토리명에 한글 또는 비ASCII 문자 사용
- DO NOT: 파일/디렉토리명에 공백 사용
- DO NOT: 디렉토리명에 `camelCase` 또는 `PascalCase` 사용

### 예시
```text
# 올바른 예
learn_airflow-core/
cert_SQLD-prep/
build_portfolio-site/
ref_sql-cheatsheet/

# 잘못된 예
Learn_Airflow/          # PascalCase 사용
airflow공부/             # 한글 사용
learn_airflow_core/     # 구분자 혼용
```text

---

## PARA 구조

### 개요
```text
Projects/    # 완료 시점이 있는 활성 작업
Areas/       # 종료 시점 없는 지속적 책임
Resources/   # 완료되었거나 참고용 자료
Archive/     # 비활성, 더 이상 사용하지 않는 것
```text

### 규칙
- DO NOT: 각 PARA 루트 하위에 2단계를 초과하는 디렉토리 생성
- DO NOT: 활성 작업을 Resources에 배치
- DO NOT: 참고 자료를 Projects에 배치

---

## Prefix 세트

### Projects/
| Prefix | 용도 |
|--------|------|
| `build_` | 제작 중인 것 (코드 + 문서) |
| `learn_` | 학습 중 (실습 코드 + 노트) |
| `cert_` | 자격증 준비 |
| `read_` | 책/강의 정리 |
| `plan_` | 기획/설계 단계 |
| `fix_` | 문제 해결, 트러블슈팅 |

### Areas/
| Prefix | 용도 |
|--------|------|
| `work_` | 직무 관련 지속 관리 |
| `manage_` | 운영 중인 서비스/시스템 |
| `health_` | 건강, 루틴 등 개인 영역 |
| `finance_` | 재무 관리 |

### Resources/
| Prefix | 용도 |
|--------|------|
| `ref_` | 참고 자료, 레퍼런스 |
| `note_` | 완료된 학습 노트 |
| `snippet_` | 재사용 코드 조각 |
| `template_` | 템플릿 |

### 규칙
- DO: 위에 정의된 prefix만 사용
- DO NOT: 이 파일을 업데이트하지 않고 새 prefix 임의 생성
- DO: 새 prefix 카테고리가 필요하면 사용자에게 먼저 확인

---

## 프로젝트 내부 구조

모든 프로젝트 디렉토리는 아래 구조를 따라야 한다:

```text
Projects/build_example-project/
├── README.md          # 프로젝트 개요, 목표, 현재 상태
├── CLAUDE.md          # 이 프로젝트 전용 AI 지시사항
├── docs/
│   ├── plan.md        # 기획 노트
│   ├── research.md    # 조사 및 리서치
│   └── decisions.md   # 기술 선택 이유 (ADR)
└── src/               # 소스 코드
```text

### 규칙
- DO: 새 프로젝트 시작 시 반드시 `README.md` 생성
- DO: 기술적 결정 사항은 `docs/decisions.md`에 기록
- DO: 프로젝트별 AI 지시사항은 `CLAUDE.md`에 작성
- DO NOT: `src/` 외부에 소스 코드 배치
- DO NOT: 루트 레벨에서 문서와 소스 코드 혼용

---

## 라이프사이클

```text
Projects/learn_X    →  (완료 시)          →  Resources/note_X
Resources/note_X    →  (더 이상 안 볼 때)  →  Archive/note_X
Projects/build_X    →  (완료 시)          →  Archive/build_X
```text

### 규칙
- DO: 완료된 Projects는 Resources 또는 Archive로 이동
- DO NOT: 완료된 프로젝트를 삭제 — 반드시 Archive로 이동
- DO: Archive로 이동 전 `README.md`에 완료 날짜 기록

---

## docs/decisions.md 형식

기술적 결정을 기록할 때 아래 형식을 사용한다:

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
```text

---

## CLAUDE.md (프로젝트별)

각 프로젝트의 `CLAUDE.md`는 반드시 아래 내용을 포함해야 한다:

```markdown
# [프로젝트명]

## 기술 스택
- 사용 중인 기술 목록

## 규칙
- 이 프로젝트 전용 DO / DO NOT 지시사항

## DO NOT
- 이 프로젝트에서 AI가 절대 하면 안 되는 것
```text

---

## 새 파일/디렉토리 생성 시 절차

1. 위의 네이밍 컨벤션 규칙 확인
2. 올바른 PARA 카테고리 결정 (Projects / Areas / Resources / Archive)
3. Prefix 세트에서 적절한 prefix 적용
4. 새 프로젝트 디렉토리 생성 시 `README.md` 함께 생성
5. 카테고리 또는 prefix가 불확실하면 진행 전 사용자에게 확인

---

## 모를 때

- DO: 사용자에게 확인
- DO NOT: 네이밍을 임의로 추측하거나 즉흥적으로 결정
- DO NOT: PARA 구조 외부에 새 최상위 디렉토리 생성
````
