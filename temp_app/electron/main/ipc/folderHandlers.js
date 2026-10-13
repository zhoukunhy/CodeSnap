const { ipcMain } = require('electron');

/**
 * 注册文件夹相关的 IPC 处理器
 * @param {Database} db - SQLite 数据库实例
 */
function registerFolderHandlers(db) {
  // 获取所有文件夹
  ipcMain.handle('db:getFolders', () => {
    const sql = `
      SELECT f.*, 
        (SELECT COUNT(*) FROM snippets WHERE folder_id = f.id AND is_deleted = 0) as snippet_count
      FROM folders f
      ORDER BY f.sort ASC, f.create_time ASC
    `;
    const stmt = db.prepare(sql);
    return stmt.all();
  });

  // 根据 ID 获取文件夹
  ipcMain.handle('db:getFolderById', (event, id) => {
    const stmt = db.prepare('SELECT * FROM folders WHERE id = ?');
    return stmt.get(id);
  });

  // 新增文件夹
  ipcMain.handle('db:addFolder', (event, folderData) => {
    const { name, parentId = 0, sort = 0 } = folderData;
    const stmt = db.prepare(`
      INSERT INTO folders (name, parent_id, sort)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(name, parentId, sort);
    return { id: result.lastInsertRowid, success: true };
  });

  // 修改文件夹（支持部分字段更新）
  ipcMain.handle('db:updateFolder', (event, folderData) => {
    const { id, name, parentId, sort } = folderData;
    
    let updateFields = [];
    let params = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      params.push(name);
    }
    if (parentId !== undefined) {
      updateFields.push('parent_id = ?');
      params.push(parentId);
    }
    if (sort !== undefined) {
      updateFields.push('sort = ?');
      params.push(sort);
    }
    
    if (updateFields.length > 0) {
      updateFields.push('update_time = CURRENT_TIMESTAMP');
      params.push(id);
      
      const stmt = db.prepare(`
        UPDATE folders 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `);
      stmt.run(...params);
    }
    
    return { success: true };
  });

  // 删除文件夹（递归删除子文件夹）
  ipcMain.handle('db:deleteFolder', (event, id) => {
    // 获取所有子文件夹（递归）
    const getChildFolders = (parentId) => {
      const stmt = db.prepare('SELECT id FROM folders WHERE parent_id = ?');
      const children = stmt.all(parentId);
      let allIds = [parentId];
      
      children.forEach(child => {
        allIds = allIds.concat(getChildFolders(child.id));
      });
      
      return allIds;
    };
    
    const folderIds = getChildFolders(id);
    
    // 将这些文件夹下的片段的 folder_id 设为 NULL
    db.prepare('UPDATE snippets SET folder_id = NULL WHERE folder_id IN (' + folderIds.join(',') + ')').run();
    
    // 删除所有相关文件夹
    db.prepare('DELETE FROM folders WHERE id IN (' + folderIds.join(',') + ')').run();
    
    return { success: true };
  });

  // 重命名文件夹
  ipcMain.handle('db:renameFolder', (event, id, newName) => {
    const stmt = db.prepare(`
      UPDATE folders SET name = ?, update_time = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(newName, id);
    return { success: true };
  });

  // 更新文件夹排序
  ipcMain.handle('db:updateFolderSort', (event, folderList) => {
    const stmt = db.prepare('UPDATE folders SET sort = ? WHERE id = ?');
    
    folderList.forEach((folder, index) => {
      stmt.run(index, folder.id);
    });
    
    return { success: true };
  });
}

module.exports = {
  registerFolderHandlers
};
