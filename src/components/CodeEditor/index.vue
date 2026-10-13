<template>
  <div class="code-editor-container">
    <div v-if="!currentSnippet" class="empty-state">
      <el-empty description="请选择一个代码片段" />
    </div>
    
    <div v-else class="editor-wrapper">
      <!-- 片段信息 -->
      <div class="snippet-info">
        <el-input
          v-model="snippetForm.title"
          placeholder="片段标题"
          class="title-input"
        />
        
        <el-input
          v-model="snippetForm.desc"
          type="textarea"
          :rows="2"
          placeholder="片段描述"
          class="desc-input"
        />
        
        <div class="info-row">
          <el-select v-model="snippetForm.language" placeholder="选择语言" style="width: 150px">
            <el-option label="JavaScript" value="javascript" />
            <el-option label="TypeScript" value="typescript" />
            <el-option label="Python" value="python" />
            <el-option label="Java" value="java" />
            <el-option label="C++" value="cpp" />
            <el-option label="Go" value="go" />
            <el-option label="Rust" value="rust" />
            <el-option label="HTML" value="html" />
            <el-option label="CSS" value="css" />
            <el-option label="SQL" value="sql" />
            <el-option label="JSON" value="json" />
            <el-option label="Markdown" value="markdown" />
          </el-select>
          
          <el-cascader
            v-model="snippetForm.folderId"
            :options="folderOptions"
            :props="{ checkStrictly: true, value: 'id', label: 'name' }"
            placeholder="选择文件夹"
            clearable
            style="width: 200px"
          />
          
          <el-select
            v-model="snippetForm.tagIds"
            multiple
            placeholder="选择标签"
            style="width: 200px"
          >
            <el-option
              v-for="tag in tags"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            />
          </el-select>
        </div>
      </div>
      
      <!-- 工具栏 -->
      <div class="editor-toolbar">
        <el-button type="primary" @click="handleCopy">
          <el-icon><DocumentCopy /></el-icon>
          复制代码
        </el-button>
        
        <el-button @click="handleFormat">
          <el-icon><MagicStick /></el-icon>
          格式化
        </el-button>
        
        <el-button @click="handleSave">
          <el-icon><Check /></el-icon>
          保存
        </el-button>
        
        <div class="editor-settings">
          <!-- 自动保存状态 -->
          <div class="save-status" :class="saveStatus">
            <el-icon v-if="saveStatus === 'saved'"><Check /></el-icon>
            <el-icon v-else-if="saveStatus === 'saving'"><Upload /></el-icon>
            <el-icon v-else><Clock /></el-icon>
            <span>{{ saveStatusText }}</span>
          </div>
          
          <!-- 主题切换 -->
          <el-select 
            v-model="editorConfig.theme" 
            placeholder="主题" 
            size="small"
            style="width: 120px"
            @change="handleThemeChange"
          >
            <el-option label="浅色" value="vs" />
            <el-option label="深色" value="vs-dark" />
            <el-option label="高对比度" value="hc-black" />
          </el-select>
          
          <!-- 字体选择 -->
          <el-select 
            v-model="editorConfig.fontFamily" 
            placeholder="字体" 
            size="small"
            style="width: 150px"
            @change="handleFontChange"
          >
            <el-option label="Consolas" value="Consolas, Monaco, monospace" />
            <el-option label="Monaco" value="Monaco, Consolas, monospace" />
            <el-option label="Menlo" value="Menlo, Monaco, monospace" />
            <el-option label="Source Code Pro" value="'Source Code Pro', monospace" />
            <el-option label="Fira Code" value="'Fira Code', monospace" />
            <el-option label="JetBrains Mono" value="'JetBrains Mono', monospace" />
          </el-select>
          
          <!-- 字号调整 -->
          <el-input-number 
            v-model="editorConfig.fontSize" 
            :min="10" 
            :max="32" 
            :step="1"
            size="small"
            style="width: 80px"
            @change="handleFontSizeChange"
          />
          
          <!-- 缩进大小 -->
          <el-select 
            v-model="editorConfig.tabSize" 
            placeholder="缩进" 
            size="small"
            style="width: 80px"
            @change="handleTabSizeChange"
          >
            <el-option label="2 空格" value="2" />
            <el-option label="4 空格" value="4" />
            <el-option label="8 空格" value="8" />
          </el-select>
        </div>
        
        <div class="right-actions">
          <el-button @click="handleToggleCollect">
            <el-icon :color="snippetForm.isCollect ? '#F56C6C' : ''">
              <Star />
            </el-icon>
            {{ snippetForm.isCollect ? '取消收藏' : '收藏' }}
          </el-button>
          
          <el-button type="danger" @click="handleDelete">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </div>
      
      <!-- Monaco 编辑器 -->
      <div ref="editorContainer" class="monaco-editor"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick, onUnmounted, computed } from 'vue';
