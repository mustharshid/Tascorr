//superadmin@tascorr.com	Qwertyuiop!@12	Global Superadmin
//admin@company.com	CompanyAdmin123!	Company Administrator
//head@company.com	CompanyAdmin123!	VP / Department Head
//employee@company.com	CompanyAdmin123!	Employee

// seed.ts - Seed script for populating development database tables.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seed...');

  // 1. Create Platform config
  await prisma.platformConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      systemVersion: '5.0',
      maintenanceMode: false,
    },
  });

  // 2. Create Global Superadmin (tenantId = 0, rank title = Global Superadmin)
  const superadminEmail = 'superadmin@tascorr.com';
  const superadminHash = await bcrypt.hash('Qwertyuiop!@12', 12);

  // We need a Tenant 0 representation for global scope relationships
  const globalTenant = await prisma.tenant.upsert({
    where: { id: 0 },
    update: {},
    create: {
      id: 0,
      name: 'System Global Operations',
      subscriptionTier: 3,
      status: 'active',
    },
  });

  const superadminRank = await prisma.rank.upsert({
    where: { id: 999 },
    update: {},
    create: {
      id: 999,
      tenantId: 0,
      title: 'Global Superadmin',
      level: 0,
    },
  });

  await prisma.user.upsert({
    where: { email: superadminEmail },
    update: { passwordHash: superadminHash, status: 'active' },
    create: {
      tenantId: 0,
      email: superadminEmail,
      passwordHash: superadminHash,
      firstName: 'Global',
      lastName: 'Superadmin',
      rankId: superadminRank.id,
      status: 'active',
    },
  });
  console.log('[Seed] Global Superadmin registered.');

  // 3. Create default Tenant 1 (Startup)
  const defaultTenant = await prisma.tenant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Acme Maldives Corp',
      subscriptionTier: 1,
      status: 'active',
    },
  });

  // Default Ranks for Tenant 1
  const adminRank = await prisma.rank.upsert({
    where: { id: 1 },
    update: { title: 'Administrator', level: 0 },
    create: {
      id: 1,
      tenantId: 1,
      title: 'Administrator',
      level: 0,
    },
  });

  const ceoRank = await prisma.rank.upsert({
    where: { id: 2 },
    update: { title: 'Chief Executive', level: 1 },
    create: {
      id: 2,
      tenantId: 1,
      title: 'Chief Executive',
      level: 1,
    },
  });

  const deputyCeoRank = await prisma.rank.upsert({
    where: { id: 3 },
    update: { title: 'Deputy Chief Executive', level: 2 },
    create: {
      id: 3,
      tenantId: 1,
      title: 'Deputy Chief Executive',
      level: 2,
    },
  });

  const execRank = await prisma.rank.upsert({
    where: { id: 4 },
    update: { title: 'Executive / Director', level: 3 },
    create: {
      id: 4,
      tenantId: 1,
      title: 'Executive / Director',
      level: 3,
    },
  });

  const deptHeadRank = await prisma.rank.upsert({
    where: { id: 5 },
    update: { title: 'Department Head', level: 4 },
    create: {
      id: 5,
      tenantId: 1,
      title: 'Department Head',
      level: 4,
    },
  });

  const managerRank = await prisma.rank.upsert({
    where: { id: 6 },
    update: { title: 'Manager', level: 5 },
    create: {
      id: 6,
      tenantId: 1,
      title: 'Manager',
      level: 5,
    },
  });

  const employeeRank = await prisma.rank.upsert({
    where: { id: 7 },
    update: { title: 'Employee', level: 6 },
    create: {
      id: 7,
      tenantId: 1,
      title: 'Employee',
      level: 6,
    },
  });

  // 4. Create Users (Admin, Head, Employee)
  const companyAdminHash = await bcrypt.hash('CompanyAdmin123!', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: { passwordHash: companyAdminHash, status: 'active' },
    create: {
      tenantId: 1,
      email: 'admin@company.com',
      passwordHash: companyAdminHash,
      firstName: 'Company',
      lastName: 'Admin',
      rankId: adminRank.id,
      status: 'active',
    },
  });

  const deptHeadUser = await prisma.user.upsert({
    where: { email: 'head@company.com' },
    update: { passwordHash: companyAdminHash, status: 'active' },
    create: {
      tenantId: 1,
      email: 'head@company.com',
      passwordHash: companyAdminHash,
      firstName: 'Ahmed',
      lastName: 'Shareef',
      rankId: deptHeadRank.id,
      status: 'active',
    },
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@company.com' },
    update: { passwordHash: companyAdminHash, status: 'active' },
    create: {
      tenantId: 1,
      email: 'employee@company.com',
      passwordHash: companyAdminHash,
      firstName: 'Sara',
      lastName: 'Zahir',
      rankId: employeeRank.id,
      status: 'active',
    },
  });

  // 5. Create Departments
  const financeDept = await prisma.department.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      tenantId: 1,
      name: 'Finance & Accounting',
      headUserId: deptHeadUser.id,
    },
  });

  // Assign deptHead and employee to department
  await prisma.user.update({
    where: { id: deptHeadUser.id },
    data: { departmentId: financeDept.id },
  });

  await prisma.user.update({
    where: { id: employeeUser.id },
    data: { departmentId: financeDept.id, managerId: deptHeadUser.id },
  });

  // 6. Create Tasks
  const task1 = await prisma.task.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      tenantId: 1,
      title: 'Approve Annual Budget Proposals',
      description: 'Review and consolidate target department budgets submitted for next financial year. Ensure calculations are double-checked for margin errors.',
      status: 'Under Review',
      priority: 'Critical',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days out
      createdById: adminUser.id,
      departmentId: financeDept.id,
    },
  });

  await prisma.taskAssignment.create({
    data: {
      tenantId: 1,
      taskId: task1.id,
      userId: employeeUser.id,
      isActive: true,
    },
  });

  await prisma.subtask.createMany({
    data: [
      { tenantId: 1, taskId: task1.id, title: 'Gather financial data spreadsheets', status: 'Completed' },
      { tenantId: 1, taskId: task1.id, title: 'Execute compliance audit review', status: 'Completed' },
      { tenantId: 1, taskId: task1.id, title: 'Draft Executive summary notes', status: 'Pending' },
    ],
  });

  const task2 = await prisma.task.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      tenantId: 1,
      title: 'Vendor Contract Setup',
      description: 'Set up legal compliance parameters and draft formal software service SLA contract.',
      status: 'Blocked',
      priority: 'High',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Overdue by 2 days
      createdById: deptHeadUser.id,
      departmentId: financeDept.id,
    },
  });

  await prisma.taskAssignment.create({
    data: {
      tenantId: 1,
      taskId: task2.id,
      userId: employeeUser.id,
      isActive: true,
    },
  });

  await prisma.blocker.create({
    data: {
      tenantId: 1,
      taskId: task2.id,
      reporterId: employeeUser.id,
      description: 'Awaiting signed compliance check from legal team.',
    },
  });

  console.log('[Seed] Database seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
