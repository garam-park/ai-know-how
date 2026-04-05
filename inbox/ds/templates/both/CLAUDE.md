# {{PROJECT_NAME}} 디자인 시스템

Claude Code 기반 AI 하네스로 구축하는 디자인 시스템.

Code-First를 기본으로 하며, 고객 요청 시 Penpot 시안을 On-Demand로 생성한다.

## 파이프라인 개요

5개 Phase(Discovery → Foundation → Build → Ship → Evolve)를 12개 전문 에이전트가 분담 처리한다.

```
Phase 1: Discovery  →  Phase 2: Foundation  →  Phase 3: Build  →  Phase 4: Ship  →  Phase 5: Evolve
   (감사·기획)           (토큰·브랜드)           (설계·검증)          (구현·배포)          (운영·거버넌스)
```

## 에이전트 레지스트리

서브에이전트 호출 시 Agent 도구를 사용한다. 호출 절차:

1. 해당 `.claude/agents/{name}.md` 파일을 Read 도구로 읽는다
2. Agent 도구의 prompt에 파일 내용 + 현재 컨텍스트(프로젝트명, 이전 산출물 경로)를 전달한다
3. 서브에이전트 완료 후 산출물이 지정 경로에 생성되었는지 확인한다

| 에이전트 | 파일 경로 | 역할 | 출력 경로 |
|----------|-----------|------|-----------|
| ds-orchestrator | `.claude/agents/ds-orchestrator.md` | 파이프라인 오케스트레이터 | docs/ |
| auditor | `.claude/agents/auditor.md` | UI 현황 감사 | docs/audit/ |
| planner | `.claude/agents/planner.md` | Charter, MVP 범위, RACI | docs/charter/ |
| token-engineer | `.claude/agents/token-engineer.md` | 토큰 3계층 정의 | docs/tokens/, packages/tokens/ |
| brand-designer | `.claude/agents/brand-designer.md` | 브랜드 가이드라인 | docs/brand/ |
| ui-architect | `.claude/agents/ui-architect.md` | Atomic Design Spec | docs/components/ |
| a11y-engineer | `.claude/agents/a11y-engineer.md` | 접근성·반응형 검증 | docs/a11y/ |
| visual-archivist | `.claude/agents/visual-archivist.md` | 시각 Spec, Penpot On-Demand | docs/visual-spec/ |
| component-developer | `.claude/agents/component-developer.md` | 컴포넌트 개발 | packages/components/ |
| doc-engineer | `.claude/agents/doc-engineer.md` | Storybook 스토리, 문서화 | packages/components/, docs/portal/ |
| release-engineer | `.claude/agents/release-engineer.md` | 배포, CI/CD, 시각 회귀 | .github/, CHANGELOG.md |
| governance-manager | `.claude/agents/governance-manager.md` | RFC, 채택률, Health Check | docs/governance/ |

## 도구 레지스트리

커스텀 도구는 `scripts/tools/` 디렉토리의 쉘 스크립트로 제공된다. Bash 도구로 실행한다.

| 도구 | 명령어 | 설명 |
|------|--------|------|
| token-gen | `bash scripts/tools/token-gen.sh <source> <platforms> <output>` | Style Dictionary 기반 토큰 변환 |
| a11y-check | `bash scripts/tools/a11y-check.sh <target> [level]` | axe-core 접근성 검사 |
| playwright-visual-test | `bash scripts/tools/playwright-visual-test.sh <url> [options]` | Playwright 시각 회귀 테스트 |
| storybook-snapshot | `bash scripts/tools/storybook-snapshot.sh <url> <output> [components]` | Storybook 스크린샷 수집 |
| penpot-on-demand | `bash scripts/tools/penpot-on-demand.sh <action> [options]` | Penpot 시안 On-Demand 생성 |
| test-config | `bash scripts/tools/test-config.sh` | 테스트 설정값 JSON 출력 |

## 승인 게이트

각 Phase 완료 후 자동 검증 + 인간 승인을 거친다.

