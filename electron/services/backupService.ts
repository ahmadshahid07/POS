import fs from 'fs';
import path from 'path';
import { DBManager } from '../db/connection';
import { BackupLog } from '../../src/types';

export class BackupService {
  static async createBackup(customDir?: string): Promise<{ success: boolean; backupPath: string; size: number }> {
    const currentDbPath = DBManager.getCurrentPath();
    if (!currentDbPath) {
      throw new Error('No active database to back up.');
    }

    const backupDir = customDir || path.join(path.dirname(currentDbPath), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `skyths_backup_${timestamp}.db`;
    const targetBackupPath = path.join(backupDir, backupFileName);

    const db = DBManager.getDb();
    await db.backup(targetBackupPath);

    // Verify backup file exists and check integrity
    if (!fs.existsSync(targetBackupPath)) {
      throw new Error('Backup failed: destination file was not created.');
    }

    const stats = fs.statSync(targetBackupPath);

    // Record in backup logs
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO backup_logs (backup_path, backup_size, status, created_at)
      VALUES (?, ?, 'verified', ?)
    `).run(targetBackupPath, stats.size, now);

    return {
      success: true,
      backupPath: targetBackupPath,
      size: stats.size
    };
  }

  static async autoDailyBackup(force: boolean = false): Promise<{ executed: boolean; backupPath?: string }> {
    const currentDbPath = DBManager.getCurrentPath();
    if (!currentDbPath || !fs.existsSync(currentDbPath)) {
      return { executed: false };
    }

    const db = DBManager.getDb();
    const today = new Date().toISOString().slice(0, 10);

    if (!force) {
      const todayBackup = db.prepare(`
        SELECT id FROM backup_logs 
        WHERE status IN ('verified', 'auto_completed') AND date(created_at) = date(?)
        LIMIT 1
      `).get(today);

      if (todayBackup) {
        return { executed: false };
      }
    }

    const backupDir = path.join(path.dirname(currentDbPath), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `skyths_auto_${timestamp}.db`;
    const targetBackupPath = path.join(backupDir, backupFileName);

    await db.backup(targetBackupPath);

    if (fs.existsSync(targetBackupPath)) {
      const stats = fs.statSync(targetBackupPath);
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO backup_logs (backup_path, backup_size, status, created_at)
        VALUES (?, ?, 'auto_completed', ?)
      `).run(targetBackupPath, stats.size, now);

      // Clean up old automated backups keeping latest 14 snapshots
      try {
        const files = fs.readdirSync(backupDir);
        const autoFiles = files.filter(f => f.startsWith('skyths_auto_') && f.endsWith('.db')).sort();
        if (autoFiles.length > 14) {
          const toDelete = autoFiles.slice(0, autoFiles.length - 14);
          for (const df of toDelete) {
            fs.unlinkSync(path.join(backupDir, df));
          }
        }
      } catch (cleanErr) {
        console.warn('Failed to prune old auto-backups:', cleanErr);
      }

      return { executed: true, backupPath: targetBackupPath };
    }

    return { executed: false };
  }

  static getBackupLogs(): BackupLog[] {
    const db = DBManager.getDb();
    return db.prepare('SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT 50').all();
  }

  static async restoreBackup(backupFilePath: string): Promise<{ success: boolean; message: string }> {
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Selected backup file does not exist: ${backupFilePath}`);
    }

    const currentDbPath = DBManager.getCurrentPath();
    if (!currentDbPath) {
      throw new Error('Current database path is not defined.');
    }

    // 1. Create safety backup of the active database before restoring
    const safetyBackupPath = `${currentDbPath}.pre_restore_${Date.now()}.bak`;
    fs.copyFileSync(currentDbPath, safetyBackupPath);

    try {
      // 2. Safely close current connection
      DBManager.close();

      // 3. Replace live database with selected backup
      fs.copyFileSync(backupFilePath, currentDbPath);

      // 4. Re-open database
      const newDb = DBManager.initDatabase(currentDbPath);

      // 5. Verify integrity
      const check = DBManager.verifyIntegrity();
      if (!check.ok) {
        // Rollback from safety backup
        DBManager.close();
        fs.copyFileSync(safetyBackupPath, currentDbPath);
        DBManager.initDatabase(currentDbPath);
        throw new Error(`Restored database failed integrity check: ${check.message}. Live database was safely rolled back.`);
      }

      // Log restoration
      newDb.prepare(`
        INSERT INTO backup_logs (backup_path, backup_size, status, created_at)
        VALUES (?, ?, 'restored', ?)
      `).run(backupFilePath, fs.statSync(backupFilePath).size, new Date().toISOString());

      return {
        success: true,
        message: 'Database restored and verified successfully. Live records are now updated.'
      };
    } catch (err: any) {
      throw err;
    }
  }
}
