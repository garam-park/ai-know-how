#!/usr/bin/env bash
set -euo pipefail

# axe-core 기반 접근성 검사
# 사용법: a11y-check.sh <target-url> [level]
# 예시:   a11y-check.sh http://localhost:6006 AA
#         a11y-check.sh ./storybook-static AAA

if [ $# -lt 1 ]; then
  echo "사용법: $0 <target-url> [level]"
  echo "  level: A, AA (기본값), AAA"
  exit 1
fi

TARGET="$1"
LEVEL="${2:-AA}"

# 레벨을 axe 태그로 변환
case "$LEVEL" in
  A)   TAGS="wcag2a" ;;
  AA)  TAGS="wcag2a,wcag2aa" ;;
  AAA) TAGS="wcag2a,wcag2aa,wcag2aaa" ;;
  *)   echo "오류: 레벨은 A, AA, AAA 중 하나여야 합니다."; exit 1 ;;
esac

echo "접근성 검사 실행: $TARGET (WCAG $LEVEL)"
echo "---"

npx @axe-core/cli "$TARGET" --tags "$TAGS" --reporter json 2>/dev/null | \
  node -e "
    const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
    const violations = data[0]?.violations || [];
    const passes = data[0]?.passes || [];

    console.log('결과 요약:');
    console.log('  통과: ' + passes.length + '건');
    console.log('  위반: ' + violations.length + '건');
    console.log('');

    if (violations.length > 0) {
      console.log('위반 항목:');
      violations.forEach((v, i) => {
        console.log('  ' + (i+1) + '. [' + v.impact + '] ' + v.description);
        console.log('     규칙: ' + v.id);
        console.log('     대상: ' + v.nodes.length + '개 요소');
      });
      process.exit(1);
    } else {
      console.log('모든 검사 통과');
    }
  "
