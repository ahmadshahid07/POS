import { DBManager } from '../db/connection';
import { AuditLog } from '../../src/types';

export class AuditService {
  static log(params: {
    userId?: number | null;
    username?: string | null;
    action: string;
    entityType: string;
    entityId?: string | number | null;
    details?: any;
  }): void {
    try {
      const db = DBManager.getDb();
      const now = new Date().toISOString();
      const detailsJson = params.details ? JSON.stringify(params.details) : null;

      db.prepare(`
        INSERT INTO audit_logs (user_id, username, action, entity_type, entity_id, details_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        params.userId || null,
        params.username || 'System',
        params.action,
        params.entityType,
        params.entityId ? String(params.entityId) : null,
        detailsJson,
        now
      );
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }

  static getLogs(options?: { limit?: number; offset?: number }): AuditLog[] {
    const db = DBManager.getDb();
    let query = 'SELECT * FROM audit_logs ORDER BY id DESC';
    if (options?.limit) {
      query += ` LIMIT ${options.limit} OFFSET ${options.offset || 0}`;
    }
    return db.prepare(query).all();
  }
}
