/**
 * Playwright 시각 테스트 설정
 * 뷰포트 프리셋, 브라우저, 임계치 정의
 */

export const viewports = {
  mobile: { width: 375, height: 812, deviceScaleFactor: 2 },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 2 },
  desktop: { width: 1280, height: 720, deviceScaleFactor: 1 },
} as const;

export const browsers = ["chromium"] as const;

export const defaultThreshold = 0.02;

export const defaultViewports = ["desktop"] as const;

export const storybookUrl =
  process.env.STORYBOOK_URL || "http://localhost:6006";
