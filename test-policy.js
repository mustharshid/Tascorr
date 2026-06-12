const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const tasks = await prisma.task.findMany({
    include: {
      assignments: {
        where: { isActive: true },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
      creator: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log(JSON.stringify(tasks, null, 2));
}

run().finally(() => prisma.$disconnect());
