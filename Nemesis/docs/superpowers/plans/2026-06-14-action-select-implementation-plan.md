# 玩家行動選擇引導 — 實作計畫

設計規格：`docs/superpowers/specs/2026-06-14-action-select-design.md`

---

## Phase 1 — 更新 `player-turn.json`

**目標**：把 `player-action` 步驟改為 `action-select` 型別，填入 10 種行動的完整資料。

### 步驟

1. 將 `player-action` 的 `type` 改為 `"action-select"`，新增 `action_count: 2`
2. 新增 `actions` 陣列，依行動清單填入：
   - 8 種 `type: "card"` 行動（移動、輕聲移動、抬起重物、交易、製作物品、行動卡牌、物品卡牌、房間行動）
   - 2 種 `type: "steps"` 行動（射擊、近戰），各含 3 個子步驟
3. 保留 `per_player: true` 與 `situations` 欄位不動

**驗收**：JSON 格式正確，`npm run dev` 無報錯（GuideView 會因型別不認識而顯示空白，正常）

---

## Phase 2 — 新增 `ActionSelectCard.vue`

**目標**：建立處理行動選擇完整流程的元件。

### 步驟

1. **建立 `src/components/ActionSelectCard.vue`**

2. **Props**：
   ```js
   props: {
     step: Object,       // 完整的 action-select step 物件
     context: Object,    // { player_count, current_player }
     isLast: Boolean,
   }
   emits: ['next', 'prev', 'open-situation', 'exit']
   ```

3. **內部狀態**：
   ```js
   const view = ref('select')          // 'select' | 'card' | 'steps'
   const selectedAction = ref(null)
   const actionsDone = ref(0)
   const subStepIndex = ref(0)
   ```

4. **SelectView**：
   - Header：左側「✕ 離開」按鈕；右側玩家徽章 + `第 N 個行動，共 2 個`
   - 主體：10 個行動按鈕，`display: grid; grid-template-columns: 1fr 1fr`
   - 底部：情境觸發區（複用 `StepCard` 的 situation 樣式）
   - 點按行動 → `selectedAction = action`，`subStepIndex = 0`，`view = action.type === 'steps' ? 'steps' : 'card'`

5. **CardView**：
   - Header：同 SelectView header
   - 主體：`selectedAction.label` 為標題，`selectedAction.body` 為說明
   - Footer：左側「← 重選」（`view = 'select'`，不改 actionsDone）；右側「完成此行動 →」→ `completeAction()`

6. **StepsView**：
   - Header：`selectedAction.label` + `步驟 N / M`；右側玩家徽章
   - 主體：`selectedAction.steps[subStepIndex]` 的 title / body
   - Footer：
     - `subStepIndex === 0`：左側「← 重選」（`view = 'select'`）
     - `subStepIndex > 0`：左側「← 上一步」（`subStepIndex--`）
     - 右側：非最後步驟「下一步 →」（`subStepIndex++`）；最後步驟「完成此行動 ✓」→ `completeAction()`

7. **`completeAction()` 函式**：
   ```js
   function completeAction() {
     actionsDone.value++
     if (actionsDone.value >= step.action_count) {
       emit('next')  // 交給 GuideView 的 per_player 邏輯
     } else {
       selectedAction.value = null
       view.value = 'select'
     }
   }
   ```

**驗收**：三個 view 切換正確，完成 2 個行動後 emit('next')，emit('open-situation') 正確傳出

---

## Phase 3 — 接入 `StepCard.vue`

**目標**：讓 StepCard 能渲染 `action-select` 型別的步驟。

### 步驟

1. 在 `StepCard.vue` 引入 `ActionSelectCard`
2. 在 template 頂層新增判斷：
   ```html
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
   <template v-else>
     <!-- 現有的 collect / action / check 邏輯不動 -->
   </template>
   ```

**驗收**：進入玩家回合的「玩家執行行動」步驟，正確顯示行動選擇畫面

---

## Phase 4 — 樣式打磨

**目標**：確保 ActionSelectCard 視覺與現有 StepCard 一致，行動格 grid 在手機上正常顯示。

### 步驟

1. 行動按鈕格子：桌面 2 欄，手機 2 欄（格子等寬）
2. Header、Footer padding 與 StepCard 一致（`16px 24px` / `20px 48px`）
3. 手機 Footer padding 改為 `16px 24px`
4. 情境觸發區樣式與 StepCard 的 `.situation-triggers` 相同
5. 玩家徽章複用 StepCard 的 `.player-badge` 樣式

**驗收**：手機瀏覽器（或 DevTools 375px）行動格正常，footer 不被截斷

---

## Phase 5 — 端對端測試

**目標**：完整走一遍 3 人遊戲的玩家回合。

### 測試情境

1. **基本流程**：玩家 1 選移動（卡片）→ 完成 → 選射擊（子步驟 3 步）→ 完成 → emit('next') → 玩家 2 出現
2. **重選**：選移動後按「← 重選」→ 回到選擇畫面，actionsDone 不變
3. **子步驟返回**：射擊第 2 步按「← 上一步」→ 回到第 1 步；第 1 步按「← 重選」→ 回到選擇畫面
4. **情境觸發**：選擇畫面按「遭遇異形」→ SituationOverlay 開啟 → 關閉後回到選擇畫面
5. **最後一位玩家**：玩家 3 完成 2 個行動 → 步驟前進到「確認是否所有玩家都跳過」

---

## 實作順序摘要

| Phase | 內容 | 預估工作量 |
|-------|------|-----------|
| 1 | 更新 player-turn.json | 小 |
| 2 | 新增 ActionSelectCard.vue | 中 |
| 3 | 接入 StepCard.vue | 小 |
| 4 | 樣式打磨 | 小 |
| 5 | 端對端測試 | 小 |