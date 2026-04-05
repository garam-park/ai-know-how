/**
 * Map Component Helpers
 * Leaflet 래퍼 헬퍼 함수
 */

// 제주도 좌표 및 기본 설정
const JEJU_CONFIG = {
  center: [33.3617, 126.5292],
  zoom: 11,
  minZoom: 9,
  maxZoom: 18
};

// 제주도 주차장 더미 데이터 (9개소)
const PARKING_LOTS = [
  { id: 1, name: '제주국제공항', lat: 33.5063, lng: 126.4929, capacity: 450, current: 382 },
  { id: 2, name: '롯데면세점', lat: 33.3192, lng: 126.5289, capacity: 180, current: 156 },
  { id: 3, name: '신라호텔', lat: 33.3156, lng: 126.5328, capacity: 120, current: 95 },
  { id: 4, name: '중앙로 지하주차장', lat: 33.3182, lng: 126.5334, capacity: 250, current: 198 },
  { id: 5, name: '탑동 공영주차장', lat: 33.3214, lng: 126.5385, capacity: 300, current: 245 },
  { id: 6, name: '건입동 주차장', lat: 33.3297, lng: 126.5416, capacity: 200, current: 165 },
  { id: 7, name: '제주항 주차장', lat: 33.3084, lng: 126.5125, capacity: 150, current: 110 },
  { id: 8, name: '칠성로 주차장', lat: 33.3245, lng: 126.5245, capacity: 180, current: 135 },
  { id: 9, name: '첫마음길 주차장', lat: 33.3120, lng: 126.5198, capacity: 200, current: 155 }
];

/**
 * 제주도 중심 지도 생성
 * @param {string} containerId - 지도 컨테이너 ID
 * @param {object} options - Leaflet 옵션
 * @returns {object} Leaflet map 인스턴스
 */
function createJejuMap(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container || typeof L === 'undefined') {
    console.error('Map container not found or Leaflet not loaded');
    return null;
  }

  const defaultOptions = {
    center: JEJU_CONFIG.center,
    zoom: JEJU_CONFIG.zoom,
    minZoom: JEJU_CONFIG.minZoom,
    maxZoom: JEJU_CONFIG.maxZoom,
    scrollWheelZoom: true
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // 지도 생성
  const map = L.map(containerId, mergedOptions);

  // OpenStreetMap 타일 레이어 추가
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  // 스케일 컨트롤 추가
  L.control.scale({ position: 'bottomleft' }).addTo(map);

  return map;
}

/**
 * 마커 일괄 추가
 * @param {object} map - Leaflet map 인스턴스
 * @param {array} markersData - 마커 데이터 배열 [{ lat, lng, title, content }, ...]
 * @returns {array} 마커 배열
 */
function addMarkers(map, markersData) {
  if (!map || typeof L === 'undefined') {
    console.error('Map not initialized or Leaflet not loaded');
    return [];
  }

  const markers = [];

  markersData.forEach((markerData, index) => {
    const marker = L.marker([markerData.lat, markerData.lng])
      .addTo(map)
      .bindPopup(`
        <div style="width: 200px;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold;">${markerData.title || markerData.name}</h4>
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;">
          <div style="font-size: 12px; color: #666;">
            ${markerData.content || ''}
          </div>
          ${markerData.actionUrl ? `<a href="${markerData.actionUrl}" style="color: #2563EB; text-decoration: none; display: block; margin-top: 8px;">상세보기</a>` : ''}
        </div>
      `);

    markers.push(marker);
  });

  return markers;
}

/**
 * 주차장 마커 추가
 * @param {object} map - Leaflet map 인스턴스
 * @returns {array} 마커 배열
 */
function addParkingLotMarkers(map) {
  const markersData = PARKING_LOTS.map(lot => ({
    lat: lot.lat,
    lng: lot.lng,
    name: lot.name,
    title: lot.name,
    content: `
      <div>
        <p><strong>수용 용량:</strong> ${lot.capacity}대</p>
        <p><strong>현재 이용:</strong> ${lot.current}대</p>
        <p><strong>이용률:</strong> ${Math.round(lot.current / lot.capacity * 100)}%</p>
      </div>
    `,
    actionUrl: '#'
  }));

  return addMarkers(map, markersData);
}

/**
 * 히트맵 레이어 추가
 * @param {object} map - Leaflet map 인스턴스
 * @param {array} data - 히트맵 데이터 [{ lat, lng, value }, ...]
 * @param {object} options - 히트맵 옵션
 * @returns {object} 히트맵 레이어
 */
