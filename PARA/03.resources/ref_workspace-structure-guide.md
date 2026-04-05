# 워크스페이스 구조 가이드

## 개요

이 문서는 개인 작업, PoC 실험, 프로젝트 납품을 아우르는
3계층 워크스페이스 구조를 정의한다.

```
private/        개인 작업, 실험, 프로젝트 준비
workspaces/     프로젝트별 통합 관리 (문서 + 코드)
repos/          실제 코드 (독립 git repo)
```

---

## 전체 디렉토리 구조

```
~/
├── private/                              # private workspace
│   ├── .claude/
│   │   ├── CLAUDE.md
│   │   └── rules/
│   │       └── para-convention.md
│   ├── .opencode/
│   │   └── opencode.json
│   ├── private.code-workspace
│   ├── inbox/                                # 위치가 애매한 문서. 위치를 정해지기 전까지 임시 보관
│   └── PARA/
│       ├── 01.projects/
│       │   ├── plan_jeju-smartcity/      # 프로젝트 준비 (문서만)
│       │   │   └── tasks/                # 작업 상태 관리 (칸반)
│       │   ├── learn_fastapi-core/       # 학습 (문서 + 실습)
│       │   │   └── tasks/                # 작업 상태 관리 (칸반)
│       │   └── build_poc-iot-sensor/     # PoC ──submodule──▶ repos/poc-iot-sensor
│       │       └── tasks/                # 작업 상태 관리 (칸반)
│       ├── 02.areas/
│       ├── 03.resources/
│       └── 04.archive/
│
├── workspaces/
│   └── {project-name}/                  # project workspace
│       ├── .claude/
│       │   ├── CLAUDE.md
│       │   └── rules/
│       ├── .opencode/
│       │   └── opencode.json
│       ├── {project-name}.code-workspace
│       ├── docs/
│       │   ├── inbox/                    # 위치가 애매한 문서. 위치를 정해지기 전까지 임시 보관
│       │   ├── planning/                 # 기획 문서
│       │   ├── audit/                    # 감리 문서
│       │   └── meetings/                 # 회의록
│       ├── tasks/                        # 작업 상태 관리 (칸반)
│       │   ├── backlog/
│       │   ├── in-progress/
│       │   ├── review-ready/             # 검토 대기
│       │   ├── reviewed/                 # 검토 완료
│       │   └── done/
│       ├── logs/                         # 작업 기록
│       │   └── YYYY-MM-DD.md
│       ├── frontend/    ──submodule──▶  repos/frontend # like repos/jeju-frontend
│       └── backend/     ──submodule──▶  repos/backend # like repos/jeju-backend
│
└── repos/                               # 독립 git repos
    ├── jeju-frontend/
    ├── jeju-backend/
    ├── poc-iot-sensor/
    ├── poc-llm-pipeline/
    └── shared-lib/
```

---

## 계층별 설명

### 1. private workspace

**목적:** 개인 작업, 일회성 실험, PoC, 프로젝트 준비

| 항목      | 설명                         |
| --------- | ---------------------------- |
| 공유 대상 | 본인만                       |
| git 구조  | 독립 repo + 필요시 submodule |
| PARA 적용 | 전체 적용                    |
| submodule | PoC, 실험 코드에 한해 사용   |

**PARA 사용 기준:**

```
Projects/plan_*     프로젝트 수주 전 준비 문서 (코드 없음)
Projects/learn_*    학습 중 (문서 + 실습 코드)
Projects/build_*    PoC, 실험 (문서 + submodule 코드)
Areas/              지속 관리 영역
Resources/          완료된 학습, 참고 자료
Archive/            종료된 것
```

---

### 2. project workspace

**목적:** 특정 프로젝트의 통합 관리 (문서 + 코드 + 작업 기록)

| 항목      | 설명                             |
| --------- | -------------------------------- |
| 공유 대상 | 팀, 고객 선택적 공유 가능        |
| git 구조  | 독립 repo + submodules           |
| submodule | 해당 프로젝트의 모든 서비스 repo |
| 문서      | 기획, 감리, 회의록 등 통합 관리  |

**내부 구조:**

```
project-name/
├── .claude/
│   └── CLAUDE.md        # 이 프로젝트 전용 AI 지시사항
├── .opencode/
│   └── opencode.json
├── project-name.code-workspace
├── docs/
│   ├── planning/        # 기획 문서
│   ├── audit/           # 감리 문서
│   └── meetings/        # 회의록
├── tasks/               # 작업 상태 관리 (칸반)
│   ├── backlog/         # 대기 중인 작업
│   ├── in-progress/     # 진행 중인 작업
│   ├── review-ready/     # 검토 대기
│   ├── reviewed/          # 검토 완료
│   └── done/            # 완료된 작업
├── logs/                # 날짜별 작업 기록
│   └── YYYY-MM-DD.md
├── frontend/            # submodule
└── backend/             # submodule
```

