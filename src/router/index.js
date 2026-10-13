import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home/index.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/category',
    name: 'Category',
    component: () => import('@/views/Category/index.vue'),
    meta: { title: '分类管理' }
  },
  {
    path: '/tag',
    name: 'Tag',
    component: () => import('@/views/Tag/index.vue'),
    meta: { title: '标签管理' }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search/index.vue'),
    meta: { title: '搜索' }
  },
  {
    path: '/setting',
    name: 'Setting',
    component: () => import('@/views/Setting/index.vue'),
    meta: { title: '设置' }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - CodeSnap`;
  }
  next();
});

export default router;
