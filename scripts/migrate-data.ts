// scripts/migrate-data.ts - SQLite to MySQL/MariaDB data migration script.

import { PrismaClient as SqliteClient } from '../src/generated/sqlite-client';
import { PrismaClient as MysqlClient } from '@prisma/client';
import * as path from 'path';

async function main() {
  console.log('=== STARTING DATA MIGRATION FROM SQLITE TO MARIADB ===');

  const sqliteDbPath = path.resolve(__dirname, '../prisma/dev.db');
  console.log(`Reading SQLite database from: ${sqliteDbPath}`);

  // Instantiate clients
  const sqlite = new SqliteClient({
    datasources: {
      db: {
        url: `file:${sqliteDbPath}`,
      },
    },
  });

  const mysql = new MysqlClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    // Connect to databases
    await sqlite.$connect();
    await mysql.$connect();
    console.log('Connected to both databases.');

    // Clean up destination tables first to prevent duplicates/errors
    console.log('Cleaning up destination tables in dependency order...');
    await mysql.auditLog.deleteMany({});
    await mysql.notification.deleteMany({});
    await mysql.delegation.deleteMany({});
    await mysql.approvalChainStep.deleteMany({});
    await mysql.crossDeptAuthorization.deleteMany({});
    await mysql.blocker.deleteMany({});
    await mysql.taskComment.deleteMany({});
    await mysql.taskAssignment.deleteMany({});
    await mysql.taskDependency.deleteMany({});
    await mysql.subtask.deleteMany({});
    await mysql.task.deleteMany({});
    await mysql.taskTemplate.deleteMany({});
    await mysql.processPackage.deleteMany({});
    
    // Clear foreign key references on departments and users to break circularity
    await mysql.department.updateMany({ data: { headUserId: null } });
    await mysql.user.updateMany({ data: { departmentId: null, managerId: null } });

    await mysql.user.deleteMany({});
    await mysql.department.deleteMany({});
    await mysql.rank.deleteMany({});
    await mysql.tenant.deleteMany({});
    await mysql.platformConfig.deleteMany({});
    console.log('Destination tables cleaned.');

    // 1. Platform Config
    const platformConfigs = await sqlite.platformConfig.findMany();
    console.log(`Migrating ${platformConfigs.length} PlatformConfigs...`);
    for (const item of platformConfigs) {
      await mysql.platformConfig.create({ data: item as any });
    }

    // 2. Tenants
    const tenants = await sqlite.tenant.findMany();
    console.log(`Migrating ${tenants.length} Tenants...`);
    for (const item of tenants) {
      await mysql.tenant.create({ data: item as any });
    }

    // 3. Ranks
    const ranks = await sqlite.rank.findMany();
    console.log(`Migrating ${ranks.length} Ranks...`);
    for (const item of ranks) {
      await mysql.rank.create({ data: item as any });
    }

    // 4. Departments (Without headUserId)
    const departments = await sqlite.department.findMany();
    console.log(`Migrating ${departments.length} Departments (temporarily without heads)...`);
    for (const item of departments) {
      const { headUserId, ...rest } = item;
      await mysql.department.create({
        data: {
          ...rest,
          headUserId: null,
        } as any,
      });
    }

    // 5. Users (Without departmentId and managerId)
    const users = await sqlite.user.findMany();
    console.log(`Migrating ${users.length} Users (temporarily without department/manager)...`);
    for (const item of users) {
      const { departmentId, managerId, ...rest } = item;
      await mysql.user.create({
        data: {
          ...rest,
          departmentId: null,
          managerId: null,
        } as any,
      });
    }

    // 6. Update Departments with original headUserId
    console.log('Restoring Department Heads...');
    for (const item of departments) {
      if (item.headUserId !== null) {
        await mysql.department.update({
          where: { id: item.id },
          data: { headUserId: item.headUserId },
        });
      }
    }

    // 7. Update Users with original departmentId and managerId
    console.log('Restoring User Department & Manager links...');
    for (const item of users) {
      if (item.departmentId !== null || item.managerId !== null) {
        await mysql.user.update({
          where: { id: item.id },
          data: {
            departmentId: item.departmentId,
            managerId: item.managerId,
          },
        });
      }
    }

    // 8. Process Packages
    const processPackages = await sqlite.processPackage.findMany();
    console.log(`Migrating ${processPackages.length} Process Packages...`);
    for (const item of processPackages) {
      await mysql.processPackage.create({ data: item as any });
    }

    // 9. Task Templates
    const templates = await sqlite.taskTemplate.findMany();
    console.log(`Migrating ${templates.length} Task Templates...`);
    for (const item of templates) {
      await mysql.taskTemplate.create({ data: item as any });
    }

    // 10. Tasks
    const tasks = await sqlite.task.findMany();
    console.log(`Migrating ${tasks.length} Tasks...`);
    for (const item of tasks) {
      await mysql.task.create({ data: item as any });
    }

    // 11. Subtasks
    const subtasks = await sqlite.subtask.findMany();
    console.log(`Migrating ${subtasks.length} Subtasks...`);
    for (const item of subtasks) {
      await mysql.subtask.create({ data: item as any });
    }

    // 12. Task Dependencies
    const dependencies = await sqlite.taskDependency.findMany();
    console.log(`Migrating ${dependencies.length} Task Dependencies...`);
    for (const item of dependencies) {
      await mysql.taskDependency.create({ data: item as any });
    }

    // 13. Task Assignments
    const assignments = await sqlite.taskAssignment.findMany();
    console.log(`Migrating ${assignments.length} Task Assignments...`);
    for (const item of assignments) {
      await mysql.taskAssignment.create({ data: item as any });
    }

    // 14. Task Comments
    const comments = await sqlite.taskComment.findMany();
    console.log(`Migrating ${comments.length} Task Comments...`);
    for (const item of comments) {
      await mysql.taskComment.create({ data: item as any });
    }

    // 15. Blockers
    const blockers = await sqlite.blocker.findMany();
    console.log(`Migrating ${blockers.length} Blockers...`);
    for (const item of blockers) {
      await mysql.blocker.create({ data: item as any });
    }

    // 16. Cross-Department Authorizations
    const auths = await sqlite.crossDeptAuthorization.findMany();
    console.log(`Migrating ${auths.length} Cross-Dept Authorizations...`);
    for (const item of auths) {
      await mysql.crossDeptAuthorization.create({ data: item as any });
    }

    // 17. Approval Chain Steps
    const steps = await sqlite.approvalChainStep.findMany();
    console.log(`Migrating ${steps.length} Approval Chain Steps...`);
    for (const item of steps) {
      await mysql.approvalChainStep.create({ data: item as any });
    }

    // 18. Delegations
    const delegations = await sqlite.delegation.findMany();
    console.log(`Migrating ${delegations.length} Delegations...`);
    for (const item of delegations) {
      await mysql.delegation.create({ data: item as any });
    }

    // 19. Notifications
    const notifications = await sqlite.notification.findMany();
    console.log(`Migrating ${notifications.length} Notifications...`);
    for (const item of notifications) {
      await mysql.notification.create({ data: item as any });
    }

    // 20. Audit Log
    const auditLogs = await sqlite.auditLog.findMany();
    console.log(`Migrating ${auditLogs.length} Audit Logs...`);
    for (const item of auditLogs) {
      await mysql.auditLog.create({ data: item as any });
    }

    console.log('=== DATA MIGRATION COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('Error during data migration:', error);
    process.exit(1);
  } finally {
    await sqlite.$disconnect();
    await mysql.$disconnect();
  }
}

main();
