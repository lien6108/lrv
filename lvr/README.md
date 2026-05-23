# 實價登錄查詢系統 (LVR Query System)

台灣不動產實價登錄資料查詢平台，自動從內政部不動產成交案件實際資訊資料庫（plvr.land.moi.gov.tw）下載最新資料，提供結構化查詢 API 與前端介面。

## 功能

- **Dashboard 統計面板** — 頁面預設顯示資料總筆數、買賣成交 / 預售屋比例、各建物型態分佈長條圖
- **欄位設定 Studio** — 點擊「欄位設定」可從 34 個資料庫欄位自由勾選顯示欄位，設定即時生效並存入 localStorage
- **自動資料同步** — 每月 5、15、25 日凌晨 00:00（台北時區）自動從政府開放資料下載最新實價登錄 XLS 並匯入資料庫，以移轉編號去重避免重複寫入
- **Email 通知** — 每次資料更新完成後，自動寄送 HTML 格式摘要信（含各來源新增筆數、錯誤訊息）
- **REST API** — 支援多條件篩選（行政區、年月、社區案名、建物型態、總價、單價、格局）、分頁與排序
- **每頁筆數調整** — 查詢結果列表旁可直接切換每頁顯示 10 / 20 / 50 / 100 筆
- **前端查詢介面** — 靜態 HTML/JS，直接連接後端 API，無需額外建置
- **手動觸發匯入** — 提供 API endpoint 可隨時觸發資料更新並寄送通知信

## 技術架構

| 層次 | 技術 |
| --- | --- |
| Web Framework | FastAPI + Uvicorn |
| ORM | SQLAlchemy 2.x |
| 資料庫 | SQLite (`lvr.db`) |
| 資料處理 | pandas + openpyxl |
| 排程 | APScheduler (BackgroundScheduler) |
| 前端 | 原生 HTML / JavaScript + Tailwind CSS CDN |
| Email 通知 | Python smtplib + Gmail SMTP |
| 雲端備用 | Cloudflare Worker + D1（`src/`、`wrangler.toml`） |

## 快速開始

### 安裝相依套件

```bash
pip install -r requirements.txt
```

### 設定 Email 通知

建立 `.env` 並填入 Gmail 憑證：

```env
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

> **取得 App Password：**
>
> 1. 前往 [Google 帳戶安全性](https://myaccount.google.com/security) 開啟兩步驟驗證
> 2. 前往 [應用程式密碼](https://myaccount.google.com/apppasswords)，選擇「郵件」產生 16 位密碼
> 3. 填入 `.env` 的 `GMAIL_APP_PASSWORD`
>
> 若未設定 `.env`，系統仍可正常運作，只是不會寄信（log 會顯示警告）。

### 啟動伺服器

```bash
python main.py
```

伺服器預設監聽 `http://0.0.0.0:8000`。

首次啟動時若目錄下存在 `row data.xlsx`，會自動執行初始資料匯入（僅執行一次，完成後建立 `.initial_import_done` 標記）。

### 開啟前端

瀏覽器前往 `http://localhost:8000` 即可使用查詢介面。

## 前端介面說明

### Dashboard 統計面板

頁面頂部常駐顯示：

| 區塊 | 說明 |
| --- | --- |
| 資料總筆數 | 資料庫目前所有記錄數量 |
| 買賣成交 | 不動產買賣成交筆數及佔比 |
| 預售屋 | 預售屋成交筆數及佔比 |
| 建物型態分佈 | 各型態筆數長條圖（Top 8） |

### 欄位設定 Studio

點擊結果列表右上角的「欄位設定」按鈕，從側邊面板自由選擇要顯示的欄位：

| 分組 | 包含欄位 |
| --- | --- |
| 基本資訊 | 鄉鎮市區、區段、交易年月、社區案名、來源 |
| 地址 | 地址門牌、棟別、樓層、總樓層 |
| 建物 | 建物型態、主要用途、主要建材、完工年月、電梯、管理組織 |
| 格局 | 格局（房廳衛組合）、隔間 |
| 面積 | 面積、不含車、主建物、附屬建物、陽台、土地、車位面積 |
| 價格 | 總價（萬）、單價（元/㎡）、單價（萬/坪）、車位總價 |
| 車位 | 車位類別 |
| 其他 | 交易標的、交易筆棟數、使用分區、備註、移轉編號 |

欄位選擇即時生效，並自動存入 `localStorage` 供下次開啟時使用。「恢復預設」可還原為 9 個預設欄位。

## API 說明

### `GET /api/transactions`

查詢實價登錄成交資料，支援以下 query string 參數：

| 參數 | 型別 | 說明 |
| --- | --- | --- |
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

### `GET /api/stats`

取得資料庫整體統計資訊，供 Dashboard 面板使用。

**回應格式：**

```json
{
  "total": 12345,
  "by_source": { "a": 8000, "b": 4345 },
  "by_building_type": { "住宅大樓": 5000, "公寓": 3000 }
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

```text
lvr/
├── main.py              # FastAPI 應用程式入口、lifespan 管理
├── models.py            # SQLAlchemy ORM 模型（Transaction）
├── database.py          # 資料庫連線、初始化
├── importer.py          # XLS 下載、欄位對應、資料寫入邏輯
├── scheduler.py         # APScheduler 排程設定
├── notifier.py          # Email 通知（Gmail SMTP）
├── routers/
│   └── transactions.py  # /api 路由（transactions、stats、options、import）
├── static/              # FastAPI 前端靜態檔案
│   ├── index.html       # 主介面（Dashboard + 欄位 Studio + 查詢表格）
│   └── app.js           # 前端邏輯（動態欄位、Studio、分頁、排序）
├── public/              # Cloudflare Worker 前端
├── src/
│   └── index.js         # Cloudflare Worker（D1 查詢 + cron 自動更新）
├── scripts/             # 資料維護工具腳本
├── schema.sql           # 資料庫 schema 參考
├── requirements.txt
└── wrangler.toml        # Cloudflare Worker / D1 設定
```

## 環境需求

- Python 3.10+
- 可連外網路（用於下載政府資料）

## Cloudflare Worker 部署

專案同時包含 Cloudflare Worker 版本（`src/index.js`），使用 D1 資料庫，支援與 FastAPI 版相同的自動排程更新。

```bash
npx wrangler deploy
```
