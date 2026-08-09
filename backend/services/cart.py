from datetime import datetime
from fastapi import HTTPException
from ..core.db import supabase as sb
from ..utils import PRODUCT_FIELDS


async def get_cart_items(cart_id: str):
    response = (
        sb.table("cartItem")
        .select(f"id, quantity, product:product_id({PRODUCT_FIELDS})")
        .eq("cart_id", cart_id)
        .execute()
    )

    return response.data

async def cart_sub_total_amount(cart_id: str):
    response = sb.rpc(
        "get_cart_sub_total", 
        {"param_cart_id": cart_id}
    ).execute()

    return float(response.data)

async def cart_total_amount(cart_id: str, coupons: list[str] | None = None, coupons_data: list[dict] | None = None, sub_total: int | None = None):
    
    if not sub_total:
        sub_total = await cart_sub_total_amount(cart_id)

    total_discount = 0

    if (coupons and len(coupons)) or coupons_data:
        if not coupons_data:
            coupons = calculate_coupon_codes(coupons, sub_total)
        else:
            coupons = coupons_data

        if not coupons or len(coupons["invalid_codes"]):
            raise HTTPException(status_code=400, detail=coupons["invalid_codes"])
        total_discount = coupons["total_discount"]
    
    grand_total = sub_total

    if sub_total < 500:
        grand_total+= 25
    
    grand_total -= total_discount

    return grand_total, sub_total, total_discount


def calculate_coupon_codes(coupons: list[str], cart_total: int):
    if len(coupons) == 0:
        return {
            "total_discount": 0,
            "applied": [],
            "invalid_codes": []
        }
    codes = [code.upper() for code in coupons]
    res = (
        sb.table("coupons")
        .select("*")
        .in_("code", codes)
        .eq("is_active", True).execute()
    )
    if not res.data:
        raise HTTPException(status_code=400, detail="Invalid or Inactive coupon.")

    coupon_codes = res.data
    today = datetime.now().date()
    total_discount = 0

    applied = []
    valid_codes = {c["code"] for c in coupon_codes}
    invalid_codes = [{"code": code, "error": "Invalid or Inactive coupon."} for code in coupons if code not in valid_codes]
    
    for code in coupon_codes:
        start_date = datetime.fromisoformat(code["start_date"]).date()
        end_date = datetime.fromisoformat(code["end_date"]).date()

        if not (start_date <= today <= end_date):
            invalid_codes.append({
                "code": code["code"],
                "error": "Coupon expired or not yet active."
            })
            continue
        
        if cart_total < code["min_spend"]:
            invalid_codes.append({
                "code": code["code"],
                "error": f"Minimum cart value ₹{code['min_spend']} required."
            })
            continue
        
        if code["type"] == "percent":
            discount = cart_total * (code["value"] / 100)
        else:
            discount = code["value"]

        total_discount+= round(discount, 2)

        applied.append({
            "code": code["code"],
            "coupon_id": code["id"],
            "save": round(discount, 2)
        })
    
    return {
        "total_discount": total_discount,
        "applied": applied,
        "invalid_codes": invalid_codes
    }

def clear_cart_items(cart_id):
    (
        sb.table("cartItem")
        .delete()
        .eq("cart_id", cart_id)
        .execute()
    )
