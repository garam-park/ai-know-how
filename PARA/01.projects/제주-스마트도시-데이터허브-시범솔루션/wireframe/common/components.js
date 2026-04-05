/**
 * Common Component Library
 * 공통 컴포넌트 라이브러리 - UI 상호작용 처리
 */

/**
 * 레이아웃 초기화
 * @param {string} groupId - 현재 그룹 ID
 */
function initLayout(groupId) {
  // GNB 메뉴 렌더링 (먼저 실행해야 .gnb-menu-item이 생성됨)
  renderGnbMenus();

  // GNB 메뉴 활성화 표시
  const gnbMenuItems = document.querySelectorAll('.gnb-menu-item');
  gnbMenuItems.forEach(item => {
    item.classList.remove('active');
    if (item.dataset.groupId === groupId) {
      item.classList.add('active');
    }
  });

  // LNB 메뉴 렌더링
  initLnb(groupId);
}

/**
 * LNB 메뉴 초기화
 * @param {string} groupId - 현재 그룹 ID
 */
function initLnb(groupId) {
  const lnbMenuList = document.querySelector('.lnb-menu-list');
  if (!lnbMenuList) return;

  const menus = getLnbMenus(groupId);
  lnbMenuList.innerHTML = '';

  menus.forEach(menu => {
    const li = document.createElement('li');
    li.className = 'lnb-menu-item';

    const a = document.createElement('a');
    a.href = menu.path;
    a.className = 'lnb-menu-link';

    // 현재 페이지 활성화 표시
    const currentPage = getCurrentPageName();
    if (currentPage && menu.path.includes(currentPage.split('_')[0])) {
      a.classList.add('active');
    }

    a.innerHTML = `
      <span class="lnb-menu-icon">
        <i data-lucide="file-text"></i>
      </span>
      <span class="lnb-menu-label">${menu.label}</span>
    `;

    li.appendChild(a);
    lnbMenuList.appendChild(li);
  });

  // Lucide 아이콘 초기화
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/**
 * GNB 메뉴 렌더링
 */
function renderGnbMenus() {
  const gnbMenusContainer = document.querySelector('.gnb-menus');
  if (!gnbMenusContainer) return;

  const userRole = getUserRole();
  const availableMenus = getMenusByRole(userRole);

  gnbMenusContainer.innerHTML = '';

  availableMenus.forEach(menu => {
    const a = document.createElement('a');
    a.href = menu.path;
    a.className = 'gnb-menu-item';
    a.dataset.groupId = menu.id;
    a.textContent = menu.label;

    gnbMenusContainer.appendChild(a);
  });
}

/**
 * LNB 토글
 */
function toggleLnb() {
  const lnb = document.getElementById('lnb');
  if (lnb) {
    lnb.classList.toggle('collapsed');
  }
}

/**
 * 모달 표시
 * @param {string} title - 모달 제목
 * @param {string} content - 모달 내용 (HTML)
 * @param {object} options - 옵션 { onConfirm, onCancel, confirmText, cancelText }
 */
function showModal(title, content, options = {}) {
  const {
    onConfirm = null,
    onCancel = null,
    confirmText = '확인',
    cancelText = '취소',
    showCancel = true
  } = options;

  let backdrop = document.querySelector('.modal-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    document.body.appendChild(backdrop);
  }

  const modal = document.createElement('div');
  modal.className = 'modal';

  let footerHtml = `<button class="btn btn-primary" data-action="confirm">${confirmText}</button>`;
  if (showCancel) {
    footerHtml = `<button class="btn btn-secondary" data-action="cancel">${cancelText}</button>${footerHtml}`;
  }

  modal.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title">${title}</h2>
      <button class="modal-close" data-action="close">&times;</button>
    </div>
    <div class="modal-body">
      ${content}
    </div>
    <div class="modal-footer">
      ${footerHtml}
    </div>
  `;

  backdrop.innerHTML = '';
  backdrop.appendChild(modal);
  backdrop.classList.add('open');

  // 이벤트 리스너
  const closeBtn = modal.querySelector('[data-action="close"]');
  const confirmBtn = modal.querySelector('[data-action="confirm"]');
  const cancelBtn = modal.querySelector('[data-action="cancel"]');

  const closeModal = () => {
    backdrop.classList.remove('open');
  };

  closeBtn?.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  confirmBtn?.addEventListener('click', () => {
    closeModal();
    onConfirm?.();
  });

  cancelBtn?.addEventListener('click', () => {
    closeModal();
    onCancel?.();
  });

  // ESC 키 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  }, { once: true });

  return modal;
}

/**
 * 토스트 알림 표시
 * @param {string} message - 메시지
 * @param {string} type - 타입 ('success', 'info', 'warning', 'error')
 * @param {number} duration - 지속 시간 (ms)
 */
function showToast(message, type = 'info', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✓',
    info: 'ℹ',
    warning: '⚠',
    error: '✕'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-content">${message}</span>
    <button class="toast-close">&times;</button>
  `;

  container.appendChild(toast);

  const closeBtn = toast.querySelector('.toast-close');
  const removeToast = () => {
    toast.style.animation = 'toastSlideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  };

  closeBtn.addEventListener('click', removeToast);

  if (duration > 0) {
    setTimeout(removeToast, duration);
  }

  return toast;
}

/**
 * 탭 초기화
 * @param {string} containerId - 탭 컨테이너 ID
 */
function initTabs(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const headers = container.querySelectorAll('.tab-header');
  const contents = container.querySelectorAll('.tab-content');

  headers.forEach((header, index) => {
    header.addEventListener('click', () => {
      // 모든 탭 비활성화
      headers.forEach(h => h.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      // 클릭한 탭 활성화
      header.classList.add('active');
      contents[index]?.classList.add('active');
    });
  });

  // 첫 탭 기본 활성화
  if (headers.length > 0) {
    headers[0].classList.add('active');
    contents[0]?.classList.add('active');
  }
}

/**
 * 드롭다운 초기화
 * @param {string} containerId - 드롭다운 컨테이너 ID
 */
function initDropdown(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const trigger = container.querySelector('.dropdown-trigger');
  const menu = container.querySelector('.dropdown-menu');
  const items = container.querySelectorAll('.dropdown-item');

  if (!trigger || !menu) return;

  trigger.addEventListener('click', () => {
    container.classList.toggle('open');
  });

  // 외부 클릭 시 닫기
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      container.classList.remove('open');
    }
  });

  // 메뉴 아이템 클릭
  items.forEach(item => {
    item.addEventListener('click', () => {
      // 이전 선택 제거
      items.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');

      // 트리거 텍스트 변경
      trigger.textContent = item.textContent;

      container.classList.remove('open');
    });
  });
}

