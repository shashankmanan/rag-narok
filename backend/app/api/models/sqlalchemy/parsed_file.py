"""
Parsed document content database model module.

This module defines the SQLAlchemy ORM model for the parsed_content table,
which stores extracted text, chunks, and vector embeddings from documents.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, LargeBinary
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import ARRAY, FLOAT
from config.database import Base

class ParsedContent(Base):
    """
    ParsedContent model for storing processed document information.
    
    Stores the results of document parsing including:
    - Raw extracted text
    - Text chunks for retrieval
    - Vector embeddings for semantic search
    
    This data is used for RAG-based document querying.
    """
    __tablename__ = "parsed_content"
    __table_args__ = {
        'schema': 'public',
        'comment': 'Processed document content for RAG'
    }
    
    # File ID this content belongs to (primary key)
    file_id = Column(Integer, ForeignKey("public.files.id"), primary_key=True)
    
    # User who owns this content (for access control)
    user_id = Column(Integer, ForeignKey("public.users.id"), nullable=False)
    
    # Complete extracted text from the document
    raw_text = Column(String, nullable=True)
    
    # Array of text chunks for retrieval
    chunks = Column(JSON, nullable=True)
    
    # Vector embeddings for semantic search (stored as JSON array of arrays)
    vectors = Column(JSON, nullable=True)
    
    # Timestamp when the content was parsed
    created_at = Column(DateTime(timezone=True), server_default=func.now())