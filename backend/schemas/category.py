from pydantic import BaseModel

class CategoryCreate(BaseModel):
    image: str
    name: str
    featured: bool

class CategoryUpdate(BaseModel):
    image: str | None = None
    name: str | None = None
    featured: bool | None = None

class SubCategoryCreate(BaseModel):
    image: str
    label: str
    category_id: int

class SubCategoryUpdate(BaseModel):
    image: str | None = None
    label: str | None = None
    category_id: int | None = None