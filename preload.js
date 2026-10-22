// preload.js - 预加载脚本
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // 窗口控制
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  setAlwaysOnTop: (flag) => ipcRenderer.send('window-always-on-top', flag),
  setOpacity: (opacity) => ipcRenderer.send('window-set-opacity', opacity),
  openExternal: (url) => ipcRenderer.send('open-external', url),
});