function addHeatmapLayer(map, data, options = {}) {
  if (!map || typeof L === 'undefined' || !L.heatLayer) {
    console.warn('Heatmap plugin not available');
    return null;
  }

  const defaultOptions = {
    radius: 15,
    blur: 15,
    max: 1.0,
    minOpacity: 0.5,
    gradient: {
      0.0: '#0000FF',
      0.5: '#00FFFF',
      0.7: '#FFFF00',
      1.0: '#FF0000'
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // 데이터 포맷팅 (Leaflet.heat 형식)
  const heatData = data.map(point => [point.lat, point.lng, point.value]);

  const heatmapLayer = L.heatLayer(heatData, mergedOptions).addTo(map);

  return heatmapLayer;
}

/**
 * 더미 히트맵 데이터 생성
 * @returns {array} 히트맵 데이터
 */
function generateHeatmapData(count = 200) {
  const data = [];
  const minLat = 33.2;
  const maxLat = 33.5;
  const minLng = 126.4;
  const maxLng = 126.6;

  for (let i = 0; i < count; i++) {
    data.push({
      lat: minLat + Math.random() * (maxLat - minLat),
      lng: minLng + Math.random() * (maxLng - minLng),
      value: Math.random()
    });
  }

  return data;
}

/**
 * 폴리곤 레이어 추가
 * @param {object} map - Leaflet map 인스턴스
 * @param {array} polygons - 폴리곤 데이터 배열
 * @returns {array} 폴리곤 레이어 배열
 */
function addPolygonLayer(map, polygons) {
  if (!map || typeof L === 'undefined') {
    console.error('Map not initialized or Leaflet not loaded');
    return [];
  }

  const polygonLayers = [];

  polygons.forEach((polygon, index) => {
    const layer = L.polygon(polygon.coordinates, {
      color: polygon.color || '#666',
      weight: 2,
      opacity: 1,
      fillColor: polygon.fillColor || '#888',
      fillOpacity: 0.2
    })
      .addTo(map)
      .bindPopup(`
        <div style="width: 200px;">
          <h4 style="margin: 0 0 8px 0;">${polygon.name}</h4>
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;">
          <div style="font-size: 12px;">
            <p><strong>면적:</strong> ${polygon.area || 'N/A'}</p>
            <p><strong>인구:</strong> ${polygon.population || 'N/A'}</p>
          </div>
        </div>
      `);

    polygonLayers.push(layer);

    // 호버 효과
    layer.on('mouseover', function() {
      this.setStyle({ fillOpacity: 0.5 });
    });
    layer.on('mouseout', function() {
      this.setStyle({ fillOpacity: 0.2 });
    });
  });

  return polygonLayers;
}

/**
 * 제주도 행정 경계 폴리곤 추가 (더미)
 * @param {object} map - Leaflet map 인스턴스
 * @returns {array} 폴리곤 레이어 배열
 */
function addJejuDistricts(map) {
  const districts = [
    {
      name: '제주시',
      coordinates: [
        [33.42, 126.52],
        [33.42, 126.54],
        [33.40, 126.54],
        [33.40, 126.52]
      ],
      color: '#3B82F6',
      fillColor: '#60A5FA',
      area: '1,848.23 km²',
      population: '197,000명'
    },
    {
      name: '서귀포시',
      coordinates: [
        [33.24, 126.52],
        [33.24, 126.54],
        [33.22, 126.54],
        [33.22, 126.52]
      ],
      color: '#7C3AED',
      fillColor: '#A78BFA',
      area: '1,849.02 km²',
      population: '172,000명'
    }
  ];

  return addPolygonLayer(map, districts);
}

/**
 * 서클 레이어 추가
 * @param {object} map - Leaflet map 인스턴스
 * @param {number} lat - 위도
 * @param {number} lng - 경도
 * @param {number} radiusMeters - 반지름 (미터)
 * @param {object} options - 옵션
 * @returns {object} 서클 레이어
 */
function addCircle(map, lat, lng, radiusMeters, options = {}) {
  if (!map || typeof L === 'undefined') {
    console.error('Map not initialized or Leaflet not loaded');
    return null;
  }

  const defaultOptions = {
    color: '#2563EB',
    weight: 2,
    opacity: 1,
    fillColor: '#2563EB',
    fillOpacity: 0.2,
    radius: radiusMeters
  };

  const mergedOptions = { ...defaultOptions, ...options };

  const circle = L.circle([lat, lng], mergedOptions).addTo(map);

  return circle;
}

/**
 * 범례 추가
 * @param {object} map - Leaflet map 인스턴스
 * @param {object} legendData - 범례 데이터 {items: [{label, color}, ...]}
 * @returns {object} 범례 컨트롤
 */
function addLegend(map, legendData) {
  if (!map || typeof L === 'undefined') {
    console.error('Map not initialized or Leaflet not loaded');
    return null;
  }

  const legend = L.control({ position: 'bottomright' });

  legend.onAdd = function() {
    const div = L.DomUtil.create('div', 'legend');
    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';
    div.style.boxShadow = '0 0 15px rgba(0,0,0,0.2)';
    div.style.fontFamily = 'Arial, sans-serif';

    legendData.items?.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.marginBottom = '5px';

      const colorBox = document.createElement('span');
      colorBox.style.backgroundColor = item.color || '#ccc';
      colorBox.style.width = '20px';
      colorBox.style.height = '20px';
      colorBox.style.display = 'inline-block';
      colorBox.style.marginRight = '5px';
      colorBox.style.borderRadius = '3px';

      const label = document.createElement('span');
      label.textContent = item.label;

      itemDiv.appendChild(colorBox);
      itemDiv.appendChild(label);
      div.appendChild(itemDiv);
    });

    return div;
  };

  legend.addTo(map);
  return legend;
}

/**
 * 기본 범례 추가 (주차장)
 * @param {object} map - Leaflet map 인스턴스
 */
