const path = require('path');
const { app } = require('electron');
const fs = require('fs');

const betterSqlite3Path = app.isPackaged 
  ? path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'better-sqlite3')
  : path.join(__dirname, '../../../../node_modules', 'better-sqlite3');
const Database = require(betterSqlite3Path);

function getDatabasePath() {
  const dbDir = app.isPackaged 
    ? path.join(path.dirname(process.execPath), 'database')
    : path.join(__dirname, '../../../database');
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  return path.join(dbDir, 'codesnap.db');
}

// 初始化数据库
function initDatabase() {
  const dbPath = getDatabasePath();
  const db = new Database(dbPath);
  
  // 启用外键约束
  db.pragma('foreign_keys = ON');
  
  // 创建表
  createTables(db);
  
  return db;
}

// 创建数据表
function createTables(db) {
  // 1. 文件夹表
  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER DEFAULT 0,
      sort INTEGER DEFAULT 0,
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      update_time DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. 标签表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#409EFF',
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. 代码片段主表
  db.exec(`
    CREATE TABLE IF NOT EXISTS snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      desc TEXT,
      code TEXT,
      language TEXT DEFAULT 'javascript',
      folder_id INTEGER,
      is_collect INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      view_count INTEGER DEFAULT 0,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    )
  `);

  // 4. 片段-标签关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS snippet_tag (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snippet_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE(snippet_id, tag_id)
    )
  `);

  // 5. 用户配置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_key TEXT NOT NULL UNIQUE,
      config_value TEXT,
      update_time DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建索引以提升查询性能
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_snippets_title ON snippets(title);
    CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
    CREATE INDEX IF NOT EXISTS idx_snippets_folder_id ON snippets(folder_id);
    CREATE INDEX IF NOT EXISTS idx_snippets_is_collect ON snippets(is_collect);
    CREATE INDEX IF NOT EXISTS idx_snippets_is_deleted ON snippets(is_deleted);
    CREATE INDEX IF NOT EXISTS idx_snippet_tag_snippet_id ON snippet_tag(snippet_id);
    CREATE INDEX IF NOT EXISTS idx_snippet_tag_tag_id ON snippet_tag(tag_id);
  `);

  // 插入默认配置
  const defaultConfigs = [
    { key: 'theme', value: 'light' },
    { key: 'editor_theme', value: 'vs' },
    { key: 'editor_font_size', value: '14' },
    { key: 'editor_font_family', value: 'Consolas, Monaco, monospace' },
    { key: 'editor_tab_size', value: '2' },
    { key: 'auto_backup', value: 'false' },
    { key: 'backup_path', value: '' }
  ];

  const insertConfig = db.prepare(`
    INSERT OR IGNORE INTO user_config (config_key, config_value)
    VALUES (@key, @value)
  `);

  defaultConfigs.forEach(config => {
    insertConfig.run(config);
  });
}

module.exports = {
  initDatabase,
  getDatabasePath
};
