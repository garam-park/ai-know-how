import { tool } from "@opencode-ai/plugin";
import { execSync } from "child_process";

export default tool({
  description:
    "Playwright 기반 시각 회귀 테스트 — 로컬 실행, 외부 전송 없음, 오픈소스 무료",
  args: {
    storybookUrl: tool.schema.string(
      "Storybook URL 또는 정적 빌드 경로 (예: http://localhost:6006)",
    ),
    components: tool.schema
      .array(tool.schema.string("대상 컴포넌트명"))
      .optional(),
    threshold: tool.schema
      .number("픽셀 차이 임계치 0~1, 기본값 0.02")
      .optional(),
    update: tool.schema
      .boolean("베이스라인 업데이트 모드")
      .optional(),
    viewports: tool.schema
      .array(tool.schema.enum(["mobile", "tablet", "desktop"]))
      .optional(),
  },
  async execute(args) {
    const {
      storybookUrl,
      components,
      threshold = 0.02,
      update = false,
      viewports = ["desktop"],
    } = args;

    const opts: string[] = [];
    if (update) opts.push("--update");
    opts.push("--threshold", String(threshold));
    opts.push("--viewports", viewports.join(","));
    if (components?.length) opts.push("--components", components.join(","));

    const result = execSync(
      `bash scripts/tools/playwright-visual-test.sh "${storybookUrl}" ${opts.join(" ")}`,
      { encoding: "utf-8" },
    );
    return { content: result };
  },
});
