# 實價登錄查詢系統 — 設計規格

**日期：** 2026-05-23
**狀態：** 已核准

---

## 概述

建立一套台灣實價登錄資料查詢系統，提供使用者透過網頁介面依地區、時間、案名、建物型態、價格、格局等條件搜尋不動產交易紀錄。資料每月 5、15、25 號自動從內政部平台下載並累積至本地資料庫。

---

## 技術棧

| 層級 | 技術 |
|------|------|
| 後端框架 | Python FastAPI |
| 資料庫 | SQLite + SQLAlchemy ORM |
| 排程 | APScheduler（內嵌於 FastAPI process） |
| 資料處理 | pandas + openpyxl |
| 前端 | HTML + Tailwind CSS + 原生 JavaScript |
| 靜態檔案 | FastAPI StaticFiles 掛載 |

單一 `python main.py` 啟動，無需額外服務。

---

## 專案結構

```
lvr/
├── main.py                  # FastAPI 啟動點，掛載路由與 APScheduler
├── database.py              # SQLite 連線、建表、索引
├── models.py                # SQLAlchemy ORM 模型
├── importer.py              # 下載 XLS → 解析 → 去重 → 寫入
├── scheduler.py             # APScheduler 每月 5/15/25 觸發 importer
├── routers/
│   └── transactions.py      # 查詢 API endpoints
├── static/
│   ├── index.html           # 查詢頁面（Tailwind + 原生 JS）
│   └── app.js               # 篩選條件、呼叫 API、渲染結果
├── data/                    # 暫存下載的 XLS 檔
├── row data.xlsx            # 初始歷史資料
└── requirements.txt
```

---

## 資料庫設計

### 主表：`transactions`

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER PK AUTOINCREMENT | 主鍵 |
| 移轉編號 | TEXT UNIQUE | 去重唯一鍵 |
| 鄉鎮市區 | TEXT | 篩選用 |
| 區段 | TEXT | |
| 交易標的 | TEXT | |
| 土地區段位置建物區段門牌 | TEXT | |
| 土地移轉總面積_平方 | REAL | 單位：㎡ |
| 使用分區編定 | TEXT | |
| 非都市地使用分區 | TEXT | |
| 非都市土地使用地 | TEXT | |
| 交易年月 | TEXT | 格式：YYMM（民國），篩選用 |
| 交易筆棟數 | TEXT | |
| 移轉層次 | TEXT | |
| 總樓層數 | TEXT | |
| 建物型態 | TEXT | 篩選用 |
| 主要用途 | TEXT | |
| 主要建材 | TEXT | |
| 建築完成年月 | TEXT | |
| 建物移轉總面積_平方 | REAL | 單位：㎡ |
| 格局_房 | INTEGER | 篩選用 |
| 格局_廳 | INTEGER | |
| 格局_衛 | INTEGER | 篩選用 |
| 格局_隔間 | TEXT | |
| 有無管理組織 | TEXT | |
| 總價_元 | INTEGER | 範圍篩選用 |
| 單價_元每平方 | REAL | 範圍篩選用 |
| 車位類別 | TEXT | |
| 車位移轉總面積_平方 | REAL | |
| 車位總價_元 | INTEGER | |
| 棟別 | TEXT | |
| 總價_萬元 | REAL | 顯示用 |
| 土地移轉總面積_坪 | REAL | |
| 建物移轉總面積_坪 | REAL | 顯示用 |
| 建物移轉不含車面積_坪 | REAL | |
| 建物單價_萬每坪 | REAL | |
| 車位移轉總面積_坪 | REAL | |
| 社區案名 | TEXT | 模糊搜尋用 |
| 備註 | TEXT | |
| 編號 | TEXT | |
| 主建物面積 | REAL | |
| 附屬建物面積 | REAL | |
| 陽台面積 | REAL | |
| 電梯 | TEXT | |
| 來源檔案 | TEXT | `'a'`（買賣）或 `'b'`（預售）|
| 匯入時間 | DATETIME | 寫入時間戳 |

### 索引

