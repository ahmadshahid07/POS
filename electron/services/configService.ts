import fs from 'fs';
import path from 'path';
import os from 'os';

export interface AppConfig {
  db_path: string | null;
  is_configured: boolean;
  backup_dir?: string | null;
  theme?: string;
}

export class ConfigService {
  private static configDir = path.join(
    process.env.APPDATA || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Preferences') : path.join(os.homedir(), '.config')),
    'SKYTHS'
  );

  private static configFile = path.join(ConfigService.configDir, 'app_config.json');

  static getConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configFile)) {
        const raw = fs.readFileSync(this.configFile, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to read app config:', err);
    }
    return {
      db_path: null,
      is_configured: false,
      backup_dir: null,
      theme: 'dark'
    };
  }

  static saveConfig(config: Partial<AppConfig>): AppConfig {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }
      const current = this.getConfig();
      const updated = { ...current, ...config };
      fs.writeFileSync(this.configFile, JSON.stringify(updated, null, 2), 'utf-8');
      return updated;
    } catch (err) {
      console.error('Failed to save app config:', err);
      throw err;
    }
  }

  static validateDirectory(dirPath: string): { valid: boolean; message: string; fullDbPath?: string } {
    try {
      if (!dirPath || typeof dirPath !== 'string') {
        return { valid: false, message: 'Please select a valid folder path.' };
      }

      // Check if directory exists or can be created
      if (!fs.existsSync(dirPath)) {
        try {
          fs.mkdirSync(dirPath, { recursive: true });
        } catch (mkdirErr: any) {
          return { valid: false, message: `Cannot create folder: ${mkdirErr.message}` };
        }
      }

      // Test write permission
      const testFile = path.join(dirPath, `.skyths_perm_test_${Date.now()}.tmp`);
      fs.writeFileSync(testFile, 'SKYTHS_WRITE_OK');
      fs.unlinkSync(testFile);

      const targetDbPath = path.join(dirPath, 'skyths_inventory.db');
      const exists = fs.existsSync(targetDbPath);

      return {
        valid: true,
        message: exists ? 'Existing SKYTHS database found in this folder.' : 'Folder is accessible and writable.',
        fullDbPath: targetDbPath
      };
    } catch (err: any) {
      return { valid: false, message: `Folder validation error: ${err.message}` };
    }
  }
}
