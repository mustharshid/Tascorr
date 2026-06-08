// audit.ts - Service for writing to the immutable audit log table.
// Enforces append-only entries and transactional audit trace writing (NNR-2, NNR-7).

import { Prisma } from '@prisma/client';
import prismaClient from './db.js';

export class AuditService {
  /**
   * Write an audit log record within a transaction (or using default prisma instance)
   * 
   * @param tenantId The active tenant organization ID
   * @param actorId The user ID who performed the action
   * @param action Action string key (e.g. TASK_CREATE, USER_ONBOARD)
   * @param entityType Entity string key (e.g. Task, User, Blocker)
   * @param entityId Entity ID reference
   * @param metadata Optional JSON metadata object representing parameters changed
   * @param txOptional Optional Prisma Transaction Client reference to wrap operations
   */
  static async logAction(
    tenantId: number,
    actorId: number,
    action: string,
    entityType: string,
    entityId: number,
    metadata?: object | null,
    txOptional?: Prisma.TransactionClient
  ): Promise<void> {
    const client = txOptional || prismaClient;
    const metadataString = metadata ? JSON.stringify(metadata) : null;

    await client.auditLog.create({
      data: {
        tenantId,
        actorId,
        action,
        entityType,
        entityId,
        metadata: metadataString,
      },
    });
  }
}
