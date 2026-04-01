# 06-D-15: Grafana 설치 & 대시보드 구성

**번호**: 06-D-15 | **타입**: 실습 | **학습 시간**: 약 40분

**이전 학습**: Prometheus 개념 & Supabase 메트릭 수집 설정 (06-D-14)
**다음 학습**: 디스크/메모리 경보 규칙 설정 (06-D-16)

---

## 개요

**Grafana**는 Prometheus의 메트릭을 시각화하는 대시보드 도구입니다. 숫자와 차트로 인프라 상태를 실시간으로 모니터링할 수 있습니다.

Prometheus = 데이터 수집소, Grafana = 시각화 도구

### FE 개발자를 위한 비유

| 개념 | FE 차트 라이브러리 | Grafana |
|------|------------|--------|
| **데이터 소스** | 자바스크립트 배열/객체 | Prometheus 시계열 DB |
| **라이브러리** | Chart.js, D3.js, Recharts | Grafana (내장) |
| **상호작용** | 사용자 클릭/조작 | 시간 범위 선택, 쿼리 편집 |
| **배포** | HTML + JS 파일 | 웹 서비스 (포트 3000) |
| **실시간** | WebSocket 폴링 필요 | 자동 refresh (15초~1분) |

---

## 학습 목표

1. Docker Compose에 Prometheus, Node Exporter, Grafana 추가
2. Grafana에 Prometheus 데이터소스 연결
3. CPU, 메모리, 디스크 모니터링 패널 생성
4. 커뮤니티 대시보드 임포트 및 커스터마이징

---

## 사전 준비: Prometheus & Exporter 설치

### Step 1: prometheus.yml 생성

```bash
cat > ~/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
EOF
```

### Step 2: docker-compose.yml 업데이트

기존 파일에 다음을 추가합니다:

```yaml
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: always
    ports:
      - "9090:9090"
    volumes:
      - ~/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    networks:
      - default

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: always
    ports:
      - "9100:9100"
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    networks:
      - default

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    restart: always
    ports:
      - "9187:9187"
    environment:
      DATA_SOURCE_NAME: "postgresql://postgres:${DB_PASSWORD}@db:5432/postgres?sslmode=require"
    depends_on:
      - db
    networks:
      - default

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    restart: always
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    networks:
      - default

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: always
    ports:
      - "3000:3000"
    volumes:
      - grafana-storage:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
      - GF_INSTALL_PLUGINS=
    depends_on:
      - prometheus
    networks:
      - default

volumes:
  prometheus-data:
  grafana-storage:
```

### Step 3: 환경변수 설정

.env 파일에 추가:

```bash
GRAFANA_PASSWORD=your_strong_password_here
```

### Step 4: 컨테이너 시작

```bash
cd ~
docker-compose up -d prometheus node-exporter postgres-exporter cadvisor grafana

# 로그 확인
docker-compose logs -f grafana
```

"Grafana started" 메시지 대기 (약 30초).

---

## Step 5: Caddy 리버스 프록시 설정

Caddyfile 편집:

```bash
sudo nano /etc/caddy/Caddyfile
```

Grafana 블록 추가:

```
grafana.yourdomain.com {
    reverse_proxy localhost:3000
    encode gzip
}

prometheus.yourdomain.com {
    reverse_proxy localhost:9090
    encode gzip
    basicauth / {
        admin $2a$14$... (bcrypt 해시)
    }
}
```

Caddy 리로드:

```bash
sudo systemctl reload caddy
```

---

## Step 6: Grafana 초기 설정

### 로그인

1. 브라우저: `https://grafana.yourdomain.com` 접속
2. 초기 credentials:
   - ID: admin
   - Password: admin (또는 .env에서 설정한 값)
3. 새 비밀번호 설정 강제 (처음 로그인 시)

### Prometheus 데이터소스 추가

1. 좌측 메뉴 → **Data Sources** 선택
2. **Add data source** 클릭
3. **Prometheus** 선택
4. 설정:
   ```
   Name: Prometheus
   URL: http://prometheus:9090
   Access: Server
   ```
5. **Save & Test** 클릭 - "Data source is working" 확인