/**
 * 아코디언 초기화
 * @param {string} containerId - 아코디언 컨테이너 ID
 */
function initAccordion(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const headers = container.querySelectorAll('.accordion-header');

  headers.forEach((header, index) => {
    header.addEventListener('click', () => {
      const isActive = header.classList.contains('active');

      // 모든 헤더 비활성화
      headers.forEach(h => h.classList.remove('active'));

      // 클릭한 헤더 토글
      if (!isActive) {
        header.classList.add('active');
      }
    });
  });
}

/**
 * 페이지네이션 초기화
 * @param {string} containerId - 페이지네이션 컨테이너 ID
 * @param {number} totalPages - 전체 페이지 수
 * @param {function} onPageChange - 페이지 변경 콜백
 */
function initPagination(containerId, totalPages, onPageChange = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let currentPage = 1;
  const buttons = container.querySelectorAll('.pagination-button');

  const updatePagination = () => {
    buttons.forEach((btn, index) => {
      btn.classList.remove('active');

      if (index === 0) { // 이전
        btn.disabled = currentPage === 1;
      } else if (index === buttons.length - 1) { // 다음
        btn.disabled = currentPage === totalPages;
      } else { // 페이지 번호
        const pageNum = index;
        btn.disabled = false;
        if (currentPage === pageNum) {
          btn.classList.add('active');
        }
      }
    });

    onPageChange?.(currentPage);
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'prev' && currentPage > 1) {
        currentPage--;
      } else if (action === 'next' && currentPage < totalPages) {
        currentPage++;
      } else if (action === 'page') {
        currentPage = parseInt(btn.textContent);
      }

      updatePagination();
    });
  });

  updatePagination();
}

/**
 * 필터 바 초기화
 * @param {string} containerId - 필터 바 컨테이너 ID
 * @param {function} onFilter - 필터 적용 콜백
 */
