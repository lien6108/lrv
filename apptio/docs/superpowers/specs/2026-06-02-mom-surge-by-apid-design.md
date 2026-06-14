# Design: Applications 本月較上月增加 > TWD 200 — 改以系統（apid）為單位

**Date:** 2026-06-02
**Status:** Approved

---

## 問題描述

現有「Applications 本月較上月增加 > $200 專案清單」以 GCP **project_id** 為最小粒度做月對月比較，且門檻單位為 **USD**。

每個系統（apid）下通常有三個環境（UT / UAT / PROD），拆開看會使增幅被低估，且門檻單位與頁面其他費用顯示不一致。

---

## 目標

將此表格改為以 **apid（系統）** 為單位：
1. 加總同一 apid 下所有環境的費用後，再做本月 vs 上月比較
2. 門檻改為 **TWD 200**（含稅匯差後台幣）
3. 前端欄位：部門 / 系統名稱 / 上月合計（NT$）/ 本月合計（NT$）/ 增加金額（NT$）/ 增幅

---

## 範疇

- `apid IS NULL` 的專案不納入（通常為未登錄的 POC 專案，不屬於 applications 核心系統）
- 僅影響 `mom_surge` 這一個 API 欄位與對應的前端表格區塊
- 其餘圖表、API 端點不受影響

---

## 後端設計（`backend/api.py`）

### 修改位置

`/api/charts` 路由中的 `mom_surge_rows` 查詢（約第 246 行）。

### 新 SQL 邏輯

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

### 回傳欄位變化

| 欄位 | 舊 | 新 |
|---|---|---|
| 系統識別 | `project_id` | `apid` |
| 顯示名稱 | `project_label` | `system_name` |
| 費用門檻 | USD > 200 | TWD > 200 |
| 其餘 | `department`, `prev_cost`, `curr_cost`, `diff` | 不變 |

---

## 前端設計（`frontend/index.html`）

### 修改位置

`x-for="row in chartsData.mom_surge"` 區塊（約第 388 行）。

### 變更清單

1. `x-for` 的 `:key` 從 `row.project_id` 改為 `row.apid`
2. 系統名稱欄：`x-text="row.project_label"` 改為 `x-text="row.system_name"`
3. 移除系統名稱欄下方的灰色 `project_id` sub-label（`<p class="font-mono text-xs ...">`）
4. 欄位標題、費用欄、增幅欄邏輯不變

---

## 不在此次範疇

- 加入環境明細展開（UT / UAT / PROD 細項）
- 門檻值 UI 可調整
- 其他 billing_group 的月對月比較