### 자동 검증 항목

| Gate | Phase | 검증 항목 |
|------|-------|-----------|
| Gate 1 | Discovery | UI 인벤토리 100% 커버리지, Charter 필수 요소 존재 |
| Gate 2 | Foundation | 토큰 참조 무결성, Style Dictionary 빌드 성공, 색상 대비 AA 통과 |
| Gate 3 | Build | Spec completeness, WCAG 2.1 AA 통과, Storybook 스토리 전체 조합 |
| Gate 4 | Ship | 단위 테스트 100%, 시각 회귀 테스트 통과, SemVer 준수 |
| Gate 5 | Evolve | 채택률 70% 이상, P0/P1 issue 0건, 버전 편차 0 |

### 인간 승인

인간 승인 단계에서는 **사용자에게 검토 항목과 산출물 요약을 제시하고 승인을 요청**한다.

| Gate | 승인 주체 | 검토 항목 |
|------|-----------|-----------|
| Gate 1 | 스테이크홀더, PO | MVP 범위, 거버넌스 모델, 우선순위 |
| Gate 2 | 디자인 리드, 프론트엔드 리드 | 토큰-브랜드 일치, Semantic 네이밍, 다크모드 대응 |
| Gate 3 | 프론트엔드 리드, 디자인 리드, UX 라이터 | Props API, Storybook 렌더링 품질, UX Writing 톤 |
| Gate 4 | 테크 리드, 개발 팀 대표, 릴리스 매니저 | 배포 결정, 문서 완성도, Changelog |
| Gate 5 | 거버넌스 코어 팀, DS 팀 리드 | RFC 승인, Deprecation 결정, Health Check 액션 |

### 승인 상태

| 상태 | 의미 | 조치 |
|------|------|------|
| `approved` | 모든 기준 충족 | 다음 Phase 진행 |
| `conditional` | 경미한 이슈, 병행 수정 가능 | 이슈 티켓 생성, 데드라인 설정 |
| `rejected` | 중대 이슈, 진행 불가 | Back Propagation, 재검토 |

동일 게이트 3회 연속 rejected 시 작업 중단, 인간 개입이 필요하다.

## Back Propagation

문제 발생 시 자동으로 해당 Step으로 역행하여 수정한다.

| 트리거 | 역행 대상 | 조치 |
|--------|-----------|------|
| 브랜드 방향 변경 | Step③ 토큰 | token-engineer 재호출 |
| a11y 구조 문제 | Step⑤ Spec | ui-architect 재설계 |
| Visual Spec 불명확 | Step⑤ Spec | ui-architect Spec 수정 |
| 토큰 구조 결함 | Step③ 토큰 | token-engineer 재정의 |
| Spec 불명확 | Step⑦ Visual Spec | visual-archivist 수정 |
| 문서화 중 코드 오류 | Step⑧ 코드 | component-developer 수정 |
| 시각 회귀 실패 | Step⑧ 코드 | component-developer 수정 |
| 구조적 결함 | Step⑤ Spec | ui-architect 전면 재검토 |
| RFC 승인 | Step⑤ 컴포넌트 | ui-architect 추가 설계 |
| 토큰 확장 요청 | Step③ 토큰 | token-engineer 업데이트 |
| 새 버전 배포 | Step⑧ 코드 | component-developer 재진입 |

## 파일 쓰기 규칙

- 에이전트 산출물은 **지정된 출력 경로에만** 작성한다
- 수정 가능: `docs/`, `packages/`, `CHANGELOG.md`, `.github/`
- 수정 불가: `.claude/`, `scripts/`, `CLAUDE.md`

## 승인 이력

모든 게이트 결과를 `docs/gate-reviews/`에 기록:

```markdown
# Gate {N}: {Phase명} 검토

- Date: YYYY-MM-DD
- Reviewer: {이름}
- Status: approved | rejected | conditional
- Auto-check results: {항목별 통과/실패}
- Comments: {의견}
- Resolution: {재검토 시 조치 내용}
```
