디자인 시스템 구축 파이프라인을 실행한다.

## 사전 준비

1. CLAUDE.md를 읽고 프로젝트 컨텍스트를 파악한다
2. .claude/agents/ds-orchestrator.md를 읽고 오케스트레이터 역할을 수행한다

## 실행 절차

1. **Greenfield/Brownfield 판단**: 기존 코드베이스에 UI가 존재하는가?
   - Yes → Phase 1 Step① 현황 감사부터
   - No → Phase 1 Step② 목표·범위 정의부터

2. **각 Phase에서 서브에이전트 호출**:
   - 해당 에이전트의 `.claude/agents/{agent}.md` 파일을 Read 도구로 읽는다
   - Agent 도구를 사용하여 서브에이전트를 생성한다
   - 프롬프트: 에이전트 파일 내용 + 현재 컨텍스트(프로젝트명, 이전 Phase 산출물 경로)
   - 서브에이전트 완료 후 산출물이 지정 출력 경로에 생성되었는지 확인한다

3. **각 Phase 완료 시 승인 게이트 실행**:
   - 자동 검증: CLAUDE.md의 게이트 기준 체크
   - 인간 승인: 사용자에게 검토 항목 + 산출물 요약을 제시하고 승인 요청
   - 승인 → 다음 Phase 인계
   - 반려 → 사유를 docs/gate-reviews/에 기록 후 Back Propagation

4. **Back Propagation 발생 시**:
   - CLAUDE.md의 Back Propagation 테이블에 따라 해당 Step으로 역행
   - 최대 3회 재시도, 초과 시 에스컬레이션

5. **Phase 5 완료 시**: Completed Outputs 전체 확인

## 실행 순서

```
Phase 1: Discovery
  ├─ Brownfield? → auditor 호출 (현황 감사)
  └─ planner 호출 (Charter, MVP 범위)
  └─ Gate 1 승인

Phase 2: Foundation
  ├─ token-engineer 호출 (토큰 3계층)
  ├─ brand-designer 호출 (브랜드 가이드라인)
  └─ Gate 2 승인

Phase 3: Build
  ├─ ui-architect 호출 (Atomic Design Spec)
  ├─ a11y-engineer 호출 (접근성·반응형)
  ├─ visual-archivist 호출 (시각 Spec)
  └─ Gate 3 승인

Phase 4: Ship
  ├─ component-developer 호출 (코드 구현)
  ├─ doc-engineer 호출 (문서화)
  ├─ release-engineer 호출 (배포·QA)
  └─ Gate 4 승인

Phase 5: Evolve
  └─ governance-manager 호출 (거버넌스)
  └─ Gate 5 승인
```
