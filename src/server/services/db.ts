// db.ts - Database service initializer using Prisma client.
// Connects to MySQL/MariaDB database configuration on the Plesk hosting server.

import { PrismaClient } from '@prisma/client';

// Declare global variable for caching PrismaClient in development mode
declare global {
  var prisma: PrismaClient | undefined;
}

// Instantiate PrismaClient or use cached reference
export const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
