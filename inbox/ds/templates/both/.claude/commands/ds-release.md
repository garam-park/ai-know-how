컴포넌트 패키지를 배포 준비한다.

## 실행 절차

1. `.claude/agents/release-engineer.md`를 읽는다
2. Agent 도구로 release-engineer 서브에이전트를 생성한다
3. 프롬프트에 에이전트 파일 내용 + packages/ 경로를 컨텍스트로 포함한다

## 배포 체크리스트

1. 단위 테스트 100% 통과 확인
2. 시각 회귀 테스트: `bash scripts/tools/playwright-visual-test.sh`
3. SemVer 버전 결정 (Breaking Change 시 Major)
4. CI/CD 파이프라인 구성 (.github/workflows/)
5. Changelog 작성
6. Breaking Change 영향 분석 및 Migration 가이드 확인
7. 사용자에게 배포 승인 요청

## 산출물

- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `.github/workflows/visual-regression.yml`
- `CHANGELOG.md`
- `docs/portal/release-notes.md`
