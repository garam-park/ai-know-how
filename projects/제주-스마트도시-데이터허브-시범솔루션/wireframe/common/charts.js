/**
 * Chart Component Helpers
 * Chart.js 래퍼 헬퍼 함수
 */

// 기본 색상 정의
const chartColors = {
  primary: '#2563EB',
  secondary: '#7C3AED',
  success: '#16A34A',
  warning: '#EAB308',
  danger: '#DC2626',
  gray: '#6B7280',
  colors: ['#2563EB', '#7C3AED', '#16A34A', '#EAB308', '#DC2626', '#F59E0B', '#10B981', '#06B6D4']
};

/**
 * 라인 차트 생성
 * @param {string} canvasId - Canvas 요소 ID
 * @param {array} labels - X축 라벨 배열
 * @param {array} datasets - 데이터셋 배열
 * @param {object} options - Chart.js 옵션
 * @returns {object} Chart 인스턴스
 */
function createLineChart(canvasId, labels, datasets, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // 데이터셋에 색상 자동 지정
  datasets = datasets.map((dataset, index) => ({
    ...dataset,
    borderColor: dataset.borderColor || chartColors.colors[index % chartColors.colors.length],
    backgroundColor: (dataset.borderColor || chartColors.colors[index % chartColors.colors.length]) + '20',
    tension: 0.4,
    fill: false,
    ...dataset
  }));

  if (typeof Chart === 'undefined') {
    console.error('Chart.js library not loaded');
    return null;
  }

  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: mergedOptions
  });
}

/**
 * 바 차트 생성 (수직)
 * @param {string} canvasId - Canvas 요소 ID
 * @param {array} labels - X축 라벨 배열
 * @param {array} datasets - 데이터셋 배열
 * @param {object} options - Chart.js 옵션
 * @returns {object} Chart 인스턴스
 */
function createBarChart(canvasId, labels, datasets, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // 데이터셋에 색상 자동 지정
  datasets = datasets.map((dataset, index) => ({
    ...dataset,
    backgroundColor: dataset.backgroundColor || chartColors.colors[index % chartColors.colors.length],
    borderColor: '#fff',
    borderWidth: 1,
    ...dataset
  }));

  if (typeof Chart === 'undefined') {
    console.error('Chart.js library not loaded');
    return null;
  }

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: mergedOptions
  });
}

/**
 * 파이 차트 생성
 * @param {string} canvasId - Canvas 요소 ID
 * @param {array} labels - 라벨 배열
 * @param {array} data - 데이터 배열
 * @param {object} options - Chart.js 옵션
 * @returns {object} Chart 인스턴스
 */
function createPieChart(canvasId, labels, data, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'right'
      }
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  if (typeof Chart === 'undefined') {
    console.error('Chart.js library not loaded');
    return null;
  }

  return new Chart(canvas, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: chartColors.colors.slice(0, labels.length),
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: mergedOptions
  });
}

/**
 * 도넛 차트 생성
 * @param {string} canvasId - Canvas 요소 ID
 * @param {array} labels - 라벨 배열
 * @param {array} data - 데이터 배열
 * @param {object} options - Chart.js 옵션
 * @returns {object} Chart 인스턴스
 */
function createDoughnutChart(canvasId, labels, data, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'right'
      }
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  if (typeof Chart === 'undefined') {
    console.error('Chart.js library not loaded');
    return null;
  }

  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: chartColors.colors.slice(0, labels.length),
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: mergedOptions
  });
}

/**
 * 레이더 차트 생성
 * @param {string} canvasId - Canvas 요소 ID
 * @param {array} labels - 축 라벨 배열
 * @param {array} datasets - 데이터셋 배열
 * @param {object} options - Chart.js 옵션
 * @returns {object} Chart 인스턴스
 */
function createRadarChart(canvasId, labels, datasets, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // 데이터셋에 색상 자동 지정
  datasets = datasets.map((dataset, index) => ({
    ...dataset,
    borderColor: dataset.borderColor || chartColors.colors[index % chartColors.colors.length],
    backgroundColor: (dataset.borderColor || chartColors.colors[index % chartColors.colors.length]) + '33',
    fill: true,
    ...dataset
  }));

  if (typeof Chart === 'undefined') {
    console.error('Chart.js library not loaded');
    return null;
  }

  return new Chart(canvas, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: mergedOptions
  });
}

