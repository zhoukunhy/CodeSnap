<template>
  <div class="search-wrapper" ref="searchWrapper">
    <el-autocomplete
      v-model="keyword"
      :fetch-suggestions="handleSearch"
      :trigger-on-focus="false"
      :debounce="300"
      placeholder="搜索代码片段..."
      class="search-input"
      @select="handleSelectSuggestion"
      @focus="handleFocus"
      @blur="handleBlur"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
      
      <template #suffix>
        <div v-if="keyword" class="suffix-icons">
          <el-button type="text" @click="clearKeyword" size="small">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </template>
      
      <template #default="{ item }">
        <div class="suggestion-item" :class="{ 'history-item': item.isHistory }">
          <el-icon v-if="item.isHistory" size="14"><Refresh /></el-icon>
          <el-icon v-else size="14"><Document /></el-icon>
          <span>{{ item.title }}</span>
          <span v-if="item.language" class="language-tag">{{ item.language }}</span>
        </div>
      </template>
    </el-autocomplete>
    
    <!-- 搜索历史下拉面板 -->
    <div 
      v-if="showHistory && !keyword && searchHistory.length > 0" 
      class="search-history-panel"
    >
      <div class="history-header">
        <span>搜索历史</span>
        <el-button type="text" size="small" @click="clearHistory">清空历史</el-button>
      </div>
      <div class="history-list">
        <div 
          v-for="(item, index) in searchHistory" 
          :key="index"
          class="history-item"
          @click="handleHistoryClick(item)"
        >
          <el-icon size="14"><Refresh /></el-icon>
          <span>{{ item }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>import { ref, onMounted } from 'vue';
import { Search, Close, Refresh, Document } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
const emit = defineEmits(['search']);
const searchWrapper = ref(null);
const keyword = ref('');
const showHistory = ref(false);
const searchHistory = ref([]);
const searchResults = ref([]);
// 防抖定时器
let debounceTimer = null;
// 加载搜索历史
onMounted(() => {
 loadSearchHistory();
});
// 加载搜索历史
const loadSearchHistory = async () => {
 if (!window.electronAPI)
 return;
 try {
 const history = await window.electronAPI.getConfig('search_history');
 if (history) {
 searchHistory.value = JSON.parse(history);
 }
 }
 catch (error) {
 console.error('加载搜索历史失败:', error);
 }
};
// 保存搜索历史
const saveSearchHistory = async (keyword) => {
 if (!window.electronAPI || !keyword.trim())
 return;
 try {
 // 移除重复项
 searchHistory.value = searchHistory.value.filter(item => item !== keyword.trim());
 // 添加到开头
 searchHistory.value.unshift(keyword.trim());
 // 最多保存10条历史
 if (searchHistory.value.length > 10) {
 searchHistory.value = searchHistory.value.slice(0, 10);
 }
 await window.electronAPI.saveConfig('search_history', JSON.stringify(searchHistory.value));
 }
 catch (error) {
 console.error('保存搜索历史失败:', error);
 }
};
// 清空搜索历史
const clearHistory = async () => {
 if (!window.electronAPI)
 return;
 try {
 searchHistory.value = [];
 await window.electronAPI.saveConfig('search_history', '[]');
 ElMessage.success('搜索历史已清空');
 }
 catch (error) {
 console.error('清空搜索历史失败:', error);
 }
};
// 防抖搜索
const handleSearch = async (queryString, callback) => {
 if (!queryString.trim()) {
 callback([]);
 return;
 }
 // 清除之前的定时器
 if (debounceTimer) {
 clearTimeout(debounceTimer);
 }
 debounceTimer = setTimeout(async () => {
 try {
 const results = await window.electronAPI.searchSnippets(queryString.trim());
 searchResults.value = results.map(item => ({
 id: item.id,
 title: item.title,
 language: item.language,
 isHistory: false
 }));
 callback(searchResults.value);
 }
 catch (error) {
 console.error('搜索失败:', error);
 callback([]);
 }
 }, 300);
};
// 选择搜索建议
const handleSelectSuggestion = (item) => {
 if (!item.isHistory) {
 // 保存到搜索历史
 saveSearchHistory(item.title);
 }
 // 触发搜索
 emit('search', keyword.value);
 showHistory.value = false;
};
// 点击搜索历史
const handleHistoryClick = (historyItem) => {
 keyword.value = historyItem;
 showHistory.value = false;
 // 触发搜索
 emit('search', historyItem);
};
// 输入框聚焦
const handleFocus = () => {
 if (!keyword.value) {
 showHistory.value = true;
 }
};
// 输入框失焦
const handleBlur = () => {
 // 延迟关闭，给点击事件留时间
 setTimeout(() => {
 showHistory.value = false;
 }, 200);
};
// 清空关键词
const clearKeyword = () => {
 keyword.value = '';
 showHistory.value = false;
};
// 外部调用搜索
const doSearch = (query) => {
 keyword.value = query;
 saveSearchHistory(query);
 emit('search', query);
};
defineExpose({
 doSearch
});
</script>

<style lang="scss" scoped>
.search-wrapper {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  
  :deep(.el-input__wrapper) {
    border-radius: 8px;
  }
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  
  &.history-item {
    color: #909399;
  }
  
  .language-tag {
    margin-left: auto;
    font-size: 12px;
    padding: 2px 6px;
    background-color: #ecf5ff;
    color: #409eff;
    border-radius: 4px;
  }
}

.search-history-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  
  .history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 15px;
    border-bottom: 1px solid #e4e7ed;
    font-size: 14px;
    font-weight: 500;
    color: #606266;
  }
  
  .history-list {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .history-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 15px;
    cursor: pointer;
    color: #606266;
    
    &:hover {
      background-color: #f5f7fa;
    }
  }
}
</style>
