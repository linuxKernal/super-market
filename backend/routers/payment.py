import secrets
from typing import Annotated
from decimal import Decimal, ROUND_HALF_UP
from fastapi import APIRouter, HTTPException, Depends, Form, status
import razorpay
from fastapi.responses import RedirectResponse
from ..core.db import supabase as sb
from backend.core.config import settings
from backend.services.user import get_user_address
from ..core.logs import logger
from backend.schemas.payment import OrderRequest, PaymentVerificationRequest
from ..schemas.user import User
from ..dependencies import check_role
from ..services.cart import cart_total_amount, cart_sub_total_amount, calculate_coupon_codes, clear_cart_items
from ..services.order import create_order, create_order_items, update_order
from backend.utils import join_user_address
from ..schemas.enums import OrderStatus


razorpay_client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)

router = APIRouter()

@router.post("/create-order", status_code=status.HTTP_201_CREATED)
async def create_checkout_order(order_data: OrderRequest, user: User = Depends(check_role([]))):
    try:        
        unique_receipt = f"order_{secrets.token_hex(8)}"

        sub_total = await cart_sub_total_amount(user.cart_id)

        if len(order_data.coupons):
            coupons_data = calculate_coupon_codes(order_data.coupons, sub_total)
        else:
            coupons_data = None

        grand_total, sub_total, discount_total = await cart_total_amount(cart_id=user.cart_id, sub_total=sub_total, coupons_data=coupons_data)

        user_address = get_user_address(order_data.shipping_address_id)

        shipping_address = join_user_address(user_address)
        
        grand_total_final = int((Decimal(str(grand_total)) * 100).quantize(Decimal('1'), rounding=ROUND_HALF_UP))

        data = {
            "amount": grand_total_final,
            "currency": order_data.currency.upper(),
            "receipt": unique_receipt,   
            "notes": {
                "cart_id": user.cart_id,
                "total_amount": grand_total,
                "discount_total": discount_total,
                "coupons": order_data.coupons
            }
        }

        razorpay_order = razorpay_client.order.create(data=data)

        order_payload = {
            "user_id": user.id,
            "total_amount": grand_total,
            "currency": order_data.currency.upper(),
            "shipping_address": shipping_address,
            "subtotal": sub_total,
            "discount_total": discount_total,
            "status": OrderStatus.PENDING,
            "gateway_order_id": razorpay_order["id"]
        }

        order = await create_order(order_payload)
        await create_order_items(order["id"], cart_id=user.cart_id, coupons_data=coupons_data)
        
        return razorpay_order

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Razorpay Order Creation Failed: {str(e)}"
        )


@router.post("/verify-payment")
async def verify_payment(payload: Annotated[PaymentVerificationRequest, Form()], user: User = Depends(check_role([]))):
    try:
        params_dict = {
            'razorpay_order_id': payload.razorpay_order_id,
            'razorpay_payment_id': payload.razorpay_payment_id,
            'razorpay_signature': payload.razorpay_signature
        }
        
        razorpay_client.utility.verify_payment_signature(params_dict)
        payment = razorpay_client.order.payments(payload.razorpay_order_id)

        transactions = []

        order = sb.table("orders").select("id").eq("gateway_order_id", payload.razorpay_order_id).execute()

        for transaction in payment["items"]:
            method = transaction["method"]
            if method == 'netbanking':
                providerName = transaction["bank"]
            elif method == 'wallet':
                providerName = transaction["wallet"]
            elif method == 'card':
                providerName = f"{transaction['card']['issuer']} {transaction['card']['network']}"
            else:
                providerName = "Unknown"

            transactions.append({
                "order_id": order.data[0]["id"],
                "user_id": user.id,
                "gateway_order_id": transaction["order_id"],
                "gateway_name": "Razorpay",
                "gateway_payment_id": transaction["id"],
                "gateway_signature": payload.razorpay_signature,
                "amount_paid": transaction["amount"] / 100,
                "payment_method": transaction["method"],
                "currency": transaction["currency"],
                "payment_status": transaction["status"],
                "gateway_response": transaction,
                "provider_name": providerName
            })
        
        sb.table("transactions").insert(transactions).execute()

        update_order(payload.razorpay_order_id,  { "status": OrderStatus.COMPLETED })
        clear_cart_items(user.cart_id)
        
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/payment/callback?success", status_code=status.HTTP_303_SEE_OTHER)
        
    except razorpay.errors.SignatureVerificationError as e:
        logger.error(f"SignatureVerificationError error occurred: /verify-payment: {e}", exc_info=True)
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/payment/callback?error=Payment verification failed! The digital signature is invalid.", status_code=status.HTTP_303_SEE_OTHER)

    except Exception as e:
        logger.error(f"Unexpected error occurred: /verify-payment: {e}", exc_info=True)
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/payment/callback?error=An internal error occurred", status_code=status.HTTP_303_SEE_OTHER)
    
