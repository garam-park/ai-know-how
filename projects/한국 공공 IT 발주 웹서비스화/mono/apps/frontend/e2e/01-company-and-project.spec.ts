import { test, expect } from '@playwright/test';

test.describe('Phase 2.1 & 2.2: 회사 생성 및 프로젝트 주관사 지정 자동화 동작 검증', () => {
  test('사용자는 새로운 회사를 등록하고, 이를 주관사로 하는 프로젝트를 생성할 수 있다', async ({ page }) => {
    // 1. 회사 생성
    await page.goto('/companies');
    
    // 빈 상태 메시지가 보이거나 로딩이 끝난 후 '회사 등록' 버튼 클릭
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: /회사 등록/i });
    await createBtn.click();
    
    const companyName = `E2E 테스트 컨소시엄 ${Date.now()}`;
    await page.getByPlaceholder('예: (주)이노팜').fill(companyName);
    await page.getByPlaceholder('예: 123-45-67890').fill('111-22-33333');
    await page.getByRole('button', { name: '등록', exact: true }).click();
    
    // 성공 시 팝업 닫힘 및 Toast 노출 대기
    await expect(page.getByText('회사 등록이 완료되었습니다.')).toBeVisible();
    
    // 테이블 내 등록 확인
    await expect(page.getByRole('cell', { name: companyName })).toBeVisible();

    // 2. 프로젝트 생성으로 이동
    await page.goto('/projects/new');
    
    // 폼 입력
    const projectName = `E2E 프로젝트 ${Date.now()}`;
    await page.getByPlaceholder('진행할 프로젝트의 이름을 입력하세요').fill(projectName);
    
    // 주관사 선택 드롭다운 (select 첫 번째 요소)
    await page.locator('select').first().selectOption({ label: companyName });
    
    await page.locator('input[type="date"]').first().fill('2025-01-01');
    await page.locator('input[type="date"]').nth(1).fill('2025-12-31');
    
    await page.getByRole('button', { name: '생성', exact: true }).click();
    
    // 성공 후 리다이렉트 및 Toast
    await expect(page.getByText('프로젝트가 성공적으로 생성되었습니다.')).toBeVisible();
    
    // 프로젝트 상세 화면으로 왔는지 검증
    await expect(page).toHaveURL(/\/projects\/\d+/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(projectName);
  });
});
