기존 UI 현황 감사를 실행한다.

## 실행 절차

1. `.claude/agents/auditor.md`를 읽는다
2. Agent 도구로 auditor 서브에이전트를 생성한다
3. 프롬프트에 에이전트 파일 내용 + 프로젝트 컨텍스트를 포함한다

## 감사 항목

1. src/ 디렉토리의 모든 CSS/컴포넌트/디자인 파일 수집
2. 중복·불일치 수치화 (색상 N종, 버튼 변형 N개 등)
3. 기술 부채 시각화
4. 컴포넌트 사용 빈도 분석 → 우선순위 도출

## 산출물

결과를 `docs/audit/`에 출력:
- `ui-inventory.md` — UI 인벤토리 스프레드시트
- `duplication-report.md` — 불일치 리포트
- `priority-list.md` — 우선순위 목록
- `tech-debt.md` — 기술 부채 추정
