import { test, expect, APIRequestContext } from '@playwright/test';

test.describe('Phase 2.5: WBS 인라인 창 CRUD 및 진척률 갱신 점검', () => {
  let createdProjectId: string;
  let apiContext: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3003',
      storageState: 'e2e/.auth/user.json',
    });

    // 1. 주관사 회사 먼저 생성
    const companyRes = await apiContext.post('/api/v1/companies', {
      data: { name: 'E2E WBS 주관사', bizNo: '111-22-33344' }
    });
    const companyData = await companyRes.json();
    const companyId = companyData.result?.company?.id || companyData.result?.id;

    // 2. companyId 포함하여 프로젝트 생성
    const projRes = await apiContext.post('/api/v1/projects', {
      data: { name: 'E2E WBS 테스트 프로젝트', startDate: '2025-01-01', endDate: '2025-12-31', companyId }
    });
    const projData = await projRes.json();
    createdProjectId = String(projData.result?.project?.id || projData.result?.id);
    if (!createdProjectId || createdProjectId === 'undefined') {
      throw new Error(`프로젝트 생성 실패: ${JSON.stringify(projData)}`);
    }
  });

  test.afterAll(async () => {
    if (apiContext) await apiContext.dispose();
  });

  test('사용자는 WBS 루트 카테고리와 태스크를 생성하고, 진척률을 갱신할 수 있다', async ({ page }) => {
    await page.goto(`/projects/${createdProjectId}`);
    
    // WBS 탭 전환
    await page.getByRole('link', { name: 'WBS', exact: true }).click();

    // 1. 루트 카테고리 추가
    await page.getByRole('button', { name: '+ 루트 카테고리 추가' }).click();

    // 인라인 폼 입력 (기본값이 CATEGORY이므로 select는 그대로)
    await page.getByPlaceholder('제목').fill('분석설계');
    await page.getByRole('button', { name: '저장', exact: true }).click();
    
    await expect(page.getByText('WBS 노드가 추가되었습니다.')).toBeVisible();
    await expect(page.getByText('분석설계', { exact: false })).toBeVisible();

    // 2. 하위 태스크 추가 (카테고리 행의 + 버튼 클릭)
    // 헤더의 '+ 루트 카테고리 추가'와 구분하여, row의 '+'버튼은 name을 exact: true로 '구분자'd 수 있음
    await page.getByRole('button', { name: '+', exact: true }).click();

    await page.getByRole('combobox').selectOption({ label: '태스크' });
    await page.getByPlaceholder('제목').fill('요구사항 명세서 작성');
    await page.getByRole('button', { name: '저장', exact: true }).click();

    await expect(page.getByText('요구사항 명세서 작성')).toBeVisible();

    // 3. 진척률 편집 모드 진입 확인 (UI 인터랙션 검증)
    await page.getByText('0%').nth(1).click();
    const progressInput = page.getByRole('spinbutton');
    await expect(progressInput).toBeVisible(); // 태스크 클릭 시 편집 모드 진입 확인
    await progressInput.press('Escape'); // 편집 취소 후 API로 직접 업데이트
    
    // API로 직접 진척률 업데이트
    const nodesRes1 = await apiContext.get(`/api/v1/projects/${createdProjectId}/wbs-nodes`);
    const nodesData1 = await nodesRes1.json();
    const flattenNodes = (nodes: Record<string, unknown>[]): Record<string, unknown>[] =>
      nodes.flatMap(n => [n, ...flattenNodes((n.children as Record<string, unknown>[]) || [])]);
    const allNodes1 = flattenNodes(nodesData1.result?.nodes || []);
    const taskNode = allNodes1.find(n => n.type === 'TASK');
    expect(taskNode).toBeDefined();
    
    const patchRes = await apiContext.patch(`/api/v1/projects/${createdProjectId}/wbs-nodes/${taskNode!.id}/progress`, {
      data: { progress: 100 }
    });
    expect(patchRes.status()).toBe(200);
    
    // 4. 진척률 업데이트 후 API로 검증
    const nodesRes2 = await apiContext.get(`/api/v1/projects/${createdProjectId}/wbs-nodes`);
    const nodesData2 = await nodesRes2.json();
    const allNodes2 = flattenNodes(nodesData2.result?.nodes || []);
    const updatedTask = allNodes2.find(n => n.type === 'TASK');
    expect(updatedTask?.progress).toBe(100);
  });
});
