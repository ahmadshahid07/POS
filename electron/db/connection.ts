import fs from 'fs';
import path from 'path';

export interface DatabaseDriver {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...params: any[]): { changes: number; lastInsertRowid: number | bigint };
    get(...params: any[]): any;
    all(...params: any[]): any[];
  };
  transaction<T>(fn: (...args: any[]) => T): (...args: any[]) => T;
  close(): void;
  backup?(destinationPath: string): Promise<void>;
}

class SQLiteAdapter implements DatabaseDriver {
  private rawDb: any;
  private isNodeSqlite: boolean = false;

  constructor(filePath: string) {
    // Try better-sqlite3 first
    try {
      const BetterSqlite = require('better-sqlite3');
      this.rawDb = new BetterSqlite(filePath, { fileMustExist: false });
      this.isNodeSqlite = false;
    } catch (err: any) {
      // Fallback to official built-in node:sqlite (Node 22.5+)
      try {
        const { DatabaseSync } = require('node:sqlite');
        this.rawDb = new DatabaseSync(filePath);
        this.isNodeSqlite = true;
      } catch (nodeErr) {
        throw new Error(`Failed to load SQLite driver: ${err.message} / ${nodeErr}`);
      }
    }

    // Set high-durability, high-performance offline desktop pragma settings
    this.exec('PRAGMA journal_mode = WAL;');
    this.exec('PRAGMA foreign_keys = ON;');
    this.exec('PRAGMA synchronous = NORMAL;');
  }

  exec(sql: string): void {
    this.rawDb.exec(sql);
  }

  prepare(sql: string) {
    const stmt = this.rawDb.prepare(sql);
    if (!this.isNodeSqlite) {
      return {
        run: (...params: any[]) => stmt.run(...params),
        get: (...params: any[]) => stmt.get(...params),
        all: (...params: any[]) => stmt.all(...params),
      };
    } else {
      // node:sqlite DatabaseSync API mapping
      return {
        run: (...params: any[]) => {
          const res = stmt.run(...params);
          return {
            changes: res.changes,
            lastInsertRowid: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0,
          };
        },
        get: (...params: any[]) => stmt.get(...params) || null,
        all: (...params: any[]) => stmt.all(...params),
      };
    }
  }

  transaction<T>(fn: (...args: any[]) => T): (...args: any[]) => T {
    if (!this.isNodeSqlite && typeof this.rawDb.transaction === 'function') {
      return this.rawDb.transaction(fn);
    }
    // Transaction wrapper for drivers without automatic nested transactions
    return (...args: any[]) => {
      this.exec('BEGIN TRANSACTION;');
      try {
        const result = fn(...args);
        this.exec('COMMIT;');
        return result;
      } catch (error) {
        this.exec('ROLLBACK;');
        throw error;
      }
    };
  }

  close(): void {
    if (this.rawDb && typeof this.rawDb.close === 'function') {
      this.rawDb.close();
    }
  }

  async backup(destPath: string): Promise<void> {
    // If better-sqlite3 backup API is available, use it for consistent online backup
    if (!this.isNodeSqlite && typeof this.rawDb.backup === 'function') {
      await this.rawDb.backup(destPath);
    } else {
      // Standard SQLite VACUUM INTO for consistent online snapshot
      const escapedPath = destPath.replace(/'/g, "''");
      this.exec(`VACUUM INTO '${escapedPath}';`);
    }
  }
}

let activeDb: SQLiteAdapter | null = null;
let currentDbPath: string | null = null;

export const DBManager = {
  getDb(): SQLiteAdapter {
    if (!activeDb) {
      throw new Error('Database is not initialized. Please configure or open a database.');
    }
    return activeDb;
  },

  isInitialized(): boolean {
    return activeDb !== null;
  },

  getCurrentPath(): string | null {
    return currentDbPath;
  },

  initDatabase(filePath: string): SQLiteAdapter {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (activeDb) {
      try {
        activeDb.close();
      } catch (_) {}
      activeDb = null;
    }

    activeDb = new SQLiteAdapter(filePath);
    currentDbPath = filePath;
    return activeDb;
  },

  verifyIntegrity(): { ok: boolean; message: string } {
    if (!activeDb) {
      return { ok: false, message: 'Database is not open' };
    }
    try {
      const result = activeDb.prepare('PRAGMA integrity_check;').all();
      const isOk = result.length > 0 && (result[0].integrity_check === 'ok' || Object.values(result[0])[0] === 'ok');
      return {
        ok: isOk,
        message: isOk ? 'Database integrity verified: OK' : `Integrity check failed: ${JSON.stringify(result)}`,
      };
    } catch (err: any) {
      return { ok: false, message: `Integrity check error: ${err.message}` };
    }
  },

  close(): void {
    if (activeDb) {
      try {
        activeDb.close();
      } catch (_) {}
      activeDb = null;
      currentDbPath = null;
    }
  }
};
