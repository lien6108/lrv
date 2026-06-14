<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="path"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
  strokeWidth: { type: Number, default: 1.75 },
})

const ICONS = {
  skull:
    '<path d="m12.5 17-.5-1-.5 1h1z"/>' +
    '<path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"/>' +
    '<circle cx="15" cy="12" r="1"/>' +
    '<circle cx="9" cy="12" r="1"/>',

  package:
    '<path d="M16.5 9.4 7.55 4.24"/>' +
    '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>' +
    '<polyline points="3.29 7 12 12 20.71 7"/>' +
    '<line x1="12" x2="12" y1="22" y2="12"/>',

  user:
    '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>' +
    '<circle cx="12" cy="7" r="4"/>',

  layers:
    '<polygon points="12 2 2 7 12 12 22 7 12 2"/>' +
    '<polyline points="2 17 12 22 22 17"/>' +
    '<polyline points="2 12 12 17 22 12"/>',

  'shield-alert':
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>' +
    '<path d="M12 8v4"/>' +
    '<path d="M12 16h.01"/>',

  map:
    '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>' +
    '<line x1="9" x2="9" y1="3" y2="18"/>' +
    '<line x1="15" x2="15" y1="6" y2="21"/>',

  trophy:
    '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>' +
    '<path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>' +
    '<path d="M4 22h16"/>' +
    '<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>' +
    '<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>' +
    '<path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>',

  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',

  flame:
    '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',

  'alert-triangle':
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/>' +
    '<path d="M12 9v4"/>' +
    '<path d="M12 17h.01"/>',

  rocket:
    '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>' +
    '<path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>' +
    '<path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>' +
    '<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',

  wrench:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',

  'clipboard-list':
    '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>' +
    '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>' +
    '<path d="M12 11h4"/>' +
    '<path d="M12 16h4"/>' +
    '<path d="M8 11h.01"/>' +
    '<path d="M8 16h.01"/>',

  'arrow-right':
    '<path d="M5 12h14"/>' +
    '<path d="m12 5 7 7-7 7"/>',

  'refresh-cw':
    '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>' +
    '<path d="M21 3v5h-5"/>' +
    '<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>' +
    '<path d="M8 16H3v5"/>',

  x:
    '<path d="M18 6 6 18"/>' +
    '<path d="m6 6 12 12"/>',

  'arrow-left':
    '<path d="m12 19-7-7 7-7"/>' +
    '<path d="M19 12H5"/>',

  menu:
    '<line x1="4" x2="20" y1="6" y2="6"/>' +
    '<line x1="4" x2="20" y1="12" y2="12"/>' +
    '<line x1="4" x2="20" y1="18" y2="18"/>',

  biohazard:
    '<circle cx="12" cy="11.9" r="2"/>' +
    '<path d="M6.7 3.4c-.9 2.5 0 5.2 2.3 6.7C7.3 11 5.1 12.5 4.1 15"/>' +
    '<path d="m10.9 9.1 1.1.9"/>' +
    '<path d="M17.3 3.4c.9 2.5 0 5.2-2.3 6.7 1.7.9 3.9 2.4 4.9 4.9"/>' +
    '<path d="m13.1 9.1-1.1.9"/>' +
    '<path d="M12 14c-3.3 0-6 2.7-6 6h12c0-3.3-2.7-6-6-6"/>' +
    '<path d="M12 14v-2.1"/>',
}

const path = computed(() => ICONS[props.name] ?? '')
</script>