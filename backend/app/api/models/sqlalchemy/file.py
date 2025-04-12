from config.database import Base
from sqlalchemy import Column,Integer,String

class Files(Base):
    __tablename__="files"
    __table_args__ = {
        'schema': 'public' ,
    }
    id=Column(Integer,primary_key=True)
    name=Column(String(255))
    s3key=Column(String(500))
    owner=Column(String(255))