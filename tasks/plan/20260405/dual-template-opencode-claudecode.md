# OpenCode + Claude Code 듀얼 템플릿 가능성 분석

## 연구 배경

`inbox/ds/templates/`에는 OpenCode용과 Claude Code용 두 개의 별도 디자인 시스템 하네스 템플릿이 존재한다. 동일한 비즈니스 로직(12개 에이전트, 5개 Phase, 5개 Gate)을 두 하네스에서 동시에 쓸 수 있는 단일 템플릿이 가능한지 분석한다.

---

## 두 템플릿 구조 비교

### Claude Code 템플릿

```
.claude/
  settings.json          # 전역 권한 (Bash, Read, Write 허용 규칙)
  agents/*.md            # 에이전트 파일 (프론트매터 없음, 순수 마크다운)
  commands/*.md          # /slash-command 파일
CLAUDE.md                # 프로젝트 지침 + 에이전트 레지스트리
scripts/tools/*.sh       # 커스텀 도구 (bash 스크립트)
```

### OpenCode 템플릿

```
.opencode/
  opencode.json          # 에이전트 설정 + 커맨드 정의 (JSON)
  agents/*.md            # 에이전트 파일 (YAML 프론트매터 포함)
  skills/*/SKILL.md      # 스킬 파일 (opencode run <skill>)
  tools/*.ts             # 커스텀 도구 (TypeScript)
```

---

## 핵심 차이점 분석

### 1. 에이전트 파일 형식

| 항목 | Claude Code | OpenCode |
|------|-------------|----------|
| 위치 | `.claude/agents/` | `.opencode/agents/` |
| 프론트매터 | 없음 (순수 마크다운) | YAML 필수 (`description`, `mode`, `model`, `permission`, `steps`) |
| 모델 지정 | `CLAUDE.md` 또는 settings에서 전역 | 에이전트별 `model: opencode/qwen3.6-plus-free` |
| 권한 제어 | `settings.json` 전역 | 에이전트 프론트매터에 per-agent 설정 |
| 서브에이전트 호출 | `Agent` 도구 + 파일 Read | `@agentname` 또는 `task` 도구 |

**본문 내용은 거의 동일.** 차이는:
- Claude Code: `## 파일 쓰기 규칙` 섹션을 마크다운 본문에 포함
- OpenCode: 동일 정보를 YAML 프론트매터 `permission` 필드로 표현

### 2. 커맨드/스킬

| 항목 | Claude Code | OpenCode |
|------|-------------|----------|
| 정의 방식 | `.claude/commands/*.md` | `opencode.json`의 `command` 섹션 + `.opencode/skills/*/SKILL.md` |
| 실행 방법 | `/ds-build` (슬래시 커맨드) | `opencode run ds-build` |
| 내용 | 실행 지침 마크다운 | JSON template + 별도 SKILL.md |

### 3. 커스텀 도구

| 항목 | Claude Code | OpenCode |
|------|-------------|----------|
| 형식 | `.sh` bash 스크립트 | `.ts` TypeScript (`@opencode-ai/plugin`) |
| 호출 방식 | `Bash(scripts/tools/*.sh)` | native tool 등록 |
| 로직 동일성 | 동일한 로직 (Style Dictionary, Playwright 등) | 동일한 로직 |

### 4. 전역 설정

| 항목 | Claude Code | OpenCode |
|------|-------------|----------|
| 파일 | `CLAUDE.md` + `.claude/settings.json` | `.opencode/opencode.json` |
| 충돌 | 없음 (다른 파일명, 다른 디렉토리) | — |

---

## 듀얼 템플릿 구현 가능성

### 결론: **구현 가능 (중간 복잡도)**

두 하네스의 설정 디렉토리가 완전히 분리되어 있어 (`.claude/` vs `.opencode/`) 한 프로젝트 내에서 공존이 가능하다. Claude Code는 `.claude/`만 읽고, OpenCode는 `.opencode/`만 읽는다.

---

## 구현 방안 3가지

### 방안 A: 풀 듀얼 (권장)

두 하네스 파일을 모두 프로젝트에 포함. `ds-init` 스크립트가 단일 `dual` 템플릿을 복사.

```
template/dual/
├── .claude/                    # Claude Code 전용
│   ├── settings.json
│   ├── agents/*.md             # 순수 마크다운 에이전트
│   └── commands/*.md
├── .opencode/                  # OpenCode 전용
│   ├── opencode.json
│   ├── agents/*.md             # 프론트매터 포함 에이전트
│   ├── skills/
│   └── tools/*.ts
├── CLAUDE.md                   # Claude Code 프로젝트 지침
└── scripts/tools/*.sh          # Claude Code용 bash 도구
```

**장점:**
- 양쪽 하네스가 완전히 작동
- 팀이 도구를 자유롭게 선택
- 동일 프로젝트에서 혼용 가능

