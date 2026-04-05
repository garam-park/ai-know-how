# 공공 IT 수주 후 관리 SaaS - 설계 문서 v1.0

> 작성일: 2026-04-01
> 상태: Step 1~5 완료 (도메인 정리 / 엔티티 설계 / 권한 시스템 / Prisma 스키마 / 시나리오 검증 / API 설계)

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [현재 수행 중인 사업 현황](#2-현재-수행-중인-사업-현황)
3. [전체 기능 목록](#3-전체-기능-목록)
4. [개발 우선순위](#4-개발-우선순위)
5. [도메인 용어 정리](#5-도메인-용어-정리-step-1)
6. [엔티티 관계 설계](#6-엔티티-관계-설계-step-2)
7. [권한 시스템 설계](#7-권한-시스템-설계-step-3)
8. [Prisma 스키마](#8-prisma-스키마-step-4)
9. [시나리오 검증](#9-시나리오-검증-step-5)
10. [API 설계](#10-api-설계-step-6)
11. [다음 단계](#11-다음-단계)

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
ORM:         Prisma 6
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
  └─ depth: 현재 깊이 (0부터 시작)
  └─ order: 같은 레벨에서 순서
  └─ weight: 가중치 (default 1 → 단순평균과 동일)
  └─ code: 관리 코드 (nullable) - AIR, UNG 등
```

- 최대 depth는 프로젝트 설정에서 지정
- CATEGORY: 하위 노드를 가질 수 있는 분류
- TASK: 실제 작업 단위 (진척률, 담당자 등 관리)
- 엑셀 다운로드 시 depth 기준 들여쓰기 처리

### 5.5 진척률 계산 정책

```
기본 공식: Σ(progress × weight) / Σ(weight)
weight = 1 (default) → 단순 평균과 동일
weight 입력 시       → 가중 평균으로 자동 전환
```

- TASK 노드: 담당자 직접 입력 / PM 강제 수정 / 산출물 검수 승인 시 (추후)
- CATEGORY 노드: 하위 TASK progress 변경 이벤트 발생 시 자동 재계산
- 모든 업데이트는 반드시 `recalculateProgress()` 단일 함수를 통해서만 처리

### 5.6 사용자 계정

- 이메일 기준 단일 계정
- 한 계정으로 여러 프로젝트 참여 가능
- 프로젝트마다 소속 Company와 Role/Permission이 다를 수 있음

### 5.7 중복투입 감지 정책

```
ProjectMember.inputRate: 해당 프로젝트 투입비율 % (기본 100%)
멤버 초대 / 투입비율 변경 시 동일 유저의 기간 겹치는 프로젝트 inputRate 합산
합산 > 100% 이면 경고
```

---

## 6. 엔티티 관계 설계 (Step 2)

### 6.1 Company 등록 방식

가입된 회사면 검색해서 초대, 없으면 새로 생성

```
Company
  └─ owner_user_id (nullable) ← 지금은 null, 나중에 채움
```

### 6.2 ProjectCompany 트리 구조

ProjectCompany가 자기 자신을 참조하는 트리 구조

```
id | project_id | company_id | role   | parent_id
1  | 1          | 발주처A    | OWNER  | null
2  | 1          | 주관사B    | PRIME  | null
3  | 1          | 참여사C    | PARTNER| 2   ← 주관사B 하위
4  | 1          | 하청D      | SUB    | 3   ← 참여사C 하위
5  | 1          | 하청E      | SUB    | 2   ← 주관사B 직하청
```

한 회사가 같은 프로젝트에서 두 가지 역할 동시 보유 가능:
```
3  | 1 | A회사 | PARTNER | 2
6  | 1 | A회사 | SUB     | 3  ← 같은 프로젝트, 같은 회사, 다른 역할
```

### 6.3 ProjectMember

```
ProjectMember
  └─ project_id
  └─ user_id
  └─ project_company_id  ← 이 프로젝트에서 소속 회사
  └─ role_id             ← 이 프로젝트에서의 역할(프리셋)
  └─ input_rate          ← 투입비율 % (default 100)

@@unique([projectId, userId])  ← 한 프로젝트에 한 사람은 딱 하나의 소속/역할
```

### 6.4 확정된 전체 엔티티 목록

```
User                  개인 계정 (이메일 기준)
Company               참여 회사
Project               사업
ProjectCompany        프로젝트-회사 관계 (트리구조, Role 포함)
ProjectMember         프로젝트-유저 관계 (소속회사, Role, 투입비율 포함)
Role                  권한 프리셋 (주관사PM / 참여사PM / 실무자 / 뷰어)
Permission            resource + action 단위 권한
RolePermission        Role → Permission + Scope 매핑 (기본값)
ProjectRolePermission Role → Permission + Scope 매핑 (프로젝트 커스텀)
WbsNode               WBS 노드 (CATEGORY / TASK, 트리구조)
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
Role (프리셋)          → 기능 권한 묶음 부여 (A단계 MVP)
Scope (조건)           → 데이터 범위 제어
ProjectRolePermission  → 프로젝트별 커스터마이징 (C단계 고도화)
```

**확장 전략**
```
A단계 (MVP):    프리셋 Role 선택 → Permission 자동 부여
C단계 (고도화): 프리셋 선택 후 개별 Permission on/off 가능
DB 구조는 동일, UI만 추가
```

### 7.2 Permission 목록

| id | resource | action |
|---|---|---|
| 1 | WBS | VIEW |
| 2 | WBS | EDIT |
| 3 | REPORT | VIEW |
| 4 | REPORT | CREATE |
| 5 | REPORT | DOWNLOAD |
| 6 | TIMESHEET | VIEW |
| 7 | TIMESHEET | EDIT |
| 8 | TIMESHEET | DOWNLOAD |
| 9 | MEMBER | VIEW |
| 10 | MEMBER | INVITE |
| 11 | MEMBER | REMOVE |
| 12 | MEMBER | PERMISSION |
| 13 | COMPANY | VIEW |
| 14 | COMPANY | MANAGE |
| 15 | PROJECT | VIEW |
| 16 | PROJECT | EDIT |
| 17 | PROJECT | SETTING |
| 18 | DELIVERABLE | VIEW |
| 19 | DELIVERABLE | UPLOAD |
| 20 | DELIVERABLE | APPROVE |
| 21 | ISSUE | VIEW |
| 22 | ISSUE | MANAGE |
| 23 | RISK | VIEW |
| 24 | RISK | MANAGE |
| 25 | CHANGE | VIEW |
| 26 | CHANGE | REQUEST |
| 27 | CHANGE | APPROVE |
| 28 | AUDIT | VIEW |
| 29 | AUDIT | MANAGE |
| 30 | CLOSE | VIEW |
| 31 | CLOSE | MANAGE |

### 7.3 Role 프리셋 및 기본 권한 매핑

```
주관사PM  → 전체 권한 ALL scope

참여사PM  → WBS VIEW/EDIT        OWN_COMPANY
           REPORT VIEW/CREATE   ALL
           TIMESHEET VIEW/EDIT  OWN_COMPANY
           MEMBER VIEW          ALL
           ISSUE MANAGE         ALL
           CHANGE REQUEST       ALL

실무자    → WBS VIEW/EDIT        OWN_TASK
           REPORT VIEW          ALL
           TIMESHEET VIEW/EDIT  OWN_TASK
           DELIVERABLE UPLOAD   OWN_TASK
           ISSUE VIEW           ALL

뷰어      → WBS VIEW             ALL
           REPORT VIEW/DOWNLOAD ALL
           DELIVERABLE VIEW     ALL
```

### 7.4 권한 조회 우선순위

```
1. ProjectRolePermission 먼저 확인 (프로젝트 커스텀)
2. 없으면 RolePermission 사용 (기본값)
```

### 7.5 NestJS 구현 방향

**TypeScript Enum**
```typescript
export enum Resource {
  WBS = 'WBS', REPORT = 'REPORT', TIMESHEET = 'TIMESHEET',
  MEMBER = 'MEMBER', COMPANY = 'COMPANY', PROJECT = 'PROJECT',
  DELIVERABLE = 'DELIVERABLE', ISSUE = 'ISSUE', RISK = 'RISK',
  CHANGE = 'CHANGE', AUDIT = 'AUDIT', CLOSE = 'CLOSE',
}

export enum Action {
  VIEW = 'VIEW', EDIT = 'EDIT', CREATE = 'CREATE', DELETE = 'DELETE',
  INVITE = 'INVITE', REMOVE = 'REMOVE', APPROVE = 'APPROVE',
  REQUEST = 'REQUEST', DOWNLOAD = 'DOWNLOAD', MANAGE = 'MANAGE', SETTING = 'SETTING',
}

export enum Scope {
  ALL = 'ALL', OWN_COMPANY = 'OWN_COMPANY', OWN_TASK = 'OWN_TASK', NONE = 'NONE',
}
```

**Guard + Decorator**
```typescript
@UseGuards(PermissionGuard)
@RequirePermission(Resource.WBS, Action.VIEW)
@Get('/projects/:id/wbs-nodes')
async getWbsNodes(@Param('id') projectId: number, @CurrentUser() user: User) {
  const scope = await this.permissionService.getScope(
    projectId, user, Resource.WBS, Action.VIEW
  );
  switch (scope) {
    case Scope.ALL:         return this.wbsService.findAll(projectId);
    case Scope.OWN_COMPANY: return this.wbsService.findByCompany(projectId, user.companyId);
    case Scope.OWN_TASK:    return this.wbsService.findByAssignee(projectId, user.id);
    default:                throw new ForbiddenException();
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
```

---

## 8. Prisma 스키마 (Step 4)

> 전체 스키마는 별도 파일 `schema.prisma` 참고

**스키마 설계 주요 결정사항**

```
✅ Soft Delete: 모든 테이블 deleted_at 컬럼
✅ 공통 타임스탬프: created_at, updated_at
✅ ProjectMember.inputRate: default 100 (투입비율%)
✅ WbsNode.weight: default 1 (단순평균 → 가중평균 자동 전환)
✅ WbsNode.code: nullable (AIR, UNG 등 관리코드)
✅ WbsNode.progress: recalculateProgress() 단일 함수로만 업데이트
✅ ProjectMember @@unique([projectId, userId])
✅ Company.owner_user_id: nullable (나중에 채움)
```

**진척률 재계산 함수**
```typescript
async recalculateProgress(wbsNodeId: number): Promise<void> {
  const node = await this.findWithParent(wbsNodeId);
  if (!node.parentId) return; // 루트면 종료

  const siblings = await this.findChildren(node.parentId);
  const parentProgress = this.calcWeightedAverage(siblings);
  // Σ(progress × weight) / Σ(weight)

  await this.update(node.parentId, { progress: parentProgress });
  await this.recalculateProgress(node.parentId); // 루트까지 재귀
}
```

---

## 9. 시나리오 검증 (Step 5)

| 시나리오 | 내용 | 결과 |
|---|---|---|
| 1 | 컨소 트리구조 표현 | ✅ 정상 |
| 2 | 멤버 초대 및 권한 부여 | ✅ 정상 |
| 3 | WBS 조회 권한 분기 (scope 적용) | ✅ 정상 |
| 4 | WBS 진척률 가중평균 재계산 | ✅ 정상 |
| 5 | 중복투입 감지 (inputRate 합산) | ✅ inputRate 추가로 해결 |

---

## 10. API 설계 (Step 6)

### 10.1 기본 원칙

**Base URL**: `/api/v1`

**인증**: JWT Bearer Token

**응답 형식**
```typescript
interface APIResponse<T = { [key: string]: any }> {
  code: number;     // 6자리: 앞 3자리 HTTP status, 뒤 3자리 의도
  message?: string;
  result: T;
}
```

**응답 코드 정의**
```
200000  OK
201000  Created

400000  Bad Request
400001  Validation Error
400002  Invalid Parameter
401000  Unauthorized
401001  Token Expired
403000  Forbidden
403001  Insufficient Scope
404000  Not Found
409000  Conflict
409001  Duplicate Member
409002  Overlap Input Rate

500000  Internal Server Error
```

**URL 설계 원칙**
- 리소스는 복수형 사용
- WBS 노드는 `/wbs-nodes` (약어 복수형 문제 해결, REST 원칙 준수)
- Soft Delete: DELETE는 실제 삭제 아닌 `deleted_at` 처리

---

### 10.2 인증 (Auth)

```
POST  /api/v1/auth/register    회원가입
POST  /api/v1/auth/login       로그인 → JWT 발급
POST  /api/v1/auth/refresh     토큰 갱신
POST  /api/v1/auth/logout      로그아웃
```

```typescript
// POST /auth/register Response
interface RegisterResponse {
  user: UserDto;
}

interface UserDto {
  id: number;
  email: string;
  name: string;
  tel?: string;
  createdAt: string;
}

// POST /auth/login Response
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}
```

---

### 10.3 회사 (Company)

```
GET    /api/v1/companies           회사 검색 (?keyword=)
POST   /api/v1/companies           회사 등록
GET    /api/v1/companies/:id       회사 상세
PATCH  /api/v1/companies/:id       회사 정보 수정
```

```typescript
interface CompanyListResponse {
  companies: CompanyDto[];
  totalCount: number;
}

interface CompanyDto {
  id: number;
  name: string;
  bizNo?: string;
  address?: string;
  tel?: string;
}
```

---

### 10.4 프로젝트 (Project)

```
GET    /api/v1/projects            내가 속한 프로젝트 목록
POST   /api/v1/projects            프로젝트 생성
GET    /api/v1/projects/:id        프로젝트 상세
PATCH  /api/v1/projects/:id        프로젝트 수정
DELETE /api/v1/projects/:id        프로젝트 삭제 (Soft)
```

```typescript
interface ProjectListResponse {
  projects: ProjectSummaryDto[];
  totalCount: number;
}

interface ProjectSummaryDto {
  id: number;
  name: string;
  code?: string;
  startDate: string;
  endDate: string;
  daysLeft: number;
  progress: number;
  myRole: RoleDto;
  myCompany: CompanyDto;
}

// GET /projects/:id Response
interface ProjectDetailResponse {
  project: ProjectDto;
  myPermissions: PermissionDto[]; // 프론트 메뉴 제어용
}
```

---

### 10.5 컨소시엄사 (ProjectCompany)

```
GET    /api/v1/projects/:id/companies
POST   /api/v1/projects/:id/companies
PATCH  /api/v1/projects/:id/companies/:projectCompanyId
DELETE /api/v1/projects/:id/companies/:projectCompanyId
```

```typescript
interface ProjectCompanyListResponse {
  companies: ProjectCompanyTreeDto[];
  totalCount: number;
}

interface ProjectCompanyTreeDto {
  id: number;
  company: CompanyDto;
  role: CompanyRole;            // OWNER / PRIME / PARTNER / SUB
  children: ProjectCompanyTreeDto[];
}

// 응답 예시
{
  code: 200000,
  result: {
    companies: [
      {
        id: 2, company: { name: "A기술" }, role: "PRIME",
        children: [
          {
            id: 3, company: { name: "B소프트" }, role: "PARTNER",
            children: [
              { id: 4, company: { name: "C개발" }, role: "SUB", children: [] }
            ]
          }
        ]
      }
    ],
    totalCount: 4
  }
}
```

---

### 10.6 멤버 (ProjectMember)

```
GET    /api/v1/projects/:id/members
POST   /api/v1/projects/:id/members
PATCH  /api/v1/projects/:id/members/:memberId
DELETE /api/v1/projects/:id/members/:memberId
GET    /api/v1/projects/:id/members/overlap    중복투입 감지
```

```typescript
interface ProjectMemberListResponse {
  members: ProjectMemberDto[];
  totalCount: number;
}

interface ProjectMemberDto {
  id: number;
  user: UserDto;
  company: CompanyDto;
  role: RoleDto;
  inputRate: number;
}

// POST /members Request
interface InviteMemberRequest {
  email: string;
  projectCompanyId: number;
  roleId: number;
  inputRate?: number;           // default 100
}

// GET /members/overlap Response
interface MemberOverlapResponse {
  overlaps: MemberOverlapDto[];
  totalCount: number;
}

interface MemberOverlapDto {
  user: UserDto;
  projects: OverlapProjectDto[];
  totalInputRate: number;       // 합산 투입비율
}

interface OverlapProjectDto {
  project: ProjectSummaryDto;
  inputRate: number;
  startDate: string;
  endDate: string;
}
```

---

### 10.7 권한 (Permission)

```
GET    /api/v1/roles                           역할 프리셋 목록
GET    /api/v1/projects/:id/my-permissions     내 권한 조회 (프론트 메뉴 제어용)
PATCH  /api/v1/projects/:id/permissions        프로젝트 권한 커스터마이징
```

```typescript
interface RoleListResponse {
  roles: RoleDetailDto[];
  totalCount: number;
}

interface RoleDetailDto {
  id: number;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: RolePermissionDto[];
}

interface RolePermissionDto {
  resource: Resource;
  action: Action;
  scope: Scope;
}

// GET /my-permissions Response
interface MyPermissionResponse {
  permissions: PermissionDto[];
}

interface PermissionDto {
  resource: Resource;
  action: Action;
  scope: Scope;
  isCustomized: boolean;        // 프로젝트 커스텀 여부
}
```

---

### 10.8 WBS 노드 (WbsNodes)

```
GET    /api/v1/projects/:id/wbs-nodes
POST   /api/v1/projects/:id/wbs-nodes
PATCH  /api/v1/projects/:id/wbs-nodes/:nodeId
PATCH  /api/v1/projects/:id/wbs-nodes/:nodeId/progress
PATCH  /api/v1/projects/:id/wbs-nodes/reorder
DELETE /api/v1/projects/:id/wbs-nodes/:nodeId
```

```typescript
interface WbsListResponse {
  nodes: WbsNodeTreeDto[];
  totalCount: number;
}

interface WbsNodeTreeDto {
  id: number;
  type: 'CATEGORY' | 'TASK';
  depth: number;
  order: number;
  code?: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  progress: number;
  weight: number;
  assignee?: UserDto;
  company?: CompanyDto;
  children: WbsNodeTreeDto[];
}

// PATCH /:nodeId/progress Request
interface UpdateProgressRequest {
  progress: number;             // 0~100, TASK 노드만 직접 입력 가능
}

// PATCH /:nodeId/progress Response
interface UpdateProgressResponse {
  node: WbsNodeTreeDto;
  affectedNodes: AffectedNodeDto[]; // 재계산된 상위 CATEGORY 노드들
}

interface AffectedNodeDto {
  id: number;
  progress: number;
}

// PATCH /reorder Request
interface ReorderWbsRequest {
  orders: ReorderItemDto[];
}

interface ReorderItemDto {
  nodeId: number;
  order: number;
  parentId?: number;
}
```

---

### 10.9 대시보드 (Dashboard)

```
GET    /api/v1/projects/:id/dashboard
```

```typescript
interface DashboardResponse {
  project: ProjectSummaryDto;
  progress: ProgressSummaryDto;
  members: MemberSummaryDto;
  wbs: WbsSummaryDto;
}

interface ProgressSummaryDto {
  overall: number;
  byCompany: CompanyProgressDto[];
}

interface CompanyProgressDto {
  company: CompanyDto;
  progress: number;
}

interface MemberSummaryDto {
  total: number;
  byCompany: CompanyMemberCountDto[];
}

interface CompanyMemberCountDto {
  company: CompanyDto;
  count: number;
}

interface WbsSummaryDto {
  total: number;
  completed: number;            // progress === 100
  inProgress: number;           // 0 < progress < 100
  notStarted: number;           // progress === 0
}
```

---

### 10.10 전체 API 목록 (1단계 기준)

```
[Auth]             4개
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

[Company]          4개
GET    /companies
POST   /companies
GET    /companies/:id
PATCH  /companies/:id

[Project]          5개
GET    /projects
POST   /projects
GET    /projects/:id
PATCH  /projects/:id
DELETE /projects/:id

[ProjectCompany]   4개
GET    /projects/:id/companies
POST   /projects/:id/companies
PATCH  /projects/:id/companies/:projectCompanyId
DELETE /projects/:id/companies/:projectCompanyId

[ProjectMember]    5개
GET    /projects/:id/members
POST   /projects/:id/members
PATCH  /projects/:id/members/:memberId
DELETE /projects/:id/members/:memberId
GET    /projects/:id/members/overlap

[Permission]       3개
GET    /roles
GET    /projects/:id/my-permissions
PATCH  /projects/:id/permissions

[WbsNodes]         6개
GET    /projects/:id/wbs-nodes
POST   /projects/:id/wbs-nodes
PATCH  /projects/:id/wbs-nodes/:nodeId
PATCH  /projects/:id/wbs-nodes/:nodeId/progress
PATCH  /projects/:id/wbs-nodes/reorder
DELETE /projects/:id/wbs-nodes/:nodeId

[Dashboard]        1개
GET    /projects/:id/dashboard

총 32개 엔드포인트
```

---

## 11. 다음 단계

- [x] Step 1: 도메인 용어 정리
- [x] Step 2: 엔티티 관계 설계
- [x] Step 3: 권한 시스템 설계
- [x] Step 4: Prisma 스키마 작성 → `schema.prisma`
- [x] Step 5: 시나리오 검증
- [x] Step 6: API 설계
- [ ] NestJS + React 모노레포 프로젝트 세팅
- [ ] 초기 시드 데이터 작성 (Role, Permission, RolePermission)
- [ ] 인증 모듈 구현 (JWT)
- [ ] 권한 Guard 구현

---

*참고 파일: `schema.prisma` (Prisma 스키마 전체)*
*이 문서는 개발 진행에 따라 계속 업데이트됩니다.*
