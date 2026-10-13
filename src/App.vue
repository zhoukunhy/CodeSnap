<template>
  <div class="app-container" :class="{ 'dark-mode': isDarkMode }">
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useConfigStore } from '@/store/config';

const isDarkMode = ref(false);
const configStore = useConfigStore();

onMounted(async () => {
  // 加载用户配置
  await configStore.loadConfig();
  
  // 应用主题
  isDarkMode.value = configStore.theme === 'dark';
  
  // 监听主题变化
  if (window.electronAPI) {
    window.electronAPI.on('config:changed', (config) => {
      if (config.theme) {
        isDarkMode.value = config.theme === 'dark';
      }
    });
  }
});
</script>

<style lang="scss">
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f7fa;
  transition: background-color 0.3s;
  
  &.dark-mode {
    background-color: #1e1e1e;
    color: #d4d4d4;
  }
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
