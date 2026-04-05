#!/usr/bin/env bash
set -euo pipefail

# Storybook 컴포넌트 스크린샷 수집
# 사용법: storybook-snapshot.sh <storybook-url> <output-dir> [components]
# 예시:   storybook-snapshot.sh http://localhost:6006 docs/visual-spec/snapshots
#         storybook-snapshot.sh http://localhost:6006 docs/visual-spec/snapshots Button,Input,Modal

if [ $# -lt 2 ]; then
  echo "사용법: $0 <storybook-url> <output-dir> [components]"
  echo "예시:   $0 http://localhost:6006 docs/visual-spec/snapshots Button,Input"
  exit 1
fi

STORYBOOK_URL="$1"
OUTPUT_DIR="$2"
COMPONENTS="${3:-}"

mkdir -p "$OUTPUT_DIR"

echo "Storybook 스크린샷 수집"
echo "  URL: $STORYBOOK_URL"
echo "  출력: $OUTPUT_DIR"
[ -n "$COMPONENTS" ] && echo "  컴포넌트: $COMPONENTS"
echo "---"

# storycap을 사용하여 스크린샷 수집
ARGS=("$STORYBOOK_URL" "--outDir" "$OUTPUT_DIR")

if [ -n "$COMPONENTS" ]; then
  IFS=',' read -ra COMP_LIST <<< "$COMPONENTS"
  for COMP in "${COMP_LIST[@]}"; do
    ARGS+=("--include" "**/${COMP}*")
  done
fi

npx storycap "${ARGS[@]}"

echo "---"
echo "완료. 수집된 스크린샷:"
find "$OUTPUT_DIR" -name "*.png" -type f | wc -l | xargs echo "  총"
