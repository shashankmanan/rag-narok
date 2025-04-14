from unstructured.partition.auto import partition
from langchain.text_splitter import RecursiveCharacterTextSplitter
from llama_index.core import VectorStoreIndex, Document
from langchain.embeddings import HuggingFaceEmbeddings
from fastapi import UploadFile
from io import BytesIO

async def parse_document(file: UploadFile) -> str:
    """Extract raw text directly from file object"""
    file_content = BytesIO(await file.read())
    elements = partition(file=file_content, content_type=file.content_type)
    return "\n".join([str(el) for el in elements])

def chunk_text(text: str) -> list[str]:
    """Split text into chunks for NLP processing"""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=512,
        chunk_overlap=50
    )
    return splitter.split_text(text)

def create_vector_index(text_chunks: list[str]):
    """Generate embeddings and create a searchable index"""
    documents = [Document(text=chunk) for chunk in text_chunks]
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return VectorStoreIndex.from_documents(documents, embed_model=embeddings)

async def parser_main(file: UploadFile) -> dict:
    """Complete processing pipeline with direct file handling"""
    try:
        # Reset file pointer in case of retries
        await file.seek(0)
        
        # Step 1: Parse
        raw_text = await parse_document(file)
        print(f"Extracted {len(raw_text)} characters")
        
        # Step 2: Chunk
        chunks = chunk_text(raw_text)
        print(f"Created {len(chunks)} chunks")
        
        # Step 3: Vectorize
        index = create_vector_index(chunks)
        print("Vector index created")
        
        return {
            "raw_text": raw_text,
            "chunks": chunks,
            "index": index,
            "stats": {
                "char_count": len(raw_text),
                "chunk_count": len(chunks),
                "avg_chunk_size": sum(len(c) for c in chunks)/len(chunks)
            }
        }
        
    except Exception as e:
        print(f"Processing failed: {str(e)}")
        raise
    finally:
        await file.close()