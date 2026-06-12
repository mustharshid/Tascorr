const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst({ where: { email: 'admin@company.com' } });
  if (!user) return console.log("No users found");
  
  const token = jwt.sign(
    { userId: user.id, email: user.email, tenantId: user.tenantId, rankLevel: user.rankId === 1 ? 0 : 1, departmentId: user.departmentId },
    process.env.JWT_SECRET || 'tascorr-insecure-dev-secret-key-39281',
    { expiresIn: '1h' }
  );

  const res = await fetch('http://127.0.0.1:5005/api/tasks/2', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(JSON.stringify(data.task.comments, null, 2));
}

run().finally(() => prisma.$disconnect());
