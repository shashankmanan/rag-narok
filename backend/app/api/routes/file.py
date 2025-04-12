from fastapi import APIRouter,Depends
# from backend.app.api.models.pydantic.file_model import FileSchema
from sqlalchemy.orm import Session
from config.database import get_db
from models.sqlalchemy import file

router = APIRouter(
    prefix="/file" ,
    tags = ['file']
)

@router.get("/get")
def get_file_details():
    pass

@router.post("/upload")
def upload_file():
    pass

@router.get("/get/all")
def get_file_details(db:Session = Depends(get_db)):
    print("getting all files")
    files = db.query(file.Files).all()
    return {"files":files}