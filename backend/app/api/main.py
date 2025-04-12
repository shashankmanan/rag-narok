from dotenv import load_dotenv
from fastapi import FastAPI, Depends,Request
from fastapi.middleware.cors import CORSMiddleware
from config import database
from routes import test,file,user
import os
from sqlalchemy import inspect
from fastapi.responses import JSONResponse

app = FastAPI(
    title="Document RAG API",
    description="API for document upload and querying",
    version="0.1.0",
    openapi_url="/api/v1/openapi.json"
)

def init_db():
    database.Base.metadata.create_all(bind=database.engine)
    inspector = inspect(database.engine)
    print("tables are: ",inspector.get_table_names())

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": getattr(exc, "detail", "An unexpected error occurred."),
            "details": str(exc)

        }
    )

app.add_middleware(CORSMiddleware,
        allow_origins=['*'],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*']
    )

app.include_router(test.router)
app.include_router(file.router)
app.include_router(user.router)

@app.get("/" , tags=["test"])
def greet():
    return {"method":"hi"}



if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT",5050))
    init_db()
    print("db succesfully updated")
    uvicorn.run(
        "main:app",
        port=port,
        reload=True,  
        reload_dirs=["."], 
        reload_excludes=["*.tmp"]
    )