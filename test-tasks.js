const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const task = await prisma.task.findFirst({
    orderBy: { id: 'desc' },
    include: { subtasks: true }
  });
  console.log("Latest task:", JSON.stringify(task, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
