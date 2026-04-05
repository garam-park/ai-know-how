# RD-13 GNB 네비게이션 수정 ✅ 완료

## 메타

| 항목 | 값 |
|------|-----|
| 상태 | ✅ 완료 |
| 우선순위 | 1 (크리티컬) |
| 완료일 | 2026-04-02 |
| 대상 파일 | `wireframe/common/components.js`, `wireframe/common/nav-data.js` |
| 영향 화면 | 전체 63개 페이지 |

## 문제 요약

depth 2 페이지 진입 시 GNB 메뉴가 렌더링되지 않고, GNB 링크 경로가 404를 유발하는 문제

### 원인
1. `renderGnbMenus()` 함수 미호출
2. GNB path가 디렉토리만 가리킴 (index.html 없음)

## 수정 내역

### 1️⃣ components.js - `initLayout()` 함수 수정

**변경 내용**:
```js
function initLayout(groupId) {
  // 1. GNB 메뉴 렌더링 (먼저 실행)
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

**효과**: DOM 생성 → 활성화 처리 → LNB 렌더링의 올바른 실행 순서 보장

---

### 2️⃣ nav-data.js - GNB path 수정

모든 10개 GNB 메뉴의 path를 실제 HTML 파일로 변경:

| 섹션 | 수정된 path |
|------|-----------|
| main | `../01-main-dashboard/WF-01-01_kpi-dashboard.html` |
| complaint | `../02-complaint/WF-02-01_complaint-dashboard.html` |
| simulation | `../03-simulation/WF-03-01_simulation-config.html` |
| event | `../04-event/WF-04-01_realtime-console.html` |
| llm | `../05-llm/WF-05-01_summary-viewer.html` |
| assistant | `../06-assistant/WF-06-01_chat.html` |
| report | `../07-report/WF-07-01_report-list.html` |
| pipeline | `../08-pipeline/WF-08-01_collection-status.html` |
| catalog | `../09-catalog/WF-09-01_catalog-search.html` |
| admin | `../10-admin/WF-10-01_user-management.html` |

**효과**: 모든 GNB 메뉴 클릭 시 404 없이 정상 페이지로 이동

---

## 검증 결과 ✅

### 코드 로직 검증
- ✅ `initLayout()` 실행 순서 올바름
- ✅ `renderGnbMenus()` 호출 확인
- ✅ 권한 기반 메뉴 필터링 로직 정상

### 파일 존재성 검증
- ✅ 10개 GNB path 모두 실제 파일 존재 확인
- ✅ 10개 LNB 메뉴 그룹 모두 path 정상 확인

### 기능 검증 체크리스트
- ✅ GNB 메뉴 10개 항목이 렌더링됨
- ✅ 현재 섹션에 `.active` 클래스 적용됨
- ✅ GNB 메뉴 클릭 시 404 없이 정상 이동
- ✅ LNB 메뉴 기존 동작 유지
- ✅ 역할별 권한에 따라 메뉴 필터링됨

---

## 최종 상태

**모든 문제 해결 완료** ✅

### 해결된 문제
1. ✅ GNB 메뉴 미렌더링 → `renderGnbMenus()` 호출로 해결
2. ✅ 404 에러 → 실제 HTML 파일로 변경하여 해결
3. ✅ 메뉴 활성화 미작동 → 실행 순서 조정으로 해결

### 영향 범위
- 전체 63개 페이지 (depth 2 이상)에서 GNB 정상 작동

---

**작업 완료일**: 2026-04-02
