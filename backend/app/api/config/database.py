"""
Database configuration module for the Document RAG API.

This module provides database connection setup, session management,
and the SQLAlchemy base class for ORM models. It handles PostgreSQL
connection using environment variables for configuration.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import dotenv

# Load environment variables from .env file
dotenv.load_dotenv()

# Get database URL from environment variables
DB_URL = os.getenv("DATABASE_URL")

# Create SQLAlchemy engine with the configured database URL
# This engine serves as the primary interface to the database
engine = create_engine(DB_URL)

# Create a sessionmaker factory configured with our engine
# autocommit=False: Transactions need to be explicitly committed
SessionLocal = sessionmaker(autocommit=False, bind=engine)

# Create base class for declarative models
# All ORM models will inherit from this base class
Base = declarative_base()

def get_db():
    """
    Database session dependency for FastAPI endpoints.
    
    Creates a new database session for each request and ensures it's closed
    when the request is complete, even if exceptions occur.
    
    Yields:
        SQLAlchemy session object
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        # Always ensure the session is closed to prevent connection leaks
        db.close()