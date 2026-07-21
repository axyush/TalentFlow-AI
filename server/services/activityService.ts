import { db } from '../db/store.js';

export interface ActivityItem {
  id: string;
  type: 'STAGE_CHANGE' | 'NEW_CANDIDATE' | 'NEW_JOB' | 'NEW_APPLICATION' | 'GENERAL';
  title: string;
  description: string;
  user: string;
  timestamp: string;
  entityId?: string;
}

export class ActivityService {
  public static getRecentActivities(limit = 15): ActivityItem[] {
    const logs = db.auditLogs.slice(0, 50);

    const activities: ActivityItem[] = logs.map((log) => {
      let type: ActivityItem['type'] = 'GENERAL';
      if (log.action === 'UPDATE_APPLICATION_STAGE') type = 'STAGE_CHANGE';
      else if (log.action === 'CREATE_CANDIDATE' || log.action === 'UPLOAD_RESUME') type = 'NEW_CANDIDATE';
      else if (log.action === 'CREATE_JOB') type = 'NEW_JOB';
      else if (log.action === 'CREATE_APPLICATION') type = 'NEW_APPLICATION';

      return {
        id: log.id,
        type,
        title: log.action.replace(/_/g, ' '),
        description: log.details,
        user: log.userName,
        timestamp: log.timestamp,
        entityId: log.entityId,
      };
    });

    return activities.slice(0, limit);
  }
}
