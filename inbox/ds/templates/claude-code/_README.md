# {{PROJECT_NAME}} 디자인 시스템

> Claude Code 기반 AI 하네스로 구축하는 디자인 시스템

---

## 개요

{{PROJECT_NAME}} 디자인 시스템 구축 프로젝트다. 5개 Phase(Discovery → Foundation → Build → Ship → Evolve)를 12개 전문 에이전트가 분담하여 처리한다.

---

## 빠른 시작

```bash
# Claude Code 시작
claude

# 전체 파이프라인 실행
/ds-build

# 현황 감사 (Brownfield 전용)
/ds-audit

# 토큰 정의
/ds-tokens

# 컴포넌트 설계 → 구현 → 문서화
/ds-components

# 배포 준비
/ds-release
```

---

## 디렉토리 구조

```
{{PROJECT_NAME}}/
├── CLAUDE.md                            # 프로젝트 지침 (에이전트/도구 레지스트리)
├── .claude/
│   ├── settings.json                    # 권한 설정
│   ├── commands/                        # 5개 슬래시 커맨드
│   │   ├── ds-build.md
│   │   ├── ds-audit.md
│   │   ├── ds-tokens.md
│   │   ├── ds-components.md
│   │   └── ds-release.md
│   └── agents/                          # 12개 에이전트 프롬프트
├── scripts/tools/                       # 6개 도구 스크립트
│   ├── token-gen.sh
│   ├── a11y-check.sh
│   ├── playwright-visual-test.sh
│   ├── storybook-snapshot.sh
│   ├── penpot-on-demand.sh
│   └── test-config.sh
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

---

## 승인 게이트

각 Phase 완료 시 자동 검증 + 인간 승인을 거친다. 상세 기준은 CLAUDE.md를 참조하라.

---

## 참고

- [상위 README](../../README.md) — 멀티 프로젝트 가이드, ds-init 사용법
- [디자인 시스템 구축 프로세스](../../../../PARA/03.resources/ref_디자인-시스템-구축-프로세스.md) — 원본 프로세스 문서
