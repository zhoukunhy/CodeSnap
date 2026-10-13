const { BrowserWindow, app } = require('electron');
const path = require('path');

// 开发环境判断
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false, // 安全规范：禁用 Node 集成
      contextIsolation: true, // 安全规范：启用上下文隔离
      preload: path.join(__dirname, '../../preload/main.preload.js'),
      webSecurity: true
    },
    frame: true,
    titleBarStyle: 'default',
    show: false, // 先隐藏，加载完成后再显示
    icon: path.join(__dirname, '../../../public/icon.png')
  });

  // 窗口准备就绪时显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 加载页面
  if (isDev) {
    // 开发环境：加载 Vite 开发服务器
    mainWindow.loadURL('http://localhost:5173');
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境：加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../../../dist/index.html'));
  }

  // 窗口关闭事件
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

function getMainWindow() {
  return mainWindow;
}

module.exports = {
  createMainWindow,
  getMainWindow
};