function initFilterBar(containerId, onFilter = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const applyBtn = container.querySelector('[data-action="apply"]');
  const resetBtn = container.querySelector('[data-action="reset"]');
  const inputs = container.querySelectorAll('input, select');

  applyBtn?.addEventListener('click', () => {
    const filterData = {};
    inputs.forEach(input => {
      if (input.value) {
        filterData[input.name] = input.value;
      }
    });
    onFilter?.(filterData);
  });

  resetBtn?.addEventListener('click', () => {
    inputs.forEach(input => {
      input.value = '';
    });
    onFilter?.({});
  });
}

/**
 * 테이블 정렬 초기화 (고도화)
 * - 숫자/문자열/날짜 자동 감지
 * - 정렬 방향 아이콘 표시 (▲/▼/−)
 * - 3번째 클릭 시 원래 순서로 초기화
 * @param {string} tableId - 테이블 ID
 */
function initTableSort(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const headers = table.querySelectorAll('th');
  const tbody = table.querySelector('tbody');
  if (!tbody) return;

  // 원본 행 순서 저장
  const originalRows = Array.from(tbody.querySelectorAll('tr'));

  /**
   * 셀 값의 데이터 타입 감지
   * @param {string} value - 셀 값
   * @returns {string} 'number' | 'date' | 'string'
   */
  function detectColumnType(value) {
    const trimmed = value.trim();

    // 숫자 판별
    if (!isNaN(trimmed) && trimmed !== '') {
      return 'number';
    }

    // 날짜 판별 (YYYY-MM-DD, YYYY/MM/DD, MM-DD-YYYY 등)
    if (/^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/.test(trimmed)) {
      return 'date';
    }

    return 'string';
  }

  /**
   * 날짜 문자열을 Date 객체로 변환
   * @param {string} dateStr - 날짜 문자열
   * @returns {Date}
   */
  function parseDate(dateStr) {
    return new Date(dateStr.replace(/\//g, '-'));
  }

  headers.forEach((header, columnIndex) => {
    header.style.cursor = 'pointer';
    header.style.position = 'relative';
    header.classList.add('sortable-header');

    // 초기 상태: 정렬 아이콘 없음
    header.dataset.sortState = 'none'; // 'asc' | 'desc' | 'none'

    header.addEventListener('click', () => {
      const currentState = header.dataset.sortState;

      // 상태 전환: none -> asc -> desc -> none
      let newState;
      if (currentState === 'none') {
        newState = 'asc';
      } else if (currentState === 'asc') {
        newState = 'desc';
      } else {
        newState = 'none';
      }

      const rows = Array.from(tbody.querySelectorAll('tr'));

      if (newState === 'none') {
        // 원본 순서로 복원
        tbody.innerHTML = '';
        originalRows.forEach(row => tbody.appendChild(row.cloneNode(true)));
      } else {
        // 첫 행의 셀 값으로 열 타입 감지
        const sampleValue = rows[0]?.cells[columnIndex]?.textContent?.trim() || '';
        const columnType = detectColumnType(sampleValue);

        // 정렬 실행
        rows.sort((a, b) => {
          const aValue = a.cells[columnIndex].textContent.trim();
          const bValue = b.cells[columnIndex].textContent.trim();

          let compareResult;

          if (columnType === 'number') {
            const aNum = parseFloat(aValue);
            const bNum = parseFloat(bValue);
            compareResult = aNum - bNum;
          } else if (columnType === 'date') {
            const aDate = parseDate(aValue);
            const bDate = parseDate(bValue);
            compareResult = aDate - bDate;
          } else {
            // 문자열 비교 (한글 포함)
            compareResult = aValue.localeCompare(bValue, 'ko-KR');
          }

          return newState === 'asc' ? compareResult : -compareResult;
        });

        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
      }

      // 다른 헤더의 정렬 상태 제거
      headers.forEach(h => {
        h.dataset.sortState = 'none';
        updateSortIcon(h);
      });

      // 현재 헤더의 정렬 상태 업데이트
      header.dataset.sortState = newState;
      updateSortIcon(header);
    });

    /**
     * 정렬 아이콘 업데이트
     * @param {HTMLElement} headerElement
     */
    function updateSortIcon(headerElement) {
      const iconSpan = headerElement.querySelector('.sort-icon');
      const state = headerElement.dataset.sortState;

      if (!iconSpan) {
        const newIconSpan = document.createElement('span');
        newIconSpan.className = 'sort-icon';
        headerElement.appendChild(newIconSpan);
        updateSortIcon(headerElement);
        return;
      }

      if (state === 'asc') {
        iconSpan.textContent = ' ▲';
        iconSpan.classList.remove('sort-desc');
        iconSpan.classList.add('sort-asc');
      } else if (state === 'desc') {
        iconSpan.textContent = ' ▼';
        iconSpan.classList.remove('sort-asc');
        iconSpan.classList.add('sort-desc');
      } else {
        iconSpan.textContent = ' −';
        iconSpan.classList.remove('sort-asc', 'sort-desc');
      }
    }

    // 초기 아이콘 생성
    updateSortIcon(header);
  });
}

/**
 * 테이블 실시간 필터
 * - 텍스트 입력으로 전체 열 대상 검색
 * - debounce 300ms 적용
 * - 일치 행 건수 표시 "(X건 / 총 Y건)"
 * @param {string} tableId - 테이블 ID
 * @param {string} filterInputId - 필터 입력 필드 ID
 */
function initTableFilter(tableId, filterInputId) {
  const table = document.getElementById(tableId);
  const filterInput = document.getElementById(filterInputId);

  if (!table || !filterInput) return;

  const tbody = table.querySelector('tbody');
  const allRows = Array.from(tbody.querySelectorAll('tr'));
  let filterTimeout;

  // 일치 건수 정보 표시 요소 생성
  let infoElement = document.querySelector('.table-filter-info');
  if (!infoElement) {
    infoElement = document.createElement('div');
    infoElement.className = 'table-filter-info';
    filterInput.parentNode.insertBefore(infoElement, filterInput.nextSibling);
  }

  /**
   * 필터 적용 (debounce)
   */
  function applyFilter() {
    const searchText = filterInput.value.toLowerCase().trim();

    let visibleCount = 0;

    allRows.forEach(row => {
      // 모든 셀의 텍스트를 연결하여 검색
      const rowText = Array.from(row.cells)
        .map(cell => cell.textContent.toLowerCase())
        .join(' ');

      const isMatch = searchText === '' || rowText.includes(searchText);
      row.style.display = isMatch ? '' : 'none';

      if (isMatch) visibleCount++;
    });

    // 일치 건수 표시
    const totalCount = allRows.length;
    infoElement.textContent = `${visibleCount}건 / 총 ${totalCount}건`;
  }

  // 입력 이벤트에 debounce 적용
  filterInput.addEventListener('input', () => {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(applyFilter, 300);
  });

  // 초기 상태
  applyFilter();
}

/**
 * 검색 자동완성
 * - 제안 목록 표시 (최대 8개)
 * - 키보드 방향키(↑↓) 탐색, Enter 선택, Esc 닫기
 * - 최근 검색 이력 표시 (세션 기반, 최대 5건)
 * @param {string} inputId - 입력 필드 ID
 * @param {array} suggestions - 제안 문자열 배열
 */
function initAutocomplete(inputId, suggestions) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const MAX_ITEMS = 8;
  const MAX_RECENT = 5;
  const STORAGE_KEY = `autocomplete_recent_${inputId}`;

  let container = input.parentElement.querySelector('.autocomplete-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'autocomplete-container';
    input.parentElement.appendChild(container);
  }

  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete-dropdown';
  container.appendChild(dropdown);

  let highlightedIndex = -1;
  let filteredItems = [];

  /**
   * 최근 검색 이력 로드
   * @returns {array}
   */
  function getRecentSearches() {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * 최근 검색 이력 저장
   * @param {string} text
   */
  function saveRecentSearch(text) {
    if (!text.trim()) return;

    const recent = getRecentSearches();
    const filtered = recent.filter(item => item !== text);
    const updated = [text, ...filtered].slice(0, MAX_RECENT);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  /**
   * 드롭다운 렌더링
   * @param {array} items - 표시할 항목
   */
  function renderDropdown(items) {
    filteredItems = items;
    highlightedIndex = -1;

    dropdown.innerHTML = '';

    if (items.length === 0) {
      dropdown.style.display = 'none';
      return;
    }

    items.slice(0, MAX_ITEMS).forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'autocomplete-item';
      div.textContent = item;
      div.dataset.index = index;

      div.addEventListener('click', () => {
        input.value = item;
        saveRecentSearch(item);
        dropdown.style.display = 'none';
        input.focus();
      });

      dropdown.appendChild(div);
    });

    dropdown.style.display = 'block';
  }

  /**
   * 강조 항목 업데이트
   */
  function updateHighlight() {
    const items = dropdown.querySelectorAll('.autocomplete-item');
    items.forEach((item, index) => {
      item.classList.toggle('highlighted', index === highlightedIndex);
    });
  }

  input.addEventListener('input', () => {
    const text = input.value.toLowerCase().trim();

    if (!text) {
      // 빈 입력: 최근 검색 표시
      const recent = getRecentSearches();
      renderDropdown(recent.length > 0 ? recent : suggestions.slice(0, MAX_ITEMS));
    } else {
      // 텍스트 필터링
      const filtered = suggestions.filter(item =>
        item.toLowerCase().includes(text)
      );
      renderDropdown(filtered);
    }
  });

  // 키보드 탐색
  input.addEventListener('keydown', (e) => {
    if (dropdown.style.display === 'none') return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        highlightedIndex = Math.min(highlightedIndex + 1, filteredItems.length - 1);
        updateHighlight();
        break;

      case 'ArrowUp':
        e.preventDefault();
        highlightedIndex = Math.max(highlightedIndex - 1, -1);
        updateHighlight();
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
          const selected = filteredItems[highlightedIndex];
          input.value = selected;
          saveRecentSearch(selected);
          dropdown.style.display = 'none';
        }
        break;

      case 'Escape':
        dropdown.style.display = 'none';
        break;
    }
  });

  // 외부 클릭 시 드롭다운 닫기
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  // 포커스 시 드롭다운 표시
  input.addEventListener('focus', () => {
    const text = input.value.toLowerCase().trim();
    if (!text) {
      const recent = getRecentSearches();
      renderDropdown(recent.length > 0 ? recent : suggestions.slice(0, MAX_ITEMS));
    }
  });
}