---

## Step 7: 대시보드 생성

### 방법 1: 처음부터 만들기 (기초)

1. 좌측 메뉴 → **+ (Create)** → **Dashboard** 클릭
2. **Add a new panel** 클릭

#### Panel 1: CPU 사용률

```
Title: CPU Usage (%)
Data Source: Prometheus
Query:
  (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m]))) * 100

Panel Type: Gauge
Thresholds:
  - Green (Good): 0-60%
  - Yellow (Warning): 60-80%
  - Red (Critical): 80-100%
```

#### Panel 2: 메모리 사용률

```
Title: Memory Usage (%)
Data Source: Prometheus
Query:
  (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

Panel Type: Gauge
Thresholds:
  - Green: 0-70%
  - Yellow: 70-85%
  - Red: 85-100%
Unit: percent (0-100)
```

#### Panel 3: 디스크 사용률

```
Title: Disk Usage (%)
Data Source: Prometheus
Query:
  (node_filesystem_avail_bytes{fstype!~"tmpfs|fuse.lowerfs|squashfs|vfat"}
   / node_filesystem_size_bytes) * 100

Panel Type: Bar Gauge
Legend: Show
Thresholds:
  - Green: 0-75%
  - Yellow: 75-90%
  - Red: 90-100%
```

#### Panel 4: 메모리 트렌드 (시계열 그래프)

```
Title: Memory Trend (Last 24h)
Data Source: Prometheus
Query:
  node_memory_MemAvailable_bytes / 1024 / 1024 / 1024

Panel Type: Time Series
Legend: Show
Tooltip: Multi-series
Y-axis: Units > Bytes (IEC)
```

#### Panel 5: PostgreSQL 활성 연결

```
Title: PostgreSQL Active Connections
Data Source: Prometheus
Query:
  pg_stat_activity_count{state="active"}

Panel Type: Stat
Thresholds:
  - Green: 0-10
  - Yellow: 10-20
  - Red: 20+
Text Mode: Value and Name
```

### 방법 2: 커뮤니티 대시보드 임포트 (추천)

이미 만들어진 대시보드를 사용합니다.

1. 좌측 메뉴 → **+ (Create)** → **Import** 클릭
2. **Dashboard URL 또는 ID** 입력:

   **Node Exporter for Prometheus (권장)**
   - ID: 1860
   - 설명: 서버 CPU, 메모리, 디스크, 네트워크 완전 모니터링

3. **Load** 클릭
4. 설정:
   ```
   Prometheus: 위에서 추가한 Prometheus 데이터소스 선택
   Job: node
   ```
5. **Import** 클릭

#### 추가 커뮤니티 대시보드 ID

| 목적 | ID | 설명 |
|------|-----|------|
| PostgreSQL 모니터링 | 3742 | 쿼리, 연결, 캐시 히트율 |
| Docker 컨테이너 | 1229 | 모든 컨테이너 리소스 사용률 |
| Prometheus 자신 | 3662 | Prometheus 메모리, 스크레이프 상태 |

### 대시보드 저장

```
좌측 상단 제목 옆 저장 아이콘 클릭
Dashboard Name: "Supabase Infrastructure"
Folder: "General"
Save
```

---

## Step 8: PromQL 쿼리 이해

### 자주 사용하는 쿼리

```promql
# 1. CPU 사용률 (%)
(1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m]))) * 100

# 2. 메모리 여유 (GB)
node_memory_MemAvailable_bytes / 1024 / 1024 / 1024

# 3. 디스크 여유 (%)
(node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100

# 4. 네트워크 송신 (Mbps)
rate(node_network_transmit_bytes_total{device!~"lo"}[5m]) * 8 / 1000 / 1000

# 5. 네트워크 수신 (Mbps)
rate(node_network_receive_bytes_total{device!~"lo"}[5m]) * 8 / 1000 / 1000

# 6. PostgreSQL 활성 연결
pg_stat_activity_count{state="active"}

# 7. Docker 컨테이너 메모리 사용량 (MB)
container_memory_usage_bytes{name!=""} / 1024 / 1024

# 8. Uptime (일)
(time() - node_boot_time_seconds) / 86400
```

