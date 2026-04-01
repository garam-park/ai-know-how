# 공공 IT 수주 후 관리 SaaS - 설계 문서 v0.2

> 작성일: 2026-04-01  
> 상태: Step 2 (엔티티 관계 설계) + 권한 시스템 설계 완료  
> 이전 문서: 설계문서 v0.1 (Step 1 도메인 정리)

---

## Step 2. 핵심 엔티티 관계 설계

### 2.1 Company 등록 방식

- **Case C 채택**: 가입된 회사면 검색해서 초대, 없으면 새로 생성
- 회사 소유권(owner)은 나중 기능이지만 DB 컬럼은 미리 확보

```
Company
  └─ id
  └─ name
  └─ owner_user_id (nullable) ← 지금은 null, 나중에 채움
  └─ ...기타 정보
```

---

### 2.2 ProjectCompany 트리 구조

하청이 참여사 밑 또는 주관사 밑 둘 다 가능(Case C)하므로  
ProjectCompany가 자기 자신을 참조하는 트리 구조로 설계

```
ProjectCompany
  └─ id
  └─ project_id
  └─ company_id
  └─ role          (주관사 / 참여사 / 하청 / 발주처)
  └─ parent_id     (상위 ProjectCompany, null이면 최상위)
```

**실제 데이터 예시**
```
id | project_id | company_id | role   | parent_id
1  | 1          | 발주처A    | 발주처  | null
2  | 1          | 주관사B    | 주관사  | null
3  | 1          | 참여사C    | 참여사  | 2 (주관사B 하위)
4  | 1          | 하청D      | 하청    | 3 (참여사C 하위)
5  | 1          | 하청E      | 하청    | 2 (주관사B 직하청)
```

**한 회사가 같은 프로젝트에서 두 가지 역할 가능**
```
id | project_id | company_id | role   | parent_id
3  | 1          | A회사      | 참여사  | 2
6  | 1          | A회사      | 하청    | 3  ← 같은 프로젝트, 같은 회사, 다른 역할
```

---

### 2.3 User / ProjectMember

- 이메일 기준 단일 계정
- 한 계정으로 여러 프로젝트 참여 가능
- 프로젝트마다 소속 Company와 Role이 다를 수 있음

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

## Step 3. 권한 시스템 설계

### 3.1 설계 방향: RBAC + Policy 조합

| 패턴 | 설명 | 채택 여부 |
|---|---|---|
| Flat Permission | WHAT_ACTION 텍스트 | 부분 채택 |
| RBAC | Role → Permission 묶음 | ✅ 채택 |
| ABAC | 속성 기반 조건식 | 미채택 (복잡) |
| ReBAC | 관계 기반 | 미채택 (오버엔지니어링) |
| Policy (What+Scope) | resource + action + scope | ✅ 채택 |

**핵심 원칙**
```
Role (프리셋)     → 기능 권한 묶음 부여
Scope (조건)      → 데이터 범위 제어
ProjectRolePermission → 프로젝트별 커스터마이징
```

---

### 3.2 테이블 구조

**Permission 테이블**
```
id | resource  | action
1  | WBS       | VIEW
2  | WBS       | EDIT
3  | REPORT    | VIEW
4  | REPORT    | CREATE
5  | REPORT    | DOWNLOAD
6  | TIMESHEET | VIEW
7  | TIMESHEET | EDIT
8  | TIMESHEET | DOWNLOAD
9  | MEMBER    | VIEW
10 | MEMBER    | INVITE
11 | MEMBER    | REMOVE
12 | MEMBER    | PERMISSION
13 | COMPANY   | VIEW
14 | COMPANY   | MANAGE
15 | PROJECT   | VIEW
16 | PROJECT   | EDIT
17 | PROJECT   | SETTING
18 | DELIVERABLE | VIEW
19 | DELIVERABLE | UPLOAD
20 | DELIVERABLE | APPROVE
21 | ISSUE     | VIEW
22 | ISSUE     | MANAGE
23 | RISK      | VIEW
24 | RISK      | MANAGE
25 | CHANGE    | VIEW
26 | CHANGE    | REQUEST
27 | CHANGE    | APPROVE
28 | AUDIT     | VIEW
29 | AUDIT     | MANAGE
30 | CLOSE     | VIEW
31 | CLOSE     | MANAGE
```

**Scope 종류**
```
ALL          전체
OWN_COMPANY  자기 회사 파트만
OWN_TASK     자기 담당 태스크만
NONE         접근 불가
```

**Role 테이블 (프리셋)**
```
id | name      | description
1  | 주관사PM  | 전체 관리
2  | 참여사PM  | 참여사 관리
3  | 실무자    | 실무 작업
4  | 뷰어      | 조회만 (발주처 등)
```

