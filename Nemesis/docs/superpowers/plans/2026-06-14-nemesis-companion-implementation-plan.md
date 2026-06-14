# 異形：復仇女神號 輔助系統 — 實作計畫

設計規格：`docs/superpowers/specs/2026-06-14-nemesis-companion-design.md`

---

## Phase 1 — 專案初始化

**目標**：建立可運行的空白 Vue 3 + Vite 專案，確認開發環境與部署流程正常。

### 步驟

1. **建立 Vite 專案**
   ```bash
   npm create vite@latest . -- --template vue
   npm install
   ```

2. **安裝依賴**
   ```bash
   npm install vue-router@4
   npm install vite-plugin-md
   npm install @mdit-vue/plugin-front-matter @mdit-vue/plugin-sfc
   ```

3. **設定 `vite.config.js`**
   - 加入 `vite-plugin-md`，啟用 frontmatter 解析
   - 設定 Markdown 選項：`headEnabled: true`

4. **建立基本目錄結構**
   ```
   src/
   ├── components/
   ├── views/
   ├── router/
   │   └── index.js
   ├── App.vue
   └── main.js
   content/
   ├── phases/
   ├── situations/
   └── rules/
   ```

5. **設定 Vue Router**
   - 路由：`/`、`/phase/:id`、`/situation/:id`
   - history mode：`createWebHashHistory`（Cloudflare Pages 相容）

6. **驗收**：`npm run dev` 首頁正常顯示，路由切換無錯誤

---

## Phase 2 — 佈局骨架

**目標**：建立側邊欄 + 主內容區的固定佈局，深色主題，無實際內容。

### 步驟

1. **`App.vue`**：設定全頁佈局（flex row：sidebar + router-view）

2. **`AppSidebar.vue`**
   - 固定左側，寬度 200px
   - 列出靜態階段清單（先 hardcode，Phase 3 再動態化）
   - 點選項目用 `router-link` 導向 `/phase/:id`
   - 當前路由高亮樣式

3. **`HomeView.vue`（`/`）**
   - 簡短歡迎說明
   - 兩個快速入口按鈕：「查看遊戲流程」→ `/phase/setup`、「緊急查詢」→ 觸發 modal

4. **全域 CSS**
   - 深色主題變數：`--color-bg: #111827`、`--color-accent: #e63946`
   - 基本 reset 與 typography

5. **驗收**：側邊欄與主內容區正常顯示，路由切換 router-view 更新

---

## Phase 3 — Markdown 內容渲染

**目標**：Markdown 檔案能被正確解析並渲染為樣式化頁面。

### 步驟

1. **建立所有內容 Markdown 檔案**（先填入基本骨架，完整內容後續補充）
   - `content/phases/`：setup.md、player-turn.md、event-phase.md、intruder-phase.md
   - `content/situations/`：6 個情境檔
   - `content/rules/`：map-rooms.md、victory-conditions.md

2. **`PhaseView.vue`**
   - 根據 `:id` 動態 import 對應 Markdown 元件
   - 讀取 frontmatter（title、icon）顯示於頁面頂部

3. **`MarkdownRenderer.vue`**
   - 接收渲染後的 HTML 字串
   - 自訂 CSS：`## 步驟` 轉為卡片樣式
   - Blockquote `⚠️` → 黃色警示框，`❌` → 紅色錯誤框

4. **`StepBlock.vue`**
   - Props：`number`、`title`、`content`
   - 樣式：左側紅色邊線 + 編號徽章

5. **`AppSidebar.vue` 動態化**
   - 從 `content/phases/` 自動讀取 frontmatter 生成導覽清單（用 `import.meta.glob`）
   - 依 frontmatter `order` 欄位排序

6. **驗收**：點選側邊欄項目，主內容區正確渲染對應 Markdown，步驟卡片與警示框樣式正常

---

## Phase 4 — 緊急情境 Modal

**目標**：浮動按鈕 + Modal 完整功能，情境說明在 modal 內展開。

### 步驟

1. **`SituationModal.vue`**
   - 右下角固定浮動按鈕「⚡ 緊急情境」
   - 點按後顯示 modal overlay
   - Modal 內：2×3 情境圖示格，每格含 icon + 名稱

2. **Modal 內部狀態**
   - `view: 'list' | 'detail'`
   - `list`：顯示情境格
   - `detail`：顯示選中情境的 Markdown 內容 + 返回按鈕

3. **Markdown 動態載入**
   - 點選情境格後，動態 import 對應 `content/situations/*.md`
   - 在 modal 內渲染（複用 `MarkdownRenderer.vue`）

4. **關閉行為**：ESC 鍵、點 ✕、點 overlay 背景皆可關閉

5. **驗收**：浮動按鈕正常顯示，情境格點選後展開說明，關閉行為正確

---

## Phase 5 — 遊戲內容填充

**目標**：將完整的基本版規則填入所有 Markdown 檔案。

### 步驟

1. **`setup.md`**：準備流程、板塊排列、角色選擇、初始卡牌分配
2. **`player-turn.md`**：行動選擇（移動/攻擊/搜索/潛行/休息/使用物品）、噪音判定
3. **`event-phase.md`**：翻事件牌流程、各類事件效果說明
4. **`intruder-phase.md`**：入侵者移動規則、噪音追蹤、發展牌
5. **6 個情境 Markdown**：每個情境含「立即執行」步驟清單與注意事項
6. **`map-rooms.md`**：房間類型與移動規則
7. **`victory-conditions.md`**：各陣營勝利/失敗條件

---

## Phase 6 — 部署

**目標**：上線至 Cloudflare Pages。

### 步驟

1. **建立 `.gitignore`**：排除 `node_modules/`、`dist/`、`.superpowers/`
2. **Push 到 GitHub**
3. **Cloudflare Pages 設定**
   - Build command：`npm run build`
   - Build output dir：`dist`
   - Root dir：`Nemesis`（monorepo 子目錄）
4. **驗收**：部署成功，手機瀏覽器開啟正常，路由切換無 404

---

## 實作順序摘要

| Phase | 內容 | 預估工作量 |
|-------|------|-----------|
| 1 | 專案初始化 | 小 |
| 2 | 佈局骨架 | 小～中 |
| 3 | Markdown 渲染 | 中 |
| 4 | 緊急情境 Modal | 中 |
| 5 | 內容填充 | 大（規則撰寫為主） |
| 6 | 部署 | 小 |

建議從 Phase 1 開始直線推進，Phase 5 內容填充可在 Phase 4 完成後分批進行。
