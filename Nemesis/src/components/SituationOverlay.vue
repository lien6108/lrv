<template>
  <div class="situation-overlay">
    <div v-if="loading" class="overlay-state">
      <p>載入中…</p>
    </div>

    <template v-else-if="data">
      <!-- Completion screen -->
      <div v-if="done" class="overlay-complete">
        <div class="overlay-complete__check">✓</div>
        <h2>狀況處理完畢</h2>
        <p class="overlay-complete__title">{{ data.title }}</p>
        <button class="primary-btn" @click="$emit('close')">回到主流程</button>
      </div>

      <!-- Step view -->
      <template v-else>
        <div class="guide-card overlay-card">
          <div class="guide-card__header">
            <button class="exit-btn" @click="$emit('close')">← 回到主流程</button>
            <span class="step-counter">
              <span class="situation-name">{{ data.title }}</span>
              ・第 {{ localIndex + 1 }} 步，共 {{ data.steps.length }} 步
            </span>
          </div>

          <div class="guide-card__body">
            <h2 class="step-title">{{ currentStep.title }}</h2>
            <p class="step-body">{{ currentStep.body }}</p>
          </div>

          <div class="guide-card__footer">
            <button v-if="localIndex > 0" class="prev-btn" @click="localIndex--">← 上一步</button>
            <span v-else class="footer-spacer" />
            <button class="next-btn" @click="advance">
              {{ isLocalLast ? '完成處理 ✓' : '下一步 →' }}
            </button>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  situationId: { type: String, required: true },
})

defineEmits(['close'])

const data = ref(null)
const loading = ref(true)
const localIndex = ref(0)
const done = ref(false)

const currentStep = computed(() => data.value?.steps[localIndex.value])
const isLocalLast = computed(() => data.value && localIndex.value === data.value.steps.length - 1)

const situationModules = import.meta.glob('../../content/situations/*.json')

async function loadSituation(id) {
  loading.value = true
  done.value = false
  localIndex.value = 0
  data.value = null
  try {
    const key = `../../content/situations/${id}.json`
    if (!situationModules[key]) throw new Error(`找不到狀況：${id}`)
    const mod = await situationModules[key]()
    data.value = mod.default || mod
  } finally {
    loading.value = false
  }
}

function advance() {
  if (isLocalLast.value) {
    done.value = true
  } else {
    localIndex.value++
  }
}

watch(() => props.situationId, (id) => {
  if (id) loadSituation(id)
}, { immediate: true })
</script>

<style scoped>
.situation-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-bg);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.overlay-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-dim);
  font-size: 14px;
}

.overlay-card {
  flex: 1;
}

.situation-name {
  color: var(--color-accent);
  font-weight: 600;
}

/* Completion screen */
.overlay-complete {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 32px;
  gap: 16px;
}

.overlay-complete__check {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.15);
  border: 2px solid #22c55e;
  color: #22c55e;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.overlay-complete h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
}

.overlay-complete__title {
  font-size: 14px;
  color: var(--color-text-muted);
}

.primary-btn {
  margin-top: 16px;
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

/* Shared card styles (duplicated from StepCard since scoped) */
.guide-card {
  display: flex;
  flex-direction: column;
  height: 100%;
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
  cursor: pointer;
}

.exit-btn:hover {
  color: var(--color-text);
  background: var(--color-bg-card);
}

.step-counter {
  font-size: 13px;
  color: var(--color-text-dim);
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
}

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
  cursor: pointer;
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
  cursor: pointer;
}

.next-btn:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

@media (max-width: 600px) {
  .guide-card__body {
    padding: 32px 24px 24px;
  }

  .step-title {
    font-size: 20px;
  }

  .guide-card__footer {
    padding: 16px 24px;
  }
}
</style>