<template>
  <div class="folder-tree-item">
    <!-- 文件夹项 -->
    <div
      class="folder-item-wrapper"
      :class="{ 
        active: activeFolder === folder.id,
        dragging: isDragging,
        'drag-over-before': dragOverPosition === 'before',
        'drag-over-after': dragOverPosition === 'after',
        'drag-over-inside': dragOverPosition === 'inside' && folder.children.length > 0
      }"
      draggable="true"
      @click="handleClick"
      @contextmenu.prevent="handleContextMenu"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- 拖拽指示器 -->
      <div v-if="dragOverPosition === 'before'" class="drag-indicator before"></div>
      <div v-if="dragOverPosition === 'after'" class="drag-indicator after"></div>
      
      <!-- 文件夹内容 -->
      <div class="folder-content">
        <!-- 展开/折叠按钮 -->
        <button 
          v-if="folder.children.length > 0" 
          class="expand-btn"
          @click.stop="toggleExpand"
        >
          <el-icon :size="14">
            <ArrowRight v-if="!expanded" />
            <ArrowDown v-else />
          </el-icon>
        </button>
        <span v-else class="expand-placeholder"></span>
        
        <!-- 文件夹图标 -->
        <el-icon :size="18" class="folder-icon">
          <FolderOpened v-if="expanded && folder.children.length > 0" />
          <Folder v-else />
        </el-icon>
        
        <!-- 文件夹名称 -->
        <span class="folder-name">{{ folder.name }}</span>
        
        <!-- 片段数量 -->
        <span class="count">{{ folder.snippet_count }}</span>
        
        <!-- 拖拽手柄 -->
        <span class="drag-handle" @mousedown.stop>
          <el-icon :size="14" class="handle-icon">
            <More />
          </el-icon>
        </span>
      </div>
      
      <!-- 拖入区域提示 -->
      <div 
        v-if="dragOverPosition === 'inside' && folder.children.length > 0" 
        class="drop-inside-hint"
      >
        <span>拖入此文件夹</span>
      </div>
    </div>
    
    <!-- 子文件夹列表 -->
    <div v-if="expanded && folder.children.length > 0" class="children-container">
      <FolderTreeItem
        v-for="child in folder.children"
        :key="child.id"
        :folder="child"
        :active-folder="activeFolder"
        :level="level + 1"
        @click="$emit('click', $event)"
        @update="$emit('update', ...arguments)"
      />
    </div>
    
    <!-- 右键菜单 -->
    <div 
      v-if="showContextMenu" 
      class="context-menu"
      :style="contextMenuStyle"
      @click.stop
    >
      <div class="menu-item" @click="handleRename">
        <el-icon><Edit /></el-icon>
        <span>重命名</span>
      </div>
      <div class="menu-item" @click="handleAddChild">
        <el-icon><Plus /></el-icon>
        <span>新建子文件夹</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item danger" @click="handleDelete">
        <el-icon><Delete /></el-icon>
        <span>删除</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { 
  Folder, 
  FolderOpened, 
  ArrowRight, 
  ArrowDown,
  More,
  Edit,
  Plus,
  Delete as DeleteIcon
} from '@element-plus/icons-vue';

const props = defineProps({
  folder: {
    type: Object,
    required: true
  },
  activeFolder: {
    type: Number,
    default: null
  },
  level: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['click', 'update', 'dragstart', 'dragover', 'drop']);

const expanded = ref(true);
const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragOverPosition = ref(''); // 'before', 'after', 'inside'

// 计算缩进
const indentStyle = computed(() => ({
  paddingLeft: `${props.level * 20}px`
}));

// 右键菜单样式
const contextMenuStyle = computed(() => ({
  left: `${contextMenuPosition.value.x}px`,
  top: `${contextMenuPosition.value.y}px`
}));

// 切换展开/折叠
const toggleExpand = () => {
  expanded.value = !expanded.value;
};

// 点击文件夹
const handleClick = () => {
  emit('click', props.folder.id);
};

// 右键菜单
const handleContextMenu = (e) => {
  showContextMenu.value = true;
  contextMenuPosition.value = {
    x: e.clientX,
    y: e.clientY
  };
  
  document.addEventListener('click', closeContextMenu);
};

// 关闭右键菜单
const closeContextMenu = () => {
  showContextMenu.value = false;
  document.removeEventListener('click', closeContextMenu);
};

// 重命名
const handleRename = async () => {
  closeContextMenu();
  
  const { value: name } = await ElMessageBox.prompt(
    '请输入新名称', 
    '重命名文件夹', 
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: props.folder.name
    }
  );
  
  if (!name) {
    ElMessage.warning('请输入名称');
    return;
  }
  
  emit('update', 'rename', props.folder.id, { name });
};

