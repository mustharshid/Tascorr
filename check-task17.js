const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const task = await prisma.task.findUnique({
    where: { id: 17 },
    include: { subtasks: true }
  });
  console.log(JSON.stringify(task, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
