<template>
  <!-- Floating button -->
  <button class="fab" @click="open = true" aria-label="緊急情境">
    ⚡ 緊急情境
  </button>

  <!-- Modal overlay -->
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="close" @keydown.esc="close">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <span class="modal-title">
            <span v-if="!selected">⚡ 現在發生了什麼？</span>
            <button v-else class="back-btn" @click="selected = null">← 返回</button>
          </span>
          <button class="close-btn" @click="close">✕</button>
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
            <span class="situation-icon">{{ s.icon }}</span>
            <span class="situation-label">{{ s.title }}</span>
          </button>
        </div>

        <!-- Situation detail -->
        <div v-else class="situation-detail">
          <component :is="selectedComponent" v-if="selectedComponent" />
          <p v-else class="loading">載入中...</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted } from 'vue'

const injectedOpen = inject('situationModalOpen', null)
const localOpen = ref(false)
const open = injectedOpen ?? localOpen
const selected = ref(null)
const selectedComponent = ref(null)

const situations = [
  { id: 'encounter-alien', icon: '👾', title: '遭遇異形', severity: 'high' },
  { id: 'fire', icon: '🔥', title: '發現火警', severity: 'high' },
  { id: 'contamination', icon: '☣️', title: '污染感染', severity: 'high' },
  { id: 'character-death', icon: '💀', title: '角色死亡', severity: 'high' },
  { id: 'escape-pod', icon: '🚀', title: '逃脫艙啟動', severity: 'medium' },
  { id: 'malfunction', icon: '⚙️', title: '系統故障', severity: 'medium' },
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
  z-index: 100;
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(230, 57, 70, 0.6);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}

.modal {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 0.5px;
}

.close-btn {
  color: var(--color-text-dim);
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: color 0.1s, background 0.1s;
}

.close-btn:hover {
  color: var(--color-text);
  background: var(--color-bg-card);
}

.back-btn {
  color: var(--color-text-muted);
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: color 0.1s, background 0.1s;
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
  gap: 8px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  transition: border-color 0.15s, background 0.15s;
}

.situation-btn:hover {
  background: var(--color-bg-hover);
}

.situation-btn--high:hover {
  border-color: var(--color-accent);
}

.situation-btn--medium:hover {
  border-color: #f59e0b;
}

.situation-icon {
  font-size: 28px;
}

.situation-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.situation-detail {
  padding: 20px 24px;
}

.loading {
  color: var(--color-text-muted);
  font-size: 14px;
  padding: 20px;
}
</style>
