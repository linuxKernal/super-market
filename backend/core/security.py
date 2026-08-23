from datetime import datetime, timezone, timedelta
import jwt
from ..core.config import settings
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()

def create_jwt_token(data: dict, expires_delta: timedelta = None):
    print("settings.JWT_SECRET_KEY", settings.JWT_SECRET_KEY)
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def extract_jwt_token(token: str):
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])


def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)

def get_password_hash(password):
    return password_hash.hash(password)