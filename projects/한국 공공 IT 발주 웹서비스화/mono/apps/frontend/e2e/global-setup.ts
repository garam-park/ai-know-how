import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // 테스트 실행 전 DB 초기화 로직이 들어갈 곳
  console.log('Playwright Global Setup - DB Initialization Strategy');
  // 여기에서 docker exec 또는 API 콜을 통해 DB 테이블 리셋 및 시딩 진행
}

export default globalSetup;
