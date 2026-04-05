import { tool } from "@opencode-ai/plugin";
import { execSync } from "child_process";

export default tool({
  description: "Playwright 시각 테스트 설정값 JSON 출력",
  args: {},
  async execute() {
    const result = execSync("bash scripts/tools/test-config.sh", {
      encoding: "utf-8",
    });
    return { content: result };
  },
});
