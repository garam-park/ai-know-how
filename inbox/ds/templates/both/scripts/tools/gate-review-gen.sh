#!/usr/bin/env bash
set -euo pipefail

# Gate 시각적 리뷰 HTML 생성
# 사용법: gate-review-gen.sh <gate-number> [--data <json-file>]
# 예시:   gate-review-gen.sh 2
#         gate-review-gen.sh 2 --data docs/tokens/gate2-data.json
#
# Gate 2는 packages/tokens/tokens.json을 자동 읽음
# 기타 Gate는 --data로 JSON 데이터 전달 또는 기본 빈 객체 사용

if [ $# -lt 1 ]; then
  echo "사용법: $0 <gate-number> [--data <json-file>]"
  echo ""
  echo "예시:"
  echo "  $0 2                              # Gate 2 (tokens.json 자동 읽음)"
  echo "  $0 1 --data docs/audit/data.json  # Gate 1 (커스텀 데이터)"
  echo ""
  echo "출력: docs/gate-reviews/gate-{N}-review_v{attempt}_{date}.html"
  exit 1
fi

GATE_NUM="$1"
shift

DATA_FILE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --data) DATA_FILE="$2"; shift 2 ;;
    *) echo "알 수 없는 옵션: $1"; exit 1 ;;
  esac
done

# 유효성 검증
if [[ ! "$GATE_NUM" =~ ^[1-5]$ ]]; then
  echo "오류: gate-number는 1~5 사이여야 합니다."
  exit 1
fi

# 경로 설정
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/../gate-templates"
TEMPLATE_FILE="$TEMPLATE_DIR/gate-${GATE_NUM}-review.html"
SHARED_CSS_FILE="$TEMPLATE_DIR/_shared.css"
OUTPUT_DIR="docs/gate-reviews"
TODAY=$(date +%Y%m%d)

# 템플릿 존재 확인
if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "오류: 템플릿을 찾을 수 없습니다: $TEMPLATE_FILE"
  exit 1
fi

if [ ! -f "$SHARED_CSS_FILE" ]; then
  echo "오류: 공통 CSS를 찾을 수 없습니다: $SHARED_CSS_FILE"
  exit 1
fi

# 출력 디렉토리 생성
mkdir -p "$OUTPUT_DIR"

# 버전 자동 감지 (기존 파일 개수 + 1)
EXISTING=$(find "$OUTPUT_DIR" -maxdepth 1 -name "gate-${GATE_NUM}-review_v*.html" 2>/dev/null | wc -l | tr -d ' ')
NEXT_VERSION=$((EXISTING + 1))
OUTPUT_FILE="$OUTPUT_DIR/gate-${GATE_NUM}-review_v${NEXT_VERSION}_${TODAY}.html"

# 이전 버전 네비게이션 생성
VERSION_NAV=""
if [ "$NEXT_VERSION" -gt 1 ]; then
  PREV_VERSION=$((NEXT_VERSION - 1))
  PREV_FILES=$(ls "$OUTPUT_DIR"/gate-"${GATE_NUM}"-review_v"${PREV_VERSION}"_*.html 2>/dev/null || echo "")
  if [ -n "$PREV_FILES" ]; then
    PREV_FILE=$(basename "$PREV_FILES" | head -1)
    VERSION_NAV="<a href=\"${PREV_FILE}\">← v${PREV_VERSION}</a>"
  fi
fi

# 프로젝트명 추출 (CLAUDE.md 또는 README.md에서)
PROJECT_NAME="Design System"
if [ -f "CLAUDE.md" ]; then
  FOUND=$(head -1 CLAUDE.md | sed 's/^# //' | sed 's/ 디자인 시스템//')
  [ -n "$FOUND" ] && PROJECT_NAME="$FOUND"
elif [ -f "README.md" ]; then
  FOUND=$(head -1 README.md | sed 's/^# //' | sed 's/ 디자인 시스템//')
  [ -n "$FOUND" ] && PROJECT_NAME="$FOUND"
fi

# 데이터 JSON 준비
if [ "$GATE_NUM" = "2" ] && [ -z "$DATA_FILE" ]; then
  # Gate 2: tokens.json 자동 읽기
  if [ -f "packages/tokens/tokens.json" ]; then
    DATA_JSON=$(cat "packages/tokens/tokens.json")
  else
    echo "경고: packages/tokens/tokens.json을 찾을 수 없습니다. 빈 데이터 사용."
    DATA_JSON='{}'
  fi
elif [ -n "$DATA_FILE" ]; then
  if [ ! -f "$DATA_FILE" ]; then
    echo "오류: 데이터 파일을 찾을 수 없습니다: $DATA_FILE"
    exit 1
  fi
  DATA_JSON=$(cat "$DATA_FILE")
else
  DATA_JSON='{}'
fi

# CSS 인라인 읽기
SHARED_CSS=$(cat "$SHARED_CSS_FILE")

echo "Gate ${GATE_NUM} 리뷰 HTML 생성 중..."
echo "  버전: v${NEXT_VERSION}"
echo "  날짜: ${TODAY}"

# node로 플레이스홀더 치환 (JSON 안전 처리)
DATA_FILE_TMP=$(mktemp /tmp/gate-data.XXXXXX.json)
echo "$DATA_JSON" > "$DATA_FILE_TMP"

PLACEHOLDER="TOKENS_JSON"
[ "$GATE_NUM" != "2" ] && PLACEHOLDER="GATE_DATA_JSON"

node -e "
  const fs = require('fs');
  let html = fs.readFileSync('$TEMPLATE_FILE', 'utf8');
  const css = fs.readFileSync('$SHARED_CSS_FILE', 'utf8');
  const data = fs.readFileSync('$DATA_FILE_TMP', 'utf8').trim();

  html = html.replace('{{SHARED_CSS}}', css);
  html = html.replaceAll('{{PROJECT_NAME}}', '$PROJECT_NAME');
  html = html.replaceAll('{{ATTEMPT}}', '$NEXT_VERSION');
  html = html.replaceAll('{{DATE}}', '$TODAY');
  html = html.replace('{{VERSION_NAV}}', \`$VERSION_NAV\`);
  html = html.replace('{{${PLACEHOLDER}}}', data);

  fs.writeFileSync('$OUTPUT_FILE', html);
"

rm -f "$DATA_FILE_TMP"

echo "---"
echo "완료: $OUTPUT_FILE"
echo "브라우저에서 열기: open $OUTPUT_FILE"
