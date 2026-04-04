# PARA Naming Convention

## 기본 규칙

- 카테고리 구분: `_` (underscore)
- 인지 단위 구분: `-` (hyphen)
- 전체 소문자 (ASCII only, git 안전)
- 약어는 대문자 허용 (예: `SQLD`, `IELTS`)

```
[category]_[subject-detail]

예) learn_airflow-core
    cert_SQLD-prep
    build_portfolio-site
```

---

## Prefix 세트

### Projects — 완료 시점이 있는 작업

| Prefix   | 용도                       |
| -------- | -------------------------- |
| `build_` | 제작 중인 것 (코드 + 문서) |
| `learn_` | 학습 중 (실습 코드 + 노트) |
| `cert_`  | 자격증 준비                |
| `read_`  | 책/강의 정리               |
| `plan_`  | 기획/설계 단계             |
| `fix_`   | 문제 해결, 트러블슈팅      |

### Areas — 지속적으로 유지되는 영역

| Prefix     | 용도                    |
| ---------- | ----------------------- |
| `work_`    | 직무 관련 지속 관리     |
| `manage_`  | 운영 중인 서비스/시스템 |
| `health_`  | 건강, 루틴 등 개인 영역 |
| `finance_` | 재무 관리               |

### Resources — 완료 후 참고용

| Prefix      | 용도                |
| ----------- | ------------------- |
| `ref_`      | 참고 자료, 레퍼런스 |
| `note_`     | 완료된 학습 노트    |
| `snippet_`  | 재사용 코드 조각    |
| `template_` | 템플릿              |

---

## 디렉토리 구조 예시

```
Projects/
├── build_portfolio-site/
├── build_airflow-pipeline/
├── learn_python-advanced/
├── learn_airflow-core/
├── cert_SQLD-prep/
└── read_clean-code/

Areas/
├── work_backend-maintenance/
└── manage_homelab-server/

Resources/
├── ref_sql-cheatsheet/
├── note_python-basics/
└── snippet_bash-utils/

Archive/
└── learn_python-basics/     # 완료 후 이동
```

---

## 프로젝트 내부 구조 (통합 워크스페이스)

```
Projects/build_portfolio-site/
├── README.md            # 프로젝트 개요
├── CLAUDE.md            # AI 지시사항 (스택, 스타일, 규칙)
├── docs/
│   ├── plan.md          # 기획
│   ├── research.md      # 조사 내용
│   └── decisions.md     # 기술 선택 이유 (ADR)
└── src/                 # 실제 코드
```

---

## 라이프사이클

```
Projects/learn_airflow-core     # 학습 중
        ↓ 완료
Resources/note_airflow-core     # 참고용 보관
        ↓ 더 이상 안 봄
Archive/note_airflow-core       # 아카이브
```

---

## 체크리스트

- [ ] 카테고리는 정해진 prefix 세트만 사용
- [ ] 인지단위는 소문자 + hyphen
- [ ] 약어는 대문자 허용 (SQLD, AWS 등)
- [ ] 한글 사용 금지 (git 호환성)
- [ ] 디렉토리 깊이는 최대 2단계
- [ ] 프로젝트 내 `CLAUDE.md` 로 AI 컨텍스트 유지
- [ ] 완료된 Projects는 Resources 또는 Archive로 이동
