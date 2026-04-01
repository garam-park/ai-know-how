# 공공 IT 수주 후 관리 SaaS - 설계 문서 v1.0

> 작성일: 2026-04-01
> 상태: Step 1 (도메인 정리) + Step 2 (엔티티 관계 설계) + 권한 시스템 설계 완료

---

## 1. 프로젝트 개요

### 배경
- 공공 IT 발주 사업은 수주 후 관리 절차가 법적으로 정형화되어 있음
- 현재 실무에서는 엑셀/PPT 수작업이 대부분
- 기존 도구(Jira, MS Project 등)는 공공 보고 양식과 맞지 않음
- 컨소시엄 구조를 반영한 권한 관리 도구가 없음

### 목표
- 공공 IT 사업 수주 후 관리를 웹 기반으로 자동화
- 컨소시엄 구조에 맞는 권한/뷰 분리
- 기존 실무자 친화적 (PPT/엑셀 다운로드 지원)
- 나라장터 / 디지털서비스몰 등록 목표

### 개발 방식
- 혼자 + AI 도구 (Claude, Cursor 등)
- 현재 수행 중인 사업에 직접 적용하며 검증

### 기술 스택
```
프론트엔드:  React + TypeScript
백엔드:      NestJS (TypeScript)
DB:          PostgreSQL
ORM:         Prisma
PPT 생성:    pptxgenjs
엑셀 생성:   exceljs
```

> NestJS 채택 이유
> - React와 TypeScript 타입 공유 가능 (shared 패키지)
> - AI 코드 생성 품질이 높음 (Cursor/Claude)
> - 프론트/백 컨텍스트 스위칭 비용 감소
> - 공공사업 납품물(Spring Boot)과 SaaS는 별개로 운영

---

## 2. 현재 수행 중인 사업 현황

| 사업 | 남은 기간 | 활용 계획 |
|---|---|---|
| 사업 A | 1개월 | 종료 단계 페인포인트 기록 |
| 사업 B | 3개월 | MVP 기능 검증 |
| 사업 C | 8개월 | 본격 운영 및 고도화 |

### 보유 포지션
- 주관사급 권한 보유 사업
- 참여사 포지션 사업
- 하청 구조 사업

→ 세 가지 포지션을 동시에 경험하며 설계에 반영

---

## 3. 전체 기능 목록

### A. 프로젝트/조직 관리
- 프로젝트 생성 및 기본정보 관리
- 컨소시엄사 등록 및 관리
- 멤버 초대 + 권한 설정
- 컨소사별 뷰 분리

### B. WBS / 일정 관리
- WBS 입력 및 편집 (계층형, 가변 depth)
- 담당 컨소사 / 담당자 지정
- 진척률 업데이트
- 일정 현황 시각화 (간트차트)

> ※ WBS(B)와 이슈(F)의 차이
> - B는 **계획된 것** → 계획표 (처음부터 알고 있는 태스크)
> - F는 **예상치 못한 것** → 사고일지 (하다가 터진 문제)

### C. 보고서 관리
- 주간보고서 자동생성 → PPT 다운로드
- 월간보고서 자동생성
- 발주처별 양식 커스터마이징

### D. 공수 관리
- 인력별 일일 공수 입력
- 제안 투입계획 대비 실적 비교
- 공수 현황 엑셀 다운로드
- **중복투입 감지**: 동일인 여러 프로젝트 중복 투입 경고, 공수 합계 100% 초과 경고

### E. 산출물 관리
- 산출물 목록 등록
- 파일 업로드 / 버전 관리
- 검수 상태 관리 (미제출 / 제출 / 승인 / 반려)

### F. 이슈 / 리스크 관리
- 이슈 등록 및 담당자 지정
- 상태 추적 (오픈 / 처리중 / 완료)
- 리스크 등록 및 대응계획

### G. 변경 관리
- 범위변경 요청 등록
- 협의 이력 관리
- 계약변경 연결

### H. 감리 대응
- 감리 단계별 체크리스트
- 필수 산출물 준비 현황
- 지적사항 → 조치계획 → 완료 워크플로우

### I. 납품 / 종료 관리
- 최종 산출물 목록 체크
- 검수조서 생성
- 하자보수 기간 관리

### J. 대시보드
- 프로젝트 전체 현황 한눈에
- 권한별 다른 뷰
- 감리 D-Day, 납품일 카운트다운

---

## 4. 개발 우선순위

