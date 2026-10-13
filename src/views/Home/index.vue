<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <img src="/logo.svg" alt="CodeSnap" />
          <span>CodeSnap</span>
        </div>
        
        <SearchBar @search="handleSearch" />
      </div>
      
      <div class="header-right">
        <el-button type="primary" @click="handleCreateSnippet">
          <el-icon><Plus /></el-icon>
          新建片段
        </el-button>
        
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        
        <el-button @click="handleSetting">
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </header>
    
    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 左侧侧边栏 -->
      <aside class="sidebar" :style="{ width: sidebarWidth + 'px' }">
        <Sidebar />
      </aside>
      
      <!-- 中间片段列表 -->
      <section class="snippet-list">
        <SnippetList :refresh-trigger="refreshListTrigger" />
      </section>
      
      <!-- 右侧编辑区 -->
      <section class="editor-area">
        <CodeEditor />
      </section>
    </div>
    
    <SnippetForm
      v-model:visible="showSnippetForm"
      @created="handleSnippetCreated"
    />
  </div>
</template>

<script setup>
import { ref, provide } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Upload, Download, Setting } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import Sidebar from '@/components/Sidebar/index.vue';
import SnippetList from '@/components/SnippetList/index.vue';
import CodeEditor from '@/components/CodeEditor/index.vue';
import SearchBar from '@/components/SearchBar/index.vue';
import SnippetForm from '@/components/SnippetForm/index.vue';

const router = useRouter();
const sidebarWidth = ref(240);
const showSnippetForm = ref(false);
const refreshListTrigger = ref(0);

provide('refreshList', () => {
  refreshListTrigger.value++;
});

// 搜索
const handleSearch = (keyword) => {
  router.push({
    path: '/search',
    query: { keyword }
  });
};

// 新建片段
const handleCreateSnippet = () => {
  showSnippetForm.value = true;
};

const handleSnippetCreated = () => {
  refreshListTrigger.value++;
};

// 导入
const handleImport = async () => {
  if (!window.electronAPI) return;
  
  try {
    const result = await window.electronAPI.importSnippets();
    if (result.success) {
      ElMessage.success(`成功导入 ${result.count} 个片段`);
    } else {
      ElMessage.warning(result.message);
    }
  } catch (error) {
    ElMessage.error('导入失败');
  }
};

// 导出
const handleExport = async () => {
  if (!window.electronAPI) return;
  
  try {
    const result = await window.electronAPI.getSnippets({ page: 1, pageSize: 1000 });
    const snippets = result.list;
    
    // 显示格式选择对话框
    const { value: format } = await ElMessageBox.confirm(
      '请选择导出格式',
      '导出代码片段',
      {
        confirmButtonText: 'JSON',
        cancelButtonText: '取消',
        type: 'info',
        distinguishCancelAndClose: true
      }
    ).catch(() => ({ value: null }));
    
    if (!format) {
      // 显示其他格式选项
      ElMessage.info('导出功能开发中，支持 JSON/MD/TXT 格式');
      return;
    }
    
    const exportResult = await window.electronAPI.exportAllSnippets(snippets, format);
    if (exportResult.success) {
      ElMessage.success('导出成功');
    } else {
      ElMessage.warning(exportResult.message);
    }
  } catch (error) {
    ElMessage.error('导出失败');
  }
};

// 监听托盘新建片段事件
if (window.electronAPI) {
  window.electronAPI.on('tray:newSnippet', handleCreateSnippet);
}

// 设置
const handleSetting = () => {
  router.push('/setting');
};
</script>

<style lang="scss" scoped>
.home-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
    
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #409EFF;
      
      img {
        width: 32px;
        height: 32px;
      }
    }
    
    :deep(.search-input) {
      width: 400px;
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 1000;
    position: relative;
  }
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  
  .sidebar {
    background-color: #fff;
    border-right: 1px solid #e4e7ed;
    overflow-y: auto;
  }
  
  .snippet-list {
    flex: 0 0 300px;
    background-color: #fff;
    border-right: 1px solid #e4e7ed;
    overflow-y: auto;
  }
  
  .editor-area {
    flex: 1;
    background-color: #fff;
    overflow: hidden;
  }
}
</style>
