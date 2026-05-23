import logging
import os
from datetime import datetime
from pathlib import Path

import pandas as pd
import requests
from sqlalchemy.orm import Session

from models import Transaction

logger = logging.getLogger(__name__)

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

DOWNLOAD_URLS = {
    "a": "https://plvr.land.moi.gov.tw//Download?fileName=e_lvr_land_a.xls",
    "b": "https://plvr.land.moi.gov.tw//Download?fileName=e_lvr_land_b.xls",
}

# 原始欄位名稱 → model 欄位名稱
COLUMN_MAP = {
    "鄉鎮市區": "鄉鎮市區",
    "區段": "區段",
    "交易標的": "交易標的",
    "土地區段位置建物區段門牌": "土地區段位置建物區段門牌",
    "土地移轉總面積(㎡)": "土地移轉總面積_平方",
    "使用分區編定": "使用分區編定",
    "非都市地使用分區": "非都市地使用分區",
    "非都市土地使用地": "非都市土地使用地",
    "交易年月": "交易年月",
    "交易筆棟數": "交易筆棟數",
    "移轉層次": "移轉層次",
    "總樓層數": "總樓層數",
    "建物型態": "建物型態",
    "主要用途": "主要用途",
    "主要建材": "主要建材",
    "建築完成年月": "建築完成年月",
    "建物移轉總面積(㎡)": "建物移轉總面積_平方",
    "格局(房)": "格局_房",
    "格局(廳)": "格局_廳",
    "格局(衛)": "格局_衛",
    "格局(隔間)": "格局_隔間",
    "有無管理組織": "有無管理組織",
    "總價(元)": "總價_元",
    "單價(元/㎡)": "單價_元每平方",
    "車位類別": "車位類別",
    "車位移轉總面積(㎡)": "車位移轉總面積_平方",
    "車位總價(元)": "車位總價_元",
    "棟別": "棟別",
    "總價(萬元)": "總價_萬元",
    "土地移轉總面積(坪)": "土地移轉總面積_坪",
    "建物移轉總面積(坪)": "建物移轉總面積_坪",
    "建物移轉不含車面積(坪)": "建物移轉不含車面積_坪",
    "建物單價(萬/坪)": "建物單價_萬每坪",
    "車位移轉總面積(坪)": "車位移轉總面積_坪",
    "社區案名": "社區案名",
    "備註": "備註",
    "編號": "編號",
    "主建物面積": "主建物面積",
    "附屬建物面積": "附屬建物面積",
    "陽台面積": "陽台面積",
    "電梯": "電梯",
    "移轉編號": "移轉編號",
}


def _safe(val):
    """Convert NaN/formula strings to None."""
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
    """Parse an XLS/XLSX file and insert new records. Returns inserted count."""
    try:
        df = pd.read_excel(path, dtype=str)
    except Exception as e:
        logger.error("Failed to read %s: %s", path, e)
        return 0

    # Normalize column names via map; keep unmapped columns as-is
    df.columns = [COLUMN_MAP.get(c, c) for c in df.columns]

    inserted = 0
    now = datetime.utcnow()

    for _, row in df.iterrows():
        移轉編號 = _safe(row.get("移轉編號"))

        record = {
            "移轉編號": 移轉編號,
            "鄉鎮市區": _safe(row.get("鄉鎮市區")),
            "區段": _safe(row.get("區段")),
            "交易標的": _safe(row.get("交易標的")),
            "土地區段位置建物區段門牌": _safe(row.get("土地區段位置建物區段門牌")),
            "土地移轉總面積_平方": _to_float(row.get("土地移轉總面積_平方")),
            "使用分區編定": _safe(row.get("使用分區編定")),
            "非都市地使用分區": _safe(row.get("非都市地使用分區")),
            "非都市土地使用地": _safe(row.get("非都市土地使用地")),
            "交易年月": _safe(row.get("交易年月")),
            "交易筆棟數": _safe(row.get("交易筆棟數")),
            "移轉層次": _safe(row.get("移轉層次")),
            "總樓層數": _safe(row.get("總樓層數")),
            "建物型態": _safe(row.get("建物型態")),
            "主要用途": _safe(row.get("主要用途")),
            "主要建材": _safe(row.get("主要建材")),
            "建築完成年月": _safe(row.get("建築完成年月")),
            "建物移轉總面積_平方": _to_float(row.get("建物移轉總面積_平方")),
            "格局_房": _to_int(row.get("格局_房")),
            "格局_廳": _to_int(row.get("格局_廳")),
            "格局_衛": _to_int(row.get("格局_衛")),
            "格局_隔間": _safe(row.get("格局_隔間")),
            "有無管理組織": _safe(row.get("有無管理組織")),
            "總價_元": _to_int(row.get("總價_元")),
            "單價_元每平方": _to_float(row.get("單價_元每平方")),
            "車位類別": _safe(row.get("車位類別")),
            "車位移轉總面積_平方": _to_float(row.get("車位移轉總面積_平方")),
            "車位總價_元": _to_int(row.get("車位總價_元")),
            "棟別": _safe(row.get("棟別")),
            "總價_萬元": _to_float(row.get("總價_萬元")),
            "土地移轉總面積_坪": _to_float(row.get("土地移轉總面積_坪")),
            "建物移轉總面積_坪": _to_float(row.get("建物移轉總面積_坪")),
            "建物移轉不含車面積_坪": _to_float(row.get("建物移轉不含車面積_坪")),
            "建物單價_萬每坪": _to_float(row.get("建物單價_萬每坪")),
            "車位移轉總面積_坪": _to_float(row.get("車位移轉總面積_坪")),
            "社區案名": _safe(row.get("社區案名")),
            "備註": _safe(row.get("備註")),
            "編號": _safe(row.get("編號")),
            "主建物面積": _to_float(row.get("主建物面積")),
            "附屬建物面積": _to_float(row.get("附屬建物面積")),
            "陽台面積": _to_float(row.get("陽台面積")),
            "電梯": _safe(row.get("電梯")),
            "來源檔案": source,
            "匯入時間": now,
        }

        # If no 移轉編號, always insert (can't dedup)
        if 移轉編號 is None:
            db.add(Transaction(**record))
            inserted += 1
        else:
            exists = db.query(Transaction).filter_by(移轉編號=移轉編號).first()
            if not exists:
                db.add(Transaction(**record))
                inserted += 1

    db.commit()
    logger.info("Imported %d new records from %s (source=%s)", inserted, path, source)
    return inserted


def download_and_import(db: Session) -> dict:
    """Download both XLS files and import them. Returns summary."""
    results = {}
    for source, url in DOWNLOAD_URLS.items():
        dest = DATA_DIR / f"e_lvr_land_{source}.xls"
        try:
            logger.info("Downloading %s", url)
            resp = requests.get(url, timeout=120)
            resp.raise_for_status()
            dest.write_bytes(resp.content)
            count = import_from_file(str(dest), source, db)
            results[source] = {"status": "ok", "inserted": count}
        except Exception as e:
            logger.error("Download/import failed for source=%s: %s", source, e)
            results[source] = {"status": "error", "message": str(e)}
        finally:
            if dest.exists():
                dest.unlink()
    return results