import { DocumentCopy, MagicStick, Check, Star, Delete, Clock, Upload } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as monaco from 'monaco-editor';

const editorContainer = ref(null);
const currentSnippet = ref(null);
const editor = ref(null);
const tags = ref([]);
const folderOptions = ref([]);

// 自动保存相关
const autoSaveTimer = ref(null);
const autoSaveDelay = 3000; // 3秒自动保存
const saveStatus = ref('saved'); // saved, saving, changed

// 编辑器配置
const editorConfig = reactive({
  theme: 'vs',
  fontFamily: 'Consolas, Monaco, monospace',
  fontSize: 14,
  tabSize: 2
});

const snippetForm = reactive({
  title: '',
  desc: '',
  code: '',
  language: 'javascript',
  folderId: null,
  tagIds: [],
  isCollect: false
});

// 原始值用于检测变化
const originalValues = reactive({
  title: '',
  desc: '',
  code: '',
  language: '',
  folderId: null,
  tagIds: []
});

// 自动保存状态文本
const saveStatusText = computed(() => {
  switch (saveStatus.value) {
    case 'saved':
      return '已保存';
    case 'saving':
      return '保存中...';
    case 'changed':
      return '未保存';
    default:
      return '';
  }
});

// 监听当前片段变化
watch(currentSnippet, async (newVal) => {
  if (newVal) {
    const tagIds = parseTagIds(newVal.tag_ids);
    Object.assign(snippetForm, {
      title: newVal.title,
      desc: newVal.desc,
      code: newVal.code,
      language: newVal.language,
      folderId: newVal.folder_id,
      tagIds: tagIds,
      isCollect: newVal.is_collect === 1
    });
    
    // 保存原始值用于检测变化
    Object.assign(originalValues, {
      title: newVal.title,
      desc: newVal.desc,
      code: newVal.code,
      language: newVal.language,
      folderId: newVal.folder_id,
      tagIds: [...tagIds]
    });
    
    saveStatus.value = 'saved';
    
    await nextTick();
    initEditor();
  }
});

// 解析标签 ID
const parseTagIds = (tagIdsStr) => {
  if (!tagIdsStr) return [];
  return tagIdsStr.split(',').map(id => parseInt(id));
};

// 初始化编辑器
const initEditor = () => {
  if (!editorContainer.value) return;
  
  // 销毁旧编辑器
  if (editor.value) {
    editor.value.dispose();
  }
  
  // 创建新编辑器
  editor.value = monaco.editor.create(editorContainer.value, {
    value: snippetForm.code,
    language: snippetForm.language,
    theme: editorConfig.theme,
    fontSize: editorConfig.fontSize,
    fontFamily: editorConfig.fontFamily,
    tabSize: editorConfig.tabSize,
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    renderLineHighlight: 'line',
    folding: true,
    foldingHighlight: true,
    formatOnPaste: true,
    formatOnType: true,
    padding: { top: 16, bottom: 16 },
    scrollbar: {
      verticalScrollbarSize: 12,
      horizontalScrollbarSize: 12
    }
  });
  
  // 监听内容变化
  editor.value.onDidChangeModelContent(() => {
    snippetForm.code = editor.value.getValue();
    handleContentChange();
  });
};

