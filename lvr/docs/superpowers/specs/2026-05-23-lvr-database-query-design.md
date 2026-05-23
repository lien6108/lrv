# LVR 實價登錄查詢系統 — 設計文件

**日期：** 2026-05-23  
**狀態：** 已核准

---

## 背景

將台灣實價登錄 Excel 資料（315,595 筆，42 欄）轉換為可查詢的線上介面，部署於 Cloudflare Workers + D1。

---

## 架構

```
GitHub repo: lien6108/lrv
│
├── push → Cloudflare Workers（自動部署）
│            │
│            ├── GET /           → 回傳 index.html
│            └── GET /api/*      → 查詢 D1 資料庫
│
└── D1 Database: lvr_db
     └── transactions 資料表（315,595 筆）
```

**資料匯入流程（一次性，本機執行）：**
1. `scripts/excel_to_sqlite.py` — 讀取 `row data.xlsx`，產生 `lvr.db`（SQLite）
2. `wrangler d1 import lvr_db --local-db lvr.db` — 上傳至 Cloudflare D1

---

## 資料庫 Schema

```sql
CREATE TABLE transactions (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,

  -- 位置
  district                    TEXT,    -- 鄉鎮市區
  section                     TEXT,    -- 區段
  address                     TEXT,    -- 土地區段位置建物區段門牌

  -- 交易
  transaction_type            TEXT,    -- 交易標的（房地、土地…）
  transaction_date            INTEGER, -- 交易年月（ROC YYYMMDD，e.g. 1120930）
  transaction_units           TEXT,    -- 交易筆棟數

  -- 建物
  building_type               TEXT,    -- 建物型態（透天厝、公寓…）
  main_purpose                TEXT,    -- 主要用途
  main_material               TEXT,    -- 主要建材
  construction_date           REAL,    -- 建築完成年月
  total_floors                TEXT,    -- 總樓層數
  floor_transfer              TEXT,    -- 移轉層次
  elevator                    TEXT,    -- 電梯

  -- 格局
  rooms                       INTEGER, -- 格局(房)
  halls                       INTEGER, -- 格局(廳)
  bathrooms                   INTEGER, -- 格局(衛)
  partitions                  TEXT,    -- 格局(隔間)
  management                  TEXT,    -- 有無管理組織

  -- 面積（㎡）
  land_area_sqm               REAL,    -- 土地移轉總面積(㎡)
  building_area_sqm           REAL,    -- 建物移轉總面積(㎡)
  parking_area_sqm            REAL,    -- 車位移轉總面積(㎡)

  -- 面積（坪）
  land_area_ping              REAL,    -- 土地移轉總面積(坪)
  building_area_ping          REAL,    -- 建物移轉總面積(坪)
  building_area_excl_parking  REAL,    -- 建物移轉不含車面積(坪)
  parking_area_ping           REAL,    -- 車位移轉總面積(坪)
  main_building_area          REAL,    -- 主建物面積
  auxiliary_building_area     REAL,    -- 附屬建物面積
  balcony_area                REAL,    -- 陽台面積

  -- 價格
  total_price                 INTEGER, -- 總價(元)
  total_price_10k             REAL,    -- 總價(萬元)
  unit_price_sqm              REAL,    -- 單價(元/㎡)
  unit_price_ping             REAL,    -- 建物單價(萬/坪)
  parking_price               INTEGER, -- 車位總價(元)

  -- 車位
  parking_type                TEXT,    -- 車位類別

  -- 分區
  zoning                      TEXT,    -- 使用分區編定
  non_urban_zoning            TEXT,    -- 非都市地使用分區
  non_urban_land_use          TEXT,    -- 非都市土地使用地

  -- 其他
  community_name              TEXT,    -- 社區案名
  remarks                     TEXT,    -- 備註
  transfer_id                 TEXT     -- 移轉編號
);

-- 查詢索引
CREATE INDEX idx_district        ON transactions(district);
CREATE INDEX idx_building_type   ON transactions(building_type);
CREATE INDEX idx_transaction_date ON transactions(transaction_date);
CREATE INDEX idx_total_price     ON transactions(total_price);
```

---

## API 端點

### `GET /api/search`

查詢交易紀錄，支援分頁。

**Query Parameters：**

| 參數 | 型別 | 說明 |
|---|---|---|
| `district` | string | 鄉鎮市區（完整比對） |
| `building_type` | string | 建物型態 |
| `min_price` | integer | 最低總價（萬元） |
| `max_price` | integer | 最高總價（萬元） |
| `date_from` | integer | 交易年月起（ROC YYYMMDD） |
| `date_to` | integer | 交易年月迄（ROC YYYMMDD） |
| `page` | integer | 頁碼，預設 1 |
| `limit` | integer | 每頁筆數，預設 20，上限 100 |

**Response：**
```json
{
  "total": 342,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "district": "新興區",
      "address": "高雄市新興區金門街91~120號",
      "building_type": "透天厝",
      "transaction_date": 1070929,
      "total_price_10k": 2500.0,
      "unit_price_ping": 15.99,
      "building_area_ping": 156.37,
      "land_area_ping": 33.88
    }
  ]
}
```

### `GET /api/options`

取得篩選下拉選單所需的唯一值列表。

**Response：**
```json
{
  "districts": ["新興區", "苓雅區", "前鎮區", "..."],
  "building_types": ["透天厝", "公寓", "住宅大樓", "套房", "..."]
}
```

---

## 前端介面

單一 `index.html`，無框架，Vanilla JS。

**版面：**
```
┌────────────────────────────────────────────┐
│  🏠 實價登錄查詢                              │
├────────────────────────────────────────────┤
│  地區 [下拉]   建物型態 [下拉]                │
│  價格 [___] 萬 ~ [___] 萬                    │
│  年份 [___]   ~  [___]                       │
│                              [查詢]           │
├────────────────────────────────────────────┤
│  找到 342 筆                                 │
│ ┌──────────────────────────────────────────┐│
│ │ 地址 │ 型態 │ 總價(萬) │ 坪數 │ 萬/坪     ││
│ │ ...  │ ...  │ ...      │ ...  │ ...       ││
│ └──────────────────────────────────────────┘│
│          [上一頁]  第 1 / 18 頁  [下一頁]    │
└────────────────────────────────────────────┘
```

**行為：**
- 頁面載入時呼叫 `/api/options` 填充下拉選單
- 按「查詢」時呼叫 `/api/search` 並渲染結果表格
- 翻頁不重新送出表單，直接更新 `page` 參數重新查詢
- 年份輸入為西元年（e.g. 2023），送出前轉換：`ROC年 = 西元年 - 1911`，再組成 YYYMMDD（e.g. 1120101）

---

## 專案結構

```
lrv/
├── wrangler.toml              # Workers 設定 + D1 binding
├── src/
│   └── index.js               # Worker 主程式（路由 + D1 查詢）
├── public/
│   └── index.html             # 前端查詢頁面
├── schema.sql                 # D1 建表語法
└── scripts/
    └── excel_to_sqlite.py     # 本機：Excel → SQLite，供 wrangler d1 import 使用
```

---

## 資料匯入注意事項

- Excel 的交易年月欄位為 ROC 格式（e.g. `1070929` = 民國107年09月29日），儲存為 INTEGER 直接比較即可
- 部分欄位有大量 NULL（車位、棟別等），schema 不加 NOT NULL 約束
- `wrangler d1 import` 支援直接上傳 SQLite 檔，315K 筆不需要分批 INSERT

---

## 不在此次範圍

- 使用者登入 / 權限控制
- 資料定期更新機制
- 地圖視覺化
- 統計圖表
