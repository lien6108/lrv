from datetime import datetime
from sqlalchemy import Column, Integer, Text, Float, DateTime, Index
from database import Base


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        Index("idx_district", "鄉鎮市區"),
        Index("idx_year_month", "交易年月"),
        Index("idx_community", "社區案名"),
        Index("idx_building_type", "建物型態"),
        Index("idx_total_price", "總價_元"),
        Index("idx_unit_price", "單價_元每平方"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    移轉編號 = Column(Text, unique=True, nullable=True)
    鄉鎮市區 = Column(Text)
    區段 = Column(Text)
    交易標的 = Column(Text)
    土地區段位置建物區段門牌 = Column(Text)
    土地移轉總面積_平方 = Column(Float)
    使用分區編定 = Column(Text)
    非都市地使用分區 = Column(Text)
    非都市土地使用地 = Column(Text)
    交易年月 = Column(Text)
    交易筆棟數 = Column(Text)
    移轉層次 = Column(Text)
    總樓層數 = Column(Text)
    建物型態 = Column(Text)
    主要用途 = Column(Text)
    主要建材 = Column(Text)
    建築完成年月 = Column(Text)
    建物移轉總面積_平方 = Column(Float)
    格局_房 = Column(Integer)
    格局_廳 = Column(Integer)
    格局_衛 = Column(Integer)
    格局_隔間 = Column(Text)
    有無管理組織 = Column(Text)
    總價_元 = Column(Integer)
    單價_元每平方 = Column(Float)
    車位類別 = Column(Text)
    車位移轉總面積_平方 = Column(Float)
    車位總價_元 = Column(Integer)
    棟別 = Column(Text)
    總價_萬元 = Column(Float)
    土地移轉總面積_坪 = Column(Float)
    建物移轉總面積_坪 = Column(Float)
    建物移轉不含車面積_坪 = Column(Float)
    建物單價_萬每坪 = Column(Float)
    車位移轉總面積_坪 = Column(Float)
    社區案名 = Column(Text)
    備註 = Column(Text)
    編號 = Column(Text)
    主建物面積 = Column(Float)
    附屬建物面積 = Column(Float)
    陽台面積 = Column(Float)
    電梯 = Column(Text)
    來源檔案 = Column(Text)
    匯入時間 = Column(DateTime, default=datetime.utcnow)
