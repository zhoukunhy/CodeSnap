const { ipcMain } = require('electron');

/**
 * 注册配置相关的 IPC 处理器
 * @param {Database} db - SQLite 数据库实例
 */
function registerConfigHandlers(db) {
  // 获取单个配置
  ipcMain.handle('config:get', (event, key) => {
    const stmt = db.prepare('SELECT config_value FROM user_config WHERE config_key = ?');
    const result = stmt.get(key);
    return result ? result.config_value : null;
  });

  // 获取所有配置
  ipcMain.handle('config:getAll', () => {
    const stmt = db.prepare('SELECT config_key, config_value FROM user_config');
    const rows = stmt.all();
    
    const config = {};
    rows.forEach(row => {
      config[row.config_key] = row.config_value;
    });
    
    return config;
  });

  // 保存配置
  ipcMain.handle('config:save', (event, key, value) => {
    const stmt = db.prepare(`
      INSERT INTO user_config (config_key, config_value)
      VALUES (?, ?)
      ON CONFLICT(config_key) 
      DO UPDATE SET config_value = ?, update_time = CURRENT_TIMESTAMP
    `);
    stmt.run(key, value, value);
    return { success: true };
  });

  // 批量保存配置
  ipcMain.handle('config:saveAll', (event, configObj) => {
    const stmt = db.prepare(`
      INSERT INTO user_config (config_key, config_value)
      VALUES (@key, @value)
      ON CONFLICT(config_key) 
      DO UPDATE SET config_value = @value, update_time = CURRENT_TIMESTAMP
    `);

    const saveMany = db.transaction((config) => {
      Object.entries(config).forEach(([key, value]) => {
        stmt.run({ key, value });
      });
    });

    saveMany(configObj);
    return { success: true };
  });
}

module.exports = {
  registerConfigHandlers
};
