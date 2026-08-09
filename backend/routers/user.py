from fastapi import APIRouter, Depends, UploadFile, File, status, HTTPException
from ..core.db import supabase as sb
from ..schemas.user import User, UserUpdate, UserAddressCreate, UserAddressUpdate
from ..dependencies import get_user, check_role
from ..core.logs import logger
from ..services.uploads import upload_image
from pydantic import BaseModel
from ..core.security import verify_password, get_password_hash

class PasswordUpdate(BaseModel):
    currentPassword: str
    newPassword: str

router = APIRouter(prefix="/users")

@router.get("/me")
async def user_me(user = Depends(get_user())):

    return {
        "status": "success",
        "data": user
    }

@router.post("/profile-image") 
async def upload_profile_image(file: UploadFile = File(...), _: User = Depends(check_role([]))):
    try:
        url = await upload_image(file, "profile")
        return { "status": "success", "public_url": url }

    except Exception as e:
        logger.error(f"Error uploading profile image to storage: {e}", exc_info=True)
        raise e

@router.get("/")
def get_all_users(_: User = Depends(check_role(["admin"]))):
    response = (
        sb.table("users")
        .select("id, fullname, email, login_type, role, active, created_at")
        .execute()
    )

    return {
        "status": "success",
        "data": response.data if response else []
    }

@router.patch("/{id}")
def update_user(id: int, update_user: UserUpdate, user: User = Depends(check_role(["admin", "user"]))):

    data = update_user.model_dump(exclude_none=True)

    if user.role != "admin":
        if id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to modify another user's account."
            )
    
        if any(key in ["role", "active"] for key in data):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be an admin to modify 'role' or 'active' status."
            )

    response = (
        sb.table("users")
        .update(data)
        .eq("id", id)
        .execute()
    )

    return {
        "status": "success",
        "data": response.data[0]
    }

@router.patch("/me/password")
def update_user_password(pass_update: PasswordUpdate, user: User = Depends(get_user())):
    res = sb.table('users').select('password').eq('id', user.id).eq("login_type", "local").maybe_single().execute()
    db_user = res.data
    
    if not db_user or not verify_password(pass_update.currentPassword, db_user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect current password."
        )
        
    hashed_new = get_password_hash(pass_update.newPassword)
    update_res = sb.table("users").update({"password": hashed_new}).eq("id", user.id).execute()
    
    if not update_res.data:
        raise HTTPException(status_code=500, detail="Failed to update password.")
        
    return {"status": "success", "message": "Password updated successfully"}

@router.get("/me/addresses")
def get_user_addresses(user: User = Depends(get_user())):
    response = (
        sb.table("user_addresses")
        .select("*")
        .eq("user_id", user.id)
        .execute()
    )
    return {
        "status": "success",
        "data": response.data if response else []
    }

@router.post("/me/addresses")
def create_user_address(address: UserAddressCreate, user: User = Depends(get_user())):
    data = address.model_dump(exclude_none=True)
    data["user_id"] = user.id

    if data.get("is_default_shipping"):
        sb.table("user_addresses").update({"is_default_shipping": False}).eq("user_id", user.id).execute()

    response = (
        sb.table("user_addresses")
        .insert(data)
        .execute()
    )

    return {
        "status": "success",
        "data": response.data[0] if response and response.data else None
    }

@router.patch("/me/addresses/{address_id}")
def update_user_address(address_id: int, address_update: UserAddressUpdate, user: User = Depends(get_user())):
    data = address_update.model_dump(exclude_none=True)
    
    if data.get("is_default_shipping"):
        sb.table("user_addresses").update({"is_default_shipping": False}).eq("user_id", user.id).execute()

    response = (
        sb.table("user_addresses")
        .update(data)
        .eq("id", address_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not response or not response.data:
        raise HTTPException(status_code=404, detail="Address not found")

    return {
        "status": "success",
        "data": response.data[0]
    }