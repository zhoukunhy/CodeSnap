<template>
  <div class="setting-container">
    <!-- 侧边导航 -->
    <aside class="setting-sidebar">
      <el-menu 
        :default-active="activeTab" 
        class="setting-menu"
        mode="vertical"
      >
        <el-menu-item index="appearance">
          <el-icon><Setting /></el-icon>
          <span>界面主题</span>
        </el-menu-item>
        <el-menu-item index="editor">
          <el-icon><Edit /></el-icon>
          <span>编辑器设置</span>
        </el-menu-item>
        <el-menu-item index="shortcuts">
          <el-icon><Key /></el-icon>
          <span>快捷键</span>
        </el-menu-item>
        <el-menu-item index="data">
          <el-icon><Cpu /></el-icon>
          <span>数据设置</span>
        </el-menu-item>
        <el-menu-item index="about">
          <el-icon><InfoFilled /></el-icon>
          <span>关于</span>
        </el-menu-item>
      </el-menu>
    </aside>
    
    <!-- 设置内容 -->
    <main class="setting-content">
      <!-- 界面主题 -->
      <div v-show="activeTab === 'appearance'" class="setting-section">
        <h2 class="section-title">界面主题</h2>
        
        <div class="setting-card">
          <div class="card-header">
            <h3>全局主题</h3>
            <p>设置应用的整体外观风格</p>
          </div>
          
          <div class="theme-options">
            <div 
              v-for="theme in themes" 
              :key="theme.value"
              class="theme-option"
              :class="{ active: appTheme === theme.value }"
              @click="selectTheme(theme.value)"
            >
              <div class="theme-preview" :class="theme.value">
                <div class="preview-header"></div>
                <div class="preview-content">
                  <div class="preview-item"></div>
                  <div class="preview-item"></div>
                  <div class="preview-item"></div>
                </div>
              </div>
              <span>{{ theme.label }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 编辑器设置 -->
      <div v-show="activeTab === 'editor'" class="setting-section">
        <h2 class="section-title">编辑器设置</h2>
        
        <div class="setting-card">
          <div class="card-header">
            <h3>字体设置</h3>
          </div>
          
          <div class="form-item">
            <label>编辑器字体</label>
            <el-select 
              v-model="editorConfig.fontFamily" 
              class="form-control"
              @change="saveEditorConfig"
            >
              <el-option label="Consolas" value="Consolas, Monaco, monospace" />
              <el-option label="Monaco" value="Monaco, Consolas, monospace" />
              <el-option label="Menlo" value="Menlo, Monaco, monospace" />
              <el-option label="Source Code Pro" value="'Source Code Pro', monospace" />
              <el-option label="Fira Code" value="'Fira Code', monospace" />
              <el-option label="JetBrains Mono" value="'JetBrains Mono', monospace" />
            </el-select>
          </div>
          
          <div class="form-item">
            <label>字体大小</label>
            <el-input-number 
              v-model="editorConfig.fontSize" 
              :min="10" 
              :max="32"
              class="form-control"
              @change="saveEditorConfig"
            />
          </div>
          
          <div class="form-item">
            <label>缩进大小</label>
            <el-select 
              v-model="editorConfig.tabSize" 
              class="form-control"
              @change="saveEditorConfig"
            >
              <el-option label="2 空格" value="2" />
              <el-option label="4 空格" value="4" />
              <el-option label="8 空格" value="8" />
            </el-select>
          </div>
          
          <div class="form-item">
            <label>编辑器主题</label>
            <el-select 
              v-model="editorConfig.theme" 
              class="form-control"
              @change="saveEditorConfig"
            >
              <el-option label="浅色" value="vs" />
              <el-option label="深色" value="vs-dark" />
              <el-option label="高对比度" value="hc-black" />
            </el-select>
          </div>
        </div>
      </div>
      
      <!-- 快捷键设置 -->
      <div v-show="activeTab === 'shortcuts'" class="setting-section">
        <h2 class="section-title">快捷键设置</h2>
        
        <div class="setting-card">
          <div class="card-header">
            <h3>全局快捷键</h3>
            <p>配置应用的全局快捷键</p>
          </div>
          
          <div class="shortcuts-list">
            <div v-for="(shortcut, key) in shortcuts" :key="key" class="shortcut-item">
              <div class="shortcut-info">
                <span class="shortcut-name">{{ shortcut.name }}</span>
                <span class="shortcut-desc">{{ shortcut.description }}</span>
              </div>
              <div class="shortcut-keys">
                <span 
                  v-for="(keyItem, idx) in shortcut.keys" 
                  :key="idx"
                  class="key-badge"
                >
                  {{ keyItem }}
                </span>
              </div>
              <el-button type="text" size="small" @click="modifyShortcut(key)">修改</el-button>
            </div>
          </div>
        </div>
        
        <div class="setting-card">
          <div class="card-header">
            <h3>系统级快捷键</h3>
            <p>在系统级别生效的快捷键（应用最小化时也可用）</p>
          </div>
          
          <div class="shortcuts-list">
            <div v-for="(shortcut, key) in systemShortcuts" :key="key" class="shortcut-item">
              <div class="shortcut-info">
                <span class="shortcut-name">{{ shortcut.name }}</span>
                <span class="shortcut-desc">{{ shortcut.description }}</span>
              </div>
              <div class="shortcut-keys">
                <span 
                  v-for="(keyItem, idx) in shortcut.keys" 
                  :key="idx"
                  class="key-badge"
                >
                  {{ keyItem }}
                </span>
              </div>
              <el-button type="text" size="small" @click="modifySystemShortcut(key)">修改</el-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 数据设置 -->
      <div v-show="activeTab === 'data'" class="setting-section">
        <h2 class="section-title">数据设置</h2>
        
        <div class="setting-card">
          <div class="card-header">
            <h3>数据库设置</h3>
            <p>管理本地数据库文件</p>
          </div>
          
          <div class="form-item">
            <label>数据库路径</label>
            <div class="path-display">
              <span class="path-text">{{ databasePath }}</span>
              <el-button type="text" size="small" @click="showDatabasePath">
                <el-icon><FolderOpened /></el-icon>
                打开目录
              </el-button>
            </div>
          </div>
          
          <div class="form-item">
            <label>数据库大小</label>
            <span class="form-value">{{ databaseSize }}</span>
          </div>
        </div>
        
        <div class="setting-card">
          <div class="card-header">
            <h3>自动备份</h3>
            <p>自动备份数据库以防止数据丢失</p>
          </div>
          
          <div class="form-item">
            <div class="form-item-left">
              <label>启用自动备份</label>
              <span class="form-desc">每隔一定时间自动备份数据库</span>
            </div>
            <el-switch 
              v-model="dataConfig.autoBackup" 
              @change="saveDataConfig"
            />
          </div>
          
          <div class="form-item" :class="{ disabled: !dataConfig.autoBackup }">
            <label>备份间隔</label>
            <el-select 
              v-model="dataConfig.backupInterval" 
              class="form-control"
              :disabled="!dataConfig.autoBackup"
              @change="saveDataConfig"
            >
              <el-option label="1 小时" value="1" />
              <el-option label="3 小时" value="3" />
              <el-option label="6 小时" value="6" />
              <el-option label="12 小时" value="12" />
              <el-option label="24 小时" value="24" />
            </el-select>
          </div>
          
          <div class="form-item">
            <label>备份路径</label>
            <div class="path-display">
              <span class="path-text">{{ backupPath }}</span>
              <el-button type="text" size="small" @click="selectBackupPath">
                <el-icon><FolderOpened /></el-icon>
                选择路径
              </el-button>
            </div>
          </div>
          
          <div class="form-item">
            <label>保留备份数量</label>
            <el-input-number 
              v-model="dataConfig.backupCount" 
              :min="1" 
              :max="50"
              class="form-control"
              @change="saveDataConfig"
            />
          </div>
        </div>
        
        <div class="setting-card">
          <div class="card-header">
            <h3>手动备份与恢复</h3>
          </div>
          
          <div class="action-buttons">
            <el-button type="primary" @click="manualBackup">
              <el-icon><Download /></el-icon>
              立即备份
            </el-button>
            <el-button @click="restoreBackup">
              <el-icon><FolderOpened /></el-icon>
              从备份恢复
            </el-button>
          </div>
          
          <div class="backup-info">
            <el-alert 
              title="重要提示" 
              type="warning" 
              :closable="false"
              show-icon
            >
              <p>建议定期备份数据库，并将备份文件存储在安全位置。</p>
              <p>恢复备份将覆盖当前数据库，请谨慎操作。</p>
            </el-alert>
          </div>
        </div>
      </div>
      
      <!-- 关于 -->
      <!-- 快捷键修改对话框 -->
      <Teleport to="body">
        <el-dialog 
          title="修改快捷键" 
          :visible="showShortcutModal"
          width="400px"
          :close-on-click-modal="false"
          @close="removeKeyListener"
          @open="addKeyListener"
        >
          <div class="shortcut-modal">
            <div class="modal-info">
              <p>请按下新的快捷键组合</p>
            </div>
            
            <div class="keys-display">
              <div v-if="recordingKeys.length === 0" class="empty-keys">
                未设置快捷键
              </div>
              <span 
                v-for="(key, idx) in recordingKeys" 
                :key="idx"
                class="key-badge"
                :class="{ recording: isRecording }"
              >
                {{ key }}
              </span>
            </div>
            
            <div class="recording-status" v-if="isRecording">
              <span class="recording-dot"></span>
              正在录制... 请按下快捷键组合
            </div>
            
            <div class="modal-actions">
              <el-button @click="startRecording" :disabled="isRecording">
                重新录制
              </el-button>
              <el-button @click="clearRecording">
                恢复默认
              </el-button>
              <el-button type="primary" @click="saveShortcut">
                保存
              </el-button>
            </div>
          </div>
        </el-dialog>
      </Teleport>
      
      <!-- 关于 -->
      <div v-show="activeTab === 'about'" class="setting-section">
        <h2 class="section-title">关于 CodeSnap</h2>
        
        <div class="setting-card about-card">
          <div class="about-logo">
            <img src="/logo.svg" alt="CodeSnap" />
            <h3>CodeSnap</h3>
          </div>
          <p class="about-version">版本 1.0.0</p>
          <p class="about-desc">
            CodeSnap 是一款轻量级的代码片段管理工具，帮助开发者高效管理和复用代码片段。
          </p>
          <div class="about-links">
            <a href="#" class="link">查看文档</a>
            <a href="#" class="link">反馈问题</a>
            <a href="#" class="link">源码仓库</a>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Edit, Key, InfoFilled, Cpu, Download, Warning, FolderOpened, Setting } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const activeTab = ref('appearance');