function addDefaultLegend(map) {
  const legendData = {
    items: [
      { label: '공영주차장', color: '#2563EB' },
      { label: '혼잡 (80-100%)', color: '#DC2626' },
      { label: '주의 (60-80%)', color: '#EAB308' },
      { label: '여유 (0-60%)', color: '#16A34A' }
    ]
  };

  addLegend(map, legendData);
}

/**
 * 지도 타입 컨트롤 추가
 * @param {object} map - Leaflet map 인스턴스
 */
function addMapTypeControl(map) {
  if (!map || typeof L === 'undefined') {
    console.error('Map not initialized or Leaflet not loaded');
    return;
  }

  const baseLayers = {
    '기본지도': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }),
    '위성': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri'
    })
  };

  // 기본 레이어를 이미 추가했으므로 컨트롤만 생성
  // L.control.layers(baseLayers).addTo(map);
}

/**
 * 검색 기능 (더미 구현)
 * @param {object} map - Leaflet map 인스턴스
 * @param {string} searchTerm - 검색어
 */
function searchLocation(map, searchTerm) {
  if (!map) return;

  // 주차장명으로 검색
  const lot = PARKING_LOTS.find(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (lot) {
    map.setView([lot.lat, lot.lng], 15);
    return lot;
  }

  return null;
}

/**
 * 전체 마커 클러스터링 (더미 구현)
 * @param {object} map - Leaflet map 인스턴스
 * @param {array} markers - 마커 배열
 */
function clusterMarkers(map, markers) {
  if (!map || typeof L === 'undefined' || !L.markerClusterGroup) {
    console.warn('MarkerCluster plugin not available');
    return null;
  }

  const clusterGroup = L.markerClusterGroup();
  markers.forEach(marker => clusterGroup.addLayer(marker));
  map.addLayer(clusterGroup);

  return clusterGroup;
}

// ============================================================================
// 새로운 DOM 기반 지도 헬퍼 함수 (Wireframe/PoC용 시뮬레이션)
// ============================================================================

/**
 * 폴리곤 오버레이 레이어 추가 (DOM 기반 시뮬레이션)
 * 제주도 지도 컨테이너 내에 색상이 지정된 오버레이 div를 렌더링합니다.
 *
 * @param {HTMLElement|string} mapContainer - 지도 컨테이너 요소 또는 ID
 * @param {array} polygons - 폴리곤 데이터 배열
 *        [{id, name, points(무시됨), color, opacity, value}, ...]
 * @param {object} styleOptions - 추가 스타일 옵션
 * @returns {object} 폴리곤 레이어 관리 객체 {layers: [], setVisible(id, visible), remove()}
 */
function addPolygonLayer(mapContainer, polygons, styleOptions = {}) {
  const container = typeof mapContainer === 'string'
    ? document.getElementById(mapContainer)
    : mapContainer;

  if (!container) {
    console.error('Map container not found');
    return { layers: [], setVisible: () => {}, remove: () => {} };
  }

  const layerContainer = document.createElement('div');
  layerContainer.className = 'polygon-layer-container';
  layerContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
  `;
  container.appendChild(layerContainer);

  const layers = [];
  const polygonElements = {};

  polygons.forEach((polygon, idx) => {
    // 폴리곤 오버레이 div 생성
    const polygonDiv = document.createElement('div');
    polygonDiv.id = `polygon-${polygon.id || idx}`;
    polygonDiv.className = 'polygon-overlay';

    // 와이어프레임용: 지도의 특정 영역을 색상 블록으로 표현
    const positionPercent = (idx * 20 + 10);
    polygonDiv.style.cssText = `
      position: absolute;
      left: ${positionPercent}%;
      top: ${(idx % 2) * 30 + 20}%;
      width: ${15 + idx * 5}%;
      height: 25%;
      background-color: ${polygon.color || '#3B82F6'};
      opacity: ${polygon.opacity !== undefined ? polygon.opacity : 0.4};
      border: 2px solid ${polygon.color || '#3B82F6'};
      border-radius: 4px;
      cursor: pointer;
      pointer-events: auto;
      transition: opacity 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 11;
    `;

    // 호버 이펙트 - 투명도 증가
    polygonDiv.addEventListener('mouseover', function() {
      this.style.opacity = Math.min(parseFloat(polygon.opacity || 0.4) + 0.3, 0.8);
    });

    polygonDiv.addEventListener('mouseout', function() {
      this.style.opacity = polygon.opacity || 0.4;
    });

    // 정보 팝업 표시
    polygonDiv.addEventListener('click', function(e) {
      e.stopPropagation();
      showPolygonInfo(polygon);
    });

    // 라벨 텍스트 추가
    const labelDiv = document.createElement('div');
    labelDiv.style.cssText = `
      color: white;
      font-weight: bold;
      font-size: 12px;
      text-align: center;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      pointer-events: none;
    `;
    labelDiv.textContent = `${polygon.name}\n${polygon.value || ''}`;
    polygonDiv.appendChild(labelDiv);

    layerContainer.appendChild(polygonDiv);
    layers.push({
      id: polygon.id || idx,
      element: polygonDiv,
      data: polygon
    });
    polygonElements[polygon.id || idx] = polygonDiv;
  });

  // 폴리곤 정보 팝업 표시 함수
  function showPolygonInfo(polygon) {
    // 기존 팝업이 있으면 제거
    const existingPopup = container.querySelector('.polygon-info-popup');
    if (existingPopup) {
      existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.className = 'polygon-info-popup';
    popup.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      min-width: 250px;
      pointer-events: auto;
    `;

    popup.innerHTML = `
      <div style="margin-bottom: 10px;">
        <h4 style="margin: 0 0 5px 0; color: ${polygon.color || '#3B82F6'};">${polygon.name}</h4>
        <hr style="margin: 5px 0; border: none; border-top: 1px solid #eee;">
      </div>
      <div style="font-size: 13px; color: #555;">
        <p><strong>값:</strong> ${polygon.value || 'N/A'}</p>
        <p><strong>투명도:</strong> ${(polygon.opacity || 0.4) * 100}%</p>
      </div>
      <button onclick="this.parentElement.remove();" style="
        margin-top: 10px;
        padding: 6px 12px;
        background: #2563EB;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      ">닫기</button>
    `;

    container.appendChild(popup);

    // 팝업 외부 클릭 시 닫기
    setTimeout(() => {
      const closePopup = () => {
        if (popup.parentElement) {
          popup.remove();
        }
        container.removeEventListener('click', closePopup);
      };
      container.addEventListener('click', closePopup);
    }, 100);
  }

  return {
    layers: layers,
    setVisible: function(id, visible) {
      if (polygonElements[id]) {
        polygonElements[id].style.display = visible ? 'flex' : 'none';
      }
    },
    remove: function() {
      layerContainer.remove();
    }
  };
}

