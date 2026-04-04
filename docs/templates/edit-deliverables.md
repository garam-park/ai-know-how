---
type: edit-deliverables
status: plan
assignee: AI | human | both
related_docs:
  - docs/deliverables/
related_src:
  - apps/
---

# {산출물명} 수정

## Why — 왜 이 산출물을 수정하는가

> 수정이 필요한 이유와 배경을 기술한다.
>
> 예: 2차 데이터 정의에 따라 FlightPlan 엔티티가 추가되었으므로, 데이터베이스 설계서에 해당 테이블 명세를 반영해야 한다.

## What — 무엇을 변경하는가

> 수정 결과물을 간결하게 정의한다. 어떤 내용이 추가/변경/삭제되는지 기술한다.
>
> 예:
>
> - `flight_plan` 테이블 명세 추가 (컬럼, 타입, 제약조건)
> - ERD 다이어그램에 FlightPlan 엔티티 및 관계 추가
> - 기존 `vertiport` 테이블 명세의 오탈자 수정

## Context — 수정 전 알아야 할 것

> 산출물의 현재 상태, 수정 범위, 주의할 제약사항을 요약한다.

| 항목        | 내용                                                                     |
| ----------- | ------------------------------------------------------------------------ |
| 대상 산출물 | 예: `docs/deliverables/UAM-PD-06-데이터베이스_설계서_v1.0.0_20260101.md` |
| 수정 버전   | 예: v1.0.0 → v1.0.1                                                      |
| 참고 문서   | 예: `docs/develop/UAM 데이터 정의.md`                                    |
| 참고 소스   | 예: `apps/uam/src/flight-plan/flight-plan.entity.ts`                     |

## Steps — 수정 절차

> 이 섹션만 보고 순서대로 따라하면 수정이 완료되어야 한다.
> 문서 수정 작업은 반드시 `wip/` 디렉토리에서 진행한다 (rule-handle-docs 규칙 준수).

### Step 1. wip 파일 준비

원본 파일을 `wip/` 디렉토리에 복사하고 버전·날짜를 갱신한다.

````
원본: docs/deliverables/{원본파일명}_v{X.Y.Z}_{YYYYMMDD}.md
복사: docs/deliverables/wip/{원본파일명}_v{X.Y.Z+1}_{오늘날짜}.md
```

**완료 기준**: `wip/` 디렉토리에 새 버전 파일이 존재한다.

---

### Step 2. {수정 항목명}

**대상 파일**: `docs/deliverables/wip/{파일명}.md`

**변경 내용**:

> 추가할 내용, 변경할 표, 삭제할 항목 등을 구체적으로 기술한다.

| 컬럼명 | 타입   | 제약조건     | 설명   |
| ------ | ------ | ------------ | ------ |
| 예: id | BIGINT | PK, NOT NULL | 식별자 |

**완료 기준**: {해당 섹션이 올바르게 반영된 상태}

---

### Step 3. {수정 항목명}

**대상 파일**: `docs/deliverables/wip/{파일명}.md`

**변경 내용**:

> 변경 내용 기술

**완료 기준**: {해당 섹션이 올바르게 반영된 상태}

---

> 판단 기준: 단계 중 선택이 필요한 경우 여기에 판단 기준을 명시한다.

### Step 마지막. 파일 이동 및 원본 보관

1. `wip/` 파일을 원래 위치로 이동한다.

   ```
   wip/{파일명}_v{X.Y.Z+1}_{오늘날짜}.md → docs/deliverables/{파일명}_v{X.Y.Z+1}_{오늘날짜}.md
````

1. 원본 파일을 `histories/{오늘날짜}/` 디렉토리로 이동한다.

   ```
   docs/deliverables/{원본파일명}_v{X.Y.Z}_{원본날짜}.md → docs/deliverables/histories/{오늘날짜}/{원본파일명}_v{X.Y.Z}_{원본날짜}.md
   ```

**완료 기준**: `wip/`에 파일이 없고, 새 버전 파일이 `docs/deliverables/`에, 원본이 `histories/`에 존재한다.

## Verification — 검증 방법

> 수정 완료 후 산출물의 품질을 확인하는 방법을 기술한다.

- [ ] 변경된 내용이 `docs/develop/` 또는 소스코드와 일치하는가
- [ ] 버전 및 날짜가 파일명과 문서 내 헤더 모두에 반영되었는가
- [ ] 기존 내용 중 의도치 않게 삭제되거나 변경된 항목이 없는가
