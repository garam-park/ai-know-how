# 워크스페이스 구조 개요

## 개요

이 문서는 개인 작업, PoC 실험, 프로젝트 납품을 아우르는
3계층 워크스페이스 구조를 정의한다.

> 팀원 공유용 project workspace 운영 가이드는
> `ref_project-워크스페이스-운영.md` 참조

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
├── workspaces/                           # → ref_project-워크스페이스-운영.md 참조
│   └── {project-name}/
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

### 2. repos

**목적:** 실제 코드베이스. private / project workspace 양쪽에서 submodule로 참조됨

| repos/ 항목        | 소속                      | 공개 여부 | 수명          |
| ------------------ | ------------------------- | --------- | ------------- |
| `jeju-frontend`    | workspaces/jeju-smartcity | 팀 공유   | 프로젝트 기간 |
| `jeju-backend`     | workspaces/jeju-smartcity | 팀 공유   | 프로젝트 기간 |
| `poc-iot-sensor`   | private                   | 본인만    | 단명 가능     |
| `poc-llm-pipeline` | private                   | 본인만    | 단명 가능     |
| `shared-lib`       | 여러 곳                   | 선택적    | 장기          |

---

## VSCode private.code-workspace

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
git submodule add https://github.com/org/jeju-iot-sensor repos/iot-sensor

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

## AI 도구 컨텍스트 (private)

```bash
# private workspace에서 PoC 작업 시
cd ~/private
claude --add-dir PARA/Projects/build_poc-iot-sensor/poc-iot-sensor
```

---

## Git 접근 권한 (private)

```
GitHub 기준:

private/ repo
└── 본인만 (private)

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
