from fastapi import APIRouter,Depends
# from backend.app.api.models.pydantic.file_model import FileSchema
from sqlalchemy.orm import Session
from config.database import get_db
from models.sqlalchemy import file
from models.pydantic import file_model

router = APIRouter(
    prefix="/file" ,
    tags = ['file']
)

@router.get("/get")
def get_file_details():
    pass

@router.post("/upload")
def upload_file(_post: file_model.PostFile,db:Session = Depends(get_db)):
    new_file = file.Files(
        name=_post.name,
        s3key=_post.s3_key,
        owner=_post.owner
    )
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    return {"message" : "added","file":new_file}

@router.get("/get/all")
def get_file_details(db:Session = Depends(get_db)):
    print("getting all files")
    files = db.query(file.Files).all()
    return {"files":files}