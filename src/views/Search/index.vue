<template>
  <div class="search-container">
    <!-- 搜索框 -->
    <div class="search-header">
      <SearchBar ref="searchBarRef" @search="handleSearch" />
    </div>
    
    <!-- 搜索结果 -->
    <div class="search-results">
      <div v-if="loading" class="loading-state">
        <el-loading text="搜索中..." />
      </div>
      
      <div v-else-if="snippets.length === 0" class="empty-state">
        <el-empty description="未找到相关代码片段" />
      </div>
      
      <div v-else class="snippet-grid">
        <div 
          v-for="snippet in snippets" 
          :key="snippet.id"
          class="snippet-card"
          @click="handleSelectSnippet(snippet)"
        >
          <div class="card-header">
            <h3 class="snippet-title">{{ snippet.title }}</h3>
            <span class="language-badge">{{ snippet.language }}</span>
          </div>
          
          <p class="snippet-desc">{{ snippet.desc }}</p>
          
          <pre class="snippet-code"><code>{{ truncateCode(snippet.code) }}</code></pre>
          
          <div class="card-footer">
            <span class="update-time">更新于 {{ formatTime(snippet.update_time) }}</span>
            <div class="tags">
              <span 
                v-for="tag in snippet.tags" 
                :key="tag.id"
                class="tag"
                :style="{ backgroundColor: tag.color + '20', color: tag.color }"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import SearchBar from '@/components/SearchBar/index.vue';

const route = useRoute();
const searchBarRef = ref(null);
const snippets = ref([]);
const loading = ref(false);

// 监听路由变化
onMounted(() => {
  const keyword = route.query.keyword;
  if (keyword) {
    doSearch(keyword);
    if (searchBarRef.value) {
      searchBarRef.value.doSearch(keyword);
    }
  }
});

// 搜索
const doSearch = async (keyword) => {
  if (!keyword.trim()) return;
  
  loading.value = true;
  
  try {
    const result = await window.electronAPI.getSnippets({
      keyword: keyword.trim(),
      page: 1,
      pageSize: 20
    });
    snippets.value = result.list;
  } catch (error) {
    console.error('搜索失败:', error);
    snippets.value = [];
  } finally {
    loading.value = false;
  }
};

// 处理搜索
const handleSearch = (keyword) => {
  doSearch(keyword);
};

// 选择片段
const handleSelectSnippet = (snippet) => {
  // 触发事件通知主页面打开编辑器
  window.electronAPI.on('snippet:select', () => {});
};

// 截断代码
const truncateCode = (code) => {
  if (!code) return '';
  const lines = code.split('\n');
  if (lines.length > 5) {
    return lines.slice(0, 5).join('\n') + '\n...';
  }
  return code;
};

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN');
};
</script>

<style lang="scss" scoped>
.search-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.search-header {
  margin-bottom: 20px;
}

.search-results {
  flex: 1;
  overflow-y: auto;
}

.loading-state {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.snippet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.snippet-card {
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  
  .snippet-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }
  
  .language-badge {
    font-size: 12px;
    padding: 2px 8px;
    background-color: #ecf5ff;
    color: #409eff;
    border-radius: 4px;
  }
}

.snippet-desc {
  font-size: 13px;
  color: #606266;
  margin: 0 0 12px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.snippet-code {
  background-color: #f6f8fa;
  padding: 12px;
  border-radius: 4px;
  margin: 0 0 12px 0;
  overflow: hidden;
  
  code {
    font-family: Consolas, Monaco, monospace;
    font-size: 12px;
    line-height: 1.5;
    color: #303133;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .update-time {
    font-size: 12px;
    color: #909399;
  }
  
  .tags {
    display: flex;
    gap: 6px;
    
    .tag {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
    }
  }
}
</style>
