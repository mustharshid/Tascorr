// permissions.test.ts - Unit tests for hierarchical and tenant-isolated policy rules.
// Enforces complete isolation (NNR-1) and numeric rank permissions (NNR-5).

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { PolicyService } from '../../src/server/services/policy.js';
import prisma from '../../src/server/services/db.js';

// Directly mock methods on the imported singleton instance to avoid ESM registry resolution issues
prisma.task.findFirst = jest.fn() as any;
prisma.task.findUnique = jest.fn() as any;
prisma.user.findUnique = jest.fn() as any;
prisma.rank.findFirst = jest.fn() as any;
prisma.crossDeptAuthorization.findFirst = jest.fn() as any;

describe('Access Policy Rules Engine (Section 5 / NNR checks)', () => {
  const mockTask = {
    id: 1024,
    tenantId: 1,
    title: 'Review Audit',
    description: 'Consolidated spreadsheet audit check',
    status: 'Pending',
    priority: 'Critical',
    dueDate: new Date(),
    createdById: 50,
    departmentId: 10,
    assignments: [
      { userId: 100, isActive: true },
      { userId: 101, isActive: false } // previous assignee
    ],
    department: { id: 10, headUserId: 5 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('NNR-1: Absolute tenant isolation enforcement', async () => {
    (prisma.task.findFirst as any).mockResolvedValue(mockTask);

    // Request from Tenant 2 accessing Task in Tenant 1 -> Must be blocked
    const userSession = {
      userId: 200,
      tenantId: 2, // Mismatching tenant
      email: 'user@tenant2.com',
      rankLevel: 0, // Admin rank (still blocked across tenants)
      departmentId: null,
    };

    const isAllowed = await PolicyService.canViewTask(userSession, mockTask.id);
    expect(isAllowed).toBe(false);
  });

  test('Company Admin can read all tasks inside their tenant', async () => {
    (prisma.task.findFirst as any).mockResolvedValue(mockTask);

    const userSession = {
      userId: 2,
      tenantId: 1, // Matching tenant
      email: 'admin@tenant1.com',
      rankLevel: 0, // Admin level
      departmentId: null,
    };

    const isAllowed = await PolicyService.canViewTask(userSession, mockTask.id);
    expect(isAllowed).toBe(true);
  });

  test('Task Creator can view the task', async () => {
    (prisma.task.findFirst as any).mockResolvedValue(mockTask);

    const userSession = {
      userId: 50, // Match createdById
      tenantId: 1,
      email: 'creator@tenant1.com',
      rankLevel: 4,
      departmentId: 10,
    };

    const isAllowed = await PolicyService.canViewTask(userSession, mockTask.id);
    expect(isAllowed).toBe(true);
  });

  test('Active assignee can view the task', async () => {
    (prisma.task.findFirst as any).mockResolvedValue(mockTask);

    const userSession = {
      userId: 100, // Match active assignee
      tenantId: 1,
      email: 'assignee@tenant1.com',
      rankLevel: 4,
      departmentId: 10,
    };

    const isAllowed = await PolicyService.canViewTask(userSession, mockTask.id);
    expect(isAllowed).toBe(true);
  });

  test('Deactivated/Previous assignee cannot view the task', async () => {
    (prisma.task.findFirst as any).mockResolvedValue(mockTask);

    const userSession = {
      userId: 101, // Inactive assignee
      tenantId: 1,
      email: 'inactive@tenant1.com',
      rankLevel: 4,
      departmentId: 10,
    };

    const isAllowed = await PolicyService.canViewTask(userSession, mockTask.id);
    expect(isAllowed).toBe(false);
  });

  test('Department Head of the task department can view the task', async () => {
    (prisma.task.findFirst as any).mockResolvedValue(mockTask);

    const userSession = {
      userId: 5, // Matches department headUserId
      tenantId: 1,
      email: 'depthead@tenant1.com',
      rankLevel: 2,
      departmentId: 10,
    };

    const isAllowed = await PolicyService.canViewTask(userSession, mockTask.id);
    expect(isAllowed).toBe(true);
  });

  test('Peers outside the task assignment hierarchy cannot view (Lateral isolation)', async () => {
    (prisma.task.findFirst as any).mockResolvedValue(mockTask);
    (prisma.user.findUnique as any).mockResolvedValue({ managerId: 300 });

    const userSession = {
      userId: 99, // Unrelated peer
      tenantId: 1,
      email: 'peer@tenant1.com',
      rankLevel: 4,
      departmentId: 10,
    };

    const isAllowed = await PolicyService.canViewTask(userSession, mockTask.id);
    expect(isAllowed).toBe(false);
  });
});
