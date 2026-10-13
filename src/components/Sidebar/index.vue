<template>
  <div class="sidebar-container">
    <!-- 常用分组 -->
    <div class="quick-groups">
      <div
        v-for="group in quickGroups"
        :key="group.id"
        class="group-item"
        :class="{ active: activeGroup === group.id }"
        @click="handleGroupClick(group.id)"
      >
        <el-icon :size="18">
          <component :is="group.icon" />
        </el-icon>
        <span>{{ group.name }}</span>
        <span class="count">{{ group.count }}</span>
      </div>
    </div>
    
    <el-divider />
    
    <!-- 文件夹列表（树形结构） -->
    <div class="folder-section">
      <div class="section-header">
        <span>文件夹</span>
        <el-button text size="small" @click="handleAddFolder">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
      
      <div class="folder-tree">
        <div
          v-for="folder in treeFolders"
          :key="folder.id"
        >
          <FolderTreeItem
            :folder="folder"
            :active-folder="activeFolder"
            :level="0"
            @click="handleFolderClick"
            @dragstart="handleDragStart"
            @dragover="handleDragOver"
            @drop="handleDrop"
            @update="handleFolderUpdate"
          />
        </div>
        
        <div v-if="treeFolders.length === 0" class="empty-folder">
          <span>暂无文件夹，点击上方按钮创建</span>
        </div>
      </div>
    </div>
    
    <el-divider />
    
    <!-- 标签列表 -->
    <div class="tag-section">
      <div class="section-header">
        <span>标签</span>
        <el-button text size="small" @click="handleAddTag">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
      
      <div class="tag-list">
        <el-tag
          v-for="tag in tags"
          :key="tag.id"
          :color="tag.color"
          effect="plain"
          class="tag-item"
          @click="handleTagClick(tag.id)"
        >
          {{ tag.name }} ({{ tag.snippet_count }})
        </el-tag>
      </div>
    </div>
    
    <el-divider />
    
    <!-- 语言筛选 -->
    <div class="language-section">
      <div class="section-header">
        <span>编程语言</span>
      </div>
      
      <div class="language-list">
        <div
          v-for="lang in languages"
          :key="lang.language"
          class="language-item"
          :class="{ active: activeLanguage === lang.language }"
          @click="handleLanguageClick(lang.language)"
        >
          <span>{{ lang.language }}</span>
          <span class="count">{{ lang.count }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  Document, 
  Clock, 
  Star, 
  Delete, 
  Plus 
} from '@element-plus/icons-vue';
import FolderTreeItem from './FolderTreeItem.vue';

const activeGroup = ref('all');
const activeFolder = ref(null);
const activeTag = ref(null);
const activeLanguage = ref(null);

const quickGroups = ref([
  { id: 'all', name: '全部片段', icon: 'Document', count: 0 },
  { id: 'recent', name: '最近使用', icon: 'Clock', count: 0 },
  { id: 'collect', name: '我的收藏', icon: 'Star', count: 0 },
  { id: 'trash', name: '回收站', icon: 'Delete', count: 0 }
]);

const folders = ref([]);
const tags = ref([]);
const languages = ref([]);

// 拖拽相关状态
const draggingFolder = ref(null);
const dragOverFolder = ref(null);
const dragOverPosition = ref(''); // 'before', 'after', 'inside'

// 将扁平文件夹列表转换为树形结构
const treeFolders = computed(() => {
  const folderMap = new Map();
  const rootFolders = [];
  
  // 首先将所有文件夹放入 Map
  folders.value.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [] });
  });
  
  // 构建树形结构
  folders.value.forEach(folder => {
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
  
  // 按 sort 字段排序
  const sortBySort = (a, b) => (a.sort || 0) - (b.sort || 0);
  rootFolders.sort(sortBySort);
  
  const sortChildren = (folders) => {
    folders.forEach(folder => {
      folder.children.sort(sortBySort);
      sortChildren(folder.children);
    });
  };
  sortChildren(rootFolders);
  
  return rootFolders;
});

// 加载数据
onMounted(async () => {
  await Promise.all([
    loadFolders(),
    loadTags(),
    loadLanguages()
  ]);
});

// 加载文件夹
async function loadFolders() {
  if (!window.electronAPI) return;
  
  try {
    const result = await window.electronAPI.getFolders();
    folders.value = result;
  } catch (error) {
    console.error('加载文件夹失败:', error);
  }
}

// 加载标签
async function loadTags() {
  if (!window.electronAPI) return;
  
  try {
    const result = await window.electronAPI.getTags();
    tags.value = result;
  } catch (error) {
    console.error('加载标签失败:', error);
  }
}

// 加载语言列表
async function loadLanguages() {
  if (!window.electronAPI) return;
  
  try {
    const result = await window.electronAPI.getLanguages();
    languages.value = result;
  } catch (error) {
    console.error('加载语言列表失败:', error);
  }
}

// 点击分组
const handleGroupClick = (groupId) => {
  activeGroup.value = groupId;
  activeFolder.value = null;
  activeTag.value = null;
  activeLanguage.value = null;
};

// 点击文件夹
const handleFolderClick = (folderId) => {
  activeFolder.value = folderId;
  activeGroup.value = null;
  activeTag.value = null;
  activeLanguage.value = null;
};

