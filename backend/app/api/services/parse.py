# parse.py
from unstructured.partition.auto import partition
from langchain.text_splitter import RecursiveCharacterTextSplitter
# LlamaIndex VectorStoreIndex might not be needed if just storing vectors
# from llama_index.core import VectorStoreIndex, Document
from langchain.embeddings import HuggingFaceEmbeddings
from fastapi import UploadFile
from io import BytesIO
import logging # Optional: Add logging for better debugging

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Step 1: Parse the file's content from bytes directly
async def parse_document(file_content: bytes, content_type: str) -> str:
    """Extract raw text from file bytes"""
    logger.info(f"Parsing document with content_type: {content_type}")
    # Using BytesIO to mimic file object from byte content
    try:
        with BytesIO(file_content) as buffer:
            # Pass content_type to help unstructured choose the right parser
            elements = partition(file=buffer, content_type=content_type)
        # Ensure elements are converted to string; handle potential non-string elements if any
        raw_text = "\n".join([str(el) for el in elements if el is not None])
        logger.info(f"Successfully parsed {len(raw_text)} characters.")
        return raw_text
    except Exception as e:
        logger.error(f"Error during document parsing: {e}", exc_info=True)
        raise # Re-raise the exception to be handled by the caller

# Step 2: Split the text into chunks
def chunk_text(text: str) -> list[str]:
    """Split text into chunks for NLP processing"""
    if not text: # Handle empty input text
        logger.info("Input text is empty, returning empty list of chunks.")
        return []
    logger.info(f"Chunking text of length {len(text)}")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=50,
        length_function=len, # Explicitly use len
        add_start_index = False # Often not needed unless tracking source positions
    )
    chunks = splitter.split_text(text)
    logger.info(f"Created {len(chunks)} chunks.")
    return chunks

# Step 3: Create an in-memory vector index (Now primarily used in parser_main)
# Kept for reference or potential future use
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

# Step 4: Complete processing pipeline for UPLOAD scenario: parse → chunk → embed
async def parser_main(file: UploadFile) -> dict:
    """Complete processing pipeline for parsing, chunking, and embedding from UploadFile"""
    logger.info(f"Starting parser_main for file: {file.filename}, type: {file.content_type}")
    try:
        # Read ALL content FIRST and convert to bytes
        file_content = await file.read()
        logger.info(f"Read {len(file_content)} bytes from uploaded file.")

        if not file_content:
            logger.warning("Uploaded file content is empty.")
            # Return structure consistent with success but with empty/zero values
            return {
                "raw_text": "",
                "chunks": [],
                "vectors": [],
                "index": None, # Or appropriate representation for no index
                "stats": {
                    "char_count": 0,
                    "chunk_count": 0,
                    "avg_chunk_size": 0
                }
            }

        # Step 1: Parse raw text (pass bytes directly)
        raw_text = await parse_document(file_content, file.content_type)
        logger.info(f"Extracted {len(raw_text)} characters")

        # Step 2: Chunk text
        chunks = chunk_text(raw_text)
        logger.info(f"Created {len(chunks)} chunks")

        # Step 3: Generate embeddings
        vectors = []
        if chunks: # Only generate embeddings if there are chunks
             embedder = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
             vectors = embedder.embed_documents(chunks)  # List[List[float]]
             logger.info(f"Generated {len(vectors)} vectors.")
        else:
             logger.info("No chunks generated, skipping vector embedding.")


        # Optional: create in-memory vector index for search (might be resource-intensive)
        # index = create_vector_index(chunks) if chunks else None
        # if index:
        #    logger.info("In-memory vector index created (not returned by default).")
        index = None # Keep it simple for now unless index is needed in the response

        return {
            "raw_text": raw_text,
            # Return chunks as simple list of strings, as expected by DB usually
            "chunks": chunks,
            "vectors": vectors,
            # "index": index, # Typically don't return large index objects in API responses
            "stats": {
                "char_count": len(raw_text),
                "chunk_count": len(chunks),
                "avg_chunk_size": sum(len(c) for c in chunks) / len(chunks) if chunks else 0
            }
        }

    except Exception as e:
        logger.error(f"Processing failed in parser_main for file {file.filename}: {str(e)}", exc_info=True)
        # Re-raise the exception to be caught by FastAPI error handling
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
    # finally:
        # FastAPI handles closing the UploadFile automatically when the request context ends.
        # No explicit close needed here for file.