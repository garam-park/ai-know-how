import { test, expect } from '@playwright/test';

test.describe('Phase 2.5: WBS 인라인 창 CRUD 및 진척률 갱신 점검', () => {
  let createdProjectId: string;

  test.beforeAll(async ({ request }) => {
    const projRes = await request.post('/api/v1/projects', {
      data: { name: 'E2E WBS 테스트 프로젝트', startDate: '2025-01-01', endDate: '2025-12-31' }
    });
    const projData = await projRes.json();
    createdProjectId = String(projData.result.project.id);
  });

  test('사용자는 WBS 루트 카테고리와 태스크를 생성하고, 진척률을 갱신할 수 있다', async ({ page }) => {
    await page.goto(`/projects/${createdProjectId}`);
    
    // WBS 탭 전환
    await page.getByRole('button', { name: 'WBS 및 공정' }).click();

    // 1. 루트 카테고리 추가
    await page.getByRole('button', { name: '+ 루트 카테고리 추가' }).click();

    // 인라인 폼 입력
    await page.getByRole('combobox').selectOption({ label: '카테고리' });
    await page.getByPlaceholder('제목').fill('분석설계');
    await page.getByRole('button', { name: '저장', exact: true }).click();
    
    await expect(page.getByText('WBS 노드가 추가되었습니다.')).toBeVisible();

    // 2. 하위 태스크 추가 (루트 카테고리의 + 버튼 탐색)
    const categoryRow = page.locator('div').filter({ hasText: /^분석설계 \(w:1\)$/ }).first();
    await categoryRow.getByRole('button', { name: '+' }).click();

    await page.getByRole('combobox').selectOption({ label: '태스크' });
    await page.getByPlaceholder('제목').fill('요구사항 명세서 작성');
    await page.getByRole('button', { name: '저장', exact: true }).click();

    await expect(page.getByText('요구사항 명세서 작성')).toBeVisible();

    // 3. 진척률 클릭 수정 로직 점검 (태스크)
    const taskRow = page.locator('div').filter({ hasText: /^요구사항 명세서 작성 \(w:1\)$/ });
    await taskRow.getByText('0%').click();

    const progressInput = taskRow.getByRole('spinbutton');
    await expect(progressInput).toBeVisible();

    await progressInput.fill('100');
    await progressInput.press('Enter');

    // 4. Toast 응답 및 상위 카테고리(분석설계)의 진척률 계산 결과 100% 반영 확인
    await expect(page.getByText('100%')).toHaveCount(2); // 태스크 1건과 카테고리 1건 총 2곳
    await expect(categoryRow).toContainText('100%');
  });
});
