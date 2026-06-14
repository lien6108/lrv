# Nemesis 逐步引導模式實作計劃

**日期**：2026-06-14  
**規格來源**：[docs/superpowers/specs/2026-06-14-step-by-step-guide-design.md](../specs/2026-06-14-step-by-step-guide-design.md)

---

## 總覽

將現有靜態 Markdown 閱讀器改為逐步互動引導系統。工作分為七個階段，每個階段可獨立驗證。

**關鍵技術決策**：內容從 Markdown 元件改為 **JSON 資料檔**（無需新增依賴），由 GuideView 動態 import 並渲染步驟卡片。

---

## Phase 1 — 內容資料格式定義

**目標**：確立 JSON schema，先轉換一個 phase 檔作為範本。

### Task 1.1 — 建立 content/phases/setup.json

將現有 `content/phases/setup.md` 改寫為 JSON 步驟格式。

```json
{
  "title": "遊戲設置",
  "order": 1,
  "steps": [
    {
      "id": "setup-1",
      "type": "action",
      "title": "準備主板",
      "body": "將主板放置於桌面中央，連接走廊磁磚，確認所有房間標記朝上。"
    },
    {
      "id": "setup-players",
      "type": "collect",
      "title": "確認玩家人數",
      "prompt": "這次遊玩幾位玩家？",
      "context_key": "player_count",
      "options": [2, 3, 4, 5]
    },
    {
      "id": "setup-characters",
      "type": "action",
      "title": "抽取角色卡",
      "body": "每位玩家從角色卡牌堆抽取一張，取得對應的起始手牌、角色指示物與特殊能力說明。"
    },
    {
      "id": "setup-tokens",
      "type": "check",
      "title": "放置起始指示物",
      "body": "依據角色卡指示，將各玩家的指示物放置在起始房間。確認所有組件就位。",
      "situations": [
        { "id": "malfunction" }
      ]
    }
  ]
}
```

**驗證**：JSON 格式正確，能被 `JSON.parse()` 解析。

---

## Phase 2 — Composable：useGuideSession

**檔案**：`src/composables/useGuideSession.js`（新建）

**職責**：
- 維護 `stepIndex`（目前步驟）
- 維護 `context`（session 狀態：player_count、current_player）
- 維護 `overlayOpen`（是否開啟狀況覆蓋層）與 `activeситuation`（當前狀況 ID）
- 提供 `next()`、`prev()`、`collectValue(key, val)`、`openSituation(id)`、`closeSituation()`

```js
import { reactive, ref } from 'vue'

export function useGuideSession(steps) {
  const stepIndex = ref(0)
  const context = reactive({ player_count: null, current_player: 1 })
  const overlayOpen = ref(false)
  const activeSituation = ref(null)

  const currentStep = () => steps[stepIndex.value]
  const isLast = () => stepIndex.value === steps.length - 1

  function next() {
    if (!isLast()) stepIndex.value++
  }

  function prev() {
    if (stepIndex.value > 0) stepIndex.value--
  }

  function collectValue(key, val) {
    context[key] = val
    next()
  }

  function openSituation(id) {
    activeSituation.value = id
    overlayOpen.value = true
  }

  function closeSituation() {
    overlayOpen.value = false
    activeSituation.value = null
  }

  return {
    stepIndex, context, overlayOpen, activeSituation,
    currentStep, isLast, next, prev, collectValue,
    openSituation, closeSituation,
  }
}
```

**驗證**：`next()` 遞增索引，`prev()` 遞減，`collectValue` 更新 context 並前進，`openSituation` 設定 overlayOpen。

---

## Phase 3 — StepCard 元件

**檔案**：`src/components/StepCard.vue`（新建）

**Props**：
- `step` — 步驟物件（含 type、title、body、prompt、options、situations）
- `index` — 目前步驟序號（1-based）
- `total` — 總步驟數
- `context` — session context（顯示玩家回合進度用）

**Emits**：`next`、`prev`、`collect(key, val)`、`open-situation(id)`

**三種渲染型態**：

```
type: action  → 顯示 title + body + 上一步/下一步
type: collect → 顯示 prompt + options 按鈕（點擊後 emit collect）
type: check   → 顯示 title + body + 狀況選項按鈕 + 上一步/下一步
```

