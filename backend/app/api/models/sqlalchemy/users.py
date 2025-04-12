from sqlalchemy import Column, Integer, String, DateTime, Boolean ,ForeignKey
from config.database import Base  
from sqlalchemy.sql import func

class User(Base):
    __tablename__ = "users"
    __table_args__ = {
        'schema': 'public',
        'comment': 'User account information'
    }
    
    id = Column(Integer, primary_key=True, index=True,autoincrement=True)
    name = Column(String(255), nullable=False)
    username = Column(String(255), unique=True, nullable=False,primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)  



