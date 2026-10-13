import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSnippetStore = defineStore('snippet', () => {
  const snippets = ref([]);
  const currentSnippet = ref(null);
  const total = ref(0);
  const loading = ref(false);

  // 获取片段列表
  async function fetchSnippets(options = {}) {
    if (!window.electronAPI) return;
    
    loading.value = true;
    try {
      const result = await window.electronAPI.getSnippets(options);
      snippets.value = result.list;
      total.value = result.total;
      return result;
    } catch (error) {
      console.error('获取片段列表失败:', error);
    } finally {
      loading.value = false;
    }
  }

  // 获取片段详情
  async function fetchSnippetById(id) {
    if (!window.electronAPI) return;
    
    try {
      const snippet = await window.electronAPI.getSnippetById(id);
      currentSnippet.value = snippet;
      return snippet;
    } catch (error) {
      console.error('获取片段详情失败:', error);
    }
  }

  // 新增片段
  async function addSnippet(snippetData) {
    if (!window.electronAPI) return;
    
    try {
      const result = await window.electronAPI.addSnippet(snippetData);
      return result;
    } catch (error) {
      console.error('新增片段失败:', error);
      throw error;
    }
  }

  // 更新片段
  async function updateSnippet(snippetData) {
    if (!window.electronAPI) return;
    
    try {
      const result = await window.electronAPI.updateSnippet(snippetData);
      return result;
    } catch (error) {
      console.error('更新片段失败:', error);
      throw error;
    }
  }

  // 删除片段
  async function deleteSnippet(id) {
    if (!window.electronAPI) return;
    
    try {
      const result = await window.electronAPI.deleteSnippet(id);
      return result;
    } catch (error) {
      console.error('删除片段失败:', error);
      throw error;
    }
  }

  // 永久删除片段
  async function hardDeleteSnippet(id) {
    if (!window.electronAPI) return;
    
    try {
      const result = await window.electronAPI.hardDeleteSnippet(id);
      return result;
    } catch (error) {
      console.error('永久删除片段失败:', error);
      throw error;
    }
  }

  // 恢复片段
  async function restoreSnippet(id) {
    if (!window.electronAPI) return;
    
    try {
      const result = await window.electronAPI.restoreSnippet(id);
      return result;
    } catch (error) {
      console.error('恢复片段失败:', error);
      throw error;
    }
  }

  // 切换收藏状态
  async function toggleCollect(id) {
    if (!window.electronAPI) return;
    
    try {
      const result = await window.electronAPI.toggleCollect(id);
      return result;
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      throw error;
    }
  }

  // 清空当前片段
  function clearCurrentSnippet() {
    currentSnippet.value = null;
  }

  return {
    snippets,
    currentSnippet,
    total,
    loading,
    fetchSnippets,
    fetchSnippetById,
    addSnippet,
    updateSnippet,
    deleteSnippet,
    hardDeleteSnippet,
    restoreSnippet,
    toggleCollect,
    clearCurrentSnippet
  };
});