### PromQL 연산자

```promql
# 비교
node_memory_MemAvailable_bytes < 1024*1024*1024  # 1GB 미만

# 산술
rate(metric[5m]) * 100                           # 백분율 변환

# 집계
avg(node_cpu_seconds_total)                       # 평균
max(node_memory_usage_bytes)                      # 최대값
min(node_filesystem_avail_bytes)                  # 최소값
sum(container_memory_usage_bytes)                 # 합계
```

---

## Step 9: 대시보드 공유 및 임베딩

### 대시보드 URL 공유

```
https://grafana.yourdomain.com/d/YOUR_DASHBOARD_ID/dashboard-name
```

### 읽기 전용 공유 링크 생성

1. 대시보드 좌상단 **Share** 클릭
2. **Link** 탭 → **Copy** (현재 보기 링크 복사)
3. 또는 **Export** → **Save to file** (JSON 백업)

### 임베딩 (웹사이트에 삽입)

```html
<!-- HTML에 삽입 -->
<iframe
  src="https://grafana.yourdomain.com/d/DASHBOARD_ID/dashboard?orgId=1&kiosk=tv"
  width="100%"
  height="600px">
</iframe>
```

---

## 트러블슈팅

### Grafana가 Prometheus에 연결 안 됨

1. **Docker 네트워크 확인**
   ```bash
   docker network inspect bridge
   ```

2. **Prometheus 상태 확인**
   ```bash
   docker-compose exec prometheus curl http://localhost:9090
   ```
   502 에러 → Prometheus 대기 (재시작 필요할 수 있음)

3. **데이터소스 재연결**
   - Grafana UI → Data Sources → Prometheus → Test

### 메트릭이 나타나지 않음

1. **Exporter 실행 확인**
   ```bash
   docker-compose ps  # 모든 컨테이너 running 상태 확인
   docker-compose logs node-exporter | tail -20
   ```

2. **Prometheus 스크레이프 상태 확인**
   ```
   https://prometheus.yourdomain.com/targets
   모든 job이 "UP" 상태여야 함
   ```

3. **메트릭 존재 여부 확인**
   ```
   https://prometheus.yourdomain.com
   쿼리 탭에서: node_memory_MemTotal_bytes
   엔터 → 결과 나타남
   ```

### 높은 CPU 사용량

- Node Exporter가 과도한 메트릭 수집 가능
- prometheus.yml에서 `--collector.disable-defaults` 사용
- 불필요한 collector 비활성화

---

## 핵심 요약

| 항목 | 내용 |
|------|------|
| **Prometheus** | 15초마다 메트릭 수집, 30일 보관 |
| **Node Exporter** | 서버 CPU, 메모리, 디스크, 네트워크 메트릭 |
| **Postgres Exporter** | DB 연결, 쿼리, 트랜잭션 상태 메트릭 |
| **Grafana** | 웹 대시보드로 시각화 (포트 3000) |
| **URL** | grafana.yourdomain.com (Caddy HTTPS) |
| **기본 쿼리** | CPU: `(1-avg(rate(node_cpu_seconds_total{mode="idle"}[5m])))*100` |
| **커뮤니티 대시보드** | ID 1860 (Node Exporter) 추천 |
| **저장소** | Docker volume (grafana-storage, prometheus-data) |

---

## 다음 단계

이제 실시간 모니터링 대시보드가 완성되었습니다.

다음 학습 06-D-16에서:
- Grafana에서 **경보 규칙(Alert Rule)** 설정
- 디스크 > 80%, 메모리 > 85% 자동 감지
- Discord/Slack로 경보 발송 (Uptime Kuma와 중복되지 않도록)

### 현재까지의 모니터링 스택

```
Uptime Kuma (외부 헬스 체크)
    ↓
Prometheus (메트릭 수집)
    ↓
Grafana (시각화 대시보드)
    ↓
(다음) Alert Rules (경보 자동화)
```

각 도구는 다른 역할을 합니다. 곧 모두 함께 작동하는 완전한 모니터링 시스템을 완성하게 됩니다.
