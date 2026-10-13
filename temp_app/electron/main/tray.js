const { Tray, Menu, BrowserWindow, nativeImage, app } = require('electron');
const path = require('path');

let tray = null;

/**
 * 创建系统托盘
 */
function createTray(mainWindow) {
  // 获取资源路径
  const resourcesPath = app.isPackaged 
    ? path.join(process.resourcesPath, '..')
    : path.join(__dirname, '../..');
  const iconPath = path.join(resourcesPath, 'resources', 'tray-icon.png');
  
  // 创建托盘图标，如果文件不存在则使用默认图标
  let trayIcon;
  try {
    if (require('fs').existsSync(iconPath)) {
      trayIcon = iconPath;
    } else {
      // 使用 Electron 的默认图标
      trayIcon = nativeImage.createEmpty();
    }
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }
  
  // 创建托盘图标
  tray = new Tray(trayIcon);
  
  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: '新建片段',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
        // 发送消息给渲染进程创建新片段
        mainWindow.webContents.send('tray:newSnippet');
      }
    },
    {
      type: 'separator'
    },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  // 设置托盘提示
  tray.setToolTip('CodeSnap - 代码片段管理工具');
  
  // 设置托盘菜单
  tray.setContextMenu(contextMenu);
  
  // 双击托盘显示/隐藏窗口
  tray.on('double-click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  
  return tray;
}

/**
 * 更新托盘菜单
 */
function updateTrayMenu() {
  if (tray) {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示窗口',
        click: () => {
          const mainWindow = BrowserWindow.getAllWindows()[0];
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: '新建片段',
        click: () => {
          const mainWindow = BrowserWindow.getAllWindows()[0];
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('tray:newSnippet');
          }
        }
      },
      {
        type: 'separator'
      },
      {
        label: '退出',
        click: () => {
          app.quit();
        }
      }
    ]);
    tray.setContextMenu(contextMenu);
  }
}

module.exports = {
  createTray,
  updateTrayMenu
};
