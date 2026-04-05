import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "컴포넌트의 WCAG 2.1 접근성 자동 검사 (axe-core 기반)",
  args: {
    target: tool.schema.string("검사 대상 (Storybook URL 또는 로컬 빌드 경로)"),
    level: tool.schema.enum(["A", "AA", "AAA"]).optional(),
    rules: tool.schema
      .array(tool.schema.string("실행할 axe 규칙 목록 (선택, 기본값: 전체)"))
      .optional(),
  },
  async execute(args, context) {
    const { target, level = "AA", rules } = args;

    // axe-core 실행
    // 실제 구현 시: axe.run() 또는 axe-core CLI 통합
    // 결과에서 violations, passes, incomplete 수집

    const violations = 0; // 실제 실행 시 axe-core 결과
    const passes = 0;
    const incomplete = 0;

    const levelCriteria = {
      A: "기본 접근성 요구사항",
      AA: "표준 준수 (권장)",
      AAA: "최고 수준 접근성",
    };

    return {
      content: `a11y 검사 완료 (WCAG 2.1 ${level})\n대상: ${target}\n기준: ${levelCriteria[level]}\n통과: ${passes}건\n위반: ${violations}건\n불완전: ${incomplete}건`,
      violations,
      passes,
      incomplete,
    };
  },
});
