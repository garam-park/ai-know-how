#!/usr/bin/env bash
set -euo pipefail

# Style Dictionary 기반 토큰 변환
# 사용법: token-gen.sh <source-json> <platforms-csv> <output-dir>
# 예시:   token-gen.sh packages/tokens/tokens.json css,scss,js packages/tokens/dist

if [ $# -lt 3 ]; then
  echo "사용법: $0 <source-json> <platforms-csv> <output-dir>"
  echo "예시:   $0 packages/tokens/tokens.json css,scss,js packages/tokens/dist"
  exit 1
fi

SOURCE="$1"
PLATFORMS="$2"
OUTPUT="$3"

if [ ! -f "$SOURCE" ]; then
  echo "오류: 소스 파일을 찾을 수 없습니다: $SOURCE"
  exit 1
fi

mkdir -p "$OUTPUT"

# 플랫폼별 Style Dictionary 설정 생성
IFS=',' read -ra PLATFORM_LIST <<< "$PLATFORMS"

CONFIG=$(cat <<JSONEOF
{
  "source": ["$SOURCE"],
  "platforms": {
JSONEOF
)

FIRST=true
for PLATFORM in "${PLATFORM_LIST[@]}"; do
  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    CONFIG+=","
  fi

  case "$PLATFORM" in
    css)
      CONFIG+=$(cat <<JSONEOF

    "css": {
      "transformGroup": "css",
      "buildPath": "$OUTPUT/css/",
      "files": [{ "destination": "tokens.css", "format": "css/variables" }]
    }
JSONEOF
)
      ;;
    scss)
      CONFIG+=$(cat <<JSONEOF

    "scss": {
      "transformGroup": "scss",
      "buildPath": "$OUTPUT/scss/",
      "files": [{ "destination": "_tokens.scss", "format": "scss/variables" }]
    }
JSONEOF
)
      ;;
    js)
      CONFIG+=$(cat <<JSONEOF

    "js": {
      "transformGroup": "js",
      "buildPath": "$OUTPUT/js/",
      "files": [{ "destination": "tokens.js", "format": "javascript/es6" }]
    }
JSONEOF
)
      ;;
    android)
      CONFIG+=$(cat <<JSONEOF

    "android": {
      "transformGroup": "android",
      "buildPath": "$OUTPUT/android/",
      "files": [{ "destination": "tokens.xml", "format": "android/resources" }]
    }
JSONEOF
)
      ;;
    ios)
      CONFIG+=$(cat <<JSONEOF

    "ios": {
      "transformGroup": "ios-swift",
      "buildPath": "$OUTPUT/ios/",
      "files": [{ "destination": "Tokens.swift", "format": "ios-swift/class.swift" }]
    }
JSONEOF
)
      ;;
    *)
      echo "경고: 지원하지 않는 플랫폼: $PLATFORM (css, scss, js, android, ios 중 선택)"
      ;;
  esac
done

CONFIG+="
  }
}"

# 임시 설정 파일 생성 후 빌드
TMPCONFIG=$(mktemp /tmp/sd-config.XXXXXX.json)
echo "$CONFIG" > "$TMPCONFIG"

echo "Style Dictionary 빌드 실행 중..."
npx style-dictionary build --config "$TMPCONFIG"

rm -f "$TMPCONFIG"

echo "완료: $OUTPUT"
ls -la "$OUTPUT"/*/
