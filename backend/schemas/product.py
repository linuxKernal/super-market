from typing import Optional
from pydantic import BaseModel

class ProductBase(BaseModel):
    image: str
    name: str
    discount: Optional[float] = None
    price: float
    weight: float
    unit: str
    is_stock: bool
    stocks: int
    active: bool
    category_id: int
    brand_name: str
    is_deleted: Optional[bool] = False

class ProductUpdate(BaseModel):
    image: Optional[str] = None
    name: Optional[str] = None
    discount: Optional[float] = None
    price: Optional[float] = None
    weight: Optional[float] = None
    unit: Optional[str] = None
    is_stock: Optional[bool] = None
    stocks: Optional[int] = None
    active: Optional[bool] = None
    category_id: Optional[int] = None
    brand_name: Optional[str] = None