// 主题选项
const themes = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '跟随系统', value: 'system' }
];

const appTheme = ref('light');

// 编辑器配置
const editorConfig = reactive({
  fontFamily: 'Consolas, Monaco, monospace',
  fontSize: 14,
  tabSize: 2,
  theme: 'vs'
});

// 快捷键配置
const shortcuts = reactive({
  newSnippet: {
    name: '新建片段',
    description: '创建新的代码片段',
    keys: ['Ctrl', 'N']
  },
  search: {
    name: '搜索',
    description: '打开搜索框',
    keys: ['Ctrl', 'F']
  },
  save: {
    name: '保存',
    description: '保存当前片段',
    keys: ['Ctrl', 'S']
  },
  copy: {
    name: '复制',
    description: '复制代码到剪贴板',
    keys: ['Ctrl', 'C']
  },
  paste: {
    name: '粘贴',
    description: '粘贴代码',
    keys: ['Ctrl', 'V']
  },
  delete: {
    name: '删除',
    description: '删除当前片段',
    keys: ['Delete']
  },
  toggleSidebar: {
    name: '切换侧边栏',
    description: '显示/隐藏侧边栏',
    keys: ['Ctrl', 'B']
  },
  toggleEditor: {
    name: '切换编辑器',
    description: '显示/隐藏编辑器',
    keys: ['Ctrl', 'E']
  }
});

