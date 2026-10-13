<template>
  <div class="snippet-list-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="left-tools">
        <el-select v-model="sortBy" placeholder="排序方式" size="small" style="width: 120px">
          <el-option label="更新时间" value="update_time" />
          <el-option label="创建时间" value="create_time" />
          <el-option label="查看次数" value="view_count" />
        </el-select>
        
        <el-button-group>
          <el-button size="small" @click="toggleOrder">
            <el-icon>
              <Sort v-if="orderType === 'ASC'" />
              <SortDown v-else />
            </el-icon>
          </el-button>
        </el-button-group>
      </div>
      
      <!-- 批量操作工具栏 -->
      <div v-if="selectedIds.length > 0" class="batch-tools">
        <span class="selected-count">已选择 {{ selectedIds.length }} 项</span>
        <el-button size="small" @click="handleBatchMove">
          <el-icon><Folder /></el-icon>
          移动
        </el-button>
        <el-button size="small" @click="handleBatchTag">
          <el-icon><PriceTag /></el-icon>
          打标签
        </el-button>
        <el-button size="small" type="danger" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>
          删除
        </el-button>
        <el-button size="small" @click="clearSelection">
          取消选择
        </el-button>
      </div>
    </div>
    
    <!-- 虚拟滚动列表 -->
    <div 
      ref="listContainer"
      class="virtual-list-container"
      @scroll="handleScroll"
    >
      <!-- 占位容器 -->
      <div 
        class="scroll-placeholder"
        :style="{ height: totalHeight + 'px' }"
      ></div>
      
      <!-- 可见区域内容 -->
      <div 
        class="visible-content"
        :style="{ transform: 'translateY(' + translateY + 'px)' }"
      >
        <div
          v-for="snippet in visibleSnippets"
          :key="snippet.id"
          class="snippet-item"
          :class="{ 
            active: currentSnippetId === snippet.id,
            selected: selectedIds.includes(snippet.id)
          }"
          @click="handleSnippetClick(snippet, $event)"
          @contextmenu.prevent="handleContextMenu(snippet, $event)"
        >
          <!-- 多选框 -->
          <el-checkbox 
            v-model="selectedIds" 
            :label="snippet.id"
            class="checkbox"
            @click.stop
          />
          
          <div class="snippet-content">
            <div class="snippet-header">
              <div class="title">{{ snippet.title }}</div>
              <div class="header-actions">
                <el-icon
                  v-if="snippet.is_collect"
                  class="collect-icon"
                  :size="16"
                  color="#F56C6C"
                >
                  <Star />
                </el-icon>
                <el-icon
                  v-else
                  class="collect-icon"
                  :size="16"
                  color="#c0c4cc"
                >
                  <Star />
                </el-icon>
              </div>
            </div>
            
            <div class="snippet-desc">{{ snippet.desc || '暂无描述' }}</div>
            
            <div class="snippet-footer">
              <div class="tags">
                <el-tag 
                  v-for="tag in snippet.tags" 
                  :key="tag.id"
                  :color="tag.color"
                  size="mini" 
                  effect="plain"
                >
                  {{ tag.name }}
                </el-tag>
              </div>
              <div class="meta">
                <el-tag size="small" effect="plain">{{ snippet.language }}</el-tag>
                <span class="time">{{ formatTime(snippet.update_time) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-if="snippets.length === 0" class="empty-state">
      <el-empty description="暂无代码片段" />
    </div>
    
    <!-- 右键菜单 -->
    <div 
      v-if="showContextMenu" 
      class="context-menu"
      :style="contextMenuStyle"
      @click.stop
    >
      <div class="menu-item" @click="handleCopyCode">
        <el-icon><DocumentCopy /></el-icon>
        <span>复制代码</span>
      </div>
      <div class="menu-item" @click="handleEditSnippet">
        <el-icon><Edit /></el-icon>
        <span>编辑</span>
      </div>
      <div class="menu-item" @click="handleMoveSnippet">
        <el-icon><Folder /></el-icon>
        <span>移动到文件夹</span>
      </div>
      <div class="menu-item" @click="handleAddTag">
        <el-icon><PriceTag /></el-icon>
        <span>添加标签</span>
      </div>
      <div class="menu-item" @click="handleToggleCollect">
        <el-icon><Star /></el-icon>
        <span>{{ contextMenuSnippet?.is_collect ? '取消收藏' : '收藏' }}</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item danger" @click="handleDeleteSnippet">
        <el-icon><Delete /></el-icon>
        <span>删除</span>
      </div>
    </div>
    
    <!-- 移动到文件夹弹窗 -->
    <el-dialog title="移动到文件夹" :visible.sync="showMoveDialog" width="400px">
      <el-tree
        :data="folderTreeData"
        :props="treeProps"
        :default-expand-all="true"
        class="folder-tree-select"
        @node-click="handleSelectFolder"
      />
      <template #footer>
        <el-button @click="showMoveDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmMove">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 添加标签弹窗 -->
    <el-dialog title="添加标签" :visible.sync="showTagDialog" width="400px">
      <div class="tag-select-container">
        <div class="existing-tags">
          <span class="label">已有标签：</span>
          <div class="tags-wrapper">
            <el-tag
              v-for="tag in allTags"
              :key="tag.id"
              :color="tag.color"
              :class="{ selected: selectedTagIds.includes(tag.id) }"
              effect="plain"
              @click="toggleTagSelection(tag.id)"
            >
              {{ tag.name }}
            </el-tag>
          </div>
        </div>
        <div class="new-tag">
          <span class="label">新建标签：</span>
          <el-input 
            v-model="newTagName" 
            placeholder="输入标签名称"
            @keyup.enter="addNewTag"
          />
          <el-button size="small" @click="addNewTag">添加</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="showTagDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddTags">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { Sort, SortDown, Star, DocumentCopy, Edit, Folder, PriceTag, Delete } from '@element-plus/icons-vue';
import { ElMessageBox, ElMessage, ElDialog, ElTree, ElInput, ElButton, ElCheckbox } from 'element-plus';
import dayjs from 'dayjs';

const props = defineProps({
  refreshTrigger: {
    type: Number,
    default: 0
  }
});

watch(() => props.refreshTrigger, () => {
  loadSnippets();
});

// 排序配置
const sortBy = ref('update_time');
const orderType = ref('DESC');
// 数据
const snippets = ref([]);
const allTags = ref([]);
const folders = ref([]);
const currentSnippetId = ref(null);
const selectedIds = ref([]);
// 虚拟滚动相关
const listContainer = ref(null);
const itemHeight = 100; // 每个列表项的高度
const visibleCount = ref(20); // 可见数量
const scrollTop = ref(0); // 滚动位置
const translateY = ref(0); // 偏移量
// 右键菜单相关
const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const contextMenuSnippet = ref(null);
// 弹窗相关
const showMoveDialog = ref(false);
const showTagDialog = ref(false);
const selectedFolderId = ref(null);
const selectedTagIds = ref([]);
const newTagName = ref('');
// 计算总高度
const totalHeight = computed(() => snippets.value.length * itemHeight);
// 计算可见片段
const visibleSnippets = computed(() => {
 const startIndex = Math.floor(scrollTop.value / itemHeight);
 const endIndex = Math.min(startIndex + visibleCount.value + 10, snippets.value.length);
 return snippets.value.slice(startIndex, endIndex);
});
// 文件夹树数据
const folderTreeData = computed(() => {
 const folderMap = new Map();
 const rootFolders = [];
 folders.value.forEach(folder => {
 folderMap.set(folder.id, {
 id: folder.id,
 label: folder.name,
 children: []
 });
 });
 folders.value.forEach(folder => {
 const parentId = folder.parent_id || 0;
 const currentFolder = folderMap.get(folder.id);
 if (parentId === 0 || !folderMap.has(parentId)) {
 rootFolders.push(currentFolder);
 }
 else {
 const parentFolder = folderMap.get(parentId);
 if (parentFolder) {
 parentFolder.children.push(currentFolder);
 }
 }
 });
 return rootFolders;
});
const treeProps = {
 children: 'children',
 label: 'label'
};
// 右键菜单样式
const contextMenuStyle = computed(() => ({
 left: `${contextMenuPosition.value.x}px`,
 top: `${contextMenuPosition.value.y}px`
}));
// 加载数据
onMounted(async () => {
 await loadSnippets();
 await loadTags();
 await loadFolders();
 // 计算可见数量
 await nextTick(() => {
 if (listContainer.value) {
 const containerHeight = listContainer.value.clientHeight;
 visibleCount.value = Math.ceil(containerHeight / itemHeight) + 5;
 }
 });
});
// 加载片段
async function loadSnippets() {
 if (!window.electronAPI)
 return;
 try {
 const result = await window.electronAPI.getSnippets({
 orderBy: sortBy.value,
 orderType: orderType.value,
 pageSize: 1000 // 加载所有数据用于虚拟滚动
 });
 snippets.value = result.list || result;
 }
 catch (error) {
 console.error('加载片段列表失败:', error);
 }
}
// 加载标签
async function loadTags() {
 if (!window.electronAPI)
 return;
 try {
 const result = await window.electronAPI.getTags();
 allTags.value = result;
 }
 catch (error) {
 console.error('加载标签失败:', error);
 }
}
// 加载文件夹
async function loadFolders() {
 if (!window.electronAPI)
 return;
 try {
 const result = await window.electronAPI.getFolders();
 folders.value = result;
 }
 catch (error) {
 console.error('加载文件夹失败:', error);
 }
}
// 滚动处理
const handleScroll = (e) => {
 scrollTop.value = e.target.scrollTop;
 translateY.value = scrollTop.value - (scrollTop.value % itemHeight);
};
// 点击片段
const handleSnippetClick = (snippet, event) => {
 // 如果是 Ctrl/Cmd 点击，添加到选择
 if ((event.ctrlKey || event.metaKey) && snippet) {
 const index = selectedIds.value.indexOf(snippet.id);
 if (index > -1) {
 selectedIds.value.splice(index, 1);
 }
 else {
 selectedIds.value.push(snippet.id);
 }
 }
 else {
 currentSnippetId.value = snippet.id;
 // 如果不是 shift 点击，清空选择
 if (!event.shiftKey) {
 selectedIds.value = [];
 }
 }
};
// 切换排序顺序
const toggleOrder = () => {
 orderType.value = orderType.value === 'DESC' ? 'ASC' : 'DESC';
 loadSnippets();
};
// 格式化时间
const formatTime = (time) => {
 return dayjs(time).format('MM-DD HH:mm');
};
// 右键菜单
const handleContextMenu = (snippet, e) => {
 contextMenuSnippet.value = snippet;
 contextMenuPosition.value = {
 x: e.clientX,
 y: e.clientY
 };
 showContextMenu.value = true;
 document.addEventListener('click', closeContextMenu);
};
const closeContextMenu = () => {
 showContextMenu.value = false;
 document.removeEventListener('click', closeContextMenu);
};
// 复制代码
const handleCopyCode = async () => {
 if (!contextMenuSnippet.value)
 return;
 try {
 await window.electronAPI.copyToClipboard(contextMenuSnippet.value.code);
 ElMessage.success('代码已复制到剪贴板');
 }
 catch (error) {
 ElMessage.error('复制失败');
 }
 closeContextMenu();
};
// 编辑片段
const handleEditSnippet = () => {
 if (!contextMenuSnippet.value)
 return;
 currentSnippetId.value = contextMenuSnippet.value.id;
 ElMessage.info('请在右侧编辑器中编辑');
 closeContextMenu();
};
// 移动片段
const handleMoveSnippet = () => {
 if (!contextMenuSnippet.value)
 return;
 showMoveDialog.value = true;
 selectedFolderId.value = contextMenuSnippet.value.folder_id || null;
 closeContextMenu();
};
// 选择文件夹
const handleSelectFolder = (data) => {
 selectedFolderId.value = data.id;
};
// 确认移动
const confirmMove = async () => {
 try {
 // 判断是批量操作还是单个操作
 if (selectedIds.value.length > 0) {
 // 批量移动
 await window.electronAPI.batchMoveSnippets(selectedIds.value, selectedFolderId.value || null);
 ElMessage.success(`已移动 ${selectedIds.value.length} 个片段`);
 selectedIds.value = [];
 }
 else if (contextMenuSnippet.value) {
 // 单个移动
 await window.electronAPI.updateSnippet({
 id: contextMenuSnippet.value.id,
 folder_id: selectedFolderId.value || null
 });
 ElMessage.success('移动成功');
 }
 await loadSnippets();
 }
 catch (error) {
 ElMessage.error('移动失败');
 }
 showMoveDialog.value = false;
};
// 添加标签
const handleAddTag = () => {
 if (!contextMenuSnippet.value)
 return;
 showTagDialog.value = true;
 // 加载当前片段的标签
 selectedTagIds.value = contextMenuSnippet.value.tags?.map(t => t.id) || [];
 closeContextMenu();
};
// 切换标签选择
const toggleTagSelection = (tagId) => {
 const index = selectedTagIds.value.indexOf(tagId);
 if (index > -1) {
 selectedTagIds.value.splice(index, 1);
 }
 else {
 selectedTagIds.value.push(tagId);
 }
};
// 添加新标签
const addNewTag = async () => {
 if (!newTagName.value.trim())
 return;
 try {
 const result = await window.electronAPI.addTag({ name: newTagName.value.trim() });
 await loadTags();
 // 自动选中新添加的标签
 selectedTagIds.value.push(result.id);
 newTagName.value = '';
 }
 catch (error) {
 ElMessage.error('创建标签失败');
 }
};
// 确认添加标签
const confirmAddTags = async () => {
 try {
 // 判断是批量操作还是单个操作
 if (selectedIds.value.length > 0) {
 // 批量更新标签
 await window.electronAPI.batchUpdateSnippetTags(selectedIds.value, selectedTagIds.value);
 ElMessage.success(`已为 ${selectedIds.value.length} 个片段更新标签`);
 selectedIds.value = [];
 }
 else if (contextMenuSnippet.value) {
 // 单个更新标签
 await window.electronAPI.updateSnippetTags(contextMenuSnippet.value.id, selectedTagIds.value);
 ElMessage.success('标签更新成功');
 }
 await loadSnippets();
 }
 catch (error) {
 ElMessage.error('更新失败');
 }
 showTagDialog.value = false;
};
// 切换收藏
const handleToggleCollect = async () => {
 if (!contextMenuSnippet.value)
 return;
 try {
 await window.electronAPI.toggleCollect(contextMenuSnippet.value.id);
 ElMessage.success(contextMenuSnippet.value.is_collect ? '已取消收藏' : '已收藏');
 await loadSnippets();
 }
 catch (error) {
 ElMessage.error('操作失败');
 }
 closeContextMenu();
};
// 删除片段
const handleDeleteSnippet = async () => {
 if (!contextMenuSnippet.value)
 return;
 const confirm = await ElMessageBox.confirm('确定要删除这个片段吗？', '删除确认', {
 type: 'warning'
 });
 if (confirm !== 'confirm') {
 closeContextMenu();
 return;
 }
 try {
 await window.electronAPI.deleteSnippet(contextMenuSnippet.value.id);
 ElMessage.success('删除成功');
 await loadSnippets();
 }
 catch (error) {
 ElMessage.error('删除失败');
 }
 closeContextMenu();
};
// 批量移动
const handleBatchMove = () => {
 if (selectedIds.value.length === 0)
 return;
 showMoveDialog.value = true;
 selectedFolderId.value = null;
};
// 批量打标签
const handleBatchTag = () => {
 if (selectedIds.value.length === 0)
 return;
 showTagDialog.value = true;
 selectedTagIds.value = [];
};
// 批量删除
const handleBatchDelete = async () => {
 if (selectedIds.value.length === 0)
 return;
 const confirm = await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个片段吗？`, '批量删除确认', {
 type: 'warning'
 });
 if (confirm !== 'confirm')
 return;
 try {
 // 使用批量删除API
 await window.electronAPI.batchDeleteSnippets(selectedIds.value);
 ElMessage.success(`已删除 ${selectedIds.value.length} 个片段`);
 selectedIds.value = [];
 await loadSnippets();
 }
 catch (error) {
 ElMessage.error('删除失败');
 }
};
// 清空选择
const clearSelection = () => {
 selectedIds.value = [];
};
// 监听排序变化
watch([sortBy, orderType], () => {
 loadSnippets();
});
</script>

<style lang="scss" scoped>
.snippet-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.toolbar {
  padding: 10px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .left-tools {
    display: flex;
    gap: 10px;
  }
  
  .batch-tools {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .selected-count {
      font-size: 13px;
      color: #606266;
      margin-right: 8px;
    }
  }
}

.virtual-list-container {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.scroll-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.visible-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  transition: transform 0.05s ease-out;
}

.snippet-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border-bottom: 1px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #fff;
  
  &:hover {
    background-color: #f5f7fa;
  }
  
  &.active {
    background-color: #ecf5ff;
    border-left: 3px solid #409EFF;
  }
  
  &.selected {
    background-color: #f0f5ff;
    
    .checkbox {
      .el-checkbox__input.is-checked .el-checkbox__inner {
        background-color: #409EFF;
        border-color: #409EFF;
      }
    }
  }
  
  .checkbox {
    margin-right: 10px;
    margin-top: 2px;
    flex-shrink: 0;
  }
  
  .snippet-content {
    flex: 1;
    min-width: 0;
  }
  
  .snippet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    
    .title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      margin-right: 8px;
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      
      .collect-icon {
        cursor: pointer;
        transition: color 0.2s;
        
        &:hover {
          color: #F56C6C;
        }
      }
    }
  }
  
  .snippet-desc {
    font-size: 12px;
    color: #909399;
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .snippet-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      flex: 1;
    }
    
    .meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: 8px;
      
      .time {
        font-size: 12px;
        color: #c0c4cc;
      }
    }
  }
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.context-menu {
  position: fixed;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 160px;
  
  .menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
    color: #606266;
    
    &:hover {
      background-color: #f5f7fa;
    }
    
    &.danger {
      color: #F56C6C;
      
      &:hover {
        background-color: #fef0f0;
      }
    }
  }
  
  .menu-divider {
    height: 1px;
    background-color: #e4e7ed;
    margin: 4px 0;
  }
}

.folder-tree-select {
  max-height: 300px;
  overflow-y: auto;
}

.tag-select-container {
  .existing-tags, .new-tag {
    margin-bottom: 16px;
    
    .label {
      font-size: 13px;
      color: #606266;
      margin-bottom: 8px;
      display: block;
    }
  }
  
  .tags-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    
    .el-tag {
      cursor: pointer;
      transition: all 0.2s;
      
      &.selected {
        background-color: #409EFF;
        color: #fff;
        border-color: #409EFF;
      }
    }
  }
  
  .new-tag {
    display: flex;
    gap: 8px;
    align-items: center;
    
    .el-input {
      flex: 1;
    }
  }
}
</style>
