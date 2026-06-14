<template>
  <div class="home">
    <div class="home-header">
      <div class="home-icon">☠</div>
      <h1>異形：復仇女神號</h1>
      <p class="home-subtitle">遊戲輔助系統</p>
    </div>

    <div class="home-cards">
      <RouterLink to="/phase/setup" class="home-card">
        <span class="card-icon">📋</span>
        <div>
          <h3>查看遊戲流程</h3>
          <p>遊戲準備、回合流程、各階段步驟說明</p>
        </div>
      </RouterLink>

      <button class="home-card home-card--emergency" @click="openSituations">
        <span class="card-icon">⚡</span>
        <div>
          <h3>緊急查詢</h3>
          <p>遭遇異形、火警、污染等突發情境處理</p>
        </div>
      </button>
    </div>

    <div class="home-phases">
      <h2>遊戲輪次</h2>
      <div class="phases-flow">
        <div class="phase-item">
          <span>👤</span>
          <span>玩家回合</span>
        </div>
        <div class="phase-arrow">→</div>
        <div class="phase-item">
          <span>🃏</span>
          <span>事件階段</span>
        </div>
        <div class="phase-arrow">→</div>
        <div class="phase-item">
          <span>👾</span>
          <span>入侵者階段</span>
        </div>
        <div class="phase-arrow">→</div>
        <div class="phase-item phase-item--loop">
          <span>🔄</span>
          <span>下一輪</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'

const openSituations = inject('openSituationModal')
</script>

<style scoped>
.home {
  max-width: 680px;
}

.home-header {
  text-align: center;
  margin-bottom: 48px;
  padding-top: 16px;
}

.home-icon {
  font-size: 48px;
  color: var(--color-accent);
  margin-bottom: 12px;
}

h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.home-subtitle {
  color: var(--color-text-muted);
  font-size: 14px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.home-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 48px;
}

.home-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 20px;
  transition: border-color 0.15s, background 0.15s;
  text-align: left;
  width: 100%;
}

.home-card:hover {
  border-color: var(--color-accent);
  background: var(--color-bg-hover);
}

.home-card--emergency:hover {
  border-color: var(--color-accent);
  box-shadow: 0 0 16px var(--color-accent-dim);
}

.card-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.home-card h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.home-card p {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.home-phases h2 {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-text-dim);
  margin-bottom: 16px;
}

.phases-flow {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.phase-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 14px 18px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.phase-item span:first-child {
  font-size: 20px;
}

.phase-item--loop {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.phase-arrow {
  color: var(--color-text-dim);
  font-size: 18px;
}
</style>