**玩家回合追蹤**（在 GuideView 層控制，非 StepCard）：若目前階段是 `player-turn`，GuideView 在頂部額外顯示「玩家回合：第 N 位 / 共 M 位」。

**佈局結構**：

```html
<div class="guide-card">
  <div class="guide-card__header">
    <button class="exit-btn" @click="$emit('exit')">✕ 離開</button>
    <span class="step-counter">第 {{ index }} 步，共 {{ total }} 步</span>
  </div>
  <div class="guide-card__body">
    <!-- action / collect / check 依 type 渲染 -->
  </div>
  <div class="guide-card__footer">
    <button v-if="index > 1" class="prev-btn" @click="$emit('prev')">← 上一步</button>
    <button v-if="type !== 'collect'" class="next-btn" @click="$emit('next')">下一步 →</button>
  </div>
</div>
```

**驗證**：三種 type 各自渲染正確；collect 點擊後 emit 正確；check 顯示狀況按鈕。

---

## Phase 4 — SituationOverlay 元件

**檔案**：`src/components/SituationOverlay.vue`（新建）

**Props**：`situationId`（String）

**Emits**：`close`

**行為**：
1. 根據 `situationId` 動態 import `content/situations/${situationId}.json`
2. 內部維護自己的 `stepIndex`（局部 ref，不共用 useGuideSession）
3. 使用與主流程相同的 StepCard 元件渲染每個步驟
4. 最後一步完成後：顯示「✓ 狀況處理完畢」畫面 + 「回到主流程」按鈕（emit close）
5. 「離開引導」按鈕觸發 emit close（GuideView 層處理後續退出邏輯）

**佈局**：position fixed，覆蓋整個畫面，背景色與主流程相同（`#111827`）。

**驗證**：載入狀況 JSON、逐步前進、最後顯示完成畫面、close 事件觸發後消失。

---

## Phase 5 — GuideView + Router

### Task 5.1 — 建立 GuideView.vue

**檔案**：`src/views/GuideView.vue`（新建）

**職責**：
- 從路由參數 `$route.params.phase` 取得階段 ID
- 動態 import `content/phases/${phase}.json`
- 呼叫 `useGuideSession(steps)`
- 渲染 StepCard，傳入 props 並接聽 emits
- 控制 SituationOverlay（傳入 activeSituation、監聽 close）
- 管理「離開引導」確認對話框（confirm 後 router.push('/')）
- 最後一步完成後顯示結束畫面

**App.vue 整合**：GuideView 需要隱藏 AppSidebar。做法：在 App.vue 中讀取目前路由，若 path 包含 `/guide/` 則不渲染 AppSidebar。

```js
// App.vue
const isGuideMode = computed(() => route.path.startsWith('/guide/'))
```

```html
<!-- App.vue template -->
<AppSidebar v-if="!isGuideMode" />
<RouterView />
```

### Task 5.2 — 更新 router/index.js

```js
{
  path: '/guide/:phase',
  component: () => import('../views/GuideView.vue'),
},
{
  path: '/phase/:id',
  redirect: to => `/guide/${to.params.id}`,
},
```

**移除**：`/situation/:id` 路由（狀況改由 overlay 處理，不再是獨立頁面）。

**驗證**：瀏覽器開啟 `/#/guide/setup`，正確渲染步驟卡片且 Sidebar 消失。

---

## Phase 6 — 內容遷移：所有階段

將 7 個 phase Markdown 檔改寫為 JSON 步驟格式。先完成 Phase 1 的 setup.json 作為範本。

### Task 6.1 — content/phases/setup.json（已在 Phase 1 完成範本）

正式轉換完整內容（含玩家人數 collect 步驟）。

### Task 6.2 — content/phases/player-turn.json

包含：行動點數說明 → 行動選擇 → 結束回合確認。  
特殊處理：GuideView 針對此階段在頂部顯示「玩家回合：第 N 位 / 共 M 位」，每次「完成本回合」後 `current_player++`，達到 `player_count` 後進入結束畫面。

### Task 6.3 — content/phases/event-phase.json

