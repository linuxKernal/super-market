from ..core.db import supabase as sb
from ..utils import productFormat, PRODUCT_FIELDS
from ..dependencies import query_builder

def get_products_with_filters(params, is_admin=False):
    base_query = (
        sb.table("category")
        .select(
            f"id, name, image, subCategories:sub_category(id, label, products:Products({PRODUCT_FIELDS}))",
            count="exact"
        )
        .eq("subCategories.products.is_deleted", False)
    )

    if not is_admin:
        base_query = base_query.eq("subCategories.products.active", True)

    
    return query_builder(base_query, ["sub_category.Products.name"], params)

def create_new_product(product_data: dict):
    new_product = productFormat(product_data)
    return sb.table("Products").insert(new_product).execute()

def update_product_by_id(product_id: int, product_data: dict):
    update_data = productFormat(product_data)
    return (
        sb.table("Products")
        .update(update_data)
        .eq("id", product_id)
        .execute()
    )

def delete_product_by_id(product_id: int):
    return (
        sb.table("Products")
        .update({
            "is_deleted": True 
        })
        .eq("id", product_id)
        .execute()
    )
