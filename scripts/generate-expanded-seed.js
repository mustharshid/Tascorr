const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const https = require('https');

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { id: 1, name: 'Finance & Accounting' },
  { id: 2, name: 'Human Resources & Administration' },
  { id: 3, name: 'Operations & Logistics' },
  { id: 4, name: 'Technology & Engineering' },
  { id: 5, name: 'Marketing & Sales' },
];

const RANKS = {
  admin: 1,       // level 0
  ceo: 2,         // level 1
  deputy: 3,      // level 2
  director: 4,    // level 3
  head: 5,        // level 4
  manager: 6,     // level 5
  employee: 7,    // level 6
};

// Topologically sorted by manager hierarchy
const STAFF = [
  // CEO
  { email: 'ceo@company.com', firstName: 'Ibrahim', lastName: 'Nasir', rankId: RANKS.ceo, deptId: null, managerEmail: null },
  
  // Deputies
  { email: 'deputy.ops@company.com', firstName: 'Mariyam', lastName: 'Saeed', rankId: RANKS.deputy, deptId: null, managerEmail: 'ceo@company.com' },
  { email: 'deputy.admin@company.com', firstName: 'Ali', lastName: 'Waheed', rankId: RANKS.deputy, deptId: null, managerEmail: 'ceo@company.com' },

  // Directors
  { email: 'dir.tech@company.com', firstName: 'Hassan', lastName: 'Luthfy', rankId: RANKS.director, deptId: 4, managerEmail: 'deputy.ops@company.com' },
  { email: 'dir.ops@company.com', firstName: 'Aminath', lastName: 'Solih', rankId: RANKS.director, deptId: 3, managerEmail: 'deputy.ops@company.com' },
  { email: 'dir.hr@company.com', firstName: 'Aishath', lastName: 'Faiz', rankId: RANKS.director, deptId: 2, managerEmail: 'deputy.admin@company.com' },
  { email: 'dir.mkt@company.com', firstName: 'Mohamed', lastName: 'Latheef', rankId: RANKS.director, deptId: 5, managerEmail: 'deputy.admin@company.com' },

  // Existing admin and head
  { email: 'admin@company.com', firstName: 'Company', lastName: 'Admin', rankId: RANKS.admin, deptId: null, managerEmail: null },
  { email: 'head@company.com', firstName: 'Ahmed', lastName: 'Shareef', rankId: RANKS.head, deptId: 1, managerEmail: 'deputy.admin@company.com' },

  // New Department Heads
  { email: 'head.hr@company.com', firstName: 'Fathimath', lastName: 'Shifa', rankId: RANKS.head, deptId: 2, managerEmail: 'dir.hr@company.com' },
  { email: 'head.ops@company.com', firstName: 'Ahmed', lastName: 'Najeeb', rankId: RANKS.head, deptId: 3, managerEmail: 'dir.ops@company.com' },
  { email: 'head.tech@company.com', firstName: 'Moosa', lastName: 'Manik', rankId: RANKS.head, deptId: 4, managerEmail: 'dir.tech@company.com' },
  { email: 'head.sales@company.com', firstName: 'Hawwa', lastName: 'Riza', rankId: RANKS.head, deptId: 5, managerEmail: 'dir.mkt@company.com' },

  // Managers
  { email: 'mgr.recruitment@company.com', firstName: 'Aminath', lastName: 'Shana', rankId: RANKS.manager, deptId: 2, managerEmail: 'head.hr@company.com' },
  { email: 'mgr.logistics@company.com', firstName: 'Hussain', lastName: 'Sham', rankId: RANKS.manager, deptId: 3, managerEmail: 'head.ops@company.com' },
  { email: 'mgr.dev@company.com', firstName: 'Adam', lastName: 'Shareef', rankId: RANKS.manager, deptId: 4, managerEmail: 'head.tech@company.com' },
  { email: 'mgr.promo@company.com', firstName: 'Khadheeja', lastName: 'Ali', rankId: RANKS.manager, deptId: 5, managerEmail: 'head.sales@company.com' },

  // Employees (Including existing)
  { email: 'employee@company.com', firstName: 'Sara', lastName: 'Zahir', rankId: RANKS.employee, deptId: 1, managerEmail: 'head@company.com' },
  { email: 'dev1@company.com', firstName: 'Zahid', lastName: 'Ibrahim', rankId: RANKS.employee, deptId: 4, managerEmail: 'mgr.dev@company.com' },
  { email: 'dev2@company.com', firstName: 'Fathimath', lastName: 'Zoona', rankId: RANKS.employee, deptId: 4, managerEmail: 'mgr.dev@company.com' },
  { email: 'logistics1@company.com', firstName: 'Ali', lastName: 'Naseer', rankId: RANKS.employee, deptId: 3, managerEmail: 'mgr.logistics@company.com' },
  { email: 'sales1@company.com', firstName: 'Mariyam', lastName: 'Rifa', rankId: RANKS.employee, deptId: 5, managerEmail: 'mgr.promo@company.com' },
  { email: 'hr.assistant@company.com', firstName: 'Ahmed', lastName: 'Yameen', rankId: RANKS.employee, deptId: 2, managerEmail: 'mgr.recruitment@company.com' },
];

