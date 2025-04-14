"""
User database model module.

This module defines the SQLAlchemy ORM model for the users table,
which stores user account information for authentication and authorization.
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from config.database import Base  
from sqlalchemy.sql import func

class User(Base):
    """
    User account model for authentication and authorization.
    
    Represents a user in the system who can upload and query documents.
    Contains authentication information and basic user details.
    """
    __tablename__ = "users"
    __table_args__ = {
        'schema': 'public',
        'comment': 'User account information'
    }
    
    # Primary identifier for the user
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # User's full name
    name = Column(String(255), nullable=False)
    
    # Unique username for identification and login (also a primary key)
    username = Column(String(255), unique=True, nullable=False, primary_key=True)
    
    # User's email address for notifications and recovery
    email = Column(String(255), unique=True, nullable=False)
    
    # Hashed password for authentication
    password = Column(String(255), nullable=False)  