// 检测内容是否发生变化
const hasChanges = () => {
  if (snippetForm.title !== originalValues.title) return true;
  if (snippetForm.desc !== originalValues.desc) return true;
  if (snippetForm.code !== originalValues.code) return true;
  if (snippetForm.language !== originalValues.language) return true;
  if (snippetForm.folderId !== originalValues.folderId) return true;
  if (JSON.stringify(snippetForm.tagIds) !== JSON.stringify(originalValues.tagIds)) return true;
  return false;
};

// 内容变化时触发自动保存
const handleContentChange = () => {
  if (!currentSnippet.value) return;
  
  saveStatus.value = 'changed';
  
  // 清除之前的定时器
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value);
  }
  
  // 设置新的定时器
  autoSaveTimer.value = setTimeout(async () => {
    await autoSave();
  }, autoSaveDelay);
};

// 自动保存
const autoSave = async () => {
  if (!window.electronAPI || !currentSnippet.value) return;
  if (!hasChanges()) return;
  
  saveStatus.value = 'saving';
  
  try {
    await window.electronAPI.updateSnippet({
      id: currentSnippet.value.id,
      title: snippetForm.title,
      desc: snippetForm.desc,
      code: snippetForm.code,
      language: snippetForm.language,
      folder_id: snippetForm.folderId,
      tagIds: snippetForm.tagIds
    });
    
    // 更新原始值
    Object.assign(originalValues, {
      title: snippetForm.title,
      desc: snippetForm.desc,
      code: snippetForm.code,
      language: snippetForm.language,
      folderId: snippetForm.folderId,
      tagIds: [...snippetForm.tagIds]
    });
    
    saveStatus.value = 'saved';
  } catch (error) {
    saveStatus.value = 'changed';
    console.error('自动保存失败:', error);
  }
};

// 组件卸载时清除定时器
onUnmounted(() => {
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value);
  }
});

// 主题切换
const handleThemeChange = () => {
  if (editor.value) {
    monaco.editor.setTheme(editorConfig.theme);
  }
};

// 字体切换
const handleFontChange = () => {
  if (editor.value) {
    editor.value.updateOptions({ fontFamily: editorConfig.fontFamily });
  }
};

// 字号调整
const handleFontSizeChange = () => {
  if (editor.value) {
    editor.value.updateOptions({ fontSize: editorConfig.fontSize });
  }
};

// 缩进大小调整
const handleTabSizeChange = () => {
  if (editor.value) {
    editor.value.updateOptions({ tabSize: editorConfig.tabSize });
  }
};

// 加载标签和文件夹
onMounted(async () => {
  await Promise.all([
    loadTags(),
    loadFolders()
  ]);
  
  // 加载编辑器配置
  loadEditorConfig();
});

// 加载标签
async function loadTags() {
  if (!window.electronAPI) return;
  
  try {
    tags.value = await window.electronAPI.getTags();
  } catch (error) {
    console.error('加载标签失败:', error);
  }
}

// 加载文件夹
async function loadFolders() {
  if (!window.electronAPI) return;
  
  try {
    const folders = await window.electronAPI.getFolders();
    folderOptions.value = buildFolderTree(folders);
  } catch (error) {
    console.error('加载文件夹失败:', error);
  }
}

// 构建文件夹树
const buildFolderTree = (folders) => {
  const folderMap = new Map();
  const rootFolders = [];
  
  folders.forEach(folder => {
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name,
      children: []
    });
  });
  
  folders.forEach(folder => {
    const parentId = folder.parent_id || 0;
    const currentFolder = folderMap.get(folder.id);
    
    if (parentId === 0 || !folderMap.has(parentId)) {
      rootFolders.push(currentFolder);
    } else {
      const parentFolder = folderMap.get(parentId);
      if (parentFolder) {
        parentFolder.children.push(currentFolder);
      }
    }
  });
  
  return rootFolders;
};