const TASK_TEMPLATES = {
  1: [ // Finance
    { title: 'Reconcile Q2 expense ledgers', desc: 'Audit invoices, check against payroll logs, and reconcile margin balances.' },
    { title: 'Review corporate tax projections', desc: 'Synthesize standard tax reports to optimize end-of-year tax declarations.' },
    { title: 'Approve department travel reimbursement invoices', desc: 'Verify receipts for executive travel and approve claims.' },
    { title: 'Compile cashflow sheets', desc: 'Generate daily liquid assets and cashflow tracking projections.' },
    { title: 'Audit vendor service contracts', desc: 'Check that SLAs match active billings and flag discrepancies.' }
  ],
  2: [ // HR
    { title: 'Draft updated onboarding booklet', desc: 'Update policy chapters for newly hired staff members.' },
    { title: 'Schedule interviews for Dev position', desc: 'Coordinate interview schedules for technical developer candidates.' },
    { title: 'Approve annual leave applications', desc: 'Reconcile calendar schedule coverage and authorize leave requests.' },
    { title: 'Organize quarterly wellness presentation', desc: 'Schedule a mental health and physical wellness workshop for staff.' },
    { title: 'Prepare performance review cards', desc: 'Draft appraisal scoring cards for standard end-of-year evaluations.' }
  ],
  3: [ // Ops
    { title: 'Coordinate regional logistics transport', desc: 'Schedule shipping vessels to deliver equipment to regional centers.' },
    { title: 'Conduct inventory audit at warehouse', desc: 'Manually crosscheck stock levels against automated logs.' },
    { title: 'Draft emergency shipping routing backup', desc: 'Outline alternative logistics pathways in case of inclement weather.' },
    { title: 'Renew vessel operating permits', desc: 'Submit compliance documentation to keep logistics permits active.' },
    { title: 'Inspect facility operations safety guidelines', desc: 'Verify that employees conform to standard OHS procedures.' }
  ],
  4: [ // Tech
    { title: 'Optimize database indexes', desc: 'Analyze slow query logs and write schema indexes for performance.' },
    { title: 'Refactor user session authentication', desc: 'Upgrade JWT payload tokens and optimize session timeout checks.' },
    { title: 'Implement daily automated backups', desc: 'Write a backup cron job to securely archive DB to cold storage.' },
    { title: 'Perform server software patch upgrade', desc: 'Run OS level compliance and security upgrades on server clusters.' },
    { title: 'Write unit tests for task validation', desc: 'Draft test assertions to verify task assignment business rules.' }
  ],
  5: [ // Marketing
    { title: 'Plan launch campaign for V5', desc: 'Draft press release and build social media assets for product launch.' },
    { title: 'Analyze user acquisition metrics', desc: 'Verify target ROI metrics from recent ad campaigns.' },
    { title: 'Design updated presentation brochures', desc: 'Coordinate with designers to refresh marketing print media.' },
    { title: 'Optimize Google Search ad keywords', desc: 'Review search keyword bids to lower acquisition cost.' },
    { title: 'Execute customer feedback survey analysis', desc: 'Summarize user satisfaction metrics from recent polls.' }
  ]
};

