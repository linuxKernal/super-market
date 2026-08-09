from fastapi import APIRouter, Depends
from ..schemas.user import User
from ..dependencies import check_role
from ..services.order import get_user_orders

router = APIRouter()


@router.get("/")
def get_orders(user: User = Depends(check_role([]))):
    orders = get_user_orders(user.id)
    print("orders", orders)
    return {
        "status": "success",
        "data": orders
    }
