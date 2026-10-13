const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const { createMainWindow } = require('./window/createWindow');
const { initDatabase } = require('./db/database');
const { registerIpcHandlers } = require('./ipc');
const { createTray } = require('./tray');

// 开发环境判断
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// 初始化数据库
let db = null;

// 主窗口引用
let mainWindow = null;

async function initializeApp() {
  try {
    // 初始化数据库
    db = initDatabase();
    console.log('数据库初始化成功');

    // 创建主窗口
    mainWindow = createMainWindow();
    
    // 注册 IPC 处理器（需要 mainWindow）
    registerIpcHandlers(db, mainWindow);
    console.log('IPC 处理器注册成功');

    // 创建系统托盘
    createTray(mainWindow);
    console.log('系统托盘创建成功');

    // 注册全局快捷键
    registerGlobalShortcuts();
    console.log('全局快捷键注册成功');
  } catch (error) {
    console.error('应用初始化失败:', error);
    app.quit();
  }
}

/**
 * 注册全局快捷键
 */
function registerGlobalShortcuts() {
  // Ctrl/Cmd + Shift + C 唤起窗口
  const showWindowShortcut = globalShortcut.register(
    process.platform === 'darwin' ? 'Command+Shift+C' : 'Ctrl+Shift+C',
    () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    }
  );

  // Ctrl/Cmd + Shift + N 快速新建片段
  const newSnippetShortcut = globalShortcut.register(
    process.platform === 'darwin' ? 'Command+Shift+N' : 'Ctrl+Shift+N',
    () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('tray:newSnippet');
      }
    }
  );

  if (!showWindowShortcut) {
    console.warn('注册唤起窗口快捷键失败');
  }

  if (!newSnippetShortcut) {
    console.warn('注册新建片段快捷键失败');
  }
}

/**
 * 注销全局快捷键
 */
function unregisterGlobalShortcuts() {
  globalShortcut.unregisterAll();
}

// 应用准备就绪
app.whenReady().then(initializeApp);

// 所有窗口关闭时退出应用 (macOS 除外)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    unregisterGlobalShortcuts();
    app.quit();
  }
});

// macOS 激活应用时重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMainWindow();
    createTray(mainWindow);
    registerGlobalShortcuts();
  }
});

// 应用退出前清理资源
app.on('before-quit', () => {
  unregisterGlobalShortcuts();
  if (db) {
    db.close();
  }
});

// 暴露主窗口引用给其他模块
module.exports = {
  getMainWindow: () => mainWindow
};