async function downloadAvatar(userId, index) {
  const url = `https://i.pravatar.cc/200?img=${index}`;
  const filepath = path.join(__dirname, '..', 'public', 'avatars', `user-${userId}.jpg`);
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download avatar. Code: ${res.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function escapeSql(str) {
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
    switch (char) {
      case "\0": return "\\0";
      case "\x08": return "\\b";
      case "\x09": return "\\t";
      case "\x1a": return "\\z";
      case "\n": return "\\n";
      case "\r": return "\\r";
      case "\"":
      case "'":
      case "\\":
      case "%":
        return "\\"+char; 
      default: return char;
    }
  });
}

async function main() {
  console.log('Generating expanded seed...');

  // 1. Purge all existing data for Tenant 1
  console.log('Cleaning up local database...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
  await prisma.$executeRawUnsafe('DELETE FROM `blockers` WHERE `tenant_id` = 1;');
  await prisma.$executeRawUnsafe('DELETE FROM `subtasks` WHERE `tenant_id` = 1;');
  await prisma.$executeRawUnsafe('DELETE FROM `task_assignments` WHERE `tenant_id` = 1;');
  await prisma.$executeRawUnsafe('DELETE FROM `task_comments` WHERE `tenant_id` = 1;');
  await prisma.$executeRawUnsafe('DELETE FROM `task_dependencies` WHERE `task_id` IN (SELECT `id` FROM `tasks` WHERE `tenant_id` = 1);');
  await prisma.$executeRawUnsafe('DELETE FROM `tasks` WHERE `tenant_id` = 1;');
  await prisma.$executeRawUnsafe('DELETE FROM `users` WHERE `tenant_id` = 1;');
  await prisma.$executeRawUnsafe('DELETE FROM `departments` WHERE `tenant_id` = 1;');

  // Start SQL Output
  const sqlCommands = [];
  sqlCommands.push('SET FOREIGN_KEY_CHECKS = 0;');
  sqlCommands.push('SET @@session.sql_mode = CONCAT(@@session.sql_mode, \',NO_AUTO_VALUE_ON_ZERO\');');
  sqlCommands.push('DELETE FROM `blockers` WHERE `tenant_id` = 1;');
  sqlCommands.push('DELETE FROM `subtasks` WHERE `tenant_id` = 1;');
  sqlCommands.push('DELETE FROM `task_assignments` WHERE `tenant_id` = 1;');
  sqlCommands.push('DELETE FROM `task_comments` WHERE `tenant_id` = 1;');
  sqlCommands.push('DELETE FROM `task_dependencies` WHERE `task_id` IN (SELECT `id` FROM `tasks` WHERE `tenant_id` = 1);');
  sqlCommands.push('DELETE FROM `tasks` WHERE `tenant_id` = 1;');
  sqlCommands.push('DELETE FROM `users` WHERE `tenant_id` = 1;');
  sqlCommands.push('DELETE FROM `departments` WHERE `tenant_id` = 1;');

  // 2. Insert Departments
  console.log('Inserting departments...');
  const deptMap = {}; // Maps original array ID to DB generated ID
  for (const dept of DEPARTMENTS) {
    const created = await prisma.department.create({
      data: {
        tenantId: 1,
        name: dept.name,
      }
    });
    deptMap[dept.id] = created.id;
    sqlCommands.push(`INSERT INTO \`departments\` (\`id\`, \`tenant_id\`, \`name\`, \`created_at\`, \`updated_at\`) VALUES (${created.id}, 1, '${escapeSql(dept.name)}', NOW(), NOW());`);
  }

  // 3. Insert Users
  console.log('Inserting users...');
  // Password hash for 'StaffPassword123!'
  const passwordHash = '$2a$12$RyA/Of0h0Dih6BWfkzvywOHTIVjGf9BTP5TGrNcCK2l7TSVrx1owq';

  const userMap = {}; // Maps email to DB created user object
  for (const u of STAFF) {
    const manager = u.managerEmail ? userMap[u.managerEmail] : null;
    const managerId = manager ? manager.id : null;
    const deptId = u.deptId ? deptMap[u.deptId] : null;

    const created = await prisma.user.create({
      data: {
        tenantId: 1,
        email: u.email,
        passwordHash: passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        rankId: u.rankId,
        departmentId: deptId,
        managerId: managerId,
      }
    });
    userMap[u.email] = created;

    const managerIdSql = managerId ? managerId : 'NULL';
    const deptIdSql = deptId ? deptId : 'NULL';
    sqlCommands.push(`INSERT INTO \`users\` (\`id\`, \`tenant_id\`, \`email\`, \`password_hash\`, \`first_name\`, \`last_name\`, \`rank_id\`, \`department_id\`, \`manager_id\`, \`status\`, \`created_at\`, \`updated_at\`) VALUES (${created.id}, 1, '${escapeSql(u.email)}', '${passwordHash}', '${escapeSql(u.firstName)}', '${escapeSql(u.lastName)}', ${u.rankId}, ${deptIdSql}, ${managerIdSql}, 'active', NOW(), NOW());`);
  }

  // Restore Department Heads
  console.log('Updating department heads...');
  const deptHeads = {
    1: 'head@company.com',
    2: 'head.hr@company.com',
    3: 'head.ops@company.com',
    4: 'head.tech@company.com',
    5: 'head.sales@company.com',
  };

  for (const [deptIdKey, headEmail] of Object.entries(deptHeads)) {
    const deptId = deptMap[parseInt(deptIdKey)];
    const headUser = userMap[headEmail];
    
    await prisma.department.update({
      where: { id: deptId },
      data: { headUserId: headUser.id }
    });
    sqlCommands.push(`UPDATE \`departments\` SET \`head_user_id\` = ${headUser.id} WHERE \`id\` = ${deptId};`);
  }

  // 4. Generate 50 Tasks for each user
  console.log('Generating 50 tasks for each user...');
  const statuses = ['Pending', 'In Progress', 'Blocked', 'Under Review', 'Completed'];
  const priorities = ['Critical', 'High', 'Medium', 'Low'];

  for (const u of STAFF) {
    const createdUser = userMap[u.email];
    const deptId = createdUser.departmentId || deptMap[1]; // Default to Finance
    const templates = TASK_TEMPLATES[u.deptId || 1];

    const manager = u.managerEmail ? userMap[u.managerEmail] : null;
    const assignerId = manager ? manager.id : (createdUser.email === 'ceo@company.com' ? userMap['admin@company.com'].id : createdUser.id);

    for (let i = 1; i <= 50; i++) {
      const template = templates[(i - 1) % templates.length];
      const title = `${template.title} (Batch #${i})`;
      const desc = `${template.desc} Task index reference ${i} for staff tracking.`;
      
      const status = statuses[i % statuses.length];
      const priority = priorities[i % priorities.length];
      
      // Due dates: -15 days to +45 days
      const daysOffset = (i % 2 === 0 ? -1 : 1) * (i % 30);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysOffset + 10);

      // Create Task using Prisma
      const task = await prisma.task.create({
        data: {
          tenantId: 1,
          title: title,
          description: desc,
          status: status,
          priority: priority,
          dueDate: dueDate,
          createdById: assignerId,
          departmentId: deptId,
        }
      });

      const dueDateSql = dueDate.toISOString().slice(0, 19).replace('T', ' ');
      sqlCommands.push(`INSERT INTO \`tasks\` (\`id\`, \`tenant_id\`, \`title\`, \`description\`, \`status\`, \`priority\`, \`due_date\`, \`created_by_id\`, \`department_id\`, \`created_at\`, \`updated_at\`, \`is_recurring\`, \`recurrence_interval\`) VALUES (${task.id}, 1, '${escapeSql(title)}', '${escapeSql(desc)}', '${status}', '${priority}', '${dueDateSql}', ${assignerId}, ${deptId}, NOW(), NOW(), 0, NULL);`);

      // Create Assignment
      await prisma.taskAssignment.create({
        data: {
          tenantId: 1,
          taskId: task.id,
          userId: createdUser.id,
          isActive: true
        }
      });
      sqlCommands.push(`INSERT INTO \`task_assignments\` (\`tenant_id\`, \`task_id\`, \`user_id\`, \`assigned_at\`, \`is_active\`) VALUES (1, ${task.id}, ${createdUser.id}, NOW(), 1);`);

      // Add subtasks for some tasks (every 3rd task)
      if (i % 3 === 0) {
        for (let j = 1; j <= 3; j++) {
          const subTitle = `Subtask #${j} for Task #${task.id}`;
          const subStatus = j % 2 === 0 ? 'Completed' : 'Pending';
          
          const subtask = await prisma.subtask.create({
            data: {
              tenantId: 1,
              taskId: task.id,
              title: subTitle,
              status: subStatus
            }
          });
          sqlCommands.push(`INSERT INTO \`subtasks\` (\`id\`, \`tenant_id\`, \`task_id\`, \`title\`, \`status\`, \`created_at\`, \`updated_at\`) VALUES (${subtask.id}, 1, ${task.id}, '${escapeSql(subTitle)}', '${subStatus}', NOW(), NOW());`);
        }
      }

      // Add blocker if status is Blocked
      if (status === 'Blocked') {
        const blockerDesc = `Awaiting resource allocation approval from department lead.`;
        await prisma.blocker.create({
          data: {
            tenantId: 1,
            taskId: task.id,
            reporterId: createdUser.id,
            description: blockerDesc
          }
        });
        sqlCommands.push(`INSERT INTO \`blockers\` (\`tenant_id\`, \`task_id\`, \`reporter_id\`, \`description\`, \`created_at\`) VALUES (1, ${task.id}, ${createdUser.id}, '${escapeSql(blockerDesc)}', NOW());`);
      }
    }
  }

  sqlCommands.push('SET FOREIGN_KEY_CHECKS = 1;');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

  // Save SQL Command file
  const sqlFilepath = path.join(__dirname, '..', 'prisma', 'expanded_seed.sql');
  fs.writeFileSync(sqlFilepath, sqlCommands.join('\n') + '\n');
  console.log(`Successfully generated SQL insert file: ${sqlFilepath}`);

  // 5. Download avatars
  console.log('Downloading user avatars...');
  for (let i = 0; i < STAFF.length; i++) {
    const user = STAFF[i];
    const createdUser = userMap[user.email];
    
    // Ignore existing accounts if they already have avatars, or download anyway
    // Pravatar images indices 1 to 70
    const avatarIndex = (i % 70) + 1;
    try {
      await downloadAvatar(createdUser.id, avatarIndex);
      console.log(`Downloaded avatar for user-${createdUser.id} (${user.email})`);
    } catch (err) {
      console.error(`Failed to download avatar for user-${createdUser.id}:`, err.message);
    }
  }

  console.log('--- SEED SCRIPT RUN COMPLETED SUCCESSFULLY ---');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