### 1단계 (지금 ~ 6주): 핵심 뼈대
- **A** 프로젝트/조직/권한
- **B** WBS/일정
- **J** 대시보드 (간단하게)

### 2단계 (6주 ~ 3개월): 현장 검증
- **C** 보고서 PPT 다운로드

### 3단계 (3개월 ~ 8개월): 고도화
- **D** 공수관리
- **E** 산출물관리
- **F** 이슈/리스크
- **G, H, I** 순차 추가

---

## 5. 도메인 용어 정리 (Step 1)

### 5.1 조직 구조

```
발주처 (N곳)
  └─ 주관사 (N곳, 보통 1곳)
       ├─ 참여사 (N곳)
       │    └─ 하청 (N곳)
       └─ 하청 (N곳, 주관사 직하청도 가능)
```

- 모든 관계가 N:N 가능
- 하청의 상위가 참여사일 수도, 주관사일 수도 있음 → **트리 구조**
- 한 회사가 같은 프로젝트에서 두 가지 역할 동시 보유 가능

### 5.2 역할(Role) vs 권한(Permission) 분리

```
Role        회사의 사업 내 역할 (주관사PM / 참여사PM / 실무자 / 뷰어)
Permission  기능 권한(What: resource + action) + 데이터 범위(Where: scope)
```

- 같은 회사 소속이어도 사람마다 Permission이 다를 수 있음
- Permission은 **프로젝트마다 커스터마이징 가능**

### 5.3 데이터 범위 (Scope)

| Scope | 설명 | 대상 |
|---|---|---|
| ALL | 전체 | 주관사PM |
| OWN_COMPANY | 자기 회사 파트만 | 참여사PM |
| OWN_TASK | 내가 담당한 태스크만 | 실무자/하청 |
| NONE | 접근 불가 | - |

→ 프로젝트 설정에서 역할별 데이터 범위를 커스터마이징 가능

### 5.4 WBS 구조

```
WbsNode
  └─ type: CATEGORY or TASK
  └─ parent_id: 상위 노드 (null이면 최상위)
  └─ depth: 현재 깊이
  └─ order: 같은 레벨에서 순서
```

- 최대 depth는 프로젝트 설정에서 지정
- CATEGORY: 하위 노드를 가질 수 있는 분류
- TASK: 실제 작업 단위 (진척률, 담당자 등 관리)
- 엑셀 다운로드 시 depth 기준 들여쓰기 처리

### 5.5 사용자 계정

- 이메일 기준 단일 계정
- 한 계정으로 여러 프로젝트 참여 가능
- 프로젝트마다 소속 Company와 Role/Permission이 다를 수 있음

---

## 6. 엔티티 관계 설계 (Step 2)

### 6.1 Company 등록 방식

가입된 회사면 검색해서 초대, 없으면 새로 생성 (Case C 채택)

```
Company
  └─ id
  └─ name
  └─ owner_user_id  (nullable) ← 지금은 null, 나중에 채움
  └─ ...기타 정보
```

### 6.2 ProjectCompany 트리 구조

ProjectCompany가 자기 자신을 참조하는 트리 구조

```
ProjectCompany
  └─ id
  └─ project_id
  └─ company_id
  └─ role        (주관사 / 참여사 / 하청 / 발주처)
  └─ parent_id   (상위 ProjectCompany, null이면 최상위)
```

**실제 데이터 예시**
```
id | project_id | company_id | role   | parent_id
1  | 1          | 발주처A    | 발주처  | null
2  | 1          | 주관사B    | 주관사  | null
3  | 1          | 참여사C    | 참여사  | 2  ← 주관사B 하위
4  | 1          | 하청D      | 하청    | 3  ← 참여사C 하위
5  | 1          | 하청E      | 하청    | 2  ← 주관사B 직하청
```

**같은 프로젝트에서 한 회사가 두 가지 역할**
```
id | project_id | company_id | role   | parent_id
3  | 1          | A회사      | 참여사  | 2
6  | 1          | A회사      | 하청    | 3  ← 같은 프로젝트, 같은 회사, 다른 역할
```

### 6.3 User / ProjectMember

```
User
  └─ id
  └─ email (unique)
  └─ name
  └─ ...

ProjectMember
  └─ id
  └─ project_id
  └─ user_id
  └─ project_company_id  ← 이 프로젝트에서 소속 회사
  └─ role_id             ← 이 프로젝트에서의 역할(프리셋)
```

