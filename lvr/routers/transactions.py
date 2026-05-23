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


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Transaction.id)).scalar() or 0

    by_source = dict(
        db.query(Transaction.來源檔案, func.count(Transaction.id))
        .group_by(Transaction.來源檔案)
        .all()
    )

    by_building_type = dict(
        db.query(Transaction.建物型態, func.count(Transaction.id))
        .filter(Transaction.建物型態.isnot(None))
        .group_by(Transaction.建物型態)
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


async def _import_and_notify(db: Session):
    results = download_and_import(db)
    send_import_notification(results, triggered_by="手動觸發")


@router.post("/import/trigger")
def trigger_import(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    background_tasks.add_task(_import_and_notify, db)
    return {"status": "started"}


def _serialize(t: Transaction) -> dict:
    return {
        "id": t.id,
        "移轉編號": t.移轉編號,
        "鄉鎮市區": t.鄉鎮市區,
        "區段": t.區段,
        "交易標的": t.交易標的,
        "土地區段位置建物區段門牌": t.土地區段位置建物區段門牌,
        "土地移轉總面積_坪": t.土地移轉總面積_坪,
        "使用分區編定": t.使用分區編定,
        "交易年月": t.交易年月,
        "交易筆棟數": t.交易筆棟數,
        "移轉層次": t.移轉層次,
        "總樓層數": t.總樓層數,
        "建物型態": t.建物型態,
        "主要用途": t.主要用途,
        "主要建材": t.主要建材,
        "建築完成年月": t.建築完成年月,
        "格局_房": t.格局_房,
        "格局_廳": t.格局_廳,
        "格局_衛": t.格局_衛,
        "格局_隔間": t.格局_隔間,
        "有無管理組織": t.有無管理組織,
        "總價_元": t.總價_元,
        "總價_萬元": t.總價_萬元,
        "單價_元每平方": t.單價_元每平方,
        "建物單價_萬每坪": t.建物單價_萬每坪,
        "車位類別": t.車位類別,
        "車位移轉總面積_坪": t.車位移轉總面積_坪,
        "車位總價_元": t.車位總價_元,
        "棟別": t.棟別,
        "建物移轉總面積_坪": t.建物移轉總面積_坪,
        "建物移轉不含車面積_坪": t.建物移轉不含車面積_坪,
        "主建物面積": t.主建物面積,
        "附屬建物面積": t.附屬建物面積,
        "陽台面積": t.陽台面積,
        "電梯": t.電梯,
        "社區案名": t.社區案名,
        "備註": t.備註,
        "來源檔案": t.來源檔案,
    }