/**
 * 버블 차트 생성
 * @param {string} canvasId - Canvas 요소 ID
 * @param {array} datasets - 데이터셋 배열 (x, y, r)
 * @param {object} options - Chart.js 옵션
 * @returns {object} Chart 인스턴스
 */
function createBubbleChart(canvasId, datasets, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      x: {
        beginAtZero: true
      },
      y: {
        beginAtZero: true
      }
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // 데이터셋에 색상 자동 지정
  datasets = datasets.map((dataset, index) => ({
    ...dataset,
    backgroundColor: (dataset.backgroundColor || chartColors.colors[index % chartColors.colors.length]) + '66',
    borderColor: dataset.borderColor || chartColors.colors[index % chartColors.colors.length],
    borderWidth: 1,
    ...dataset
  }));

  if (typeof Chart === 'undefined') {
    console.error('Chart.js library not loaded');
    return null;
  }

  return new Chart(canvas, {
    type: 'bubble',
    data: {
      datasets: datasets
    },
    options: mergedOptions
  });
}

/**
 * 스캐터 차트 생성
 * @param {string} canvasId - Canvas 요소 ID
 * @param {array} datasets - 데이터셋 배열
 * @param {object} options - Chart.js 옵션
 * @returns {object} Chart 인스턴스
 */
function createScatterChart(canvasId, datasets, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      x: {
        beginAtZero: true
      },
      y: {
        beginAtZero: true
      }
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // 데이터셋에 색상 자동 지정
  datasets = datasets.map((dataset, index) => ({
    ...dataset,
    backgroundColor: dataset.backgroundColor || chartColors.colors[index % chartColors.colors.length],
    borderColor: dataset.borderColor || chartColors.colors[index % chartColors.colors.length],
    ...dataset
  }));

  if (typeof Chart === 'undefined') {
    console.error('Chart.js library not loaded');
    return null;
  }

  return new Chart(canvas, {
    type: 'scatter',
    data: {
      datasets: datasets
    },
    options: mergedOptions
  });
}

/**
 * 수평 바 차트 생성
 * @param {string} canvasId - Canvas 요소 ID
 * @param {array} labels - Y축 라벨 배열
 * @param {array} datasets - 데이터셋 배열
 * @param {object} options - Chart.js 옵션
 * @returns {object} Chart 인스턴스
 */
function createHorizontalBarChart(canvasId, labels, datasets, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const defaultOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      x: {
        beginAtZero: true
      }
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // 데이터셋에 색상 자동 지정
  datasets = datasets.map((dataset, index) => ({
    ...dataset,
    backgroundColor: dataset.backgroundColor || chartColors.colors[index % chartColors.colors.length],
    borderColor: '#fff',
    borderWidth: 1,
    ...dataset
  }));

  if (typeof Chart === 'undefined') {
    console.error('Chart.js library not loaded');
    return null;
  }

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: mergedOptions
  });
}

/**
 * 트리맵 차트 생성 (Div 기반 레이아웃)
 * 카테고리별 비율을 직사각형 면적으로 표현
 *
 * @param {string} containerId - 컨테이너 div ID
 * @param {array} data - 데이터 배열 [{label, value, color}, ...]
 * @param {object} options - 옵션 {width, height, fontSize, showValues}
 * @returns {object} {element, data, update} 트리맵 객체
 *
 * 사용 예시:
 * const treemap = createTreemap('treemap-container', [
 *   {label: '교통', value: 45, color: '#2563EB'},
 *   {label: '주차', value: 28, color: '#7C3AED'},
 *   {label: '환경', value: 15, color: '#16A34A'},
 *   {label: '에너지', value: 12, color: '#EAB308'}
 * ], {width: 500, height: 400});
 */
