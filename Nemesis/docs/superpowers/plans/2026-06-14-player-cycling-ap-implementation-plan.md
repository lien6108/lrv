# 玩家輪換與行動費用系統 — 實作計畫

參考規格：`docs/superpowers/specs/2026-06-14-player-cycling-ap-design.md`

---

## 實作順序

從資料層開始，由內而外，每步都可獨立測試。

---

## Step 1 — `content/phases/player-turn.json`

**目標**：`action_count → action_points`，為 `quiet-move` 加 `cost: 2`。

1. 將 `"action_count": 2` 改為 `"action_points": 2`
2. 在 `quiet-move` action 物件中加入 `"cost": 2`
3. 其餘 9 個 action 不需要改動（元件預設 cost = 1）

**驗證**：`player-turn.json` 格式正確，在瀏覽器 network tab 可看到新欄位。

---

## Step 2 — `src/composables/useGuideSession.js`

**目標**：`next()` 加入 per_player 輪換邏輯。

修改 `next()` 函式（約第 14 行）：

```js
function next() {
  const step = currentStep.value
  if (step.per_player && context.current_player < context.player_count) {
    context.current_player++
  } else {
    context.current_player = 1
    if (!isLast.value) stepIndex.value++
  }
}
```

**驗證**：在 DevTools console 手動呼叫 `session.next()`，觀察 `context.current_player` 遞增，直到 `player_count` 後才推進 stepIndex。

---

## Step 3 — `src/views/GuideView.vue`

**目標**：對 ActionSelectCard 加 `:key="context.current_player"`。

找到渲染 `ActionSelectCard` 的地方，加上 key：

```html
<ActionSelectCard
  :key="context.current_player"
  :step="currentStep"
  :context="context"
  :is-last="isLast"
  @next="next"
  @prev="prev"
  @open-situation="openSituation"
  @exit="reset"
/>
```

**驗證**：切換 `current_player` 時，Vue DevTools 可看到元件被銷毀並重建。

---

## Step 4 — `src/components/ActionSelectCard.vue`

這是改動最多的一步，分為四個子任務：

### 4a — 初始 view 邏輯

將 `view` 的初始值改為：

```js
const view = ref(props.context.current_player > 1 ? 'handoff' : 'select')
```

### 4b — AP 追蹤

移除 `actionsDone`，新增 `apRemaining`：

```js
const apRemaining = ref(props.step.action_points)
```

修改 `completeAction()`：

```js
function completeAction() {
  apRemaining.value -= selectedAction.value.cost ?? 1
  if (apRemaining.value <= 0) {
    emit('next')
  } else {
    view.value = 'select'
    selectedAction.value = null
    subStepIndex.value = 0
  }
}
```

### 4c — 新增 `handoff` view template

在 `<template>` 區塊最前面（`select` view 之前）插入：

```html
<!-- ── HANDOFF VIEW ── -->
<template v-if="view === 'handoff'">
  <div class="guide-card__header">
    <button class="exit-btn" @click="$emit('exit')">✕ 離開</button>
    <span v-if="context.player_count" class="player-badge">
      玩家 {{ context.current_player }} / {{ context.player_count }}
    </span>
  </div>

  <div class="guide-card__body handoff-body">
    <p class="handoff-label">玩家 {{ context.current_player }}，換你了</p>
    <p v-if="playersRemaining > 0" class="handoff-sub">
      完成後還有 {{ playersRemaining }} 位玩家待行動
    </p>
  </div>

  <div class="guide-card__footer">
    <span></span>
    <button class="next-btn" @click="view = 'select'">開始行動 →</button>
  </div>
</template>
```

在 `<script setup>` 加入 computed：

```js
const playersRemaining = computed(
  () => (props.context.player_count ?? 1) - props.context.current_player
)
```

### 4d — AP pips 顯示

在 `select`、`card`、`steps` 三個 view 的 header 中，將：

```html
<span class="step-counter">第 {{ actionsDone + 1 }} 個行動，共 {{ step.action_count }} 個</span>
```

替換為：

```html
<span class="ap-pips">
  <span
    v-for="i in step.action_points"
    :key="i"
    class="ap-pip"
    :class="{ 'ap-pip--empty': i > apRemaining }"
  ></span>
</span>
```

在 `<style scoped>` 新增：

```css
.ap-pips {
  display: flex;
  gap: 6px;
  align-items: center;
}

.ap-pip {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-accent);
  transition: background 0.2s;
}

.ap-pip--empty {
  background: transparent;
  border: 1px solid var(--color-border-strong);
}
```

在 `handoff` view 的 body 加入：

```css
.handoff-body {
  align-items: center;
  text-align: center;
  gap: 16px;
}

.handoff-label {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
}

.handoff-sub {
  font-size: 14px;
  color: var(--color-text-dim);
}
```

---

## Step 5 — 手動測試清單

| 情境 | 預期行為 |
|------|---------|
| 3 位玩家，玩家 1 選「移動」（1 AP）| pips 變 `● ○`，回到 select view |
| 接著選任意行動（1 AP）| apRemaining = 0，emit next，current_player → 2 |
| 新元件 mount | view = handoff，顯示「玩家 2，換你了，還有 1 位待行動」|
| 玩家 2 按「開始行動」| view = select，正常行動 |
| 玩家 2 選「輕聲移動」（2 AP）| 一次扣完，直接 emit next，不回 select |
| 玩家 3 完成 | current_player = player_count，next() 推進 stepIndex，current_player 重設 1 |
| 只有 1 位玩家 | 無交接畫面，行為與改動前相同 |
| player_count = null | next() 直接推進 stepIndex，向後相容 |