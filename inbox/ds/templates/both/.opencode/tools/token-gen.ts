import { tool } from "@opencode-ai/plugin";
import { execSync } from "child_process";

export default tool({
  description:
    "디자인 토큰 JSON을 CSS 변수, SCSS, JS로 동시 변환 (Style Dictionary 기반)",
  args: {
    source: tool.schema.string(
      "토큰 JSON 파일 경로 (예: packages/tokens/tokens.json)",
    ),
    platforms: tool.schema.array(
      tool.schema.enum(["css", "scss", "js", "android", "ios"]),
    ),
    output: tool.schema.string("출력 디렉토리"),
  },
  async execute(args) {
    const { source, platforms, output } = args;
    const result = execSync(
      `bash scripts/tools/token-gen.sh "${source}" "${platforms.join(",")}" "${output}"`,
      { encoding: "utf-8" },
    );
    return { content: result };
  },
});
