const { ipcMain } = require('electron');

/**
 * 注册代码片段相关的 IPC 处理器
 * @param {Database} db - SQLite 数据库实例
 */
function registerSnippetHandlers(db) {
  // 查询片段列表（带筛选、分页）
  ipcMain.handle('db:getSnippets', (event, options = {}) => {
    const {
      keyword = '',
      language = '',
      folderId = null,
      tagId = null,
      isCollect = null,
      isDeleted = 0,
      page = 1,
      pageSize = 20,
      orderBy = 'update_time',
      orderType = 'DESC'
    } = options;

    // 先查询片段基本信息
    let sql = `
      SELECT s.*
      FROM snippets s
      WHERE s.is_deleted = ?
    `;
    
    const params = [isDeleted];

    // 关键词搜索
    if (keyword) {
      sql += ` AND (s.title LIKE ? OR s.desc LIKE ? OR s.code LIKE ?)`;
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword);
    }

    // 语言筛选
    if (language) {
      sql += ` AND s.language = ?`;
      params.push(language);
    }

    // 文件夹筛选
    if (folderId !== null) {
      sql += ` AND s.folder_id = ?`;
      params.push(folderId);
    }

    // 标签筛选
    if (tagId !== null) {
      sql += ` AND EXISTS (SELECT 1 FROM snippet_tag st WHERE st.snippet_id = s.id AND st.tag_id = ?)`;
      params.push(tagId);
    }

    // 收藏筛选
    if (isCollect !== null) {
      sql += ` AND s.is_collect = ?`;
      params.push(isCollect ? 1 : 0);
    }

    sql += ` ORDER BY s.${orderBy} ${orderType}`;

    // 分页
    const offset = (page - 1) * pageSize;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    const stmt = db.prepare(sql);
    let snippets = stmt.all(...params);

    // 查询每个片段的标签
    const getTagsStmt = db.prepare(`
      SELECT t.id, t.name, t.color 
      FROM tags t 
      JOIN snippet_tag st ON t.id = st.tag_id 
      WHERE st.snippet_id = ?
    `);

    snippets = snippets.map(snippet => {
      const tags = getTagsStmt.all(snippet.id);
      return {
        ...snippet,
        tags: tags
      };
    });

    // 查询总数
    let countSql = `SELECT COUNT(DISTINCT s.id) as total FROM snippets s`;
    const countParams = [isDeleted];
    let hasWhere = false;
    
    if (keyword) {
      countSql += ` WHERE s.is_deleted = ? AND (s.title LIKE ? OR s.desc LIKE ? OR s.code LIKE ?)`;
      const likeKeyword = `%${keyword}%`;
      countParams.push(likeKeyword, likeKeyword, likeKeyword);
      hasWhere = true;
    } else {
      countSql += ` WHERE s.is_deleted = ?`;
      hasWhere = true;
    }

    if (language && hasWhere) {
      countSql += ` AND s.language = ?`;
      countParams.push(language);
    } else if (language) {
      countSql += ` WHERE s.language = ?`;
      countParams.push(language);
    }

    if (folderId !== null) {
      countSql += (hasWhere ? ` AND` : ` WHERE`) + ` s.folder_id = ?`;
      countParams.push(folderId);
    }

    if (tagId !== null) {
      countSql += (hasWhere ? ` AND` : ` WHERE`) + ` EXISTS (SELECT 1 FROM snippet_tag st WHERE st.snippet_id = s.id AND st.tag_id = ?)`;
      countParams.push(tagId);
    }

    if (isCollect !== null) {
      countSql += (hasWhere ? ` AND` : ` WHERE`) + ` s.is_collect = ?`;
      countParams.push(isCollect ? 1 : 0);
    }

    const countStmt = db.prepare(countSql);
    const { total } = countStmt.get(...countParams);

    return {
      list: snippets,
      total,
      page,
      pageSize
    };
  });

  // 搜索片段（用于实时搜索）
  ipcMain.handle('db:searchSnippets', (event, keyword) => {
    if (!keyword || !keyword.trim()) {
      return [];
    }
    
    const sql = `
      SELECT s.id, s.title, s.language
      FROM snippets s
      WHERE s.is_deleted = 0
        AND (s.title LIKE ? OR s.desc LIKE ? OR s.code LIKE ?)
      ORDER BY s.update_time DESC
      LIMIT 10
    `;
    
    const likeKeyword = `%${keyword.trim()}%`;
    const stmt = db.prepare(sql);
    return stmt.all(likeKeyword, likeKeyword, likeKeyword);
  });

  // 根据 ID 获取片段详情
  ipcMain.handle('db:getSnippetById', (event, id) => {
    const sql = `
      SELECT s.*, 
        GROUP_CONCAT(t.id) as tag_ids,
        GROUP_CONCAT(t.name) as tag_names,
        GROUP_CONCAT(t.color) as tag_colors
      FROM snippets s
      LEFT JOIN snippet_tag st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      WHERE s.id = ?
      GROUP BY s.id
    `;
    
    const stmt = db.prepare(sql);
    const snippet = stmt.get(id);
    
    // 更新查看次数
    if (snippet) {
      db.prepare('UPDATE snippets SET view_count = view_count + 1 WHERE id = ?').run(id);
    }
    
    return snippet;
  });

  // 新增代码片段
  ipcMain.handle('db:addSnippet', (event, snippetData) => {
    const { title, desc, code, language, folderId, tagIds = [] } = snippetData;
    
    const insertSnippet = db.prepare(`
      INSERT INTO snippets (title, desc, code, language, folder_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = insertSnippet.run(title, desc, code, language, folderId);
    const snippetId = result.lastInsertRowid;
    
    // 插入标签关联
    if (tagIds.length > 0) {
      const insertTag = db.prepare(`
        INSERT INTO snippet_tag (snippet_id, tag_id) VALUES (?, ?)
      `);
      
      tagIds.forEach(tagId => {
        insertTag.run(snippetId, tagId);
      });
    }
    
    return { id: snippetId, success: true };
  });

  // 修改片段内容（支持部分字段更新）
  ipcMain.handle('db:updateSnippet', (event, snippetData) => {
    const { id, title, desc, code, language, folder_id, tagIds = [] } = snippetData;
    
    let updateFields = [];
    let params = [];
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      params.push(title);
    }
    if (desc !== undefined) {
      updateFields.push('desc = ?');
      params.push(desc);
    }
    if (code !== undefined) {
      updateFields.push('code = ?');
      params.push(code);
    }
    if (language !== undefined) {
      updateFields.push('language = ?');
      params.push(language);
    }
    if (folder_id !== undefined) {
      updateFields.push('folder_id = ?');
      params.push(folder_id);
    }
    
    if (updateFields.length > 0) {
      updateFields.push('update_time = CURRENT_TIMESTAMP');
      params.push(id);
      
      const updateSnippet = db.prepare(`
        UPDATE snippets 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `);
      
      updateSnippet.run(...params);
    }
    
    // 如果提供了标签ID列表，更新标签关联
    if (tagIds.length > 0) {
      db.prepare('DELETE FROM snippet_tag WHERE snippet_id = ?').run(id);
      
      const insertTag = db.prepare(`
        INSERT INTO snippet_tag (snippet_id, tag_id) VALUES (?, ?)
      `);
      
      tagIds.forEach(tagId => {
        insertTag.run(id, tagId);
      });
    }
    
    return { success: true };
  });

  // 更新片段标签
  ipcMain.handle('db:updateSnippetTags', (event, snippetId, tagIds) => {
    // 先删除旧关联
    db.prepare('DELETE FROM snippet_tag WHERE snippet_id = ?').run(snippetId);
    
    // 插入新关联
    if (tagIds.length > 0) {
      const insertTag = db.prepare(`
        INSERT INTO snippet_tag (snippet_id, tag_id) VALUES (?, ?)
      `);
      
      tagIds.forEach(tagId => {
        insertTag.run(snippetId, tagId);
      });
    }
    
    return { success: true };
  });

  // 批量移动片段
  ipcMain.handle('db:batchMoveSnippets', (event, snippetIds, folderId) => {
    const stmt = db.prepare(`
      UPDATE snippets SET folder_id = ?, update_time = CURRENT_TIMESTAMP WHERE id = ?
    `);
    
    snippetIds.forEach(id => {
      stmt.run(folderId, id);
    });
    
    return { success: true };
  });

  // 批量更新片段标签
  ipcMain.handle('db:batchUpdateSnippetTags', (event, snippetIds, tagIds) => {
    snippetIds.forEach(snippetId => {
      // 先删除旧关联
      db.prepare('DELETE FROM snippet_tag WHERE snippet_id = ?').run(snippetId);
      
      // 插入新关联
      if (tagIds.length > 0) {
        const insertTag = db.prepare(`
          INSERT INTO snippet_tag (snippet_id, tag_id) VALUES (?, ?)
        `);
        
        tagIds.forEach(tagId => {
          insertTag.run(snippetId, tagId);
        });
      }
    });
    
    return { success: true };
  });

  // 批量删除片段（移入回收站）
  ipcMain.handle('db:batchDeleteSnippets', (event, snippetIds) => {
    const stmt = db.prepare('UPDATE snippets SET is_deleted = 1 WHERE id = ?');
    
    snippetIds.forEach(id => {
      stmt.run(id);
    });
    
    return { success: true };
  });

  // 删除片段（移入回收站）
  ipcMain.handle('db:deleteSnippet', (event, id) => {
    const stmt = db.prepare('UPDATE snippets SET is_deleted = 1 WHERE id = ?');
    stmt.run(id);
    return { success: true };
  });

  // 永久删除片段
  ipcMain.handle('db:hardDeleteSnippet', (event, id) => {
    db.prepare('DELETE FROM snippet_tag WHERE snippet_id = ?').run(id);
    db.prepare('DELETE FROM snippets WHERE id = ?').run(id);
    return { success: true };
  });

  // 恢复片段
  ipcMain.handle('db:restoreSnippet', (event, id) => {
    const stmt = db.prepare('UPDATE snippets SET is_deleted = 0 WHERE id = ?');
    stmt.run(id);
    return { success: true };
  });

  // 切换收藏状态
  ipcMain.handle('db:toggleCollect', (event, id) => {
    const stmt = db.prepare(`
      UPDATE snippets SET is_collect = CASE WHEN is_collect = 1 THEN 0 ELSE 1 END WHERE id = ?
    `);
    stmt.run(id);
    return { success: true };
  });

  // 获取最近使用的片段
  ipcMain.handle('db:getRecentSnippets', (event, limit = 10) => {
    const sql = `
      SELECT * FROM snippets 
      WHERE is_deleted = 0 
      ORDER BY update_time DESC 
      LIMIT ?
    `;
    const stmt = db.prepare(sql);
    return stmt.all(limit);
  });

  // 获取所有编程语言列表
  ipcMain.handle('db:getLanguages', () => {
    const sql = `
      SELECT DISTINCT language, COUNT(*) as count 
      FROM snippets 
      WHERE is_deleted = 0 
      GROUP BY language 
      ORDER BY count DESC
    `;
    const stmt = db.prepare(sql);
    return stmt.all();
  });
}

module.exports = {
  registerSnippetHandlers
};
