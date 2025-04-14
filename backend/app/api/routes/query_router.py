# routers/query_router.py
"""
Query handling routes module.

This module provides API endpoints for querying documents using RAG (Retrieval Augmented Generation).
It handles retrieving document content, finding relevant information, and generating answers to user queries.
"""
from fastapi import APIRouter, Depends, HTTPException, Path, Body
from sqlalchemy.orm import Session

from config.database import get_db
from models.sqlalchemy.users import User 
from models.pydantic.query_model import QueryRequest, QueryResponse
from services.rag_service import process_query 

# Create router with prefix and tag for API documentation
router = APIRouter(
    prefix="/query",
    tags=['query']
)

@router.post("/{owner}/{fileid}", response_model=QueryResponse)
async def handle_document_query(
    owner: str = Path(..., description="Username of the file owner"),
    fileid: int = Path(..., description="ID of the file to query"),
    request_body: QueryRequest = Body(...),
    db: Session = Depends(get_db)
):
    """
    Accepts a user query about a specific document and returns a RAG-generated answer.
    
    This endpoint:
    1. Validates ownership of the document
    2. Processes the query using the RAG service
    3. Returns the generated answer with source chunks
    
    Args:
        owner: Username of the file owner
        fileid: ID of the file to query
        request_body: Query details including question and top_k parameter
        db: Database session dependency
        
    Returns:
        QueryResponse with answer and source chunks
        
    Raises:
        HTTPException: If owner not found, file not found, or processing fails
    """
    # Find user by username
    user = db.query(User).filter(User.username == owner).first()
    if not user:
        raise HTTPException(status_code=404, detail="Owner user not found")
    print(user.id)
    
    try:
        # Process the query using the RAG service
        # This will retrieve relevant chunks and generate an answer
        answer, source_chunks = await process_query(
            db=db,
            user_id=user.id,
            file_id=fileid,
            query=request_body.query,
            top_k=request_body.top_k
        )

        # Return the answer along with source information
        return QueryResponse(
            answer=answer,
            source_chunks=source_chunks,
            file_id=fileid,
            query=request_body.query 
        )

    except ValueError as ve:
        # Handle validation errors (e.g., file not found, not parsed)
        raise HTTPException(status_code=404, detail=str(ve)) 
    except Exception as e:
        # Log error and return generic error message
        print(f"Error processing query for file {fileid}, owner {owner}: {e}") 
        raise HTTPException(status_code=500, detail="An internal error occurred while processing the query.")