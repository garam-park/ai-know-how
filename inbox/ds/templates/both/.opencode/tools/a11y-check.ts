import { tool } from "@opencode-ai/plugin";
import { execSync } from "child_process";

export default tool({
  description: "컴포넌트의 WCAG 2.1 접근성 자동 검사 (axe-core 기반)",
  args: {
    target: tool.schema.string("검사 대상 (Storybook URL 또는 로컬 빌드 경로)"),
    level: tool.schema.enum(["A", "AA", "AAA"]).optional(),
  },
  async execute(args) {
    const { target, level = "AA" } = args;
    const result = execSync(
      `bash scripts/tools/a11y-check.sh "${target}" "${level}"`,
      { encoding: "utf-8" },
    );
    return { content: result };
  },
});
