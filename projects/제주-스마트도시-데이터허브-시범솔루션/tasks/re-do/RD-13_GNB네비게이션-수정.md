# RD-13 GNB 네비게이션 수정

## 메타

| 항목 | 값 |
|------|-----|
| 우선순위 | 1 (크리티컬) |
| 선행작업 | 없음 |
| 후행작업 | 없음 (전체 영향) |
| 대상 파일 | `wireframe/common/components.js`, `wireframe/common/nav-data.js` |
| 영향 화면 | 전체 63개 페이지 |

## 배경

depth 2 페이지 진입 시 GNB(Global Navigation Bar) 메뉴가 렌더링되지 않아 header가 비어 있음. 다른 섹션으로의 이동이 불가능하며, GNB 링크 경로도 존재하지 않는 디렉토리를 가리키고 있어 404 발생.

## 문제 상세

### 문제 1: GNB 메뉴 미렌더링 — header가 빈 상태

`renderGnbMenus()` 함수가 `components.js`에 정의되어 있으나, **어떤 페이지에서도 호출하지 않음**.

- 모든 depth 2 페이지의 HTML 구조: `<div class="gnb-menus"></div>` (빈 div)
- `initLayout(groupId)` 함수는 LNB만 렌더링하고, GNB는 이미 DOM에 있는 `.gnb-menu-item`에 active 토글만 수행
- DOM에 `.gnb-menu-item`이 없으므로 active 표시도 동작하지 않음

```
// components.js — initLayout()
function initLayout(groupId) {
  // GNB 메뉴 활성화 표시 — 하지만 .gnb-menu-item이 0개
  const gnbMenuItems = document.querySelectorAll('.gnb-menu-item');
  gnbMenuItems.forEach(item => { ... });

  // LNB만 렌더링
  initLnb(groupId);
  // ❌ renderGnbMenus() 호출 없음
}
```

### 문제 2: GNB path가 존재하지 않는 경로

`nav-data.js`의 GNB path가 디렉토리 경로(`../XX-xxx/`)를 가리키지만, 해당 디렉토리에 `index.html`이 없음.

| GNB path | index.html 존재 |
|----------|----------------|
| `../01-main-dashboard/` | ❌ MISSING |
| `../02-complaint/` | ❌ MISSING |
| `../03-simulation/` | ❌ MISSING |
| `../04-event/` | ❌ MISSING |
| `../05-llm/` | ❌ MISSING |
| `../06-assistant/` | ❌ MISSING |
| `../07-report/` | ❌ MISSING |
| `../08-pipeline/` | ❌ MISSING |
| `../09-catalog/` | ❌ MISSING |
| `../10-admin/` | ❌ MISSING |

## 수정 사항

### components.js

- [ ] **`initLayout()`에서 `renderGnbMenus()` 호출 추가**
  - `initLnb(groupId)` 호출 전에 `renderGnbMenus()` 호출
  - GNB 렌더링 후 active 클래스 토글이 정상 동작하도록 순서 보장

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

### nav-data.js

- [ ] **GNB path를 각 그룹의 첫 번째 LNB 페이지로 변경**

| 현재 path | 수정 path |
|-----------|-----------|
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

## 검증 체크리스트

- [ ] 모든 depth 2 페이지에서 GNB 메뉴 10개 항목이 렌더링되는지 확인
- [ ] 현재 섹션에 해당하는 GNB 메뉴에 `.active` 클래스가 적용되는지 확인
- [ ] GNB 메뉴 클릭 시 해당 섹션의 첫 번째 페이지로 정상 이동하는지 확인 (404 없음)
- [ ] LNB 메뉴가 기존과 동일하게 정상 렌더링되는지 확인
- [ ] 역할별 권한(`rolePermissions`)에 따라 메뉴가 필터링되는지 확인
