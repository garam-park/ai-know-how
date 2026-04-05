# Project Workspace 운영 가이드

## 개요

이 문서는 프로젝트별 통합 workspace(`workspaces/{project-name}/`)의
구조와 운영 방법을 정의한다.

**목적:** 특정 프로젝트의 통합 관리 (문서 + 코드 + 작업 기록)

| 항목      | 설명                             |
| --------- | -------------------------------- |
| 공유 대상 | 팀, 고객 선택적 공유 가능        |
| git 구조  | 독립 repo + submodules           |
| submodule | 해당 프로젝트의 모든 서비스 repo |
| 문서      | 기획, 감리, 회의록 등 통합 관리  |

---

## 디렉토리 구조

```
workspaces/
└── {project-name}/
    ├── .claude/
    │   ├── CLAUDE.md              # 프로젝트 전용 AI 지시사항
    │   └── rules/
    ├── .opencode/
    │   └── opencode.json
    ├── {project-name}.code-workspace
    ├── docs/
    │   ├── inbox/                 # 위치가 애매한 문서. 임시 보관
    │   ├── planning/              # 기획 문서
    │   ├── audit/                 # 감리 문서
    │   └── meetings/              # 회의록
    ├── tasks/                     # 작업 상태 관리 (칸반)
    │   ├── backlog/
    │   ├── in-progress/
    │   ├── review-ready/          # 검토 대기
    │   ├── reviewed/              # 검토 완료
    │   └── done/
    ├── logs/                      # 작업 기록
    │   └── YYYY-MM-DD.md
    └── repos/                     # submodules ──▶ repos/{project-name}-*
        ├── frontend/              #   ──▶ repos/jeju-frontend
        └── backend/               #   ──▶ repos/jeju-backend
```

---

## Tasks 디렉토리 운영 (칸반식 작업 관리)

> 상세 규칙: `.claude/rules/rule_task-management.md` 참조

**구조:**

```
tasks/
├── backlog/         # 아직 시작하지 않은 작업
├── in-progress/     # 현재 진행 중인 작업
├── review-ready/    # 검토 대기 중인 작업
├── reviewed/        # 검토 완료된 작업
└── done/            # 완료된 작업
```

---

## Submodule 운영

### 신규 submodule 추가

```bash
cd workspaces/jeju-smartcity
git submodule add https://github.com/org/jeju-frontend repos/frontend
git submodule add https://github.com/org/jeju-backend  repos/backend
git commit -m "add submodules: frontend, backend"
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
git submodule update --remote repos/frontend

# 전체 submodule 업데이트
git submodule update --remote --merge
```

---

## VSCode .code-workspace 설정

```json
{
  "folders": [
    {
      "name": "📁 jeju-smartcity",
      "path": "."
    },
    {
      "name": "🖥 frontend",
      "path": "./repos/frontend"
    },
    {
      "name": "⚙️ backend",
      "path": "./repos/backend"
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

## 납품 및 감리 버전 고정

```bash
# 1. 납품 시점 코드 상태 확인
cd workspaces/jeju-smartcity
git submodule status

# 2. 감리 문서 작성
# docs/audit/2025-Q1-감리보고서.md 작성

# 3. 해당 시점 submodule commit 고정
git add repos/frontend repos/backend docs/audit/
git commit -m "감리 2025-Q1: frontend v1.2.3, backend v2.0.1"

# 4. tag로 납품 버전 표시
git tag delivery/2025-Q1
git push origin delivery/2025-Q1
```

---

## AI 도구 컨텍스트

### Claude Code

```bash
cd ~/workspaces/jeju-smartcity
claude  # .claude/CLAUDE.md 자동 로드 + submodule 코드 접근 가능
```

### CLAUDE.md 예시

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
- DO NOT: repos/ 하위에 직접 커밋 — 각 submodule repo에서 작업

## DO NOT

- .env 파일 커밋
- docs/audit/ 파일 임의 수정
```

---

## Git 접근 권한 관리

```
GitHub 기준:

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
```