**단점:**
- 에이전트 파일 × 2 (내용 중복)
- 도구 × 2 (.sh + .ts, 동일 로직)
- 템플릿 크기 약 2배

### 방안 B: 공유 에이전트 본문 + 도구별 래퍼 (중간)

에이전트 본문을 `shared/agents/` 한 곳에 두고, 빌드 스크립트가 각 하네스용으로 변환.

```
template/dual/
├── shared/
│   └── agents/
│       ├── token-engineer.md   # 본문만 (프론트매터 없음)
│       └── ...
├── .claude/
│   ├── settings.json
│   └── commands/
├── .opencode/
│   ├── opencode.json
│   ├── skills/
│   └── tools/
├── CLAUDE.md
├── scripts/tools/*.sh
└── build-agents.sh             # shared → .claude/agents/ 복사
                                # shared → .opencode/agents/ (프론트매터 추가)
```

**장점:** 에이전트 본문 단일 관리, 수정 시 한 곳만 변경

**단점:** 빌드 스텝 필요, `ds-init` 복잡도 증가

### 방안 C: 머지드 프론트매터 단일 파일 (실험적)

Claude Code도 에이전트 `.md` 파일에서 YAML 프론트매터를 지원 (description, model 등). 두 하네스의 프론트매터를 하나의 파일에 합치고, 각 디렉토리에 복사.

```yaml
---
# Claude Code 필드
description: 토큰 엔지니어
model: claude-sonnet-4-6

# OpenCode 필드 (Claude Code가 무시)
mode: subagent
opencode_model: opencode/qwen3.6-plus-free
permission:
  edit: deny
  write: "docs/tokens/**/*"
steps: 10
---
```

**문제:** OpenCode `model` 필드 이름이 Claude Code와 동일 → 둘 다 읽으면 충돌. 디렉토리 위치 문제도 동일하게 존재 → **현실적이지 않음**.

---

## 권장 방안: 방안 A (풀 듀얼)

### 근거

1. **단순성**: 빌드 스텝 없이 파일 복사만으로 동작
2. **완전성**: 양쪽 하네스가 원본 템플릿과 100% 동일하게 작동
3. **유지보수**: 에이전트 수정 시 `.claude/agents/`와 `.opencode/agents/` 두 곳 수정 필요하지만, 내용이 거의 동일하여 diff 관리가 쉬움
4. **현실적 사용**: 한 프로젝트에서 두 하네스를 동시에 쓸 일은 드묾. 주로 "팀 선택권"을 보장하는 용도

### 주의사항

- 에이전트 본문 수정 시 두 디렉토리 동기화 필요 → `diff` 체크 스크립트 권장
- `.ts` 도구와 `.sh` 도구는 동일 로직이지만 별도 유지 → 추후 기능 추가 시 양쪽 반영

---

## 구현 시 수정 사항

### 1. `ds-init` 스크립트 수정

현재 `--harness opencode` 또는 `--harness claude-code` 옵션 지원. 추가:

```bash
./ds-init <프로젝트명> --harness dual
```

### 2. 새 템플릿 디렉토리 생성

```
templates/
├── opencode/       # 기존
├── claude-code/    # 기존
└── dual/           # 신규: 두 하네스 파일 모두 포함
```

### 3. README 업데이트

`ds-init` 커맨드 예시에 `dual` 옵션 추가.

---

## 에이전트 파일 동기화 전략

두 디렉토리의 에이전트 파일 동기화를 위한 `check-sync.sh` 스크립트:

```bash
#!/usr/bin/env bash
# Claude Code 에이전트 본문과 OpenCode 에이전트 본문을 비교
# (프론트매터 제외하고 비교)

for agent in .claude/agents/*.md; do
  name=$(basename "$agent")
  opencode_agent=".opencode/agents/$name"
  
  if [ -f "$opencode_agent" ]; then
    # 프론트매터 제거 후 비교
    body1=$(sed '/^---$/,/^---$/d' "$agent")
    body2=$(sed '/^---$/,/^---$/d' "$opencode_agent")
    
    if [ "$body1" != "$body2" ]; then
      echo "비동기: $name"
      diff <(echo "$body1") <(echo "$body2")
    fi
  fi
done
```

---

## 요약

| 항목 | 평가 |
|------|------|
| 기술적 가능성 | ✅ 가능 (디렉토리 완전 분리) |
| 구현 방안 | 방안 A (풀 듀얼) 권장 |
| 추가 파일 | 에이전트 ×12, 도구 ×6 중복 |
| 유지보수 부담 | 중간 (동기화 스크립트로 관리 가능) |
| 실용적 가치 | 팀 도구 선택 자유도 + 하네스 마이그레이션 용이 |
| 다음 작업 | `templates/dual/` 디렉토리 생성, `ds-init` 수정 |
