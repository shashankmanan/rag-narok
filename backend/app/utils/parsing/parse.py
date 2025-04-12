from unstructured.partition.auto import partition
from langchain.text_splitter import RecursiveCharacterTextSplitter
from llama_index.core import VectorStoreIndex, Document
from langchain.embeddings import HuggingFaceEmbeddings
import os

def parse_document(file_path: str) -> str:
    """Extract raw text from PDF/PPT/CSV using unstructured.io"""
    elements = partition(filename=file_path)
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
    # Convert chunks to LlamaIndex Document objects
    documents = [Document(text=chunk) for chunk in text_chunks]
    
    # Create LangChain embeddings
    lc_embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    # Create index with embeddings
    index = VectorStoreIndex.from_documents(
        documents,
        embed_model=lc_embeddings  # LlamaIndex now accepts LangChain embeddings directly
    )
    return index

if __name__ == "__main__":
    file_path = "C:/Users/Shashank/Desktop/SHASHANK_RESUME.pdf"  # Replace with your file

    if os.path.exists(file_path):
        # Step 1: Parse
        raw_text = parse_document(file_path)
        print(f"Extracted text length: {len(raw_text)} chars")
        print(raw_text)
        # Step 2: Chunk
        chunks = chunk_text(raw_text)
        print(f"Split into {len(chunks)} chunks")

        # Step 3: Vectorize
        index = create_vector_index(chunks)
        print("Vector index created! Ready for RAG queries.")

    else:
        print(f"File not found: {file_path}")