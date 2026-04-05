# 06-D-14: Prometheus 개념 & Supabase 메트릭 수집 설정

**번호**: 06-D-14 | **타입**: 개념 | **학습 시간**: 약 20분

**이전 학습**: Slack / Discord 웹훅 알림 연결 (06-D-13)
**다음 학습**: Grafana 설치 & 대시보드 구성 (06-D-15)

---

## 개요

**Prometheus**는 시계열 데이터베이스(Time-Series Database)로, 서버와 애플리케이션의 성능 메트릭을 시간순으로 수집하고 저장합니다.

Uptime Kuma는 "살아 있는가?"를 확인하지만, Prometheus는 "얼마나 잘 작동하는가?"를 측정합니다 - CPU, 메모리, 디스크, 네트워크, DB 응답 시간 등.

### FE 개발자를 위한 비유

| 개념 | JavaScript 성능 측정 | Prometheus 메트릭 수집 |
|------|------------------|------------------|
| **목표** | 사용자 경험 성능 측정 | 인프라 성능 모니터링 |
| **API** | `performance.measure()`, `performance.mark()` | Prometheus 클라이언트 라이브러리 |
| **저장** | 브라우저 메모리 (제한적) | Prometheus 시계열 DB (대용량) |
| **쿼리** | 자바스크립트 코드로 접근 | PromQL 언어로 쿼리 |
| **시각화** | 개발자 도구 Performance 탭 | Grafana 대시보드 |
| **예시** | "페이지 로딩 2.5초" | "API 응답 시간 평균 234ms" |

---

## 학습 목표

1. Prometheus의 pull 기반 메트릭 수집 개념 이해
2. 메트릭 타입 (Counter, Gauge, Histogram) 구분
3. Supabase 및 시스템 메트릭 스크레이프(scrape) 설정
4. Docker Compose에 Prometheus 추가

---

## 핵심 개념: Prometheus의 동작

### Pull vs Push 모델

```
┌────────────────────────────────────────────────────────────┐
│ Uptime Kuma / Slack 웹훅  (이전 학습)                       │
├────────────────────────────────────────────────────────────┤
│ Event-driven (웹훅): 문제 발생 → 즉시 POST 요청             │
│ 특징: 높은 지연시간, 즉각적 반응                             │
└────────────────────────────────────────────────────────────┘

             ↓
             ↓ (이번 학습)

┌────────────────────────────────────────────────────────────┐
│ Prometheus  (Pull 기반)                                    │
├────────────────────────────────────────────────────────────┤
│ Periodic polling: 매 15초마다 엔드포인트 GET 요청            │
│ 특징: 일관된 수집, 세부 데이터 저장, 대용량 메트릭           │
└────────────────────────────────────────────────────────────┘
```

### Prometheus 수집 흐름

```
┌─────────────┐ (매 15초마다)
│ Prometheus  │
└──────┬──────┘
       │
       ├─→ GET http://localhost:9090/metrics
       │    (Prometheus 자신의 상태)
       │
       ├─→ GET http://localhost:9100/metrics
       │    (Node Exporter - 서버 CPU, 메모리, 디스크)
       │
       ├─→ GET http://localhost:5432/metrics
       │    (PostgreSQL Exporter - DB 상태)
       │
       └─→ GET http://supabase-api/metrics
            (Supabase 고유 메트릭)

            ↓ 응답 저장

       ┌──────────────────┐
       │ Prometheus DB    │
       │ (시계열 저장소)   │
       └──────────────────┘
```

---

## 메트릭 타입 4가지

### 1. Counter (카운터)

**정의**: 누적 증가만 하는 값. 리셋되지 않음.

```
예: 총 요청 수, 총 에러 발생 수, 총 바이트 송수신
```

**특징**:
- 감소하지 않음 (항상 증가하거나 리셋)
- 누적값으로 "변화율" 계산 (derivative)
- 시스템 재부팅 시에만 리셋

**예시**:
```
http_requests_total{path="/api/users"} = 15234  # 요청 15234건 누적
http_requests_total{path="/api/posts"} = 8921
```

### 2. Gauge (게이지)

**정의**: 시점마다 변하는 현재값. 증가/감소 모두 가능.

```
예: 현재 CPU 사용률, 메모리 사용량, 활성 연결 수
```

**특징**:
- 현재 상태를 나타냄 (스냅샷)
- 시간에 따라 자유롭게 변함
- "지금 이 순간의 값"

**예시**:
```
node_memory_MemAvailable_bytes = 2147483648  # 약 2GB 여유
node_cpu_seconds_total = 45.32              # 누적 CPU 초
container_memory_usage_bytes = 536870912    # 약 512MB 사용중
```

### 3. Histogram (히스토그램)

**정의**: 값의 분포를 기록. 보통 응답 시간 측정용.

```
예: API 응답 시간의 분포 (얼마나 많은 요청이 100ms 이내? 500ms 이내?)
```

**특징**:
- 여러 버킷(bucket)으로 분포 기록
- 응답 시간, 요청 크기 같은 "분포"를 알고 싶을 때 사용
- 자동으로 sum, count도 제공

**예시**:
```
http_request_duration_seconds_bucket{le="0.1"}  = 1500   # 100ms 이내: 1500건
http_request_duration_seconds_bucket{le="0.5"}  = 4200   # 500ms 이내: 4200건
http_request_duration_seconds_bucket{le="1.0"}  = 4800   # 1초 이내: 4800건
http_request_duration_seconds_sum             = 1234.5  # 총 시간
http_request_duration_seconds_count            = 5000   # 총 요청건
```

### 4. Summary (요약)

