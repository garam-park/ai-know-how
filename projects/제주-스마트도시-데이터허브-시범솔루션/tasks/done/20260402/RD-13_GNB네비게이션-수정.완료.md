# RD-13 GNB 네비게이션 수정

## 메타

| 항목 | 값 |
|------|-----|
| 우선순위 | 1 (크리티컬) |
| 선행작업 | 없음 |
| 후행작업 | 없음 (전체 영향) |
| 대상 파일 | `wireframe/common/components.js`, `wireframe/common/nav-data.js` |
| 영향 화면 | 전체 63개 페이지 |
| 해결책 | **A. JS 동적 렌더링 (현재 구조 유지)** |
| 상태 | ✅ 수정 완료 |

## 배경

depth 2 페이지 진입 시 GNB(Global Navigation Bar) 메뉴가 렌더링되지 않아 header가 비어 있음. 다른 섹션으로의 이동이 불가능하며, GNB 링크 경로도 존재하지 않는 디렉토리를 가리키고 있어 404 발생.

## 문제 상세

### 문제 1: GNB 메뉴 미렌더링 — header가 빈 상태

`renderGnbMenus()` 함수가 `components.js`에 정의되어 있으나, `initLayout()`에서 호출하지 않았음.

- 모든 depth 2 페이지의 HTML 구조: `<div class="gnb-menus"></div>` (빈 div)
- `initLayout(groupId)` 함수는 LNB만 렌더링하고, GNB는 이미 DOM에 있는 `.gnb-menu-item`에 active 토글만 수행
- DOM에 `.gnb-menu-item`이 없으므로 active 표시도 동작하지 않음

### 문제 2: GNB path가 존재하지 않는 경로

`nav-data.js`의 GNB path가 디렉토리 경로(`../XX-xxx/`)를 가리키지만, 해당 디렉토리에 `index.html`이 없어 404 발생.

## 해결책 검토

5가지 해결책(A~E)을 비교 검토한 결과, 와이어프레임 단계에서 **A. JS 동적 렌더링 (현재 구조 유지)** 방식이 가장 적합.

| | A. JS 동적 렌더링 | B. HTML 하드코딩 | C. fetch inject | D. SPA 셸 | E. SSI/빌드 |
|---|---|---|---|---|---|
| 수정 규모 | **최소 (2파일)** | 63개 HTML | 신규+JS | 전체 리팩 | 빌드 환경 |
| file:// 동작 | **O** | O | X (CORS) | X | X |
| 유지보수 | **1곳** | 63곳 | 1곳 | 1곳 | 1곳 |
| 와이어프레임 적합성 | **높음** | 보통 | 낮음 | 낮음 | 낮음 |

## 수정 완료 내역

### components.js ✅

`initLayout()`에서 `renderGnbMenus()` 호출 추가. GNB 렌더링 → active 표시 → LNB 렌더링 순서 보장.

```js
function initLayout(groupId) {
  // 1. GNB 메뉴 렌더링 (먼저)
  renderGnbMenus();

  // 2. GNB 메뉴 활성화 표시
  const gnbMenuItems = document.querySelectorAll('.gnb-menu-item');
  gnbMenuItems.forEach(item => {
    item.classList.remove('active');
    if (item.dataset.groupId === groupId) {
      item.classList.add('active');
    }
  });

  // 3. LNB 메뉴 렌더링
  initLnb(groupId);
}
```

추가로 `initAllComponents()` (DOMContentLoaded 자동 실행)에서도 `renderGnbMenus()` 호출하여 이중 안전장치 확보.

### nav-data.js ✅

GNB path를 각 그룹의 첫 번째 LNB 페이지로 변경.

| 변경 전 | 변경 후 |
|---------|---------|
| `../01-main-dashboard/` | `../01-main-dashboard/WF-01-01_kpi-dashboard.html` |
| `../02-complaint/` | `../02-complaint/WF-02-01_complaint-dashboard.html` |
| `../03-simulation/` | `../03-simulation/WF-03-01_simulation-config.html` |
| `../04-event/` | `../04-event/WF-04-01_realtime-console.html` |
| `../05-llm/` | `../05-llm/WF-05-01_summary-viewer.html` |
| `../06-assistant/` | `../06-assistant/WF-06-01_chat.html` |
| `../07-report/` | `../07-report/WF-07-01_report-list.html` |
| `../08-pipeline/` | `../08-pipeline/WF-08-01_collection-status.html` |
| `../09-catalog/` | `../09-catalog/WF-09-01_catalog-search.html` |
| `../10-admin/` | `../10-admin/WF-10-01_user-management.html` |

## 역할별 GNB 메뉴 동작

`renderGnbMenus()`는 `sessionStorage`의 역할(role)에 따라 메뉴를 필터링함.

| 역할 | 더미 계정 | 비밀번호 | GNB 메뉴 |
|------|----------|----------|----------|
| 관리자 | `admin` | `demo` | 전체 10개 |
| 운영자 | `operator` | `demo` | 메인, 민원분석, 정책시뮬레이션, 이벤트감시, LLM분석, 보고서 |
| 열람자 | `viewer` | `demo` | 메인, 민원분석, 보고서, 카탈로그 |

**참고:** 로그인하지 않으면 기본값 `viewer`로 4개 메뉴만 표시됨.

## 검증 체크리스트

- [x] `initLayout()`에서 `renderGnbMenus()` 호출 추가
- [x] `initAllComponents()`에서도 `renderGnbMenus()` 자동 호출 확인
- [x] `nav-data.js` GNB path를 실제 존재하는 HTML 파일로 변경
- [ ] 모든 depth 2 페이지에서 GNB 메뉴가 역할에 맞게 렌더링되는지 확인
- [ ] 현재 섹션에 해당하는 GNB 메뉴에 `.active` 클래스가 적용되는지 확인
- [ ] GNB 메뉴 클릭 시 해당 섹션의 첫 번째 페이지로 정상 이동하는지 확인 (404 없음)
- [ ] 로그인(admin/operator/viewer) → 역할별 메뉴 필터링 정상 동작 확인
