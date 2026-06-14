from datetime import datetime
from sqlalchemy import Column, Integer, Text, Float, DateTime, Index
from database import Base


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        Index("idx_district", "district"),
        Index("idx_transaction_date", "transaction_date"),
        Index("idx_community_name", "community_name"),
        Index("idx_building_type", "building_type"),
        Index("idx_total_price", "total_price"),
        Index("idx_unit_price_sqm", "unit_price_sqm"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    district = Column(Text)                  # 鄉鎮市區
    section = Column(Text)                   # 區段
    address = Column(Text)                   # 土地區段位置建物區段門牌
    transaction_type = Column(Text)          # 交易標的
    transaction_date = Column(Text)          # 交易年月 (format: YYYMMDD)
    transaction_units = Column(Text)         # 交易筆棟數
    building_type = Column(Text)             # 建物型態
    building_block = Column(Text)            # 棟別
    main_purpose = Column(Text)              # 主要用途
    main_material = Column(Text)             # 主要建材
    construction_date = Column(Float)        # 建築完成年月
    total_floors = Column(Text)              # 總樓層數
    floor_transfer = Column(Text)            # 移轉層次
    elevator = Column(Text)                  # 電梯
    rooms = Column(Integer)                  # 格局_房
    halls = Column(Integer)                  # 格局_廳
    bathrooms = Column(Integer)              # 格局_衛
    partitions = Column(Text)                # 格局_隔間
    management = Column(Text)                # 有無管理組織
    land_area_sqm = Column(Float)            # 土地移轉總面積_平方
    building_area_sqm = Column(Float)        # 建物移轉總面積_平方
    parking_area_sqm = Column(Float)         # 車位移轉總面積_平方
    land_area_ping = Column(Float)           # 土地移轉總面積_坪
    building_area_ping = Column(Float)       # 建物移轉總面積_坪
    building_area_excl_parking = Column(Float)  # 建物移轉不含車面積_坪
    parking_area_ping = Column(Float)        # 車位移轉總面積_坪
    main_building_area = Column(Float)       # 主建物面積
    auxiliary_building_area = Column(Float)  # 附屬建物面積
    balcony_area = Column(Float)             # 陽台面積
    total_price = Column(Integer)            # 總價_元
    total_price_10k = Column(Float)          # 總價_萬元
    unit_price_sqm = Column(Float)           # 單價_元每平方
    unit_price_ping = Column(Float)          # 建物單價_萬每坪
    parking_price = Column(Integer)          # 車位總價_元
    parking_type = Column(Text)              # 車位類別
    zoning = Column(Text)                    # 使用分區編定
    non_urban_zoning = Column(Text)          # 非都市地使用分區
    non_urban_land_use = Column(Text)        # 非都市土地使用地
    community_name = Column(Text)            # 社區案名
    remarks = Column(Text)                   # 備註
    transfer_id = Column(Text)               # 移轉編號
    source_id = Column(Text)                 # 去重唯一識別碼（移轉編號 or 編號）
    source_file = Column(Text)               # 來源檔案 ('a' 買賣成交 / 'b' 預售屋)
    import_time = Column(DateTime, default=datetime.utcnow)
