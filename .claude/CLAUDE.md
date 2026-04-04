# 워크스페이스 핵심 규칙

## 구조

이 워크스페이스는 PARA 시스템으로 구성된다.

````text
Projects/    # 완료 시점이 있는 활성 작업
Areas/       # 종료 시점 없는 지속적 책임
Resources/   # 완료되었거나 참고용 자료
Archive/     # 비활성, 더 이상 사용하지 않는 것
```text

## 네이밍 규칙

```text
[category]_[subject-detail]

예) learn_airflow-core / cert_SQLD-prep / build_portfolio-site
```text

- DO: 소문자 ASCII, 카테고리 구분 `_`, 단어 구분 `-`
- DO: 약어는 대문자 허용 (SQLD, AWS 등)
- DO NOT: 한글, 공백, camelCase 사용

## 상세 컨벤션 참조

Prefix 세트, 프로젝트 내부 구조, 라이프사이클 등 상세 규칙이 필요할 때:

```text
@.claude/rules/para-convention.md
```text

## 모를 때

- DO: 사용자에게 확인
- DO NOT: 임의로 추측하거나 새 구조 생성
````
