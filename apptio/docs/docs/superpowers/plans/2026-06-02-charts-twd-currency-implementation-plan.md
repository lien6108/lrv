# 實作計畫：圖表分析改用台幣（含稅）

**對應 spec：** `specs/2026-06-02-charts-twd-currency-design.md`
**日期：** 2026-06-02
**影響檔案：** `backend/api.py`、`frontend/index.html`

---

## 步驟總覽

| # | 任務 | 檔案 |
|---|------|------|
| 1 | 修改 `dept_rows` 查詢加 JOIN + TWD 公式 | `api.py` |
| 2 | 修改 `proj_rows` 查詢加 JOIN + TWD 公式 | `api.py` |
| 3 | 修改 `section_rows` 查詢加 JOIN + TWD 公式 | `api.py` |
| 4 | 修改 `cost_center_rows` 查詢加 JOIN + TWD 公式 | `api.py` |
| 5 | 修改 `category_rows` 查詢加 JOIN + TWD 公式 | `api.py` |
| 6 | 修改 `shared_infra_march_rows` 查詢加 JOIN + TWD 公式 | `api.py` |
| 7 | 修改 `mom_surge_rows`：CTE 加 cost_usd/cost_twd，WHERE 用 USD，回傳 TWD | `api.py` |
| 8 | 前端：統一 Y 軸 tick / tooltip 格式化為 `NT$` + 千分位 | `index.html` |
| 9 | 前端：更新圖表標題、軸標籤、MoM 表格欄頭的幣別文字 | `index.html` |
| 10 | 手動驗證：確認各圖表金額倍率、MoM 門檻行為、edge case | 瀏覽器 |

---

## 步驟 1–6：一般查詢 TWD 轉換

**每個查詢共同改動模式：**

加入 JOIN（在現有 `LEFT JOIN project_master` 之後）：
```sql
LEFT JOIN billing_summary bs ON li.billing_file_id = bs.billing_file_id
```

將 cost 欄位：
```sql
SUM(COALESCE(li.partner_cost, li.google_cost, 0)) AS cost
```
改為：
```sql
SUM(COALESCE(li.partner_cost, li.google_cost, 0) * COALESCE(bs.exchange_rate, 1) * 1.05) AS cost
```

---

## 步驟 7：MoM 異動查詢

`project_costs` CTE 中的 `billing_line_item` 部分加入：
```sql
LEFT JOIN billing_summary bs ON li.billing_file_id = bs.billing_file_id
```

CTE SELECT 新增兩欄（保留 cost_usd 用於過濾）：
```sql
SUM(COALESCE(li.partner_cost, li.google_cost, 0)) AS cost_usd,
SUM(COALESCE(li.partner_cost, li.google_cost, 0) * COALESCE(bs.exchange_rate, 1) * 1.05) AS cost_twd
```

最終 SELECT 改為回傳 TWD：
```sql
COALESCE(p.cost_twd, 0) AS prev_cost,
c.cost_twd              AS curr_cost,
c.cost_twd - COALESCE(p.cost_twd, 0) AS diff,
```

WHERE 維持 USD：
```sql
WHERE c.cost_usd - COALESCE(p.cost_usd, 0) > 200
```

---

## 步驟 8：前端數字格式化

找到所有 Chart.js callback，統一替換格式：

```js
// 舊
'$' + value.toFixed(2)
// 或
'$' + value

// 新
'NT$' + Math.round(value).toLocaleString()
```

---

## 步驟 9：前端標籤更新

搜尋 `index.html` 中出現的 `USD`、`$`（在圖表標題/軸/說明文字的位置），改為 `NT$（含稅）`。

MoM 表格欄頭（上月、本月、差額）加上 `(NT$ 含稅)` 標示。

---

## 步驟 10：驗證

1. 啟動後端：`cd backend && python api.py`
2. 開啟 `http://localhost:5000`，切到「圖表分析」
3. 確認項目：
   - 部門趨勢、Top 7 專案：Y 軸數字約為原 USD 值 × 32–35
   - 圓餅圖 tooltip：顯示 `NT$` 千分位格式
   - MoM 表格：金額欄顯示 TWD，小幅異動（USD < $200）的專案不出現
   - 無 billing_summary 的資料不出現 NULL 或 NaN