---

## 7. 권한 시스템 설계 (Step 3)

### 7.1 설계 방향: RBAC + Policy 조합

| 패턴 | 설명 | 채택 여부 |
|---|---|---|
| RBAC | Role → Permission 묶음 | ✅ 채택 |
| Policy (What+Scope) | resource + action + scope | ✅ 채택 |
| ABAC | 속성 기반 조건식 | 미채택 (복잡) |
| ReBAC | 관계 기반 | 미채택 (오버엔지니어링) |

**핵심 원칙**
```
Role (프리셋)          → 기능 권한 묶음 부여 (A단계)
Scope (조건)           → 데이터 범위 제어
ProjectRolePermission  → 프로젝트별 커스터마이징 (C단계)
```

**확장 전략**
```
A단계 (MVP): 프리셋 Role 선택 → Permission 자동 부여
C단계 (고도화): 프리셋 선택 후 개별 Permission on/off 가능
DB 구조는 동일, UI만 추가
```

### 7.2 Permission 테이블

```
id | resource    | action
1  | WBS         | VIEW
2  | WBS         | EDIT
3  | REPORT      | VIEW
4  | REPORT      | CREATE
5  | REPORT      | DOWNLOAD
6  | TIMESHEET   | VIEW
7  | TIMESHEET   | EDIT
8  | TIMESHEET   | DOWNLOAD
9  | MEMBER      | VIEW
10 | MEMBER      | INVITE
11 | MEMBER      | REMOVE
12 | MEMBER      | PERMISSION
13 | COMPANY     | VIEW
14 | COMPANY     | MANAGE
15 | PROJECT     | VIEW
16 | PROJECT     | EDIT
17 | PROJECT     | SETTING
18 | DELIVERABLE | VIEW
19 | DELIVERABLE | UPLOAD
20 | DELIVERABLE | APPROVE
21 | ISSUE       | VIEW
22 | ISSUE       | MANAGE
23 | RISK        | VIEW
24 | RISK        | MANAGE
25 | CHANGE      | VIEW
26 | CHANGE      | REQUEST
27 | CHANGE      | APPROVE
28 | AUDIT       | VIEW
29 | AUDIT       | MANAGE
30 | CLOSE       | VIEW
31 | CLOSE       | MANAGE
```

### 7.3 Role 프리셋 테이블

```
id | name      | description
1  | 주관사PM  | 전체 관리
2  | 참여사PM  | 참여사 관리
3  | 실무자    | 실무 작업
4  | 뷰어      | 조회만 (발주처 등)
```

### 7.4 RolePermission 테이블 (기본값)

```
role_id | resource    | action     | scope
────────────────────────────────────────────
1       | 전체        | 전체        | ALL         ← 주관사PM

2       | WBS         | VIEW        | OWN_COMPANY ← 참여사PM
2       | WBS         | EDIT        | OWN_COMPANY
2       | REPORT      | VIEW        | ALL
2       | REPORT      | CREATE      | ALL
2       | TIMESHEET   | VIEW        | OWN_COMPANY
2       | TIMESHEET   | EDIT        | OWN_COMPANY
2       | MEMBER      | VIEW        | ALL
2       | ISSUE       | MANAGE      | ALL
2       | CHANGE      | REQUEST     | ALL

3       | WBS         | VIEW        | OWN_TASK    ← 실무자
3       | WBS         | EDIT        | OWN_TASK
3       | REPORT      | VIEW        | ALL
3       | TIMESHEET   | VIEW        | OWN_TASK
3       | TIMESHEET   | EDIT        | OWN_TASK
3       | DELIVERABLE | UPLOAD      | OWN_TASK
3       | ISSUE       | VIEW        | ALL

4       | WBS         | VIEW        | ALL         ← 뷰어(발주처)
4       | REPORT      | VIEW        | ALL
4       | REPORT      | DOWNLOAD    | ALL
4       | DELIVERABLE | VIEW        | ALL
```

### 7.5 ProjectRolePermission 테이블 (프로젝트별 커스터마이징)

```
id | project_id | role_id | resource | action | scope
1  | 1          | 2       | WBS      | VIEW   | ALL
← 프로젝트1에서 참여사PM은 전체 WBS 조회 가능 (기본값 OWN_COMPANY 덮어씀)
```

**권한 조회 우선순위**
```
1. ProjectRolePermission 먼저 확인 (프로젝트 커스텀)
2. 없으면 RolePermission 사용 (기본값)
```

