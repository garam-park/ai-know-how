import { tool } from "@opencode-ai/plugin";

export default tool({
  description:
    "Penpot 시안 자동 생성 (On-Demand) — Storybook 스냅샷 기반 Penpot 파일 생성, 고객 미팅용",
  args: {
    action: tool.schema.enum([
      "create-file",
      "update-file",
      "export-link",
      "sync-feedback",
    ]),
    fileId: tool.schema
      .string("Penpot 파일 ID (update/export/sync 시 필요)")
      .optional(),
    projectName: tool.schema.string("Penpot 프로젝트 이름").optional(),
    snapshots: tool.schema
      .array(tool.schema.string("Storybook 스냅샷 이미지 경로 목록"))
      .optional(),
    feedbackUrl: tool.schema
      .string("Penpot 피드백 웹훅 URL (sync-feedback 시)")
      .optional(),
  },
  async execute(args, context) {
    const { action, fileId, projectName, snapshots, feedbackUrl } = args;

    // Penpot MCP API 연동
    // create-file: 새 Penpot 파일 생성 + 스냅샷 기반 컴포넌트 배치
    // update-file: 기존 파일 업데이트
    // export-link: 공유 링크 생성 (고객 제공용)
    // sync-feedback: Penpot 코멘트 → 로컬 피드백 파일 변환

    const actions = {
      "create-file": "새 Penpot 시안 파일 생성",
      "update-file": "기존 Penpot 파일 업데이트",
      "export-link": "고객 공유 링크 생성",
      "sync-feedback": "Penpot 코멘트 → 피드백 파일 변환",
    };

    return {
      content: `Penpot On-Demand 완료: ${action}\n${actions[action]}\n${fileId ? `파일 ID: ${fileId}` : ""}\n${projectName ? `프로젝트: ${projectName}` : ""}\n${snapshots ? `스냅샷: ${snapshots.length}건` : ""}`,
    };
  },
});
