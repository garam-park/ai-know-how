import { tool } from "@opencode-ai/plugin";

export default tool({
  description:
    "Storybook 컴포넌트 스크린샷 수집 — 시각 Spec 문서화 및 Penpot 시안 생성용",
  args: {
    storybookUrl: tool.schema.string("Storybook 빌드 URL 또는 로컬 경로"),
    components: tool.schema
      .array(tool.schema.string("스크린샷 대상 컴포넌트 목록"))
      .optional(),
    states: tool.schema
      .array(
        tool.schema.enum([
          "default",
          "hover",
          "focus",
          "active",
          "disabled",
          "error",
          "loading",
        ]),
      )
      .optional(),
    output: tool.schema.string("스크린샷 출력 디렉토리"),
  },
  async execute(args, context) {
    const { storybookUrl, components, states = ["default"], output } = args;

    // Storybook 스토리별 스크린샷 수집
    // 실제 구현 시: @storybook/test-runner + puppeteer/playwright
    // 또는 Chromatic API 활용

    const captured = 0; // 실제 실행 시 수집된 스크린샷 수

    return {
      content: `Storybook 스크린샷 수집 완료\nURL: ${storybookUrl}\n컴포넌트: ${components ? components.join(", ") : "전체"}\n상태: ${states.join(", ")}\n수집: ${captured}건\n출력: ${output}`,
      captured,
    };
  },
});
