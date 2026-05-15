import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const PERMISSIONS = [
  { key: "hermes:chat:write", displayName: "发送对话", category: "chat", description: "发送消息给 Hermes Agent" },
  { key: "hermes:chat:read", displayName: "查看对话历史", category: "chat", description: "查看自己和团队的对话历史" },
  { key: "hermes:tools:list", displayName: "查看工具列表", category: "tools", description: "查看可用的运维工具" },
  { key: "hermes:tools:execute", displayName: "执行工具", category: "tools", description: "在 Agent 对话中执行工具" },
  { key: "hermes:tools:approve", displayName: "审批工具调用", category: "tools", description: "审批高风险工具调用" },
  { key: "ops:diagnosis:execute", displayName: "执行故障定界", category: "ops", description: "启动故障定界流程" },
  { key: "ops:diagnosis:read", displayName: "查看定界报告", category: "ops", description: "查看故障定界结果" },
  { key: "ops:inspection:create", displayName: "创建巡检任务", category: "ops", description: "创建日常巡检任务" },
  { key: "ops:inspection:read", displayName: "查看巡检结果", category: "ops", description: "查看巡检报告" },
  { key: "ops:emergency:start", displayName: "发起应急", category: "ops", description: "启动应急协同流程" },
  { key: "ops:emergency:manage", displayName: "管理应急", category: "ops", description: "管理应急流程（升级/关闭）" },
  { key: "ops:emergency:execute", displayName: "执行应急操作", category: "ops", description: "执行应急操作（重启/切换）" },
  { key: "admin:users:read", displayName: "查看用户", category: "admin", description: "查看用户列表" },
  { key: "admin:users:write", displayName: "管理用户", category: "admin", description: "创建/编辑/删除用户" },
  { key: "admin:teams:read", displayName: "查看团队", category: "admin", description: "查看团队列表" },
  { key: "admin:teams:write", displayName: "管理团队", category: "admin", description: "创建/编辑/删除团队" },
  { key: "admin:roles:read", displayName: "查看角色", category: "admin", description: "查看角色和权限" },
  { key: "admin:roles:write", displayName: "管理角色", category: "admin", description: "创建/编辑/删除角色" },
  { key: "admin:hermes:write", displayName: "管理 Hermes 配置", category: "admin", description: "配置 Hermes 连接" },
  { key: "admin:audit:read", displayName: "查看审计日志", category: "admin", description: "查看操作审计日志" },
];

const ROLES = [
  {
    name: "admin",
    displayName: "平台管理员",
    description: "拥有所有权限",
    isSystem: true,
    permissions: PERMISSIONS.map((p) => p.key),
  },
  {
    name: "ops-lead",
    displayName: "运维负责人",
    description: "管理应急预案，审批高风险操作",
    isSystem: true,
    permissions: [
      "hermes:chat:write", "hermes:chat:read",
      "hermes:tools:list", "hermes:tools:execute", "hermes:tools:approve",
      "ops:diagnosis:execute", "ops:diagnosis:read",
      "ops:inspection:create", "ops:inspection:read",
      "ops:emergency:start", "ops:emergency:manage", "ops:emergency:execute",
      "admin:audit:read",
    ],
  },
  {
    name: "operator",
    displayName: "运维工程师",
    description: "执行诊断和巡检，参与应急",
    isSystem: true,
    permissions: [
      "hermes:chat:write", "hermes:chat:read",
      "hermes:tools:list", "hermes:tools:execute",
      "ops:diagnosis:execute", "ops:diagnosis:read",
      "ops:inspection:create", "ops:inspection:read",
      "ops:emergency:start", "ops:emergency:execute",
    ],
  },
  {
    name: "viewer",
    displayName: "只读观察者",
    description: "查看报告和审计日志，无执行权限",
    isSystem: true,
    permissions: [
      "hermes:chat:read",
      "hermes:tools:list",
      "ops:diagnosis:read",
      "ops:inspection:read",
      "admin:audit:read",
    ],
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Create permissions
  console.log("  Creating permissions...");
  const permissionMap = new Map<string, string>();
  for (const p of PERMISSIONS) {
    const created = await prisma.permission.upsert({
      where: { key: p.key },
      update: {},
      create: p,
    });
    permissionMap.set(p.key, created.id);
  }

  // Create roles with permissions
  console.log("  Creating roles...");
  for (const role of ROLES) {
    const { permissions: permKeys, ...roleData } = role;
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: roleData,
    });

    for (const permKey of permKeys) {
      const permId = permissionMap.get(permKey);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: created.id, permissionId: permId } },
          update: {},
          create: { roleId: created.id, permissionId: permId },
        });
      }
    }
  }

  // Create default environments
  console.log("  Creating environments...");
  const envs = [
    { name: "production", displayName: "生产环境", description: "线上生产系统", sortOrder: 0, isDefault: true },
    { name: "staging", displayName: "预发环境", description: "预发布验证环境", sortOrder: 1 },
    { name: "development", displayName: "开发环境", description: "开发测试环境", sortOrder: 2 },
  ];
  for (const env of envs) {
    await prisma.env.upsert({ where: { name: env.name }, update: {}, create: env });
  }

  // Create admin user
  console.log("  Creating admin user...");
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@hermes.local" },
    update: {},
    create: {
      name: "管理员",
      email: "admin@hermes.local",
      passwordHash: adminHash,
      title: "平台管理员",
      isActive: true,
    },
  });

  // Bind admin role
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  if (adminRole) {
    const existing = await prisma.roleBinding.findFirst({
      where: { userId: admin.id, roleId: adminRole.id, envId: null },
    });
    if (!existing) {
      await prisma.roleBinding.create({
        data: { userId: admin.id, roleId: adminRole.id },
      });
    }
  }

  console.log("✅ Seed completed.");
  console.log("   Admin login: admin@hermes.local / admin123");
  console.log("   Change the password on first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
