---
name: design-system-build
description: 디자인 시스템 구축 전체 파이프라인 — Zero → Completed Outputs, 승인 게이트 포함, Back Propagation 포함
---

## 파이프라인 개요

Greenfield/Brownfield 판단 → 5개 Phase 순차 진행 → 각 Phase 완료 시 승인 게이트 → Completed Outputs

## 승인 게이트 기준

### Gate 1: Discovery 완료 후

**자동 검증**

- UI 인벮토리 커버리지: 기존 화면 100% 수집
- 중복 수치화 완료: 색상/버튼/입력폼 변형 개수 명시
- Charter 필수 요소: 목적, 범위, 비범위, 성공 지표, 일정 포함

**인간 승인**

- MVP 범위: "이 범위로 1차 출시 가능한가?" — 스테이크홀더 서명
- 거버넌스 모델: "선택 근거가 명확한가?" — 운영 조직 동의
- 우선순위: "Top 5 컴포넌트가 비즈니스 가치와 일치하는가?" — PO 확인

**실패 시**: Charter 재작성 → 재검토 (최대 3회)

---

### Gate 2: Foundation 완료 후

**자동 검증**

- 토큰 3계층 참조 무결성: Semantic→Primitive, Component→Semantic 참조, 순환 참조 없음
- Style Dictionary 빌드 성공: CSS 변수/SCSS/JS 3개 플랫폼 출력
- 색상 대비 AA 통과: 모든 텍스트 조합 4.5:1 이상
- 타이포 스케일 일관성: 최소 5단계, 1.25배수 비율

**인간 승인**

- Primitive 토큰: "절대값이 브랜드 아이덴티티와 일치하는가?" — 디자인 리드
- Semantic 네이밍: "이름이 직관적인가?" — 프론트엔드 리드
- 브랜드 가이드라인: "다크모드·멀티브랜드 확장 시 Primitive 교체만으로 대응 가능한가?" — 코어 팀

**실패 시**: 토큰 구조 문제 → Step③, 브랜드 불일치 → Step④

---

### Gate 3: Build 완료 후

**자동 검증**

- Spec completeness: Anatomy, Props 타입, 상태 매트릭스(6종), Do/Don't 모두 존재
- a11y WCAG 2.1 AA: keyboard, aria, focus, contrast 모두 통과
- 반응형 브레이크포인트: sm(640)/md(768)/lg(1024)/xl(1280) 4단계 정의
- Visual Spec: 모든 상태 × 크기 조합 Storybook 스토리 존재

**인간 승인**

- 컴포넌트 API: "Props 인터페이스가 직관적이고 확장 가능한가?" — 프론트엔드 리드
- Visual Spec 품질: "Storybook 렌더링이 디자인 의도와 일치하는가?" — 디자인 리드
- UX Writing: "에러 메시지, 레이블이 가이드라인 톤과 일치하는가?" — UX 라이터

**실패 시**: Spec 구조 문제 → Step⑤, a11y 위반 → Step⑥, Visual Spec 불일치 → Step⑦

---

### Gate 4: Ship 완료 후

**자동 검증**

- 단위 테스트 통과율: 100%
- 시각 회귀 테스트: Chromatic 변경 없음 또는 승인된 변경만
- 빌드 성공: npm pack, Storybook 빌드 오류 없음
- SemVer 준수: Breaking Change → Major, Feature → Minor, Fix → Patch
- Peer dependency: React/Vue 버전 범위 명시, 충돌 없음

**인간 승인**

- 배포 결정: "Breaking Change 영향 분석 완료? Migration 가이드 충분?" — 테크 리드
- 문서 완성도: "Storybook에서 모든 Props, 상태, 예제 확인 가능한가?" — 개발 팀 대표
- Changelog: "변경 사항이 사용자 관점에서 명확한가?" — 릴리스 매니저

**실패 시**: 테스트 실패 → Step⑧, 시각 회귀 실패 → Step⑧, 구조적 결함 → Step⑤

---

### Gate 5: Evolve (분기별)

**자동 검증**

- 채택률: 전체 UI 중 DS 컴포넌트 사용 비율 70% 이상
- 미사용 컴포넌트: 6개월간 import 0회 식별 완료
- 버전 편차: 모든 프로젝트 최신 Major 버전 사용
- 기술 부채: open issue 중 P0/P1 0건

**인간 승인**

- RFC 승인: "신규 컴포넌트가 MVP 범위 내? 중복 없는가?" — 코어 팀 투표 (과반수 찬성)
- Deprecation 결정: "6개월 공지 완료? Migration 가이드 제공? 대체 컴포넌트 존재?" — 코어 팀 만장일치
- Health Check 리포트: "개선 액션 아이템이 로드맵에 반영되었는가?" — DS 팀 리드

**실패 시**: RFC 승인 → Step⑤, 토큰 확장 → Step③, 새 버전 → Step⑧

---

## 승인 상태 정의

| 상태        | 의미                             | 조치                          |
| ----------- | -------------------------------- | ----------------------------- |
| approved    | 모든 기준 충족                   | 다음 Phase 진행               |
| conditional | 경미한 이슈 존재, 병행 수정 가능 | 이슈 티켓 생성, 데드라인 설정 |
| rejected    | 중대 이슈, 진행 불가             | Back Propagation, 재검토      |

## 에스컬레이션 규칙

| 상황                                           | 조치                              |
| ---------------------------------------------- | --------------------------------- |
| 동일 게이트 3회 연속 rejected                  | 작업 중단, 인간 개입 필수         |
| Conditional 승인 후 데드라인 내 미수정         | 다음 게이트에서 자동으로 rejected |
| Breaking Change 배포 시 영향 프로젝트 5개 이상 | 특별 검토 위원회 소집             |

## Back Propagation 재라우팅 테이블

| 트리거              | 역행 대상         | 조치                       |
| ------------------- | ----------------- | -------------------------- |
| 브랜드 방향 변경    | Step③ 토큰        | token-engineer 재호출      |
| a11y 구조 문제      | Step⑤ Spec        | ui-architect 재설계        |
| Visual Spec 불명확  | Step⑤ Spec        | ui-architect Spec 수정     |
| 토큰 구조 결함      | Step③ 토큰        | token-engineer 재정의      |
| Spec 불명확         | Step⑦ Visual Spec | visual-archivist 수정      |
| 문서화 중 코드 오류 | Step⑧ 코드        | component-developer 수정   |
| 시각 회귀 실패      | Step⑧ 코드        | component-developer 수정   |
| 구조적 결함         | Step⑤ Spec        | ui-architect 전면 재검토   |
| RFC 승인            | Step⑤ 컴포넌트    | ui-architect 추가 설계     |
| 토큰 확장 요청      | Step③ 토큰        | token-engineer 업데이트    |
| 새 버전 배포        | Step⑧ 코드        | component-developer 재진입 |

## 승인 이력 기록 형식

모든 게이트 결과를 docs/gate-reviews/에 기록:

```markdown
# Gate {N}: {Phase명} 검토

- Date: YYYY-MM-DD
- Reviewer: {이름}
- Status: approved | rejected | conditional
- Auto-check results: {항목별 통과/실패}
- Comments: {의견}
- Resolution: {재검토 시 조치 내용}
```
