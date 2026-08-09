from ..core.db import supabase as sb
from ..core.security import get_password_hash
from ..schemas.user import User


def get_user_by_email(email: str):
    response = sb.table("users").select("id, fullname, email, image, role, active, cart(id)").eq("email", email).maybe_single().execute()
    if response:
        response.data["cart_id"] = response.data["cart"][0]["id"]
        del response.data["cart"]
        return User(**response.data)
    return None

def create_user(user_data):
    if "password" in user_data:
        user_data["password"] = get_password_hash(user_data["password"] )
    data = sb.table('users').insert(user_data).execute()
    sb.table('cart').insert({"user_id": data.data[0]["id"]}).execute()
    return data

def get_user_address(address_id: int):
    response = sb.table("user_addresses").select("*").eq("id", address_id).maybe_single().execute()
    return response.data