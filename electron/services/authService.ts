import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { DBManager } from '../db/connection';
import { User, UserRole } from '../../src/types';

interface LoginAttemptTracker {
  count: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

export class AuthService {
  private static failedAttempts: Map<string, LoginAttemptTracker> = new Map();
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  static resetLoginAttempts(username?: string): void {
    if (username) {
      this.failedAttempts.delete(username.toLowerCase().trim());
    } else {
      this.failedAttempts.clear();
    }
  }

  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateRecoveryCode(): string {
    const part1 = crypto.randomBytes(3).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `SKYTHS-${part1}-${part2}`;
  }

  static async createAdminUser(params: {
    username: string;
    password: string;
    full_name: string;
    email?: string;
    phone?: string;
  }): Promise<{ user: User; recoveryCode: string }> {
    const db = DBManager.getDb();

    if (!params.username || params.username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }
    if (!params.password || params.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(params.username.trim());
    if (existing) {
      throw new Error(`Username '${params.username}' already exists.`);
    }

    const passwordHash = await this.hashPassword(params.password);
    const recoveryCode = this.generateRecoveryCode();
    const recoveryHash = await this.hashPassword(recoveryCode);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role, email, phone, status, recovery_code_hash, created_at, updated_at)
      VALUES (?, ?, ?, 'admin', ?, ?, 'active', ?, ?, ?)
    `);

    const result = stmt.run(
      params.username.trim(),
      passwordHash,
      params.full_name.trim(),
      params.email ? params.email.trim() : null,
      params.phone ? params.phone.trim() : null,
      recoveryHash,
      now,
      now
    );

    const user: User = {
      id: Number(result.lastInsertRowid),
      username: params.username.trim(),
      full_name: params.full_name.trim(),
      role: 'admin',
      email: params.email || null,
      phone: params.phone || null,
      status: 'active',
      created_at: now,
      updated_at: now
    };

    return { user, recoveryCode };
  }

  static async login(username: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
    const db = DBManager.getDb();
    const cleanUsername = username.trim().toLowerCase();
    const now = Date.now();

    // Check brute-force lockout status
    const tracker = this.failedAttempts.get(cleanUsername);
    if (tracker && tracker.lockedUntil && tracker.lockedUntil > now) {
      const remainingMinutes = Math.ceil((tracker.lockedUntil - now) / 60000);
      return {
        success: false,
        message: `Account temporarily locked due to repeated failed attempts. Please try again after ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}.`
      };
    }

    const recordFailure = () => {
      const current = this.failedAttempts.get(cleanUsername) || { count: 0, lockedUntil: null, lastAttempt: now };
      current.count += 1;
      current.lastAttempt = now;
      if (current.count >= this.MAX_FAILED_ATTEMPTS) {
        current.lockedUntil = now + this.LOCKOUT_DURATION_MS;
      }
      this.failedAttempts.set(cleanUsername, current);
    };

    const row = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username.trim());

    if (!row) {
      recordFailure();
      return { success: false, message: 'Invalid username or password.' };
    }

    if (row.status !== 'active') {
      return { success: false, message: `Account is ${row.status}. Please contact an administrator.` };
    }

    const isValid = await this.verifyPassword(password, row.password_hash);
    if (!isValid) {
      recordFailure();
      return { success: false, message: 'Invalid username or password.' };
    }

    // Reset failed attempts on success
    this.failedAttempts.delete(cleanUsername);

    const user: User = {
      id: row.id,
      username: row.username,
      full_name: row.full_name,
      role: row.role as UserRole,
      email: row.email,
      phone: row.phone,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    };

    return { success: true, user };
  }

  static async resetPasswordWithRecoveryCode(username: string, recoveryCode: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const db = DBManager.getDb();
    const row = db.prepare('SELECT id, recovery_code_hash FROM users WHERE username = ? COLLATE NOCASE').get(username.trim());

    if (!row || !row.recovery_code_hash) {
      return { success: false, message: 'User or recovery credentials not found.' };
    }

    const isCodeValid = await this.verifyPassword(recoveryCode.trim(), row.recovery_code_hash);
    if (!isCodeValid) {
      return { success: false, message: 'Invalid recovery code.' };
    }

    const newHash = await this.hashPassword(newPassword);
    const newRecovery = this.generateRecoveryCode();
    const newRecoveryHash = await this.hashPassword(newRecovery);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users 
      SET password_hash = ?, recovery_code_hash = ?, updated_at = ?
      WHERE id = ?
    `).run(newHash, newRecoveryHash, now, row.id);

    return {
      success: true,
      message: `Password reset successfully. Your new recovery code is: ${newRecovery}. Store it securely.`
    };
  }

  static getUsers(): User[] {
    const db = DBManager.getDb();
    const rows = db.prepare('SELECT id, username, full_name, role, email, phone, status, created_at, updated_at FROM users ORDER BY created_at ASC').all();
    return rows.map((r: any) => ({
      id: r.id,
      username: r.username,
      full_name: r.full_name,
      role: r.role as UserRole,
      email: r.email,
      phone: r.phone,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
  }

  static async createUser(params: {
    username: string;
    password: string;
    full_name: string;
    role: UserRole;
    email?: string;
    phone?: string;
  }): Promise<User> {
    const db = DBManager.getDb();

    if (!params.username || params.username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }
    if (!params.password || params.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(params.username.trim());
    if (existing) {
      throw new Error(`Username '${params.username}' already exists.`);
    }

    const passwordHash = await this.hashPassword(params.password);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role, email, phone, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `);

    const result = stmt.run(
      params.username.trim(),
      passwordHash,
      params.full_name.trim(),
      params.role,
      params.email ? params.email.trim() : null,
      params.phone ? params.phone.trim() : null,
      now,
      now
    );

    return {
      id: Number(result.lastInsertRowid),
      username: params.username.trim(),
      full_name: params.full_name.trim(),
      role: params.role,
      email: params.email || null,
      phone: params.phone || null,
      status: 'active',
      created_at: now,
      updated_at: now
    };
  }

  static updateUser(id: number, params: {
    full_name?: string;
    role?: UserRole;
    status?: 'active' | 'inactive' | 'suspended';
    email?: string;
    phone?: string;
  }): void {
    const db = DBManager.getDb();
    const updates: string[] = [];
    const values: any[] = [];

    if (params.full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(params.full_name);
    }
    if (params.role !== undefined) {
      updates.push('role = ?');
      values.push(params.role);
    }
    if (params.status !== undefined) {
      updates.push('status = ?');
      values.push(params.status);
    }
    if (params.email !== undefined) {
      updates.push('email = ?');
      values.push(params.email);
    }
    if (params.phone !== undefined) {
      updates.push('phone = ?');
      values.push(params.phone);
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
  }
}
