import { prisma } from "./prisma";

export async function recordAudit(options: {
  actorId?: string | null;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  applicationId?: string | null;
  details?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: options.actorId ?? null,
        actorEmail: options.actorEmail,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId ?? null,
        applicationId: options.applicationId ?? null,
        details: options.details ?? null,
      },
    });
  } catch {
    /* audit must never block the user action */
  }
}
