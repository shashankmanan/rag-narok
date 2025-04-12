from dotenv import load_dotenv
from fastapi import FastAPI, Depends
import os
from config import database

app = FastAPI(
    title="Document RAG API",
    description="API for document upload and querying",
    version="0.1.0",
    openapi_url="/api/v1/openapi.json"
)

load_dotenv()
database.Base.metadata.create_all(bind=database.engine)

@app.get("/" , tags=["test"])
def greet():
    return {"method":"hi"}



if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT",5050))
    uvicorn.run(
        "main:app",
        port=port,
        reload=True,  
        reload_dirs=["."], 
        reload_excludes=["*.tmp"]
    )