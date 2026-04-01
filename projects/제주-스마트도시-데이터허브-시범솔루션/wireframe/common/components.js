/**
 * Common Component Library
 * 공통 컴포넌트 라이브러리 - UI 상호작용 처리
 */

/**
 * 레이아웃 초기화
 * @param {string} groupId - 현재 그룹 ID
 */
function initLayout(groupId) {
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
 * 테이블 정렬 초기화
 * @param {string} tableId - 테이블 ID
 */
function initTableSort(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const headers = table.querySelectorAll('th');

  headers.forEach((header, columnIndex) => {
    header.style.cursor = 'pointer';

    header.addEventListener('click', () => {
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));

      const isAscending = header.dataset.sort === 'asc';
      const sortOrder = isAscending ? 'desc' : 'asc';

      rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent.trim();
        const bValue = b.cells[columnIndex].textContent.trim();

        if (!isNaN(aValue) && !isNaN(bValue)) {
          return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });

      tbody.innerHTML = '';
      rows.forEach(row => tbody.appendChild(row));

      // 정렬 상태 표시
      headers.forEach(h => h.dataset.sort = '');
      header.dataset.sort = sortOrder;
    });
  });
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

  // Lucide 아이콘 초기화
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/**
 * 테마 토글
 */
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
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
