<template>
  <div class="guide-card">

    <!-- ── SELECT VIEW ── -->
    <template v-if="view === 'select'">
      <div class="guide-card__header">
        <button class="exit-btn" @click="$emit('exit')">✕ 離開</button>
        <div class="header-right">
          <span v-if="context.player_count" class="player-badge">
            玩家 {{ context.current_player }} / {{ context.player_count }}
          </span>
          <span class="step-counter">第 {{ actionsDone + 1 }} 個行動，共 {{ step.action_count }} 個</span>
        </div>
      </div>

      <div class="guide-card__body">
        <h2 class="step-title">選擇要執行的行動</h2>
        <div class="action-grid">
          <button
            v-for="action in step.actions"
            :key="action.id"
            class="action-btn"
            @click="selectAction(action)"
          >
            <span class="action-label">{{ action.label }}</span>
          </button>
        </div>

        <div
          v-if="step.situations && step.situations.length"
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
      </div>
    </template>

    <!-- ── CARD VIEW ── -->
    <template v-else-if="view === 'card'">
      <div class="guide-card__header">
        <button class="exit-btn" @click="$emit('exit')">✕ 離開</button>
        <div class="header-right">
          <span v-if="context.player_count" class="player-badge">
            玩家 {{ context.current_player }} / {{ context.player_count }}
          </span>
          <span class="step-counter">第 {{ actionsDone + 1 }} 個行動，共 {{ step.action_count }} 個</span>
        </div>
      </div>

      <div class="guide-card__body">
        <h2 class="step-title">{{ selectedAction.label }}</h2>
        <p class="step-body">{{ selectedAction.body }}</p>
      </div>

      <div class="guide-card__footer">
        <button class="prev-btn" @click="backToSelect">← 重選</button>
        <button class="next-btn" @click="completeAction">完成此行動 →</button>
      </div>
    </template>

    <!-- ── STEPS VIEW ── -->
    <template v-else-if="view === 'steps'">
      <div class="guide-card__header">
        <button class="exit-btn" @click="$emit('exit')">✕ 離開</button>
        <div class="header-right">
          <span v-if="context.player_count" class="player-badge">
            玩家 {{ context.current_player }} / {{ context.player_count }}
          </span>
          <span class="step-counter">{{ selectedAction.label }}｜步驟 {{ subStepIndex + 1 }} / {{ selectedAction.steps.length }}</span>
        </div>
      </div>

      <div class="guide-card__body">
        <h2 class="step-title">{{ selectedAction.steps[subStepIndex].title }}</h2>
        <p class="step-body">{{ selectedAction.steps[subStepIndex].body }}</p>
      </div>

      <div class="guide-card__footer">
        <button class="prev-btn" @click="stepBack">
          {{ subStepIndex === 0 ? '← 重選' : '← 上一步' }}
        </button>
        <button class="next-btn" @click="stepForward">
          {{ isLastSubStep ? '完成此行動 ✓' : '下一步 →' }}
        </button>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  step: { type: Object, required: true },
  context: { type: Object, required: true },
  isLast: { type: Boolean, default: false },
})

const emit = defineEmits(['next', 'prev', 'open-situation', 'exit'])

const SITUATION_LABELS = {
  'encounter-alien': '遭遇異形',
  'fire': '發現火警',
  'contamination': '污染感染',
  'malfunction': '系統故障',
  'character-death': '角色死亡',
  'escape-pod': '逃脫艙啟動',
}

const view = ref('select')
const selectedAction = ref(null)
const actionsDone = ref(0)
const subStepIndex = ref(0)

const isLastSubStep = computed(() =>
  selectedAction.value && subStepIndex.value === selectedAction.value.steps.length - 1
)

function selectAction(action) {
  selectedAction.value = action
  subStepIndex.value = 0
  view.value = action.type === 'steps' ? 'steps' : 'card'
}

function backToSelect() {
  view.value = 'select'
  selectedAction.value = null
  subStepIndex.value = 0
}

function stepBack() {
  if (subStepIndex.value === 0) {
    backToSelect()
  } else {
    subStepIndex.value--
  }
}

function stepForward() {
  if (isLastSubStep.value) {
    completeAction()
  } else {
    subStepIndex.value++
  }
}

function completeAction() {
  actionsDone.value++
  if (actionsDone.value >= props.step.action_count) {
    emit('next')
  } else {
    view.value = 'select'
    selectedAction.value = null
    subStepIndex.value = 0
  }
}
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
  padding: 40px 48px 32px;
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
}

/* Action grid */
.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 32px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 16px 12px;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
  cursor: pointer;
  text-align: center;
}

.action-btn:hover {
  border-color: var(--color-accent);
  background: var(--color-bg-hover);
  transform: translateY(-1px);
}

.action-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

/* Situation triggers */
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

/* Footer */
.guide-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 48px;
  border-top: 1px solid var(--color-border-strong);
  flex-shrink: 0;
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

@media (max-width: 600px) {
  .guide-card__body {
    padding: 28px 24px 24px;
    justify-content: flex-start;
  }

  .step-title {
    font-size: 20px;
  }

  .step-body {
    font-size: 15px;
  }

  .action-grid {
    gap: 8px;
  }

  .action-btn {
    padding: 14px 10px;
  }

  .action-label {
    font-size: 14px;
  }

  .guide-card__footer {
    padding: 16px 24px;
  }
}
</style>
