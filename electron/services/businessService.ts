import { DBManager } from '../db/connection';
import { BusinessSettings, AppSettings } from '../../src/types';

export class BusinessService {
  static getBusinessSettings(): BusinessSettings {
    const db = DBManager.getDb();
    const rows = db.prepare('SELECT key, value FROM business_settings').all();
    const settings: Record<string, any> = {
      business_name: 'SKYTHS Enterprise',
      owner_name: 'Business Owner',
      address: 'Main Commercial Market, Lahore, Pakistan',
      phone: '+92 300 1234567',
      email: 'contact@skyths.local',
      currency: 'PKR',
      currency_symbol: '₨',
      date_format: 'DD-MM-YYYY',
      tax_rate: 0.0,
      tax_name: 'GST',
      receipt_header: 'SKYTHS INVENTORY & RETAIL',
      receipt_footer: 'Thank you for your business! Please visit again.',
      receipt_size: '80mm',
      low_stock_threshold: 5,
      invoice_prefix: 'INV',
      return_policy: 'Goods once sold can be exchanged within 7 days with original invoice.',
      silent_print_enabled: false,
      selected_printer: '',
      auto_print_on_checkout: false,
      sound_effects_enabled: true,
      low_stock_chime_enabled: true,
      tax_mode: 'single',
      tax_rate_2: 0.0,
      tax_name_2: 'PST / Service Tax',
      fbr_pos_id: '',
      enable_secondary_currency: false,
      secondary_currency_code: 'USD',
      secondary_currency_symbol: '$',
      exchange_rate: 278.50,
      auto_backup_on_drawer_close: true,
    };

    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }

    return settings as BusinessSettings;
  }

  static updateBusinessSettings(settings: Partial<BusinessSettings>): BusinessSettings {
    const db = DBManager.getDb();
    const now = new Date().toISOString();
    const upsert = db.prepare(`
      INSERT INTO business_settings (key, value, updated_at) 
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        upsert.run(key, JSON.stringify(value), now);
      }
    })();

    return this.getBusinessSettings();
  }

  static getAppSettings(): AppSettings {
    const db = DBManager.getDb();
    const rows = db.prepare('SELECT key, value FROM app_settings').all();
    const settings: Record<string, any> = {
      db_path: DBManager.getCurrentPath() || '',
      theme: 'dark',
      reduced_motion: false,
      density: 'comfortable',
      auto_backup_enabled: true,
      auto_backup_interval_hours: 24,
      last_backup_date: null
    };

    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }

    return settings as AppSettings;
  }

  static updateAppSettings(settings: Partial<AppSettings>): AppSettings {
    const db = DBManager.getDb();
    const now = new Date().toISOString();
    const upsert = db.prepare(`
      INSERT INTO app_settings (key, value, updated_at) 
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        upsert.run(key, JSON.stringify(value), now);
      }
    })();

    return this.getAppSettings();
  }

  static getNextSequence(prefix: string): string {
    const db = DBManager.getDb();
    const now = new Date().toISOString();
    let nextNum = 1001;

    const row = db.prepare('SELECT current_number FROM invoice_sequences WHERE prefix = ?').get(prefix);
    if (!row) {
      db.prepare('INSERT INTO invoice_sequences (prefix, current_number, updated_at) VALUES (?, ?, ?)')
        .run(prefix, nextNum, now);
    } else {
      nextNum = row.current_number + 1;
      db.prepare('UPDATE invoice_sequences SET current_number = ?, updated_at = ? WHERE prefix = ?')
        .run(nextNum, now, prefix);
    }

    return `${prefix}-${nextNum}`;
  }
}