// 点击标签
const handleTagClick = (tagId) => {
  activeTag.value = tagId;
  activeGroup.value = null;
  activeFolder.value = null;
  activeLanguage.value = null;
};

// 点击语言
const handleLanguageClick = (language) => {
  activeLanguage.value = language;
  activeGroup.value = null;
  activeFolder.value = null;
  activeTag.value = null;
};

// 新建文件夹
const handleAddFolder = async () => {
  const { value: name } = await ElMessageBox.prompt('请输入文件夹名称', '新建文件夹', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  });
  
  if (!name) {
    ElMessage.warning('请输入文件夹名称');
    return;
  }
  
  try {
    await window.electronAPI.addFolder({ name });
    ElMessage.success('创建成功');
    await loadFolders();
  } catch (error) {
    ElMessage.error('创建失败');
  }
};

// 新建标签
const handleAddTag = async () => {
  const { value: name } = await ElMessageBox.prompt('请输入标签名称', '新建标签', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  });
  
  if (!name) {
    ElMessage.warning('请输入标签名称');
    return;
  }
  
  try {
    await window.electronAPI.addTag({ name });
    ElMessage.success('创建成功');
    await loadTags();
  } catch (error) {
    ElMessage.error('创建失败');
  }
};

// 拖拽开始
const handleDragStart = (folder) => {
  draggingFolder.value = folder;
};

// 拖拽经过
const handleDragOver = (e, folder, position) => {
  e.preventDefault();
  dragOverFolder.value = folder;
  dragOverPosition.value = position;
};

// 放置
const handleDrop = async (targetFolder, position) => {
  if (!draggingFolder.value) return;
  
  const sourceId = draggingFolder.value.id;
  const targetId = targetFolder?.id;
  
  try {
    let updateData = {};
    
    if (position === 'inside') {
      // 放入目标文件夹内（作为子文件夹）
      updateData = {
        id: sourceId,
        parentId: targetId || 0,
        sort: 0
      };
    } else {
      // 放在目标文件夹前面或后面
      // 需要重新计算排序
      updateData = {
        id: sourceId,
        parentId: targetFolder?.parent_id || 0
      };
    }
    
    await window.electronAPI.updateFolder(updateData);
    
    // 如果是前后放置，需要更新排序
    if (position !== 'inside') {
      await updateFolderSort(targetFolder, position);
    }
    
    await loadFolders();
    ElMessage.success('文件夹已移动');
  } catch (error) {
    ElMessage.error('移动失败');
  } finally {
    draggingFolder.value = null;
    dragOverFolder.value = null;
    dragOverPosition.value = '';
  }
};

// 更新文件夹排序
async function updateFolderSort(targetFolder, position) {
  if (!window.electronAPI) return;
  
  const parentId = targetFolder?.parent_id || 0;
  const siblings = folders.value
    .filter(f => f.parent_id === parentId)
    .sort((a, b) => (a.sort || 0) - (b.sort || 0));
  
  const targetIndex = siblings.findIndex(s => s.id === targetFolder.id);
  const sourceIndex = siblings.findIndex(s => s.id === draggingFolder.value.id);
  
  if (sourceIndex === -1 || targetIndex === -1) return;
  
  // 移除源文件夹，插入到目标位置
  siblings.splice(sourceIndex, 1);
  
  const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
  siblings.splice(insertIndex, 0, draggingFolder.value);
  
  // 更新所有兄弟文件夹的排序
  const updatePromises = siblings.map((folder, index) => {
    return window.electronAPI.updateFolder({
      id: folder.id,
      sort: index
    });
  });
  
  await Promise.all(updatePromises);
}

// 更新文件夹信息（重命名、删除等）
const handleFolderUpdate = async (action, folderId, data) => {
  try {
    switch (action) {
      case 'rename':
        await window.electronAPI.renameFolder(folderId, data.name);
        ElMessage.success('重命名成功');
        break;
      case 'delete':
        await window.electronAPI.deleteFolder(folderId);
        ElMessage.success('删除成功');
        if (activeFolder.value === folderId) {
          activeFolder.value = null;
        }
        break;
      case 'add-child':
        await window.electronAPI.addFolder({ name: data.name, parentId: folderId });
        ElMessage.success('创建成功');
        break;
    }
    await loadFolders();
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

import { ElMessageBox, ElMessage } from 'element-plus';
</script>

<style lang="scss" scoped>
.sidebar-container {
  height: 100%;
  padding: 10px 0;
  overflow-y: auto;
}

.quick-groups {
  .group-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background-color: #f5f7fa;
    }
    
    &.active {
      background-color: #ecf5ff;
      color: #409EFF;
    }
    
    .count {
      margin-left: auto;
      font-size: 12px;
      color: #909399;
    }
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

.folder-tree {
  padding: 0;
}

.empty-folder {
  padding: 20px;
  text-align: center;
  color: #909399;
  font-size: 12px;
}

.tag-list {
  padding: 0 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  
  .tag-item {
    cursor: pointer;
    
    &:hover {
      opacity: 0.8;
    }
  }
}

.language-list {
  .language-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 20px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background-color: #f5f7fa;
    }
    
    &.active {
      background-color: #ecf5ff;
      color: #409EFF;
    }
    
    .count {
      font-size: 12px;
      color: #909399;
    }
  }
}

.el-divider {
  margin: 10px 0;
}
</style>
