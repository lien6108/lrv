# GCP Billing SQLite Database Design

## 1. 目標

建立一個 SQLite 資料庫，將每月 GCP 帳單 Excel 檔案與專案主檔匯入，供後續查詢、對帳與報表使用。

## 2. 資料來源

| 來源 | 說明 |
|---|---|
| `docs/2026/{YYYY-MM}/{billing_group}/*.xlsx` | 每月帳單 Excel，每個資料夾視為一個帳單群組 |
| `docs/上雲專案預算控管表（GCP 總表）_超新版.xlsx` | 專案主檔，取 `雲端專案控管表` sheet |

帳單 Excel 結構：
- 第 12 列：欄位名稱
- 第 13 列起：明細資料（兩個 sheet `國泰世華` 與 `Apigee` 合併匯入）
- F3:H10：月結摘要區塊

## 3. Schema

### 3.1 `billing_file` — 帳單群組登記表

```sql
CREATE TABLE billing_file (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    billing_group       TEXT    NOT NULL,           -- 資料夾名稱，例如 AI、核心現代化、資訊
    billing_year_month  TEXT    NOT NULL,           -- 格式 YYYY-MM，例如 2026-04
    imported_at         TEXT    NOT NULL,           -- ISO8601，例如 2026-05-30T10:00:00
    UNIQUE (billing_group, billing_year_month)
);
```

### 3.2 `billing_line_item` — 帳務明細

對應 Excel 第 13 列起，兩個 sheet 合併，所有折扣欄位空值補 0。

```sql
CREATE TABLE billing_line_item (
    id                                    INTEGER PRIMARY KEY AUTOINCREMENT,
    billing_file_id                       INTEGER NOT NULL REFERENCES billing_file(id),
    project_id                            TEXT,
    project_name                          TEXT,
    service_description                   TEXT,
    service_id                            TEXT,
    sku_description                       TEXT,
    sku_id                                TEXT,
    usage_start_date                      TEXT,    -- 格式 YYYY-MM-DD
    usage_end_date                        TEXT,    -- 格式 YYYY-MM-DD
    usage_amount                          REAL,
    usage_unit                            TEXT,
    free_tier                             REAL DEFAULT 0,
    committed_usage_discount              REAL DEFAULT 0,
    committed_usage_discount_dollar_base  REAL DEFAULT 0,
    discount                              REAL DEFAULT 0,
    promotion                             REAL DEFAULT 0,
    subscription_benefit                  REAL DEFAULT 0,
    sustained_usage_discount              REAL DEFAULT 0,
    google_cost                           REAL,
    partner_cost                          REAL,
    google_discount                       REAL DEFAULT 0,
    partner_discount                      REAL DEFAULT 0,
    total_discount                        REAL DEFAULT 0
);

CREATE INDEX idx_billing_line_item_file   ON billing_line_item(billing_file_id);
CREATE INDEX idx_billing_line_item_proj   ON billing_line_item(project_id);
```

### 3.3 `billing_summary` — 月結摘要

對應 Excel F3:H10 區塊，每個 billing_file 一筆。

```sql
CREATE TABLE billing_summary (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    billing_file_id         INTEGER NOT NULL UNIQUE REFERENCES billing_file(id),
    gcp_usage_total_usd     REAL,   -- GCP 用量總金額（美金）
    partner_usage_total_usd REAL,   -- Partner 用量金額（美金）
    exchange_rate           REAL,   -- 匯率
    total_payable_twd       REAL    -- 應付金額（台幣）
);
```

### 3.4 `project_master` — 專案主檔

對應 `雲端專案控管表` sheet，`project_id` 為 join key。

```sql
CREATE TABLE project_master (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id   TEXT UNIQUE NOT NULL,  -- 專案編號，join key
    apid         TEXT,                  -- APID
    category     TEXT,                  -- 類別
    department   TEXT,                  -- 部門
    section      TEXT,                  -- 科別
    project_name TEXT,                  -- 專案名稱
    environment  TEXT,                  -- 環境
    cost_center  TEXT                   -- 成本中心
);

CREATE INDEX idx_project_master_proj ON project_master(project_id);
```

## 4. 關聯圖

```
billing_file (1) ──< billing_line_item (N)   [billing_file_id]
billing_file (1) ──  billing_summary   (1)   [billing_file_id UNIQUE]
project_master   ── billing_line_item        [project_id, 非 FK，查詢時 join]
```

`project_master` 與 `billing_line_item` 不設硬 FK，以 `project_id` 文字 join，避免帳單有尚未建檔的新專案時匯入失敗。

## 5. 匯入規則

| 規則 | 說明 |
|---|---|
| 防重複 | `billing_file` 有 UNIQUE(billing_group, billing_year_month)，重複匯入直接報錯 |
| 兩 sheet 合併 | `國泰世華` 與 `Apigee` sheet 視為同一檔案，合併後一起寫入 `billing_line_item` |
| 空值折扣 | 折扣欄位 NULL 補 0 |
| 日期格式 | `usage_start_date`、`usage_end_date` 統一轉為 `YYYY-MM-DD` 字串 |
| 月份判斷 | `billing_year_month` 從資料夾路徑 `2026/{YYYY-MM}/` 解析 |
| billing_group | 從資料夾名稱最後一層解析，例如路徑含 `/AI/` 則為 `AI` |

## 6. 常用查詢範例

```sql
-- 某月某群組的 Partner 費用合計
SELECT SUM(partner_cost)
FROM billing_line_item li
JOIN billing_file bf ON li.billing_file_id = bf.id
WHERE bf.billing_year_month = '2026-04'
  AND bf.billing_group = 'AI';

-- 某月 Top 10 專案費用（含組織資訊）
SELECT li.project_id, pm.department, pm.section, pm.category,
       SUM(li.partner_cost) AS total_cost
FROM billing_line_item li
LEFT JOIN project_master pm ON li.project_id = pm.project_id
JOIN billing_file bf ON li.billing_file_id = bf.id
WHERE bf.billing_year_month = '2026-04'
GROUP BY li.project_id
ORDER BY total_cost DESC
LIMIT 10;

-- 某月各群組應付金額
SELECT bf.billing_group, bs.total_payable_twd
FROM billing_summary bs
JOIN billing_file bf ON bs.billing_file_id = bf.id
WHERE bf.billing_year_month = '2026-04';
```
