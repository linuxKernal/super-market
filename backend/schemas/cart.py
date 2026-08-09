from pydantic import BaseModel

class CartProduct(BaseModel):
    product_id: int

class CartUpdate(BaseModel):
    quantity: int

class CouponModel(BaseModel):
    coupon_code: str
    cart_total: float
