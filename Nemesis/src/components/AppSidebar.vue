<template>
  <aside class="sidebar" :class="{ 'sidebar--open': isOpen }">
    <div class="sidebar-logo">
      <AppIcon name="skull" :size="18" />
      <span class="logo-text">NEMESIS</span>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section-label">遊戲階段</div>

      <RouterLink
        v-for="phase in phases"
        :key="phase.id"
        :to="`/phase/${phase.id}`"
        class="nav-item"
        active-class="nav-item--active"
        @click="$emit('close')"
      >
        <AppIcon :name="phase.icon" :size="15" />
        <span>{{ phase.title }}</span>
      </RouterLink>

      <div class="nav-divider" />
      <div class="nav-section-label">其他規則</div>

      <RouterLink
        v-for="rule in rules"
        :key="rule.id"
        :to="`/phase/${rule.id}`"
        class="nav-item"
        active-class="nav-item--active"
        @click="$emit('close')"
      >
        <AppIcon :name="rule.icon" :size="15" />
        <span>{{ rule.title }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import AppIcon from './AppIcon.vue'

defineProps({ isOpen: Boolean })
defineEmits(['close'])

const phases = [
  { id: 'setup', icon: 'package', title: '遊戲準備' },
  { id: 'player-turn', icon: 'user', title: '玩家回合' },
  { id: 'event-phase', icon: 'layers', title: '事件階段' },
  { id: 'intruder-phase', icon: 'shield-alert', title: '入侵者階段' },
]

const rules = [
  { id: 'map-rooms', icon: 'map', title: '地圖與房間' },
  { id: 'victory-conditions', icon: 'trophy', title: '勝利條件' },
  { id: 'character-death', icon: 'skull', title: '角色死亡' },
]
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 16px;
  border-bottom: 1px solid var(--color-accent);
  color: var(--color-accent);
  flex-shrink: 0;
}

.logo-text {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
}

.sidebar-nav {
  padding: 16px 8px;
  flex: 1;
}

.nav-section-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--color-text-dim);
  padding: 4px 8px 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 8px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 2px;
  transition: background 0.15s, color 0.15s;
  border-left: 2px solid transparent;
  cursor: pointer;
  min-height: 38px;
}

.nav-item:hover {
  background: var(--color-bg-card);
  color: var(--color-text);
}

.nav-item--active {
  background: var(--color-bg-card);
  color: var(--color-text);
  border-left-color: var(--color-accent);
}

.nav-divider {
  height: 1px;
  background: var(--color-border);
  margin: 12px 8px;
}

/* Mobile: slide in as overlay */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 110;
    width: 240px;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .sidebar--open {
    transform: translateX(0);
  }
}
</style>