/**
 * 서클 레이어 추가 (DOM 기반 시뮬레이션)
 * 지도 위에 원형 도형을 렌더링하며, 크기는 value 값에 비례합니다.
 *
 * @param {HTMLElement|string} mapContainer - 지도 컨테이너 요소 또는 ID
 * @param {array} circles - 서클 데이터 배열
 *        [{id, name, x(0-100%), y(0-100%), radius(0-50), color, value}, ...]
 * @param {object} options - 옵션 {maxRadius: 60, baseRadius: 20}
 * @returns {object} 서클 레이어 관리 객체 {circles: [], remove()}
 */
function addCircleLayer(mapContainer, circles, options = {}) {
  const container = typeof mapContainer === 'string'
    ? document.getElementById(mapContainer)
    : mapContainer;

  if (!container) {
    console.error('Map container not found');
    return { circles: [], remove: () => {} };
  }

  const { maxRadius = 60, baseRadius = 20 } = options;

  const circleLayerContainer = document.createElement('div');
  circleLayerContainer.className = 'circle-layer-container';
  circleLayerContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 15;
  `;
  container.appendChild(circleLayerContainer);

  const circleElements = [];

  circles.forEach((circle, idx) => {
    // value에 비례하는 반지름 계산 (0-1 범위 가정)
    const normalizedValue = Math.min(Math.max(circle.value || 0.5, 0), 1);
    const radius = baseRadius + (normalizedValue * (maxRadius - baseRadius));

    const circleDiv = document.createElement('div');
    circleDiv.className = 'circle-overlay';
    circleDiv.style.cssText = `
      position: absolute;
      left: ${circle.x || (Math.random() * 100)}%;
      top: ${circle.y || (Math.random() * 100)}%;
      width: ${radius * 2}px;
      height: ${radius * 2}px;
      margin-left: -${radius}px;
      margin-top: -${radius}px;
      background-color: ${circle.color || '#2563EB'};
      opacity: 0.5;
      border: 2px solid ${circle.color || '#2563EB'};
      border-radius: 50%;
      cursor: pointer;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 16;
    `;

    // 호버 이펙트
    circleDiv.addEventListener('mouseover', function() {
      this.style.opacity = '0.8';
      this.style.transform = 'scale(1.1)';
    });

    circleDiv.addEventListener('mouseout', function() {
      this.style.opacity = '0.5';
      this.style.transform = 'scale(1)';
    });

    // 클릭 이벤트
    circleDiv.addEventListener('click', function(e) {
      e.stopPropagation();
      const popup = document.createElement('div');
      popup.style.cssText = `
        position: absolute;
        left: ${circle.x || 50}%;
        top: ${circle.y || 50}%;
        background: white;
        padding: 10px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 2000;
        font-size: 12px;
        transform: translate(-50%, -120%);
        pointer-events: auto;
        white-space: nowrap;
      `;
      popup.innerHTML = `<strong>${circle.name}</strong><br>값: ${circle.value}`;
      circleLayerContainer.appendChild(popup);
      setTimeout(() => popup.remove(), 2000);
    });

    // 값 라벨 추가
    const valueLabel = document.createElement('div');
    valueLabel.style.cssText = `
      font-size: 11px;
      font-weight: bold;
      color: white;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      pointer-events: none;
    `;
    valueLabel.textContent = Math.round(circle.value * 100) + '%';
    circleDiv.appendChild(valueLabel);

    circleLayerContainer.appendChild(circleDiv);
    circleElements.push({
      id: circle.id || idx,
      element: circleDiv,
      data: circle
    });
  });

  return {
    circles: circleElements,
    remove: function() {
      circleLayerContainer.remove();
    }
  };
}

/**
 * 히트맵 레이어 추가 (DOM 기반 시뮬레이션)
 * CSS 그래디언트 오버레이를 사용하여 히트맵 효과를 시뮬레이션합니다.
 * 투명도 슬라이더 컨트롤을 포함합니다.
 *
 * @param {HTMLElement|string} mapContainer - 지도 컨테이너 요소 또는 ID
 * @param {object} options - 옵션
 *        {colors: ['#0000FF', '#00FFFF', '#FFFF00', '#FF0000'], opacity: 0.6}
 * @returns {object} 히트맵 컨트롤 객체 {setOpacity(val), remove()}
 */
function addHeatmapLayer(mapContainer, options = {}) {
  const container = typeof mapContainer === 'string'
    ? document.getElementById(mapContainer)
    : mapContainer;

  if (!container) {
    console.error('Map container not found');
    return { setOpacity: () => {}, remove: () => {} };
  }

  const {
    colors = ['#0000FF', '#00FFFF', '#FFFF00', '#FF0000'],
    opacity = 0.6,
    intensity = 0.7
  } = options;

  // 그래디언트 색상 생성
  const gradientStops = colors.map((color, i) =>
    `${color} ${(i / (colors.length - 1)) * 100}%`
  ).join(', ');

  const heatmapOverlay = document.createElement('div');
  heatmapOverlay.className = 'heatmap-layer';
  heatmapOverlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(
      ellipse at 35% 45%,
      rgba(255, 0, 0, ${opacity * intensity}),
      rgba(255, 255, 0, ${opacity * intensity * 0.8}),
      rgba(0, 255, 255, ${opacity * intensity * 0.5}),
      rgba(0, 0, 255, ${opacity * intensity * 0.3}) 100%
    ),
    linear-gradient(135deg,
      ${colors[0]} 0%,
      ${colors[Math.floor(colors.length / 2)]} 50%,
      ${colors[colors.length - 1]} 100%
    );
    background-size: 100% 100%, 200% 200%;
    pointer-events: none;
    z-index: 12;
    opacity: ${opacity};
    transition: opacity 0.3s ease;
  `;
  container.appendChild(heatmapOverlay);

  // 투명도 컨트롤 패널 생성
  const controlPanel = document.createElement('div');
  controlPanel.className = 'heatmap-control';
  controlPanel.style.cssText = `
    position: absolute;
    bottom: 15px;
    right: 15px;
    background: white;
    padding: 12px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 500;
    min-width: 180px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  `;

  const label = document.createElement('label');
  label.style.cssText = `
    display: block;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
  `;
  label.textContent = '히트맵 투명도';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '0';
  slider.max = '100';
  slider.value = Math.round(opacity * 100);
  slider.style.cssText = `
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: #ddd;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  `;

  // 슬라이더 스타일 (크로스브라우저)
  const style = document.createElement('style');
  style.textContent = `
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #2563EB;
      cursor: pointer;
      border: none;
    }
    input[type="range"]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #2563EB;
      cursor: pointer;
      border: none;
    }
  `;
  document.head.appendChild(style);

  const valueDisplay = document.createElement('div');
  valueDisplay.style.cssText = `
    margin-top: 8px;
    text-align: right;
    font-size: 11px;
    color: #666;
  `;
  valueDisplay.textContent = Math.round(opacity * 100) + '%';

  // 슬라이더 값 변경 시
  slider.addEventListener('input', function() {
    const newOpacity = parseInt(this.value) / 100;
    heatmapOverlay.style.opacity = newOpacity;
    valueDisplay.textContent = this.value + '%';
  });

  controlPanel.appendChild(label);
  controlPanel.appendChild(slider);
  controlPanel.appendChild(valueDisplay);
  container.appendChild(controlPanel);

  return {
    setOpacity: function(val) {
      const clampedVal = Math.min(Math.max(val, 0), 1);
      heatmapOverlay.style.opacity = clampedVal;
      slider.value = Math.round(clampedVal * 100);
      valueDisplay.textContent = Math.round(clampedVal * 100) + '%';
    },
    remove: function() {
      heatmapOverlay.remove();
      controlPanel.remove();
    }
  };
}

