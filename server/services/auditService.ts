import { db } from '../db/store.js';
import { AuditLog, UserRole } from '../../src/types/index.js';

export class AuditService {
  public static log(
    userId: string,
    userName: string,
    userRole: UserRole,
    action: string,
    entity: 'User' | 'Client' | 'Job' | 'Candidate' | 'Application' | 'System',
    entityId?: string,
    details?: string
  ): AuditLog {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      userName,
      userRole,
      action,
      entity,
      entityId,
      details: details || `${action} on ${entity} ${entityId || ''}`,
      timestamp: new Date().toISOString(),
    };

    db.auditLogs = [newLog, ...db.auditLogs];
    return newLog;
  }

  public static getLogs(
    page = 1,
    pageSize = 20,
    filters?: {
      action?: string;
      entity?: string;
      search?: string;
    }
  ) {
    let logs = db.auditLogs;

    if (filters?.action) {
      logs = logs.filter((l) => l.action.toLowerCase() === filters.action!.toLowerCase());
    }

    if (filters?.entity) {
      logs = logs.filter((l) => l.entity.toLowerCase() === filters.entity!.toLowerCase());
    }

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.userName.toLowerCase().includes(s) ||
          l.action.toLowerCase().includes(s) ||
          l.entity.toLowerCase().includes(s) ||
          l.details.toLowerCase().includes(s)
      );
    }

    const total = logs.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = logs.slice(startIndex, startIndex + pageSize);

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }
}
