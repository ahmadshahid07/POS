import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { ConfigService } from './services/configService';
import { DBManager } from './db/connection';
import { runMigrations } from './db/migrations';
import { BackupService } from './services/backupService';
import { registerIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 880,
    minWidth: 1100,
    minHeight: 720,
    title: 'SKYTHS — Offline Inventory & Business Management',
    backgroundColor: '#080808',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Remove default menu for clean modern desktop feel
  mainWindow.setMenuBarVisibility(false);

  // Register all secure IPC channels
  registerIpcHandlers(mainWindow);

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in dev mode if wanted:
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Check and load existing database on application launch
function initializeStorage(): void {
  try {
    const config = ConfigService.getConfig();
    if (config.is_configured && config.db_path) {
      if (fs.existsSync(config.db_path)) {
        DBManager.initDatabase(config.db_path);
        runMigrations();
        console.log(`[SKYTHS] Database successfully connected at: ${config.db_path}`);
        
        // Automated Daily Backup Check
        BackupService.autoDailyBackup().catch((e) => console.warn('[SKYTHS] Auto-backup check:', e.message));
      } else {
        console.warn(`[SKYTHS WARNING] Configured database not found at ${config.db_path}. Awaiting user recovery.`);
      }
    }
  } catch (err) {
    console.error('[SKYTHS] Failed to open configured database:', err);
  }
}

app.whenReady().then(() => {
  initializeStorage();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  DBManager.close();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