// 系统级快捷键配置
const systemShortcuts = reactive({
  showWindow: {
    name: '唤起窗口',
    description: '显示或隐藏应用窗口',
    keys: ['Ctrl', 'Shift', 'C']
  },
  quickNew: {
    name: '快速新建',
    description: '快速创建新代码片段',
    keys: ['Ctrl', 'Shift', 'N']
  }
});

// 数据配置
const dataConfig = reactive({
  autoBackup: false,
  backupInterval: '6',
  backupCount: 10
});

// 数据库信息
const databasePath = ref('');
const databaseSize = ref('0 KB');
const backupPath = ref('');

// 修改快捷键对话框
const showShortcutModal = ref(false);
const currentShortcutKey = ref('');
const currentShortcutType = ref(''); // 'app' or 'system'
const recordingKeys = ref([]);
const isRecording = ref(false);

// 加载配置
onMounted(async () => {
  await loadConfig();
});

// 加载所有配置
const loadConfig = async () => {
  if (!window.electronAPI) return;
  
  try {
    const config = await window.electronAPI.getAllConfig();
    
    // 界面主题
    if (config.app_theme) {
      appTheme.value = config.app_theme;
    }
    
    // 编辑器配置
    if (config.editor_font_family) {
      editorConfig.fontFamily = config.editor_font_family;
    }
    if (config.editor_font_size) {
      editorConfig.fontSize = parseInt(config.editor_font_size);
    }
    if (config.editor_tab_size) {
      editorConfig.tabSize = parseInt(config.editor_tab_size);
    }
    if (config.editor_theme) {
      editorConfig.theme = config.editor_theme;
    }
    
    // 快捷键配置
    if (config.shortcuts) {
      Object.assign(shortcuts, JSON.parse(config.shortcuts));
    }
    
    // 系统级快捷键配置
    if (config.system_shortcuts) {
      Object.assign(systemShortcuts, JSON.parse(config.system_shortcuts));
    }
    
    // 数据配置
    if (config.auto_backup !== undefined) {
      dataConfig.autoBackup = config.auto_backup === 'true';
    }
    if (config.backup_interval) {
      dataConfig.backupInterval = config.backup_interval;
    }
    if (config.backup_count) {
      dataConfig.backupCount = parseInt(config.backup_count);
    }
    
    // 数据库信息
    await loadDatabaseInfo();
  } catch (error) {
    console.error('加载配置失败:', error);
  }
};

