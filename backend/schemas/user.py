from pydantic import BaseModel, EmailStr

class User(BaseModel):
    id: int
    fullname: str
    image: str | None = None
    cart_id: int
    active: bool
    role: str
    email: EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    fullname: str

class UserUpdate(BaseModel):
    fullname: str | None = None
    image: str | None = None
    active: bool | None = None
    role: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserAddressBase(BaseModel):
    name: str
    address_1: str
    address_2: str | None = None
    mobile: str
    landmark: str | None = None
    is_default_shipping: bool = False
    pincode: int
    city: str
    state: str
    country_code: str

class UserAddressCreate(UserAddressBase):
    pass

class UserAddressUpdate(BaseModel):
    name: str | None = None
    address_1: str | None = None
    address_2: str | None = None
    mobile: str | None = None
    landmark: str | None = None
    is_default_shipping: bool | None = None
    pincode: int | None = None
    city: str | None = None
    state: str | None = None
    country_code: str | None = None