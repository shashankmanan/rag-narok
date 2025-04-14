from fastapi import APIRouter,Depends , UploadFile , Path, HTTPException , File
# from backend.app.api.models.pydantic.file_model import FileSchema
from sqlalchemy.orm import Session
from config.database import get_db
from models.sqlalchemy import file as fileschema
from models.pydantic import file_model
from models.sqlalchemy.users import User
from models.sqlalchemy.parsed_file import ParsedContent
from models.pydantic.parsed_file import ParsedContentCreate, ParsedContentResponse
from datetime import datetime
from services.s3handler import S3Handler
from models.sqlalchemy.file import Files
from ai.parsing.parse import parser_main

router = APIRouter(
    prefix="/file" ,
    tags = ['file']
)

async def parse():
    processed = await parser_main(file)
        
        # 4. Store parsed content
    parsed_content = ParsedContent(
        file_id=new_file.id,
        user_id=user.id,
        raw_text=processed["raw_text"],
        chunks=[{"text": chunk, "index": i} for i, chunk in enumerate(processed["chunks"])],
        vectors=processed.get("embeddings")  # Optional if using pgvector
    )
    db.add(parsed_content)
    db.commit()


@router.post("/upload/{owner}")
async def upload_file(owner: str = Path(..., description="Owner of the file"),file: UploadFile = File(None),db:Session = Depends(get_db)):
    print(owner)

    if not file:
        raise HTTPException(
            status_code = 400 ,
            detail="No File found"
        )

    user = db.query(User).filter(User.username == owner).first()
    
    s3_handler = S3Handler()
    s3_key = s3_handler.upload_file_to_s3(file,user.id)

    parse()

    new_file = fileschema.Files(
        name=file.filename,
        content_type=file.content_type ,
        s3key=s3_key,
        user_id=user.id ,
    )
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    return {
        "message": "File uploaded successfully",
        "file": {
            "id": new_file.id,
            "name": new_file.name,
            "user_id": new_file.user_id,
            "content_type": new_file.content_type ,
        }
    }

@router.get("/get-all/{owner}")
def get_file_details(
    owner: str = Path(..., description="Owner username"),
    db: Session = Depends(get_db)
):
    print("ok")
    print(owner)
    # Check if user exists
    user = db.query(User).filter(User.username == owner).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's files
    user_files = db.query(Files).filter(Files.user_id == user.id).all()
    
    # Convert SQLAlchemy objects to dictionaries
    files_data = [{
        "id": file.id,
        "filename": file.name,
        "file_type": file.content_type,
        "created_at": file.created_at.isoformat() if file.created_at else None
        # Add other fields as needed
    } for file in user_files]
    
    return {"files": files_data}



