/**
 * Hidden Bottles Admin - Preload Script
 * Exposes safe APIs to renderer process
 */
const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

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
  
  // Navigation
  navigateAdmin: () => ipcRenderer.invoke('navigate-admin'),
  refreshAdmin: () => ipcRenderer.invoke('refresh-admin'),
  
  // App info
  platform: process.platform,
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getDeviceName: () => os.hostname() || 'Desktop Device',
  
  // Network status
  getOnlineStatus: () => ipcRenderer.invoke('get-online-status'),
  
  // Listen to online/offline events
  onOnlineStatusChange: (callback) => {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }
});
