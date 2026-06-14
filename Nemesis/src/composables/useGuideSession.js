import { reactive, ref, computed, isRef } from 'vue'

export function useGuideSession(stepsInput) {
  const stepsRef = isRef(stepsInput) ? stepsInput : ref(stepsInput)

  const stepIndex = ref(0)
  const context = reactive({ player_count: null, current_player: 1 })
  const overlayOpen = ref(false)
  const activeSituation = ref(null)

  const currentStep = computed(() => stepsRef.value[stepIndex.value])
  const isLast = computed(() => stepIndex.value === stepsRef.value.length - 1)

  function next() {
    if (!isLast.value) stepIndex.value++
  }

  function prev() {
    if (stepIndex.value > 0) stepIndex.value--
  }

  function collectValue(key, val) {
    context[key] = val
    if (!isLast.value) stepIndex.value++
  }

  function openSituation(id) {
    activeSituation.value = id
    overlayOpen.value = true
  }

  function closeSituation() {
    overlayOpen.value = false
    activeSituation.value = null
  }

  function reset() {
    stepIndex.value = 0
    context.player_count = null
    context.current_player = 1
    overlayOpen.value = false
    activeSituation.value = null
  }

  return {
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
  }
}