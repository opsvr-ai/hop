import { db } from "@/lib/db";

interface AuditEntry {
  userId: string;
  action: string;
  resource?: string;
  detail?: string;
  ip?: string;
  userAgent?: string;
  teamId?: string;
  envId?: string;
  success?: boolean;
  errorMsg?: string;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource ?? null,
        detail: entry.detail ?? null,
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
        teamId: entry.teamId ?? null,
        envId: entry.envId ?? null,
        success: entry.success ?? true,
        errorMsg: entry.errorMsg ?? null,
      },
    });
  } catch {
    // audit logging should never break the main flow
    console.error("[audit] Failed to write audit log");
  }
}
