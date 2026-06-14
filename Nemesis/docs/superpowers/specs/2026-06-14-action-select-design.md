# 玩家行動選擇引導 — 設計規格

## 概述

為「玩家回合」的「玩家執行行動」步驟新增互動式行動選擇器。玩家每回合執行 2 個行動，每次選擇後依行動類型顯示規則卡片或逐步引導，完成兩個行動後換下一位玩家。

**影響範圍**：`player-turn.json`、`StepCard.vue`、新增 `ActionSelectCard.vue`

---

## 資料結構

`player-turn.json` 中 `player-action` 步驟的 `type` 改為 `"action-select"`，新增 `action_count` 與 `actions` 欄位。

### Step schema

```json
{
  "id": "player-action",
  "type": "action-select",
  "per_player": true,
  "action_count": 2,
  "title": "玩家執行行動",
  "situations": [
    { "id": "encounter-alien" },
    { "id": "fire" },
    { "id": "contamination" },
    { "id": "malfunction" }
  ],
  "actions": [ ...見下方 ]
}
```

### Action 型別

每個 action 物件有兩種型別：

**`type: "card"`** — 簡單行動，顯示規則卡片：
```json
{
  "id": "move",
  "label": "移動",
  "icon": "footprints",
  "type": "card",
  "body": "移動到相鄰的走廊或房間（需打開艙門）。移動時產生噪音，需在起始房間擲噪音骰。"
}
```

**`type: "steps"`** — 複雜行動，逐步引導：
```json
{
  "id": "shoot",
  "label": "射擊",
  "icon": "crosshair",
  "type": "steps",
  "steps": [
    { "title": "確認目標", "body": "你與目標必須在同一房間或走廊。" },
    { "title": "擲戰鬥骰", "body": "擲 2 顆戰鬥骰，取最低點數。" },
    { "title": "結算傷害", "body": "依武器表結算傷害，消耗對應彈藥。" }
  ]
}
```

### 行動清單（10 種）

| id | label | type |
|----|-------|------|
| `move` | 移動 | card |
| `quiet-move` | 輕聲移動 | card |
| `shoot` | 射擊 | steps |
| `melee` | 近戰 | steps |
| `carry` | 抬起重物 | card |
| `trade` | 交易 | card |
| `craft` | 製作物品 | card |
| `action-card` | 行動卡牌 | card |
| `item-card` | 物品卡牌 | card |
| `room-action` | 房間行動 | card |

---

## UI 流程與狀態機

`ActionSelectCard.vue` 內部維護三個 view 狀態：

```
select ──選擇行動──▶ card   ──完成──▶ (回 select，actionsDone+1)
               └──────────▶ steps  ──走完子步驟──▶ (回 select，actionsDone+1)

actionsDone === action_count → 顯示「完成本回合」→ emit('next')
```

### 狀態變數

| 變數 | 型別 | 說明 |
|------|------|------|
| `view` | `'select' \| 'card' \| 'steps'` | 目前顯示的畫面 |
| `selectedAction` | `Object \| null` | 當前選擇的行動物件 |
| `actionsDone` | `Number` | 已完成的行動數（0→1→2） |
| `subStepIndex` | `Number` | steps 型別的子步驟進度 |

### 完整玩家流程範例

```
[玩家 1 / 3]
  第 1 個行動 → 選擇「移動」→ 規則卡片 → 完成
  第 2 個行動 → 選擇「射擊」→ 子步驟 1/3 → 2/3 → 3/3 → 完成本回合
    ↓ emit('next') → GuideView 的 per_player 邏輯接手
[玩家 2 / 3]
  ...
```

---

## 元件設計

### 元件結構

```
StepCard.vue
  └── v-if type === 'action-select'
        └── ActionSelectCard.vue
              ├── SelectView（行動格 grid）
              ├── CardView（規則卡片）
              └── StepsView（子步驟）
```

### SelectView（行動選擇畫面）

- **Header**：左側「✕ 離開」；右側玩家徽章 `玩家 X / Y` + 行動計數 `第 N 個行動，共 2 個`
- **主體**：10 個行動按鈕，2 欄 grid，每格顯示 icon + label
- **底部**：情境觸發區（與現有 check 步驟一致，顯示 situations 按鈕）

### CardView（簡單行動規則卡片）

- **Header**：同 SelectView header，保持 context 可見
- **主體**：行動名稱為 `h2` 標題，`body` 為說明文字
- **Footer**：左側「← 重選」（返回 SelectView，不計入 actionsDone）；右側「完成此行動 →」

### StepsView（複雜行動子步驟）

- **Header**：行動名稱 + 子步驟進度（`步驟 1 / 3`）；右上角顯示玩家徽章
- **主體**：子步驟 title 為 `h2`，body 為說明文字
- **Footer**：
  - 第一步左側顯示「← 重選」（返回 SelectView）
  - 其餘步驟左側顯示「← 上一步」
  - 右側「下一步 →」；最後一步顯示「完成此行動 ✓」

### 情境觸發

- 僅在 **SelectView** 底部顯示情境按鈕
- CardView / StepsView 進行中不顯示（避免干擾）
- 點擊仍觸發現有 `SituationOverlay`，關閉後回到原畫面

---

## 不需改動的部分

- `GuideView.vue` — `handleNext` / `per_player` 邏輯完全不動
- `useGuideSession.js` — 不動
- `SituationOverlay.vue` — 直接複用
- 其他 phase JSON 檔案 — 不動

---

## 不在範圍內

- 記錄玩家選了哪些行動（本局統計）
- 「跳過」行動的引導
- 擴充包行動類型