function createTreemap(containerId, data, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container "${containerId}" not found`);
    return null;
  }

  const {
    width = container.offsetWidth || 500,
    height = container.offsetHeight || 400,
    fontSize = 12,
    showValues = true
  } = options;

  // 데이터 검증 및 정규화
  if (!Array.isArray(data) || data.length === 0) {
    console.error('Invalid data format');
    return null;
  }

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const normalizedData = data.map(item => ({
    ...item,
    percentage: (item.value / totalValue * 100).toFixed(1),
    area: (item.value / totalValue)
  }));

  // 컨테이너 초기화
  container.innerHTML = '';
  container.style.width = width + 'px';
  container.style.height = height + 'px';
  container.style.display = 'flex';
  container.style.flexWrap = 'wrap';
  container.style.gap = '2px';
  container.style.padding = '8px';
  container.style.backgroundColor = '#f9fafb';
  container.style.borderRadius = '4px';

  // 각 항목에 대한 직사각형 생성 (간단한 레이아웃)
  const itemHeight = Math.sqrt(height * width / data.length) * 0.8;

  normalizedData.forEach(item => {
    const itemWidth = (width - 16) * item.area;
    const rect = document.createElement('div');

    rect.style.width = itemWidth + 'px';
    rect.style.height = itemHeight + 'px';
    rect.style.backgroundColor = item.color || chartColors.colors[Math.floor(Math.random() * chartColors.colors.length)];
    rect.style.borderRadius = '4px';
    rect.style.display = 'flex';
    rect.style.flexDirection = 'column';
    rect.style.justifyContent = 'center';
    rect.style.alignItems = 'center';
    rect.style.padding = '8px';
    rect.style.cursor = 'pointer';
    rect.style.transition = 'all 0.2s ease';
    rect.style.opacity = '0.85';
    rect.style.color = '#ffffff';
    rect.style.fontSize = fontSize + 'px';
    rect.style.fontWeight = '500';
    rect.style.textAlign = 'center';
    rect.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';

    // 라벨
    const label = document.createElement('div');
    label.textContent = item.label;
    label.style.fontWeight = 'bold';
    label.style.marginBottom = '4px';
    rect.appendChild(label);

    // 값 표시
    if (showValues) {
      const value = document.createElement('div');
      value.textContent = `${item.value} (${item.percentage}%)`;
      value.style.fontSize = (fontSize - 2) + 'px';
      value.style.opacity = '0.9';
      rect.appendChild(value);
    }

    // 호버 효과
    rect.addEventListener('mouseenter', function() {
      this.style.opacity = '1';
      this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      this.style.transform = 'scale(1.02)';
    });

    rect.addEventListener('mouseleave', function() {
      this.style.opacity = '0.85';
      this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      this.style.transform = 'scale(1)';
    });

    // 툴팁 표시
    rect.addEventListener('mouseover', function() {
      const tooltip = document.createElement('div');
      tooltip.textContent = `${item.label}: ${item.value} (${item.percentage}%)`;
      tooltip.style.position = 'fixed';
      tooltip.style.backgroundColor = '#1f2937';
      tooltip.style.color = '#ffffff';
      tooltip.style.padding = '6px 12px';
      tooltip.style.borderRadius = '4px';
      tooltip.style.fontSize = '12px';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.zIndex = '10000';
      tooltip.style.whiteSpace = 'nowrap';
      document.body.appendChild(tooltip);

      const moveTooltip = (e) => {
        tooltip.style.left = (e.clientX + 10) + 'px';
        tooltip.style.top = (e.clientY - 20) + 'px';
      };

      document.addEventListener('mousemove', moveTooltip);

      rect.addEventListener('mouseleave', function() {
        document.removeEventListener('mousemove', moveTooltip);
        tooltip.remove();
      });
    });

    container.appendChild(rect);
  });

  return {
    element: container,
    data: normalizedData,
    update: function(newData) {
      return createTreemap(containerId, newData, options);
    }
  };
}

/**
 * 게이지 차트 생성 (반원형 게이지)
 * 색상 구간: 0-40% 녹색, 40-70% 노랑색, 70-100% 빨간색
 *
 * @param {string} containerId - 컨테이너 div ID
 * @param {number} value - 현재 값
 * @param {number} max - 최대값
 * @param {object} options - 옵션 {width, height, unit, colorZones, animated}
 * @returns {object} {element, setValue} 게이지 객체
 *
 * 사용 예시:
 * const gauge = createGauge('gauge-container', 65, 100, {
 *   unit: '%',
 *   colorZones: [{min: 0, max: 40, color: '#16A34A'}, {min: 40, max: 70, color: '#EAB308'}, {min: 70, max: 100, color: '#DC2626'}],
 *   animated: true
 * });
 * gauge.setValue(75);
 */
function createGauge(containerId, value, max, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container "${containerId}" not found`);
    return null;
  }

  const {
    width = 300,
    height = 200,
    unit = '%',
    colorZones = [
      { min: 0, max: 40, color: '#16A34A' },    // 정상 (녹색)
      { min: 40, max: 70, color: '#EAB308' },   // 주의 (노랑색)
      { min: 70, max: 100, color: '#DC2626' }   // 위험 (빨간색)
    ],
    animated = true
  } = options;

  container.innerHTML = '';
  container.style.width = width + 'px';
  container.style.height = height + 'px';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';

  // Canvas 생성
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.maxWidth = '100%';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // 색상 결정
  const getColor = (val) => {
    const percentage = (val / max) * 100;
    for (let zone of colorZones) {
      if (percentage >= zone.min && percentage <= zone.max) {
        return zone.color;
      }
    }
    return colorZones[colorZones.length - 1].color;
  };

  const drawGauge = (currentValue) => {
    const centerX = width / 2;
    const centerY = height * 0.7;
    const radius = Math.min(width, height) * 0.35;

    // 배경 호 (회색)
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 20;
    ctx.stroke();

    // 색상 구간 호 그리기
    for (let zone of colorZones) {
      const startAngle = Math.PI + (zone.min / 100) * Math.PI;
      const endAngle = Math.PI + (zone.max / 100) * Math.PI;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 20;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 현재 값에 해당하는 호 그리기
    const percentage = Math.min((currentValue / max) * 100, 100);
    const angle = Math.PI + (percentage / 100) * Math.PI;
    const color = getColor(currentValue);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, angle, false);
    ctx.strokeStyle = color;
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 바늘 그리기
    const needleX = centerX + radius * Math.cos(angle - Math.PI / 2);
    const needleY = centerY + radius * Math.sin(angle - Math.PI / 2);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(needleX, needleY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 중심 원
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#1f2937';
    ctx.fill();

    // 값 표시
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(currentValue + unit, centerX, centerY + 30);

    // 최대값 표시
    ctx.font = '12px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('0', centerX - radius - 10, centerY + 5);
    ctx.fillText(max + unit, centerX + radius + 10, centerY + 5);
  };

  if (animated) {
    let currentValue = 0;
    const animationFrames = 30;
    const increment = value / animationFrames;

    const animate = () => {
      if (currentValue < value) {
        currentValue = Math.min(currentValue + increment, value);
        drawGauge(currentValue);
        requestAnimationFrame(animate);
      }
    };
    animate();
  } else {
    drawGauge(value);
  }

  return {
    element: container,
    setValue: function(newValue) {
      value = Math.min(newValue, max);
      drawGauge(value);
    },
    setMax: function(newMax) {
      max = newMax;
      drawGauge(value);
    }
  };
}

