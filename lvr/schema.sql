CREATE TABLE IF NOT EXISTS transactions (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,

  -- 位置
  district                    TEXT,
  section                     TEXT,
  address                     TEXT,

  -- 交易
  transaction_type            TEXT,
  transaction_date            INTEGER,
  transaction_units           TEXT,

  -- 建物
  building_type               TEXT,
  main_purpose                TEXT,
  main_material               TEXT,
  construction_date           REAL,
  total_floors                TEXT,
  floor_transfer              TEXT,
  elevator                    TEXT,

  -- 格局
  rooms                       INTEGER,
  halls                       INTEGER,
  bathrooms                   INTEGER,
  partitions                  TEXT,
  management                  TEXT,

  -- 面積（㎡）
  land_area_sqm               REAL,
  building_area_sqm           REAL,
  parking_area_sqm            REAL,

  -- 面積（坪）
  land_area_ping              REAL,
  building_area_ping          REAL,
  building_area_excl_parking  REAL,
  parking_area_ping           REAL,
  main_building_area          REAL,
  auxiliary_building_area     REAL,
  balcony_area                REAL,

  -- 價格
  total_price                 INTEGER,
  total_price_10k             REAL,
  unit_price_sqm              REAL,
  unit_price_ping             REAL,
  parking_price               INTEGER,

  -- 車位
  parking_type                TEXT,

  -- 分區
  zoning                      TEXT,
  non_urban_zoning            TEXT,
  non_urban_land_use          TEXT,

  -- 其他
  community_name              TEXT,
  remarks                     TEXT,
  transfer_id                 TEXT,
  source_id                   TEXT     -- 去重唯一識別碼（移轉編號 or 編號）
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_source_id       ON transactions(source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_district         ON transactions(district);
CREATE INDEX IF NOT EXISTS idx_building_type    ON transactions(building_type);
CREATE INDEX IF NOT EXISTS idx_transaction_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_total_price      ON transactions(total_price);
