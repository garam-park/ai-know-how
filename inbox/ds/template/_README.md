# {{PROJECT_NAME}} 디자인 시스템

> OpenCode 기반 AI 하네스로 구축하는 디자인 시스템

---

## 개요

{{PROJECT_NAME}} 디자인 시스템 구축 프로젝트다. 5개 Phase(Discovery → Foundation → Build → Ship → Evolve)를 12개 전문 에이전트가 분담하여 처리한다.

---

## 빠른 시작

```bash
# 전체 파이프라인 실행
opencode run ds-build

# 현황 감사 (Brownfield 전용)
opencode run ds-audit

# 토큰 정의
opencode run ds-tokens

# 컴포넌트 설계 → 구현 → 문서화
opencode run ds-components

# 배포 준비
opencode run ds-release
```

---

## 디렉토리 구조

```
{{PROJECT_NAME}}/
├── .opencode/
│   ├── opencode.json                 # 프로젝트 설정
│   ├── agents/                       # 12개 에이전트
│   ├── skills/
│   │   └── design-system-build/
│   │       └── SKILL.md
│   └── tools/                        # 4개 커스텀 도구
├── docs/
│   ├── audit/                        # 현황 감사 리포트
│   ├── charter/                      # Charter, MVP 범위
│   ├── tokens/                       # 토큰 명세서
│   ├── brand/                        # 브랜드 가이드라인
│   ├── components/                   # 컴포넌트 Spec
│   ├── a11y/                         # 접근성·반응형
  │   ├── visual-spec/                  # 시각 Spec (Storybook + Penpot)
│   ├── portal/                       # 디자인 포털 문서
│   ├── governance/                   # 거버넌스 문서
│   └── gate-reviews/                 # 승인 이력
└── packages/
    ├── tokens/                       # CSS/SCSS/JS 토큰
    └── components/                   # React/Vue 컴포넌트
```

---

## 승인 게이트

각 Phase 완료 시 자동 검증 + 인간 승인을 거친다. 상세 기준은 상위 디렉토리의 README.md를 참조하라.

---

## 참고

- [상위 README](../../README.md) — 멀티 프로젝트 가이드, ds-init 사용법
- [디자인 시스템 구축 프로세스](../../../../PARA/03.resources/ref_디자인-시스템-구축-프로세스.md) — 원본 프로세스 문서
