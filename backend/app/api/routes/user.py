from fastapi import APIRouter,Depends
from models.pydantic.users import UserCreate,UserLogin
from config.database import get_db
from sqlalchemy.orm import Session
from services.auth import login_user,register_user

router = APIRouter(
    prefix="/user" ,
    tags = ['user']
)

@router.post("/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    return register_user(user_data, db)

@router.post("/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    return login_user(login_data, db)


router.get("/logout")
def logout():
    pass