**RolePermission 테이블 (기본값)**
```
role_id | permission_id | scope
─────────────────────────────────────
1       | 전체          | ALL         ← 주관사PM 전체 권한

2       | WBS VIEW      | OWN_COMPANY ← 참여사PM
2       | WBS EDIT      | OWN_COMPANY
2       | REPORT VIEW   | ALL
2       | REPORT CREATE | ALL
2       | TIMESHEET VIEW| OWN_COMPANY
2       | TIMESHEET EDIT| OWN_COMPANY
2       | MEMBER VIEW   | ALL
2       | ISSUE MANAGE  | ALL
2       | CHANGE REQUEST| ALL

3       | WBS VIEW      | OWN_TASK    ← 실무자
3       | WBS PROGRESS  | OWN_TASK
3       | REPORT VIEW   | ALL
3       | TIMESHEET VIEW| OWN_TASK
3       | TIMESHEET EDIT| OWN_TASK
3       | DELIVERABLE UPLOAD | OWN_TASK
3       | ISSUE VIEW    | ALL

4       | WBS VIEW      | ALL         ← 뷰어(발주처)
4       | REPORT VIEW   | ALL
4       | REPORT DOWNLOAD | ALL
4       | DELIVERABLE VIEW | ALL
```

**ProjectRolePermission 테이블 (프로젝트별 커스터마이징)**
```
id | project_id | role_id | permission_id | scope
1  | 1          | 2       | WBS_VIEW      | ALL  
← 프로젝트1에서 참여사PM은 전체 WBS 볼 수 있음 (기본값 OWN_COMPANY 덮어씀)
```

---

### 3.3 권한 조회 우선순위

```
1. ProjectRolePermission 먼저 확인 (프로젝트 커스텀)
2. 없으면 RolePermission 사용 (기본값)
```

---

### 3.4 실제 동작 시나리오

**시나리오 1: 참여사PM이 WBS 조회**
```
홍길동 (참여사PM, A회사)
  → Role: 참여사PM
  → RolePermission: WBS + VIEW = OWN_COMPANY
  → A회사에 배정된 WBS 노드만 반환
```

**시나리오 2: 주관사PM이 WBS 조회**
```
김철수 (주관사PM)
  → Role: 주관사PM
  → RolePermission: WBS + VIEW = ALL
  → 전체 WBS 반환
```

**시나리오 3: 실무자가 공수 입력**
```
이영희 (실무자)
  → Role: 실무자
  → RolePermission: TIMESHEET + EDIT = OWN_TASK
  → 본인 담당 태스크 공수만 입력 가능
```

**시나리오 4: 프로젝트 커스터마이징 적용**
```
박지수 (참여사PM, 프로젝트1)
  → ProjectRolePermission 확인: WBS + VIEW = ALL (커스텀 존재)
  → 기본값 무시, 전체 WBS 반환
```

---

### 3.5 Spring Boot 구현 방향

```java
// WBS 조회 API
public List<WbsNode> getWbsNodes(Long projectId, User user) {
    
    // 1. 권한 조회 (프로젝트 커스텀 → 기본값 순)
    Scope scope = permissionService.getScope(
        projectId, user, Resource.WBS, Action.VIEW
    );
    
    // 2. scope에 따라 쿼리 분기
    return switch (scope) {
        case ALL         -> wbsRepo.findAll(projectId);
        case OWN_COMPANY -> wbsRepo.findByCompany(projectId, user.companyId);
        case OWN_TASK    -> wbsRepo.findByAssignee(projectId, user.id);
        case NONE        -> throw new AccessDeniedException();
    };
}
```

**Permission Enum (Java)**
```java
public enum Resource {
    WBS, REPORT, TIMESHEET, MEMBER, 
    COMPANY, PROJECT, DELIVERABLE,
    ISSUE, RISK, CHANGE, AUDIT, CLOSE
}

public enum Action {
    VIEW, EDIT, CREATE, DELETE,
    INVITE, REMOVE, APPROVE, 
    REQUEST, DOWNLOAD, MANAGE, SETTING
}

public enum Scope {
    ALL, OWN_COMPANY, OWN_TASK, NONE
}
```

---

## 현재까지 확정된 전체 엔티티 목록

```
User                개인 계정 (이메일 기준)
Company             참여 회사
Project             사업
ProjectCompany      프로젝트-회사 관계 (트리구조, Role 포함)
ProjectMember       프로젝트-유저 관계 (소속회사, Role 포함)
Role                권한 프리셋 (주관사PM/참여사PM/실무자/뷰어)
Permission          resource + action 단위 권한
RolePermission      Role → Permission + Scope 매핑 (기본값)
ProjectRolePermission Role → Permission + Scope 매핑 (프로젝트 커스텀)
WbsNode             WBS 노드 (CATEGORY/TASK, 트리구조)
```

---

## 다음 단계

- [ ] Step 3: 전체 테이블 명세 작성 (컬럼, 타입, 제약조건)
- [ ] Step 4: 실제 시나리오로 설계 검증
- [ ] Step 5: API 설계 방향
- [ ] Spring Boot 프로젝트 세팅 시작

---

*이전 문서: 설계문서 v0.1 (Step 1 도메인 정리)*  
*이 문서는 설계 진행에 따라 계속 업데이트됩니다.*
