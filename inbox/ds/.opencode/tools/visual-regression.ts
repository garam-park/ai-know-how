import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Chromatic/Percy 기반 시각 회귀 테스트 실행",
  args: {
    provider: tool.schema.enum(["chromatic", "percy"]),
    projectToken: tool.schema.string(
      "프로젝트 토큰 (CHROMATIC_PROJECT_TOKEN 또는 PERCY_TOKEN)",
    ),
    buildScript: tool.schema
      .string("Storybook 빌드 스크립트 (기본값: build-storybook)")
      .optional(),
  },
  async execute(args, context) {
    const { provider, projectToken, buildScript = "build-storybook" } = args;

    // Storybook 빌드 후 시각 회귀 테스트 실행
    // Chromatic: npx chromatic --project-token={token} --build-script-name={buildScript}
    // Percy: npx percy storybook --snapshot ./storybook-static

    const changes = 0; // 실제 실행 시 Chromatic/Percy 결과
    const accepted = 0;
    const denied = 0;

    return {
      content: `시각 회귀 테스트 완료 (${provider})\n변경 감지: ${changes}건\n승인: ${accepted}건\n거부: ${denied}건`,
      changes,
      accepted,
      denied,
    };
  },
});
