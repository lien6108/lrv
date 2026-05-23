from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Transaction
from importer import download_and_import

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
        q = q.filter(Transaction.鄉鎮市區 == district)
    if year:
        # 交易年月 format: YYYMMDD, filter by year prefix
        year_str = str(year)
        q = q.filter(Transaction.交易年月.like(f"{year_str}%"))
    if month:
        month_str = str(month).zfill(2)
        # match YYYMMDD where MM part equals month
        q = q.filter(func.substr(Transaction.交易年月, 4, 2) == month_str)
    if community:
        q = q.filter(Transaction.社區案名.contains(community))
    if building_type:
        q = q.filter(Transaction.建物型態 == building_type)
    if min_price is not None:
        q = q.filter(Transaction.總價_元 >= min_price)
    if max_price is not None:
        q = q.filter(Transaction.總價_元 <= max_price)
    if min_unit_price is not None:
        q = q.filter(Transaction.單價_元每平方 >= min_unit_price)
    if max_unit_price is not None:
        q = q.filter(Transaction.單價_元每平方 <= max_unit_price)
    if bedrooms is not None:
        q = q.filter(Transaction.格局_房 == bedrooms)
    if bathrooms is not None:
        q = q.filter(Transaction.格局_衛 == bathrooms)

    # Sorting
    sort_col_map = {
        "total_price": Transaction.總價_元,
        "unit_price": Transaction.單價_元每平方,
        "year_month": Transaction.交易年月,
    }
    if sort_by in sort_col_map:
        col = sort_col_map[sort_by]
        q = q.order_by(col.asc() if sort_dir == "asc" else col.desc())
    else:
        q = q.order_by(Transaction.交易年月.desc())

    total = q.count()
    rows = q.offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": [_serialize(r) for r in rows],
    }


@router.get("/options")
def get_options(db: Session = Depends(get_db)):
    districts = [r[0] for r in db.query(Transaction.鄉鎮市區).distinct().order_by(Transaction.鄉鎮市區) if r[0]]
    building_types = [r[0] for r in db.query(Transaction.建物型態).distinct().order_by(Transaction.建物型態) if r[0]]

    year_vals = [
        int(r[0][:3]) for r in db.query(Transaction.交易年月).distinct()
        if r[0] and len(r[0]) >= 3 and r[0][:3].isdigit()
    ]
    year_range = {"min": min(year_vals), "max": max(year_vals)} if year_vals else {"min": 100, "max": 120}

    last_import = db.query(func.max(Transaction.匯入時間)).scalar()

    return {
        "districts": districts,
        "building_types": building_types,
        "year_range": year_range,
        "last_import": last_import.isoformat() if last_import else None,
    }


@router.post("/import/trigger")
def trigger_import(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    background_tasks.add_task(download_and_import, db)
    return {"status": "started"}


def _serialize(t: Transaction) -> dict:
    return {
        "id": t.id,
        "鄉鎮市區": t.鄉鎮市區,
        "交易年月": t.交易年月,
        "社區案名": t.社區案名,
        "建物型態": t.建物型態,
        "格局_房": t.格局_房,
        "格局_廳": t.格局_廳,
        "格局_衛": t.格局_衛,
        "總價_萬元": t.總價_萬元,
        "總價_元": t.總價_元,
        "單價_元每平方": t.單價_元每平方,
        "建物移轉總面積_坪": t.建物移轉總面積_坪,
        "建物型態": t.建物型態,
        "土地區段位置建物區段門牌": t.土地區段位置建物區段門牌,
        "移轉層次": t.移轉層次,
        "總樓層數": t.總樓層數,
        "建築完成年月": t.建築完成年月,
        "有無管理組織": t.有無管理組織,
        "來源檔案": t.來源檔案,
    }