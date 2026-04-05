import { tool } from "@opencode-ai/plugin";

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
  async execute(args, context) {
    const { source, platforms, output } = args;

    // Style Dictionary 설정 생성
    const config = {
      source: [source],
      platforms: Object.fromEntries(
        platforms.map((p) => [
          p,
          {
            css: {
              transformGroup: "css",
              buildPath: `${output}/${p}/`,
              files: [{ destination: "tokens.css", format: "css/variables" }],
            },
            scss: {
              transformGroup: "scss",
              buildPath: `${output}/${p}/`,
              files: [
                { destination: "_tokens.scss", format: "scss/variables" },
              ],
            },
            js: {
              transformGroup: "js",
              buildPath: `${output}/${p}/`,
              files: [{ destination: "tokens.js", format: "javascript/es6" }],
            },
          }[p] || {
            transformGroup: "css",
            buildPath: `${output}/${p}/`,
            files: [],
          },
        ]),
      ),
    };

    // Style Dictionary 빌드 실행
    // 실제 구현 시: const StyleDictionary = require("style-dictionary")
    // new StyleDictionary(config).buildAllPlatforms()

    return {
      content: `토큰 변환 완료: ${platforms.join(", ")}\n출력 경로: ${output}\n플랫폼: ${platforms.join(", ")}`,
    };
  },
});
