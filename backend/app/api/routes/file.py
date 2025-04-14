from fastapi import APIRouter, Depends, UploadFile, Path, HTTPException, File
from sqlalchemy.orm import Session
from config.database import get_db
# Assuming 'fileschema' is an alias for 'models.sqlalchemy.file' but the model class is 'Files'
# Renaming for clarity if needed, but using 'Files' as per the code.
from models.sqlalchemy.file import Files # Use the actual model class name
from models.pydantic import file_model # Not used in provided snippets, maybe needed elsewhere
from models.sqlalchemy.users import User
from models.sqlalchemy.parsed_file import ParsedContent
from models.pydantic.parsed_file import ParsedContentCreate, ParsedContentResponse # Not used directly here, ParsedContent model is used
from datetime import datetime
from services.s3handler import S3Handler
# Import the necessary functions from parse.py
from services.parse import parse_document, chunk_text # Import individual functions
from langchain.embeddings import HuggingFaceEmbeddings 

router = APIRouter(
    prefix="/file",
    tags=['file']
)

@router.post("/upload/{owner}")
async def upload_file(
    owner: str = Path(..., description="Owner of the file"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    # Fetch the user
    user = db.query(User).filter(User.username == owner).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Upload file to S3
    s3_handler = S3Handler()
    s3_key = s3_handler.upload_file_to_s3(file, user.id)

    # Step 1: Save file metadata
    new_file = Files(
        name=file.filename,
        content_type=file.content_type,
        s3key=s3_key,
        user_id=user.id
    )
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    '''
    # Step 2: Parse file
    processed = await parser_main(file)

    # Step 3: Store parsed content in DB
    parsed_content = ParsedContent(
        file_id=new_file.id,
        user_id=user.id,
        raw_text=processed["raw_text"],
        chunks=processed["chunks"],
        vectors=processed["vectors"]
    )
    db.add(parsed_content)
    db.commit()
    '''
    return {
        "message": "File uploaded and parsed successfully",
        "file": {
            "id": new_file.id,
            "name": new_file.name,
            "user_id": new_file.user_id,
            "content_type": new_file.content_type,
        }
    }


@router.get("/get-all/{owner}")
def get_file_details(
    owner: str = Path(..., description="Owner username"),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == owner).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_files = db.query(Files).filter(Files.user_id == user.id).all()

    files_data = [{
        "id": file.id,
        "filename": file.name,
        "file_type": file.content_type,
        "created_at": file.created_at.isoformat() if file.created_at else None
    } for file in user_files]

    return {"files": files_data}


@router.get("/parse/{owner}/{fileid}")
async def parse_file(
    owner: str = Path(..., description="Owner username"),
    fileid: int = Path(..., description="ID of the file to parse"),
    db: Session = Depends(get_db)
):
    # Fetch the user
    user = db.query(User).filter(User.username == owner).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch the file metadata, ensuring it belongs to the user
    file_metadata = db.query(Files).filter(Files.id == fileid, Files.user_id == user.id).first()
    if not file_metadata:
        raise HTTPException(status_code=404, detail=f"File with ID {fileid} not found for user {owner}")

    # Optional: Check if the file has already been parsed
    existing_parse = db.query(ParsedContent).filter(ParsedContent.file_id == fileid).first()
    if existing_parse:
        # Decide behavior: return existing, allow re-parse, or raise error?
        # Option 1: Return indication it's already parsed
        parsed_data = db.query(ParsedContent).filter(
            ParsedContent.file_id == fileid,
            ParsedContent.user_id == user.id  # Ensure user owns the parsed content
        ).first()
        return {
        "file_id": parsed_data.file_id,
        "user_id": parsed_data.user_id,
        "raw_text": parsed_data.raw_text,
        "chunks": parsed_data.chunks,
        
        "parsed_at": parsed_data.created_at 
        }
        # Option 2: Raise conflict error
        # raise HTTPException(status_code=409, detail=f"File ID {fileid} has already been parsed.")
        # Option 3: Delete existing and re-parse (continue execution)
        # db.delete(existing_parse)
        # db.commit()

    # Download file content from S3
    s3_handler = S3Handler()
    try:
        file_content = s3_handler.download_file_from_s3(file_metadata.s3key)
    except HTTPException as e:
        # Re-raise S3 specific errors (like 404 Not Found, 500 Download Error)
        raise e
    except Exception as e:
        # Catch unexpected errors during download attempt
        raise HTTPException(status_code=500, detail=f"Unexpected error downloading file from S3: {str(e)}")

    # Check if file content is empty (possible for 0-byte files)
    if not file_content:
         # Decide behavior: store empty parsed content or raise error?
         # Storing empty might be valid for tracking purposes
         # Or raise an error:
         # raise HTTPException(status_code=400, detail="File content is empty, cannot parse.")
         # Let's store empty content for now:
         raw_text = ""
         chunks = []
         vectors = []
    else:
        # Parse the downloaded content
        try:
            # Step 1: Parse raw text using the function from parse.py
            raw_text = await parse_document(file_content, file_metadata.content_type)

            # Step 2: Chunk text
            chunks = chunk_text(raw_text) # Returns List[str]

            # Step 3: Generate embeddings/vectors
            # Avoid re-initializing the model on every call if possible (consider dependency injection or caching)
            # For simplicity here, we initialize it directly.
            embedder = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
            vectors = embedder.embed_documents(chunks) # Returns List[List[float]]

        except Exception as e:
            # Catch errors during parsing/chunking/embedding
            # Log the error for debugging: print(f"Parsing error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to process file content: {str(e)}")

    # Store parsed content in DB
    # Ensure the ParsedContent model schema matches the data types:
    # - raw_text: String/Text
    # - chunks: JSON, JSONB, or Array of strings
    # - vectors: JSON, JSONB, or specific vector type (like pgvector)
    parsed_content = ParsedContent(
        file_id=file_metadata.id,
        user_id=user.id,
        raw_text=raw_text,
        chunks=chunks,     # Store the list of chunk strings
        vectors=vectors    # Store the list of vector embeddings
    )
    try:
        db.add(parsed_content)
        db.commit()
        db.refresh(parsed_content)
    except Exception as e:
        db.rollback() # Rollback transaction on error
        # Log the error: print(f"DB save error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save parsed content to database: {str(e)}")

    return {
        "file_id": parsed_content.file_id,
        "user_id": parsed_content.user_id,
        "raw_text": parsed_content.raw_text,
        "chunks": parsed_content.chunks,
        "parsed_at": parsed_content.created_at
    }