// 加载数据库信息
const loadDatabaseInfo = async () => {
  if (!window.electronAPI) return;
  
  try {
    const info = await window.electronAPI.getDatabaseInfo();
    if (info) {
      databasePath.value = info.path || '';
      databaseSize.value = info.size || '0 KB';
      backupPath.value = info.backupPath || '';
    }
  } catch (error) {
    console.error('加载数据库信息失败:', error);
  }
};

// 选择主题
const selectTheme = async (theme) => {
  appTheme.value = theme;
  
  try {
    await window.electronAPI.saveConfig('app_theme', theme);
    ElMessage.success('主题已更新');
    
    // 应用主题到界面
    applyTheme(theme);
  } catch (error) {
    ElMessage.error('保存主题失败');
  }
};

// 应用主题
const applyTheme = (theme) => {
  const body = document.body;
  
  if (theme === 'dark') {
    body.classList.add('dark-theme');
    body.classList.remove('light-theme');
  } else {
    body.classList.add('light-theme');
    body.classList.remove('dark-theme');
  }
};

// 保存编辑器配置
const saveEditorConfig = async () => {
  try {
    await Promise.all([
      window.electronAPI.saveConfig('editor_font_family', editorConfig.fontFamily),
      window.electronAPI.saveConfig('editor_font_size', editorConfig.fontSize.toString()),
      window.electronAPI.saveConfig('editor_tab_size', editorConfig.tabSize.toString()),
      window.electronAPI.saveConfig('editor_theme', editorConfig.theme)
    ]);
    ElMessage.success('编辑器配置已保存');
  } catch (error) {
    ElMessage.error('保存配置失败');
  }
};

// 修改应用快捷键
const modifyShortcut = (key) => {
  currentShortcutKey.value = key;
  currentShortcutType.value = 'app';
  recordingKeys.value = [...shortcuts[key].keys];
  isRecording.value = false;
  showShortcutModal.value = true;
};

// 修改系统快捷键
const modifySystemShortcut = (key) => {
  currentShortcutKey.value = key;
  currentShortcutType.value = 'system';
  recordingKeys.value = [...systemShortcuts[key].keys];
  isRecording.value = false;
  showShortcutModal.value = true;
};

// 开始录制快捷键
const startRecording = () => {
  recordingKeys.value = [];
  isRecording.value = true;
};

// 停止录制
const stopRecording = () => {
  isRecording.value = false;
};

// 清除录制
const clearRecording = () => {
  if (currentShortcutType.value === 'app') {
    recordingKeys.value = [...shortcuts[currentShortcutKey.value].keys];
  } else {
    recordingKeys.value = [...systemShortcuts[currentShortcutKey.value].keys];
  }
};

