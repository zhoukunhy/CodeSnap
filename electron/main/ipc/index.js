const { ipcMain } = require('electron');
const { registerSnippetHandlers } = require('./snippetHandlers');
const { registerFolderHandlers } = require('./folderHandlers');
const { registerTagHandlers } = require('./tagHandlers');
const { registerConfigHandlers } = require('./configHandlers');
const { registerFileHandlers } = require('./fileHandlers');
const { registerClipboardHandlers } = require('./clipboardHandlers');
const { initSystemHandlers } = require('./systemHandlers');

/**
 * 注册所有 IPC 处理器
 * @param {Database} db - SQLite 数据库实例
 * @param {BrowserWindow} mainWindow - 主窗口实例
 */
function registerIpcHandlers(db, mainWindow) {
  // 注册代码片段相关处理器
  registerSnippetHandlers(db);
  
  // 注册文件夹相关处理器
  registerFolderHandlers(db);
  
  // 注册标签相关处理器
  registerTagHandlers(db);
  
  // 注册配置相关处理器
  registerConfigHandlers(db);
  
  // 注册文件操作相关处理器
  registerFileHandlers(db);
  
  // 注册剪贴板相关处理器
  registerClipboardHandlers();
  
  // 注册系统操作处理器
  initSystemHandlers(mainWindow);
  
  console.log('所有 IPC 处理器注册完成');
}

module.exports = {
  registerIpcHandlers
};
