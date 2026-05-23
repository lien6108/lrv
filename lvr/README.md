# 實價登錄查詢系統 (LVR Query System)

台灣不動產實價登錄資料查詢平台，自動從內政部不動產成交案件實際資訊資料庫（plvr.land.moi.gov.tw）下載最新資料，提供結構化查詢 API 與前端介面。

## 功能

- **自動資料同步** — 每月 5、15、25 日凌晨 00:00（台北時區）自動從政府開放資料下載最新實價登錄 XLS 並匯入資料庫，以移轉編號去重避免重複寫入
- **REST API** — 支援多條件篩選（行政區、年月、社區案名、建物型態、總價、單價、格局）、分頁與排序
- **前端查詢介面** — 靜態 HTML/JS，直接連接後端 API，無需額外建置
- **手動觸發匯入** — 提供 API endpoint 可隨時觸發資料更新

## 技術架構

| 層次 | 技術 |
|------|------|
| Web Framework | FastAPI + Uvicorn |
| ORM | SQLAlchemy 2.x |
| 資料庫 | SQLite (`lvr.db`) |
| 資料處理 | pandas + openpyxl |
| 排程 | APScheduler (BackgroundScheduler) |
| 前端 | 原生 HTML / JavaScript |

## 快速開始

### 安裝相依套件

```bash
pip install -r requirements.txt
```

### 啟動伺服器

```bash
python main.py
```

伺服器預設監聽 `http://0.0.0.0:8000`。

首次啟動時若目錄下存在 `row data.xlsx`，會自動執行初始資料匯入（僅執行一次，完成後建立 `.initial_import_done` 標記）。

### 開啟前端

瀏覽器前往 `http://localhost:8000` 即可使用查詢介面。

## API 說明

### `GET /api/transactions`

查詢實價登錄成交資料，支援以下 query string 參數：

| 參數 | 型別 | 說明 |
|------|------|------|
| `district` | string | 鄉鎮市區（完全符合） |
| `year` | int | 民國年（交易年月前 3 碼） |
| `month` | int | 月份（1–12） |
| `community` | string | 社區案名（模糊搜尋） |
| `building_type` | string | 建物型態（完全符合） |
| `min_price` / `max_price` | int | 總價範圍（元） |
| `min_unit_price` / `max_unit_price` | float | 單價範圍（元/㎡） |
| `bedrooms` | int | 格局（房） |
| `bathrooms` | int | 格局（衛） |
| `sort_by` | string | 排序欄位：`total_price` / `unit_price` / `year_month` |
| `sort_dir` | string | `asc` 或 `desc`（預設 `desc`） |
| `page` | int | 頁碼（預設 1） |
| `limit` | int | 每頁筆數（預設 20，最大 100） |

**回應格式：**
```json
{
  "total": 1234,
  "page": 1,
  "limit": 20,
  "data": [ ... ]
}
```

### `GET /api/options`

取得可用的篩選選項（行政區列表、建物型態列表、年份範圍、最後匯入時間）。

### `POST /api/import/trigger`

手動觸發從政府平台下載並匯入最新資料（背景執行）。

```bash
curl -X POST http://localhost:8000/api/import/trigger
```

## 資料來源

- **A 類（不動產）**：`https://plvr.land.moi.gov.tw//Download?fileName=e_lvr_land_a.xls`
- **B 類（預售屋）**：`https://plvr.land.moi.gov.tw//Download?fileName=e_lvr_land_b.xls`

資料授權依內政部開放資料規範。

## 專案結構

```
lvr/
├── main.py          # FastAPI 應用程式入口、lifespan 管理
├── models.py        # SQLAlchemy ORM 模型（Transaction）
├── database.py      # 資料庫連線、初始化
├── importer.py      # XLS 下載、欄位對應、資料寫入邏輯
├── scheduler.py     # APScheduler 排程設定
├── routers/
│   └── transactions.py  # /api 路由
├── static/          # 前端靜態檔案
├── data/            # 下載暫存目錄（自動建立）
├── schema.sql       # 資料庫 schema 參考
├── requirements.txt
└── wrangler.toml    # Cloudflare Worker / D1 設定（備用部署）
```

## 環境需求

- Python 3.10+
- 可連外網路（用於下載政府資料）
