"""
File metadata database model module.

This module defines the SQLAlchemy ORM model for the files table,
which stores metadata about uploaded documents including storage location.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from config.database import Base

class Files(Base):
    """
    File metadata model for tracking uploaded documents.
    
    Stores metadata about files uploaded to the system, including
    their storage location in S3, content type, and ownership information.
    """
    __tablename__ = "files"
    __table_args__ = {
        'schema': 'public',
        'comment': 'Uploaded file metadata'
    }
    
    # Primary identifier for the file
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Original filename of the uploaded document
    name = Column(String(255), nullable=False)
    
    # MIME type of the file (e.g., application/pdf)
    content_type = Column(String(100), nullable=False)
    
    # S3 object key/path where the file is stored
    s3key = Column(String(512), unique=True, nullable=False)
    
    # References the user who owns this file
    user_id = Column(Integer, ForeignKey("public.users.id"), nullable=False)
    
    # Timestamp when the file was uploaded
    created_at = Column(DateTime(timezone=True), server_default=func.now())
