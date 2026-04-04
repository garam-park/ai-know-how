---
type: implement-src
status: plan
assignee: AI | human | both
related_docs:
  - docs/
related_src:
  - apps/
---

# {기능명}

## Why — 왜 이 작업을 하는가

> 이 기능이 필요한 이유, 배경, 비즈니스/도메인 맥락을 기술한다.
>
> 예: UAM 운항 관리 시스템에서 비행계획을 등록·조회하려면 FlightPlan 도메인 API가 필요하다.

## What — 무엇을 만드는가

> 구현 결과물을 간결하게 정의한다. 완료 시 어떤 상태가 되어야 하는지 기술한다.
>
> 예:
>
> - FlightPlan 엔티티 및 DB 테이블
> - CRUD REST API (`POST /flight-plans`, `GET /flight-plans/{id}`)
> - 유효성 검증 (출발/도착 버티포트 존재 여부, 시간 충돌 여부)

## Context — 구현 전 알아야 할 것

> 탐색·분석 단계에서 파악한 맥락을 요약한다.
> 의존하는 모듈, 도메인 규칙, 주의할 제약사항을 적는다.

| 항목        | 내용                                             |
| ----------- | ------------------------------------------------ |
| 관련 모듈   | 예: `VertiportModule`, `UserModule`              |
| 도메인 규칙 | 예: 비행계획은 출발/도착 버티포트가 달라야 한다  |
| 참고 파일   | 예: `apps/uam/src/vertiport/vertiport.entity.ts` |

## Steps — 구현 절차

> 이 섹션만 보고 순서대로 따라하면 구현이 완료되어야 한다.
> 각 단계는 **대상 파일**과 **변경 내용**을 구체적으로 명시한다.

### Step 1. {단계명}

**대상 파일**: `apps/.../경로/파일명.ts`

**변경 내용**:

````typescript
// 예시 코드 또는 변경 명세
```

**완료 기준**: {이 단계가 끝났을 때의 상태}

---

### Step 2. {단계명}

**대상 파일**: `apps/.../경로/파일명.ts`

**변경 내용**:

```typescript
// 예시 코드 또는 변경 명세
```

**완료 기준**: {이 단계가 끝났을 때의 상태}

---

> 판단 기준: 단계 중 선택이 필요한 경우 여기에 판단 기준을 명시한다.

## Verification — 검증 방법

> 구현 완료 후 정상 동작을 확인하는 방법을 기술한다.
> API 호출 예시, 기대 응답, 확인할 DB 레코드 등.

```bash
# 예시
curl -X POST http://localhost:3000/flight-plans \
  -H "Content-Type: application/json" \
  -d '{"departureVertiportId": 1, "arrivalVertiportId": 2}'
```

기대 응답:

```json
{
  "id": 1,
  "status": "PENDING"
}
```
````
