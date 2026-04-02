import { test, expect } from '@playwright/test';

test.describe('Phase 2.3 & 2.4: 컨소시엄 구성 및 멤버 초대 자동화', () => {
  let createdProjectId: string;
  let newCompanyName: string;

  // 독립적인 오염 없는 테스트를 위해 beforeAll에서 데이터 기초 세팅
  test.beforeAll(async ({ request }) => {
    // 1. 글로벌 Setup이 DB를 리셋했으므로, 더미 회사와 프로젝트를 하나 생성한다.
    newCompanyName = `E2E 파트너사 ${Date.now()}`;
    const companyRes = await request.post('/api/v1/companies', {
      data: { name: newCompanyName, bizNo: '999-88-77777' }
    });
    const { result: { company } } = await companyRes.json();

    const projRes = await request.post('/api/v1/projects', {
      data: { name: 'E2E 멤버 초대용 프로젝트', startDate: '2025-01-01', endDate: '2025-12-31', companyId: company.id }
    });
    const projData = await projRes.json();
    createdProjectId = String(projData.result.project.id);
    
    // 추가 참여사용 파트너사 등록
    await request.post('/api/v1/companies', { data: { name: 'E2E 하청업체', bizNo: '123' } });
  });

  test('사용자는 프로젝트에 컨소시엄사를 추가하고 멤버를 초대할 수 있다', async ({ page }) => {
    await page.goto(`/projects/${createdProjectId}`);
    
    // '컨소시엄 및 멤버' 탭으로 전환 (텍스트 클릭 기준)
    await page.getByRole('button', { name: '컨소시엄 및 멤버' }).click();
    
    // 1. 컨소시엄사 탭: 하청 추가
    await page.getByText('새 참여사 추가').scrollIntoViewIfNeeded();

    await page.locator('select').first().selectOption({ label: 'E2E 하청업체' }); // 회사명
    await page.locator('select').nth(1).selectOption('SUB'); // 역할군 하청 (SUB)
    // 상위사는 기본값(루트) 유지
    await page.getByRole('button', { name: '추가', exact: true }).click();
    
    // Toast 및 트리 렌더 검증
    await expect(page.getByText('컨소시엄사가 추가되었습니다.')).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^하청E2E 하청업체\(123\)$/ }).first()).toBeVisible();

    // 2. 멤버 탭 전환
    await page.getByRole('button', { name: '멤버 관리' }).click();
    
    // 멤버 초대 토글 오픈
    await page.getByRole('button', { name: '+ 멤버 초대' }).click();

    await page.getByLabel(/초대할 이메일/).fill(`test${Date.now()}@test.com`);
    await page.getByLabel(/소속 컨소시엄사/).selectOption({ label: 'E2E 하청업체' });
    await page.getByLabel(/역할군/).selectOption({ label: 'Developer' });
    await page.getByLabel(/초기 투입률/).fill('50');

    await page.getByRole('button', { name: '초대 발송' }).click();

    // Toast 확인
    await expect(page.getByText('멤버 초대가 완료되었습니다.')).toBeVisible();

    // 표에 새로운 멤버 렌더 여부 검증
    await expect(page.getByRole('cell', { name: 'E2E 하청업체' })).toBeVisible();
    
    // 역할 드롭다운 선택 검증
    const roleSelect = page.getByRole('combobox').filter({ has: page.locator('option[value="3"]') });
    await expect(roleSelect).toHaveValue('3'); // Developer
  });
});
