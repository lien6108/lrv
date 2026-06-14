<template>
  <div class="app-layout">
    <AppSidebar />
    <main class="main-content">
      <RouterView />
    </main>
    <SituationModal />
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import SituationModal from './components/SituationModal.vue'

const situationModalOpen = ref(false)
provide('openSituationModal', () => { situationModalOpen.value = true })
provide('situationModalOpen', situationModalOpen)
</script>

<style>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
}
</style>
