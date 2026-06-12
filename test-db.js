const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const task = await prisma.task.findFirst({
    include: { creator: true, comments: { include: { author: true } } }
  });
  console.log("Task Creator:", task.creator);
  console.log("Comments:", task.comments);
  
  const tasks = await prisma.task.findMany({ include: { creator: true } });
  console.log("Task 1 Creator from findMany:", tasks[0].creator);
}
test().finally(() => prisma.$disconnect());
