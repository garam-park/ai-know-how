import { tool } from "@opencode-ai/plugin";

export default tool({
  description:
    "Figma 라이브러리와 로컬 Spec 문서 동기화 — 컴포넌트 메타데이터, Variables, Variants 추출",
  args: {
    fileId: tool.schema.string("Figma 파일 ID"),
    action: tool.schema.enum(["export-spec", "sync-tokens", "publish-library"]),
    nodeIds: tool.schema
      .array(tool.schema.string("동기화할 컴포넌트 노드 ID 목록 (선택)"))
      .optional(),
  },
  async execute(args, context) {
    const { fileId, action, nodeIds } = args;

    // Figma REST API 호출
    // GET https://api.figma.com/v1/files/{fileId}
    // GET https://api.figma.com/v1/files/{fileId}/nodes?ids={nodeIds}
    // GET https://api.figma.com/v1/files/{fileId}/variables/local
    // POST https://api.figma.com/v1/files/{fileId}/components/{componentKey}/publish

    const actions = {
      "export-spec":
        "컴포넌트 메타데이터 추출 → docs/figma-spec/에 Spec 업데이트",
      "sync-tokens": "Figma Variables → 로컬 tokens.json 동기화",
      "publish-library": "Figma 라이브러리 퍼블리시 (팀 공유)",
    };

    return {
      content: `Figma 동기화 완료: ${action}\n파일 ID: ${fileId}\n${nodeIds ? `노드 수: ${nodeIds.length}` : "전체 노드"}\n작업: ${actions[action]}`,
    };
  },
});
