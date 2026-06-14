# 異形：復仇女神號 輔助系統 — 設計規格

## 概述

一款針對新手玩家設計的桌遊輔助 Web App，幫助玩家在遊戲進行中快速查閱遊戲流程、機制說明與突發情境處理方式。

**範圍**：異形：復仇女神號基本版  
**語言**：全繁體中文  
**目標用戶**：對規則不熟悉的新手玩家

---

## 技術架構

| 項目 | 選擇 |
|------|------|
| 框架 | Vue 3 + Vite |
| 路由 | Vue Router |
| 內容格式 | Markdown（含 YAML frontmatter） |
| MD 解析 | vite-plugin-md |
| 部署 | Cloudflare Pages |
| 版控 | GitHub |

部署流程：push 到 GitHub → Cloudflare Pages 自動 build（`npm run build`）並發布 `dist/` 目錄。

---

## 頁面架構與路由

```
/                      首頁（快速導覽入口）
/phase/:id             遊戲階段說明頁
/situation/:id         緊急情境說明頁
```

首頁提供兩個快速入口：「查看遊戲流程」和「緊急查詢」，以及簡短的遊戲輪次說明。

---

## UI 佈局

採用**側邊欄 + 浮動按鈕**設計：

- **左側固定側邊欄**：列出所有遊戲階段與其他規則，點選後載入對應內容
- **右側主內容區**：渲染當前選擇的 Markdown 內容
- **右下角浮動按鈕**：「⚡ 緊急情境」，隨時可按，不受當前頁面影響

視覺風格：深色主題（黑底 + 暗紅色 `#e63946` 作為強調色），呼應異形宇宙的壓抑氛圍。

---

## 內容架構

### 遊戲階段（側邊欄導覽）

```
content/
├── phases/
│   ├── setup.md          遊戲準備
│   ├── player-turn.md    玩家回合
│   ├── event-phase.md    事件階段
│   └── intruder-phase.md 入侵者階段
├── situations/
│   ├── encounter-alien.md  遭遇異形
│   ├── fire.md             發現火警
│   ├── contamination.md    污染感染
│   ├── character-death.md  角色死亡
│   ├── escape-pod.md       逃脫艙啟動
│   └── malfunction.md      系統故障
└── rules/
    ├── map-rooms.md         地圖與房間
    └── victory-conditions.md 勝利條件
```

### Markdown frontmatter 格式

**階段類型**：
```yaml
---
title: 玩家回合
icon: 👤
order: 2
---
```

**情境類型**：
```yaml
---
title: 遭遇異形
icon: 👾
severity: high
---
```

`severity` 可為 `high`（紅色警示）或 `medium`（黃色提示），用於在 UI 上顯示對應視覺強調。

---

## 元件設計

### AppSidebar.vue
- 固定於左側，列出 `phases/` 和 `rules/` 的所有項目
- 根據當前路由高亮顯示選中項目
- 展開/收合子項目（如玩家回合的子步驟）

### PhaseView.vue
- 接收路由參數 `:id`，動態載入對應 Markdown 檔案
- 將 Markdown 傳給 `MarkdownRenderer.vue` 渲染

### MarkdownRenderer.vue
- 渲染 Markdown 為 HTML
- `## 步驟` 標題自動轉為帶編號樣式的 `StepBlock` 卡片
- `> ⚠️ 注意：` 區塊自動轉為警示樣式（黃框）
- `> ❌ 錯誤示範：` 自動轉為錯誤樣式（紅框）

### SituationModal.vue
- 右下角浮動按鈕觸發
- 彈出 modal 顯示 6 個情境格（2×3 圖示格）
- 點選情境後，在 modal 內展開對應說明（不跳頁）
- 可按 ESC 或點 ✕ 關閉

### StepBlock.vue
- 接收步驟標題與內容
- 顯示步驟編號、標題、內文
- 支援「警示」和「一般」兩種樣式

---

## 緊急情境清單

| icon | 情境名稱 | severity |
|------|----------|----------|
| 👾 | 遭遇異形 | high |
| 🔥 | 發現火警 | high |
| ☣️ | 污染感染 | high |
| 💀 | 角色死亡 | high |
| 🚀 | 逃脫艙啟動 | medium |
| ⚙️ | 系統故障 | medium |

---

## 不在範圍內

- 擴充包內容（蟲族入侵、坐骨神戟號等）
- 後台管理介面
- 多語言支援
- 離線 PWA 功能
- 玩家帳號或儲存遊戲進度
