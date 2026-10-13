const { contextBridge, ipcRenderer } = require('electron');

/**
 * 主窗口预加载脚本
 * 桥接渲染进程与主进程，暴露受限 API
 */

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // ========== 数据库操作 API ==========
  
  // 代码片段相关
  getSnippets: (options) => ipcRenderer.invoke('db:getSnippets', options),
  getSnippetById: (id) => ipcRenderer.invoke('db:getSnippetById', id),
  addSnippet: (snippetData) => ipcRenderer.invoke('db:addSnippet', snippetData),
  updateSnippet: (snippetData) => ipcRenderer.invoke('db:updateSnippet', snippetData),
  deleteSnippet: (id) => ipcRenderer.invoke('db:deleteSnippet', id),
  hardDeleteSnippet: (id) => ipcRenderer.invoke('db:hardDeleteSnippet', id),
  restoreSnippet: (id) => ipcRenderer.invoke('db:restoreSnippet', id),
  toggleCollect: (id) => ipcRenderer.invoke('db:toggleCollect', id),
  updateSnippetTags: (snippetId, tagIds) => ipcRenderer.invoke('db:updateSnippetTags', snippetId, tagIds),
  batchMoveSnippets: (snippetIds, folderId) => ipcRenderer.invoke('db:batchMoveSnippets', snippetIds, folderId),
  batchUpdateSnippetTags: (snippetIds, tagIds) => ipcRenderer.invoke('db:batchUpdateSnippetTags', snippetIds, tagIds),
  batchDeleteSnippets: (snippetIds) => ipcRenderer.invoke('db:batchDeleteSnippets', snippetIds),
  getRecentSnippets: (limit) => ipcRenderer.invoke('db:getRecentSnippets', limit),
  getLanguages: () => ipcRenderer.invoke('db:getLanguages'),
  searchSnippets: (keyword) => ipcRenderer.invoke('db:searchSnippets', keyword),
  
  // 文件夹相关
  getFolders: () => ipcRenderer.invoke('db:getFolders'),
  getFolderById: (id) => ipcRenderer.invoke('db:getFolderById', id),
  addFolder: (folderData) => ipcRenderer.invoke('db:addFolder', folderData),
  updateFolder: (folderData) => ipcRenderer.invoke('db:updateFolder', folderData),
  deleteFolder: (id) => ipcRenderer.invoke('db:deleteFolder', id),
  renameFolder: (id, newName) => ipcRenderer.invoke('db:renameFolder', id, newName),
  updateFolderSort: (folderList) => ipcRenderer.invoke('db:updateFolderSort', folderList),
  
  // 标签相关
  getTags: () => ipcRenderer.invoke('db:getTags'),
  getTagById: (id) => ipcRenderer.invoke('db:getTagById', id),
  addTag: (tagData) => ipcRenderer.invoke('db:addTag', tagData),
  updateTag: (tagData) => ipcRenderer.invoke('db:updateTag', tagData),
  deleteTag: (id) => ipcRenderer.invoke('db:deleteTag', id),
  getTagsBySnippetId: (snippetId) => ipcRenderer.invoke('db:getTagsBySnippetId', snippetId),
  
  // ========== 配置管理 API ==========
  
  getConfig: (key) => ipcRenderer.invoke('config:get', key),
  getAllConfig: () => ipcRenderer.invoke('config:getAll'),
  saveConfig: (key, value) => ipcRenderer.invoke('config:save', key, value),
  saveAllConfig: (configObj) => ipcRenderer.invoke('config:saveAll', configObj),
  
  // ========== 文件操作 API ==========
  
  exportSnippet: (snippet, format) => ipcRenderer.invoke('file:exportSnippet', snippet, format),
  exportAllSnippets: (snippets, format) => ipcRenderer.invoke('file:exportAllSnippets', snippets, format),
  importSnippets: () => ipcRenderer.invoke('file:importSnippets'),
  backupDb: () => ipcRenderer.invoke('file:backupDb'),
  restoreDb: () => ipcRenderer.invoke('file:restoreDb'),
  
  // ========== 剪贴板 API ==========
  
  copyToClipboard: (text) => ipcRenderer.invoke('clipboard:copy', text),
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),
  clearClipboard: () => ipcRenderer.invoke('clipboard:clear'),
  
  // ========== 窗口控制 API ==========
  
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  
  // ========== 系统操作 API ==========
  
  // 数据库信息
  getDatabaseInfo: () => ipcRenderer.invoke('system:getDatabaseInfo'),
  
  // 目录操作
  openDirectory: (path) => ipcRenderer.invoke('system:openDirectory', path),
  selectDirectory: () => ipcRenderer.invoke('system:selectDirectory'),
  
  // 数据库备份恢复
  backupDatabase: () => ipcRenderer.invoke('system:backupDatabase'),
  restoreDatabase: () => ipcRenderer.invoke('system:restoreDatabase'),
  
  // 系统快捷键
  updateSystemShortcuts: (shortcuts) => ipcRenderer.invoke('system:updateSystemShortcuts', shortcuts),
  
  // ========== 事件监听 API ==========
  
  on: (channel, callback) => {
    const validChannels = [
      'snippet:added',
      'snippet:updated',
      'snippet:deleted',
      'folder:added',
      'folder:updated',
      'folder:deleted',
      'tag:added',
      'tag:updated',
      'tag:deleted',
      'config:changed',
      'tray:newSnippet'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },
  
  send: (channel, ...args) => {
    const validChannels = [
      'snippet:added',
      'snippet:updated',
      'snippet:deleted'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  }
});

console.log('预加载脚本已加载');
