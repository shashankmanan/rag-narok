# schemas.py
from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel

class ParsedContentBase(BaseModel):
    file_id: int
    user_id: int
    raw_text: Optional[str] = None
    chunks: Optional[List[Dict]] = None
    vectors: Optional[List[List[float]]] = None

class ParsedContentCreate(ParsedContentBase):
    pass

class ParsedContentResponse(ParsedContentBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True  # Pydantic v2 syntax (formerly orm_mode)