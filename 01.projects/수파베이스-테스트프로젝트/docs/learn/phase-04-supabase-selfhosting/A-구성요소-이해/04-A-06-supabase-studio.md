# 04-A-06 Supabase Studio 이해

> 유형: 개념 | 예상 소요 시간: 10분
> 이전: Realtime & Storage 이해 | 다음: 공식 docker-compose.yml 전체 구조 분석 (그룹 B)

---

## 이 파일에서 배우는 것

Supabase Studio(웹 대시보드)가 어떤 기능을 제공하는지 파악합니다.
셀프호스팅에서 Studio를 안전하게 운영하는 방법을 이해합니다.

---

## 본문

### Supabase Studio란?

Studio는 Supabase의 **웹 기반 관리 대시보드**입니다. DB 테이블 조회, SQL 실행, 사용자 관리, Storage 파일 탐색 등을 GUI로 할 수 있습니다.

FE 비유: phpMyAdmin의 현대적 버전이라고 생각하면 됩니다. 또는 Firebase Console의 셀프호스팅 버전입니다.

### Studio에서 할 수 있는 것

| 기능 | 설명 |
|---|---|
| **Table Editor** | 테이블 생성, 수정, 데이터 CRUD를 스프레드시트처럼 |
| **SQL Editor** | SQL 쿼리 직접 실행 (자동완성 지원) |
| **Authentication** | 사용자 목록 조회, 수동 생성/삭제 |
| **Storage** | 버킷 및 파일 관리 (업로드/다운로드/삭제) |
| **Database** | 역할, 확장(Extension), 타입 등 DB 설정 관리 |
| **API Docs** | 테이블 기반 자동 생성된 API 문서 확인 |
| **Logs** | 각 서비스의 로그 실시간 확인 |

### Studio의 아키텍처

```
브라우저
   │
   │  https://studio.your-domain.com
   │
   ▼
┌──────────┐
│  Studio   │  (Next.js 앱, 포트 3000)
└────┬─────┘
     │
     ├──→ PostgreSQL (직접 연결, meta 스키마)
     ├──→ PostgREST (REST API 호출)
     ├──→ GoTrue (Auth 관리)
     └──→ Storage (파일 관리)
```

Studio는 **다른 서비스들의 API를 호출하는 프론트엔드 앱**입니다. 즉, Studio 자체가 데이터를 저장하거나 처리하지 않고, 다른 마이크로서비스에 요청을 보내는 클라이언트 역할을 합니다.

### 셀프호스팅에서 Studio 보안

Studio는 DB에 **관리자 권한으로 접근**할 수 있기 때문에 보안이 매우 중요합니다.

#### 반드시 해야 할 것

1. **Studio를 외부에 노출하지 않거나, 접근 제한을 걸어야 합니다.**
   - 방법 1: Caddy에서 IP 화이트리스트 설정
   - 방법 2: Basic Auth 추가
   - 방법 3: VPN을 통해서만 접근 가능하게 설정

2. **기본 비밀번호를 반드시 변경해야 합니다.**
   - `.env` 파일의 `DASHBOARD_USERNAME`과 `DASHBOARD_PASSWORD`

#### 흔한 실수

| 실수 | 결과 |
|---|---|
| Studio를 공개 URL로 노출 | 누구나 DB를 조작할 수 있음 |
| 기본 비밀번호 사용 | 봇이 자동으로 접근 시도 |
| Studio 포트(3000)를 직접 개방 | Kong을 우회한 비인증 접근 가능 |

### Studio를 꼭 써야 하나?

아닙니다. Studio는 **선택사항**입니다. psql(CLI 도구)로 모든 DB 작업이 가능합니다. 다만 초기 세팅과 데이터 확인 시에는 GUI가 훨씬 편리하므로, 처음에는 Studio를 적극 활용하는 것을 추천합니다.

리소스가 부족한 서버(1GB RAM 등)에서는 Studio를 비활성화하면 메모리를 절약할 수 있습니다.

### Studio 접근 URL 구성

셀프호스팅에서 Studio에 접근하는 일반적인 패턴:

```
# Kong을 통한 접근 (권장)
https://your-domain.com/  → Studio

# 별도 서브도메인 (선택)
https://studio.your-domain.com  → Studio
```

구체적인 Caddy 설정은 Phase 4 그룹 C에서 다룹니다.

---

## 핵심 정리

- Supabase Studio는 **웹 기반 관리 대시보드**로, DB·Auth·Storage를 GUI로 관리할 수 있다.
- Studio는 다른 서비스의 API를 호출하는 **프론트엔드 앱**이므로, Studio가 죽어도 실제 서비스는 정상 동작한다.
- 셀프호스팅에서 Studio 보안(IP 제한, 비밀번호 변경)은 **필수**이며, 리소스가 부족하면 비활성화할 수 있다.

---

## 다음 파일 예고

지금까지 배운 구성요소들이 `docker-compose.yml`에서 어떻게 정의되어 있는지, 전체 파일 구조를 분석합니다. (Phase 4 그룹 B 시작)
