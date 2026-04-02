import { test, expect } from '@playwright/test';

test.describe('Phase 2.3 & 2.4: 컨소시엄 구성 및 멤버 초대 자동화', () => {
  let createdProjectId: string;
  let newCompanyName: string;
  let memberEmail: string;

  let apiContext;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3003',
      storageState: 'e2e/.auth/user.json',
    });

    // 1. 주관사 생성
    newCompanyName = `E2E 파트너사 ${Date.now()}`;
    const companyRes = await apiContext.post('/api/v1/companies', {
      data: { name: newCompanyName, bizNo: '999-88-77777' }
    });
    const companyData = await companyRes.json();
    const companyId = companyData.result?.company?.id || companyData.result?.id;

    // 2. 프로젝트 생성
    const projRes = await apiContext.post('/api/v1/projects', {
      data: { name: 'E2E 멤버 초대용 프로젝트', startDate: '2025-01-01', endDate: '2025-12-31', companyId }
    });
    const projData = await projRes.json();
    createdProjectId = String(projData.result?.project?.id || projData.result?.id);
    if (!createdProjectId || createdProjectId === 'undefined') {
      throw new Error(`프로젝트 생성 실패: ${JSON.stringify(projData)}`);
    }

    // 3. 하청업체 생성
    await apiContext.post('/api/v1/companies', { data: { name: 'E2E 하청업체', bizNo: '123' } });

    // 4. 실가입 사용자 미리 등록 (멤버 초대를 위해 DB에 기졸 사용자 필요)
    memberEmail = `member_${Date.now()}@test.com`;
    await apiContext.post('/api/v1/auth/register', {
      data: { email: memberEmail, password: 'Password123!', name: 'E2E 멤버' }
    });
  });

  test.afterAll(async () => {
    if (apiContext) await apiContext.dispose();
  });

  test('사용자는 프로젝트에 컨소시엄사를 추가하고 멤버를 초대할 수 있다', async ({ page }) => {
    await page.goto(`/projects/${createdProjectId}`);
    
    // '컨소시엄 및 멤버' 탭으로 전환 (텍스트 클릭 기준)
    await page.getByRole('link', { name: '컨소시엄', exact: true }).click();
    
    // 1. 컨소시엄사 탭: 하청 추가
    await page.getByText('새 참여사 추가').scrollIntoViewIfNeeded();

    await page.locator('select').first().selectOption({ label: 'E2E 하청업체' }); // 회사명
    await page.locator('select').nth(1).selectOption('SUB'); // 역할군 하청 (SUB)
    // 상위사는 기본값(루트) 유지
    await page.getByRole('button', { name: '추가', exact: true }).click();
    
    // Toast 및 트리 렌더 검증
    await expect(page.getByText('컨소시엄사가 추가되었습니다.')).toBeVisible();
    await expect(page.locator('div').filter({ hasText: 'E2E 하청업체' }).first()).toBeVisible();

    // 2. 멤버 탭 전환
    await page.getByRole('link', { name: '멤버', exact: true }).click();
    
    // 멤버 초대 토글 오픈
    await page.getByRole('button', { name: '+ 멤버 초대' }).click();

    await page.getByPlaceholder('member@example.com').fill(memberEmail);
    await page.locator('select').first().selectOption({ label: 'E2E 하청업체' });
    await page.locator('select').nth(1).selectOption({ label: 'Developer' });
    await page.locator('input[type="number"]').first().fill('50');

    await page.getByRole('button', { name: '초대 발송' }).click();

    // Toast 확인
    await expect(page.getByText('멤버 초대가 완료되었습니다.')).toBeVisible();

    // 표에 새로운 멤버가 렌더되고 회사명이 보이는지 검증
    await expect(page.getByRole('cell', { name: 'E2E 하청업체' })).toBeVisible();
    // 새로 초대된 멤버 행에서 역할이 Developer(id=3)로 설정됐는지 확인
    const newMemberRow = page.getByRole('row').filter({ hasText: 'E2E 멤버' });
    await expect(newMemberRow.getByRole('combobox')).toHaveValue('3');
  });
});
