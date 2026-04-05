디자인 토큰을 3계층으로 정의한다.

## 실행 절차

1. `.claude/agents/token-engineer.md`를 읽는다
2. Agent 도구로 token-engineer 서브에이전트를 생성한다
3. 프롬프트에 에이전트 파일 내용 + docs/charter/, docs/brand/ 경로를 컨텍스트로 포함한다

## 토큰 구조

1. **Primitive Token**: 절대값 (#5C4EE5, 16px, 8px 등)
2. **Semantic Token**: 의미 부여 (color-primary, spacing-md)
3. **Component Token**: 역할 특정 (button-bg, input-border)

## 산출물

- `docs/tokens/` — JSON/YAML 명세서
- `packages/tokens/` — Style Dictionary 소스 파일

다크모드·멀티브랜드 확장 시 Primitive만 교체하면 자동 대응 가능한 구조로 설계한다.

## 빌드 확인

토큰 생성 후 Style Dictionary 빌드를 실행한다:
```bash
bash scripts/tools/token-gen.sh packages/tokens/tokens.json css,scss,js packages/tokens/dist
```
