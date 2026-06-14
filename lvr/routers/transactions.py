from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Transaction
from importer import download_and_import
from notifier import send_import_notification

router = APIRouter(prefix="/api")


@router.get("/transactions")
def query_transactions(
    district: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    community: Optional[str] = None,
    building_type: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    min_unit_price: Optional[float] = None,
    max_unit_price: Optional[float] = None,
    bedrooms: Optional[int] = None,
    bathrooms: Optional[int] = None,
    sort_by: Optional[str] = None,
    sort_dir: Optional[str] = "desc",
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    limit = min(limit, 100)
    q = db.query(Transaction)

    if district:
        q = q.filter(Transaction.district == district)
    if year:
        q = q.filter(Transaction.transaction_date.like(f"{year}%"))
    if month:
        month_str = str(month).zfill(2)
        q = q.filter(func.substr(Transaction.transaction_date, 4, 2) == month_str)
    if community:
        q = q.filter(Transaction.community_name.contains(community))
    if building_type:
        q = q.filter(Transaction.building_type == building_type)
    if min_price is not None:
        q = q.filter(Transaction.total_price >= min_price)
    if max_price is not None:
        q = q.filter(Transaction.total_price <= max_price)
    if min_unit_price is not None:
        q = q.filter(Transaction.unit_price_sqm >= min_unit_price)
    if max_unit_price is not None:
        q = q.filter(Transaction.unit_price_sqm <= max_unit_price)
    if bedrooms is not None:
        q = q.filter(Transaction.rooms == bedrooms)
    if bathrooms is not None:
        q = q.filter(Transaction.bathrooms == bathrooms)

    sort_col_map = {
        "total_price": Transaction.total_price,
        "unit_price": Transaction.unit_price_sqm,
        "year_month": Transaction.transaction_date,
    }
    if sort_by in sort_col_map:
        col = sort_col_map[sort_by]
        q = q.order_by(col.asc() if sort_dir == "asc" else col.desc())
    else:
        q = q.order_by(Transaction.transaction_date.desc())

    total = q.count()
    rows = q.offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": [_serialize(r) for r in rows],
    }


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Transaction.id)).scalar() or 0

    by_source = dict(
        db.query(Transaction.source_file, func.count(Transaction.id))
        .group_by(Transaction.source_file)
        .all()
    )

    by_building_type = dict(
        db.query(Transaction.building_type, func.count(Transaction.id))
        .filter(Transaction.building_type.isnot(None))
        .group_by(Transaction.building_type)
        .order_by(func.count(Transaction.id).desc())
        .limit(8)
        .all()
    )

    return {
        "total": total,
        "by_source": by_source,
        "by_building_type": by_building_type,
    }


@router.get("/options")
def get_options(db: Session = Depends(get_db)):
    districts = [r[0] for r in db.query(Transaction.district).distinct().order_by(Transaction.district) if r[0]]
    building_types = [r[0] for r in db.query(Transaction.building_type).distinct().order_by(Transaction.building_type) if r[0]]

    year_vals = [
        int(r[0][:3]) for r in db.query(Transaction.transaction_date).distinct()
        if r[0] and len(r[0]) >= 3 and r[0][:3].isdigit()
    ]
    year_range = {"min": min(year_vals), "max": max(year_vals)} if year_vals else {"min": 100, "max": 120}

    last_import = db.query(func.max(Transaction.import_time)).scalar()

    return {
        "districts": districts,
        "building_types": building_types,
        "year_range": year_range,
        "last_import": last_import.isoformat() if last_import else None,
    }


async def _import_and_notify(db: Session):
    results = download_and_import(db)
    total = db.query(func.count(Transaction.id)).scalar() or 0
    send_import_notification(results, triggered_by="手動觸發", total_records=total)


@router.post("/import/trigger")
def trigger_import(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    background_tasks.add_task(_import_and_notify, db)
    return {"status": "started"}


def _serialize(t: Transaction) -> dict:
    return {
        "id": t.id,
        "移轉編號": t.transfer_id,
        "鄉鎮市區": t.district,
        "區段": t.section,
        "交易標的": t.transaction_type,
        "土地區段位置建物區段門牌": t.address,
        "土地移轉總面積_坪": t.land_area_ping,
        "使用分區編定": t.zoning,
        "交易年月": t.transaction_date,
        "交易筆棟數": t.transaction_units,
        "移轉層次": t.floor_transfer,
        "總樓層數": t.total_floors,
        "建物型態": t.building_type,
        "主要用途": t.main_purpose,
        "主要建材": t.main_material,
        "建築完成年月": t.construction_date,
        "格局_房": t.rooms,
        "格局_廳": t.halls,
        "格局_衛": t.bathrooms,
        "格局_隔間": t.partitions,
        "有無管理組織": t.management,
        "總價_元": t.total_price,
        "總價_萬元": t.total_price_10k,
        "單價_元每平方": t.unit_price_sqm,
        "建物單價_萬每坪": t.unit_price_ping,
        "車位類別": t.parking_type,
        "車位移轉總面積_坪": t.parking_area_ping,
        "車位總價_元": t.parking_price,
        "棟別": t.building_block,
        "建物移轉總面積_坪": t.building_area_ping,
        "建物移轉不含車面積_坪": t.building_area_excl_parking,
        "主建物面積": t.main_building_area,
        "附屬建物面積": t.auxiliary_building_area,
        "陽台面積": t.balcony_area,
        "電梯": t.elevator,
        "社區案名": t.community_name,
        "備註": t.remarks,
        "來源檔案": t.source_file,
    }
