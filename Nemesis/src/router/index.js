import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: HomeView,
    },
    {
      path: '/guide/:phase',
      component: () => import('../views/GuideView.vue'),
    },
    {
      path: '/phase/:id',
      redirect: to => `/guide/${to.params.id}`,
    },
    {
      path: '/situation/:id',
      component: () => import('../views/SituationView.vue'),
    },
  ],
})

export default router