**정의**: Histogram과 유사하지만 Quantile(백분위수)을 직접 계산.

```
예: 응답 시간의 p50(중앙값), p99(상위 1%)
```

**특징**:
- 계산 비용이 높음
- Histogram이 더 권장됨
- 고급 사용

---

## Prometheus 메트릭 수집 설정

### 메트릭이 어디서 오는가?

Prometheus 자체는 메트릭을 생성하지 않습니다. 대신 다양한 "Exporter" (메트릭 생성기)에서 수집합니다:

| Exporter | 역할 | 포트 |
|----------|------|------|
| **node_exporter** | 서버 CPU, 메모리, 디스크, 네트워크 | 9100 |
| **postgres_exporter** | PostgreSQL DB 상태 (연결, 쿼리, 성능) | 9187 |
| **cadvisor** | Docker 컨테이너 리소스 사용률 | 8080 |
| **Prometheus 자신** | 메모리 사용, 스크레이프 성공률 | 9090 |

### Scrape Config 구조

prometheus.yml (Prometheus 설정 파일):

```yaml
global:
  scrape_interval: 15s      # 기본값: 15초마다 수집
  evaluation_interval: 15s   # 15초마다 알림 규칙 평가

scrape_configs:
  # Prometheus 자신
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # 서버 메트릭
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  # 데이터베이스
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        replacement: 'supabase-db'

  # Docker 컨테이너
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['localhost:8080']
```

**각 필드 설명**:
- `job_name`: 메트릭 소스 이름
- `static_configs`: 고정 주소 (동적으로 변할 수 있음)
- `targets`: HTTP 엔드포인트 주소:포트
- `scrape_interval`: 이 job은 몇 초마다 수집? (글로벌 기본값 사용 시 생략)

---

## Supabase 메트릭 수집 전략

### 수집할 메트릭 우선순위

**Tier 1 (필수)**
- 서버 리소스: CPU, 메모리, 디스크
- 데이터베이스: 활성 연결, 느린 쿼리, 트랜잭션

**Tier 2 (권장)**
- API 응답 시간, 에러율
- Docker 컨테이너 상태
- Caddy 프록시 성능

**Tier 3 (선택)**
- 세부 네트워크 메트릭
- 애플리케이션 커스텀 메트릭

### Exporter 설치 계획

```
Docker Compose에 추가할 항목:

1. prometheus:latest
   설정: prometheus.yml 마운트
   포트: 9090

2. prom/node-exporter:latest
   역할: 서버 메트릭 수집
   포트: 9100

3. prometheuscommunity/postgres-exporter:latest
   역할: PostgreSQL 메트릭
   포트: 9187
   환경변수: PG_EXPORTER_EXCLUDE_DATABASES (제외할 DB)

4. gcr.io/cadvisor/cadvisor:latest
   역할: Docker 컨테이너 모니터링
   포트: 8080
   마운트: /var/run/docker.sock (Docker 접근)
```

---

## 메트릭 수집 설정 체크리스트

### 사전 준비

```bash
# prometheus.yml 파일 생성
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
      - targets: ['localhost:9100']

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['localhost:8080']
EOF

# 파일 확인
cat ~/prometheus.yml
```

### Docker Compose 수정 준비

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: always
    ports:
      - "9090:9090"
    volumes:
      - ~/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
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
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
    networks:
      - default

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    restart: always
    ports:
      - "9187:9187"
    environment:
      DATA_SOURCE_NAME: "postgresql://postgres:PASSWORD@localhost:5432/postgres?sslmode=require"
    depends_on:
      - db
    networks:
      - default

volumes:
  prometheus-data:
```

---

## PromQL 기초 (Preview)

**PromQL** (Prometheus Query Language)은 메트릭을 쿼리하고 분석하는 언어입니다.

### 간단한 쿼리 예시

```promql
# 현재 메모리 사용률 (%)
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# 지난 5분간 HTTP 요청 증가율 (초당 요청수)
rate(http_requests_total[5m])

# CPU 사용률이 80% 이상인 인스턴스
node_cpu_seconds_total > 80

# 지난 1시간 평균 응답 시간
avg(rate(http_request_duration_seconds_sum[1h]) / rate(http_request_duration_seconds_count[1h]))
```

다음 학습 (06-D-15)에서 Grafana로 이런 쿼리를 시각화합니다.

---

## 핵심 요약

| 항목 | 설명 |
|------|------|
| **Prometheus란** | Pull 기반 시계열 메트릭 수집 & 저장 시스템 |
| **수집 간격** | 기본 15초 (설정 가능) |
| **메트릭 타입** | Counter, Gauge, Histogram, Summary |
| **Exporter** | 메트릭을 HTTP 엔드포인트로 노출하는 프로그램 |
| **주요 Exporter** | node-exporter (서버), postgres-exporter (DB), cadvisor (컨테이너) |
| **설정 파일** | prometheus.yml - job별로 scrape 대상 정의 |
| **저장소** | 시계열 DB (TSDB) - 시간순으로 압축 저장 |
| **쿼리 언어** | PromQL - 메트릭 검색 및 계산 |
| **리소스** | DB에 따라 1GB~10GB 저장공간 필요 (보관 기간에 따라) |

---

## 다음 단계

다음 학습 06-D-15에서:
- Prometheus에서 수집한 메트릭을 **Grafana**로 시각화
- 대시보드 생성 및 실시간 모니터링
- 커뮤니티 대시보드 (node-exporter, PostgreSQL 등) 임포트

이 과정을 통해 "Uptime Kuma는 통보, Prometheus+Grafana는 상세 진단" 이라는 이해에 도달하게 됩니다.
