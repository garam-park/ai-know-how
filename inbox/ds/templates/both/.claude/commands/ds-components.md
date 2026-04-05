Atomic Design 기반으로 컴포넌트를 설계하고 코드로 구현한다.

## 실행 절차

각 단계마다 해당 에이전트의 `.claude/agents/{name}.md`를 읽고 Agent 도구로 서브에이전트를 생성한다.

### Step 1: 컴포넌트 설계
- Agent: `.claude/agents/ui-architect.md`
- Atoms → Molecules → Organisms → Templates 설계, Spec 문서 작성
- 산출물: `docs/components/`

### Step 2: 접근성 검증
- Agent: `.claude/agents/a11y-engineer.md`
- WCAG 2.1 AA 검증, 반응형 브레이크포인트 정의
- 산출물: `docs/a11y/`

### Step 3: 시각 Spec
- Agent: `.claude/agents/visual-archivist.md`
- Storybook 기반 시각 Spec 문서화, Handoff Spec 작성
- 산출물: `docs/visual-spec/`

### Step 4: 코드 구현
- Agent: `.claude/agents/component-developer.md`
- React 컴포넌트 개발, 토큰 연동, 단위 테스트
- 산출물: `packages/components/`

### Step 5: 문서화
- Agent: `.claude/agents/doc-engineer.md`
- Storybook 스토리 작성
- 산출물: `packages/components/*.stories.tsx`, `docs/portal/`

각 단계 완료 시 CLAUDE.md의 게이트 기준에 따라 검증을 실행한다.
