import { PrismaClient, Resource, Action, Scope } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// 1. Role 시드 (4개 기본 프리셋)
// ============================================================
const ROLES = [
  { id: 1, name: '주관사PM', description: '주관사 프로젝트 매니저 — 전체 권한', isSystem: true },
  { id: 2, name: '참여사PM', description: '참여사 프로젝트 매니저 — 자사 범위 관리', isSystem: true },
  { id: 3, name: '실무자', description: '실무 담당자 — 자기 태스크 범위', isSystem: true },
  { id: 4, name: '뷰어', description: '읽기 전용 조회자', isSystem: true },
];

// ============================================================
// 2. Permission 시드 (31개 Resource + Action 조합)
// ============================================================
const PERMISSIONS: { resource: Resource; action: Action }[] = [
  // WBS
  { resource: Resource.WBS, action: Action.VIEW },
  { resource: Resource.WBS, action: Action.EDIT },
  // REPORT
  { resource: Resource.REPORT, action: Action.VIEW },
  { resource: Resource.REPORT, action: Action.CREATE },
  { resource: Resource.REPORT, action: Action.DOWNLOAD },
  // TIMESHEET
  { resource: Resource.TIMESHEET, action: Action.VIEW },
  { resource: Resource.TIMESHEET, action: Action.EDIT },
  { resource: Resource.TIMESHEET, action: Action.DOWNLOAD },
  // MEMBER
  { resource: Resource.MEMBER, action: Action.VIEW },
  { resource: Resource.MEMBER, action: Action.INVITE },
  { resource: Resource.MEMBER, action: Action.REMOVE },
  { resource: Resource.MEMBER, action: Action.MANAGE },
  // COMPANY
  { resource: Resource.COMPANY, action: Action.VIEW },
  { resource: Resource.COMPANY, action: Action.MANAGE },
  // PROJECT
  { resource: Resource.PROJECT, action: Action.VIEW },
  { resource: Resource.PROJECT, action: Action.EDIT },
  { resource: Resource.PROJECT, action: Action.SETTING },
  // DELIVERABLE
  { resource: Resource.DELIVERABLE, action: Action.VIEW },
  { resource: Resource.DELIVERABLE, action: Action.CREATE },
  { resource: Resource.DELIVERABLE, action: Action.APPROVE },
  // ISSUE
  { resource: Resource.ISSUE, action: Action.VIEW },
  { resource: Resource.ISSUE, action: Action.MANAGE },
  // RISK
  { resource: Resource.RISK, action: Action.VIEW },
  { resource: Resource.RISK, action: Action.MANAGE },
  // CHANGE
  { resource: Resource.CHANGE, action: Action.VIEW },
  { resource: Resource.CHANGE, action: Action.REQUEST },
  { resource: Resource.CHANGE, action: Action.APPROVE },
  // AUDIT
  { resource: Resource.AUDIT, action: Action.VIEW },
  { resource: Resource.AUDIT, action: Action.MANAGE },
  // CLOSE
  { resource: Resource.CLOSE, action: Action.VIEW },
  { resource: Resource.CLOSE, action: Action.MANAGE },
];

// ============================================================
// 3. RolePermission 매핑 (역할별 권한 + Scope)
// ============================================================
type RolePermMap = {
  roleName: string;
  permissions: { resource: Resource; action: Action; scope: Scope }[];
};

// 주관사PM: 전체 31개 Permission, 모두 ALL scope
const primeManagerPerms: RolePermMap = {
  roleName: '주관사PM',
  permissions: PERMISSIONS.map((p) => ({ ...p, scope: Scope.ALL })),
};

// 참여사PM: 9개
const partnerManagerPerms: RolePermMap = {
  roleName: '참여사PM',
  permissions: [
    { resource: Resource.WBS, action: Action.VIEW, scope: Scope.OWN_COMPANY },
    { resource: Resource.WBS, action: Action.EDIT, scope: Scope.OWN_COMPANY },
    { resource: Resource.REPORT, action: Action.VIEW, scope: Scope.ALL },
    { resource: Resource.REPORT, action: Action.CREATE, scope: Scope.ALL },
    { resource: Resource.TIMESHEET, action: Action.VIEW, scope: Scope.OWN_COMPANY },
    { resource: Resource.TIMESHEET, action: Action.EDIT, scope: Scope.OWN_COMPANY },
    { resource: Resource.MEMBER, action: Action.VIEW, scope: Scope.ALL },
    { resource: Resource.ISSUE, action: Action.VIEW, scope: Scope.ALL },
    { resource: Resource.ISSUE, action: Action.MANAGE, scope: Scope.ALL },
    { resource: Resource.CHANGE, action: Action.REQUEST, scope: Scope.ALL },
  ],
};

// 실무자: 7개
const workerPerms: RolePermMap = {
  roleName: '실무자',
  permissions: [
    { resource: Resource.WBS, action: Action.VIEW, scope: Scope.OWN_TASK },
    { resource: Resource.WBS, action: Action.EDIT, scope: Scope.OWN_TASK },
    { resource: Resource.REPORT, action: Action.VIEW, scope: Scope.ALL },
    { resource: Resource.TIMESHEET, action: Action.VIEW, scope: Scope.OWN_TASK },
    { resource: Resource.TIMESHEET, action: Action.EDIT, scope: Scope.OWN_TASK },
    { resource: Resource.DELIVERABLE, action: Action.CREATE, scope: Scope.OWN_TASK },
    { resource: Resource.ISSUE, action: Action.VIEW, scope: Scope.ALL },
  ],
};

// 뷰어: 4개
const viewerPerms: RolePermMap = {
  roleName: '뷰어',
  permissions: [
    { resource: Resource.WBS, action: Action.VIEW, scope: Scope.ALL },
    { resource: Resource.REPORT, action: Action.VIEW, scope: Scope.ALL },
    { resource: Resource.REPORT, action: Action.DOWNLOAD, scope: Scope.ALL },
    { resource: Resource.DELIVERABLE, action: Action.VIEW, scope: Scope.ALL },
  ],
};

const ALL_ROLE_PERMS = [primeManagerPerms, partnerManagerPerms, workerPerms, viewerPerms];

// ============================================================
// Main Seed
// ============================================================
async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // 1) Roles
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: role,
    });
  }
  console.log(`✅ Roles: ${ROLES.length}개 생성`);

  // 2) Permissions
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
      update: {},
      create: perm,
    });
  }
  console.log(`✅ Permissions: ${PERMISSIONS.length}개 생성`);

  // 3) RolePermission mappings
  let totalMappings = 0;
  for (const roleMap of ALL_ROLE_PERMS) {
    const role = await prisma.role.findUnique({ where: { name: roleMap.roleName } });
    if (!role) {
      console.error(`❌ Role '${roleMap.roleName}' not found`);
      continue;
    }

    for (const perm of roleMap.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { resource_action: { resource: perm.resource, action: perm.action } },
      });
      if (!permission) {
        console.error(`❌ Permission '${perm.resource}:${perm.action}' not found`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: { scope: perm.scope },
        create: {
          roleId: role.id,
          permissionId: permission.id,
          scope: perm.scope,
        },
      });
      totalMappings++;
    }
    console.log(`  → ${roleMap.roleName}: ${roleMap.permissions.length}개 매핑`);
  }
  console.log(`✅ RolePermission: 총 ${totalMappings}개 매핑 완료`);

  console.log('🎉 Seed 완료!');
}

main()
  .catch((e) => {
    console.error('❌ Seed 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
