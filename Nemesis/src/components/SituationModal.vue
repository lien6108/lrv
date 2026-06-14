<template>
  <!-- Floating action button -->
  <button class="fab" @click="open = true" aria-label="緊急情境查詢">
    <AppIcon name="zap" :size="14" />
    緊急情境
  </button>

  <!-- Modal -->
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="close">
      <div class="modal" role="dialog" aria-modal="true" aria-label="緊急情境查詢">

        <div class="modal-header">
          <span class="modal-title">
            <template v-if="!selected">
              <AppIcon name="zap" :size="14" />
              現在發生了什麼？
            </template>
            <button v-else class="back-btn" @click="selected = null">
              <AppIcon name="arrow-left" :size="14" />
              返回
            </button>
          </span>
          <button class="close-btn" @click="close" aria-label="關閉">
            <AppIcon name="x" :size="16" />
          </button>
        </div>

        <!-- Situation grid -->
        <div v-if="!selected" class="situation-grid">
          <button
            v-for="s in situations"
            :key="s.id"
            class="situation-btn"
            :class="`situation-btn--${s.severity}`"
            @click="select(s)"
          >
            <AppIcon :name="s.icon" :size="26" :stroke-width="1.5" />
            <span class="situation-label">{{ s.title }}</span>
          </button>
        </div>

        <!-- Situation detail -->
        <div v-else class="situation-detail prose">
          <component :is="selectedComponent" v-if="selectedComponent" />
          <p v-else class="loading">載入中...</p>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted } from 'vue'
import AppIcon from './AppIcon.vue'

const injectedOpen = inject('situationModalOpen', null)
const localOpen = ref(false)
const open = injectedOpen ?? localOpen
const selected = ref(null)
const selectedComponent = ref(null)

const situations = [
  { id: 'encounter-alien', icon: 'shield-alert', title: '遭遇異形', severity: 'high' },
  { id: 'fire', icon: 'flame', title: '發現火警', severity: 'high' },
  { id: 'contamination', icon: 'biohazard', title: '污染感染', severity: 'high' },
  { id: 'character-death', icon: 'skull', title: '角色死亡', severity: 'high' },
  { id: 'escape-pod', icon: 'rocket', title: '逃脫艙啟動', severity: 'medium' },
  { id: 'malfunction', icon: 'wrench', title: '系統故障', severity: 'medium' },
]

const situationModules = import.meta.glob('../../content/situations/*.md')

async function select(s) {
  selected.value = s
  selectedComponent.value = null
  const key = `../../content/situations/${s.id}.md`
  if (situationModules[key]) {
    const mod = await situationModules[key]()
    selectedComponent.value = mod.default
  }
}

function close() {
  open.value = false
  selected.value = null
  selectedComponent.value = null
}

function onKeydown(e) {
  if (e.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.fab {
  position: fixed;
  bottom: 28px;
  right: 28px;
  background: var(--color-accent);
  color: white;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 12px 20px;
  border-radius: 50px;
  box-shadow: 0 4px 20px rgba(230, 57, 70, 0.45);
  transition: transform 0.15s, box-shadow 0.15s;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 28px rgba(230, 57, 70, 0.65);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}

.modal {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-strong);
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.7);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  background: var(--color-bg-secondary);
  z-index: 1;
}

.modal-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.close-btn {
  color: var(--color-text-dim);
  padding: 6px;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  display: flex;
  align-items: center;
  cursor: pointer;
  min-width: 32px;
  min-height: 32px;
  justify-content: center;
}

.close-btn:hover {
  color: var(--color-text);
  background: var(--color-bg-card);
}

.back-btn {
  color: var(--color-text-muted);
  font-size: 13px;
  padding: 6px 8px;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.back-btn:hover {
  color: var(--color-text);
  background: var(--color-bg-card);
}

.situation-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 20px;
}

.situation-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 20px 16px;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
  cursor: pointer;
  min-height: 88px;
  color: var(--color-text-muted);
}

.situation-btn:hover {
  background: var(--color-bg-hover);
}

.situation-btn--high:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.situation-btn--medium:hover {
  border-color: #f59e0b;
  color: #f59e0b;
}

.situation-label {
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.situation-detail {
  padding: 20px 24px;
}

.loading {
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
  padding: 20px;
}

/* Mobile: bottom sheet style */
@media (max-width: 520px) {
  .modal-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .modal {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    max-height: 90vh;
    max-width: 100%;
  }
}
</style>
