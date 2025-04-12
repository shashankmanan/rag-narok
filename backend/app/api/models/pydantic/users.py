from pydantic import BaseModel,Field,EmailStr

class UserCreate(BaseModel):
    name: str
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    username: str
    password: str

