/**
 * Hidden Bottles Admin - Electron Main Process
 * Desktop application for admin dashboard - ADMIN ONLY, no website
 * Version 2.0.0 - One-Time Activation Code Support
 */
const { app, BrowserWindow, ipcMain, Menu, Tray, shell, nativeImage, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const Store = require('electron-store');

// Initialize persistent storage
const store = new Store({
  name: 'hidden-bottles-admin',
  defaults: {
    windowBounds: { width: 1400, height: 900, x: undefined, y: undefined },
    apiUrl: 'https://spirit-investment.preview.emergentagent.com/api'
  }
});

let mainWindow = null;
let tray = null;
let isQuitting = false;

// API URL - validate and reset if corrupted
let API_URL = store.get('apiUrl');
if (!API_URL || !API_URL.startsWith('http')) {
  API_URL = 'https://spirit-investment.preview.emergentagent.com/api';
  store.set('apiUrl', API_URL);
}
const WEB_URL = API_URL.replace('/api', '');

// Auto-updater configuration
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

async function verifyDeviceToken() {
  const deviceToken = store.get('deviceToken');
  if (!deviceToken) {
    console.log('[Desktop Main] verifyDeviceToken: No token stored');
    return null;
  }
  
  try {
    console.log('[Desktop Main] verifyDeviceToken: Calling API...');
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${API_URL}/auth/desktop/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_token: deviceToken })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('[Desktop Main] verifyDeviceToken: Success, user:', data.user?.email, 'is_admin:', data.user?.is_admin);
      // Store the session data
      store.set('userData', {
        token: data.access_token,
        user: data.user
      });
      return data;
    } else {
      console.log('[Desktop Main] verifyDeviceToken: API returned error', response.status);
      // Token is invalid or revoked
      store.delete('deviceToken');
      store.delete('userData');
      return null;
    }
  } catch (error) {
    console.error('[Desktop Main] verifyDeviceToken: Error:', error.message);
    // Keep the token for offline scenarios, but clear session
    return null;
  }
}

function createWindow() {
  const bounds = store.get('windowBounds');
  
  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
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
    show: false
  });

  // Check authentication on startup
  initializeAuth();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (app.isPackaged) {
      autoUpdater.checkForUpdates();
    }
  });

  // Save window bounds (size + position) on resize and move
  const saveBounds = () => {
    if (!mainWindow.isMinimized() && !mainWindow.isMaximized()) {
      const { width, height, x, y } = mainWindow.getBounds();
      store.set('windowBounds', { width, height, x, y });
    }
  };
  
  mainWindow.on('resize', saveBounds);
  mainWindow.on('move', saveBounds);

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

  // Intercept navigation to ensure we stay on admin dashboard
  // This prevents clicking links that would navigate away from admin
  let initialLoadComplete = false;
  
  mainWindow.webContents.on('did-finish-load', () => {
    const currentUrl = mainWindow.webContents.getURL();
    console.log('[Desktop Main] did-finish-load:', currentUrl);
    if (currentUrl.includes('/admin')) {
      initialLoadComplete = true;
      console.log('[Desktop Main] Initial admin load complete');
    }
  });
  
  mainWindow.webContents.on('will-navigate', (event, url) => {
    console.log('[Desktop Main] will-navigate to:', url, 'initialLoadComplete:', initialLoadComplete);
    
    // Allow initial navigation to admin panel
    if (!initialLoadComplete && url.includes('/admin')) {
      console.log('[Desktop Main] Allowing initial admin navigation');
      return; // Allow the navigation
    }
    
    // Allow navigation to admin panel
    if (url.includes('/admin')) {
      console.log('[Desktop Main] Allowing admin navigation');
      return; // Allow the navigation
    }
    
    // If navigating away from admin panel, redirect back
    if (!url.includes('/admin') && !url.includes('login.html')) {
      console.log('[Desktop Main] Blocking non-admin navigation, redirecting to admin');
      event.preventDefault();
      const userData = store.get('userData');
      if (userData && userData.token) {
        const encodedToken = encodeURIComponent(userData.token);
        const encodedUser = encodeURIComponent(JSON.stringify(userData.user));
        mainWindow.loadURL(`${WEB_URL}/admin?embedded=true&desktop=true&dt=${encodedToken}&du=${encodedUser}`);
      } else {
        mainWindow.loadFile('login.html');
      }
    }
  });

  // Handle keyboard shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Intercept F5 and Ctrl+R for refresh
    if (input.key === 'F5' || (input.control && input.key === 'r')) {
      event.preventDefault();
      const userData = store.get('userData');
      if (userData && userData.token) {
        const encodedToken = encodeURIComponent(userData.token);
        const encodedUser = encodeURIComponent(JSON.stringify(userData.user));
        mainWindow.loadURL(`${WEB_URL}/admin?embedded=true&desktop=true&dt=${encodedToken}&du=${encodedUser}`);
      } else {
        mainWindow.loadFile('login.html');
      }
    }
  });
}