/**
 * 차트 리사이즈 핸들러 추가 (Debounce 적용)
 * Window resize 이벤트에 대응하여 차트 자동 리사이즈
 *
 * @param {object} chartInstance - Chart.js 차트 인스턴스
 * @param {number} debounceDelay - Debounce 지연시간 (기본값: 250ms)
 *
 * 사용 예시:
 * const chart = createLineChart('myCanvas', labels, datasets);
 * addResizeHandler(chart);
 */
function addResizeHandler(chartInstance, debounceDelay = 250) {
  if (!chartInstance || typeof chartInstance.resize !== 'function') {
    console.error('Invalid chart instance');
    return;
  }

  let resizeTimeout;

  const resizeHandler = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (chartInstance && chartInstance.resize) {
        chartInstance.resize();
      }
    }, debounceDelay);
  };

  window.addEventListener('resize', resizeHandler);

  // 차트 인스턴스에 리스너 제거 메서드 추가
  chartInstance.removeResizeListener = () => {
    window.removeEventListener('resize', resizeHandler);
  };
}

/**
 * 범례 토글 기능 강화
 * 범례 항목 클릭 시 데이터셋 표시/숨김 기능 보장
 * Chart.js는 기본적으로 이 기능을 제공하지만, 이 함수로 명시적 설정 가능
 *
 * @param {object} chartInstance - Chart.js 차트 인스턴스
 * @param {object} options - 옵션 {onToggle}
 *
 * 사용 예시:
 * const chart = createLineChart('myCanvas', labels, datasets);
 * enhanceLegendToggle(chart, {
 *   onToggle: function(label, visible) {
 *     console.log(`${label} visibility: ${visible}`);
 *   }
 * });
 */
