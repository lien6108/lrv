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
      path: '/phase/:id',
      component: () => import('../views/PhaseView.vue'),
    },
    {
      path: '/situation/:id',
      component: () => import('../views/SituationView.vue'),
    },
  ],
})

export default router