// 保存快捷键修改
const saveShortcut = async () => {
  if (recordingKeys.value.length === 0) {
    ElMessage.warning('请设置至少一个按键');
    return;
  }
  
  try {
    if (currentShortcutType.value === 'app') {
      shortcuts[currentShortcutKey.value].keys = [...recordingKeys.value];
      await window.electronAPI.saveConfig('shortcuts', JSON.stringify(shortcuts));
    } else {
      systemShortcuts[currentShortcutKey.value].keys = [...recordingKeys.value];
      await window.electronAPI.saveConfig('system_shortcuts', JSON.stringify(systemShortcuts));
      
      // 更新系统快捷键
      await window.electronAPI.updateSystemShortcuts(systemShortcuts);
    }
    
    ElMessage.success('快捷键已更新');
    showShortcutModal.value = false;
  } catch (error) {
    ElMessage.error('保存失败');
  }
};

// 保存数据配置
const saveDataConfig = async () => {
  try {
    await Promise.all([
      window.electronAPI.saveConfig('auto_backup', dataConfig.autoBackup.toString()),
      window.electronAPI.saveConfig('backup_interval', dataConfig.backupInterval),
      window.electronAPI.saveConfig('backup_count', dataConfig.backupCount.toString())
    ]);
    ElMessage.success('配置已保存');
  } catch (error) {
    ElMessage.error('保存失败');
  }
};

// 显示数据库路径
const showDatabasePath = async () => {
  if (!window.electronAPI) return;
  
  try {
    await window.electronAPI.openDirectory(databasePath.value);
  } catch (error) {
    ElMessage.error('打开失败');
  }
};

// 选择备份路径
const selectBackupPath = async () => {
  if (!window.electronAPI) return;
  
  try {
    const path = await window.electronAPI.selectDirectory();
    if (path) {
      backupPath.value = path;
      await window.electronAPI.saveConfig('backup_path', path);
      ElMessage.success('备份路径已更新');
    }
  } catch (error) {
    ElMessage.error('选择失败');
  }
};

// 手动备份
const manualBackup = async () => {
  if (!window.electronAPI) return;
  
  try {
    const result = await window.electronAPI.backupDatabase();
    if (result.success) {
      ElMessage.success(`备份成功，文件已保存到: ${result.path}`);
    } else {
      ElMessage.error('备份失败');
    }
  } catch (error) {
    ElMessage.error('备份失败');
  }
};

// 从备份恢复
const restoreBackup = async () => {
  if (!window.electronAPI) return;
  
  try {
    const result = await window.electronAPI.restoreDatabase();
    if (result.success) {
      ElMessage.success('恢复成功，请重启应用');
    } else {
      ElMessage.error(result.message || '恢复失败');
    }
  } catch (error) {
    ElMessage.error('恢复失败');
  }
};

// 监听键盘事件
const handleKeyDown = (event) => {
  if (!isRecording.value) return;
  
  event.preventDefault();
  
  const key = getKeyName(event);
  if (key && !recordingKeys.value.includes(key)) {
    recordingKeys.value.push(key);
  }
  
  // 普通按键结束录制
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
    isRecording.value = false;
  }
};

// 获取按键名称
const getKeyName = (event) => {
  if (event.key === 'Control') return 'Ctrl';
  if (event.key === 'Shift') return 'Shift';
  if (event.key === 'Alt') return 'Alt';
  if (event.key === 'Meta') return 'Cmd';
  if (event.key === ' ') return 'Space';
  if (event.key === 'Enter') return 'Enter';
  if (event.key === 'Tab') return 'Tab';
  if (event.key === 'Backspace') return 'Backspace';
  if (event.key === 'Delete') return 'Delete';
  if (event.key === 'Escape') return 'Esc';
  if (event.key === 'ArrowUp') return 'Up';
  if (event.key === 'ArrowDown') return 'Down';
  if (event.key === 'ArrowLeft') return 'Left';
  if (event.key === 'ArrowRight') return 'Right';
  if (event.key === 'Home') return 'Home';
  if (event.key === 'End') return 'End';
  if (event.key === 'PageUp') return 'PageUp';
  if (event.key === 'PageDown') return 'PageDown';
  if (event.key === 'Insert') return 'Insert';
  if (event.key.length === 1) return event.key.toUpperCase();
  return event.key;
};

// 添加键盘事件监听
const addKeyListener = () => {
  window.addEventListener('keydown', handleKeyDown);
};

// 移除键盘事件监听
const removeKeyListener = () => {
  window.removeEventListener('keydown', handleKeyDown);
};
</script>

<style lang="scss" scoped>
.setting-container {
  display: flex;
  height: 100%;
  background-color: #f5f7fa;
}