function enhanceLegendToggle(chartInstance, options = {}) {
  if (!chartInstance || !chartInstance.options) {
    console.error('Invalid chart instance');
    return;
  }

  const { onToggle } = options;

  // Chart.js 기본 범례 클릭 핸들러 설정
  const currentLegendOnClick = chartInstance.options.plugins?.legend?.onClick;

  chartInstance.options.plugins = chartInstance.options.plugins || {};
  chartInstance.options.plugins.legend = chartInstance.options.plugins.legend || {};

  chartInstance.options.plugins.legend.onClick = function(e, legendItem, legend) {
    const index = legendItem.datasetIndex;
    const chart = legend.chart;
    const meta = chart.getDatasetMeta(index);

    // 데이터셋 표시/숨김 토글
    meta.hidden = !meta.hidden;
    chart.update();

    // 콜백 실행
    if (typeof onToggle === 'function') {
      const label = legendItem.text;
      onToggle(label, !meta.hidden);
    }
  };

  // 범례 스타일 개선
  chartInstance.options.plugins.legend.labels = chartInstance.options.plugins.legend.labels || {};
  chartInstance.options.plugins.legend.labels.usePointStyle = true;
  chartInstance.options.plugins.legend.labels.padding = 15;
  chartInstance.options.plugins.legend.labels.font = { size: 12, weight: '500' };

  chartInstance.update();
}

/**
 * 더미 데이터 생성 함수
 */
const dummyData = {
  // 일일 교통량 데이터
  trafficData: {
    labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
    datasets: [{
      label: '교통량 (대/시간)',
      data: Array.from({ length: 24 }, () => Math.floor(Math.random() * 3000) + 500)
    }]
  },

  // 지역별 주차장 수
  parkingData: {
    labels: ['제주시', '서귀포시', '북제주', '남제주'],
    datasets: [{
      label: '주차장 수',
      data: [45, 32, 28, 25]
    }]
  },

  // 운영 상태 분포
  statusData: {
    labels: ['정상', '주의', '위험'],
    data: [60, 25, 15]
  },

  // 에너지 구성
  energyData: {
    labels: ['태양광', '풍력', '그리드'],
    data: [35, 25, 40]
  },

  // 트리맵용 LLM 분류 현황 데이터
  llmClassificationData: [
    { label: '교통', value: 45, color: '#2563EB' },
    { label: '주차', value: 28, color: '#7C3AED' },
    { label: '환경', value: 15, color: '#16A34A' },
    { label: '에너지', value: 12, color: '#EAB308' }
  ],

  // 시나리오 비교용 레이더 차트 데이터
  scenarioRadarData: {
    labels: ['비용', '효율성', '지속가능성', '사용성', '유지보수성', '확장성'],
    datasets: [
      {
        label: '현재 시나리오',
        data: [65, 59, 90, 81, 56, 55],
        borderColor: '#2563EB',
        backgroundColor: '#2563EB33'
      },
      {
        label: '제안 시나리오',
        data: [28, 48, 40, 19, 96, 27],
        borderColor: '#16A34A',
        backgroundColor: '#16A34A33'
      }
    ]
  },

  // 클러스터링 버블 차트 데이터
  clusteringBubbleData: [
    {
      label: '교통 클러스터',
      data: [
        { x: 10, y: 20, r: 15, label: '교통 A' },
        { x: 15, y: 25, r: 20, label: '교통 B' },
        { x: 8, y: 18, r: 12, label: '교통 C' }
      ],
      backgroundColor: '#2563EB66',
      borderColor: '#2563EB'
    },
    {
      label: '환경 클러스터',
      data: [
        { x: 50, y: 60, r: 18, label: '환경 A' },
        { x: 55, y: 65, r: 22, label: '환경 B' }
      ],
      backgroundColor: '#16A34A66',
      borderColor: '#16A34A'
    }
  ]
};