/**
 * 클러스터된 마커 레이어 추가 (DOM 기반 시뮬레이션)
 * 간단한 그리드 기반 클러스터링으로 근처 마커들을 그룹화합니다.
 * 클러스터를 클릭하면 개별 마커를 표시합니다.
 *
 * @param {HTMLElement|string} mapContainer - 지도 컨테이너 요소 또는 ID
 * @param {array} markers - 마커 데이터 배열
 *        [{id, name, x(0-100%), y(0-100%), status, color}, ...]
 * @param {object} options - 옵션 {gridSize: 4, clusterSize: 10}
 * @returns {object} 마커 관리 객체 {clusters: [], expand(clusterId), collapse(clusterId)}
 */
function addClusteredMarkers(mapContainer, markers, options = {}) {
  const container = typeof mapContainer === 'string'
    ? document.getElementById(mapContainer)
    : mapContainer;

  if (!container || markers.length === 0) {
    console.error('Map container not found or no markers provided');
    return { clusters: [], expand: () => {}, collapse: () => {} };
  }

  const { gridSize = 4, clusterSize = 10 } = options;

  const markerLayerContainer = document.createElement('div');
  markerLayerContainer.className = 'clustered-markers-container';
  markerLayerContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 20;
  `;
  container.appendChild(markerLayerContainer);

  // 마커를 격자 셀로 분류하여 클러스터링
  const grid = {};
  const cellWidth = 100 / gridSize;
  const cellHeight = 100 / gridSize;

  markers.forEach((marker, idx) => {
    const x = marker.x || Math.random() * 100;
    const y = marker.y || Math.random() * 100;
    const cellX = Math.floor(x / cellWidth);
    const cellY = Math.floor(y / cellHeight);
    const cellKey = `${cellX}-${cellY}`;

    if (!grid[cellKey]) {
      grid[cellKey] = { markers: [], x: cellX, y: cellY };
    }
    grid[cellKey].markers.push({
      ...marker,
      x: x,
      y: y
    });
  });

  const clusters = [];
  const expandedClusters = new Set();

  Object.entries(grid).forEach(([cellKey, cell]) => {
    if (cell.markers.length === 0) return;

    const clusterId = `cluster-${cellKey}`;
    const centerX = (cell.x + 0.5) * cellWidth;
    const centerY = (cell.y + 0.5) * cellHeight;

    // 클러스터 배지 생성
    const clusterBadge = document.createElement('div');
    clusterBadge.id = clusterId;
    clusterBadge.className = 'cluster-badge';
    clusterBadge.style.cssText = `
      position: absolute;
      left: ${centerX}%;
      top: ${centerY}%;
      width: 40px;
      height: 40px;
      margin-left: -20px;
      margin-top: -20px;
      background: #2563EB;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      user-select: none;
      transition: all 0.2s ease;
      z-index: 25;
    `;

    clusterBadge.textContent = cell.markers.length;

    // 클러스터 호버 효과
    clusterBadge.addEventListener('mouseover', function() {
      this.style.transform = 'scale(1.15)';
      this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
    });

    clusterBadge.addEventListener('mouseout', function() {
      if (!expandedClusters.has(clusterId)) {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      }
    });

    // 클러스터 클릭 → 개별 마커 표시
    clusterBadge.addEventListener('click', function(e) {
      e.stopPropagation();

      if (expandedClusters.has(clusterId)) {
        // 이미 확장됨 → 축소
        collapseCluster(clusterId);
      } else {
        // 축소됨 → 확장
        expandCluster(clusterId);
      }
    });

    markerLayerContainer.appendChild(clusterBadge);

    clusters.push({
      id: clusterId,
      element: clusterBadge,
      markerCount: cell.markers.length,
      markers: cell.markers
    });
  });

  // 클러스터 확장 함수
  function expandCluster(clusterId) {
    expandedClusters.add(clusterId);
    const cluster = clusters.find(c => c.id === clusterId);
    if (!cluster) return;

    const badge = document.getElementById(clusterId);
    badge.style.opacity = '0.3';
    badge.style.pointerEvents = 'none';

    // 개별 마커 표시
    cluster.markers.forEach((marker, idx) => {
      const markerDiv = document.createElement('div');
      markerDiv.className = `marker-${clusterId}`;
      markerDiv.style.cssText = `
        position: absolute;
        left: ${marker.x}%;
        top: ${marker.y}%;
        width: 32px;
        height: 32px;
        margin-left: -16px;
        margin-top: -16px;
        background: ${marker.color || '#10B981'};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        pointer-events: auto;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
        z-index: 24;
      `;

      // 마커 호버
      markerDiv.addEventListener('mouseover', function() {
        this.style.transform = 'scale(1.2)';
        this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      });

      markerDiv.addEventListener('mouseout', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      });

      // 마커 클릭 → 정보 표시
      markerDiv.addEventListener('click', function(e) {
        e.stopPropagation();
        showMarkerPopup(marker, marker.x, marker.y);
      });

      // 마커 상태 표시 (색상이 상태를 나타냄)
      const statusLabel = document.createElement('div');
      statusLabel.style.cssText = `
        font-size: 10px;
        color: white;
        font-weight: bold;
        text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
        pointer-events: none;
      `;
      statusLabel.textContent = marker.status?.charAt(0) || '●';
      markerDiv.appendChild(statusLabel);

      markerLayerContainer.appendChild(markerDiv);
    });
  }

  // 클러스터 축소 함수
  function collapseCluster(clusterId) {
    expandedClusters.delete(clusterId);
    const badge = document.getElementById(clusterId);
    badge.style.opacity = '1';
    badge.style.pointerEvents = 'auto';
    badge.style.transform = 'scale(1)';
    badge.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';

    // 개별 마커 제거
    const markerDivs = markerLayerContainer.querySelectorAll(`.marker-${clusterId}`);
    markerDivs.forEach(div => div.remove());
  }

  // 마커 정보 팝업 표시
  function showMarkerPopup(marker, x, y) {
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: absolute;
      left: ${x}%;
      top: ${y}%;
      background: white;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #ddd;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 3000;
      font-size: 12px;
      transform: translate(-50%, -130%);
      pointer-events: auto;
      min-width: 150px;
    `;
    popup.innerHTML = `
      <strong>${marker.name}</strong><br>
      <span style="color: ${marker.color || '#10B981'};">●</span>
      상태: ${marker.status || '알수없음'}
    `;
    markerLayerContainer.appendChild(popup);
    setTimeout(() => popup.remove(), 3000);
  }

  return {
    clusters: clusters,
    expand: function(clusterId) {
      expandCluster(clusterId);
    },
    collapse: function(clusterId) {
      collapseCluster(clusterId);
    },
    remove: function() {
      markerLayerContainer.remove();
    }
  };
}

