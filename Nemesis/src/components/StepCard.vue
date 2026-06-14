<template>
  <ActionSelectCard
    v-if="step.type === 'action-select'"
    :step="step"
    :context="context"
    :is-last="isLast"
    @next="$emit('next')"
    @prev="$emit('prev')"
    @open-situation="$emit('open-situation', $event)"
    @exit="$emit('exit')"
  />
  <div v-else class="guide-card">
    <div class="guide-card__header">
      <button class="exit-btn" @click="$emit('exit')">✕ 離開</button>
      <div class="header-right">
        <span v-if="step.per_player && context.player_count" class="player-badge">
          玩家 {{ context.current_player }} / {{ context.player_count }}
        </span>
        <span class="step-counter">第 {{ index }} 步，共 {{ total }} 步</span>
      </div>
    </div>

    <div class="guide-card__body">
      <!-- Collect type -->
      <template v-if="step.type === 'collect'">
        <h2 class="step-title">{{ step.prompt }}</h2>
        <div class="collect-options">
          <button
            v-for="opt in step.options"
            :key="opt"
            class="collect-btn"
            @click="$emit('collect', step.context_key, opt)"
          >
            {{ opt }}
          </button>
        </div>
        <p class="collect-hint">選擇後自動進入下一步</p>
      </template>

      <!-- Action / Check type -->
      <template v-else>
        <h2 class="step-title">{{ step.title }}</h2>
        <p class="step-body">{{ step.body }}</p>

        <div
          v-if="step.type === 'check' && step.situations && step.situations.length"
          class="situation-triggers"
        >
          <p class="situation-label">這個步驟可能發生以下狀況</p>
          <div class="situation-buttons">
            <button
              v-for="sit in step.situations"
              :key="sit.id"
              class="situation-trigger-btn"
              @click="$emit('open-situation', sit.id)"
            >
              {{ SITUATION_LABELS[sit.id] || sit.id }}
            </button>
          </div>
        </div>
      </template>
    </div>

    <div v-if="step.type !== 'collect'" class="guide-card__footer">
      <button v-if="index > 1" class="prev-btn" @click="$emit('prev')">← 上一步</button>
      <span v-else class="footer-spacer" />
      <button class="next-btn" @click="$emit('next')">{{ nextLabel }}</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ActionSelectCard from './ActionSelectCard.vue'

const props = defineProps({
  step: { type: Object, required: true },
  index: { type: Number, required: true },
  total: { type: Number, required: true },
  context: { type: Object, required: true },
  isLast: { type: Boolean, default: false },
})

defineEmits(['next', 'prev', 'collect', 'open-situation', 'exit'])

const SITUATION_LABELS = {
  'encounter-alien': '遭遇異形',
  'fire': '發現火警',
  'contamination': '污染感染',
  'malfunction': '系統故障',
  'character-death': '角色死亡',
  'escape-pod': '逃脫艙啟動',
}

const nextLabel = computed(() => {
  if (props.step?.per_player && props.context?.player_count) {
    if (props.context.current_player < props.context.player_count) return '完成本回合 →'
    return props.isLast ? '完成所有回合 ✓' : '繼續 →'
  }
  return props.isLast ? '完成 ✓' : '下一步 →'
})
</script>

<style scoped>
.guide-card {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg);
  overflow: hidden;
}

.guide-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border-strong);
  flex-shrink: 0;
}

.exit-btn {
  font-size: 13px;
  color: var(--color-text-dim);
  padding: 6px 10px;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}

.exit-btn:hover {
  color: var(--color-accent);
  background: var(--color-accent-dim);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-accent);
  background: var(--color-accent-dim);
  border: 1px solid rgba(230, 57, 70, 0.3);
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.3px;
}

.step-counter {
  font-size: 13px;
  color: var(--color-text-dim);
  letter-spacing: 0.3px;
}

.guide-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 48px 32px;
  max-width: 680px;
  margin: 0 auto;
  width: 100%;
  overflow-y: auto;
}

.step-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 20px;
  line-height: 1.35;
}

.step-body {
  font-size: 16px;
  color: var(--color-text-muted);
  line-height: 1.8;
  margin-bottom: 32px;
}

.situation-triggers {
  border: 1px solid rgba(230, 57, 70, 0.4);
  border-radius: 10px;
  padding: 16px 20px;
  background: var(--color-accent-dim);
}

.situation-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 12px;
}

.situation-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.situation-trigger-btn {
  background: transparent;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
  cursor: pointer;
}

.situation-trigger-btn:hover {
  background: var(--color-accent);
  color: white;
}

/* Collect step */
.collect-options {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin: 40px 0 20px;
  flex-wrap: wrap;
}

.collect-btn {
  width: 80px;
  height: 80px;
  font-size: 28px;
  font-weight: 700;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border-strong);
  border-radius: 12px;
  color: var(--color-text);
  transition: border-color 0.15s, background 0.15s, color 0.15s, transform 0.1s;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collect-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: white;
  transform: translateY(-2px);
}

.collect-hint {
  font-size: 13px;
  color: var(--color-text-dim);
  text-align: center;
  margin-top: 8px;
}

/* Footer */
.guide-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 48px;
  border-top: 1px solid var(--color-border-strong);
  flex-shrink: 0;
}

.footer-spacer {
  flex: 1;
}

.prev-btn {
  font-size: 14px;
  color: var(--color-text-dim);
  padding: 10px 16px;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s;
}

.prev-btn:hover {
  color: var(--color-text);
  background: var(--color-bg-card);
}

.next-btn {
  background: var(--color-accent);
  color: white;
  font-size: 15px;
  font-weight: 700;
  padding: 12px 28px;
  border-radius: 8px;
  transition: opacity 0.15s, transform 0.1s;
  letter-spacing: 0.3px;
}

.next-btn:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

/* Mobile */
@media (max-width: 600px) {
  .guide-card__body {
    padding: 32px 24px 24px;
  }

  .step-title {
    font-size: 20px;
  }

  .step-body {
    font-size: 15px;
  }

  .guide-card__footer {
    padding: 16px 24px;
  }
}
</style>