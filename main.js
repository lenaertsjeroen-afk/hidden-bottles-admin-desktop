/**
 * Hidden Bottles Admin - Electron Main Process
 * Desktop application for admin dashboard with auto-update support
 */
const { app, BrowserWindow, ipcMain, Menu, Tray, shell, nativeImage, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const Store = require('electron-store');

// Initialize persistent storage
const store = new Store({
  name: 'hidden-bottles-admin',
  defaults: {
    windowBounds: { width: 1400, height: 900 },
    apiUrl: 'https://spirits-marketplace-2.preview.emergentagent.com/api'
  }
});

let mainWindow = null;
let splashWindow = null;
let tray = null;
let isQuitting = false;

// API URL - can be changed for different environments
const API_URL = store.get('apiUrl');
const WEB_URL = API_URL.replace('/api', '');

// Auto-updater configuration
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#FAFAFA',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile('splash.html');
}

function createWindow() {
  const { width, height } = store.get('windowBounds');
  
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 1024,
    minHeight: 700,
    title: 'Hidden Bottles Admin',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    backgroundColor: '#FAFAFA',
    titleBarStyle: 'default',
    show: false
  });

  // Load the login page
  mainWindow.loadFile('login.html');

  // Show window when ready and close splash
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    
    // Check for updates after window is shown
    if (app.isPackaged) {
      autoUpdater.checkForUpdates();
    }
  });

  // Save window size on resize
  mainWindow.on('resize', () => {
    const { width, height } = mainWindow.getBounds();
    store.set('windowBounds', { width, height });
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open Admin Dashboard', 
      click: () => {
        mainWindow.show();
      }
    },
    { type: 'separator' },
    {
      label: 'Check for Updates',
      click: () => {
        autoUpdater.checkForUpdates();
      }
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Hidden Bottles Admin');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.show();
  });
}

// IPC Handlers for communication with renderer
ipcMain.handle('get-api-url', () => {
  return API_URL;
});

ipcMain.handle('get-web-url', () => {
  return WEB_URL;
});

ipcMain.handle('store-get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('store-set', (event, key, value) => {
  store.set(key, value);
});

ipcMain.handle('login-success', (event, userData) => {
  store.set('userData', userData);
  mainWindow.loadFile('admin.html');
});

ipcMain.handle('logout', () => {
  store.delete('userData');
  store.delete('token');
  mainWindow.loadFile('login.html');
});

ipcMain.handle('get-user-data', () => {
  return store.get('userData');
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'checking' });
  }
});

autoUpdater.on('update-available', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'available', info });
  }
  
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: `A new version (${info.version}) is available. Would you like to download it now?`,
    buttons: ['Download', 'Later'],
    defaultId: 0
  }).then(({ response }) => {
    if (response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-not-available', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'not-available' });
  }
});

autoUpdater.on('download-progress', (progress) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'downloading', 
      progress: progress.percent 
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'downloaded', info });
  }
  
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: 'Update downloaded. The application will restart to apply the update.',
    buttons: ['Restart Now', 'Later'],
    defaultId: 0
  }).then(({ response }) => {
    if (response === 0) {
      isQuitting = true;
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (error) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'error', error: error.message });
  }
});

// IPC handlers for manual update control
ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('install-update', () => {
  isQuitting = true;
  autoUpdater.quitAndInstall();
});

// Rollback to previous version (manual - requires user to have old installer)
ipcMain.handle('rollback-info', () => {
  return {
    message: 'To rollback to a previous version, please download and install the desired version from the releases page.',
    releasesUrl: 'https://github.com/hidden-bottles/admin-desktop/releases'
  };
});

// App lifecycle
app.whenReady().then(() => {
  createSplashWindow();
  
  setTimeout(() => {
    createWindow();
    createTray();
  }, 1500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
