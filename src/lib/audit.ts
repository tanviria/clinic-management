import { prisma } from './prisma';

interface LogAuditParams {
  tenantId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'PAYMENT' | 'DISPENSE';
  module:
    | 'PATIENTS'
    | 'APPOINTMENTS'
    | 'QUEUE'
    | 'CONSULTATIONS'
    | 'PRESCRIPTIONS'
    | 'LAB'
    | 'PHARMACY'
    | 'BILLING'
    | 'EXPENSES'
    | 'STAFF'
    | 'SETTINGS'
    | 'USERS'
    | 'SUPER_ADMIN';
  recordId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function recordAuditLog(params: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId || null,
        userId: params.userId || null,
        userEmail: params.userEmail || null,
        userName: params.userName || null,
        action: params.action,
        module: params.module,
        recordId: params.recordId || null,
        details: params.details || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
