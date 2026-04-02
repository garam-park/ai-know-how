// @ts-nocheck
import { FullConfig, request } from '@playwright/test';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalSetup(config: FullConfig) {
  console.log('Playwright Global Setup - DB Initialization');
  try {
    console.log('Running PRISMA RESET & SEED inside test backend container...');
    execSync('docker exec public-it-test-backend sh -c "npx prisma migrate reset --force --skip-generate && npx prisma db seed"', { stdio: 'inherit' });
    console.log('DB reset and seed completed successfully.');
    
    // Auth State 저장 디렉토리 세팅
    const authDir = path.join(__dirname, '.auth');
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir);

    console.log('Registering and logging in global test user...');
    // test-frontend의 Nginx를 경유하여 API를 호출합니다 (3003포트)
    const requestContext = await request.newContext({ baseURL: 'http://localhost:3003' });

    await requestContext.post('/api/v1/auth/register', {
      data: { email: 'e2e@test.com', password: 'Password123!', name: 'E2E Tester' }
    });

    const loginRes = await requestContext.post('/api/v1/auth/login', {
      data: { email: 'e2e@test.com', password: 'Password123!' }
    });

    if (!loginRes.ok()) throw new Error('Global Login failed: ' + await loginRes.text());

    await requestContext.storageState({ path: path.join(authDir, 'user.json') });
    await requestContext.dispose();
    console.log('Global Auth State saved successfully.');
  } catch (error) {
    console.error('Failed to reset/seed test DB or authenticate. Make sure docker-compose.test.yml is properly running.', error);
    throw error;
  }
}

export default globalSetup;
