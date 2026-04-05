import { tool } from "@opencode-ai/plugin";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export default tool({
  description:
    "Playwright 기반 시각 회귀 테스트 — 로컬 실행, 외부 전송 없음, 오픈소스 무료",
  args: {
    storybookUrl: tool.schema.string(
      "Storybook URL 또는 정적 빌드 경로 (예: http://localhost:6006 또는 ./storybook-static)",
    ),
    components: tool.schema
      .array(tool.schema.string("대상 컴포넌트명 목록 (선택, 기본값: 전체)"))
      .optional(),
    threshold: tool.schema
      .number("픽셀 차이 임계치 0~1, 기본값 0.02 (2%)")
      .optional(),
    update: tool.schema
      .boolean("베이스라인 업데이트 모드 (신규 컴포넌트 등록 시 true)")
      .optional(),
    viewports: tool.schema
      .array(tool.schema.enum(["mobile", "tablet", "desktop"]))
      .optional(),
  },
  async execute(args, context) {
    const {
      storybookUrl,
      components,
      threshold = 0.02,
      update = false,
      viewports = ["desktop"],
    } = args;

    // 1. Storybook 정적 빌드 확인
    const storybookStaticExists = existsSync("./storybook-static");
    if (!storybookStaticExists && !storybookUrl.startsWith("http")) {
      // Storybook 빌드 실행
      execSync("npm run build-storybook", { stdio: "inherit" });
    }

    // 2. Playwright 시각 테스트 실행
    const cmd = update
      ? `npx playwright test visual --update-snapshots`
      : `npx playwright test visual`;

    let output = "";
    let hasChanges = false;
    let failedTests = 0;
    let passedTests = 0;

    try {
      output = execSync(cmd, {
        encoding: "utf-8",
        env: {
          ...process.env,
          STORYBOOK_URL: storybookUrl,
          VISUAL_THRESHOLD: String(threshold),
          VISUAL_VIEWPORTS: viewports.join(","),
          VISUAL_COMPONENTS: components ? components.join(",") : "",
        },
      });
      passedTests = parseTestCount(output, "passed");
    } catch (error: any) {
      output = error.stdout?.toString() || error.stderr?.toString() || "";
      failedTests = parseTestCount(output, "failed");
      hasChanges = output.includes("snapshot") && output.includes("diff");
    }

    // 3. 결과 요약
    const mode = update ? "베이스라인 업데이트" : "회귀 테스트";
    const status = failedTests > 0 ? "실패" : "통과";

    return {
      content: `Playwright 시각 테스트 완료\n모드: ${mode}\n상태: ${status}\n통과: ${passedTests}건\n실패: ${failedTests}건\n임계치: ${(threshold * 100).toFixed(0)}%\n뷰포트: ${viewports.join(", ")}\n${hasChanges ? "\n변경 감지: 스냅샷 diff 확인 필요" : ""}`,
      passed: passedTests,
      failed: failedTests,
      hasChanges,
      mode,
    };
  },
});

function parseTestCount(output: string, type: "passed" | "failed"): number {
  const match = output.match(
    new RegExp(`(\\d+) ${type === "passed" ? "passed" : "failed"}`),
  );
  return match ? parseInt(match[1], 10) : 0;
}
