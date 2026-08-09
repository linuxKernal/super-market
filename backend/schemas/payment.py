from pydantic import BaseModel

class OrderRequest(BaseModel):
    currency: str = "INR"
    coupons: list[str] = []
    shipping_address_id: int

class PaymentVerificationRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str