// 新建子文件夹
const handleAddChild = async () => {
  closeContextMenu();
  
  const { value: name } = await ElMessageBox.prompt(
    '请输入子文件夹名称', 
    '新建子文件夹', 
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }
  );
  
  if (!name) {
    ElMessage.warning('请输入名称');
    return;
  }
  
  emit('update', 'add-child', props.folder.id, { name });
};

// 删除文件夹
const handleDelete = async () => {
  closeContextMenu();
  
  const confirm = await ElMessageBox.confirm(
    '确定要删除此文件夹吗？文件夹中的代码片段将被移到根目录。', 
    '删除文件夹', 
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  );
  
  if (confirm === 'confirm') {
    emit('update', 'delete', props.folder.id);
  }
};

// 拖拽开始
const handleDragStart = (e) => {
  isDragging.value = true;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', JSON.stringify(props.folder));
  emit('dragstart', props.folder);
};

// 拖拽结束
const handleDragEnd = () => {
  isDragging.value = false;
  dragOverPosition.value = '';
};

// 拖拽经过
const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const height = rect.height;
  
  // 判断拖拽位置
  if (y < height * 0.25) {
    dragOverPosition.value = 'before';
  } else if (y > height * 0.75) {
    dragOverPosition.value = 'after';
  } else {
    dragOverPosition.value = 'inside';
  }
  
  emit('dragover', e, props.folder, dragOverPosition.value);
};

// 拖拽离开
const handleDragLeave = () => {
  dragOverPosition.value = '';
};

// 放置
const handleDrop = (e) => {
  e.preventDefault();
  emit('drop', props.folder, dragOverPosition.value);
  dragOverPosition.value = '';
};

import { ElMessageBox, ElMessage } from 'element-plus';
</script>

<style lang="scss" scoped>
.folder-tree-item {
  position: relative;
}

.folder-item-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
  
  &:hover {
    background-color: #f5f7fa;
  }
  
  &.active {
    background-color: #ecf5ff;
    
    .folder-icon {
      color: #409EFF;
    }
  }
  
  &.dragging {
    opacity: 0.5;
    background-color: #e4e7ed;
  }
  
  &.drag-over-before {
    border-top: 2px solid #409EFF;
  }
  
  &.drag-over-after {
    border-bottom: 2px solid #409EFF;
  }
  
  &.drag-over-inside {
    background-color: #e8f4fd;
    border: 1px dashed #409EFF;
  }
}

.drag-indicator {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #409EFF;
  
  &.before {
    top: 0;
  }
  
  &.after {
    bottom: 0;
  }
}

.folder-content {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding-left: 12px;
}

.expand-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #909399;
  
  &:hover {
    color: #409EFF;
  }
}

.expand-placeholder {
  width: 20px;
}

.folder-icon {
  color: #E6A23C;
  flex-shrink: 0;
}

.folder-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #303133;
}

.count {
  font-size: 12px;
  color: #909399;
  margin-right: 8px;
  flex-shrink: 0;
}

.drag-handle {
  opacity: 0;
  transition: opacity 0.2s;
  cursor: grab;
  padding: 2px;
  
  &:hover {
    opacity: 1;
  }
  
  .handle-icon {
    color: #c0c4cc;
  }
}

.folder-item-wrapper:hover .drag-handle {
  opacity: 1;
}

.drop-inside-hint {
  background-color: #e8f4fd;
  padding: 4px 12px;
  margin-top: 4px;
  border-radius: 4px;
  font-size: 12px;
  color: #409EFF;
  text-align: center;
}

.children-container {
  padding-left: 10px;
}

.context-menu {
  position: fixed;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 150px;
  
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
</style>