// 加载编辑器配置
async function loadEditorConfig() {
  if (!window.electronAPI) return;
  
  try {
    const config = await window.electronAPI.getAllConfig();
    
    if (config.editor_theme) {
      editorConfig.theme = config.editor_theme;
    }
    if (config.editor_font_size) {
      editorConfig.fontSize = parseInt(config.editor_font_size);
    }
    if (config.editor_font_family) {
      editorConfig.fontFamily = config.editor_font_family;
    }
    if (config.editor_tab_size) {
      editorConfig.tabSize = parseInt(config.editor_tab_size);
    }
  } catch (error) {
    console.error('加载编辑器配置失败:', error);
  }
}

// 保存编辑器配置
async function saveEditorConfig() {
  if (!window.electronAPI) return;
  
  try {
    await Promise.all([
      window.electronAPI.saveConfig('editor_theme', editorConfig.theme),
      window.electronAPI.saveConfig('editor_font_size', editorConfig.fontSize.toString()),
      window.electronAPI.saveConfig('editor_font_family', editorConfig.fontFamily),
      window.electronAPI.saveConfig('editor_tab_size', editorConfig.tabSize.toString())
    ]);
  } catch (error) {
    console.error('保存编辑器配置失败:', error);
  }
}

// 复制代码
const handleCopy = async () => {
  if (!window.electronAPI) return;
  
  try {
    await window.electronAPI.copyToClipboard(snippetForm.code);
    ElMessage.success('代码已复制到剪贴板');
  } catch (error) {
    ElMessage.error('复制失败');
  }
};

// 格式化代码
const handleFormat = async () => {
  if (editor.value) {
    try {
      // 先尝试使用 Monaco 内置格式化
      const formatted = await editor.value.getAction('editor.action.formatDocument').run();
      if (formatted) {
        ElMessage.success('代码格式化完成');
      }
    } catch (error) {
      ElMessage.warning('当前语言暂不支持格式化');
    }
  }
};

// 保存片段
const handleSave = async () => {
  if (!window.electronAPI || !currentSnippet.value) return;
  
  try {
    await window.electronAPI.updateSnippet({
      id: currentSnippet.value.id,
      title: snippetForm.title,
      desc: snippetForm.desc,
      code: snippetForm.code,
      language: snippetForm.language,
      folder_id: snippetForm.folderId,
      tagIds: snippetForm.tagIds
    });
    ElMessage.success('保存成功');
    
    // 同时保存编辑器配置
    await saveEditorConfig();
  } catch (error) {
    ElMessage.error('保存失败');
  }
};

// 切换收藏
const handleToggleCollect = async () => {
  if (!window.electronAPI || !currentSnippet.value) return;
  
  try {
    await window.electronAPI.toggleCollect(currentSnippet.value.id);
    snippetForm.isCollect = !snippetForm.isCollect;
    ElMessage.success(snippetForm.isCollect ? '已收藏' : '已取消收藏');
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

// 删除片段
const handleDelete = async () => {
  if (!window.electronAPI || !currentSnippet.value) return;
  
  try {
    await ElMessageBox.confirm('确定要删除这个代码片段吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await window.electronAPI.deleteSnippet(currentSnippet.value.id);
    ElMessage.success('已移入回收站');
    currentSnippet.value = null;
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};
</script>

<style lang="scss" scoped>
.code-editor-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.snippet-info {
  padding: 15px;
  border-bottom: 1px solid #e4e7ed;
  
  .title-input {
    margin-bottom: 10px;
  }
  
  .desc-input {
    margin-bottom: 10px;
  }
  
  .info-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
}

.editor-toolbar {
  padding: 10px 15px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  gap: 10px;
  align-items: center;
  background-color: #fafafa;
  
  .editor-settings {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-left: auto;
    margin-right: auto;
  }
  
  .save-status {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    
    &.saved {
      color: #67c23a;
      background-color: #f0f9eb;
    }
    
    &.saving {
      color: #e6a23c;
      background-color: #fdf6ec;
    }
    
    &.changed {
      color: #f56c6c;
      background-color: #fef0f0;
    }
  }
  
  .right-actions {
    display: flex;
    gap: 10px;
  }
}

.monaco-editor {
  flex: 1;
  overflow: hidden;
}
</style>
