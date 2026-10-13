const { ipcMain, dialog } = require('electron');
const fs = require('fs').promises;
const path = require('path');

/**
 * 注册文件操作相关的 IPC 处理器
 * @param {Database} db - SQLite 数据库实例
 */
function registerFileHandlers(db) {
  // 导出单个片段
  ipcMain.handle('file:exportSnippet', async (event, snippet, format = 'json') => {
    const { filePath } = await dialog.showSaveDialog({
      title: '导出代码片段',
      defaultPath: `${snippet.title}.${format}`,
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'Markdown', extensions: ['md'] },
        { name: 'Text', extensions: ['txt'] }
      ]
    });

    if (!filePath) {
      return { success: false, message: '用户取消导出' };
    }

    try {
      let content = '';
      
      switch (format) {
        case 'json':
          content = JSON.stringify(snippet, null, 2);
          break;
        case 'md':
          content = `# ${snippet.title}\n\n${snippet.desc || ''}\n\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``;
          break;
        case 'txt':
          content = `标题: ${snippet.title}\n描述: ${snippet.desc || ''}\n语言: ${snippet.language}\n\n${snippet.code}`;
          break;
        default:
          content = snippet.code;
      }

      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true, filePath };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // 导出所有片段
  ipcMain.handle('file:exportAllSnippets', async (event, snippets, format = 'json') => {
    const ext = format === 'md' ? 'md' : format === 'txt' ? 'txt' : 'json';
    const { filePath } = await dialog.showSaveDialog({
      title: '导出所有代码片段',
      defaultPath: `codesnap-backup.${ext}`,
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'Markdown', extensions: ['md'] },
        { name: 'Text', extensions: ['txt'] }
      ]
    });

    if (!filePath) {
      return { success: false, message: '用户取消导出' };
    }

    try {
      let content = '';
      
      switch (format) {
        case 'json':
          content = JSON.stringify(snippets, null, 2);
          break;
        case 'md':
          content = snippets.map(snippet => 
            `# ${snippet.title}\n\n${snippet.desc || ''}\n\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\`\n\n---\n`
          ).join('\n');
          break;
        case 'txt':
          content = snippets.map(snippet => 
            `========== ${snippet.title} ==========\n描述: ${snippet.desc || ''}\n语言: ${snippet.language}\n\n${snippet.code}\n\n----------------------------------------\n`
          ).join('\n');
          break;
        default:
          content = JSON.stringify(snippets, null, 2);
      }

      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true, filePath };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // 导入片段
  ipcMain.handle('file:importSnippets', async (event) => {
    const { filePaths } = await dialog.showOpenDialog({
      title: '导入代码片段',
      filters: [
        { name: 'JSON', extensions: ['json'] }
      ],
      properties: ['multiSelections']
    });

    if (!filePaths || filePaths.length === 0) {
      return { success: false, message: '用户取消导入' };
    }

    try {
      const importedSnippets = [];
      
      for (const filePath of filePaths) {
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        // 支持单个片段或片段数组
        const snippets = Array.isArray(data) ? data : [data];
        
        for (const snippet of snippets) {
          const result = await insertSnippet(db, snippet);
          importedSnippets.push(result);
        }
      }

      return { success: true, count: importedSnippets.length };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // 数据库备份
  ipcMain.handle('file:backupDb', async (event) => {
    const { filePath } = await dialog.showSaveDialog({
      title: '备份数据库',
      defaultPath: `codesnap-backup-${Date.now()}.db`,
      filters: [
        { name: 'Database', extensions: ['db'] }
      ]
    });

    if (!filePath) {
      return { success: false, message: '用户取消备份' };
    }

    try {
      const dbPath = db.name;
      await fs.copyFile(dbPath, filePath);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });

  // 数据库恢复
  ipcMain.handle('file:restoreDb', async (event) => {
    const { filePaths } = await dialog.showOpenDialog({
      title: '恢复数据库',
      filters: [
        { name: 'Database', extensions: ['db'] }
      ],
      properties: ['openFile']
    });

    if (!filePaths || filePaths.length === 0) {
      return { success: false, message: '用户取消恢复' };
    }

    try {
      const sourcePath = filePaths[0];
      const dbPath = db.name;
      
      // 关闭当前数据库
      db.close();
      
      // 复制备份文件
      await fs.copyFile(sourcePath, dbPath);
      
      return { success: true, message: '数据库恢复成功，请重启应用' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  });
}

// 插入片段到数据库
async function insertSnippet(db, snippet) {
  const { title, desc, code, language, folderId } = snippet;
  
  const stmt = db.prepare(`
    INSERT INTO snippets (title, desc, code, language, folder_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(title, desc, code, language, folderId);
  return { id: result.lastInsertRowid, title };
}

module.exports = {
  registerFileHandlers
};
