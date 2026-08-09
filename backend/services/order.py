from fastapi import HTTPException, status
from ..core.db import supabase as sb
from ..services.cart import get_cart_items
from backend.utils import calc_product_discount, PRODUCT_FIELDS


def get_user_orders(user_id: int):
    response = (
        sb.table("orders")
        .select(f"*, order_items(id, quantity, original_price, discount_amount, price_at_purchase, product:product_id({PRODUCT_FIELDS}))")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data

async def create_order(payload: dict):
    response = sb.table("orders").insert(payload).execute()
    data = response.data[0]
    return data

def update_order(order_id: str, payload: dict):
    response = (sb.table("orders")
    .update(payload)
    .eq("gateway_order_id", order_id)
    .execute())

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Order with ID {order_id} not found."
        )
            
    return response.data[0]

async def create_order_items(order_id: str, cart_id: str, coupons_data: list[dict] | None):
    cart_items = await get_cart_items(cart_id)
    
    cart_items_order = []
    for item in cart_items:
        discount_price = calc_product_discount(item["product"]["price"], item["product"]["discount"])
        cart_items_order.append({
            "order_id": order_id,
            "product_id": item["product"]["id"], 
            "quantity": item["quantity"], 
            "original_price": item["product"]["price"],
            "discount_amount": item["product"]["price"] - discount_price,
            "price_at_purchase": discount_price
        })
    sb.table("order_items").insert(cart_items_order).execute()

    if coupons_data:
        coupons_payload = []
        for data in coupons_data["applied"]:
            coupons_payload.append({
                "order_id": order_id,
                "discount_applied": data["save"],
                "coupon_id": data["coupon_id"]
            })
        sb.table("order_coupons").insert(coupons_payload).execute()