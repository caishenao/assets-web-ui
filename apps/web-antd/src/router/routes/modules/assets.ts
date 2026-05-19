import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    component: () => import('#/views/assets/index.vue'),
    meta: {
      icon: 'lucide:boxes',
      order: 0,
      title: 'Assets',
    },
    name: 'Assets',
    path: '/assets',
  },
];

export default routes;