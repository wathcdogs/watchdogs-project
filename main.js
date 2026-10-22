// main.js - Electron 主进程
const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    minWidth: 320,
    minHeight: 280,
    frame: false,              // 无边框
    transparent: true,         // 透明窗口
    resizable: true,           // 可自由缩放
    alwaysOnTop: false,
    title: '番茄小说阅读器',
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,       // 启用 webview 标签
      sandbox: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ============ IPC 通信 ============

// 窗口控制
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());
ipcMain.on('window-always-on-top', (_e, flag) => {
  mainWindow?.setAlwaysOnTop(flag);
});
ipcMain.on('window-set-opacity', (_e, opacity) => {
  mainWindow?.setOpacity(Math.max(0.3, Math.min(1, opacity)));
});

// webview 加载拦截
ipcMain.on('open-external', (_e, url) => {
  shell.openExternal(url);
});
