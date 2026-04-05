# 디자인 시스템 AI 하네스

OpenCode 기반 멀티 에이전트 오케스트레이션으로 디자인 시스템 구축 프로세스를 자동화한다.

---

## 개요

디자인 시스템 구축의 5개 Phase(Discovery → Foundation → Build → Ship → Evolve)를 12개 전문 에이전트가 분담하여 처리한다. 각 Phase 완료 시 승인 게이트를 거쳐 다음 단계로 진행하며, 문제 발생 시 자동으로 Back Propagation이 발생한다.

```
Phase 1: Discovery  →  Phase 2: Foundation  →  Phase 3: Build  →  Phase 4: Ship  →  Phase 5: Evolve
   (감사·기획)           (토큰·브랜드)           (설계·검증)          (구현·배포)          (운영·거버넌스)
```

---

## 설치

### 필수 환경

- [OpenCode](https://opencode.ai) 설치
- Node.js 18 이상

### 설정

```bash
# 프로젝트 디렉토리로 이동
cd inbox/ds

# OpenCode 실행
opencode
```

설정 파일(`.opencode/opencode.json`)이 이미 포함되어 있어 별도 설정이 필요 없다.

---

## 빠른 시작

### 전체 파이프라인 실행

```bash
opencode run ds-build
```

Greenfield/Brownfield를 자동 판단하여 Phase 1부터 Phase 5까지 순차적으로 실행한다.

### 개별 작업 실행

```bash
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

## 커맨드 목록

| 커맨드          | 설명                                                                  | 대상 에이전트    |
| --------------- | --------------------------------------------------------------------- | ---------------- |
| `ds-build`      | 전체 파이프라인 실행 (감사 → 기획 → 토큰 → 설계 → 구현 → 배포 → 운영) | ds-orchestrator  |
| `ds-audit`      | 기존 UI 현황 감사, 중복·불일치 수치화                                 | auditor          |
| `ds-tokens`     | 디자인 토큰 3계층 정의 (Primitive → Semantic → Component)             | token-engineer   |
| `ds-components` | Atomic Design 설계 → a11y 검증 → 코드 구현 → Storybook 문서화         | ui-architect     |
| `ds-release`    | SemVer 버전 관리, CI/CD, 시각 회귀 테스트, npm 배포 준비              | release-engineer |

---

## 에이전트 구성

### 오케스트레이터

| 에이전트          | 역할                                                              |
| ----------------- | ----------------------------------------------------------------- |
| `ds-orchestrator` | 전체 파이프라인 제어, 승인 게이트 검증, Back Propagation 재라우팅 |

### 전문 서브에이전트

| Phase              | 에이전트              | 역할                                                      |
| ------------------ | --------------------- | --------------------------------------------------------- |
| **P1: Discovery**  | `auditor`             | 기존 UI 현황 감사, 중복 분석, 기술 부채 시각화            |
|                    | `planner`             | Design System Charter, MVP 범위, RACI, Roadmap            |
| **P2: Foundation** | `token-engineer`      | 토큰 3계층 정의, JSON/YAML 명세서, Style Dictionary 빌드  |
|                    | `brand-designer`      | 색상·타이포·아이콘·모션 원칙, UX Writing 가이드           |
| **P3: Build**      | `ui-architect`        | Atomic Design 컴포넌트 설계, Spec 문서화                  |
|                    | `a11y-engineer`       | WCAG 2.1 접근성 검증, 반응형 브레이크포인트               |
|                    | `figma-builder`       | Figma 라이브러리 구축 (Variants, Auto-layout, Properties) |
| **P4: Ship**       | `component-developer` | React/Vue 컴포넌트 개발, 토큰 연동, 단위 테스트           |
|                    | `doc-engineer`        | Storybook 스토리, 디자인 포털, Migration 가이드           |
|                    | `release-engineer`    | SemVer, CI/CD, 시각 회귀 테스트, Changelog                |
| **P5: Evolve**     | `governance-manager`  | RFC 프로세스, 채택률 측정, 분기 Health Check              |

---

## 승인 게이트

각 Phase 완료 후 자동 검증 + 인간 승인을 거친다.

### 자동 검증 항목

| Gate   | Phase      | 검증 항목                                                       |
| ------ | ---------- | --------------------------------------------------------------- |
| Gate 1 | Discovery  | UI 인벤토리 100% 커버리지, Charter 필수 요소 존재               |
| Gate 2 | Foundation | 토큰 참조 무결성, Style Dictionary 빌드 성공, 색상 대비 AA 통과 |
| Gate 3 | Build      | Spec completeness, WCAG 2.1 AA 통과, Figma Variants 전체 조합   |
| Gate 4 | Ship       | 단위 테스트 100%, 시각 회귀 테스트 통과, SemVer 준수            |
| Gate 5 | Evolve     | 채택률 70% 이상, P0/P1 issue 0건, 버전 편차 0                   |

### 인간 승인 항목

| Gate   | 승인 주체                               | 검토 항목                                        |
| ------ | --------------------------------------- | ------------------------------------------------ |
| Gate 1 | 스테이크홀더, PO                        | MVP 범위, 거버넌스 모델, 우선순위                |
| Gate 2 | 디자인 리드, 프론트엔드 리드            | 토큰-브랜드 일치, Semantic 네이밍, 다크모드 대응 |
| Gate 3 | 프론트엔드 리드, 디자인 리드, UX 라이터 | Props API, Figma 시각 품질, UX Writing 톤        |
| Gate 4 | 테크 리드, 개발 팀 대표, 릴리스 매니저  | 배포 결정, 문서 완성도, Changelog                |
| Gate 5 | 거버넌스 코어 팀, DS 팀 리드            | RFC 승인, Deprecation 결정, Health Check 액션    |

### 승인 상태

| 상태          | 의미                        | 조치                          |
| ------------- | --------------------------- | ----------------------------- |
| `approved`    | 모든 기준 충족              | 다음 Phase 진행               |
| `conditional` | 경미한 이슈, 병행 수정 가능 | 이슈 티켓 생성, 데드라인 설정 |
| `rejected`    | 중대 이슈, 진행 불가        | Back Propagation, 재검토      |

동일 게이트 3회 연속 rejected 시 작업 중단, 인간 개입이 필요하다.

---

## Back Propagation

문제 발생 시 자동으로 해당 Step으로 역행하여 수정한다.

| 트리거              | 역행 대상      | 조치                 |
| ------------------- | -------------- | -------------------- |
| 브랜드 방향 변경    | Step③ 토큰     | 토큰 재정의          |
| a11y 구조 문제      | Step⑤ Spec     | Spec 재설계          |
| Figma 구현 불가     | Step⑤ Spec     | Spec 수정            |
| 토큰 구조 결함      | Step③ 토큰     | 토큰 재정의          |
| Spec 불명확         | Step⑦ Figma    | Figma 수정           |
| 문서화 중 코드 오류 | Step⑧ 코드     | 코드 수정            |
| 시각 회귀 실패      | Step⑧ 코드     | 코드 수정            |
| 구조적 결함         | Step⑤ Spec     | Spec 전면 재검토     |
| RFC 승인            | Step⑤ 컴포넌트 | 컴포넌트 추가 설계   |
| 토큰 확장 요청      | Step③ 토큰     | 토큰 명세서 업데이트 |
| 새 버전 배포        | Step⑧ 코드     | 코드 구현 재진입     |

---

## 디렉토리 구조

```
inbox/ds/
├── .opencode/
│   ├── opencode.json                 # 전체 설정 (에이전트, 커맨드)
│   ├── agents/                       # 12개 에이전트 정의
│   │   ├── ds-orchestrator.md
│   │   ├── auditor.md
│   │   ├── planner.md
│   │   ├── token-engineer.md
│   │   ├── brand-designer.md
│   │   ├── ui-architect.md
│   │   ├── a11y-engineer.md
│   │   ├── figma-builder.md
│   │   ├── component-developer.md
│   │   ├── doc-engineer.md
│   │   ├── release-engineer.md
│   │   └── governance-manager.md
│   ├── skills/
│   │   └── design-system-build/
│   │       └── SKILL.md              # 파이프라인 워크플로 + 승인 기준
│   └── tools/                        # 4개 커스텀 도구
│       ├── token-gen.ts              # Style Dictionary 토큰 변환
│       ├── figma-sync.ts             # Figma API 연동
│       ├── a11y-check.ts             # axe-core 접근성 검사
│       └── visual-regression.ts      # Chromatic/Percy 시각 회귀
├── docs/                             # 산출물
│   ├── audit/                        # Phase 1: 현황 감사 리포트
│   ├── charter/                      # Phase 1: Charter, MVP 범위
│   ├── tokens/                       # Phase 2: 토큰 명세서
│   ├── brand/                        # Phase 2: 브랜드 가이드라인
│   ├── components/                   # Phase 3: 컴포넌트 Spec
│   ├── a11y/                         # Phase 3: 접근성·반응형
│   ├── figma-spec/                   # Phase 3: Figma 라이브러리 Spec
│   ├── portal/                       # Phase 4: 디자인 포털 문서
│   ├── governance/                   # Phase 5: 거버넌스 문서
│   └── gate-reviews/                 # 승인 이력 기록
└── packages/                         # 코드 산출물
    ├── tokens/                       # CSS/SCSS/JS 토큰 파일
    └── components/                   # React/Vue 컴포넌트 소스코드
```

---

## 사용 시나리오

### 시나리오 1: 신규 프로젝트 (Greenfield)

```bash
cd inbox/ds
opencode run ds-build
```

1. 오케스트레이터가 "현황 없음"을 감지 → Greenfield 경로 선택
2. Step②부터 시작: Charter, MVP 범위 정의
3. Phase 2~5 순차 진행, 각 Phase 완료 시 승인 게이트
4. Completed Outputs 확인

### 시나리오 2: 레거시 프로젝트 (Brownfield)

```bash
# 1단계: 현황 감사
opencode run ds-audit

# 2단계: 전체 빌드 (audit 결과를 자동으로 읽음)
opencode run ds-build
```

1. `auditor`가 기존 UI 인벤토리, 중복 분석, 기술 부채 리포트 생성
2. `ds-build`가 audit 리포트를 읽어 Brownfield 경로로 진입
3. Step① 현황 감사 결과 → Step② Charter → 이후 동일

### 시나리오 3: 토큰만 재정의

```bash
opencode run ds-tokens
```

브랜드 변경, 다크모드 추가 등 토큰 구조 변경이 필요할 때 실행한다.

### 시나리오 4: 컴포넌트 추가

```bash
opencode run ds-components
```

RFC 승인으로 신규 컴포넌트가 결정되었을 때 실행한다. 설계 → 구현 → 문서화까지 전체 파이프라인을 실행한다.

### 시나리오 5: 배포

```bash
opencode run ds-release
```

단위 테스트, 시각 회귀 테스트, SemVer 버전 결정, CI/CD 검증, Changelog 작성을 수행한다.

---

## Custom Tools

### token-gen.ts

Style Dictionary 기반 토큰 변환 도구.

```typescript
// 사용 예 (에이전트 내부에서 호출)
// 토큰 JSON → CSS 변수 + SCSS + JS 동시 출력
token -
  gen({
    source: "packages/tokens/tokens.json",
    platforms: ["css", "scss", "js"],
    output: "packages/tokens/dist",
  });
```

### figma-sync.ts

Figma API 연동 도구.

```typescript
// Figma Variables → 로컬 tokens.json 동기화
figma -
  sync({
    fileId: "abc123",
    action: "sync-tokens",
  });

// 컴포넌트 메타데이터 추출
figma -
  sync({
    fileId: "abc123",
    action: "export-spec",
    nodeIds: ["1:2", "3:4"],
  });
```

### a11y-check.ts

axe-core 기반 접근성 검사 도구.

```typescript
a11y -
  check({
    target: "http://localhost:6006", // Storybook URL
    level: "AA",
  });
```

### visual-regression.ts

Chromatic/Percy 시각 회귀 테스트 도구.

```typescript
visual -
  regression({
    provider: "chromatic",
    projectToken: process.env.CHROMATIC_PROJECT_TOKEN,
  });
```

---

## 승인 이력 확인

모든 게이트 검토 결과는 `docs/gate-reviews/`에 기록된다.

```bash
# 최근 승인 이력 확인
ls -la docs/gate-reviews/

# 승인 결과 확인
cat docs/gate-reviews/20260405-gate2-foundation.md
```

기록 형식:

```markdown
# Gate 2: Foundation 검토

- Date: 2026-04-05
- Reviewer: 홍길동
- Status: approved
- Auto-check results: 토큰 참조 무결성 ✓, Style Dictionary 빌드 ✓, 색상 대비 AA ✓, 타이포 스케일 ✓
- Comments: Semantic 네이밍 직관적, 다크모드 대응 구조 적절
```

---

## 문제 해결

### 동일 게이트 3회 연속 rejected

작업이 자동으로 중단된다. 다음 절차를 따른다:

1. `docs/gate-reviews/`에서 반려 사유 확인
2. 관련 에이전트 출력물 재검토
3. 수동으로 문제점 수정 후 재실행

### Back Propagation 루프 감지

최대 3회 재시도 후 초과 시 에스컬레이션된다. 구조적 결함이 의심되는 경우 Step⑤ Spec 전면 재검토를 권장한다.

### Custom Tools 실행 오류

도구 파일(`.opencode/tools/*.ts`)의 의존성을 확인한다.

```bash
cd inbox/ds/.opencode
npm install @opencode-ai/plugin
```

---

## 참고

- [디자인 시스템 구축 프로세스](../../PARA/03.resources/ref_디자인-시스템-구축-프로세스.md) — 원본 프로세스 문서
- [OpenCode 공식 문서](https://opencode.ai) — 에이전트, 스킬, 도구 설정 가이드
