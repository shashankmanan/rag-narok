# models.py
from sqlalchemy import Column, Integer, Text, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class ParsedContent(Base):
    __tablename__ = "parsed_content"
    
    id = Column(Integer, primary_key=True)
    file_id = Column(Integer, ForeignKey("files.id"), unique=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    raw_text = Column(Text)
    chunks = Column(JSON)  # Stores list of text chunks
    vectors = Column(JSON) # Stores embeddings if not using pgvector
    created_at = Column(DateTime(timezone=True), server_default=func.now())