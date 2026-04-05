# {{PROJECT_NAME}} 디자인 시스템

> OpenCode + Claude Code 동시 지원 AI 하네스로 구축하는 디자인 시스템

---

## 개요

{{PROJECT_NAME}} 디자인 시스템 구축 프로젝트다. 5개 Phase(Discovery → Foundation → Build → Ship → Evolve)를 12개 전문 에이전트가 분담하여 처리한다.

두 하네스를 동시에 사용할 수 있다. 같은 프로젝트에서 OpenCode와 Claude Code를 상황에 따라 선택하여 실행한다.

---

## 빠른 시작

### OpenCode

```bash
opencode run ds-build        # 전체 파이프라인
opencode run ds-audit        # 현황 감사
opencode run ds-tokens       # 토큰 정의
opencode run ds-components   # 컴포넌트 설계→구현
opencode run ds-release      # 배포 준비
```

### Claude Code

```bash
claude                       # Claude Code 시작
/ds-build                    # 전체 파이프라인
/ds-audit                    # 현황 감사
/ds-tokens                   # 토큰 정의
/ds-components               # 컴포넌트 설계→구현
/ds-release                  # 배포 준비
```

---

## 디렉토리 구조

```
{{PROJECT_NAME}}/
├── CLAUDE.md                            # Claude Code 프로젝트 지침
├── .claude/                             # Claude Code 설정
│   ├── settings.json
│   ├── commands/                        # 5개 슬래시 커맨드
│   └── agents/                          # 12개 에이전트 (Claude Code용)
├── .opencode/                           # OpenCode 설정
│   ├── opencode.json
│   ├── agents/                          # 12개 에이전트 (OpenCode용)
│   ├── skills/
│   └── tools/                           # 6개 커스텀 도구 (.ts)
├── scripts/tools/                       # 6개 도구 스크립트 (.sh, Claude Code용)
├── docs/
│   ├── audit/                           # 현황 감사 리포트
│   ├── charter/                         # Charter, MVP 범위
│   ├── tokens/                          # 토큰 명세서
│   ├── brand/                           # 브랜드 가이드라인
│   ├── components/                      # 컴포넌트 Spec
│   ├── a11y/                            # 접근성·반응형
│   ├── visual-spec/                     # 시각 Spec (Storybook + Penpot)
│   ├── portal/                          # 디자인 포털 문서
│   ├── governance/                      # 거버넌스 문서
│   └── gate-reviews/                    # 승인 이력
└── packages/
    ├── tokens/                          # CSS/SCSS/JS 토큰
    └── components/                      # React/Vue 컴포넌트
```

### 하네스별 참조 범위

| 항목 | OpenCode | Claude Code |
|------|----------|-------------|
| 설정 | `.opencode/opencode.json` | `CLAUDE.md` + `.claude/settings.json` |
| 에이전트 | `.opencode/agents/*.md` | `.claude/agents/*.md` |
| 도구 | `.opencode/tools/*.ts` | `scripts/tools/*.sh` |
| 커맨드 | `opencode.json` → command | `.claude/commands/*.md` |

각 하네스는 자신의 디렉토리만 읽으므로 충돌이 없다. 산출물(docs/, packages/)은 공유된다.

---

## 승인 게이트

각 Phase 완료 시 자동 검증 + 인간 승인을 거친다. 상세 기준은 CLAUDE.md 또는 상위 디렉토리의 README.md를 참조하라.

---

## 참고

- [상위 README](../../README.md) — 멀티 프로젝트 가이드, ds-init 사용법
- [디자인 시스템 구축 프로세스](../../../../PARA/03.resources/ref_디자인-시스템-구축-프로세스.md) — 원본 프로세스 문서