async function initializeAuth() {
  console.log('[Desktop Main] initializeAuth starting...');
  
  // First, check if we have a device token (one-time activation)
  const deviceToken = store.get('deviceToken');
  console.log('[Desktop Main] deviceToken exists:', !!deviceToken);
  
  if (deviceToken) {
    // Try to verify the device token
    console.log('[Desktop Main] Verifying device token...');
    const result = await verifyDeviceToken();
    if (result) {
      console.log('[Desktop Main] Token verified, user:', result.user?.email, 'is_admin:', result.user?.is_admin);
      // Device is verified, load admin panel with proper params
      const encodedToken = encodeURIComponent(result.access_token);
      const encodedUser = encodeURIComponent(JSON.stringify(result.user));
      const adminUrl = `${WEB_URL}/admin?embedded=true&desktop=true&dt=${encodedToken}&du=${encodedUser}`;
      console.log('[Desktop Main] Loading admin URL:', adminUrl.substring(0, 100) + '...');
      mainWindow.loadURL(adminUrl);
      return;
    } else {
      console.log('[Desktop Main] Token verification failed');
    }
  }
  
  // Check for existing session (fallback login method)
  const userData = store.get('userData');
  console.log('[Desktop Main] userData exists:', !!userData, 'has token:', !!userData?.token);
  
  if (userData && userData.token) {
    console.log('[Desktop Main] Using stored session, user:', userData.user?.email);
    const encodedToken = encodeURIComponent(userData.token);
    const encodedUser = encodeURIComponent(JSON.stringify(userData.user));
    const adminUrl = `${WEB_URL}/admin?embedded=true&desktop=true&dt=${encodedToken}&du=${encodedUser}`;
    console.log('[Desktop Main] Loading admin URL:', adminUrl.substring(0, 100) + '...');
    mainWindow.loadURL(adminUrl);
    return;
  }
  
  // No valid auth, show login page
  console.log('[Desktop Main] No valid auth, showing login page');
  mainWindow.loadFile('login.html');
}

function createTray() {
  // Use .ico for Windows, .png for other platforms
  const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  const iconPath = path.join(__dirname, 'assets', iconName);
  
  let trayIcon;
  if (process.platform === 'win32') {
    // Windows: Use ICO file directly for better visibility
    trayIcon = nativeImage.createFromPath(iconPath);
  } else {
    // macOS/Linux: Use PNG and resize
    const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.png'));
    trayIcon = icon.resize({ width: 16, height: 16 });
  }
  
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open Admin Dashboard', 
      click: () => mainWindow.show()
    },
    { type: 'separator' },
    {
      label: 'Check for Updates',
      click: () => autoUpdater.checkForUpdates()
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
  tray.on('click', () => mainWindow.show());
}

// IPC Handlers
ipcMain.handle('get-api-url', () => API_URL);
ipcMain.handle('get-web-url', () => WEB_URL);
ipcMain.handle('store-get', (event, key) => store.get(key));
ipcMain.handle('store-set', (event, key, value) => store.set(key, value));

ipcMain.handle('login-success', (event, userData) => {
  console.log('[Desktop Main] login-success called, user:', userData?.user?.email, 'is_admin:', userData?.user?.is_admin);
  store.set('userData', userData);
  // Load admin panel directly in main window with proper params
  const encodedToken = encodeURIComponent(userData.token);
  const encodedUser = encodeURIComponent(JSON.stringify(userData.user));
  const adminUrl = `${WEB_URL}/admin?embedded=true&desktop=true&dt=${encodedToken}&du=${encodedUser}`;
  console.log('[Desktop Main] Loading admin URL after login:', adminUrl.substring(0, 100) + '...');
  mainWindow.loadURL(adminUrl);
});

// Handle navigation - ensure we stay on admin pages
ipcMain.handle('navigate-admin', () => {
  mainWindow.loadURL(`${WEB_URL}/admin?embedded=true&desktop=true`);
});

// Handle refresh - reload admin dashboard, not website
ipcMain.handle('refresh-admin', () => {
  const userData = store.get('userData');
  if (userData && userData.token) {
    mainWindow.loadURL(`${WEB_URL}/admin?embedded=true&desktop=true`);
  } else {
    mainWindow.loadFile('login.html');
  }
});

ipcMain.handle('logout', () => {
  console.log('[Desktop Main] logout called, clearing all data');
  store.delete('userData');
  store.delete('token');
  store.delete('deviceToken');
  mainWindow.loadFile('login.html');
});

// Clear all stored data and restart
ipcMain.handle('clear-all-data', () => {
  console.log('[Desktop Main] clear-all-data called');
  store.clear();
  // Reset to defaults
  store.set('apiUrl', 'https://spirit-investment.preview.emergentagent.com/api');
  mainWindow.loadFile('login.html');
});

ipcMain.handle('get-user-data', () => store.get('userData'));
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-device-name', () => {
  const os = require('os');
  return os.hostname() || 'Desktop Device';
});

// Network status - for offline indicator
ipcMain.handle('get-online-status', () => {
  return require('dns').promises.lookup('google.com')
    .then(() => true)
    .catch(() => false);
});

// Auto-updater events
autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: `Version ${info.version} is available. Download now?`,
    buttons: ['Download', 'Later']
  }).then(({ response }) => {
    if (response === 0) autoUpdater.downloadUpdate();
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: 'Update downloaded. Restart to install?',
    buttons: ['Restart', 'Later']
  }).then(({ response }) => {
    if (response === 0) {
      isQuitting = true;
      autoUpdater.quitAndInstall();
    }
  });
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  isQuitting = true;
});

// Single instance lock
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
