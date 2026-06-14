<template>
  <aside class="sidebar">
    <div class="sidebar-logo">
      <span class="logo-icon">☠</span>
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
      >
        <span class="nav-icon">{{ phase.icon }}</span>
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
      >
        <span class="nav-icon">{{ rule.icon }}</span>
        <span>{{ rule.title }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
const phases = [
  { id: 'setup', icon: '📦', title: '遊戲準備' },
  { id: 'player-turn', icon: '👤', title: '玩家回合' },
  { id: 'event-phase', icon: '🃏', title: '事件階段' },
  { id: 'intruder-phase', icon: '👾', title: '入侵者階段' },
]

const rules = [
  { id: 'map-rooms', icon: '🗺', title: '地圖與房間' },
  { id: 'victory-conditions', icon: '🎯', title: '勝利條件' },
  { id: 'character-death', icon: '💀', title: '角色死亡' },
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
}

.logo-icon {
  font-size: 18px;
  color: var(--color-accent);
}

.logo-text {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--color-accent);
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
  padding: 8px 8px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 2px;
  transition: background 0.1s, color 0.1s;
  border-left: 2px solid transparent;
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

.nav-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.nav-divider {
  height: 1px;
  background: var(--color-border);
  margin: 12px 8px;
}
</style>
