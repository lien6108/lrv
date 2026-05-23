"""
Convert row data.xlsx -> lvr.db (SQLite)
Usage: python scripts/excel_to_sqlite.py
"""
import sqlite3
import math
import pandas as pd

EXCEL_FILE = "row data.xlsx"
DB_FILE = "lvr.db"

COLUMN_MAP = {
    "鄉鎮市區":                    "district",
    "區段":                        "section",
    "土地區段位置建物區段門牌":      "address",
    "交易標的":                    "transaction_type",
    "交易年月":                    "transaction_date",
    "交易筆棟數":                  "transaction_units",
    "建物型態":                    "building_type",
    "主要用途":                    "main_purpose",
    "主要建材":                    "main_material",
    "建築完成年月":                 "construction_date",
    "總樓層數":                    "total_floors",
    "移轉層次":                    "floor_transfer",
    "電梯":                        "elevator",
    "格局(房)":                    "rooms",
    "格局(廳)":                    "halls",
    "格局(衛)":                    "bathrooms",
    "格局(隔間)":                  "partitions",
    "有無管理組織":                 "management",
    "土地移轉總面積(㎡)":           "land_area_sqm",
    "建物移轉總面積(㎡)":           "building_area_sqm",
    "車位移轉總面積(㎡)":           "parking_area_sqm",
    "土地移轉總面積(坪)":           "land_area_ping",
    "建物移轉總面積(坪)":           "building_area_ping",
    "建物移轉不含車面積(坪)":       "building_area_excl_parking",
    "車位移轉總面積(坪)":           "parking_area_ping",
    "主建物面積":                   "main_building_area",
    "附屬建物面積":                 "auxiliary_building_area",
    "陽台面積":                    "balcony_area",
    "總價(元)":                    "total_price",
    "總價(萬元)":                  "total_price_10k",
    "單價(元/㎡)":                 "unit_price_sqm",
    "建物單價(萬/坪)":             "unit_price_ping",
    "車位總價(元)":                "parking_price",
    "車位類別":                    "parking_type",
    "使用分區編定":                 "zoning",
    "非都市地使用分區":             "non_urban_zoning",
    "非都市土地使用地":             "non_urban_land_use",
    "社區案名":                    "community_name",
    "備註":                        "remarks",
    "移轉編號":                    "transfer_id",
}

INTEGER_COLS = {"transaction_date", "rooms", "halls", "bathrooms", "total_price", "parking_price"}
REAL_COLS = {
    "construction_date", "land_area_sqm", "building_area_sqm", "parking_area_sqm",
    "land_area_ping", "building_area_ping", "building_area_excl_parking",
    "parking_area_ping", "main_building_area", "auxiliary_building_area",
    "balcony_area", "total_price_10k", "unit_price_sqm", "unit_price_ping",
}


def clean_value(val, col_name):
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    if col_name in INTEGER_COLS:
        try:
            return int(float(str(val).replace(",", "").strip()))
        except (ValueError, TypeError):
            return None
    if col_name in REAL_COLS:
        try:
            return float(str(val).replace(",", "").strip())
        except (ValueError, TypeError):
            return None
    return str(val).strip() if str(val).strip() else None


def main():
    print(f"Reading {EXCEL_FILE}...")
    df = pd.read_excel(EXCEL_FILE, sheet_name=0, dtype=str)
    print(f"Loaded {len(df)} rows, {len(df.columns)} columns")

    df = df.rename(columns=COLUMN_MAP)
    target_cols = list(COLUMN_MAP.values())
    missing = [c for c in target_cols if c not in df.columns]
    if missing:
        print(f"Warning: missing columns: {missing}")
    df = df[[c for c in target_cols if c in df.columns]]

    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    with open("schema.sql", "r", encoding="utf-8") as f:
        cur.executescript(f.read())

    cols = [c for c in target_cols if c in df.columns]
    placeholders = ", ".join(["?"] * len(cols))
    insert_sql = f"INSERT INTO transactions ({', '.join(cols)}) VALUES ({placeholders})"

    batch = []
    for _, row in df.iterrows():
        batch.append(tuple(clean_value(row.get(c), c) for c in cols))
        if len(batch) == 1000:
            cur.executemany(insert_sql, batch)
            batch = []
    if batch:
        cur.executemany(insert_sql, batch)

    conn.commit()
    count = cur.execute("SELECT COUNT(*) FROM transactions").fetchone()[0]
    print(f"Inserted {count} rows into {DB_FILE}")

    print("\nSample 3 rows:")
    for r in cur.execute("SELECT district, building_type, total_price_10k, transaction_date FROM transactions LIMIT 3"):
        print(" ", r)

    conn.close()


if __name__ == "__main__":
    main()
