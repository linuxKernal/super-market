def productFormat(data):
    for camel_key, snake_key in [
        ("categoryId", "category_id"),
        ("brandName", "brand_name"),
        ("isStock", "is_stock")
    ]:
        if camel_key in data:
            data[snake_key] = data.pop(camel_key)
    return data

def join_user_address(address: dict):
    return f"{address['address_1']}, {address['address_2']}, {address['city']}, {address['state']}, {address['pincode']}, {address['country_code']}"

def calc_product_discount(price: int, discount: int):
    if discount:
        return price * ((100 - discount ) / 100)
    else:
        return price 

PRODUCT_FIELDS = "id,name,discount,price,unit,image,weight,stocks,active,categoryId:category_id,brandName:brand_name,isStock:is_stock"
BUCKET_NAME = "images"

