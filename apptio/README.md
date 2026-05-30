# GCP Billing Database

將每月 GCP 帳單 Excel 匯入 SQLite，供費用查詢、對帳與後續報表使用。

## 專案結構

```
apptio/
├── backend/
│   ├── schema.sql       # 資料庫 DDL（四張表）
│   ├── db.py            # 資料庫初始化
│   ├── importer.py      # Excel 匯入腳本
│   └── billing.db       # SQLite 資料庫（執行後產生）
└── docs/
    ├── 上雲專案預算控管表（GCP 總表）_超新版.xlsx   # 專案主檔
    └── 2026/
        ├── 2026-01/
        │   ├── AI/            # 帳單 Excel（國泰世華 + Apigee sheets）
        │   ├── 核心現代化/
        │   └── 資訊/
        ├── 2026-02/
        ├── 2026-03/
        └── 2026-04/
```

## 資料庫 Schema

| 資料表 | 說明 |
|---|---|
| `billing_file` | 每次匯入的帳單群組登記（billing_group + billing_year_month 唯一） |
| `billing_line_item` | 帳務明細，對應 Excel 第 13 列起（國泰世華 + Apigee 合併） |
| `billing_summary` | 月結摘要，對應 Excel F3:H10（GCP 總金額、Partner 金額、匯率、應付台幣） |
| `project_master` | 專案主檔，來自雲端專案控管表（project_id、部門、科別、類別、成本中心等） |

## 環境需求

```
Python 3.9+
openpyxl
```

安裝：

```bash
pip install openpyxl
```

## 使用方式

所有指令在 `backend/` 目錄下執行。

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

### 3. 匯入帳單（每月每個群組執行一次）

```bash
python importer.py --billing "../docs/2026/2026-04/AI"         --month 2026-04 --db billing.db
python importer.py --billing "../docs/2026/2026-04/核心現代化"  --month 2026-04 --db billing.db
python importer.py --billing "../docs/2026/2026-04/資訊"        --month 2026-04 --db billing.db
```

同一群組 + 月份重複執行會提示「Already imported」並跳過，不會寫入重複資料。

## 常用查詢

```sql
-- 某月某群組 Partner 費用合計
SELECT SUM(partner_cost)
FROM billing_line_item li
JOIN billing_file bf ON li.billing_file_id = bf.id
WHERE bf.billing_year_month = '2026-04' AND bf.billing_group = 'AI';

-- 某月 Top 10 專案費用（含組織資訊）
SELECT li.project_id, pm.department, pm.section, pm.category,
       SUM(li.partner_cost) AS total_cost
FROM billing_line_item li
LEFT JOIN project_master pm ON li.project_id = pm.project_id
JOIN billing_file bf ON li.billing_file_id = bf.id
WHERE bf.billing_year_month = '2026-04' AND li.project_id IS NOT NULL
GROUP BY li.project_id
ORDER BY total_cost DESC
LIMIT 10;

-- 某月各群組應付金額
SELECT bf.billing_group, bs.total_payable_twd
FROM billing_summary bs
JOIN billing_file bf ON bs.billing_file_id = bf.id
WHERE bf.billing_year_month = '2026-04';
```

## 設計文件

- [Database Design Spec](docs/docs/superpowers/specs/2026-05-30-gcp-billing-database-design.md)
- [Implementation Plan](docs/docs/superpowers/plans/2026-05-30-gcp-billing-database-implementation-plan.md)
