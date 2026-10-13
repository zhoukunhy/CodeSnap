/**
 * 系统操作 IPC 处理器
 * 处理数据库信息、目录操作、备份恢复等系统级操作
 */

const { ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { globalShortcut } = require('electron');
const db = require('../db/database');

let mainWindow = null;

/**
 * 初始化系统操作处理器
 */
const initSystemHandlers = (window) => {
  mainWindow = window;
  
  // 获取数据库信息
  ipcMain.handle('system:getDatabaseInfo', async () => {
    try {
      const dbPath = db.getDatabasePath();
      const backupPath = path.join(os.homedir(), 'CodeSnap', 'backups');
      
      // 获取数据库文件大小
      let size = '0 KB';
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        if (stats.size < 1024) {
          size = `${stats.size} B`;
        } else if (stats.size < 1024 * 1024) {
          size = `${(stats.size / 1024).toFixed(1)} KB`;
        } else {
          size = `${(stats.size / (1024 * 1024)).toFixed(2)} MB`;
        }
      }
      
      return {
        path: dbPath,
        size,
        backupPath
      };
    } catch (error) {
      console.error('获取数据库信息失败:', error);
      return { path: '', size: '0 KB', backupPath: '' };
    }
  });
  
  // 打开目录
  ipcMain.handle('system:openDirectory', async (event, dirPath) => {
    try {
      if (fs.existsSync(dirPath)) {
        await shell.openPath(dirPath);
        return { success: true };
      }
      return { success: false, message: '目录不存在' };
    } catch (error) {
      console.error('打开目录失败:', error);
      return { success: false, message: '打开失败' };
    }
  });
  
  // 选择目录
  ipcMain.handle('system:selectDirectory', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
      });
      
      if (result.filePaths && result.filePaths.length > 0) {
        return result.filePaths[0];
      }
      return null;
    } catch (error) {
      console.error('选择目录失败:', error);
      return null;
    }
  });
  
  // 备份数据库
  ipcMain.handle('system:backupDatabase', async () => {
    try {
      const dbPath = db.getDatabasePath();
      const backupDir = path.join(os.homedir(), 'CodeSnap', 'backups');
      
      // 确保备份目录存在
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // 生成备份文件名（带时间戳）
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `backup_${timestamp}.db`);
      
      // 复制数据库文件
      fs.copyFileSync(dbPath, backupPath);
      
      // 删除多余的备份
      await cleanupOldBackups(backupDir);
      
      return { success: true, path: backupPath };
    } catch (error) {
      console.error('备份数据库失败:', error);
      return { success: false, message: error.message };
    }
  });
  
  // 从备份恢复
  ipcMain.handle('system:restoreDatabase', async () => {
    try {
      const backupDir = path.join(os.homedir(), 'CodeSnap', 'backups');
      
      if (!fs.existsSync(backupDir)) {
        return { success: false, message: '没有找到备份目录' };
      }
      
      // 获取备份文件列表
      const files = fs.readdirSync(backupDir)
        .filter(file => file.endsWith('.db'))
        .sort((a, b) => b.localeCompare(a));
      
      if (files.length === 0) {
        return { success: false, message: '没有找到备份文件' };
      }
      
      // 显示选择对话框
      const result = await dialog.showOpenDialog(mainWindow, {
        title: '选择备份文件',
        defaultPath: backupDir,
        filters: [{ name: '数据库备份', extensions: ['db'] }],
        properties: ['openFile']
      });
      
      if (!result.filePaths || result.filePaths.length === 0) {
        return { success: false, message: '未选择备份文件' };
      }
      
      const backupPath = result.filePaths[0];
      const dbPath = db.getDatabasePath();
      
      // 关闭数据库连接
      db.close();
      
      // 复制备份文件到数据库位置
      fs.copyFileSync(backupPath, dbPath);
      
      // 重新打开数据库连接
      db.init();
      
      return { success: true };
    } catch (error) {
      console.error('恢复数据库失败:', error);
      return { success: false, message: error.message };
    }
  });
  
  // 更新系统快捷键
  ipcMain.handle('system:updateSystemShortcuts', async (event, shortcuts) => {
    try {
      // 注销旧的快捷键
      globalShortcut.unregisterAll();
      
      // 注册新的快捷键
      if (shortcuts.showWindow) {
        const showWindowKey = shortcuts.showWindow.keys.join('+');
        globalShortcut.register(showWindowKey, () => {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
          }
        });
      }
      
      if (shortcuts.quickNew) {
        const quickNewKey = shortcuts.quickNew.keys.join('+');
        globalShortcut.register(quickNewKey, () => {
          mainWindow.show();
          mainWindow.webContents.send('tray:newSnippet');
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('更新系统快捷键失败:', error);
      return { success: false, message: error.message };
    }
  });
};

/**
 * 清理旧备份（保留指定数量的备份）
 */
const cleanupOldBackups = async (backupDir) => {
  try {
    // 获取配置的备份保留数量
    const config = await db.getConfig('backup_count');
    const keepCount = parseInt(config) || 10;
    
    // 获取备份文件列表（按时间倒序）
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.db'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    // 删除超出保留数量的备份
    if (files.length > keepCount) {
      const filesToDelete = files.slice(keepCount);
      filesToDelete.forEach(file => {
        fs.unlinkSync(path.join(backupDir, file.name));
      });
    }
  } catch (error) {
    console.error('清理旧备份失败:', error);
  }
};

module.exports = {
  initSystemHandlers
};
