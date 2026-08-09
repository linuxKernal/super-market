from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from ..core.logs import logger
from ..schemas.product import ProductBase, ProductUpdate
from ..schemas.user import User
from ..dependencies import check_role, CommonQueryParams
from ..services.product import (
    get_products_with_filters,
    create_new_product,
    update_product_by_id,
    delete_product_by_id
)
from ..services.uploads import upload_image

router = APIRouter()

@router.get("/products")
def get_all_products(user: User = Depends(check_role([])), params = Depends(CommonQueryParams)):
    res = get_products_with_filters(params, user.role == "admin")

    return {
        "status": "success",
        **(res if res else {})
    }


@router.post("/products")
async def create_product(product: ProductBase, _: User = Depends(check_role(["admin"]))):
    try:
        response = create_new_product(product.model_dump())

        if len(response.data) == 0:
            raise HTTPException(status_code=400, detail="Failed to create product")

        return {"status": "success", "data": response.data[0]}

    except Exception as e:
        logger.error(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/products/{product_id}")
async def update_product(product_id: int, product: ProductUpdate, _: User = Depends(check_role(["admin"]))):
    try:
        response = update_product_by_id(product_id, product.model_dump(exclude_none=True))

        if len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Product not found or not updated")

        return {"status": "success", "data": response.data[0]}

    except Exception as e:
        logger.error(f"Error updating product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/products/{id}")
def delete_product(id: int, _: User = Depends(check_role(["admin"]))):
    try:
        response = delete_product_by_id(id)

        if not response: 
            raise HTTPException(detail="something went wrong when deleting the product", status_code=500)

        return {
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error deleting product {id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/product-images")
async def upload_file(
    file: UploadFile = File(...),  
    _: User = Depends(check_role(["admin"]))
):
    try:

        url = await upload_image(file, "products")
        return {"public_url": url}

    except Exception as e:
        logger.error(f"Error uploading product image to storage: {e}", exc_info=True)
        raise e