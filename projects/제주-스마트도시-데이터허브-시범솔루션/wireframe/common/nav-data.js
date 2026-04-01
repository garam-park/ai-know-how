/**
 * Navigation Data Structure
 * 전체 11개 그룹(WF-00~WF-10)의 GNB/LNB 메뉴 데이터
 */

const NAV_DATA = {
  gnbMenus: [
    { id: 'main', label: '메인', icon: 'layout-dashboard', path: '../01-main-dashboard/WF-01-01_kpi-dashboard.html' },
    { id: 'complaint', label: '민원분석', icon: 'message-square-warning', path: '../02-complaint/WF-02-01_complaint-dashboard.html' },
    { id: 'simulation', label: '정책시뮬레이션', icon: 'flask-conical', path: '../03-simulation/WF-03-01_simulation-config.html' },
    { id: 'event', label: '이벤트감시', icon: 'shield-alert', path: '../04-event/WF-04-01_realtime-console.html' },
    { id: 'llm', label: 'LLM분석', icon: 'brain', path: '../05-llm/WF-05-01_summary-viewer.html' },
    { id: 'assistant', label: 'AI어시스턴트', icon: 'bot', path: '../06-assistant/WF-06-01_chat.html' },
    { id: 'report', label: '보고서', icon: 'file-text', path: '../07-report/WF-07-01_report-list.html' },
    { id: 'pipeline', label: '데이터수집', icon: 'database', path: '../08-pipeline/WF-08-01_collection-status.html' },
    { id: 'catalog', label: '카탈로그', icon: 'book-open', path: '../09-catalog/WF-09-01_catalog-search.html' },
    { id: 'admin', label: '시스템관리', icon: 'settings', path: '../10-admin/WF-10-01_user-management.html' }
  ],

  lnbMenus: {
    'main': [
      { label: '종합 KPI', path: 'WF-01-01_kpi-dashboard.html' },
      { label: '실시간 현황', path: 'WF-01-02_realtime-monitor.html' },
      { label: 'AI 성과', path: 'WF-01-03_ai-performance.html' },
      { label: '알림 센터', path: 'WF-01-04_notification-center.html' },
      { label: '마이 대시보드', path: 'WF-01-05_my-dashboard.html' },
      { label: '시스템 상태', path: 'WF-01-06_system-status.html' }
    ],
    'complaint': [
      { label: '민원 현황', path: 'WF-02-01_complaint-dashboard.html' },
      { label: '히트맵', path: 'WF-02-02_heatmap.html' },
      { label: '읍면동 비교', path: 'WF-02-03_district-compare.html' },
      { label: '트렌드', path: 'WF-02-04_trend-analysis.html' },
      { label: '민원 상세', path: 'WF-02-05_complaint-detail.html' },
      { label: '분류 현황', path: 'WF-02-06_classification.html' },
      { label: '감성 분석', path: 'WF-02-07_sentiment.html' },
      { label: 'GIS 시각화', path: 'WF-02-08_gis-zones.html' },
      { label: '민원 목록', path: 'WF-02-09_complaint-list.html' }
    ],
    'simulation': [
      { label: '시뮬레이션 설정', path: 'WF-03-01_simulation-config.html' },
      { label: '수요·공급 분석', path: 'WF-03-02_demand-supply.html' },
      { label: '정책 효과 예측', path: 'WF-03-03_policy-prediction.html' },
      { label: '시나리오 비교', path: 'WF-03-04_scenario-compare.html' },
      { label: '요금제 추천', path: 'WF-03-05_fee-recommendation.html' },
      { label: '투자 우선순위', path: 'WF-03-06_investment-priority.html' }
    ],
    'event': [
      { label: '실시간 콘솔', path: 'WF-04-01_realtime-console.html' },
      { label: '이벤트 상세', path: 'WF-04-02_event-detail-popup.html' },
      { label: '경보 현황', path: 'WF-04-03_alert-levels.html' },
      { label: '센서 상태', path: 'WF-04-04_sensor-status.html' },
      { label: 'SOP 체크리스트', path: 'WF-04-05_sop-checklist.html' },
      { label: '인시던트 관리', path: 'WF-04-06_incident-management.html' },
      { label: 'EV 충전 이상', path: 'WF-04-07_ev-charging-anomaly.html' },
      { label: '통합관제 연계', path: 'WF-04-08_control-center-link.html' }
    ],
    'llm': [
      { label: '요약 결과', path: 'WF-05-01_summary-viewer.html' },
      { label: '분류 현황', path: 'WF-05-02_classification.html' },
      { label: '클러스터링', path: 'WF-05-03_clustering.html' },
      { label: '검색', path: 'WF-05-04_search.html' },
      { label: '리포트 뷰어', path: 'WF-05-05_generated-report.html' },
      { label: '답변문 생성', path: 'WF-05-06_response-generator.html' },
      { label: '대량 요약', path: 'WF-05-07_bulk-summary.html' },
      { label: '모델 성능', path: 'WF-05-08_model-monitoring.html' }
    ],
    'assistant': [
      { label: '챗', path: 'WF-06-01_chat.html' },
      { label: 'RAG 검색', path: 'WF-06-02_rag-panel.html' },
      { label: '추천 응답', path: 'WF-06-03_suggested-responses.html' },
      { label: '다국어', path: 'WF-06-04_multilingual.html' },
      { label: '상담 통계', path: 'WF-06-05_consultation-stats.html' }
    ],
    'report': [
      { label: '보고서 목록', path: 'WF-07-01_report-list.html' },
      { label: '미리보기', path: 'WF-07-02_report-preview.html' },
      { label: '편집·승인', path: 'WF-07-03_report-edit-approve.html' },
      { label: '템플릿 관리', path: 'WF-07-04_report-template.html' }
    ],
    'pipeline': [
      { label: '수집 현황', path: 'WF-08-01_collection-status.html' },
      { label: 'OCR 처리', path: 'WF-08-02_ocr-status.html' },
      { label: 'RPA 수집', path: 'WF-08-03_rpa-monitor.html' },
      { label: 'STT 처리', path: 'WF-08-04_stt-status.html' },
      { label: '개체명 추출', path: 'WF-08-05_ner-results.html' },
      { label: '데이터 품질', path: 'WF-08-06_data-quality.html' }
    ],
    'catalog': [
      { label: '검색', path: 'WF-09-01_catalog-search.html' },
      { label: '데이터셋 상세', path: 'WF-09-02_dataset-detail.html' },
      { label: '메타데이터 편집', path: 'WF-09-03_metadata-edit.html' },
      { label: '용어 사전', path: 'WF-09-04_terminology.html' },
      { label: '데이터 모델', path: 'WF-09-05_data-model.html' },
      { label: 'DCAT 제공', path: 'WF-09-06_dcat-export.html' }
    ],
    'admin': [
      { label: '사용자 관리', path: 'WF-10-01_user-management.html' },
      { label: '연계 설정', path: 'WF-10-02_integration-config.html' },
      { label: '감사 로그', path: 'WF-10-03_audit-log.html' },
      { label: '알림 설정', path: 'WF-10-04_alert-config.html' },
      { label: '시스템 설정', path: 'WF-10-05_system-config.html' }
    ]
  },

  rolePermissions: {
    'admin': {
      label: '관리자',
      description: '전체 시스템 관리 및 설정 권한. 모든 메뉴 및 기능 접근 가능',
      icon: 'settings',
      menus: ['main', 'complaint', 'simulation', 'event', 'llm', 'assistant', 'report', 'pipeline', 'catalog', 'admin']
    },
    'operator': {
      label: '운영자',
      description: '시스템 운영 및 데이터 모니터링 권한. 제한된 메뉴 접근',
      icon: 'bar-chart-2',
      menus: ['main', 'complaint', 'simulation', 'event', 'llm', 'report']
    },
    'viewer': {
      label: '열람자',
      description: '데이터 조회 및 보고서 확인만 가능. 수정 권한 없음',
      icon: 'eye',
      menus: ['main', 'complaint', 'report', 'catalog']
    }
  }
};