包含：抽取事件卡 → 解讀效果 → 執行指令。  
含 check 步驟（可能觸發火警、系統故障）。

### Task 6.4 — content/phases/intruder-phase.json

包含：入侵者移動 → 攻擊判定 → 驚嚇檢定。  
含 check 步驟（可能觸發遭遇異形）。

### Task 6.5–6.7 — 其餘三個 phase 檔

- `map-rooms.json`
- `victory-conditions.json`
- `character-death.json`

**驗證原則**：每個 JSON 檔的 steps 陣列長度合理（5–15 步），每個步驟 body 在 30–60 字以內，check 步驟的 situations 引用的 ID 與 situations/ 目錄對應。

---

## Phase 7 — 內容遷移：所有狀況

將 6 個 situation Markdown 檔改寫為 JSON 格式。狀況 JSON 無 `collect` 步驟，最後一步不需 `next` 按鈕（GuideView/SituationOverlay 自動顯示「完成」畫面）。

- `content/situations/encounter-alien.json`
- `content/situations/fire.json`
- `content/situations/contamination.json`
- `content/situations/character-death.json`
- `content/situations/escape-pod.json`
- `content/situations/malfunction.json`

格式範例（`fire.json`）：

```json
{
  "title": "發現火警",
  "severity": "high",
  "steps": [
    { "id": "fire-1", "type": "action", "title": "確認火源位置", "body": "找出火焰標記所在的房間，確認其在地圖上的位置。" },
    { "id": "fire-2", "type": "action", "title": "執行滅火動作", "body": "消耗一個行動點，對當前房間的火焰標記進行滅火。移除該房間的火焰標記。" },
    { "id": "fire-3", "type": "action", "title": "確認蔓延", "body": "若本回合火警未撲滅，在相鄰走廊放置一個新的火焰標記。" }
  ]
}
```

---

## Phase 8 — 清理與樣式

### Task 8.1 — 移除舊元件

- 刪除 `src/views/SituationView.vue`（狀況改由 overlay 處理）
- 刪除 `src/components/SituationModal.vue`（職責由 SituationOverlay 取代）
- 刪除 `src/views/PhaseView.vue`（職責由 GuideView 取代）
- 刪除舊 Markdown 檔（`content/phases/*.md`、`content/situations/*.md`），保留 JSON 版本

### Task 8.2 — 更新 HomeView.vue

將首頁入口按鈕的連結從 `/phase/:id` 改為 `/guide/:id`。

### Task 8.3 — 更新 vite.config.js

移除 `unplugin-vue-markdown`（內容已改為 JSON，不再需要 Markdown 編譯）：

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
```

移除 `unplugin-vue-markdown` 套件：

```bash
npm uninstall unplugin-vue-markdown markdown-it
```

### Task 8.4 — 新增 CSS 樣式（style.css）

新增引導模式專用樣式：

```css
/* 步驟卡片 */
.guide-card { ... }
.guide-card__header { ... }
.guide-card__body { ... }
.guide-card__footer { ... }

/* 狀況覆蓋層 */
.situation-overlay { position: fixed; inset: 0; background: #111827; z-index: 100; }

/* Collect 選項按鈕 */
.collect-options { display: flex; gap: 1rem; justify-content: center; }
.collect-btn { ... }

/* 狀況觸發按鈕 */
.situation-triggers { border: 1px solid #e63946; border-radius: 8px; padding: 1rem; }
.situation-btn { background: transparent; border: 1px solid #e63946; color: #e63946; }

/* 完成畫面 */
.guide-complete { text-align: center; padding: 4rem 2rem; }
```

**驗證**：`npm run build` 無錯誤，`npm run dev` 開啟首頁正常，點擊任一階段進入引導模式，步驟卡片渲染正確，狀況覆蓋層開關正常。

---

## 實作順序建議

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6（setup 優先）→ Phase 7（一個 situation 優先）→ Phase 8
```

每完成一個 Phase 應在 dev server 驗證功能再繼續。建議先完成 setup + 一個 situation 的完整流程（Phase 1–7 各一個檔案），確認端對端可行後再批量遷移其餘內容。

---

## 不在本次範圍

- 玩家存活狀態追蹤
- 多語言支援
- 離線快取
- 擴充包內容