from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from config.database import Base

class Files(Base):
    __tablename__="files"
    __table_args__ = {
        'schema': 'public' ,
    }
    id=Column(Integer,primary_key=True,autoincrement=True)
    name=Column(String(255))
    content_type=Column(String(250))
    s3key=Column(String(500))
    user_id = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
