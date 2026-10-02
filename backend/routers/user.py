from fastapi import APIRouter, Depends, UploadFile, File, status, HTTPException
import requests
from pydantic import BaseModel
from ..core.db import supabase as sb
from ..core.config import settings
from ..dependencies import get_user, check_role, require_recaptcha
from ..core.security import verify_password, get_password_hash
from ..core.logs import logger
from ..services.uploads import upload_image
from ..schemas.user import User, UserUpdate, UserAddressCreate, UserAddressUpdate

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

@router.get("/reverse-geocode")
def reverse_geocode(lat: float, lng: float, user: User = Depends(get_user()), claims = Depends(require_recaptcha("reverse_geocode"))):
    try:
        api_key = settings.GOOGLE_MAPS_API_KEY
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal Server Error Please Contact Admin."
            )

        url = f"https://geocode.googleapis.com/v4/geocode/location/{lat},{lng}?key={api_key}"
        res = requests.get(url, timeout=10)
        res_data = res.json()

        if res.status_code != 200 or not res_data.get("results"):
            return {
                "status": "fail",
                "message": res_data.get("error_message", "No address found for these coordinates."),
                "data": None
            }

        results = res_data.get("results", [])
        
        target_result = None
        
        for res in results:
            if "postalAddress" in res:
                target_result = res
                break
                
        if not target_result and results:
            target_result = results[0]
            
        if not target_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No address found for this latitude and longitude"
            )

        postal_addr = target_result.get("postalAddress", {})
        address_lines = postal_addr.get("addressLines", [])
        
        return {
            "status": "success", 
            "data": {
                "address1": address_lines[0] if len(address_lines) > 0 else "",
                "address2": address_lines[1] if len(address_lines) > 1 else "",
                "city": postal_addr.get("locality", ""),
                "state": postal_addr.get("administrativeArea", ""),
                "country": postal_addr.get("regionCode", ""),
                "zipcode": postal_addr.get("postalCode", ""),
                "formatted_address": target_result.get("formattedAddress", "")
            }
        }
    except Exception as e:
        logger.error(f"Reverse geocode error: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch address details.")