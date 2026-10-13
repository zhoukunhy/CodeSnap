const { ipcMain } = require('electron');
const { clipboard } = require('electron');

/**
 * 注册剪贴板相关的 IPC 处理器
 */
function registerClipboardHandlers() {
  // 复制文本到剪贴板
  ipcMain.handle('clipboard:copy', (event, text) => {
    try {
      clipboard.writeText(text);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // 从剪贴板读取文本
  ipcMain.handle('clipboard:read', () => {
    try {
      const text = clipboard.readText();
      return { success: true, text };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // 清空剪贴板
  ipcMain.handle('clipboard:clear', () => {
    try {
      clipboard.clear();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });
}

module.exports = {
  registerClipboardHandlers
};
