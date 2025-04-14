"""
Main application entry point for the Document RAG API.

This module initializes the FastAPI application, configures middleware,
registers API routers, and sets up error handling. It also provides the
entry point for running the application with uvicorn.
"""
from dotenv import load_dotenv
from fastapi import FastAPI, Depends,Request
from fastapi.middleware.cors import CORSMiddleware
from config import database
from routes import test,file,user,query_router
import os
from sqlalchemy import inspect
from fastapi.responses import JSONResponse

# Initialize FastAPI with API metadata
app = FastAPI(
    title="Document RAG API",
    description="API for document upload and querying",
    version="0.1.0",
    openapi_url="/api/v1/openapi.json"
)

def init_db():
    """
    Initialize the database by creating all tables defined in SQLAlchemy models.
    This ensures the database schema is created before the application starts.
    """
    database.Base.metadata.create_all(bind=database.engine)
    inspector = inspect(database.engine)
    print("tables are: ",inspector.get_table_names())

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for catching and formatting all uncaught exceptions.
    Returns a consistent JSON response format for all errors.
    
    Args:
        request: The incoming request that caused the exception
        exc: The exception that was raised
        
    Returns:
        JSONResponse with error details and 500 status code
    """
    return JSONResponse(
        status_code=500,
        content={
            "error": getattr(exc, "detail", "An unexpected error occurred."),
            "details": str(exc)

        }
    )

# Configure CORS to allow cross-origin requests
# This is important for the frontend to communicate with the API
app.add_middleware(CORSMiddleware,
        allow_origins=['*'],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*']
    )

# Register API routers for different functionality areas
app.include_router(test.router)
app.include_router(file.router)
app.include_router(user.router)
app.include_router(query_router.router)


# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Get port from environment variable or use default
    port = int(os.getenv("PORT",5050))
    # Initialize database tables
    init_db()
    print("db succesfully updated")
    # Start the uvicorn server with hot reload enabled for development
    uvicorn.run(
        "main:app",
        port=port,
        reload=True,  # Enable hot reload for development
        reload_dirs=["."], # Watch the current directory for changes
        reload_excludes=["*.tmp"] # Exclude temporary files
    )