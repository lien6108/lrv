import { reactive } from 'vue'

const context = reactive({ player_count: null, current_player: 1 })

export function useGameContext() {
  return context
}