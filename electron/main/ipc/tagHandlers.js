const { ipcMain } = require('electron');

/**
 * 注册标签相关的 IPC 处理器
 * @param {Database} db - SQLite 数据库实例
 */
function registerTagHandlers(db) {
  // 获取所有标签
  ipcMain.handle('db:getTags', () => {
    const sql = `
      SELECT t.*, 
        (SELECT COUNT(*) FROM snippet_tag WHERE tag_id = t.id) as snippet_count
      FROM tags t
      ORDER BY t.create_time DESC
    `;
    const stmt = db.prepare(sql);
    return stmt.all();
  });

  // 根据 ID 获取标签
  ipcMain.handle('db:getTagById', (event, id) => {
    const stmt = db.prepare('SELECT * FROM tags WHERE id = ?');
    return stmt.get(id);
  });

  // 新增标签
  ipcMain.handle('db:addTag', (event, tagData) => {
    const { name, color = '#409EFF' } = tagData;
    
    try {
      const stmt = db.prepare(`
        INSERT INTO tags (name, color)
        VALUES (?, ?)
      `);
      const result = stmt.run(name, color);
      return { id: result.lastInsertRowid, success: true };
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return { success: false, message: '标签名称已存在' };
      }
      throw error;
    }
  });

  // 修改标签
  ipcMain.handle('db:updateTag', (event, tagData) => {
    const { id, name, color } = tagData;
    
    try {
      const stmt = db.prepare(`
        UPDATE tags SET name = ?, color = ? WHERE id = ?
      `);
      stmt.run(name, color, id);
      return { success: true };
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return { success: false, message: '标签名称已存在' };
      }
      throw error;
    }
  });

  // 删除标签
  ipcMain.handle('db:deleteTag', (event, id) => {
    // 删除关联关系
    db.prepare('DELETE FROM snippet_tag WHERE tag_id = ?').run(id);
    
    // 删除标签
    db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    
    return { success: true };
  });

  // 获取片段的标签列表
  ipcMain.handle('db:getTagsBySnippetId', (event, snippetId) => {
    const sql = `
      SELECT t.* 
      FROM tags t
      INNER JOIN snippet_tag st ON t.id = st.tag_id
      WHERE st.snippet_id = ?
    `;
    const stmt = db.prepare(sql);
    return stmt.all(snippetId);
  });
}

module.exports = {
  registerTagHandlers
};
