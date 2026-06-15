const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.subtask.createMany({
    data: [
      { tenantId: 2, taskId: 17, title: "Test Subtask 1", status: "Pending" },
      { tenantId: 2, taskId: 17, title: "Test Subtask 2", status: "Pending" }
    ]
  });
  console.log("CreateMany Result:", result);

  const check = await prisma.subtask.findMany({ where: { taskId: 17 } });
  console.log("Check:", check);
}
main().catch(console.error).finally(() => prisma.$disconnect());
