# 玩家輪換與行動費用系統 — 設計規格

## 概述

在「玩家執行行動」步驟中引入多玩家輪換機制與行動點數（AP）預算系統。玩家人數由準備階段收集，並貫通至玩家回合；每位玩家各自完成 2 AP 的行動後換下一位，所有玩家完成後才推進至下一步驟。

**影響範圍**：`player-turn.json`、`useGuideSession.js`、`ActionSelectCard.vue`、`GuideView.vue`

---

## 資料結構

### `player-turn.json`

`player-action` 步驟的 `action_count` 改名為 `action_points`（語意更準確）：

```json
{
  "id": "player-action",
  "type": "action-select",
  "per_player": true,
  "action_points": 2,
  ...
}
```

每個 action 新增 `cost` 欄位：

```json
{ "id": "quiet-move", "cost": 2 }
```

其餘所有行動均為 `"cost": 1`（可省略，元件預設值為 1）。

### Action cost 規則

| 行動 | AP 費用 |
|------|---------|
| 移動 | 1 |
| 輕聲移動 | 2 |
| 射擊 | 1 |
| 近戰 | 1 |
| 抬起重物 | 1 |
| 交易 | 1 |
| 製作物品 | 1 |
| 行動卡牌 | 1 |
| 物品卡牌 | 1 |
| 房間行動 | 1 |

---

## `useGuideSession.js` 異動

`next()` 新增 `per_player` 輪換判斷，其餘 API 不變：

```js
function next() {
  const step = currentStep.value
  if (step.per_player && context.current_player < context.player_count) {
    context.current_player++       // 留在同一 step，切換下一位玩家
  } else {
    context.current_player = 1    // 重設（為下一輪回合備用）
    if (!isLast.value) stepIndex.value++
  }
}
```

`reset()` 不需要修改（`current_player = 1` 已在其中）。

---

## `ActionSelectCard.vue` 異動

### AP 追蹤

移除 `actionsDone`，改用 `apRemaining`：

```js
const apRemaining = ref(props.step.action_points)  // 初始為 2

function completeAction() {
  apRemaining.value -= selectedAction.value.cost ?? 1
  if (apRemaining.value <= 0) {
    emit('next')            // 通知 session：此玩家行動結束
  } else {
    view.value = 'select'  // 仍有 AP，回到選擇畫面
    selectedAction.value = null
    subStepIndex.value = 0
  }
}
```

### AP 視覺顯示

Header 右側將「第 X 個行動，共 2 個」替換為圓點 pips：

- `step.action_points` 決定圓點總數
- `apRemaining` 決定填滿數量
- 例：`● ●`（剩 2）→ `● ○`（剩 1）

### 交接畫面（Handoff View）

`GuideView` 對 ActionSelectCard 加 `:key="context.current_player"`，確保每位玩家都是全新的元件實例，防止內部狀態殘留。

元件 mount 時，若非第一位玩家則進入交接畫面：

```js
const view = ref(props.context.current_player > 1 ? 'handoff' : 'select')
```

交接畫面內容：

```
玩家 N，換你了

還有 M 位玩家待行動        （僅在 M > 0 時顯示）

              [開始行動 →]
```

- 按下「開始行動」才切換至 `select` view，防止其他玩家偷看
- `M = player_count - current_player`（當前玩家之後還有幾位）

---

## `GuideView.vue` 異動

在渲染 `ActionSelectCard` 的地方加上 `:key`：

```html
<ActionSelectCard
  :key="context.current_player"
  :step="currentStep"
  :context="context"
  ...
/>
```

---

## 資料流總覽

```
setup-player-count (collect)
  → context.player_count = N

player-action (action-select, per_player: true)
  ActionSelectCard [key=current_player=1]
    view: select → card/steps → completeAction → emit('next')
  useGuideSession.next()
    current_player < player_count → current_player++ (step 不動)
  ActionSelectCard [key=current_player=2]
    view: handoff → 按確認 → select → ... → emit('next')
  ... (重複至所有玩家完成)
  useGuideSession.next()
    current_player === player_count → current_player=1, stepIndex++

player-skip-check (action)
  → 正常推進
```

---

## 邊界情況

- **只有 1 位玩家**：`per_player` 判斷不成立，`next()` 直接推進，行為與現在相同，不顯示交接畫面
- **輕聲移動（cost: 2）**：`apRemaining` 從 2 扣至 0，直接 emit `next`，不回到選擇畫面
- **`player_count` 未設定（null）**：`context.current_player < context.player_count` 為 false，`next()` 直接推進，向後相容

---

## 不在本次範圍

- 「跳過回合」機制（player-skip-check 步驟已獨立處理）
- 玩家排序 / 起始玩家標記追蹤
- 行動卡牌的逐張費用查詢