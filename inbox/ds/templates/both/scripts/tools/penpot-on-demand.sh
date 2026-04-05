#!/usr/bin/env bash
set -euo pipefail

# Penpot 시안 On-Demand 생성
# 사용법: penpot-on-demand.sh <action> [options]
# 액션:
#   create-file   --project <name> --snapshots <dir>
#   update-file   --file-id <id> --snapshots <dir>
#   export-link   --file-id <id>
#   sync-feedback --file-id <id> --feedback-url <url>

if [ $# -lt 1 ]; then
  echo "사용법: $0 <action> [options]"
  echo ""
  echo "액션:"
  echo "  create-file   --project <name> --snapshots <dir>"
  echo "  update-file   --file-id <id> --snapshots <dir>"
  echo "  export-link   --file-id <id>"
  echo "  sync-feedback --file-id <id> --feedback-url <url>"
  exit 1
fi

# 환경변수 확인
: "${PENPOT_API_URL:?PENPOT_API_URL 환경변수가 필요합니다 (.env 파일 확인)}"
: "${PENPOT_ACCESS_TOKEN:?PENPOT_ACCESS_TOKEN 환경변수가 필요합니다 (.env 파일 확인)}"

ACTION="$1"
shift

# 옵션 파싱
FILE_ID=""
PROJECT_NAME=""
SNAPSHOTS_DIR=""
FEEDBACK_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file-id)     FILE_ID="$2"; shift 2 ;;
    --project)     PROJECT_NAME="$2"; shift 2 ;;
    --snapshots)   SNAPSHOTS_DIR="$2"; shift 2 ;;
    --feedback-url) FEEDBACK_URL="$2"; shift 2 ;;
    *) echo "알 수 없는 옵션: $1"; exit 1 ;;
  esac
done

case "$ACTION" in
  create-file)
    [ -z "$PROJECT_NAME" ] && echo "오류: --project 필수" && exit 1
    [ -z "$SNAPSHOTS_DIR" ] && echo "오류: --snapshots 필수" && exit 1
    echo "Penpot 파일 생성: $PROJECT_NAME"
    echo "  스냅샷 소스: $SNAPSHOTS_DIR"

    # 프로젝트 생성
    RESULT=$(curl -s -X POST "$PENPOT_API_URL/rpc/command/create-project" \
      -H "Authorization: Token $PENPOT_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"name\": \"$PROJECT_NAME\"}")

    PROJECT_ID=$(echo "$RESULT" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).id" 2>/dev/null || echo "")

    if [ -z "$PROJECT_ID" ]; then
      echo "오류: 프로젝트 생성 실패"
      echo "$RESULT"
      exit 1
    fi

    echo "  프로젝트 ID: $PROJECT_ID"

    # 파일 생성
    RESULT=$(curl -s -X POST "$PENPOT_API_URL/rpc/command/create-file" \
      -H "Authorization: Token $PENPOT_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"project-id\": \"$PROJECT_ID\", \"name\": \"$PROJECT_NAME - Components\"}")

    FILE_ID=$(echo "$RESULT" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).id" 2>/dev/null || echo "")
    echo "  파일 ID: $FILE_ID"
    echo "완료"
    ;;

  update-file)
    [ -z "$FILE_ID" ] && echo "오류: --file-id 필수" && exit 1
    [ -z "$SNAPSHOTS_DIR" ] && echo "오류: --snapshots 필수" && exit 1
    echo "Penpot 파일 업데이트: $FILE_ID"
    echo "  스냅샷 소스: $SNAPSHOTS_DIR"
    echo "완료"
    ;;

  export-link)
    [ -z "$FILE_ID" ] && echo "오류: --file-id 필수" && exit 1
    echo "Penpot 공유 링크 생성: $FILE_ID"

    RESULT=$(curl -s -X POST "$PENPOT_API_URL/rpc/command/create-share-link" \
      -H "Authorization: Token $PENPOT_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"file-id\": \"$FILE_ID\", \"who\": \"all\"}")

    LINK=$(echo "$RESULT" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'))['share-link']" 2>/dev/null || echo "")
    echo "공유 링크: $LINK"
    ;;

  sync-feedback)
    [ -z "$FILE_ID" ] && echo "오류: --file-id 필수" && exit 1
    [ -z "$FEEDBACK_URL" ] && echo "오류: --feedback-url 필수" && exit 1
    echo "Penpot 피드백 동기화: $FILE_ID"

    RESULT=$(curl -s "$PENPOT_API_URL/rpc/command/get-comment-threads" \
      -H "Authorization: Token $PENPOT_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"file-id\": \"$FILE_ID\"}")

    # 피드백을 마크다운으로 변환
    mkdir -p docs/visual-spec
    echo "$RESULT" | node -e "
      const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
      let md = '# Penpot 피드백\n\n';
      md += '- 파일 ID: $FILE_ID\n';
      md += '- 동기화 일시: ' + new Date().toISOString() + '\n\n';
      (data || []).forEach((thread, i) => {
        md += '## ' + (i+1) + '. ' + (thread.content || '(제목 없음)') + '\n';
        md += '- 상태: ' + (thread.status || 'open') + '\n\n';
      });
      process.stdout.write(md);
    " > docs/visual-spec/feedback.md 2>/dev/null || echo "피드백 파싱 실패"

    echo "피드백 저장: docs/visual-spec/feedback.md"
    ;;

  *)
    echo "오류: 알 수 없는 액션: $ACTION"
    echo "사용 가능: create-file, update-file, export-link, sync-feedback"
    exit 1
    ;;
esac
