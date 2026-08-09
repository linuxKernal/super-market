from backend.core.logs import logger
from backend.services.uploads import upload_image
from fastapi import APIRouter, Depends, UploadFile, File,  HTTPException
from ..core.db import supabase as sb
from ..schemas.category import CategoryCreate, CategoryUpdate, SubCategoryCreate, SubCategoryUpdate
from ..schemas.user import User
from ..dependencies import check_role, CommonQueryParams, query_builder
from ..utils import PRODUCT_FIELDS

router = APIRouter()

@router.get("/categories")
def get_all_category(params = Depends(CommonQueryParams), user: User = Depends(check_role([], strict_auth=False))):

    response = (
        sb.table("category")
        .select(f"id, name, image, featured, subCategories:sub_category(*, Products({PRODUCT_FIELDS}))", count='exact')
        .eq("sub_category.Products.is_deleted", False)
    )

    if not user or user.role != "admin":
        response = response.eq("sub_category.Products.active", True)

    res = query_builder(response, ["name"], params)

    return res

@router.post("/categories")
def create_category(data: CategoryCreate, _: User = Depends(check_role(["admin"]))):
    response = (
        sb.table("category")
        .insert(data.model_dump())
        .execute()
    )

    if not response:
        raise HTTPException(detail="something went wrong when insert the category data", status_code=500)
    
    res = (
        sb.table("category")
        .select("id, name, image, featured, subCategories:sub_category(*)")
        .eq("id", response.data[0]["id"])
        .single()
        .execute()
    )

    return {
        "status": "success",
        "data": res.data
    }

@router.patch("/categories/{id}")
def update_category(id: int, data: CategoryUpdate, _: User = Depends(check_role(["admin"]))):
    response = (
        sb.table("category")
        .update(data.model_dump(exclude_unset=True))
        .eq("id", id)
        .execute()
    )

    if not response:
        raise HTTPException(detail="something went wrong when updating the category data", status_code=500)

    res = (
        sb.table("category")
        .select("id, name, image, featured, subCategories:sub_category(*)")
        .eq("id", response.data[0]["id"])
        .single()
        .execute()
    )

    return {
        "status": "success",
        "data": res.data
    }

@router.delete("/categories/{id}")
def delete_category(id: int, _: User = Depends(check_role(["admin"]))):
    response = (
        sb.table("category")
        .delete()
        .eq("id", id)
        .execute()
    )

    if not response:
        raise HTTPException(detail="something went wrong when deleting the category", status_code=500)

    return {
        "status": "success"
    }


@router.get("/categories/products/featured")
def get_featured_category(user: User = Depends(check_role([], strict_auth=False))):
    response = (
        # sb.table("category")
        # .select("id, name, image, sub_category(Products(*, order=created_at.desc, limit=5)))").eq("featured", True)
        # .execute()
        sb.table("category")
        .select(f"id, name, image, sub_category!inner(id, label, Products!inner({PRODUCT_FIELDS}))")
        .eq("featured", True)
        .eq("sub_category.Products.is_deleted", False)
        
    )

    print("user++", user)
    if not user or user.role != "admin":
        response = response.eq("sub_category.Products.active", True)
    
    response = (response.order("created_at", foreign_table="sub_category.Products", desc=True)
        .limit(4, foreign_table="sub_category.Products")
        .execute())

    result = []

    for i in response.data:
        data = {
            "id": i["id"],
            "name": i["name"],
            "products": []
        }
        for j in i["sub_category"]:
            data["products"].extend(j["Products"])
        result.append(data)
    print(data)
    return {
        "data": result,
    }


@router.post("/sub-categories")
def create_subcategory(data: SubCategoryCreate, _: User = Depends(check_role(["admin"]))):
    response = (
        sb.table("sub_category")
        .insert(data.model_dump())
        .execute()
    )

    if not response:
        raise HTTPException(detail="something went wrong when insert the sub category data", status_code=500)

    return {
        "status": "success",
        "data": response.data[0]
    }

@router.patch("/sub-categories/{id}")
def update_subcategory(id: int, data: SubCategoryUpdate, _: User = Depends(check_role(["admin"]))):
    response = (
        sb.table("sub_category")
        .update(data.model_dump(exclude_unset=True))
        .eq("id", id)
        .execute()
    )

    if not response:
        raise HTTPException(detail="something went wrong when updating the sub category data", status_code=500)

    return {
        "status": "success",
        "data": response.data[0]
    }

@router.delete("/sub-categories/{id}")
def delete_subcategory(id: int, _: User = Depends(check_role(["admin"]))):
    response = (
        sb.table("sub_category")
        .delete()
        .eq("id", id)
        .execute()
    )

    if not response:
        raise HTTPException(detail="something went wrong when deleting the sub category", status_code=500)

    return {
        "status": "success"
    }

@router.get("/categories/{id}")
def get_category(id):
    response = (
        sb.table("category")
        .select("id, name, image")
        .eq("id", id)
        .maybe_single()
        .execute()
    )

    return response

@router.get("/categories/{id}/subcategories")
def get_all_subcategory_for_category(id):
    response = (
        sb.table("sub_category")
        .select("id, label, image, category_id")
        .eq("category_id", id)
        .execute()
    )

    return response

@router.get("/categories/{c_id}/products")
def get_all_products_for_category(c_id, params: dict = Depends(CommonQueryParams)):
    category_check = sb.table("category").select("id").eq("id", c_id).execute()

    if not category_check.data:
        raise HTTPException(
            status_code=404,
            detail="category does not exists"
        )

    response = query_builder(
        (sb.table("Products").select(f"{PRODUCT_FIELDS}, sub_category!inner()", count="exact")
        .eq("sub_category.category_id", c_id)),
        ["name"], 
        params
    )

    return {
        "status": "success",
        **response
    }

@router.get("/categories/{c_id}/subcategories/{sc_id}/products")
def get_products_by_subcat(c_id: str, sc_id: str, params: dict = Depends(CommonQueryParams), user: User = Depends(check_role([], strict_auth=False))):

    if not sb.table("sub_category").select("id", count="exact").match({"id": sc_id, "category_id": c_id}).execute().data:
        raise HTTPException(404, detail="Subcategory not found regarding this category")
    
    query = sb.table("Products").select(PRODUCT_FIELDS, count="exact").eq("category_id", sc_id)

    if not user or user.role != "admin":
        query = query.eq("active", True)

    response = query_builder(
        query,
        ["name"], 
        params
    )

    return {"status": "success", **response}

@router.post("/category-images")
async def upload_file(
    file: UploadFile = File(...),  
    _: User = Depends(check_role(["admin"]))
):
    try:

        url = await upload_image(file, "categories")
        return {"public_url": url}

    except Exception as e:
        logger.error(f"Error uploading category image to storage: {e}", exc_info=True)
        raise e