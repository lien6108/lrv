# 匯出功能設計規格

**日期：** 2026-05-24
**狀態：** 已核准

---

## 概述

在實價登錄查詢系統新增匯出功能，讓使用者在設定篩選條件並查詢後，可將全部符合條件的資料匯出為 CSV 或 XLSX 檔案下載。

---

## 需求

- 匯出範圍：**全部符合篩選條件的資料**（非僅當前頁）
- 支援格式：CSV、XLSX，使用者於下載時選擇
- 超過 50,000 筆時顯示確認警告
- 後端安全上限：100,000 筆

---

## 架構

```
使用者點擊匯出按鈕
    │
    ├─ 檢查 currentTotal（來自上次查詢結果）
    │       ├─ > 50,000 → confirm() 確認對話框
    │       │       ├─ 取消 → 結束
    │       │       └─ 確認 → 繼續
    │       └─ ≤ 50,000 → 直接繼續
    │
    ├─ fetch GET /api/export?<同篩選參數>
    │       └─ Worker 查 D1，回傳完整 JSON（無分頁）
    │
    ├─ format === 'csv'  → 純 JS 生成 CSV Blob → <a> download
    └─ format === 'xlsx' → SheetJS json_to_sheet → writeFile
```

---

## 後端

### 新增 Route：`GET /api/export`

**位置：** `src/index.js`

**接受參數：** 與 `/api/transactions` 完全相同的篩選參數，去除 `page` 與 `limit`。

| 參數 | 說明 |
|------|------|
| `district` | 鄉鎮市區 |
| `year` | 民國年 |
| `month` | 月份 |
| `community` | 社區案名（模糊搜尋） |
| `building_type` | 建物型態 |
| `min_price` / `max_price` | 總價範圍（元） |
| `min_unit_price` / `max_unit_price` | 單價範圍（元/㎡） |
| `bedrooms` / `bathrooms` | 房數 / 衛數 |
| `sort_by` / `sort_dir` | 排序欄位 / 方向 |

**回傳格式：**
```json
{
  "total": 1234,
  "data": [ { ...同 /api/transactions 的欄位... } ]
}
```

**實作方式：** 複用 `handleTransactions` 的 WHERE 條件建構邏輯，SELECT 欄位相同，移除 OFFSET，LIMIT 固定為 100,000（安全上限）。

---

## 前端

### UI 變更

**位置：** 現有工具列，「欄位設定」按鈕旁邊新增「匯出」下拉按鈕。

```
[欄位設定]  [↓ 匯出]
                ├─ 匯出 CSV
                └─ 匯出 XLSX
```

**檔名格式：** `lvr_export_YYYYMMDD.csv` / `lvr_export_YYYYMMDD.xlsx`

### 依賴

- SheetJS CDN：`https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js`
- 加入 `public/index.html` 的 `<head>`
- 首次點擊 XLSX 時載入，之後快取

### 匯出邏輯（`public/app.js`）

新增 `exportData(format)` 函式：

1. 若 `currentTotal > 50,000`，顯示 `confirm("共 X 筆資料，確定匯出？")` ；取消則 return
2. 匯出按鈕切換為 loading 狀態（禁用點擊，文字改為「匯出中…」）
3. `fetch('/api/export?' + currentFilterParams)`
4. 依 `format`：
   - `csv`：手動拼接 header + rows 為 CSV 字串，建立 `Blob('text/csv;charset=utf-8')` → `<a>` download
   - `xlsx`：`XLSX.utils.json_to_sheet(data)` → `XLSX.utils.book_append_sheet` → `XLSX.writeFile`
5. 按鈕恢復正常狀態

### CSV 生成細節

- Header：使用回傳 JSON 的欄位名稱（中文）
- 欄位值含逗號或換行時加雙引號跳脫
- 加 UTF-8 BOM（`﻿`）確保 Excel 正確顯示中文

---

## 異動範圍

| 檔案 | 類型 | 說明 |
|------|------|------|
| `src/index.js` | 修改 | 新增 `/api/export` route 及 `handleExport` 函式（約 25 行） |
| `public/index.html` | 修改 | 新增 SheetJS CDN script tag；新增匯出下拉按鈕 HTML |
| `public/app.js` | 修改 | 新增 `exportData(format)` 函式；匯出按鈕事件綁定 |

---

## 不在範圍內

- 後端直接輸出 XLSX 檔案（Worker bundle 過重）
- 匯出進度條（資料量在合理範圍內，loading 狀態已足夠）
- 欄位自訂（匯出所有欄位，與 Column Studio 設定無關）
