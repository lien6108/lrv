<template>
  <div class="situation-view">
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

const situationModules = import.meta.glob('../../content/situations/*.md')

async function loadSituation(id) {
  component.value = null
  const key = `../../content/situations/${id}.md`
  if (situationModules[key]) {
    const mod = await situationModules[key]()
    component.value = mod.default
  }
}

watch(() => route.params.id, (id) => loadSituation(id), { immediate: true })
</script>

<style scoped>
.loading {
  color: var(--color-text-muted);
  font-size: 14px;
}
</style>
