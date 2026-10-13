<template>
  <el-dialog
    v-model="innerVisible"
    title="新建代码片段"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="form" label-width="80px">
      <el-form-item label="标题" required>
        <el-input
          v-model="form.title"
          placeholder="请输入片段标题"
          maxlength="100"
        />
      </el-form-item>
      
      <el-form-item label="描述">
        <el-input
          v-model="form.desc"
          type="textarea"
          :rows="2"
          placeholder="请输入片段描述"
          maxlength="200"
        />
      </el-form-item>
      
      <el-form-item label="语言">
        <el-select v-model="form.language" placeholder="选择语言" style="width: 150px">
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
      </el-form-item>
      
      <el-form-item label="文件夹">
        <el-cascader
          v-model="form.folderId"
          :options="folderOptions"
          :props="{ checkStrictly: true, value: 'id', label: 'name' }"
          placeholder="选择文件夹"
          clearable
          style="width: 100%"
        />
      </el-form-item>
      
      <el-form-item label="标签">
        <el-select
          v-model="form.tagIds"
          multiple
          placeholder="选择标签"
          style="width: 100%"
        >
          <el-option
            v-for="tag in tags"
            :key="tag.id"
            :label="tag.name"
            :value="tag.id"
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="代码">
        <el-input
          v-model="form.code"
          type="textarea"
          :rows="8"
          placeholder="请输入代码内容"
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">创建</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'created']);

const tags = ref([]);
const folderOptions = ref([]);
const innerVisible = ref(false);

watch(() => props.visible, (val) => {
  innerVisible.value = val;
  if (val) {
    resetForm();
    loadData();
  }
});

const form = reactive({
  title: '',
  desc: '',
  code: '',
  language: 'javascript',
  folderId: null,
  tagIds: []
});

const resetForm = () => {
  form.title = '';
  form.desc = '';
  form.code = '';
  form.language = 'javascript';
  form.folderId = null;
  form.tagIds = [];
};

const loadData = async () => {
  await Promise.all([
    loadTags(),
    loadFolders()
  ]);
};

const loadTags = async () => {
  if (!window.electronAPI) return;
  try {
    tags.value = await window.electronAPI.getTags();
  } catch (error) {
    console.error('加载标签失败:', error);
  }
};

const loadFolders = async () => {
  if (!window.electronAPI) return;
  try {
    const folders = await window.electronAPI.getFolders();
    folderOptions.value = buildFolderTree(folders);
  } catch (error) {
    console.error('加载文件夹失败:', error);
  }
};

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

const handleClose = () => {
  emit('update:visible', false);
};

const handleSubmit = async () => {
  if (!form.title.trim()) {
    ElMessage.warning('请输入片段标题');
    return;
  }
  
  if (!window.electronAPI) {
    console.error('window.electronAPI is undefined - preload script may not be loaded');
    ElMessage.error('无法连接到数据库，请确保通过 Electron 启动应用');
    return;
  }
  
  try {
    const result = await window.electronAPI.addSnippet({
      title: form.title.trim(),
      desc: form.desc.trim(),
      code: form.code,
      language: form.language,
      folderId: form.folderId,
      tagIds: form.tagIds
    });
    
    if (result.success) {
      ElMessage.success('创建成功');
      emit('created', result);
      handleClose();
    } else {
      ElMessage.error('创建失败');
    }
  } catch (error) {
    console.error('创建片段失败:', error);
    ElMessage.error('创建失败');
  }
};

onMounted(() => {
  loadData();
});
</script>