```sql
CREATE INDEX idx_district     ON transactions(鄉鎮市區);
CREATE INDEX idx_year_month   ON transactions(交易年月);
CREATE INDEX idx_community    ON transactions(社區案名);
CREATE INDEX idx_building_type ON transactions(建物型態);
CREATE INDEX idx_total_price  ON transactions(總價_元);
CREATE INDEX idx_unit_price   ON transactions(單價_元每平方);
```

### 去重策略

使用 `INSERT OR IGNORE` 配合 `移轉編號 UNIQUE`，重複紀錄自動略過，確保累積匯入不產生重複資料。

---

## API 設計

### `GET /api/transactions`

查詢不動產交易資料，支援分頁。

**Query Parameters：**

| 參數 | 類型 | 說明 |
|------|------|------|
| district | string | 鄉鎮市區 |
| year | int | 民國年（如 112） |
| month | int | 月份（1–12） |
| community | string | 社區案名模糊搜尋 |
| building_type | string | 建物型態 |
| min_price | int | 總價下限（元） |
| max_price | int | 總價上限（元） |
| min_unit_price | float | 單價下限（元/㎡） |
| max_unit_price | float | 單價上限（元/㎡） |
| bedrooms | int | 房數 |
| bathrooms | int | 衛數 |
| page | int | 頁碼（預設 1） |
| limit | int | 每頁筆數（預設 20，最大 100） |

**Response：**
```json
{
  "total": 1234,
  "page": 1,
  "limit": 20,
  "data": [ { ...transaction fields... } ]
}
```

### `GET /api/options`

回傳各篩選欄位的所有可選值，供前端 dropdown 使用。

**Response：**
```json
{
  "districts": ["信義區", "大安區", ...],
  "building_types": ["住宅大樓", "公寓", "透天厝", ...],
  "year_range": { "min": 100, "max": 113 }
}
```

### `POST /api/import/trigger`

手動觸發一次資料下載與匯入，供開發測試使用。

---

## 排程設計

APScheduler 使用 `CronTrigger`，在每月 5、15、25 號 00:00 自動執行：

1. 下載 `e_lvr_land_a.xls`（不動產買賣）
2. 下載 `e_lvr_land_b.xls`（預售屋買賣）
3. 以 pandas 解析，正規化欄位名稱
4. `INSERT OR IGNORE` 批次寫入 SQLite
5. 清除暫存 XLS 檔

下載來源：
- `https://plvr.land.moi.gov.tw//Download?fileName=e_lvr_land_a.xls`
- `https://plvr.land.moi.gov.tw//Download?fileName=e_lvr_land_b.xls`

---

## 前端設計

### 頁面結構

單頁應用，三個區塊：

**① 篩選面板**

| 控件 | 欄位 |
|------|------|
| Dropdown | 鄉鎮市區（從 `/api/options` 載入） |
| 數字輸入 x2 | 年 / 月 |
| 文字輸入 | 社區案名（模糊） |
| Dropdown | 建物型態 |
| 數字輸入 x2 | 總價範圍（最小 / 最大，元） |
| 數字輸入 x2 | 單價範圍（最小 / 最大，元/㎡） |
| 數字輸入 | 房數 |
| 數字輸入 | 衛數 |
| 按鈕 | 查詢 / 清除 |

**② 統計列**
- 共找到 N 筆資料
- 最後資料更新時間

**③ 結果表格**

顯示欄位：鄉鎮市區、交易年月、社區案名、建物型態、格局（房/廳/衛）、總價（萬元）、單價（元/㎡）、建物面積（坪）

- 分頁（每頁 20 筆）
- 欄位可排序：總價、單價、交易年月

### 風格
Tailwind CSS，深色系 dashboard 風格（ui-ux-pro-max）

---

## 初始資料匯入

系統首次啟動時，自動偵測 `row data.xlsx` 是否存在並匯入，使用相同去重邏輯。

---

## 錯誤處理

| 情境 | 處理方式 |
|------|------|
| 下載失敗（網路、逾時） | 記錄 log，不中斷服務，下次排程重試 |
| XLS 格式異常 | 記錄 log，跳過該檔案 |
| SQLite 寫入衝突 | `INSERT OR IGNORE` 自動略過重複 |
| API 查詢無結果 | 回傳 `{ total: 0, data: [] }`，非 404 |
