from fastapi import APIRouter

router = APIRouter(
    prefix="/test" ,
    tags = ['test']
)

@router.get("/")
def test():
    return {"message" : "works" , "status_code" : 200 , "status" : "clean"}