---

### 3. repos

**목적:** 실제 코드베이스. private / project workspace 양쪽에서 submodule로 참조됨

| repos/ 항목        | 소속                      | 공개 여부 | 수명          |
| ------------------ | ------------------------- | --------- | ------------- |
| `jeju-frontend`    | workspaces/jeju-smartcity | 팀 공유   | 프로젝트 기간 |
| `jeju-backend`     | workspaces/jeju-smartcity | 팀 공유   | 프로젝트 기간 |
| `poc-iot-sensor`   | private                   | 본인만    | 단명 가능     |
| `poc-llm-pipeline` | private                   | 본인만    | 단명 가능     |
| `shared-lib`       | 여러 곳                   | 선택적    | 장기          |

---

## VSCode .code-workspace 설정

### private.code-workspace

```json
{
  "folders": [
    {
      "name": "🔒 Private",
      "path": "."
    },
    {
      "name": "🧪 poc-iot-sensor",
      "path": "./PARA/Projects/build_poc-iot-sensor/poc-iot-sensor"
    }
  ],
  "settings": {
    "files.exclude": {
      "**/node_modules": true,
      "**/.git": true,
      "**/dist": true,
      "**/__pycache__": true
    }
  }
}
```

> PoC submodule이 추가될 때마다 `folders` 항목 추가

### jeju-smartcity.code-workspace

```json
{
  "folders": [
    {
      "name": "📁 jeju-smartcity",
      "path": "."
    },
    {
      "name": "🖥 frontend",
      "path": "./frontend"
    },
    {
      "name": "⚙️ backend",
      "path": "./backend"
    }
  ],
  "settings": {
    "files.exclude": {
      "**/node_modules": true,
      "**/.git": true,
      "**/dist": true
    }
  },
  "extensions": {
    "recommendations": ["eamodio.gitlens"]
  }
}
```

---

## Tasks 디렉토리 운영 (칸반식 작업 관리)

**목적:** 프로젝트별 작업을 상태 기반으로 추적하고 관리

### 구조

```
tasks/
├── backlog/         # 아직 시작하지 않은 작업
├── in-progress/     # 현재 진행 중인 작업
├── review-ready/    # 검토 대기 중인 작업
├── reviewed/        # 검토 완료된 작업
└── done/            # 완료된 작업
```

### 파일 네이밍 규칙

```
{type}-{short-description}.md

예) feat-user-auth.md
    fix-login-bug.md
    refactor-api-response.md
    docs-setup-guide.md
```

| Type       | 용도           |
| ---------- | -------------- |
| `feat`     | 신규 기능      |
| `fix`      | 버그 수정      |
| `refactor` | 리팩토링       |
| `docs`     | 문서 작업      |
| `chore`    | 기타 잡무      |
| `spike`    | 조사/실험 작업 |

### 작업 파일 형식

```markdown
# {작업 제목}

- Status: in-progress
- Created: YYYY-MM-DD
- Updated: YYYY-MM-DD
- Assignee: {이름}

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

### 작업 상태 이동

```bash
# backlog → in-progress
mv tasks/backlog/feat-user-auth.md tasks/in-progress/

# in-progress → review-ready
mv tasks/in-progress/feat-user-auth.md tasks/review-ready/

# review-ready → reviewed (검토 통과)
mv tasks/review-ready/feat-user-auth.md tasks/reviewed/

# review-ready → in-progress (검토 반려, 수정 필요)
mv tasks/review-ready/feat-user-auth.md tasks/in-progress/

# reviewed → done
mv tasks/reviewed/feat-user-auth.md tasks/done/
```

### private vs project workspace 차이

| 항목        | private/PARA/Projects/ | workspaces/{project-name}/      |
| ----------- | ---------------------- | ------------------------------- |
| 공유        | 본인만                 | 팀원 선택적 공유                |
| granularity | 개인 학습/실험 단위    | 프로젝트 기능/이슈 단위         |
| 연동        | logs/ 와 선택적 연동   | logs/YYYY-MM-DD.md 와 연동 권장 |

---

## Submodule 운영

### 신규 submodule 추가

```bash
# project workspace에 추가
cd workspaces/jeju-smartcity
git submodule add https://github.com/org/jeju-frontend frontend
git submodule add https://github.com/org/jeju-backend  backend
git commit -m "add submodules: frontend, backend"

# private workspace에 PoC 추가
cd private/PARA/Projects/build_poc-iot-sensor
git submodule add https://github.com/username/poc-iot-sensor poc-iot-sensor
git commit -m "add submodule: poc-iot-sensor"
```

### clone 후 초기화

```bash
git clone https://github.com/org/jeju-smartcity
cd jeju-smartcity
git submodule update --init --recursive
```

### submodule 최신화

```bash
# 특정 submodule 업데이트
git submodule update --remote frontend