/**
 * 복합 조건 필터 UI
 * - 필드별 조건 추가 (text/select/date)
 * - 조건 태그 형태 표시, X 버튼으로 개별 제거
 * - "초기화" 버튼으로 전체 제거
 * @param {string} containerId - 필터 컨테이너 ID
 * @param {array} fields - 필드 배열 [{name, label, type: 'text'|'select'|'date', options}]
 */
function initAdvancedFilter(containerId, fields) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let activeFilters = {}; // {fieldName: value}

  // 필터 태그 컨테이너 생성
  let tagsContainer = container.querySelector('.filter-tags-container');
  if (!tagsContainer) {
    tagsContainer = document.createElement('div');
    tagsContainer.className = 'filter-tags-container';
    container.appendChild(tagsContainer);
  }

  // 필터 입력 폼 생성
  let formContainer = container.querySelector('.advanced-filter-form');
  if (!formContainer) {
    formContainer = document.createElement('div');
    formContainer.className = 'advanced-filter-form';

    const fieldsDiv = document.createElement('div');
    fieldsDiv.className = 'filter-fields';

    fields.forEach(field => {
      const fieldDiv = document.createElement('div');
      fieldDiv.className = 'filter-field';

      const label = document.createElement('label');
      label.textContent = field.label;
      fieldDiv.appendChild(label);

      let input;

      if (field.type === 'select' && field.options) {
        input = document.createElement('select');
        input.className = 'filter-field-select';

        const optionEl = document.createElement('option');
        optionEl.value = '';
        optionEl.textContent = '선택...';
        input.appendChild(optionEl);

        field.options.forEach(opt => {
          const optionEl = document.createElement('option');
          optionEl.value = opt;
          optionEl.textContent = opt;
          input.appendChild(optionEl);
        });
      } else if (field.type === 'date') {
        input = document.createElement('input');
        input.type = 'date';
        input.className = 'filter-field-date';
      } else {
        input = document.createElement('input');
        input.type = 'text';
        input.className = 'filter-field-text';
        input.placeholder = field.label;
      }

      input.dataset.fieldName = field.name;
      fieldDiv.appendChild(input);
      fieldsDiv.appendChild(fieldDiv);
    });

    // 버튼 그룹
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'filter-buttons';

    const applyBtn = document.createElement('button');
    applyBtn.className = 'btn btn-primary';
    applyBtn.textContent = '적용';
    applyBtn.addEventListener('click', applyFilters);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-secondary';
    resetBtn.textContent = '초기화';
    resetBtn.addEventListener('click', clearAllFilters);

    buttonDiv.appendChild(applyBtn);
    buttonDiv.appendChild(resetBtn);

    formContainer.appendChild(fieldsDiv);
    formContainer.appendChild(buttonDiv);
    container.appendChild(formContainer);
  }

  /**
   * 필터 적용
   */
  function applyFilters() {
    activeFilters = {};
    const inputs = formContainer.querySelectorAll('[data-field-name]');

    inputs.forEach(input => {
      const value = input.value.trim();
      if (value) {
        activeFilters[input.dataset.fieldName] = value;
      }
    });

    renderTags();
  }

  /**
   * 태그 렌더링
   */
  function renderTags() {
    tagsContainer.innerHTML = '';

    Object.entries(activeFilters).forEach(([fieldName, value]) => {
      const field = fields.find(f => f.name === fieldName);
      const label = field?.label || fieldName;

      const tag = document.createElement('div');
      tag.className = 'filter-tag';

      const tagContent = document.createElement('span');
      tagContent.className = 'tag-content';
      tagContent.textContent = `${label}: ${value}`;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'tag-remove';
      removeBtn.textContent = '×';
      removeBtn.type = 'button';
      removeBtn.addEventListener('click', () => {
        delete activeFilters[fieldName];

        // 폼의 해당 필드 초기화
        const input = formContainer.querySelector(`[data-field-name="${fieldName}"]`);
        if (input) input.value = '';

        renderTags();
      });

      tag.appendChild(tagContent);
      tag.appendChild(removeBtn);
      tagsContainer.appendChild(tag);
    });
  }

  /**
   * 모든 필터 초기화
   */
  function clearAllFilters() {
    activeFilters = {};
    const inputs = formContainer.querySelectorAll('[data-field-name]');
    inputs.forEach(input => input.value = '');
    renderTags();
  }
}

