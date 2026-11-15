const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

app.setAppUserModelId('com.stealthbook.app');

const VAULT_FILE = path.join(app.getPath('userData'), 'stealthbook.vault');
let sessionKey = null;

function encryptVault(data, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return JSON.stringify({ iv: iv.toString('hex'), authTag, data: encrypted });
}

function decryptVault(encryptedString, key) {
  const { iv, authTag, data } = JSON.parse(encryptedString);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

function deriveKey(password, salt) {
  return crypto.scryptSync(password, salt, 32);
}

ipcMain.handle('vault:check-exists', () => fs.existsSync(VAULT_FILE));

ipcMain.handle('vault:setup', (event, password) => {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(password, salt);
  sessionKey = key;
  const initialData = { version: 1, houses: [], settings: { autoLockMinutes: 5 } };
  const encrypted = encryptVault(initialData, key);
  const payload = JSON.stringify({ salt: salt.toString('hex'), vault: encrypted });
  fs.writeFileSync(VAULT_FILE, payload, 'utf8');
  return initialData;
});

ipcMain.handle('vault:unlock', (event, password) => {
  if (!fs.existsSync(VAULT_FILE)) throw new Error('No vault found');
  const fileContent = fs.readFileSync(VAULT_FILE, 'utf8');
  const { salt, vault } = JSON.parse(fileContent);
  const key = deriveKey(password, Buffer.from(salt, 'hex'));
  try {
    const data = decryptVault(vault, key);
    sessionKey = key;
    return data;
  } catch (err) {
    throw new Error('Invalid password');
  }
});

ipcMain.handle('vault:save', (event, data) => {
  if (!sessionKey) throw new Error('Locked');
  if (!fs.existsSync(VAULT_FILE)) throw new Error('No vault found');
  const fileContent = fs.readFileSync(VAULT_FILE, 'utf8');
  const { salt } = JSON.parse(fileContent);
  const encrypted = encryptVault(data, sessionKey);
  const payload = JSON.stringify({ salt, vault: encrypted });
  fs.writeFileSync(VAULT_FILE, payload, 'utf8');
  return true;
});

ipcMain.on('vault:lock', () => { sessionKey = null; });

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    icon: path.join(__dirname, '../build/icon\.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== win.webContents.getURL()) event.preventDefault();
  });

  win.webContents.on('before-input-event', (event, input) => {
    if ((input.control && input.shift && input.key.toLowerCase() === 'i') || input.key === 'F12') {
      event.preventDefault();
    }
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    win.loadURL('http://localhost:5173');
  }

  ipcMain.on('window:minimize', () => win.minimize());
  ipcMain.on('window:maximize', () => {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.on('window:close', () => win.close());
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