.setting-sidebar {
  width: 200px;
  background-color: #fff;
  border-right: 1px solid #e4e7ed;
}

.setting-menu {
  border-right: none;
}

.setting-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.setting-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}

.setting-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  
  .card-header {
    margin-bottom: 20px;
    
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;
    }
    
    p {
      font-size: 13px;
      color: #909399;
      margin: 0;
    }
  }
}

/* 主题选项 */
.theme-options {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  
  &:hover {
    background-color: #f5f7fa;
  }
  
  &.active {
    border-color: #409eff;
    background-color: #ecf5ff;
  }
  
  span {
    font-size: 14px;
    color: #606266;
  }
}

.theme-preview {
  width: 80px;
  height: 60px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  &.light {
    background-color: #fff;
    border: 1px solid #e4e7ed;
    
    .preview-header {
      background-color: #f5f7fa;
    }
    
    .preview-item {
      background-color: #e4e7ed;
    }
  }
  
  &.dark {
    background-color: #1e1e1e;
    border: 1px solid #3c3c3c;
    
    .preview-header {
      background-color: #252526;
    }
    
    .preview-item {
      background-color: #3c3c3c;
    }
  }
  
  &.system {
    background: linear-gradient(135deg, #fff 50%, #1e1e1e 50%);
    border: 1px solid #e4e7ed;
    
    .preview-header {
      background: linear-gradient(90deg, #f5f7fa 50%, #252526 50%);
    }
    
    .preview-item {
      background: linear-gradient(90deg, #e4e7ed 50%, #3c3c3c 50%);
    }
  }
  
  .preview-header {
    height: 16px;
    margin-bottom: 8px;
  }
  
  .preview-content {
    flex: 1;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .preview-item {
      height: 6px;
      border-radius: 2px;
    }
    
    .preview-item:nth-child(2) {
      width: 70%;
    }
    
    .preview-item:nth-child(3) {
      width: 50%;
    }
  }
}

/* 表单样式 */
.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  
  label {
    font-size: 14px;
    color: #606266;
  }
  
  .form-control {
    width: 200px;
  }
}

/* 快捷键列表 */
.shortcuts-list {
  .shortcut-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .shortcut-info {
    flex: 1;
    
    .shortcut-name {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 4px;
    }
    
    .shortcut-desc {
      font-size: 12px;
      color: #909399;
    }
  }
  
  .shortcut-keys {
    display: flex;
    gap: 6px;
    margin-right: 16px;
    
    .key-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 28px;
      padding: 0 8px;
      background-color: #f5f7fa;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      color: #606266;
      font-family: monospace;
    }
  }
}

/* 快捷键修改对话框 */
.shortcut-modal {
  padding: 20px 0;
  
  .modal-info {
    text-align: center;
    margin-bottom: 20px;
    
    p {
      color: #606266;
      font-size: 14px;
    }
  }
  
  .keys-display {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  
  .empty-keys {
    color: #909399;
    font-style: italic;
  }
  
  .key-badge {
    &.recording {
      animation: pulse 1s infinite;
    }
  }
  
  .recording-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #f56c6c;
    font-size: 14px;
    margin-bottom: 20px;
    
    .recording-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #f56c6c;
      animation: blink 1s infinite;
    }
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(64, 158, 255, 0);
  }
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* 数据设置 */
.form-item {
  &.disabled {
    opacity: 0.5;
    
    .form-control {
      pointer-events: none;
    }
  }
  
  &.form-item-left {
    flex: 1;
    
    .form-desc {
      display: block;
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
    }
  }
}

.path-display {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .path-text {
    flex: 1;
    font-family: monospace;
    font-size: 12px;
    color: #606266;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.form-value {
  font-size: 14px;
  color: #606266;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.backup-info {
  .el-alert {
    font-size: 13px;
  }
}

/* 关于页面 */
.about-card {
  text-align: center;
  
  .about-logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    
    img {
      width: 64px;
      height: 64px;
    }
    
    h3 {
      font-size: 24px;
      font-weight: 600;
      color: #409eff;
      margin: 0;
    }
  }
  
  .about-version {
    font-size: 14px;
    color: #909399;
    margin-bottom: 16px;
  }
  
  .about-desc {
    font-size: 14px;
    color: #606266;
    line-height: 1.6;
    margin-bottom: 20px;
  }
  
  .about-links {
    display: flex;
    justify-content: center;
    gap: 24px;
    
    .link {
      font-size: 14px;
      color: #409eff;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