/**
 * Navigation Helper Functions
 */

/**
 * GNB 메뉴 아이템 획득
 * @param {string} menuId - 메뉴 ID
 * @returns {object} GNB 메뉴 객체
 */
function getGnbMenu(menuId) {
  return NAV_DATA.gnbMenus.find(m => m.id === menuId);
}

/**
 * LNB 메뉴 획득
 * @param {string} groupId - 그룹 ID (예: 'main', 'complaint')
 * @returns {array} LNB 메뉴 배열
 */
function getLnbMenus(groupId) {
  return NAV_DATA.lnbMenus[groupId] || [];
}

/**
 * 역할별 접근 가능한 메뉴 획득
 * @param {string} role - 역할 (예: 'admin', 'operator', 'viewer')
 * @returns {array} 접근 가능한 GNB 메뉴 배열
 */
function getMenusByRole(role) {
  const permission = NAV_DATA.rolePermissions[role];
  if (!permission) return [];

  return NAV_DATA.gnbMenus.filter(menu =>
    permission.menus.includes(menu.id)
  );
}

/**
 * 역할 정보 획득
 * @param {string} role - 역할
 * @returns {object} 역할 정보 객체
 */
function getRoleInfo(role) {
  return NAV_DATA.rolePermissions[role];
}

/**
 * 현재 페이지의 그룹 ID 판별 (URL 기반)
 * @returns {string} 그룹 ID
 */
function getCurrentGroupId() {
  const pathname = window.location.pathname;
  const groupMatch = pathname.match(/\/(0\d|10)-\w+/);

  if (groupMatch) {
    const groupNum = groupMatch[0].split('-')[0].slice(1); // '01' 추출
    const groupMap = {
      '01': 'main',
      '02': 'complaint',
      '03': 'simulation',
      '04': 'event',
      '05': 'llm',
      '06': 'assistant',
      '07': 'report',
      '08': 'pipeline',
      '09': 'catalog',
      '10': 'admin'
    };
    return groupMap[groupNum] || null;
  }
  return null;
}

/**
 * 현재 페이지명 획득
 * @returns {string} 현재 페이지명
 */
function getCurrentPageName() {
  const pathname = window.location.pathname;
  const pageMatch = pathname.match(/WF-\d+-\d+_[\w-]+\.html/);
  return pageMatch ? pageMatch[0] : null;
}

/**
 * 세션에서 역할 설정
 * @param {string} role - 역할
 */
function setUserRole(role) {
  sessionStorage.setItem('userRole', role);
}

/**
 * 세션에서 역할 획득
 * @returns {string} 역할
 */
function getUserRole() {
  return sessionStorage.getItem('userRole') || 'viewer';
}

/**
 * 세션에서 사용자 정보 설정
 * @param {string} userId - 사용자 ID
 */
function setUserId(userId) {
  sessionStorage.setItem('userId', userId);
}

/**
 * 세션에서 사용자 ID 획득
 * @returns {string} 사용자 ID
 */
function getUserId() {
  return sessionStorage.getItem('userId') || 'demo-user';
}

/**
 * 로그인 여부 확인
 * @returns {boolean} 로그인 여부
 */
function isLoggedIn() {
  return !!sessionStorage.getItem('userId');
}

/**
 * 로그아웃
 */
function logout() {
  sessionStorage.removeItem('userId');
  sessionStorage.removeItem('userRole');
  window.location.href = '../pages/login.html';
}
