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
  }
};
