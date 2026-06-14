import logging
import os
from datetime import datetime
from pathlib import Path

import pandas as pd
import requests
import urllib3
from sqlalchemy.orm import Session

from models import Transaction

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

DOWNLOAD_URLS = {
    "a": "https://plvr.land.moi.gov.tw//Download?fileName=e_lvr_land_a.xls",
    "b": "https://plvr.land.moi.gov.tw//Download?fileName=e_lvr_land_b.xls",
}

# Excel 原始欄位名稱 → Transaction model 欄位名稱
COLUMN_MAP = {
    "鄉鎮市區": "district",
    "區段": "section",
    "交易標的": "transaction_type",
    "土地區段位置建物區段門牌": "address",
    "土地移轉總面積(㎡)": "land_area_sqm",
    "使用分區編定": "zoning",
    "非都市地使用分區": "non_urban_zoning",
    "非都市土地使用地": "non_urban_land_use",
    "交易年月": "transaction_date",
    "交易筆棟數": "transaction_units",
    "移轉層次": "floor_transfer",
    "總樓層數": "total_floors",
    "建物型態": "building_type",
    "主要用途": "main_purpose",
    "主要建材": "main_material",
    "建築完成年月": "construction_date",
    "建物移轉總面積(㎡)": "building_area_sqm",
    "格局(房)": "rooms",
    "格局(廳)": "halls",
    "格局(衛)": "bathrooms",
    "格局(隔間)": "partitions",
    "有無管理組織": "management",
    "總價(元)": "total_price",
    "單價(元/㎡)": "unit_price_sqm",
    "車位類別": "parking_type",
    "車位移轉總面積(㎡)": "parking_area_sqm",
    "車位總價(元)": "parking_price",
    "棟別": "building_block",
    "總價(萬元)": "total_price_10k",
    "土地移轉總面積(坪)": "land_area_ping",
    "建物移轉總面積(坪)": "building_area_ping",
    "建物移轉不含車面積(坪)": "building_area_excl_parking",
    "建物單價(萬/坪)": "unit_price_ping",
    "車位移轉總面積(坪)": "parking_area_ping",
    "社區案名": "community_name",
    "備註": "remarks",
    "編號": "_number_id",      # used to compute source_id
    "主建物面積": "main_building_area",
    "附屬建物面積": "auxiliary_building_area",
    "陽台面積": "balcony_area",
    "電梯": "elevator",
    "移轉編號": "transfer_id",
}


def _safe(val):
    if val is None:
        return None
    s = str(val).strip()
    if s in ("", "nan", "NaN", "None") or s.startswith("="):
        return None
    return val


def _to_int(val):
    try:
        return int(float(val)) if val is not None and str(val).strip() not in ("", "nan") else None
    except (ValueError, TypeError):
        return None


def _to_float(val):
    try:
        return float(val) if val is not None and str(val).strip() not in ("", "nan") else None
    except (ValueError, TypeError):
        return None


def import_from_file(path: str, source: str, db: Session) -> int:
    try:
        df = pd.read_excel(path, dtype=str)
    except Exception as e:
        logger.error("Failed to read %s: %s", path, e)
        return 0

    df.columns = [COLUMN_MAP.get(c, c) for c in df.columns]

    inserted = 0
    now = datetime.utcnow()
    seen_ids: set = set()

    for _, row in df.iterrows():
        transfer_id = _safe(row.get("transfer_id"))
        number_id = _safe(row.get("_number_id"))
        source_id = transfer_id or number_id

        if source_id is not None:
            if source_id in seen_ids:
                continue
            exists = db.query(Transaction).filter_by(source_id=source_id).first()
            if exists:
                continue
            seen_ids.add(source_id)

        record = Transaction(
            district=_safe(row.get("district")),
            section=_safe(row.get("section")),
            address=_safe(row.get("address")),
            transaction_type=_safe(row.get("transaction_type")),
            transaction_date=_safe(row.get("transaction_date")),
            transaction_units=_safe(row.get("transaction_units")),
            building_type=_safe(row.get("building_type")),
            building_block=_safe(row.get("building_block")),
            main_purpose=_safe(row.get("main_purpose")),
            main_material=_safe(row.get("main_material")),
            construction_date=_to_float(row.get("construction_date")),
            total_floors=_safe(row.get("total_floors")),
            floor_transfer=_safe(row.get("floor_transfer")),
            elevator=_safe(row.get("elevator")),
            rooms=_to_int(row.get("rooms")),
            halls=_to_int(row.get("halls")),
            bathrooms=_to_int(row.get("bathrooms")),
            partitions=_safe(row.get("partitions")),
            management=_safe(row.get("management")),
            land_area_sqm=_to_float(row.get("land_area_sqm")),
            building_area_sqm=_to_float(row.get("building_area_sqm")),
            parking_area_sqm=_to_float(row.get("parking_area_sqm")),
            land_area_ping=_to_float(row.get("land_area_ping")),
            building_area_ping=_to_float(row.get("building_area_ping")),
            building_area_excl_parking=_to_float(row.get("building_area_excl_parking")),
            parking_area_ping=_to_float(row.get("parking_area_ping")),
            main_building_area=_to_float(row.get("main_building_area")),
            auxiliary_building_area=_to_float(row.get("auxiliary_building_area")),
            balcony_area=_to_float(row.get("balcony_area")),
            total_price=_to_int(row.get("total_price")),
            total_price_10k=_to_float(row.get("total_price_10k")),
            unit_price_sqm=_to_float(row.get("unit_price_sqm")),
            unit_price_ping=_to_float(row.get("unit_price_ping")),
            parking_price=_to_int(row.get("parking_price")),
            parking_type=_safe(row.get("parking_type")),
            zoning=_safe(row.get("zoning")),
            non_urban_zoning=_safe(row.get("non_urban_zoning")),
            non_urban_land_use=_safe(row.get("non_urban_land_use")),
            community_name=_safe(row.get("community_name")),
            remarks=_safe(row.get("remarks")),
            transfer_id=transfer_id,
            source_id=source_id,
            source_file=source,
            import_time=now,
        )
        db.add(record)
        inserted += 1

    db.commit()
    logger.info("Imported %d new records from %s (source=%s)", inserted, path, source)
    return inserted


def download_and_import(db: Session) -> dict:
    results = {}
    for source, url in DOWNLOAD_URLS.items():
        dest = DATA_DIR / f"e_lvr_land_{source}.xls"
        try:
            logger.info("Downloading %s", url)
            resp = requests.get(url, timeout=120, verify=False)
            resp.raise_for_status()
            dest.write_bytes(resp.content)
            count = import_from_file(str(dest), source, db)
            results[source] = {"status": "ok", "inserted": count}
        except Exception as e:
            logger.error("Download/import failed for source=%s: %s", source, e)
            db.rollback()
            results[source] = {"status": "error", "message": str(e)}
        finally:
            if dest.exists():
                dest.unlink()
    return results
