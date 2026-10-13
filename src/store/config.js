import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useConfigStore = defineStore('config', () => {
  const theme = ref('light');
  const editorTheme = ref('vs');
  const editorFontSize = ref(14);
  const editorFontFamily = ref('Consolas, Monaco, monospace');
  const editorTabSize = ref(2);
  const autoBackup = ref(false);
  const backupPath = ref('');

  // 加载配置
  async function loadConfig() {
    if (!window.electronAPI) return;
    
    try {
      const config = await window.electronAPI.getAllConfig();
      
      if (config.theme) theme.value = config.theme;
      if (config.editor_theme) editorTheme.value = config.editor_theme;
      if (config.editor_font_size) editorFontSize.value = parseInt(config.editor_font_size);
      if (config.editor_font_family) editorFontFamily.value = config.editor_font_family;
      if (config.editor_tab_size) editorTabSize.value = parseInt(config.editor_tab_size);
      if (config.auto_backup) autoBackup.value = config.auto_backup === 'true';
      if (config.backup_path) backupPath.value = config.backup_path;
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  }

  // 保存配置
  async function saveConfig(key, value) {
    if (!window.electronAPI) return;
    
    try {
      await window.electronAPI.saveConfig(key, value.toString());
      
      // 更新本地状态
      switch (key) {
        case 'theme':
          theme.value = value;
          break;
        case 'editor_theme':
          editorTheme.value = value;
          break;
        case 'editor_font_size':
          editorFontSize.value = parseInt(value);
          break;
        case 'editor_font_family':
          editorFontFamily.value = value;
          break;
        case 'editor_tab_size':
          editorTabSize.value = parseInt(value);
          break;
        case 'auto_backup':
          autoBackup.value = value === 'true';
          break;
        case 'backup_path':
          backupPath.value = value;
          break;
      }
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  }

  // 批量保存配置
  async function saveAllConfig(configObj) {
    if (!window.electronAPI) return;
    
    try {
      await window.electronAPI.saveAllConfig(configObj);
      await loadConfig();
    } catch (error) {
      console.error('批量保存配置失败:', error);
    }
  }

  return {
    theme,
    editorTheme,
    editorFontSize,
    editorFontFamily,
    editorTabSize,
    autoBackup,
    backupPath,
    loadConfig,
    saveConfig,
    saveAllConfig
  };
});
