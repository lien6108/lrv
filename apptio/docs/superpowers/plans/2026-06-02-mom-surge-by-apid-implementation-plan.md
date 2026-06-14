# Implementation Plan: mom_surge 改以 apid 為單位（TWD 門檻）

**Spec:** `docs/superpowers/specs/2026-06-02-mom-surge-by-apid-design.md`
**Date:** 2026-06-02

---

## 步驟一：修改後端 SQL（`backend/api.py`）

**位置：** `mom_surge_rows = conn.execute(...)` 區塊（約第 246 行）

將整段查詢替換為以下內容：

```sql
WITH two_months AS (
    SELECT billing_year_month
    FROM billing_file
    GROUP BY billing_year_month
    ORDER BY billing_year_month DESC
    LIMIT 2
),
curr_month AS (SELECT MIN(billing_year_month) AS ym FROM two_months),
prev_month AS (SELECT MAX(billing_year_month) AS ym FROM two_months),
app_costs AS (
    SELECT
        pm.apid,
        MAX(COALESCE(pm.project_name, pm.apid)) AS system_name,
        MAX(COALESCE(pm.department, '未分類'))   AS department,
        bf.billing_year_month,
        SUM(
            COALESCE(li.partner_cost, li.google_cost, 0)
            * COALESCE(bs.exchange_rate, 1)
            * 1.05
        ) AS cost_twd
    FROM billing_line_item li
    JOIN billing_file bf ON li.billing_file_id = bf.id
    LEFT JOIN billing_summary bs ON li.billing_file_id = bs.billing_file_id
    JOIN project_master pm ON li.project_id = pm.project_id
    WHERE pm.category = 'applications'
      AND pm.apid IS NOT NULL
    GROUP BY pm.apid, bf.billing_year_month
)
SELECT
    c.department,
    c.system_name,
    c.apid,
    COALESCE(p.cost_twd, 0)                    AS prev_cost,
    c.cost_twd                                  AS curr_cost,
    c.cost_twd - COALESCE(p.cost_twd, 0)        AS diff,
    (SELECT ym FROM curr_month)                  AS curr_month,
    (SELECT ym FROM prev_month)                  AS prev_month
FROM app_costs c
JOIN curr_month cm ON c.billing_year_month = cm.ym
LEFT JOIN app_costs p
    ON c.apid = p.apid
    AND p.billing_year_month = (SELECT ym FROM prev_month)
WHERE c.cost_twd - COALESCE(p.cost_twd, 0) > 200
ORDER BY diff DESC
```

**驗證：** 啟動 Flask，呼叫 `/api/charts`，確認 `mom_surge` 陣列中每筆資料有 `apid`、`system_name`、`prev_cost`、`curr_cost`、`diff` 欄位，且 `diff > 200`（TWD）。

---

## 步驟二：修改前端表格（`frontend/index.html`）

**位置：** `x-for="row in chartsData.mom_surge"` 區塊（約第 388 行）

### 2a. 修改 `x-for` key

```html
<!-- 舊 -->
<template x-for="row in chartsData.mom_surge" :key="row.project_id">

<!-- 新 -->
<template x-for="row in chartsData.mom_surge" :key="row.apid">
```

### 2b. 修改系統名稱欄

```html
<!-- 舊 -->
<td class="px-5 py-4">
  <p class="font-medium text-gray-800 text-sm" x-text="row.project_label"></p>
  <p class="font-mono text-xs text-gray-400 mt-1" x-text="row.project_id"></p>
</td>

<!-- 新 -->
<td class="px-5 py-4">
  <p class="font-medium text-gray-800 text-sm" x-text="row.system_name"></p>
</td>
```

**驗證：** 開啟瀏覽器，確認表格顯示系統名稱（非 project_id），每列不再出現灰色 project_id sub-label。

---

## 步驟三：手動 smoke test

1. 啟動後端：`cd backend && python api.py`
2. 開啟 `http://localhost:5000`，切到 Charts tab
3. 確認「Applications 本月較上月增加 > $200 專案清單」表格：
   - 系統名稱欄顯示中文系統名（`system_name`），無 project_id
   - 同一系統不重複出現（三個環境已合併）
   - 增加金額為 TWD，數值合理

---

## 步驟四：commit

```
feat: group mom_surge by apid and switch threshold to TWD 200
```
