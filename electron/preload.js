const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  windowControl: (action) => ipcRenderer.send(`window:${action}`),
  checkVaultExists: () => ipcRenderer.invoke('vault:check-exists'),
  setupVault: (password) => ipcRenderer.invoke('vault:setup', password),
  unlockVault: (password) => ipcRenderer.invoke('vault:unlock', password),
  saveVault: (data) => ipcRenderer.invoke('vault:save', data),
  lockVault: () => ipcRenderer.send('vault:lock')
});
