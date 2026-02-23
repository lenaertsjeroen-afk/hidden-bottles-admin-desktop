/**
 * Hidden Bottles Admin - Preload Script
 * Exposes safe APIs to renderer process
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Get URLs
  getApiUrl: () => ipcRenderer.invoke('get-api-url'),
  getWebUrl: () => ipcRenderer.invoke('get-web-url'),
  
  // Storage operations
  storeGet: (key) => ipcRenderer.invoke('store-get', key),
  storeSet: (key, value) => ipcRenderer.invoke('store-set', key, value),
  
  // Auth operations
  loginSuccess: (userData) => ipcRenderer.invoke('login-success', userData),
  logout: () => ipcRenderer.invoke('logout'),
  getUserData: () => ipcRenderer.invoke('get-user-data'),
  
  // App info
  platform: process.platform,
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getRollbackInfo: () => ipcRenderer.invoke('rollback-info'),
  
  // Listen to update status
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, data) => callback(data));
  }
});
