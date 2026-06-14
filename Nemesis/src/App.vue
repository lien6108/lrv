<template>
  <div class="app-layout">
    <!-- Mobile hamburger -->
    <button
      class="mobile-menu-btn"
      :aria-label="sidebarOpen ? '關閉選單' : '開啟選單'"
      @click="sidebarOpen = !sidebarOpen"
    >
      <AppIcon :name="sidebarOpen ? 'x' : 'menu'" :size="20" />
    </button>

    <!-- Mobile overlay backdrop -->
    <Transition name="fade">
      <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false" />
    </Transition>

    <AppSidebar :is-open="sidebarOpen" @close="sidebarOpen = false" />

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
import AppIcon from './components/AppIcon.vue'

const situationModalOpen = ref(false)
provide('openSituationModal', () => { situationModalOpen.value = true })
provide('situationModalOpen', situationModalOpen)

const sidebarOpen = ref(false)
</script>

<style>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  min-width: 0;
}

/* Mobile menu toggle — hidden on desktop */
.mobile-menu-btn {
  display: none;
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 120;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-strong);
  border-radius: 8px;
  color: var(--color-text);
  transition: background 0.15s;
}

.mobile-menu-btn:hover {
  background: var(--color-bg-hover);
}

/* Backdrop behind sidebar on mobile */
.sidebar-backdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 100;
}

/* Backdrop fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }

  .sidebar-backdrop {
    display: block;
  }

  .main-content {
    padding: 64px 20px 100px;
  }
}
</style>
