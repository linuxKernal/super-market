import { API_URL } from "@/config";
import type { Category, SubCategory } from "@/pages/ProductsPage";
import type { ApiResponce } from "./api";
import type { Product } from "@/components/Products";

export async function getCategory(
    categoryId: number
): Promise<ApiResponce<Category>> {
    const res = await fetch(`${API_URL}/categories/${categoryId}`);

    return await res.json();
}

export async function getSubcategories(
    categoryId: number
): Promise<ApiResponce<SubCategory[]>> {
    const res = await fetch(
        `${API_URL}/categories/${categoryId}/subcategories`,
        {
            credentials: "include",
        }
    );

    return await res.json();
}

export async function getProductsBySubcategory(
    categoryId: number,
    subCategoryId: number,
    page: number = 1,
    limit: number = 8
): Promise<ApiResponce<Product[]>> {
    const res = await fetch(
        `${API_URL}/categories/${categoryId}/subcategories/${subCategoryId}
        /products?page=${page}&size=${limit}`,
        {
            credentials: "include",
        }
    );
    return await res.json();
}
