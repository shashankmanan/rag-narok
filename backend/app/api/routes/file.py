from fastapi import APIRouter,Depends , UploadFile , Path, HTTPException , File
# from backend.app.api.models.pydantic.file_model import FileSchema
from sqlalchemy.orm import Session
from config.database import get_db
from models.sqlalchemy import file as fileschema
from models.pydantic import file_model
from models.sqlalchemy.users import User
from datetime import datetime
from services.s3handler import S3Handler
from models.sqlalchemy.file import Files

router = APIRouter(
    prefix="/file" ,
    tags = ['file']
)

@router.get("/get")
def get_file_details():
    pass

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

@router.get("/get/{owner}")
def get_file_details(owner=Path(),db:Session = Depends(get_db)):
    user = db.query(User).filter(User.username == owner).first()

    user_files = db.query(Files).filter(user.id == Files.user_id).all()

    return {"files":user_files}



