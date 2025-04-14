"""
Retrieval Augmented Generation (RAG) service module.

This module provides functionality for semantic search and question answering
against previously embedded document content. It implements the RAG pattern
to retrieve relevant document chunks and use them as context for generating answers.
"""
from sqlalchemy.orm import Session
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity 
from typing import List, Tuple 
from models.sqlalchemy.parsed_file import ParsedContent
from models.pydantic.query_model import SourceChunk

# Set embedding model name - this should match the model used for document embedding
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

# Initialize the embeddings model for transforming queries into vector space
embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)

# Try to initialize the language model for answer generation
# Ollama provides a local LLM option, but falls back gracefully if not available
try:
    from langchain_community.chat_models import ChatOllama
    llm = ChatOllama(model="llama3", temperature=0)
    print("Using Ollama LLM.")
except ImportError:
    print("Ollama not found. LLM functionality will require manual setup.")
    llm = None 

# Define the prompt template for RAG
# This instructs the model to answer based only on the provided context
RAG_PROMPT_TEMPLATE = """
CONTEXT:
{context}

QUESTION:
{question}

Answer the question based ONLY on the provided context. If the context doesn't contain the answer, state that you cannot answer based on the provided information. Be concise.
"""

# Create a ChatPromptTemplate from the template string
rag_prompt = ChatPromptTemplate.from_template(RAG_PROMPT_TEMPLATE)

def find_top_k_chunks_manual(query_text: str, stored_chunks: List[str], stored_vectors: List[List[float]], k: int) -> List[SourceChunk]:
    """
    Find the most relevant document chunks for a given query using vector similarity.
    
    This function:
    1. Embeds the query text into a vector
    2. Computes cosine similarity between the query vector and all stored chunk vectors
    3. Returns the top k most similar chunks
    
    Args:
        query_text: The user's natural language query
        stored_chunks: List of document text chunks
        stored_vectors: List of vector embeddings corresponding to chunks
        k: Number of top chunks to retrieve
        
    Returns:
        List of SourceChunk objects containing the most relevant chunks
    """
    if not stored_vectors or not stored_chunks:
        return []

    # Convert query to vector representation
    query_vector = embeddings.embed_query(query_text)
    query_vector_np = np.array(query_vector).reshape(1, -1)
    stored_vectors_np = np.array(stored_vectors)

    # Calculate cosine similarity between query and all chunks
    similarities = cosine_similarity(query_vector_np, stored_vectors_np)[0]

    # Get the top k chunks (handle edge case where k > available chunks)
    effective_k = min(k, len(similarities))
    if effective_k <= 0:
        return []

    # Find indices of top k chunks using numpy's argpartition for efficiency
    # This is faster than sorting the entire array
    top_k_indices_unsorted = np.argpartition(similarities, -effective_k)[-effective_k:]
    top_k_similarities = similarities[top_k_indices_unsorted]
    # Sort the top k by similarity score (highest first)
    top_k_indices_sorted = top_k_indices_unsorted[np.argsort(top_k_similarities)[::-1]]

    # Build result list of SourceChunk objects
    results = []
    for i in top_k_indices_sorted:
         if 0 <= i < len(stored_chunks):
              results.append(SourceChunk(
                   chunk_index=i,
                   text=stored_chunks[i],
              ))
         else:
              print(f"Warning: Invalid index {i} encountered during top-k search.")

    return results

async def process_query(db: Session, user_id: int, file_id: int, query: str, top_k: int) -> tuple[str, List[SourceChunk]]:
    """
    Process a user query against a specific document using RAG.
    
    This function:
    1. Retrieves the parsed document content from the database
    2. Finds the most relevant chunks for the query
    3. Generates an answer using the LLM with the chunks as context
    
    Args:
        db: Database session
        user_id: ID of the user making the query
        file_id: ID of the file to query against
        query: The natural language query
        top_k: Number of relevant chunks to retrieve
        
    Returns:
        Tuple containing (generated_answer, source_chunks)
        
    Raises:
        ValueError: If parsed content is not found or LLM is not available
    """
    # Check if LLM is initialized
    if not llm:
         raise ValueError("LLM not initialized. Cannot process query.")

    # Retrieve parsed content from database
    parsed_data = db.query(ParsedContent).filter(
        ParsedContent.file_id == file_id,
        ParsedContent.user_id == user_id
    ).first()

    # Validate that we found parsed content and it has chunks and vectors
    if not parsed_data:
        raise ValueError(f"Parsed content for file ID {file_id} not found for this user.")
    if not parsed_data.chunks or not parsed_data.vectors:
         raise ValueError(f"File ID {file_id} has not been parsed completely (missing chunks or vectors).")

    # Get stored chunks and vectors
    stored_chunks = parsed_data.chunks
    stored_vectors = parsed_data.vectors 

    # Find the most relevant chunks for the query
    relevant_chunks = find_top_k_chunks_manual(query, stored_chunks, stored_vectors, top_k)

    # If no relevant chunks found, return early with a message
    if not relevant_chunks:
         return "Could not find relevant information in the document to answer the query.", []

    # Combine the relevant chunks into a single context string
    context_text = "\n---\n".join([chunk.text for chunk in relevant_chunks])

    # Create a RAG chain: context + query -> prompt -> LLM -> output parser
    rag_chain = (
        {"context": lambda _: context_text, "question": RunnablePassthrough()}
        | rag_prompt
        | llm
        | StrOutputParser()
    )

    # Execute the chain to generate an answer
    answer = await rag_chain.ainvoke(query) 

    return answer, relevant_chunks