/**
 * 푸터 렌더링
 */
function renderFooter() {
  let footer = document.getElementById('footer');

  // 푸터가 없으면 생성
  if (!footer) {
    footer = document.createElement('footer');
    footer.id = 'footer';
    const appShell = document.getElementById('app-shell');
    if (appShell) {
      appShell.appendChild(footer);
    } else {
      document.body.appendChild(footer);
    }
  }

  // 현재 연도
  const currentYear = new Date().getFullYear();

  // 현재 페이지의 RFP 근거 조회
  const currentPage = getCurrentPageName();
  const rfpRefs = getRfpReferences(currentPage);

  // RFP 근거 HTML 생성
  let rfpHtml = '';
  if (rfpRefs.length > 0) {
    const rfpTags = rfpRefs.map(ref =>
      `<span class="rfp-tag"><strong>${ref.code}</strong> ${ref.label}<span class="rfp-owner">담당사: ${ref.owners || '-'}</span></span>`
    ).join('');
    rfpHtml = `
      <div class="footer-rfp">
        <span class="footer-rfp-label">RFP 근거</span>
        ${rfpTags}
      </div>
    `;
  }

  // 푸터 내용 설정
  footer.innerHTML = `
    ${rfpHtml}
    <div class="footer-bottom">
      <div class="footer-copyright">
        &copy; ${currentYear} 제주특별자치도 스마트도시 데이터허브
      </div>
      <div class="footer-links">
        <a href="#" class="footer-link">개인정보처리방침</a>
        <a href="#" class="footer-link">이용약관</a>
      </div>
      <div class="footer-version">
        v1.0.0
      </div>
    </div>
  `;
}

