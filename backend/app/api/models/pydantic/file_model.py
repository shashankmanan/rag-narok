from pydantic import BaseModel,Field
from datetime import datetime

class FileBase(BaseModel):
    name: str = Field(default=None)
    content_type: str = Field(default=None)
    s3_key : str = Field(default=None)
    user_id:int = Field(default=None)
    created_at: datetime | None = Field(default=None)

    class Config:
        orm_mode = True

class PostFile(FileBase):
    class Config:
        orm_mode = True
    