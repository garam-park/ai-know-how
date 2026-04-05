import { tool } from "@opencode-ai/plugin";
import { execSync } from "child_process";

export default tool({
  description:
    "Storybook 컴포넌트 스크린샷 수집 — 시각 Spec 문서화 및 Penpot 시안 생성용",
  args: {
    storybookUrl: tool.schema.string("Storybook 빌드 URL 또는 로컬 경로"),
    components: tool.schema
      .array(tool.schema.string("스크린샷 대상 컴포넌트"))
      .optional(),
    output: tool.schema.string("스크린샷 출력 디렉토리"),
  },
  async execute(args) {
    const { storybookUrl, components, output } = args;
    const comps = components?.length ? components.join(",") : "";
    const result = execSync(
      `bash scripts/tools/storybook-snapshot.sh "${storybookUrl}" "${output}" "${comps}"`,
      { encoding: "utf-8" },
    );
    return { content: result };
  },
});
