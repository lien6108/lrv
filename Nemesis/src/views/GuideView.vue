<template>
  <div class="guide-view">
    <!-- Loading -->
    <div v-if="loading" class="guide-state">
      <p>載入中…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="guide-state guide-state--error">
      <p>{{ error }}</p>
      <button class="primary-btn" @click="router.push('/')">返回首頁</button>
    </div>

    <!-- Completion screen -->
    <div v-else-if="completed" class="guide-complete">
      <div class="guide-complete__check">✓</div>
      <h2>本階段完成</h2>
      <p class="guide-complete__subtitle">{{ phaseData?.title }}</p>
      <button class="primary-btn" @click="router.push('/')">返回首頁</button>
    </div>

    <!-- Main guide -->
    <template v-else-if="stepsRef.length">
      <StepCard
        :step="currentStep"
        :index="stepIndex + 1"
        :total="stepsRef.length"
        :context="context"
        :is-last="isLast"
        @next="handleNext"
        @prev="prev"
        @collect="collectValue"
        @open-situation="openSituation"
        @exit="showExitConfirm = true"
      />

      <SituationOverlay
        v-if="overlayOpen"
        :situation-id="activeSituation"
        @close="closeSituation"
      />
    </template>

    <!-- Exit confirmation -->
    <Transition name="fade">
      <div v-if="showExitConfirm" class="exit-overlay" @click.self="showExitConfirm = false">
        <div class="exit-dialog">
          <p>確定要離開引導模式嗎？</p>
          <div class="exit-dialog__buttons">
            <button class="cancel-btn" @click="showExitConfirm = false">繼續引導</button>
            <button class="confirm-btn" @click="router.push('/')">離開</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGuideSession } from '../composables/useGuideSession.js'
import StepCard from '../components/StepCard.vue'
import SituationOverlay from '../components/SituationOverlay.vue'

const route = useRoute()
const router = useRouter()

const phaseData = ref(null)
const stepsRef = ref([])
const loading = ref(true)
const error = ref(null)
const completed = ref(false)
const showExitConfirm = ref(false)

const {
  stepIndex,
  context,
  overlayOpen,
  activeSituation,
  currentStep,
  isLast,
  next,
  prev,
  collectValue,
  openSituation,
  closeSituation,
  reset,
} = useGuideSession(stepsRef)

const phaseModules = import.meta.glob('../../content/phases/*.json')

async function loadPhase(phase) {
  loading.value = true
  error.value = null
  completed.value = false
  reset()
  try {
    const key = `../../content/phases/${phase}.json`
    if (!phaseModules[key]) throw new Error(`找不到階段：${phase}`)
    const mod = await phaseModules[key]()
    phaseData.value = mod.default || mod
    stepsRef.value = phaseData.value.steps
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

watch(() => route.params.phase, (phase) => {
  if (phase) loadPhase(phase)
}, { immediate: true })

function handleNext() {
  const step = currentStep.value
  if (step?.per_player && context.player_count && context.current_player < context.player_count) {
    context.current_player++
    return
  }
  if (isLast.value) {
    completed.value = true
  } else {
    next()
  }
}
</script>

<style scoped>
.guide-view {
  position: fixed;
  inset: 0;
  background: var(--color-bg);
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.guide-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  color: var(--color-text-dim);
  font-size: 14px;
}

.guide-state--error {
  color: var(--color-accent);
}

/* Completion screen */
.guide-complete {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 32px;
  gap: 16px;
}

.guide-complete__check {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.12);
  border: 2px solid #22c55e;
  color: #22c55e;
  font-size: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.guide-complete h2 {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text);
}

.guide-complete__subtitle {
  font-size: 15px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.primary-btn {
  background: var(--color-accent);
  color: white;
  font-size: 15px;
  font-weight: 700;
  padding: 12px 32px;
  border-radius: 8px;
  transition: opacity 0.15s, transform 0.1s;
  cursor: pointer;
}

.primary-btn:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

/* Exit confirmation */
.exit-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 24px;
}

.exit-dialog {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-strong);
  border-radius: 12px;
  padding: 28px 32px;
  max-width: 360px;
  width: 100%;
  text-align: center;
}

.exit-dialog p {
  font-size: 16px;
  color: var(--color-text);
  margin-bottom: 24px;
}

.exit-dialog__buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.cancel-btn {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-bg);
  border: 1px solid var(--color-border-strong);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.cancel-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.confirm-btn {
  font-size: 14px;
  font-weight: 700;
  color: white;
  background: var(--color-accent);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.confirm-btn:hover {
  opacity: 0.85;
}

/* Fade transition for exit dialog */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>