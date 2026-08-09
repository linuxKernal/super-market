from fastapi import APIRouter, HTTPException, Depends
from ..core.db import supabase as sb
from ..schemas.cart import CartProduct, CartUpdate, CouponModel
from ..schemas.user import User
from ..dependencies import check_role
from ..services.cart import calculate_coupon_codes
from ..utils import PRODUCT_FIELDS

router = APIRouter()

@router.get("/cart/{id}/cart-items")
def get_cart_products(id: int, user: User = Depends(check_role(["user", "admin"]))):

    if id != user.cart_id:
        raise HTTPException(status_code=403, detail="You do not have permission to access this resource.")

    response = (
        sb.table("cart")
        .select("id")
        .eq("id", id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=400, detail="no cart is found")

    response = (
        sb.table("cartItem")
        .select(f"id, quantity, product:product_id({PRODUCT_FIELDS})")
        .eq("cart_id", id)
        .execute()
    )

    return {
        "status": "success",
        "data": response.data
    }


@router.post("/cart/{id}/cart-items")
def add_product_in_cart(id: int, data: CartProduct, user: User = Depends(check_role(["user", "admin"]))):

    if id != user.cart_id:
        raise HTTPException(status_code=403, detail="You do not have permission to access this resource.")
    
    response = (
            sb.table("cartItem")
            .insert({
                "cart_id": id,
                "product_id": data.product_id,
                "quantity": 1
            })
            .execute()
        )
    
    if not response.data:
        raise HTTPException(status_code=400, detail="error in add the product to the cart")

    return {
        "status": "success",
        "data": response.data[0]
    }



@router.patch("/cart/{id}/cart-items/{item_id}")
def update_product_in_cart(id: int, item_id: int, data: CartUpdate, user: User = Depends(check_role(["user", "admin"]))):

    if id != user.cart_id:
        raise HTTPException(status_code=403, detail="You do not have permission to access this resource.")
    
    response = (
            sb.table("cartItem")
            .update(data.model_dump())
            .eq("cart_id", id)
            .eq("id", item_id)
            .execute()
        )

    if response.data:
        return {
            "status": "success",
            "data": response.data[0]
        }
    else:
        raise HTTPException(status_code=400, detail="No item found to update or quantity is the same.")

@router.delete("/cart/{id}/cart-items/{item_id}")
def delete_product_in_cart(id: int, item_id: int, user: User = Depends(check_role(["user", "admin"]))):

    if id != user.cart_id:
        raise HTTPException(status_code=403, detail="You do not have permission to access this resource.")
    
    response = (
            sb.table("cartItem")
            .delete()
            .eq("cart_id", id)
            .eq("id", item_id)
            .execute()
        )

    if response.data:
        return {
            "status": "success",
            "data": response.data[0]
        }
    else:
        raise HTTPException(status_code=400, detail="No item found to update or quantity is the same.")

@router.delete("/cart/{id}/cart-items")
def delete_all_products_cart(id: int, user: User = Depends(check_role(["user", "admin"]))):

    if id != user.cart_id:
        raise HTTPException(status_code=403, detail="You do not have permission to access this resource.")
    
    response = (
            sb.table("cartItem")
            .delete()
            .eq("cart_id", id)
            .execute()
        )
    
    if not response.data:
        raise HTTPException(status_code=400, detail="error in delete all products in the cart")

    return {
        "status": "success",
        "message": f"{response.count} cart items deleted successfully"
    }


@router.post("/coupon/check")
async def validate_coupon(data: CouponModel, _: User = Depends(check_role([]))):
    discounts = calculate_coupon_codes([data.coupon_code], data.cart_total)

    print("discounts", discounts)
    if len(discounts["invalid_codes"]):
        raise HTTPException(status_code=400, detail=discounts["invalid_codes"][0]["error"])

    return {
        "status": "success",
        "data": {
            "code": data.coupon_code,
            "save": discounts["applied"][0]["save"],
        }
    }
