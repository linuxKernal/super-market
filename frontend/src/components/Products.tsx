import ProductRow from "./ProductRow";
import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import CardRowSkeleton from "./CardRowSkeleton";

export interface Product {
    id: number;
    image: string;
    name: string;
    discount?: number | null;
    price: number;
    weight: number;
    unit: string;
    isStock: boolean;
    stocks: number;
    active: boolean;
    categoryId: number;
    brandName: string;
}

export interface CategoryProducts {
    id: number;
    name: string;
    products: Product[];
}

export default function Products() {
    const [products, setProducts] = useState<CategoryProducts[]>([]);
    const [loading, setLoading] = useState(false);
    useEffect(function () {
        setLoading(true);
        fetch(`${API_URL}/categories/products/featured`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then(({ data }) => {
                setLoading(false);
                setProducts(data);
            });
    }, []);
    return (
        <div className="w-full space-y-6 my-8">
            {loading ? (
                <>
                    <CardRowSkeleton />
                    <CardRowSkeleton />
                </>
            ) : (
                products.map((item) => {
                    return (
                        <ProductRow
                            key={item.id}
                            name={item.name}
                            id={item.id}
                            products={item.products}
                        />
                    );
                })
            )}
            {}
        </div>
    );
}
