import { useEffect, useMemo, useState } from "react";
import type { Product } from "./Products";
import { API_URL } from "@/config";
import type { CategoryWithSubCategories } from "@/pages/CategoriesPage";
import { type SubCategory } from "@/pages/ProductsPage";
import { Button } from "./ui/button";
import CategoryModal from "./CategoryModal";
import ProductDataTable from "./ProductDataTable";
import { PlusIcon } from "lucide-react";
import ProductForm from "./ProductForm";
import { useAppContext } from "@/contexts/AppContext";
import ConfirmForm from "./ConfirmForm";
import { deleteResource } from "@/services/api";
import { toast } from "react-toastify";

export interface ProductMain extends Product {
    categoryName: string;
    subCategoryName: string;
}

export type ActionType = "edit" | "delete" | "create";

export default function ProductTab() {
    const { setShowOverlay } = useAppContext();
    const [products, setProducts] = useState<ProductMain[]>([]);
    const [actionId, setActionId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionType, setActionType] = useState<ActionType>();
    const [subCategories, setSubCategories] = useState<
        Omit<SubCategory, "products">[]
    >([]);

    const currentData = useMemo(
        function () {
            return products.find((item) => item.id === actionId);
        },
        [actionId, products]
    );

    function handleCloseModel() {
        setShowOverlay(false);
        setActionId(null);
        setActionType(undefined);
    }

    function handleProductAction(type: ActionType, id?: number) {
        setShowOverlay(true);
        setActionId(id ?? null);
        setActionType(type);
    }

    async function handleDelete() {
        handleCloseModel();
        const data = await deleteResource(`products/${actionId}`);
        if (data!.status === "success") {
            toast.success(`product deleted!`);
            await fetchProducts();
        } else toast.success(`Error occured when deleting the product`);
    }

    async function fetchProducts() {
        setLoading(true);
        const res = await fetch(`${API_URL}/products`, {
            credentials: "include",
        });
        const resData = await res.json();
        if (resData.status !== "success") {
            setLoading(false);
            toast.error("Failed to load the Products");
            return;
        }
        const { data }: { data: CategoryWithSubCategories[] } = resData;
        const subCategories: Omit<SubCategory, "products">[] = [];
        const products = data.flatMap((c) => {
            return c.subCategories.flatMap((item) => {
                subCategories.push({
                    id: item.id,
                    category_id: item.category_id,
                    label: item.label,
                    image: item.image,
                });
                return item.products.map((p) => {
                    return {
                        ...p,
                        categoryName: c.name,
                        subCategoryName: item.label,
                    };
                });
            });
        });
        setLoading(false);
        setProducts(products);
        setSubCategories(subCategories);
    }

    useEffect(function () {
        fetchProducts();
    }, []);

    return (
        <div className="w-11/12 mx-auto my-6 h-full">
            <div className="flex justify-between items-center">
                <h1 className="mb-4 mt-2 text-2xl font-medium">Products</h1>
                <Button
                    className="bg-green-500 text-white"
                    onClick={() => handleProductAction("create")}
                >
                    <PlusIcon /> Product
                </Button>
            </div>
            <ProductDataTable
                products={products}
                loading={loading}
                handleProductAction={handleProductAction}
            />
            {actionType === "edit" && (
                <CategoryModal handleCloseModal={handleCloseModel}>
                    <ProductForm
                        currentData={currentData!}
                        subCategories={subCategories}
                        type={actionType}
                        refetchProducts={fetchProducts}
                        handleCloseModal={handleCloseModel}
                    />
                </CategoryModal>
            )}

            {actionType === "create" && (
                <CategoryModal handleCloseModal={handleCloseModel}>
                    <ProductForm
                        subCategories={subCategories}
                        type={actionType}
                        refetchProducts={fetchProducts}
                        handleCloseModal={handleCloseModel}
                    />
                </CategoryModal>
            )}
            {actionType === "delete" && (
                <CategoryModal>
                    <ConfirmForm
                        handleCancel={handleCloseModel}
                        handleConfirm={() =>
                            toast.promise(handleDelete, {
                                pending: "Processing deletion request...",
                            })
                        }
                    >
                        <div className="text-sm text-center">
                            <p>Are you sure you want to delete</p>
                            <b>{currentData?.name}?</b>
                        </div>
                    </ConfirmForm>
                </CategoryModal>
            )}
        </div>
    );
}