/**
 * 모든 컴포넌트 초기화
 */
function initAllComponents() {
  // GNB 메뉴 렌더링
  renderGnbMenus();

  // LNB 토글 버튼
  const lnbToggle = document.querySelector('.lnb-toggle-btn');
  if (lnbToggle) {
    lnbToggle.addEventListener('click', toggleLnb);
  }

  // 사용자 프로필 메뉴
  const gnbUser = document.querySelector('.gnb-user');
  if (gnbUser) {
    gnbUser.addEventListener('click', () => {
      showModal('사용자 메뉴', `
        <div style="padding: 10px 0;">
          <button class="btn btn-secondary" style="width: 100%; margin-bottom: 10px;" onclick="toggleTheme()">
            테마 전환
          </button>
          <button class="btn btn-danger" style="width: 100%;" onclick="logout()">
            로그아웃
          </button>
        </div>
      `, { showCancel: false, confirmText: '닫기' });
    });
  }

  // 푸터 렌더링
  renderFooter();

  // Lucide 아이콘 초기화
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/**
 * 테마 토글
 */
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';

  if (isDark) {
    html.removeAttribute('data-theme');
    html.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  } else {
    html.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }

  showToast('테마가 변경되었습니다.', 'info');
}

/**
 * 저장된 테마 적용
 */
function applyTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    initAllComponents();
  });
} else {
  applyTheme();
  initAllComponents();
}
