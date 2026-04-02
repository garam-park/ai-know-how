// @ts-nocheck
import { FullConfig } from '@playwright/test';
import { execSync } from 'node:child_process';

async function globalSetup(config: FullConfig) {
  console.log('Playwright Global Setup - DB Initialization');
  try {
    // public-it-test-backend 컨테이너 안에서 Prisma DB 초기화 및 seed 실행
    console.log('Running PRISMA RESET & SEED inside test backend container...');
    execSync('docker exec public-it-test-backend sh -c "npx prisma migrate reset --force --skip-generate && npx prisma db seed"', { stdio: 'inherit' });
    console.log('DB reset and seed completed successfully.');
  } catch (error) {
    console.error('Failed to reset/seed test DB. Make sure docker-compose.test.yml is running.', error);
    throw error;
  }
}

export default globalSetup;
