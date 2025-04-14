"""
Query request and response Pydantic models.

This module defines the data validation models for document query requests
and responses, using Pydantic for runtime type checking and serialization.
"""
from pydantic import BaseModel, Field
from typing import List, Optional

class QueryRequest(BaseModel):
    """
    Model for document query request validation.
    
    Validates and documents the expected format for query requests,
    including the natural language query and retrieval parameters.
    """
    query: str = Field(..., description="The user's natural language query.")
    top_k: int = Field(default=5, description="Number of relevant chunks to retrieve.")
    # Optional: Add chat history for conversational context if needed later
    # chat_history: Optional[List[dict]] = None

class SourceChunk(BaseModel):
    """
    Model representing a retrieved document chunk used as a source for an answer.
    
    Includes the text of the chunk and its index for reference and attribution.
    """
    chunk_index: int = Field(..., description="Index of the chunk in the original document")
    text: str = Field(..., description="Text content of the chunk")
    # Optional: Add similarity score if available
    # score: Optional[float] = None

class QueryResponse(BaseModel):
    """
    Model for document query response validation and serialization.
    
    Defines the structure of query responses, including the generated answer,
    source chunks used to generate the answer, and reference information.
    """
    answer: str = Field(..., description="The generated answer to the query")
    source_chunks: List[SourceChunk] = Field(default=[], description="Chunks of text used to generate the answer")
    file_id: int = Field(..., description="ID of the queried file")
    query: str = Field(..., description="The original query")