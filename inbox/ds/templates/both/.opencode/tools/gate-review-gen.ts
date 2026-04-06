import { tool } from "@opencode-ai/plugin";
import { execSync } from "child_process";

export default tool({
  description:
    "Gate 시각적 리뷰 HTML 생성 — 버전 자동 증가, 브라우저에서 열어 시각 검토",
  args: {
    gate: tool.schema.number("Gate 번호 (1~5)"),
    data: tool.schema
      .string("데이터 JSON 파일 경로 (선택, Gate 2는 tokens.json 자동)")
      .optional(),
  },
  async execute(args) {
    const { gate, data } = args;
    const opts = data ? `--data "${data}"` : "";
    const result = execSync(
      `bash scripts/tools/gate-review-gen.sh ${gate} ${opts}`,
      { encoding: "utf-8" },
    );
    return { content: result };
  },
});
