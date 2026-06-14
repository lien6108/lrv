# GCP FinOps Dashboard

每月將 GCP 帳單 Excel 匯入 SQLite，並透過 Flask + Chart.js 提供互動式費用分析看板。

---

## 功能概覽

| 分頁 | 內容 |
|---|---|
| 帳單摘要 | 各帳單群組每月 GCP / Partner 用量、匯率、應付台幣 |
| 圖表分析 | 部門費用趨勢、Top 7 專案成長、成本中心 / 版塊 / 類別圓餅圖、Shared Infra 服務明細、本月較上月增幅 > $200 專案清單 |
| 帳務明細 | 可依群組 / 月份 / 專案 ID 篩選的分頁明細表 |

> 圖表分析的所有費用統計，已過濾 `category = applications`（成本中心、部門、版塊、Top 7 等），並額外提供 Shared Infra 3 月 by Service 長條圖。

---

## 技術架構

```
Excel (.xlsx)
    │
    ▼
importer.py  ──openpyxl──▶  billing.db (SQLite)
                                  │
                             api.py (Flask)
                                  │
                          /api/summary  /api/charts  /api/line-items  /api/filters
                                  │
                          index.html  (Alpine.js + Chart.js + Tailwind CSS)
```

---

## 專案結構

```
apptio/
├── backend/
│   ├── schema.sql        # 資料庫 DDL（4 張表）
│   ├── db.py             # 連線與初始化
│   ├── importer.py       # Excel → SQLite 匯入腳本
│   ├── api.py            # Flask REST API + 靜態檔案服務
│   └── billing.db        # SQLite 資料庫（執行後產生）
├── frontend/
│   └── index.html        # 單頁應用（Alpine.js + Chart.js）
└── docs/
    ├── 上雲專案預算控管表（GCP 總表）_超新版.xlsx   # 專案主檔
    └── 2026/
        ├── 2026-01/
        │   ├── AI/
        │   ├── 核心現代化/
        │   └── 資訊/
        ├── 2026-02/ … 2026-04/
        └── …
```

---

## 資料庫 Schema

| 資料表 | 說明 |
|---|---|
| `billing_file` | 每次匯入登記（`billing_group` + `billing_year_month` 唯一） |
| `billing_line_item` | 帳務明細，對應 Excel 第 13 列起（國泰世華 + Apigee sheet 合併） |
| `billing_summary` | 月結摘要（GCP 總金額、Partner 金額、匯率、應付台幣） |
| `project_master` | 專案主檔，來自雲端專案控管表（`project_id`、`category`、`department`、`section`、`cost_center` 等） |

`project_master.category` 可能的值：`applications`、`shared_infra`、`lab+poc`。

---

## 環境需求

```
Python 3.9+
Flask
openpyxl
```

安裝：

```bash
pip install flask openpyxl
```

---

## 快速開始

### 1. 初始化資料庫

```bash
cd backend
python db.py billing.db
```

### 2. 匯入專案主檔

```bash
python importer.py --projects \
  --excel "../docs/上雲專案預算控管表（GCP 總表）_超新版.xlsx" \
  --db billing.db
```

### 3. 匯入帳單（每月、每群組各執行一次）

```bash
# 以 2026-04 為例，三個帳單群組
python importer.py --billing "../docs/2026/2026-04/AI"        --month 2026-04 --db billing.db
python importer.py --billing "../docs/2026/2026-04/核心現代化" --month 2026-04 --db billing.db
python importer.py --billing "../docs/2026/2026-04/資訊"       --month 2026-04 --db billing.db
```

> 同一群組 + 月份重複執行會印出「Already imported」並跳過，不會寫入重複資料。

### 4. 啟動 Dashboard

```bash
python api.py
```

開啟瀏覽器：[http://localhost:5000](http://localhost:5000)

---

## API 端點

| 端點 | 說明 |
| --- | --- |
| `GET /api/summary` | 所有帳單摘要列表 |
| `GET /api/filters` | 可用的帳單群組與月份清單 |
| `GET /api/charts` | 所有圖表資料（部門趨勢、Top 7、圓餅圖、月增清單等） |
| `GET /api/line-items` | 帳務明細分頁，支援 `billing_group`、`billing_year_month`、`project_id`、`page`、`page_size` 參數 |

---

## 常用 SQL 查詢

```sql
-- 某月某群組 Partner 費用合計
SELECT SUM(partner_cost)
FROM billing_line_item li
JOIN billing_file bf ON li.billing_file_id = bf.id
WHERE bf.billing_year_month = '2026-04' AND bf.billing_group = 'AI';

-- 某月 applications 類別 Top 10 專案費用
SELECT li.project_id, pm.project_name, pm.department, pm.section,
       SUM(COALESCE(li.partner_cost, li.google_cost, 0)) AS total_cost
FROM billing_line_item li
JOIN billing_file bf ON li.billing_file_id = bf.id
JOIN project_master pm ON li.project_id = pm.project_id
WHERE bf.billing_year_month = '2026-04'
  AND pm.category = 'applications'
GROUP BY li.project_id
ORDER BY total_cost DESC
LIMIT 10;

-- 某月各群組應付台幣
SELECT bf.billing_group, bs.total_payable_twd
FROM billing_summary bs
JOIN billing_file bf ON bs.billing_file_id = bf.id
WHERE bf.billing_year_month = '2026-04';

-- 本月 vs 上月費用增幅 > $200 的 applications 專案
WITH two_months AS (
    SELECT billing_year_month FROM billing_file
    GROUP BY billing_year_month ORDER BY billing_year_month DESC LIMIT 2
),
costs AS (
    SELECT li.project_id, bf.billing_year_month,
           SUM(COALESCE(li.partner_cost, li.google_cost, 0)) AS cost
    FROM billing_line_item li
    JOIN billing_file bf ON li.billing_file_id = bf.id
    JOIN project_master pm ON li.project_id = pm.project_id
    WHERE pm.category = 'applications'
      AND bf.billing_year_month IN (SELECT billing_year_month FROM two_months)
    GROUP BY li.project_id, bf.billing_year_month
)
SELECT curr.project_id,
       COALESCE(prev.cost, 0) AS prev_cost,
       curr.cost              AS curr_cost,
       curr.cost - COALESCE(prev.cost, 0) AS diff
FROM costs curr
JOIN (SELECT MAX(billing_year_month) AS ym FROM two_months) cm ON curr.billing_year_month = cm.ym
LEFT JOIN costs prev ON curr.project_id = prev.project_id
  AND prev.billing_year_month = (SELECT MIN(billing_year_month) FROM two_months)
WHERE diff > 200
ORDER BY diff DESC;
```

---

## 設計文件

- [FinOps Dashboard Design Spec](docs/docs/superpowers/specs/2026-05-29-gcp-finops-dashboard-design.md)
- [Dashboard Implementation Plan](docs/docs/superpowers/plans/2026-05-29-gcp-finops-dashboard-v1-implementation-plan.md)
- [Database Design Spec](docs/docs/superpowers/specs/2026-05-30-gcp-billing-database-design.md)
- [Database Implementation Plan](docs/docs/superpowers/plans/2026-05-30-gcp-billing-database-implementation-plan.md)