# 전체 submodule 업데이트
git submodule update --remote --merge
```

---

## PoC 라이프사이클

### 1단계: PoC 시작

```bash
# repos/ 에 독립 repo 생성
cd ~/repos
mkdir poc-iot-sensor && cd poc-iot-sensor
git init && git commit --allow-empty -m "init"

# private workspace 에 submodule 추가
cd ~/private/PARA/Projects/build_poc-iot-sensor
git submodule add https://github.com/username/poc-iot-sensor poc-iot-sensor
```

### 2단계: 실험 중

```
private/PARA/Projects/build_poc-iot-sensor/
├── docs/           # 실험 기록, 결과 문서
└── poc-iot-sensor/ # 실험 코드 (submodule)
```

### 3-A단계: 성공 → 프로젝트 승격

```bash
# repo 이름 변경 (GitHub에서)
repos/poc-iot-sensor → repos/jeju-iot-sensor

# project workspace에 submodule 추가
cd ~/workspaces/jeju-smartcity
git submodule add https://github.com/org/jeju-iot-sensor iot-sensor

# private submodule 제거
cd ~/private
git submodule deinit PARA/Projects/build_poc-iot-sensor/poc-iot-sensor
git rm PARA/Projects/build_poc-iot-sensor/poc-iot-sensor

# PARA 항목 Archive로 이동
mv PARA/Projects/build_poc-iot-sensor PARA/Archive/
```

### 3-B단계: 실패 → Archive

```bash
# PARA 항목 Archive로 이동
cd ~/private
git submodule deinit PARA/Projects/build_poc-iot-sensor/poc-iot-sensor
git rm PARA/Projects/build_poc-iot-sensor/poc-iot-sensor
mv PARA/Projects/build_poc-iot-sensor PARA/Archive/

# repos/ 의 코드는 GitHub private repo로 보관 (삭제 금지)
```

---

## 납품 및 감리 버전 고정

```bash
# 1. 납품 시점 코드 상태 확인
cd workspaces/jeju-smartcity
git submodule status

# 2. 감리 문서 작성
# docs/audit/2025-Q1-감리보고서.md 작성

# 3. 해당 시점 submodule commit 고정
git add frontend backend docs/audit/
git commit -m "감리 2025-Q1: frontend v1.2.3, backend v2.0.1"

# 4. tag로 납품 버전 표시
git tag delivery/2025-Q1
git push origin delivery/2025-Q1
```

---

## AI 도구 컨텍스트 통합

### Claude Code

```bash
# project workspace에서 AI 작업 시
cd ~/workspaces/jeju-smartcity
claude  # .claude/CLAUDE.md 자동 로드 + submodule 코드 접근 가능

# private workspace에서 PoC 작업 시
cd ~/private
claude --add-dir PARA/Projects/build_poc-iot-sensor/poc-iot-sensor
```

### project workspace CLAUDE.md 예시

> 템플릿 정의는 `.claude/rules/rule_para-convention.md` 참조

```markdown
# jeju-smartcity

## 프로젝트 개요

제주 스마트시티 플랫폼. frontend(React) + backend(FastAPI) 구성.

## 기술 스택

- Frontend: React, TypeScript, Vite
- Backend: FastAPI, PostgreSQL
- Infra: Docker, Nginx

## 규칙

- DO: 감리 관련 변경 시 반드시 docs/audit/ 업데이트
- DO: 작업 기록은 logs/YYYY-MM-DD.md 에 추가
- DO NOT: frontend/, backend/ 에 직접 커밋 — 각 submodule repo에서 작업

## DO NOT

- .env 파일 커밋
- docs/audit/ 파일 임의 수정
```

---

## Git 접근 권한 관리

```
GitHub 기준:

private/ repo
└── 본인만 (private)

workspaces/jeju-smartcity/ repo
└── Settings → Collaborators
    ├── 팀원 초대
    └── 필요시 고객사 초대 (docs/ 열람용)

repos/jeju-frontend/ repo
└── Settings → Collaborators
    └── 프론트엔드 개발팀만

repos/jeju-backend/ repo
└── Settings → Collaborators
    └── 백엔드 개발팀만

repos/poc-iot-sensor/ repo
└── 본인만 (private)
```

---

## 전체 흐름 요약

```
repos/                          ← 모든 코드의 원천 (독립 git repo)
  ↑ submodule        ↑ submodule
private/             workspaces/
(실험, PoC, 준비)    (납품, 감리, 팀 협업)
  ↓ PoC 성공 시 승격
workspaces/
```

| 목적             | 위치                                 |
| ---------------- | ------------------------------------ |
| 개인 학습, 준비  | `private/PARA/Projects/`             |
| PoC, 실험 코드   | `repos/poc-*` + `private/` submodule |
| 프로젝트 문서    | `workspaces/name/docs/`              |
| 실제 서비스 코드 | `repos/`                             |
| IDE 통합 관리    | `.code-workspace`                    |
| 버전 고정 (납품) | project workspace `git tag`          |
