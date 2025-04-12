from pydantic import BaseModel,Field

class FileSchema(BaseModel):
    id : int = Field(default=None)
    name: str = Field(default=None)
    s3_key : str = Field(default=None)
    ownerid : str = Field(default=None)
    