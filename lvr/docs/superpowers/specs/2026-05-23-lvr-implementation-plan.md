# LVR 實作計劃

依據設計文件：`2026-05-23-lvr-database-query-design.md`

---

## Phase 1：本機資料準備

### Step 1 — 建立 schema.sql
- 新增 `schema.sql` 於 repo 根目錄
- 內含 `CREATE TABLE transactions` 與 4 個索引（district, building_type, transaction_date, total_price）

### Step 2 — 撰寫 `scripts/excel_to_sqlite.py`
- 讀取 `row data.xlsx`（工作表1）
- 對應 42 個欄位至英文欄名
- 清理資料：
  - 交易年月 → INTEGER（去除非數字字元）
  - 數值欄位 → NULL 取代 NaN
  - 文字欄位 → strip 空白
- 輸出 `lvr.db`（SQLite）
- 驗證：印出行數與 sample 5 筆

### Step 3 — 建立 Cloudflare D1 資料庫並匯入
```bash
# 在 Cloudflare Dashboard 或 CLI 建立 D1
wrangler d1 create lvr_db

# 建表
wrangler d1 execute lvr_db --file=schema.sql

# 匯入 SQLite 檔
wrangler d1 import lvr_db --local-db lvr.db
```
- 驗證筆數：`wrangler d1 execute lvr_db --command="SELECT COUNT(*) FROM transactions"`

---

## Phase 2：Cloudflare Worker

### Step 4 — 建立 `wrangler.toml`
```toml
name = "lvr"
main = "src/index.js"
compatibility_date = "2025-01-01"

[assets]
directory = "./public"

[[d1_databases]]
binding = "DB"
database_name = "lvr_db"
database_id = "<從 wrangler d1 create 取得>"
```

### Step 5 — 撰寫 `src/index.js`

路由邏輯：
```
GET /          → 回傳 public/index.html（由 assets 自動處理）
GET /api/options  → 查詢 distinct district, building_type
GET /api/search   → 帶 WHERE 條件的分頁查詢
OPTIONS /*     → CORS preflight（development 用）
```

`/api/search` 查詢邏輯：
1. 解析 query string 參數
2. 動態組裝 WHERE clause（只加有傳值的條件）
3. COUNT(*) 取總數
4. SELECT 核心欄位 + LIMIT/OFFSET 分頁
5. 回傳 `{ total, page, limit, data }`

安全注意事項：
- 所有參數使用 D1 prepared statements（`?` binding），防止 SQL injection
- `limit` 最大值限制 100

### Step 6 — 撰寫 `public/index.html`

結構：
1. `<head>`：Tailwind CDN（輕量樣式，不需 build step）
2. `<body>`：
   - 篩選區：地區下拉、建物型態下拉、價格範圍輸入、年份輸入、查詢按鈕
   - 結果區：筆數標示、資料表格、分頁按鈕
3. `<script>`：
   - `loadOptions()` — 頁面載入時呼叫 `/api/options`，填充下拉
   - `search(page)` — 組裝 query string，呼叫 `/api/search`，渲染表格
   - 年份轉換：西元年輸入 → ROC YYYMMDD（`(year - 1911) * 10000 + 101`）
   - 分頁：上/下一頁按鈕更新 `currentPage` 並重新呼叫 `search()`

---

## Phase 3：部署與驗證

### Step 7 — 推上 GitHub 觸發部署
```bash
git add .
git commit -m "feat: initial LVR query worker"
git push
```
- Cloudflare Workers 連結 GitHub repo，push 後自動部署

### Step 8 — 驗證
- 開啟 Workers 提供的 URL
- 測試各篩選條件組合
- 確認分頁正確
- 確認無 SQL injection 風險（parameters 用 binding）

---

## 檔案清單（完成後）

```
lrv/
├── wrangler.toml
├── schema.sql
├── src/
│   └── index.js
├── public/
│   └── index.html
├── scripts/
│   └── excel_to_sqlite.py
└── docs/
    └── superpowers/specs/
        ├── 2026-05-23-lvr-database-query-design.md
        └── 2026-05-23-lvr-implementation-plan.md
```

---

## 注意事項

- `row data.xlsx` 不納入 git（檔案太大，且含原始資料）
- `lvr.db` 也不納入 git（改由 wrangler d1 import 管理）
- `.gitignore` 需加入 `*.db`、`*.xlsx`、`out.txt`
