"use strict";
// db.ts - Database service initializer using Prisma client.
// Connects to MySQL/MariaDB database configuration on the Plesk hosting server.
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Instantiate PrismaClient or use cached reference
exports.prisma = globalThis.prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = exports.prisma;
}
exports.default = exports.prisma;
