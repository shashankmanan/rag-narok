from models.pydantic.users import UserCreate, UserLogin
from auth.jwt_handler import signJWT
from models.sqlalchemy import users
from passlib.context import CryptContext
from fastapi import HTTPException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def register_user(user_data:UserCreate, db):
    # Check if user exists
    existing_user = db.query(users.User).filter(
        (users.User.username == user_data.username) | 
        (users.User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    # Create new user
    new_user = users.User(
        name=user_data.name,
        username=user_data.username,
        email=user_data.email,
        password=hash_password(user_data.password) 
    )
    
    db.add(new_user)

    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully", "user_id": new_user.id}

def login_user(login_data:UserLogin, db):
    
    user = db.query(users.User).filter(
        users.User.username == login_data.username
    ).first()
    
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = signJWT(user.username)

    return {
        "message": "Login successful",
        "access_token": token,
        "username": user.username ,
       
    }

def logout_user(session_id: int, db):  
    return {"message": "Logged out"}