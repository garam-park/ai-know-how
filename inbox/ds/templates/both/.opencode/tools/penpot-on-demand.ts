import { tool } from "@opencode-ai/plugin";
import { execSync } from "child_process";

export default tool({
  description:
    "Penpot 시안 자동 생성 (On-Demand) — Storybook 스냅샷 기반, 고객 미팅용",
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
      .array(tool.schema.string("스냅샷 디렉토리 경로"))
      .optional(),
    feedbackUrl: tool.schema
      .string("Penpot 피드백 웹훅 URL (sync-feedback 시)")
      .optional(),
  },
  async execute(args) {
    const { action, fileId, projectName, snapshots, feedbackUrl } = args;

    const opts: string[] = [];
    if (fileId) opts.push("--file-id", fileId);
    if (projectName) opts.push("--project", projectName);
    if (snapshots?.length) opts.push("--snapshots", snapshots[0]);
    if (feedbackUrl) opts.push("--feedback-url", feedbackUrl);

    const result = execSync(
      `bash scripts/tools/penpot-on-demand.sh "${action}" ${opts.join(" ")}`,
      { encoding: "utf-8" },
    );
    return { content: result };
  },
});
