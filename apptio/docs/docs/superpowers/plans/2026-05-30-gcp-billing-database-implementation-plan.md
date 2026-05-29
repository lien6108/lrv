# GCP Billing Database — Implementation Plan

> **Spec:** `docs/docs/superpowers/specs/2026-05-30-gcp-billing-database-design.md`
>
> **Goal:** 建立 SQLite 資料庫 + Python 匯入腳本，支援從帳單 Excel 與專案主檔寫入四張表。

**Tech stack:** Python 3、sqlite3（標準庫）、openpyxl、pandas（選用）

**Output files:**
- `backend/schema.sql`
- `backend/importer.py`
- `backend/db.py`（資料庫連線與初始化）

---

### Task 1：建立資料庫 schema

**Files:**
- Create: `backend/schema.sql`
- Create: `backend/db.py`

- [ ] Step 1: 建立 `backend/` 資料夾。
- [ ] Step 2: 將 spec 第 3 節四張表的 DDL 寫入 `schema.sql`，含所有 INDEX 與 UNIQUE constraint。
- [ ] Step 3: 在 `db.py` 實作 `get_connection(db_path)` 與 `init_db(db_path)` 兩個函式：`init_db` 讀取 `schema.sql` 並執行，若資料表已存在則跳過（`IF NOT EXISTS`）。
- [ ] Step 4: 手動執行 `python backend/db.py` 驗證資料庫可建立、四張表存在。
- [ ] Step 5: Commit（`feat: add SQLite schema and db init`）。

---

### Task 2：匯入專案主檔（`project_master`）

**Files:**
- Create: `backend/importer.py`

- [ ] Step 1: 在 `importer.py` 實作 `import_projects(db_path, excel_path)` 函式：
  - 開啟 `上雲專案預算控管表（GCP 總表）_超新版.xlsx` 的 `雲端專案控管表` sheet。
  - 第 1 列為欄位名稱，從第 2 列起讀資料。
  - 僅取 `project_id`（`專案編號(Project ID)`）、`apid`、`category`（`類別`）、`department`（`部門`）、`section`（`科別`）、`project_name`（`專案名稱`）、`environment`（`環境`）、`cost_center`（`成本中心`）。
  - 跳過 `project_id` 為空的列。
  - 使用 `INSERT OR REPLACE` 做 upsert（project_id 唯一）。
- [ ] Step 2: 在 `importer.py` 加入 CLI 入口：`python importer.py --projects --db billing.db`。
- [ ] Step 3: 執行一次，確認 `project_master` 有資料且 `project_id` 不重複。
- [ ] Step 4: Commit（`feat: import project_master from budget control workbook`）。

---

### Task 3：匯入帳單明細（`billing_line_item` + `billing_summary`）

**Files:**
- Modify: `backend/importer.py`

- [ ] Step 1: 實作 `import_billing(db_path, folder_path, billing_year_month)` 函式：
  - 從 `folder_path` 最後一層路徑取得 `billing_group`（例如 `AI`）。
  - 嘗試在 `billing_file` 寫入一筆記錄；若 UNIQUE constraint 衝突則停止並回報「已匯入，跳過」。
  - 取得新建的 `billing_file_id`。
- [ ] Step 2: 實作讀取明細子函式 `_read_line_items(xlsx_path)`：
  - 開啟 Excel，分別讀取 `國泰世華` 與 `Apigee` 兩個 sheet。
  - 以第 12 列為欄位名稱，第 13 列起為資料。
  - 折扣欄位 NULL 補 0，日期欄位轉為 `YYYY-MM-DD` 字串。
  - 回傳合併後的 row list。
- [ ] Step 3: 批次 INSERT 明細至 `billing_line_item`（使用 `executemany`）。
- [ ] Step 4: 實作讀取摘要子函式 `_read_summary(xlsx_path)`：
  - 讀取第一個 sheet 的 F3:H10 區塊。
  - 對應欄位：`gcp_usage_total_usd`（H3）、`partner_usage_total_usd`（H4）、`exchange_rate`（G5）、`total_payable_twd`（H10）。
- [ ] Step 5: INSERT 摘要至 `billing_summary`。
- [ ] Step 6: 在 CLI 加入：`python importer.py --billing docs/2026/2026-04/AI --month 2026-04 --db billing.db`。
- [ ] Step 7: 對 `2026-04/AI` 執行一次，確認：
  - `billing_file` 有一筆記錄。
  - `billing_line_item` 筆數與 Excel 資料列數相符。
  - `billing_summary` 金額與 Excel F3:H10 相符。
- [ ] Step 8: 再對 `2026-04/核心現代化` 與 `2026-04/資訊` 執行，確認三組資料各自獨立。
- [ ] Step 9: Commit（`feat: import billing line items and summary from Excel`）。

---

### Task 4：驗證跨表 join 查詢

**Files:**
- Create: `backend/verify.py`（臨時驗證腳本，驗完可刪）

- [ ] Step 1: 執行 spec 第 6 節三個範例查詢，確認結果合理：
  - 某月某群組 partner_cost 合計。
  - 某月 Top 10 專案費用（含部門/科別）。
  - 某月各群組應付金額。
- [ ] Step 2: 確認 `billing_line_item` 中存在但 `project_master` 無對應的 `project_id` 清單（未建檔專案），數量合理。
- [ ] Step 3: Commit（`feat: verify cross-table join queries`）。

---

## 驗收條件

- [ ] 四張表可正確建立，重複執行 `init_db` 不報錯。
- [ ] `project_master` 匯入後 `project_id` 唯一無重複。
- [ ] 同一 `billing_group` + `billing_year_month` 重複匯入時，系統明確回報跳過而非靜默失敗。
- [ ] `billing_summary` 的 `total_payable_twd` 與 Excel H10 誤差為 0（直接取值，非計算）。
- [ ] 2026-04 三個群組（AI、核心現代化、資訊）均可成功匯入且互不干擾。
