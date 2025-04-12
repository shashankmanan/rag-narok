from pydantic import BaseModel,Field

class FileBase(BaseModel):
    name: str = Field(default=None)
    s3_key : str = Field(default=None)
    owner : str = Field(default=None)
    class Config:
        orm_mode = True

class PostFile(FileBase):
    class Config:
        orm_mode = True
    