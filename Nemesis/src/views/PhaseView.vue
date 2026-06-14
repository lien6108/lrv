<template>
  <div class="phase-view">
    <p v-if="!component" class="loading">載入中...</p>
    <div v-else class="prose">
      <component :is="component" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const component = ref(null)

const phaseModules = import.meta.glob('../../content/phases/*.md')

async function loadPhase(id) {
  component.value = null
  const key = `../../content/phases/${id}.md`
  if (phaseModules[key]) {
    const mod = await phaseModules[key]()
    component.value = mod.default
  }
}

watch(() => route.params.id, (id) => loadPhase(id), { immediate: true })
</script>

<style scoped>
.loading {
  color: var(--color-text-muted);
  font-size: 14px;
}
</style>