### 7.6 실제 동작 시나리오

**시나리오 1: 참여사PM이 WBS 조회**
```
홍길동 (참여사PM, A회사)
  → RolePermission: WBS + VIEW = OWN_COMPANY
  → A회사에 배정된 WBS 노드만 반환
```

**시나리오 2: 주관사PM이 WBS 조회**
```
김철수 (주관사PM)
  → RolePermission: WBS + VIEW = ALL
  → 전체 WBS 반환
```

**시나리오 3: 실무자가 공수 입력**
```
이영희 (실무자)
  → RolePermission: TIMESHEET + EDIT = OWN_TASK
  → 본인 담당 태스크 공수만 입력 가능
```

**시나리오 4: 프로젝트 커스터마이징 적용**
```
박지수 (참여사PM, 프로젝트1)
  → ProjectRolePermission 확인: WBS + VIEW = ALL (커스텀 존재)
  → 기본값 무시, 전체 WBS 반환
```

### 7.7 NestJS 구현 방향

**TypeScript Enum 정의**
```typescript
export enum Resource {
  WBS = 'WBS',
  REPORT = 'REPORT',
  TIMESHEET = 'TIMESHEET',
  MEMBER = 'MEMBER',
  COMPANY = 'COMPANY',
  PROJECT = 'PROJECT',
  DELIVERABLE = 'DELIVERABLE',
  ISSUE = 'ISSUE',
  RISK = 'RISK',
  CHANGE = 'CHANGE',
  AUDIT = 'AUDIT',
  CLOSE = 'CLOSE',
}

export enum Action {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  CREATE = 'CREATE',
  DELETE = 'DELETE',
  INVITE = 'INVITE',
  REMOVE = 'REMOVE',
  APPROVE = 'APPROVE',
  REQUEST = 'REQUEST',
  DOWNLOAD = 'DOWNLOAD',
  MANAGE = 'MANAGE',
  SETTING = 'SETTING',
}

export enum Scope {
  ALL = 'ALL',
  OWN_COMPANY = 'OWN_COMPANY',
  OWN_TASK = 'OWN_TASK',
  NONE = 'NONE',
}
```

**Guard + Decorator 방식**
```typescript
@UseGuards(PermissionGuard)
@RequirePermission(Resource.WBS, Action.VIEW)
@Get('/projects/:id/wbs')
async getWbs(
  @Param('id') projectId: number,
  @CurrentUser() user: User
) {
  const scope = await this.permissionService.getScope(
    projectId, user, Resource.WBS, Action.VIEW
  );

  switch (scope) {
    case Scope.ALL:
      return this.wbsService.findAll(projectId);
    case Scope.OWN_COMPANY:
      return this.wbsService.findByCompany(projectId, user.companyId);
    case Scope.OWN_TASK:
      return this.wbsService.findByAssignee(projectId, user.id);
    default:
      throw new ForbiddenException();
  }
}
```

**프론트-백 타입 공유 (shared 패키지)**
```typescript
// packages/shared/types/wbs.ts
export interface WbsNode {
  id: number;
  type: 'CATEGORY' | 'TASK';
  depth: number;
  title: string;
  progress?: number;
  assigneeId?: number;
  companyId?: number;
}

// 백엔드, 프론트 둘 다 이 타입 그대로 사용
```

---

## 8. 확정된 전체 엔티티 목록

```
User                  개인 계정 (이메일 기준)
Company               참여 회사
Project               사업
ProjectCompany        프로젝트-회사 관계 (트리구조, Role 포함)
ProjectMember         프로젝트-유저 관계 (소속회사, Role 포함)
Role                  권한 프리셋 (주관사PM / 참여사PM / 실무자 / 뷰어)
Permission            resource + action 단위 권한
RolePermission        Role → Permission + Scope 매핑 (기본값)
ProjectRolePermission Role → Permission + Scope 매핑 (프로젝트 커스텀)
WbsNode               WBS 노드 (CATEGORY / TASK, 트리구조)
```

---

## 9. 다음 단계

- [ ] Step 3: 전체 테이블 명세 작성 (Prisma 스키마 기준)
- [ ] Step 4: 실제 시나리오로 설계 검증
- [ ] Step 5: API 설계 방향
- [ ] NestJS + React 모노레포 프로젝트 세팅

---

*이 문서는 설계 진행에 따라 계속 업데이트됩니다.*
