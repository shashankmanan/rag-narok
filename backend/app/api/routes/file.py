"""
File handling routes module.

This module provides API endpoints for uploading, listing, and processing files.
It handles file uploads to S3, metadata storage in the database, and document parsing.
"""
from fastapi import APIRouter, Depends, UploadFile, Path, HTTPException, File
from sqlalchemy.orm import Session
from config.database import get_db
from models.sqlalchemy.file import Files 
from models.pydantic import file_model 
from models.sqlalchemy.users import User
from models.sqlalchemy.parsed_file import ParsedContent
from models.pydantic.parsed_file import ParsedContentCreate, ParsedContentResponse 
from datetime import datetime
from services.s3handler import S3Handler
from services.parse import parse_document, chunk_text 
from langchain.embeddings import HuggingFaceEmbeddings 

# Create router with prefix and tag for API documentation
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
    """
    Upload a file to the system.
    
    This endpoint:
    1. Validates the file and owner
    2. Uploads the file to S3
    3. Stores file metadata in the database
    
    Args:
        owner: Username of the file owner
        file: The file to upload
        db: Database session dependency
    
    Returns:
        JSON response with file metadata
        
    Raises:
        HTTPException: If file is missing, user not found, or upload fails
    """
    # Validate that file is provided
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    # Find user by username
    user = db.query(User).filter(User.username == owner).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Upload file to S3
    s3_handler = S3Handler()
    s3_key = s3_handler.upload_file_to_s3(file, user.id)

    # Create file metadata record in database
    new_file = Files(
        name=file.filename,
        content_type=file.content_type,
        s3key=s3_key,
        user_id=user.id
    )
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    
    # Commented out code for immediate parsing
    # This functionality is moved to a separate endpoint for better separation of concerns
    '''
   
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
    
    # Return success response with file metadata
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
    """
    Get all files for a specific user.
    
    Retrieves a list of all files uploaded by the specified user,
    including metadata like filename, type, and creation time.
    
    Args:
        owner: Username of the file owner
        db: Database session dependency
        
    Returns:
        JSON response with array of file metadata objects
        
    Raises:
        HTTPException: If user not found
    """
    # Find user by username
    user = db.query(User).filter(User.username == owner).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Query all files for this user
    user_files = db.query(Files).filter(Files.user_id == user.id).all()

    # Format response with required file metadata
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
    """
    Parse a specific file to extract text, generate chunks, and create embeddings.
    
    This endpoint:
    1. Validates file ownership
    2. Checks if file is already parsed
    3. If not, downloads from S3 and performs parsing
    4. Stores parsed content in the database
    
    Args:
        owner: Username of the file owner
        fileid: ID of the file to parse
        db: Database session dependency
        
    Returns:
        JSON response with parsed content information
        
    Raises:
        HTTPException: If user or file not found, or parsing fails
    """
    # Find user by username
    user = db.query(User).filter(User.username == owner).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Find file by ID and verify ownership
    file_metadata = db.query(Files).filter(Files.id == fileid, Files.user_id == user.id).first()
    if not file_metadata:
        raise HTTPException(status_code=404, detail=f"File with ID {fileid} not found for user {owner}")

    # Check if file is already parsed
    existing_parse = db.query(ParsedContent).filter(ParsedContent.file_id == fileid).first()
    if existing_parse:
        # Return existing parsed content
        parsed_data = db.query(ParsedContent).filter(
            ParsedContent.file_id == fileid,
            ParsedContent.user_id == user.id  
        ).first()
        return {
        "file_id": parsed_data.file_id,
        "user_id": parsed_data.user_id,
        "raw_text": parsed_data.raw_text,
        "chunks": parsed_data.chunks,
        
        "parsed_at": parsed_data.created_at 
        }

    # File not yet parsed, download from S3
    s3_handler = S3Handler()
    try:
        file_content = s3_handler.download_file_from_s3(file_metadata.s3key)
    except HTTPException as e:
        # Pass through HTTPExceptions from S3Handler
        raise e
    except Exception as e:
        # Convert other exceptions to HTTPException
        raise HTTPException(status_code=500, detail=f"Unexpected error downloading file from S3: {str(e)}")

    # Handle empty file case
    if not file_content:
        raw_text = ""
        chunks = []
        vectors = []
    else:
        # Process the file content
        try:
            # Extract text from document
            raw_text = await parse_document(file_content, file_metadata.content_type)
            
            # Split text into chunks
            chunks = chunk_text(raw_text) # List[str]

            # Generate embeddings for chunks
            embedder = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
            vectors = embedder.embed_documents(chunks) # Returns List[List[float]]

        except Exception as e:
            # Handle parsing errors
            raise HTTPException(status_code=500, detail=f"Failed to process file content: {str(e)}")

    # Store parsed content in database
    parsed_content = ParsedContent(
        file_id=file_metadata.id,
        user_id=user.id,
        raw_text=raw_text,
        chunks=chunks,     
        vectors=vectors    
    )
    try:
        db.add(parsed_content)
        db.commit()
        db.refresh(parsed_content)
    except Exception as e:
        db.rollback() 
        # Handle database errors
        raise HTTPException(status_code=500, detail=f"Failed to save parsed content to database: {str(e)}")

    # Return parsed content information
    return {
        "file_id": parsed_content.file_id,
        "user_id": parsed_content.user_id,
        "raw_text": parsed_content.raw_text,
        "chunks": parsed_content.chunks,
        "parsed_at": parsed_content.created_at
    }



