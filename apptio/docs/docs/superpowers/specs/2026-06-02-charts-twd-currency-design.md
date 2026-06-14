# 圖表分析改用台幣（含稅）設計文件

**日期：** 2026-06-02
**範圍：** `backend/api.py`、`frontend/index.html`

---

## 背景

目前「圖表分析」頁面的所有金額以 USD 顯示（`partner_cost` / `google_cost`）。
使用者需求：圖表分析全面改為顯示**台幣含稅**金額，方便對應實際應付帳款。

---

## 轉換公式

```
TWD（含稅）= USD × exchange_rate × 1.05
```

- `exchange_rate`：來自 `billing_summary` 表，per `billing_file`（即 per billing_group + billing_year_month）
- `1.05`：5% 營業稅
- `billing_summary.total_payable_twd` 已含稅，與此公式一致

---

## 後端設計（`api.py`）

### 一般查詢（6 個）

受影響：`dept_rows`、`proj_rows`、`section_rows`、`cost_center_rows`、`shared_infra_march_rows`、`category_rows`

每個查詢加入：

```sql
LEFT JOIN billing_summary bs ON li.billing_file_id = bs.billing_file_id
```

cost 欄位改為：

```sql
SUM(COALESCE(li.partner_cost, li.google_cost, 0) * COALESCE(bs.exchange_rate, 1) * 1.05) AS cost
```

`COALESCE(bs.exchange_rate, 1)` 保護無 summary 資料時不歸零。

### MoM 異動查詢（`mom_surge_rows`）特殊處理

門檻維持 USD `> $200`，顯示改用 TWD。

`project_costs` CTE 同時計算兩欄：

```sql
SUM(COALESCE(li.partner_cost, li.google_cost, 0)) AS cost_usd,
SUM(COALESCE(li.partner_cost, li.google_cost, 0) * COALESCE(bs.exchange_rate, 1) * 1.05) AS cost_twd
```

最終 SELECT：
- `prev_cost`、`curr_cost`、`diff` → 回傳 TWD 值（供前端顯示）
- `WHERE` 過濾：`c.cost_usd - COALESCE(p.cost_usd, 0) > 200`（維持 USD 門檻）

---

## 前端設計（`index.html`）

### 數字格式化

所有圖表的 Y 軸 tick 和 tooltip callback 統一改為：

```js
'NT$' + Math.round(value).toLocaleString()
```

TWD 數字通常為 USD 的 30–35 倍，千分位逗號確保易讀。

### 標籤更新

| 位置 | 原文 | 改為 |
|------|------|------|
| 圖表 Y 軸 / tooltip | `$` | `NT$` |
| USD 單位標示 | `USD` | `NT$（含稅）` |
| MoM 表格欄頭（金額欄） | `(USD)` 或無標示 | `(NT$ 含稅)` |

---

## 不在範圍內

- 帳單摘要（Billing Summary）頁：維持原本 USD/TWD 混合顯示，不動
- 帳務明細（Line Items）頁：維持 USD，不動
- MoM 門檻值：維持 `$200 USD`，不改為台幣門檻
- 新增幣別切換功能：不做，本次固定為台幣含稅

---

## 測試重點

1. 各圖表金額約為原 USD 值的 32–35 倍（匯率約 31–33 × 1.05）
2. MoM 異動表格：確認門檻仍以 USD 計算（小幅異動的專案不應出現），顯示金額為 TWD
3. 無 `billing_summary` 的 line item（edge case）：`exchange_rate` fallback 為 1，不導致 NULL 或錯誤
