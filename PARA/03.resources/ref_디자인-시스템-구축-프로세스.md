# 디자인 시스템 구축 프로세스

> Zero → Completed Outputs  
> Input / Output · 단계 간 인계 · Greenfield/Brownfield 분기 · Back Propagation 포함

---

## 목차

1. [전체 개괄 도식](#1-전체-개괄-도식)
2. [Phase 1 — Discovery](#2-phase-1--discovery-발견)
3. [Phase 2 — Foundation](#3-phase-2--foundation-기반-구축)
4. [Phase 3 — Build](#4-phase-3--build-컴포넌트-제작)
5. [Phase 4 — Ship](#5-phase-4--ship-배포)
6. [Phase 5 — Evolve](#6-phase-5--evolve-지속-운영)
7. [전체 연결 흐름 + Back Propagation 요약](#7-전체-연결-흐름--back-propagation-요약)

---

## 1. 전체 개괄 도식

> Greenfield/Brownfield 분기, Phase 간 인계, Back Propagation 루프를 한눈에 표현한다.

```mermaid
flowchart TD
    START(["🚀 Zero · 시작점"])

    COND{{"현황이\n있는가?"}}
    START --> COND

    subgraph P1["Phase 1 · Discovery"]
        direction TB
        S1["① 현황 감사 Audit\n★ Brownfield 전용"]
        S2["② 목표·범위 정의 Charter"]
        S1 --> S2
    end

    subgraph P2["Phase 2 · Foundation"]
        direction TB
        S3["③ 디자인 토큰 정의"]
        S4["④ 브랜드 가이드라인"]
        S3 --> S4
    end

    subgraph P3["Phase 3 · Build"]
        direction TB
        S5["⑤ 컴포넌트 설계 Atomic Design"]
        S6["⑥ 접근성·반응형 기준"]
        S7["⑦ Figma 라이브러리 구축"]
        S5 --> S6 --> S7
    end

    subgraph P4["Phase 4 · Ship"]
        direction TB
        S8["⑧ 코드 구현·토큰 연동"]
        S9["⑨ 문서화 Storybook·포털"]
        S10["⑩ 배포·QA·버전 관리"]
        S8 --> S9 --> S10
    end

    subgraph P5["Phase 5 · Evolve"]
        direction TB
        S11["⑪ 거버넌스·지속 운영"]
    end

    END(["✅ Completed Outputs"])

    %% ── Forward flow ──
    COND -->|"Yes — Brownfield\n기존 제품 존재"| S1
    COND -->|"No — Greenfield\n신규 제품"| S2
    S2 --> P2
    P2 -->|"토큰 명세서\n브랜드 가이드라인"| P3
    P3 -->|"Figma 라이브러리\nSpec · a11y 가이드"| P4
    P4 -->|"npm 패키지\nStorybook · Changelog"| P5
    P4 --> END

    %% ── Back Propagation ──
    S4 -.->|"브랜드 변경\n→ 토큰 재정의"| S3
    S6 -.->|"Spec 구조 문제\n→ 재설계"| S5
    S7 -.->|"구현 불가 패턴\n→ Spec 수정"| S5
    S8 -.->|"토큰 구조 결함\n→ 재정의"| S3
    S8 -.->|"Figma Spec 불명확\n→ 라이브러리 수정"| S7
    S9 -.->|"코드 오류 발견\n→ 코드 수정"| S8
    S10 -.->|"시각 회귀 실패\n→ 코드 수정"| S8
    S10 -.->|"구조적 결함\n→ Spec 재검토"| S5
    S11 -.->|"RFC 승인\n신규 컴포넌트"| S5
    S11 -.->|"토큰 확장 요청"| S3
    S11 -.->|"새 버전 배포 루프"| S8

    style P1 fill:#EEEDFE,stroke:#AFA9EC,color:#26215C
    style P2 fill:#E1F5EE,stroke:#5DCAA5,color:#04342C
    style P3 fill:#E6F1FB,stroke:#85B7EB,color:#042C53
    style P4 fill:#FAEEDA,stroke:#EF9F27,color:#412402
    style P5 fill:#FAECE7,stroke:#F0997B,color:#4A1B0C
    style COND fill:#F1EFE8,stroke:#888780
    style START fill:#F1EFE8,stroke:#888780
    style END fill:#EAF3DE,stroke:#639922,color:#173404
```

> **범례**  
> `──▶` 순방향 인계 흐름  
> `--▶` Back Propagation (문제 발생 시 역방향 수정)

---

## 2. Phase 1 — Discovery (발견)

> **핵심 분기점**: 현황이 있으면 Brownfield, 없으면 Greenfield.  
> Step①은 Brownfield에서만 필요하다. Greenfield는 Step②부터 시작한다.

### 2-0. 분기 조건 판단

```mermaid
flowchart TD
    Q{{"현황이 있는가?\n(기존 제품 · 코드 · 디자인 파일)"}}

    Q -->|"Yes — Brownfield\n기존 제품 · 레거시 존재"| BF
    Q -->|"No — Greenfield\n완전 신규 프로젝트"| GF

    subgraph BF["Brownfield 경로"]
        direction TB
        BF1["필수 Input\n- 기존 제품 화면 스크린샷\n- 기존 CSS / Figma / Sketch\n- 팀 인터뷰 (페인 포인트)"]
        BF2["→ Step① 현황 감사 실행\n→ Step② Charter"]
        BF1 --> BF2
    end

    subgraph GF["Greenfield 경로"]
        direction TB
        GF1["필수 Input\n- 브랜드 아이덴티티 문서\n- PRD (Product Requirements)\n- 타겟 유저 리서치\n- 경쟁사 벤치마킹\n- 기술 스택 결정사항"]
        GF2["→ Step① 건너뜀\n→ Step② Charter 바로 진입"]
        GF1 --> GF2
    end

    BF2 & GF2 --> NEXT["Step② 목표·범위 정의\n(공통 합류점)"]

    style BF fill:#EEEDFE,stroke:#AFA9EC,color:#26215C
    style GF fill:#E1F5EE,stroke:#5DCAA5,color:#04342C
    style NEXT fill:#F1EFE8,stroke:#888780
```

> **Greenfield 주의사항**  
> 현황이 없을수록 추상화 과잉 위험이 크다.  
> "미래에 필요할 것 같아서" 만드는 컴포넌트는 MVP에서 제외한다.  
> 실제 화면 3~5개를 먼저 설계하고, 반복되는 패턴만 컴포넌트로 추출하는 방식을 권장한다.

---

### 2-1. Step① 현황 감사 — Brownfield 전용

```mermaid
flowchart LR
    subgraph IN["📥 Input — Brownfield 전용"]
        direction TB
        I1["기존 제품 화면\n(스크린샷 · 실서비스)"]
        I2["기존 CSS / 디자인 파일\n(Figma · Sketch · 코드)"]
        I3["팀 인터뷰\n(페인 포인트 수집)"]
    end

    subgraph STEP["⚙️ Step① 현황 감사"]
        direction TB
        A1["전체 UI 수집 & 분류"]
        A2["중복·불일치 수치화\n(색상 N종 · 버튼 변형 N개)"]
        A3["기술 부채 시각화"]
        A4["컴포넌트 사용 빈도 분석\n(우선순위 도출)"]
        A1 --> A2 --> A3 --> A4
    end

    subgraph OUT["📤 Output → Step②의 Input"]
        direction TB
        O1["UI 인벤토리 스프레드시트"]
        O2["중복·불일치 리포트"]
        O3["우선순위 컴포넌트 목록"]
        O4["기술 부채 규모 추정"]
    end

    IN --> STEP --> OUT

    BP["⚠️ Back Propagation\n감사 중 범위가 너무 넓으면\nStep②에서 MVP 범위를\n강제로 좁혀 재조율"]
    OUT -.->|"범위 재협의"| BP

    style IN fill:#EEEDFE,stroke:#AFA9EC,color:#26215C
    style OUT fill:#EEEDFE,stroke:#AFA9EC,color:#26215C
    style STEP fill:#ffffff,stroke:#534AB7
    style BP fill:#FFF3CD,stroke:#EF9F27,color:#412402
```

---

### 2-2. Step② 목표·범위 정의 (공통 합류점)

```mermaid
flowchart LR
    subgraph IN_BF["📥 Input — Brownfield\n(← Step①의 Output)"]
        direction TB
        B1["UI 인벤토리"]
        B2["중복·불일치 리포트"]
        B3["기술 부채 규모"]
    end

    subgraph IN_GF["📥 Input — Greenfield\n(← 외부 리서치)"]
        direction TB
        G1["브랜드 아이덴티티 문서"]
        G2["PRD · 비즈니스 목표"]
        G3["경쟁사 벤치마킹"]
        G4["타겟 유저 리서치"]
    end

    subgraph COMMON["공통 Input (양쪽 모두)"]
        direction TB
        C1["팀 규모 · 기술 스택"]
        C2["비즈니스 로드맵"]
        C3["관리 주체 결정"]
    end

    subgraph STEP["⚙️ Step② 목표·범위 정의"]
        direction TB
        S1["브랜드 전략 (단일 vs 멀티)"]
        S2["지원 플랫폼 (Web·iOS·Android)"]
        S3["거버넌스 모델 결정\n(Core / Federated / Community)"]
        S4["MVP 범위 확정"]
        S1 & S2 & S3 --> S4
    end

    subgraph OUT["📤 Output → Phase 2의 Input"]
        direction TB
        O1["Design System Charter"]
        O2["MVP 범위 정의서"]
        O3["스쿼드 구성 · RACI"]
        O4["Roadmap 초안"]
    end

    IN_BF & IN_GF & COMMON --> STEP --> OUT

    style IN_BF fill:#EEEDFE,stroke:#AFA9EC,color:#26215C
    style IN_GF fill:#E1F5EE,stroke:#5DCAA5,color:#04342C
    style COMMON fill:#F1EFE8,stroke:#888780
    style OUT fill:#EEEDFE,stroke:#AFA9EC,color:#26215C
    style STEP fill:#ffffff,stroke:#534AB7
```

---

## 3. Phase 2 — Foundation (기반 구축)

> Charter를 기반으로 **디자인 언어의 원자 단위**를 정의한다.  
> 토큰이 불안정하면 이후 모든 단계가 흔들리므로 Back Propagation이 가장 빈번하게 발생하는 구간이다.

```mermaid
flowchart TB
    CARRY["🔗 Phase 1 인계\nCharter · MVP 범위 · RACI\n(Brownfield: +UI 인벤토리 · 우선순위 컴포넌트 목록)"]

    CARRY --> S3
    CARRY --> S4

    subgraph S3["⚙️ Step③ 디자인 토큰 정의"]
        direction LR
        T1["Primitive Token\n절대값 — #5C4EE5 · 16px · 8px"]
        T2["Semantic Token\n의미 — color-primary · spacing-md"]
        T3["Component Token\n역할 — button-bg · input-border"]
        T1 -->|"추상화"| T2 -->|"조합"| T3
    end

    subgraph S4["⚙️ Step④ 브랜드 가이드라인"]
        direction TB
        G1["색상 팔레트 (Primary · Semantic · Neutral)"]
        G2["타이포 스케일 (Display → Caption)"]
        G3["아이콘 원칙 (그리드 · 스트로크 · 스타일)"]
        G4["모션 원칙 (이징 커브 · Duration)"]
        G5["UX Writing 가이드 (톤 · 레이블 · 에러 문구)"]
    end

    subgraph OUT3["📤 Step③ Output → Phase 3 + Step⑧ Input"]
        O3A["토큰 명세서 (JSON · YAML)"]
        O3B["색상·간격·radius 스케일"]
        O3C["Figma Variables 셋업"]
    end

    subgraph OUT4["📤 Step④ Output → Phase 3 Input"]
        O4A["Brand Guidelines PDF"]
        O4B["타이포 스케일 Figma 파일"]
        O4C["아이콘 원칙 · 그리드"]
        O4D["UX Writing 가이드"]
    end

    S3 --> OUT3
    S4 --> OUT4

    %% Back Propagation
    S4 -.->|"⚠️ Back Propagation\n브랜드 방향 변경 시\n색상 팔레트가 바뀌면\nPrimitive Token 재정의 필요"| S3

    NEXT["🔗 Phase 3 인계\n토큰 명세서 · 브랜드 가이드라인 · UX Writing"]
    OUT3 & OUT4 --> NEXT

    style S3 fill:#E1F5EE,stroke:#5DCAA5,color:#04342C
    style S4 fill:#E1F5EE,stroke:#5DCAA5,color:#04342C
    style OUT3 fill:#E1F5EE,stroke:#5DCAA5,color:#04342C
    style OUT4 fill:#E1F5EE,stroke:#5DCAA5,color:#04342C
    style CARRY fill:#EEEDFE,stroke:#AFA9EC,color:#26215C
    style NEXT fill:#E6F1FB,stroke:#85B7EB,color:#042C53
```

> **토큰 3계층 원칙**  
> `Primitive` 절대값 → `Semantic` 의미 부여 → `Component` 역할 특정.  
> 다크모드·멀티 브랜드 전환 시 **Primitive만 교체**하면 Semantic·Component가 자동으로 따라온다.

---

## 4. Phase 3 — Build (컴포넌트 제작)

> 토큰과 가이드라인을 기반으로 **컴포넌트를 설계하고 Figma 라이브러리를 완성**한다.  
> Spec이 흔들리면 Step⑤로 돌아가는 Back Propagation이 Step⑥⑦ 모두에서 발생한다.

### 4-1. Step⑤ 컴포넌트 설계 (Atomic Design)

```mermaid
flowchart LR
    subgraph IN["📥 Input\n(← Phase 2 Output)"]
        direction TB
        I1["우선순위 컴포넌트 목록"]
        I2["토큰 명세서"]
        I3["브랜드 가이드라인"]
        I4["UX Writing 가이드"]
    end

    subgraph STEP["⚙️ Step⑤ Atomic Design"]
        direction TB
        AT["Atoms\nButton · Input · Icon · Badge · Typography"]
        MO["Molecules\nSearchBar · FormField · Card · Toast"]
        OR["Organisms\nNavBar · Modal · DataTable · SideBar"]
        TM["Templates\nPageLayout · DashboardLayout · AuthLayout"]
        AT -->|"조합"| MO -->|"조합"| OR -->|"조합"| TM
    end

    subgraph OUT["📤 Output → Step⑥⑦ Input"]
        direction TB
        O1["컴포넌트 Spec 문서\n(Anatomy · Props · 상태 정의)"]
        O2["상태 매트릭스\n(default·hover·focus·disabled·error·loading)"]
        O3["Do & Don't 예시"]
        O4["Anatomy 다이어그램"]
    end

    IN --> STEP --> OUT

    BP["⚠️ Back Propagation\n토큰에 없는 값이 필요해질 때\n→ Step③ 토큰 재정의로 역행"]
    OUT -.->|"토큰 부족"| BP

    style IN fill:#E6F1FB,stroke:#85B7EB,color:#042C53
    style OUT fill:#E6F1FB,stroke:#85B7EB,color:#042C53
    style STEP fill:#ffffff,stroke:#185FA5
    style BP fill:#FFF3CD,stroke:#EF9F27,color:#412402
```

---

### 4-2. Step⑥ 접근성 · 반응형 기준

```mermaid
flowchart LR
    subgraph IN["📥 Input\n(← Step⑤ Output)"]
        direction TB
        I1["컴포넌트 Spec 문서"]
        I2["WCAG 2.1 체크리스트"]
        I3["지원 디바이스 · 뷰포트 목록"]
    end

    subgraph STEP["⚙️ Step⑥ 접근성·반응형"]
        direction TB
        A1["색상 대비 검증\nAA 4.5:1 / AAA 7:1"]
        A2["키보드 탐색\nfocus-visible · Tab order · Escape"]
        A3["스크린리더\naria-label · role · landmark · live region"]
        A4["브레이크포인트 정의\nsm(640) · md(768) · lg(1024) · xl(1280)"]
        A5["반응형 동작 규칙\n컴포넌트별 축소·스택·숨김 처리"]
        A1 & A2 & A3 --> A4 --> A5
    end

    subgraph OUT["📤 Output → Step⑦ Input"]
        direction TB
        O1["a11y 체크리스트 (컴포넌트별)"]
        O2["브레이크포인트 토큰"]
        O3["반응형 동작 가이드"]
    end

    IN --> STEP --> OUT

    BP["⚠️ Back Propagation\na11y 검증 중 Spec 구조 자체에\n문제 발견 → Step⑤ Spec 재설계"]
    OUT -.->|"Spec 재설계 필요"| BP

    style IN fill:#E6F1FB,stroke:#85B7EB,color:#042C53
    style OUT fill:#E6F1FB,stroke:#85B7EB,color:#042C53
    style STEP fill:#ffffff,stroke:#185FA5
    style BP fill:#FFF3CD,stroke:#EF9F27,color:#412402
```

---

### 4-3. Step⑦ Figma 라이브러리 구축

```mermaid
flowchart LR
    subgraph IN["📥 Input\n(← Step⑤⑥ Output)"]
        direction TB
        I1["컴포넌트 Spec · Anatomy"]
        I2["a11y 가이드 · 반응형 가이드"]
        I3["Figma Variables (토큰)"]
        I4["UX Writing 가이드"]
    end

    subgraph STEP["⚙️ Step⑦ Figma 라이브러리"]
        direction TB
        F1["Variants 설정\n모든 상태·크기·테마·다크모드"]
        F2["Auto-layout 적용\n정렬·간격·패딩 자동화"]
        F3["Component Properties\n(Boolean · Instance swap · Text)"]
        F4["Annotation Kit 임베드\n(Spec 레드라인 · 마진 표기)"]
        F5["팀 라이브러리 퍼블리시"]
        F1 --> F2 --> F3 --> F4 --> F5
    end

    subgraph OUT["📤 Output → Phase 4 Input"]
        direction TB
        O1["Figma 컴포넌트 라이브러리"]
        O2["팀 라이브러리 퍼블리시 완료"]
        O3["Handoff Spec · 레드라인"]
    end

    IN --> STEP --> OUT

    BP["⚠️ Back Propagation\nFigma 구현 중 Spec이 현실과\n맞지 않는 패턴 발견\n→ Step⑤ Spec 수정 후 재작업"]
    OUT -.->|"Spec 불일치"| BP

    style IN fill:#E6F1FB,stroke:#85B7EB,color:#042C53
    style OUT fill:#E6F1FB,stroke:#85B7EB,color:#042C53
    style STEP fill:#ffffff,stroke:#185FA5
    style BP fill:#FFF3CD,stroke:#EF9F27,color:#412402
```

---

## 5. Phase 4 — Ship (배포)

> Figma 라이브러리를 **실제 동작하는 코드**로 구현하고, 문서화·배포를 완성한다.  
> Back Propagation이 가장 다양한 방향으로 발생하는 구간이다.

### 5-1. Step⑧ 코드 구현 · 토큰 연동

```mermaid
flowchart LR
    subgraph IN["📥 Input\n(← Phase 3 Output)"]
        direction TB
        I1["Figma 컴포넌트 라이브러리"]
        I2["토큰 명세서 (JSON/YAML)"]
        I3["컴포넌트 Spec 문서"]
        I4["기술 스택 요구사항"]
    end

    subgraph STEP["⚙️ Step⑧ 코드 구현"]
        direction TB
        C1["Style Dictionary\n토큰 → CSS변수·SCSS·JS 동시 출력"]
        C2["컴포넌트 개발\nReact / Vue / Web Components"]
        C3["단위 테스트\nJest · Vitest · Testing Library"]
        C4["Peer dependency 정의\n(React·Vue 버전 범위)"]
        C1 --> C2 --> C3
        C2 --> C4
    end

    subgraph OUT["📤 Output → Step⑨⑩ Input"]
        direction TB
        O1["CSS / JS 토큰 파일"]
        O2["컴포넌트 소스코드"]
        O3["단위 테스트 스위트"]
        O4["package.json · peerDeps"]
    end

    IN --> STEP --> OUT

    BP1["⚠️ Back Propagation A\nFigma Spec 불명확 · 구현 불가 패턴\n→ Step⑦ Figma 라이브러리 수정"]
    BP2["⚠️ Back Propagation B\n토큰 구조 결함 발견\n(예: 다크모드 대비값 누락)\n→ Step③ 토큰 재정의"]
    OUT -.->|"Spec 불명확"| BP1
    OUT -.->|"토큰 구조 문제"| BP2

    style IN fill:#FAEEDA,stroke:#EF9F27,color:#412402
    style OUT fill:#FAEEDA,stroke:#EF9F27,color:#412402
    style STEP fill:#ffffff,stroke:#854F0B
    style BP1 fill:#FFF3CD,stroke:#EF9F27,color:#412402
    style BP2 fill:#FFF3CD,stroke:#EF9F27,color:#412402
```

---

### 5-2. Step⑨ 문서화 (Storybook · 포털)

```mermaid
flowchart LR
    subgraph IN["📥 Input\n(← Step⑧ Output)"]
        direction TB
        I1["컴포넌트 소스코드"]
        I2["컴포넌트 Spec · Do/Don't"]
        I3["a11y 체크리스트"]
        I4["UX Writing 가이드"]
    end

    subgraph STEP["⚙️ Step⑨ 문서화"]
        direction TB
        D1["Storybook\n(Props · 상태 자동 문서화)"]
        D2["디자인 포털\n(Zeroheight · Supernova 등)"]
        D3["Migration 가이드\n기존 코드 → 신규 컴포넌트 대응표"]
        D4["Contribution Guide\n기여 방법 · 커밋 컨벤션 · PR 템플릿"]
        D1 & D2 & D3 & D4
    end

    subgraph OUT["📤 Output → Step⑩ Input"]
        direction TB
        O1["Storybook 사이트 (배포 URL)"]
        O2["디자인 시스템 포털"]
        O3["Migration 가이드 문서"]
        O4["CONTRIBUTING.md"]
    end

    IN --> STEP --> OUT

    BP["⚠️ Back Propagation\n문서화 과정에서 Props 설계 오류\n또는 예제 구현 불가 케이스 발견\n→ Step⑧ 코드 수정"]
    OUT -.->|"코드 오류 발견"| BP

    style IN fill:#FAEEDA,stroke:#EF9F27,color:#412402
    style OUT fill:#FAEEDA,stroke:#EF9F27,color:#412402
    style STEP fill:#ffffff,stroke:#854F0B
    style BP fill:#FFF3CD,stroke:#EF9F27,color:#412402
```

---

### 5-3. Step⑩ 배포 · QA · 버전 관리

```mermaid
flowchart LR
    subgraph IN["📥 Input\n(← Step⑧⑨ Output)"]
        direction TB
        I1["컴포넌트 소스코드"]
        I2["Storybook 스토리"]
        I3["단위 테스트 스위트"]
        I4["버전 정책 (SemVer)"]
    end

    subgraph STEP["⚙️ Step⑩ 배포·QA"]
        direction TB
        V1["시각 회귀 테스트\nChromatic (Storybook 기반)"]
        V2["접근성 자동 검사\naxe-core · Lighthouse CI"]
        V3["npm publish\n패키지 레지스트리 배포"]
        V4["SemVer 버전 관리\nPatch · Minor · Major 정책"]
        V5["CI/CD 파이프라인\nGitHub Actions · Changesets"]
        V6["Breaking Change 공지\nSlack · 포털 배너 · Release Note"]
        V1 & V2 --> V3 --> V4 --> V5 --> V6
    end

    subgraph OUT["📤 Output → Phase 5 Input"]
        direction TB
        O1["npm 패키지 (배포 완료)"]
        O2["Changelog · Release Note"]
        O3["CI/CD 파이프라인 구성"]
        O4["Breaking Change 공지"]
    end

    IN --> STEP --> OUT

    BP1["⚠️ Back Propagation A\n시각 회귀 테스트 실패\n기존 컴포넌트 깨짐 감지\n→ Step⑧ 코드 수정"]
    BP2["⚠️ Back Propagation B\n구조적 결함 발견\n아키텍처 수준 문제\n→ Step⑤ Spec 전면 재검토"]
    OUT -.->|"회귀 테스트 실패"| BP1
    OUT -.->|"구조적 결함"| BP2

    style IN fill:#FAEEDA,stroke:#EF9F27,color:#412402
    style OUT fill:#FAEEDA,stroke:#EF9F27,color:#412402
    style STEP fill:#ffffff,stroke:#854F0B
    style BP1 fill:#FFF3CD,stroke:#EF9F27,color:#412402
    style BP2 fill:#FFF3CD,stroke:#EF9F27,color:#412402
```

---

## 6. Phase 5 — Evolve (지속 운영)

> 배포 이후가 진짜 시작이다. **피드백을 구조화**해 시스템을 지속적으로 성장시킨다.  
> 이 Phase 자체가 하나의 거대한 Back Propagation 루프다.

```mermaid
flowchart TB
    CARRY["🔗 Phase 4 인계\nnpm 패키지 · Storybook · Changelog · CI/CD · 채택 데이터"]

    CARRY --> S11

    subgraph S11["⚙️ Step⑪ 거버넌스 · 지속 운영"]
        direction TB
        E1["RFC 프로세스\n신규 컴포넌트 제안 → 리뷰 → 승인 → 로드맵 반영"]
        E2["기여 가이드라인\n외부 팀 PR 기여 프로세스 · 코드 리뷰 기준"]
        E3["Deprecation 정책\n6개월 사전 공지 → Migration 가이드 → 삭제"]
        E4["채택률 측정\n전체 UI 중 DS 컴포넌트 사용 비율 추적"]
        E5["분기 Health Check\n기술 부채 · 미사용 컴포넌트 · 버전 편차 분석"]
        E1 --> E2
        E3 --> E4 --> E5
    end

    subgraph OUT["📤 Output"]
        direction TB
        O1["업데이트된 컴포넌트 · 토큰"]
        O2["거버넌스 문서 · RFC 로그"]
        O3["분기 Health Check 리포트"]
        O4["Roadmap 업데이트"]
    end

    S11 --> OUT

    %% Back Propagation from Evolve
    OUT -.->|"⚠️ RFC 승인\n신규 컴포넌트 추가\n→ Step⑤ Atomic 설계 재진입"| BP_S5["Step⑤\n컴포넌트 재설계"]
    OUT -.->|"⚠️ 토큰 확장 요청\n새 Semantic 값 필요\n→ Step③ 토큰 재정의"| BP_S3["Step③\n토큰 재정의"]
    OUT -.->|"⚠️ 새 버전 배포 루프\n수정된 컴포넌트\n→ Step⑧ 코드 구현"| BP_S8["Step⑧\n코드 구현"]

    style S11 fill:#FAECE7,stroke:#F0997B,color:#4A1B0C
    style OUT fill:#FAECE7,stroke:#F0997B,color:#4A1B0C
    style CARRY fill:#FAEEDA,stroke:#EF9F27,color:#412402
    style BP_S5 fill:#E6F1FB,stroke:#85B7EB,color:#042C53
    style BP_S3 fill:#E1F5EE,stroke:#5DCAA5,color:#04342C
    style BP_S8 fill:#FAEEDA,stroke:#EF9F27,color:#412402
```

> **거버넌스 모델 비교**
>
> | 모델      | 설명                      | 적합한 조직              |
> | --------- | ------------------------- | ------------------------ |
> | Core Team | 전담 DS 팀이 단독 관리    | 대규모 조직, 일관성 우선 |
> | Federated | 각 팀이 기여, Core가 검수 | 중규모, 속도·다양성 균형 |
> | Community | 완전 오픈 기여            | 오픈소스 · 스타트업      |

---

## 7. 전체 연결 흐름 + Back Propagation 요약

> 순방향 인계(`──▶`)와 Back Propagation(`--▶`)을 하나의 다이어그램으로 통합한다.

```mermaid
flowchart TD
    I0(["🏁 Zero"])

    COND{{"현황 있음?"}}
    I0 --> COND

    S1["① 현황 감사\nBrownfield 전용"]
    S2["② 목표·범위 정의"]
    S3["③ 디자인 토큰"]
    S4["④ 브랜드 가이드라인"]
    S5["⑤ 컴포넌트 설계"]
    S6["⑥ 접근성·반응형"]
    S7["⑦ Figma 라이브러리"]
    S8["⑧ 코드 구현"]
    S9["⑨ 문서화"]
    S10["⑩ 배포·QA"]
    S11["⑪ 거버넌스·운영"]
    END(["✅ 살아있는 디자인 시스템"])

    %% Forward
    COND -->|"Yes Brownfield"| S1
    COND -->|"No Greenfield"| S2
    S1 -->|"UI 인벤토리\n불일치 리포트"| S2
    S2 -->|"Charter\nMVP 범위"| S3
    S3 -->|"토큰 명세서"| S4
    S4 -->|"브랜드 가이드라인"| S5
    S5 -->|"Spec 문서\nAnatomy"| S6
    S6 -->|"a11y 체크리스트\n브레이크포인트"| S7
    S7 -->|"Figma 라이브러리\nHandoff Spec"| S8
    S8 -->|"소스코드\nCSS 토큰"| S9
    S9 -->|"Storybook\n마이그레이션 가이드"| S10
    S10 -->|"npm 패키지\nChangelog"| S11
    S11 --> END

    %% Back Propagation
    S4 -.->|"브랜드 변경\n→ 토큰 재정의"| S3
    S6 -.->|"Spec 구조 문제\n→ 재설계"| S5
    S7 -.->|"구현 불가 패턴\n→ Spec 수정"| S5
    S8 -.->|"토큰 구조 결함\n→ 재정의"| S3
    S8 -.->|"Spec 불명확\n→ Figma 수정"| S7
    S9 -.->|"코드 오류 발견\n→ 코드 수정"| S8
    S10 -.->|"시각 회귀 실패\n→ 코드 수정"| S8
    S10 -.->|"구조적 결함\n→ Spec 재검토"| S5
    S11 -.->|"RFC 승인\n→ 컴포넌트 추가"| S5
    S11 -.->|"토큰 확장\n→ 재정의"| S3
    S11 -.->|"새 버전 배포\n→ 코드 구현"| S8

    style S1 fill:#EEEDFE,stroke:#AFA9EC,color:#26215C
    style S2 fill:#EEEDFE,stroke:#AFA9EC,color:#26215C
    style S3 fill:#E1F5EE,stroke:#5DCAA5,color:#04342C
    style S4 fill:#E1F5EE,stroke:#5DCAA5,color:#04342C
    style S5 fill:#E6F1FB,stroke:#85B7EB,color:#042C53
    style S6 fill:#E6F1FB,stroke:#85B7EB,color:#042C53
    style S7 fill:#E6F1FB,stroke:#85B7EB,color:#042C53
    style S8 fill:#FAEEDA,stroke:#EF9F27,color:#412402
    style S9 fill:#FAEEDA,stroke:#EF9F27,color:#412402
    style S10 fill:#FAEEDA,stroke:#EF9F27,color:#412402
    style S11 fill:#FAECE7,stroke:#F0997B,color:#4A1B0C
    style I0 fill:#F1EFE8,stroke:#888780
    style END fill:#EAF3DE,stroke:#639922,color:#173404
    style COND fill:#F1EFE8,stroke:#888780
```

### Back Propagation 발생 조건 요약표

| 발생 위치     | 목적지           | 트리거 조건                                   | 영향 범위                  |
| ------------- | ---------------- | --------------------------------------------- | -------------------------- |
| Step④ → Step③ | 토큰 재정의      | 브랜드 방향 변경으로 색상 팔레트 교체         | 토큰 전체 재출력 필요      |
| Step⑥ → Step⑤ | Spec 재설계      | a11y 검증 중 구조적 문제 발견                 | 해당 컴포넌트 Spec 수정    |
| Step⑦ → Step⑤ | Spec 수정        | Figma에서 구현 불가 패턴 발견                 | Spec 일부 재작성           |
| Step⑧ → Step③ | 토큰 재정의      | 다크모드 대비값 누락 등 토큰 구조 결함        | CSS 토큰 파일 재출력       |
| Step⑧ → Step⑦ | Figma 수정       | Spec 불명확·핸드오프 오류                     | Figma 특정 컴포넌트 수정   |
| Step⑨ → Step⑧ | 코드 수정        | 문서화 중 Props 설계 오류 또는 예제 구현 불가 | 해당 컴포넌트 코드 수정    |
| Step⑩ → Step⑧ | 코드 수정        | 시각 회귀 테스트 실패                         | 회귀 발생 컴포넌트 수정    |
| Step⑩ → Step⑤ | Spec 전면 재검토 | 아키텍처 수준의 구조적 결함                   | 대규모 재작업 (Major 버전) |
| Step⑪ → Step⑤ | 컴포넌트 추가    | RFC 승인으로 신규 컴포넌트 결정               | Atomic 설계 재진입         |
| Step⑪ → Step③ | 토큰 확장        | 새 Semantic 토큰 요청 (예: 상태 색상 추가)    | 토큰 명세서 업데이트       |
| Step⑪ → Step⑧ | 새 버전 배포     | 수정·추가된 컴포넌트의 코드 구현 시작         | 정기 릴리스 루프           |

---

## 참고: 주요 도구 스택

| 카테고리         | 도구                                                 |
| ---------------- | ---------------------------------------------------- |
| 디자인           | Figma (라이브러리·Variants·Variables·Annotation Kit) |
| 토큰 관리        | Style Dictionary, Theo                               |
| 토큰 싱크        | Token Studio, Figma Tokens                           |
| 컴포넌트 개발    | React, Vue, Stencil (Web Components)                 |
| 문서화           | Storybook, Zeroheight, Supernova                     |
| 시각 회귀 테스트 | Chromatic, Percy                                     |
| 접근성 검사      | axe-core, Lighthouse CI, WAVE                        |
| 배포             | npm, GitHub Packages                                 |
| 버전 관리        | Changesets, semantic-release                         |
| CI/CD            | GitHub Actions, CircleCI                             |

---

_디자인 시스템은 완성형이 아니라 지속적으로 진화하는 살아있는 제품이다._  
_Back Propagation은 실패가 아니라 시스템이 건강하게 작동하고 있다는 신호다._
