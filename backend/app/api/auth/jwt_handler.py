import time
import jwt
from decouple import config

jwt_secret = config("JWT_SECRET")
jwt_algorithm = config("JWT_ALGORITHM")


def token_response(token: str):
    return {
        "access_token": token
    }

def signJWT(userID: str):
    payload = {
        "userID": userID,
        "exp": int(time.time()) + 1800
    }
    token = jwt.encode(payload, jwt_secret, algorithm=jwt_algorithm)
    return token_response(token)

def decodeJWT(token: str):
    try:
        decode_token = jwt.decode(token, jwt_secret, algorithms=[jwt_algorithm])
        return decode_token
    except Exception:
        return None