"""
Document parsing and text processing module.

This module provides functionality for extracting text from various document formats,
chunking the text into manageable segments, and preparing it for embedding and retrieval.
It uses the unstructured library for document parsing and the LangChain text splitter 
for chunking text into semantically meaningful segments.
"""
from unstructured.partition.auto import partition
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from fastapi import UploadFile
from io import BytesIO
import logging 

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def parse_document(file_content: bytes, content_type: str) -> str:
    """
    Extract raw text from file bytes using the unstructured library.
    
    This function handles various document formats (PDF, DOCX, TXT, etc.)
    and extracts their textual content for further processing.
    
    Args:
        file_content: Binary content of the uploaded file
        content_type: MIME type of the file (e.g., 'application/pdf')
        
    Returns:
        Extracted text as a string
        
    Raises:
        Exception: If document parsing fails
    """
    logger.info(f"Parsing document with content_type: {content_type}")
    
    try:
        with BytesIO(file_content) as buffer:
            # Use unstructured library to extract elements from the document
            elements = partition(file=buffer, content_type=content_type)
       
        # Join all extracted elements into a single text string
        raw_text = "\n".join([str(el) for el in elements if el is not None])
        logger.info(f"Successfully parsed {len(raw_text)} characters.")
        return raw_text
    except Exception as e:
        logger.error(f"Error during document parsing: {e}", exc_info=True)
        raise 


def chunk_text(text: str) -> list[str]:
    """
    Split text into smaller chunks for more effective embedding and retrieval.
    
    Uses LangChain's RecursiveCharacterTextSplitter to divide text into chunks
    that preserve semantic meaning while staying within size limits optimal
    for embedding models.
    
    Args:
        text: The raw text to be chunked
        
    Returns:
        List of text chunks
    """
    if not text: 
        logger.info("Input text is empty, returning empty list of chunks.")
        return []
    
    logger.info(f"Chunking text of length {len(text)}")
    
    # Configure the text splitter with appropriate chunk size and overlap
    # Chunk size of 512 is chosen to balance context preservation and embedding model limits
    # Overlap of 50 ensures continuity between chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=50,
        length_function=len,
        add_start_index = False
    )
    
    # Split the text into chunks
    chunks = splitter.split_text(text)
    logger.info(f"Created {len(chunks)} chunks.")
    return chunks


# Commented out unused function, preserved for reference or future use
#def create_vector_index(text_chunks: list[str]):
#    """Generate an in-memory vector index (optional, for semantic search)"""
#    if not text_chunks:
#        logger.warning("No text chunks provided for vector index creation.")
#        return None # Or handle as appropriate
#    logger.info("Creating vector index...")
#    documents = [Document(text=chunk) for chunk in text_chunks]
#    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    # VectorStoreIndex is LlamaIndex specific. If only using Langchain, this part might differ.
#    index = VectorStoreIndex.from_documents(documents, embed_model=embeddings)
#    logger.info("Vector index created successfully.")
#    return index


async def parser_main(file: UploadFile) -> dict:
    """
    Complete processing pipeline for parsing, chunking, and embedding document content.
    
    This function orchestrates the full document processing workflow:
    1. Read the uploaded file
    2. Extract text from the document
    3. Chunk the text into smaller segments
    4. Generate vector embeddings for each chunk
    5. Return the processed data
    
    Args:
        file: The uploaded file from FastAPI
        
    Returns:
        Dictionary containing raw text, chunks, vectors, and processing statistics
        
    Raises:
        HTTPException: If processing fails at any stage
    """
    logger.info(f"Starting parser_main for file: {file.filename}, type: {file.content_type}")
    try:
        # Step 1: Read file content
        file_content = await file.read()
        logger.info(f"Read {len(file_content)} bytes from uploaded file.")

        if not file_content:
            logger.warning("Uploaded file content is empty.")
            
            return {
                "raw_text": "",
                "chunks": [],
                "vectors": [],
                "index": None, 
                "stats": {
                    "char_count": 0,
                    "chunk_count": 0,
                    "avg_chunk_size": 0
                }
            }

        # Step 2: Extract text from document
        raw_text = await parse_document(file_content, file.content_type)
        logger.info(f"Extracted {len(raw_text)} characters")

        # Step 3: Split text into chunks
        chunks = chunk_text(raw_text)
        logger.info(f"Created {len(chunks)} chunks")

        # Step 4: Generate vector embeddings for each chunk
        vectors = []
        if chunks: 
             # Use HuggingFace embedding model to generate vector representations
             embedder = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
             vectors = embedder.embed_documents(chunks)  # List[List[float]]
             logger.info(f"Generated {len(vectors)} vectors.")
        else:
             logger.info("No chunks generated, skipping vector embedding.")

        # Step 5: Return processed data with statistics
        index = None 

        return {
            "raw_text": raw_text,
            "chunks": chunks,
            "vectors": vectors,
            "stats": {
                "char_count": len(raw_text),
                "chunk_count": len(chunks),
                "avg_chunk_size": sum(len(c) for c in chunks) / len(chunks) if chunks else 0
            }
        }

    except Exception as e:
        logger.error(f"Processing failed in parser_main for file {file.filename}: {str(e)}", exc_info=True)
        
        # Rethrow as HTTPException to be caught by FastAPI's exception handlers
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
  