/**
 * 레이어 토글 컨트롤 추가 (DOM 기반)
 * 체크박스를 사용하여 지도 위의 레이어를 표시/숨김합니다.
 * 범례도 함께 표시합니다.
 *
 * @param {HTMLElement|string} mapContainer - 지도 컨테이너 요소 또는 ID
 * @param {array} layers - 레이어 설정 배열
 *        [{id, name, visible, color, description}, ...]
 * @returns {object} 컨트롤 객체 {toggle(layerId, visible), remove()}
 */
function addLayerControl(mapContainer, layers) {
  const container = typeof mapContainer === 'string'
    ? document.getElementById(mapContainer)
    : mapContainer;

  if (!container || layers.length === 0) {
    console.error('Map container not found or no layers provided');
    return { toggle: () => {}, remove: () => {} };
  }

  const controlContainer = document.createElement('div');
  controlContainer.className = 'layer-control-panel';
  controlContainer.style.cssText = `
    position: absolute;
    top: 15px;
    right: 15px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    z-index: 400;
    min-width: 200px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    max-height: 400px;
    overflow-y: auto;
  `;

  const title = document.createElement('div');
  title.style.cssText = `
    padding: 12px;
    border-bottom: 1px solid #eee;
    font-weight: 600;
    font-size: 13px;
    color: #333;
  `;
  title.textContent = '레이어 관리';
  controlContainer.appendChild(title);

  const layerList = document.createElement('div');
  layerList.style.cssText = `
    padding: 8px;
  `;

  const visibilityMap = {};

  layers.forEach((layer, idx) => {
    const itemDiv = document.createElement('div');
    itemDiv.style.cssText = `
      padding: 8px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      align-items: center;
      cursor: pointer;
      transition: background-color 0.2s ease;
    `;

    itemDiv.addEventListener('mouseover', function() {
      this.style.backgroundColor = '#f9f9f9';
    });

    itemDiv.addEventListener('mouseout', function() {
      this.style.backgroundColor = 'transparent';
    });

    // 체크박스
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = layer.visible !== false;
    checkbox.style.cssText = `
      margin-right: 8px;
      cursor: pointer;
      width: 16px;
      height: 16px;
    `;

    visibilityMap[layer.id] = layer.visible !== false;

    // 색상 표시
    const colorBox = document.createElement('div');
    colorBox.style.cssText = `
      width: 16px;
      height: 16px;
      background-color: ${layer.color || '#ccc'};
      border-radius: 3px;
      margin-right: 8px;
      flex-shrink: 0;
      border: 1px solid rgba(0,0,0,0.1);
    `;

    // 레이어명
    const labelDiv = document.createElement('div');
    labelDiv.style.cssText = `
      flex: 1;
      font-size: 12px;
      color: #333;
    `;
    labelDiv.innerHTML = `
      <div style="font-weight: 500;">${layer.name}</div>
      <div style="font-size: 11px; color: #888; margin-top: 2px;">
        ${layer.description || ''}
      </div>
    `;

    // 체크박스 변경 시
    checkbox.addEventListener('change', function(e) {
      e.stopPropagation();
      const visible = this.checked;
      visibilityMap[layer.id] = visible;

      // 해당 레이어 ID를 가진 요소들 표시/숨김
      const layerElements = container.querySelectorAll(`[data-layer-id="${layer.id}"]`);
      layerElements.forEach(el => {
        el.style.display = visible ? '' : 'none';
      });
    });

    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(colorBox);
    itemDiv.appendChild(labelDiv);
    layerList.appendChild(itemDiv);
  });

  controlContainer.appendChild(layerList);
  container.appendChild(controlContainer);

  return {
    toggle: function(layerId, visible) {
      const checkbox = controlContainer.querySelector(`input[data-layer-id="${layerId}"]`);
      if (checkbox) {
        checkbox.checked = visible;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    },
    remove: function() {
      controlContainer.remove();
    }
  };
}

/**
 * 지도 내 검색 컨트롤 추가 (DOM 기반)
 * 제주도의 주요 지점 5개를 포함한 자동완성 검색 기능을 제공합니다.
 * 위치 선택 시 지도에 마커를 표시합니다.
 *
 * @param {HTMLElement|string} mapContainer - 지도 컨테이너 요소 또는 ID
 * @param {object} options - 옵션 (기본 위치 목록 포함)
 * @returns {object} 검색 컨트롤 객체 {search(term), remove()}
 */
function addSearchControl(mapContainer, options = {}) {
  const container = typeof mapContainer === 'string'
    ? document.getElementById(mapContainer)
    : mapContainer;

  if (!container) {
    console.error('Map container not found');
    return { search: () => {}, remove: () => {} };
  }

  // 제주도 주요 지점 더미 데이터
  const defaultLocations = [
    { name: '제주시청', x: 50, y: 55, description: '제주시 중심부' },
    { name: '서귀포시청', x: 45, y: 30, description: '서귀포시 중심부' },
    { name: '제주공항', x: 52, y: 65, description: '제주국제공항' },
    { name: '한라산', x: 50, y: 45, description: '제주도 최고봉' },
    { name: '성산일출봉', x: 75, y: 48, description: '동쪽 해안 명소' }
  ];

  const locations = options.locations || defaultLocations;

  // 검색 컨트롤 컨테이너
  const searchContainer = document.createElement('div');
  searchContainer.className = 'search-control';
  searchContainer.style.cssText = `
    position: absolute;
    top: 15px;
    left: 15px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    z-index: 350;
    min-width: 250px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  `;

  // 검색 입력창
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = '위치 검색 (예: 제주시청)';
  searchInput.style.cssText = `
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-radius: 8px 8px 0 0;
    font-size: 13px;
    box-sizing: border-box;
    outline: none;
  `;

  // 자동완성 드롭다운
  const dropdown = document.createElement('div');
  dropdown.className = 'search-dropdown';
  dropdown.style.cssText = `
    display: none;
    border-top: 1px solid #eee;
    max-height: 250px;
    overflow-y: auto;
    background: white;
    border-radius: 0 0 8px 8px;
  `;

  searchInput.addEventListener('input', function() {
    const term = this.value.toLowerCase();
    dropdown.innerHTML = '';

    if (term.length === 0) {
      dropdown.style.display = 'none';
      return;
    }

    const matches = locations.filter(loc =>
      loc.name.toLowerCase().includes(term) ||
      loc.description.toLowerCase().includes(term)
    );

    if (matches.length === 0) {
      dropdown.style.display = 'none';
      return;
    }

    dropdown.style.display = 'block';

    matches.forEach((location) => {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 10px 12px;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background-color 0.2s ease;
      `;

      item.innerHTML = `
        <div style="font-weight: 500; color: #333; font-size: 12px;">
          ${location.name}
        </div>
        <div style="font-size: 11px; color: #888; margin-top: 2px;">
          ${location.description}
        </div>
      `;

      item.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#f5f5f5';
      });

      item.addEventListener('mouseout', function() {
        this.style.backgroundColor = 'transparent';
      });

      item.addEventListener('click', function() {
        searchInput.value = location.name;
        dropdown.style.display = 'none';
        showLocationMarker(location);
      });

      dropdown.appendChild(item);
    });
  });

  // 검색 입력창 포커스 시 드롭다운 표시
  searchInput.addEventListener('focus', function() {
    if (dropdown.children.length > 0) {
      dropdown.style.display = 'block';
    }
  });

  // 외부 클릭 시 드롭다운 숨기기
  document.addEventListener('click', function(e) {
    if (!searchContainer.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(dropdown);
  container.appendChild(searchContainer);

  // 위치 마커 표시 함수
  function showLocationMarker(location) {
    // 기존 검색 마커 제거
    const existingMarker = container.querySelector('.search-location-marker');
    if (existingMarker) {
      existingMarker.remove();
    }

    const marker = document.createElement('div');
    marker.className = 'search-location-marker';
    marker.style.cssText = `
      position: absolute;
      left: ${location.x}%;
      top: ${location.y}%;
      width: 40px;
      height: 40px;
      margin-left: -20px;
      margin-top: -20px;
      background: linear-gradient(135deg, #2563EB, #1D4ED8);
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
      z-index: 350;
      animation: pulse 0.6s ease-out;
    `;
    marker.textContent = '📍';

    // 마커 클릭 시 정보 표시
    marker.addEventListener('click', function(e) {
      e.stopPropagation();
      const popup = document.createElement('div');
      popup.style.cssText = `
        position: absolute;
        left: ${location.x}%;
        top: ${location.y}%;
        background: white;
        padding: 12px;
        border-radius: 6px;
        border: 1px solid #ddd;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 4000;
        font-size: 12px;
        transform: translate(-50%, -130%);
        pointer-events: auto;
        min-width: 150px;
      `;
      popup.innerHTML = `
        <strong>${location.name}</strong><br>
        <span style="color: #888; font-size: 11px;">${location.description}</span><br>
        <span style="color: #2563EB; font-size: 10px;">좌표: ${location.x.toFixed(1)}°, ${location.y.toFixed(1)}°</span>
      `;
      container.appendChild(popup);
      setTimeout(() => popup.remove(), 4000);
    });

    // 맥락상 범위 확대 (애니메이션용)
    const style = document.createElement('style');
    if (!document.querySelector('style[data-pulse]')) {
      style.setAttribute('data-pulse', 'true');
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    container.appendChild(marker);

    // 검색 후 시각적 강조
    console.log(`📍 위치 선택: ${location.name}`);
  }

  return {
    search: function(term) {
      searchInput.value = term;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    },
    remove: function() {
      searchContainer.remove();
    }
  };
}
