#!/usr/bin/env bash
set -euo pipefail

# Playwright 시각 테스트 설정값 출력
# 사용법: test-config.sh
# 다른 스크립트에서 참조: eval "$(bash scripts/tools/test-config.sh --export)"

if [ "${1:-}" = "--export" ]; then
  # 쉘 변수로 내보내기
  cat <<'EOF'
VIEWPORT_MOBILE_W=375
VIEWPORT_MOBILE_H=812
VIEWPORT_TABLET_W=768
VIEWPORT_TABLET_H=1024
VIEWPORT_DESKTOP_W=1280
VIEWPORT_DESKTOP_H=720
BROWSERS="chromium"
DEFAULT_THRESHOLD=0.02
DEFAULT_VIEWPORTS="desktop"
STORYBOOK_URL="${STORYBOOK_URL:-http://localhost:6006}"
EOF
else
  # JSON 형식 출력
  cat <<'EOF'
{
  "viewports": {
    "mobile": { "width": 375, "height": 812, "deviceScaleFactor": 2 },
    "tablet": { "width": 768, "height": 1024, "deviceScaleFactor": 2 },
    "desktop": { "width": 1280, "height": 720, "deviceScaleFactor": 1 }
  },
  "browsers": ["chromium"],
  "defaultThreshold": 0.02,
  "defaultViewports": ["desktop"],
  "storybookUrl": "${STORYBOOK_URL:-http://localhost:6006}"
}
EOF
fi
