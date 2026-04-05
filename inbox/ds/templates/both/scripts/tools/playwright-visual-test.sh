#!/usr/bin/env bash
set -euo pipefail

# Playwright 기반 시각 회귀 테스트 — 로컬 실행, 외부 전송 없음
# 사용법: playwright-visual-test.sh <storybook-url> [options]
# 옵션:
#   --update              베이스라인 업데이트 모드
#   --threshold <0~1>     픽셀 차이 임계치 (기본값: 0.02)
#   --viewports <list>    뷰포트 (desktop,mobile,tablet) (기본값: desktop)
#   --components <list>   대상 컴포넌트 (기본값: 전체)

if [ $# -lt 1 ]; then
  echo "사용법: $0 <storybook-url> [options]"
  echo ""
  echo "옵션:"
  echo "  --update              베이스라인 업데이트"
  echo "  --threshold <0~1>     픽셀 차이 임계치 (기본값: 0.02)"
  echo "  --viewports <list>    뷰포트 목록 (기본값: desktop)"
  echo "  --components <list>   대상 컴포넌트 (기본값: 전체)"
  exit 1
fi

STORYBOOK_URL="$1"
shift

UPDATE=false
THRESHOLD="0.02"
VIEWPORTS="desktop"
COMPONENTS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --update)
      UPDATE=true
      shift
      ;;
    --threshold)
      THRESHOLD="$2"
      shift 2
      ;;
    --viewports)
      VIEWPORTS="$2"
      shift 2
      ;;
    --components)
      COMPONENTS="$2"
      shift 2
      ;;
    *)
      echo "알 수 없는 옵션: $1"
      exit 1
      ;;
  esac
done

# Storybook 정적 빌드 확인
if [[ ! "$STORYBOOK_URL" =~ ^http ]] && [ ! -d "$STORYBOOK_URL" ]; then
  echo "Storybook 빌드 실행 중..."
  npm run build-storybook 2>/dev/null || true
fi

# 환경변수 설정
export STORYBOOK_URL
export VISUAL_THRESHOLD="$THRESHOLD"
export VISUAL_VIEWPORTS="$VIEWPORTS"
export VISUAL_COMPONENTS="$COMPONENTS"

# Playwright 실행
if [ "$UPDATE" = true ]; then
  echo "베이스라인 업데이트 모드"
  npx playwright test visual --update-snapshots
else
  echo "시각 회귀 테스트 실행"
  echo "  URL: $STORYBOOK_URL"
  echo "  임계치: ${THRESHOLD}"
  echo "  뷰포트: ${VIEWPORTS}"
  [ -n "$COMPONENTS" ] && echo "  컴포넌트: ${COMPONENTS}"
  echo "---"
  npx playwright test visual
fi
