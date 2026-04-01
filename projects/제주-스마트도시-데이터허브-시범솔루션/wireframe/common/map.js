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
