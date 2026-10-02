from typing import Annotated
import logging
from datetime import timedelta
from fastapi import APIRouter, Response, Cookie, HTTPException, status
from fastapi.responses import RedirectResponse
from ..core.config import settings
from ..core.security import verify_password, create_jwt_token
from ..core.db import supabase as sb
from ..services.oauth import oauth_data
from ..services.user import get_user_by_email, create_user
from ..schemas.user import UserCreate, UserLogin
from pydantic import BaseModel, EmailStr
from ..core.security import extract_jwt_token, get_password_hash
from ..services.email import send_password_reset_email
from datetime import datetime, timezone, timedelta

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    newPassword: str

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth")

@router.get("/google")
async def login_google(type: str = "login"):
    return {
            "url": f"https://accounts.google.com/o/oauth2/auth?response_type=code&client_id={settings.GOOGLE_CLIENT_ID}&redirect_uri={settings.GOOGLE_REDIRECT_URI}&scope=openid profile email&access_type=offline&state={type}"
        }

@router.get("/github")
async def login_github(type: str = "login"):
    return {
            "url": f"https://github.com/login/oauth/authorize?scope=user:read user:email&client_id={settings.GITHUB_CLIENT_ID}&redirect_uri={settings.GITHUB_REDIRECT_URI}&state={type}"
        }

@router.get("/{provider}/callback")
async def oauth_check(provider: str, code: str, state: str = "signup"):
    image = ""
    if provider == "google":
        data =  oauth_data(code, settings.GOOGLE_OAUTH_PAYLOAD)
        image = data["picture"]
    elif provider == "github":
        data =  oauth_data(code, settings.GITHUB_OAUTH_PAYLOAD, "github")
        image = data["avatar_url"]

    user = get_user_by_email(data["email"])

    if user and state == "signup":
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=User already exists")
        # raise HTTPException(status_code=409, detail="User already exists")
    elif not user and state == "login":
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=User account does not exist. Please sign up first.")
        # raise HTTPException(status_code=401, detail="User account does not exist. Please sign up first.")
    elif user.active == False:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=User Account is disabled. contact admin")
    
    if state == "signup":
        new_user = {
            "email": data["email"],
            "fullname": data["name"],
            "login_type": provider,
            "image": image
        }
        create_user(new_user)

    token = create_jwt_token({"email": data["email"]})
    secure_flag = "; Secure" if settings.is_production else ""

    print(f"{settings.FRONTEND_URL}{settings.FRONTEND_OAUTH_CALLBACK}",{
        "set-cookie": f"session={token}; Max-Age={int(timedelta(hours=1).total_seconds())}; Path=/; HttpOnly; SameSite=Lax{secure_flag}"})
    return RedirectResponse(url=f"{settings.FRONTEND_URL}{settings.FRONTEND_OAUTH_CALLBACK}", headers={
        "set-cookie": f"session={token}; Max-Age={int(timedelta(hours=1).total_seconds())}; Path=/; HttpOnly; SameSite=none{secure_flag}"
    })


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    tags=["Authentication"]
)
async def signup_user(user: UserCreate):

    user_data = {
        "email": user.email,
        "password": user.password,
        "fullname": user.fullname,
        "login_type": "local"
    }

    res = get_user_by_email(user_data["email"])
    
    if res:
            raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    data = create_user(user_data)

    if not data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user in database"
        )
    new_user = data.data[0]
    payload = {
            "id": new_user["id"],
            "fullname": new_user["fullname"],
            "email": new_user["email"]
        }
    

    return {
        "status": "success",
        "data": payload
    }


@router.post(
    "/login",
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and return profile",
    tags=["Authentication"]
)
async def login_user(user_login: UserLogin, response: Response):
    try:
        res = sb.table('users').select('id, email, fullname, password, role, active').eq('email', user_login.email).eq("login_type", "local").eq("active", True).limit(1).maybe_single().execute()
        
        db_user = res.data
        if not res.data or not verify_password(user_login.password, db_user.get("password", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        
        payload = {
            "id": db_user["id"],
            "fullname": db_user["fullname"],
            "email": db_user["email"]
        }
        response.set_cookie(
            key="session", 
            value= create_jwt_token(payload),
            httponly=True,
            secure=settings.is_production,
            max_age= settings.JWT_TOKEN_EXPIRE_MINUTES * 60,
            path="/",
            samesite="none"
        ) 
        
        return {
                "status": "success",
                "data": {
                    "redirect": "/dashboard" if db_user["role"] == "admin" else "/"
                }
            }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error during login: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected server error occurred. try logging in again in a few minutes."
        )

@router.get("/logout") 
async def logout_user(response: Response, session: Annotated[str | None, Cookie()] = None):
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="You are not currently logged in."
        )

    response.delete_cookie(key="session")

    return {
            "status": "success",
            "message": "Successfully logged out"
        }

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPassword):
    user = get_user_by_email(payload.email)
    if not user or user.active == False:
        return {"status": "success", "message": "If that email is in our database, we will send a password reset link."}
        
    token = create_jwt_token(
        {"email": payload.email, "purpose": "reset_password"}, 
        expires_delta=timedelta(minutes=30)
    )
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    email_sent = send_password_reset_email(payload.email, link)
    
    if not email_sent:
        logger.error(f"Failed to send real email to {payload.email}")
    
    return {"status": "success", "message": "If that email is in our database, we will send a password reset link."}

@router.post("/reset-password")
async def reset_password(payload: ResetPassword):
    try:
        data = extract_jwt_token(payload.token)
        if data.get("purpose") != "reset_password":
            raise HTTPException(status_code=400, detail="Invalid token purpose.")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired token.")
        
    hashed = get_password_hash(payload.newPassword)
    new_timestamp = datetime.now(timezone.utc).isoformat()
    res = sb.table("users").update({
        "password": hashed,
        "password_changed_at": new_timestamp
    }).eq("email", data["email"]).execute()
    
    if not res.data:
        raise HTTPException(status_code=500, detail="User not found or update failed.")
        
    return {"status": "success", "message": "Password reset successfully."}