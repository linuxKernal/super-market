import { useAppContext } from "@/contexts/AppContext";
import CategoryForm from "@/components/CategoryForm";
import SubCategoryForm from "@/components/SubCategoryForm";
import CategoryModal from "@/components/CategoryModal";
import { API_URL } from "@/config";
import { Trash2, Edit, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/components/Products";
import ConfirmForm from "@/components/ConfirmForm";
import { toast } from "react-toastify";
import { getChangedFields, uploadCategoryImage } from "@/lib/utils";
import { type CreateCategory, type SubCategory } from "./ProductsPage";
import { createResource, deleteResource, updateResource } from "@/services/api";

export type SubCategoryWithProducts = {
    id: number;
    label: string;
    image: string;
    category_id: number;
    products: Product[];
};

export type CategoryWithSubCategories = {
    id: number;
    name: string;
    image: string;
    featured: boolean;
    subCategories: SubCategoryWithProducts[];
};

type CategoryType = "category" | "subCategory";

interface DeleteState {
    type: CategoryType;
    id: number;
}

export type CategoryForm = {
    id?: number;
    name: string;
    featured: boolean;
    file?: File;
    image?: string;
};

export type SubCategoryForm = {
    id: number;
    label: string;
    image?: string;
    file?: File;
};

export type Action = "edit" | "create";

export default function CategoriesPage() {
    const { setShowOverlay } = useAppContext();
    const [categories, setCategories] = useState<CategoryWithSubCategories[]>(
        []
    );
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [subCategoryFormData, setSubCategoryFormData] =
        useState<SubCategoryForm>();
    const [actionType, setActionType] = useState<Action>("create");
    const [deleteState, setDeleteState] = useState<DeleteState>();
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [currentForm, setCurrentForm] = useState<CategoryType | null>(null);
    const [currentCategoryId, setCurrentCategoryId] = useState<number>();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredCategories = useMemo(
        () =>
            categories.filter((category) =>
                category.name.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [categories, searchQuery]
    );

    const currentCategory = useMemo(
        () => categories.find((item) => item.id === currentCategoryId),
        [currentCategoryId, categories]
    );

    const [subCategory, setSubcategory] = useState<CategoryWithSubCategories>();

    async function fetchCategories() {
        setLoading(true);
        const res = await fetch(`${API_URL}/categories`);
        const { data } = await res.json();
        setCategories(data);
        setLoading(false);
    }

    useEffect(() => {
        fetchCategories();
    }, []);

    function showSubCategory(param: CategoryWithSubCategories) {
        setSubcategory(param);
    }

    function showModalForm(type: CategoryType, action: Action) {
        setActionType(action);
        setShowOverlay(true);
        setCurrentForm(type);
    }

    function handleAddCategory() {
        showModalForm("category", "create");
    }

    function handleAddSubCategory() {
        showModalForm("subCategory", "create");
    }

    async function handleCreateCategoryData(data: CategoryForm) {
        const payload: CreateCategory = {
            name: data.name,
            image: "",
            featured: data.featured,
        };

        if (data.file) payload.image = await uploadCategoryImage(data.file);

        const resData = await createResource<CategoryWithSubCategories>({
            resource: "categories",
            payload,
        });

        if (resData.status === "success") {
            setCategories((prev) => [...prev, resData.data]);
            setSearchQuery("");
            toast.success(
                <span>
                    <b>{data.name}</b> category created
                </span>
            );
            handleCloseCategoryModal();
        } else {
            toast.error(resData.error);
        }
    }

    async function handleCreateSubCategoryData(data: SubCategoryForm) {
        const payload = {
            label: data.label,
            image: "",
            category_id: subCategory!.id,
        };

        if (data.file) payload.image = await uploadCategoryImage(data.file);

        const resData = await createResource<SubCategory>({
            resource: "sub-categories",
            payload,
        });

        if (resData.status === "success") {
            await fetchCategories();
            toast.success(
                <span>
                    <b>{data.label}</b> sub category created
                </span>
            );
            handleCloseCategoryModal();
        } else {
            toast.error(resData.error);
        }
    }

    async function handleEditCategoryData(data: CategoryForm) {
        const payload = getChangedFields<CategoryForm>(currentCategory!, {
            name: data.name,
            featured: data.featured,
        });

        if (data.file) payload.image = await uploadCategoryImage(data.file);

        const resData = await updateResource<CategoryWithSubCategories>({
            resource: `categories/${currentCategoryId}`,
            payload,
        });

        if (resData.status === "success") {
            setCategories((prev) => [
                ...prev.filter((item) => item.id !== currentCategoryId),
                resData.data,
            ]);

            toast.success(
                <span>
                    <b>{data.name}</b> category Updated
                </span>
            );
            handleCloseCategoryModal();
        } else {
            toast.error(resData.error);
        }
    }

    async function handleEditSubCategoryData(data: SubCategoryForm) {
        const currentSubCategory = subCategory!.subCategories.find(
            (item) => item.id === subCategoryFormData?.id
        )!;
        const payload = getChangedFields<Partial<SubCategoryForm>>(
            {
                label: currentSubCategory.label,
            },
            {
                label: data.label,
            }
        );

        if (data.file) payload.image = await uploadCategoryImage(data.file);

        const resData = await updateResource<SubCategory>({
            resource: `sub-categories/${subCategoryFormData!.id}`,
            payload,
        });

        if (resData.status === "success") {
            setSubcategory((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    subCategories: prev.subCategories.map((item) =>
                        item.id === resData.data.id
                            ? { ...item, ...resData.data }
                            : item
                    ),
                };
            });
            await fetchCategories();
            toast.success(
                <span>
                    <b>{data.label}</b> sub category Updated
                </span>
            );
            handleCloseCategoryModal();
        } else {
            toast.error(resData.error);
        }
    }

    async function handleCategorySubmit(data: CategoryForm) {
        setFormSubmitting(true);
        if (actionType === "create") await handleCreateCategoryData(data);
        else await handleEditCategoryData(data);
        setFormSubmitting(false);
    }

    async function handleSubCategorySubmit() {
        setFormSubmitting(true);
        if (actionType === "create")
            await handleCreateSubCategoryData(subCategoryFormData!);
        else await handleEditSubCategoryData(subCategoryFormData!);
        setFormSubmitting(false);
    }

    function handleEditCategory(data: CategoryWithSubCategories) {
        setCurrentCategoryId(data.id);
        showModalForm("category", "edit");
    }

    function handleEditSubCategory(data: SubCategory) {
        setSubCategoryFormData({
            id: data.id,
            label: data.label,
            image: data.image,
        });
        showModalForm("subCategory", "edit");
    }

    function handleShowConfirmModal(id: number, type: CategoryType) {
        setDeleteState({ id, type });
        setShowOverlay(true);
        setShowConfirm(true);
    }

    function handleHideConfirmModal() {
        setShowOverlay(false);
        setShowConfirm(false);
    }

    function handleCloseCategoryModal() {
        setCurrentCategoryId(undefined);
        setSubCategoryFormData(undefined);
        setShowOverlay(false);
        setCurrentForm(null);
    }

    async function handleDelete() {
        let resData;
        handleHideConfirmModal();
        if (deleteState?.type === "category") {
            resData = await deleteResource(`categories/${deleteState.id}`);
        } else if (deleteState?.type === "subCategory") {
            resData = await deleteResource(`sub-categories/${deleteState.id}`);
        }
        if (resData!.status === "success") {
            if (deleteState?.type === "category")
                setCategories((prev) =>
                    prev.filter((item) => item.id !== deleteState!.id)
                );
            else
                setCategories((prev) =>
                    prev.map((item) => {
                        if (item.id === subCategory?.id) {
                            item.subCategories = item.subCategories.filter(
                                (item) => item.id !== deleteState?.id
                            );
                        }
                        return item;
                    })
                );
            toast.success(`${deleteState?.type} deleted!`);
        } else
            toast.success(
                `Error occured when deleting the ${deleteState?.type}`
            );
    }

    return (
        <div className="grid grid-rows-[auto_auto_1fr] h-full pl-10 relative">
            <h1 className="text-xl py-4 font-semibold capitalize">
                Category & Subcategory
            </h1>
            <div className="flex items-end justify-between py-2 pr-10">
                <div className="w-64 space-y-1">
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border border-neutral-400 w-full p-1 rounded-sm outline-none ring-0 focus:outline-none"
                    />
                    <button
                        onClick={handleAddCategory}
                        className="text-green-500 border hover:bg-green-500 duration-150 hover:text-white rounded-sm border-green-500 py-1 px-4 w-full"
                    >
                        + Add Category
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-8 mr-10 h-11/12 overflow-y-auto">
                <ul className=" p-2 w-64 rounded-sm h-full border border-neutral-200 overflow-y-auto scrollbar-thin-custom">
                    {loading &&
                        Array.from({ length: 6 }, () => {
                            return (
                                <li className="flex gap-2 animate-pulse w-full h-16 items-center bg-zinc-100 mb-3 p-2 rounded-sm">
                                    <div className="size-10 bg-neutral-200 rounded-full"></div>
                                    <div className="space-y-2">
                                        <p className="w-32 py-1.5 bg-neutral-200 rounded-lg"></p>
                                        <p className="w-24 py-1.5 bg-neutral-200 rounded-lg"></p>
                                    </div>
                                </li>
                            );
                        })}
                    {filteredCategories.map((item) => {
                        const isActive = item.id === subCategory?.id;
                        return (
                            <li
                                key={item.id}
                                onClick={() => showSubCategory(item)}
                                className={`cursor-pointer hover:bg-black/10 px-2 rounded-sm ${isActive && "bg-black/10"
                                    } py-1 flex gap-2 items-center relative`}
                            >
                                <img
                                    className="w-11 h-10"
                                    src={item.image}
                                    alt=""
                                />
                                <div className="w-full">
                                    <p>{item.name}</p>
                                    {item.featured && (
                                        <div className="text-sky-500 border rounded-lg w-fit ml-auto border-sky-500 bg-sky-50 px-1 py-0.5 flex gap-1 items-center">
                                            <Star className="size-3" />
                                            <p className="text-[10px]">
                                                Featured
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>

                <div className="w-full border border-neutral-200 h-full rounded-sm py-4 relative">
                    {!subCategory && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-8">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center mb-6 animate-pulse">
                                <svg
                                    className="w-12 h-12 text-sky-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-neutral-700 mb-2">
                                Select a Category
                            </h3>
                            <p className="text-neutral-500 max-w-sm mb-6">
                                Choose a category from the left panel to view
                                and manage its subcategories
                            </p>
                            <div className="flex items-center gap-2 text-sm text-neutral-400">
                                <div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce"></div>
                                <span>
                                    Click on any category to get started
                                </span>
                            </div>
                        </div>
                    )}
                    {subCategory && (
                        <div className="flex justify-between mb-4 border-b border-neutral-200 px-4 pb-2">
                            <div className="flex gap-4 items-center">
                                <h3 className="text-lg font-medium">
                                    {subCategory?.name}
                                </h3>
                                <div className="flex gap-x-4 items-center">
                                    {subCategory.featured && (
                                        <span className="text-sky-500 border rounded-lg w-fit ml-auto border-sky-500 bg-sky-50 px-1 py-0.5 flex gap-1 items-center">
                                            <Star className="size-3" />
                                            <p className="text-[10px]">
                                                Featured
                                            </p>
                                        </span>
                                    )}
                                    <div className="space-x-2">
                                        <button
                                            onClick={() =>
                                                handleEditCategory(subCategory)
                                            }
                                            className="text-neutral-700  inline-block"
                                        >
                                            <Edit className="size-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (
                                                    subCategory.subCategories
                                                        .length
                                                ) {
                                                    toast.warn(
                                                        "Delete failed. Remove all subcategories first."
                                                    );
                                                } else {
                                                    handleShowConfirmModal(
                                                        subCategory.id,
                                                        "category"
                                                    );
                                                }
                                            }}
                                            className="text-red-600 inline-block"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <button
                                    onClick={handleAddSubCategory}
                                    className="text-green-500 border hover:bg-green-500 duration-150 hover:text-white rounded-sm border-green-500 py-1 px-4 w-full"
                                >
                                    + Add Sub Category
                                </button>
                            </div>
                        </div>
                    )}
                    <ul className="flex gap-2 items-center px-4">
                        {subCategory?.subCategories?.length === 0 && (
                            <h3>No Subcategories Found</h3>
                        )}
                        {subCategory?.subCategories?.map((item) => {
                            return (
                                <li className="flex gap-2 justify-items-start bg-neutral-100 p-2 rounded-sm border border-neutral-200 relative">
                                    <img
                                        className="size-10"
                                        src={item.image}
                                        alt=""
                                    />
                                    <p className="text-sm">{item.label}</p>
                                    <div className="absolute w-max -bottom-1 right-0 space-x-2">
                                        <button
                                            onClick={() =>
                                                handleEditSubCategory(item)
                                            }
                                            className="text-neutral-700  inline-block"
                                        >
                                            <Edit className="size-4" />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleShowConfirmModal(
                                                    item.id,
                                                    "subCategory"
                                                )
                                            }
                                            className="text-red-600 inline-block"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
            {showConfirm && (
                <CategoryModal handleCloseModal={handleHideConfirmModal}>
                    <ConfirmForm
                        handleCancel={handleHideConfirmModal}
                        handleConfirm={() =>
                            toast.promise(handleDelete, {
                                pending: "Processing deletion request...",
                            })
                        }
                    >
                        <h1 className="text-center">
                            Are you sure you want to delete this?
                        </h1>
                    </ConfirmForm>
                </CategoryModal>
            )}
            {currentForm === "category" && (
                <CategoryModal handleCloseModal={handleCloseCategoryModal}>
                    <CategoryForm
                        title={`${actionType} Category`}
                        actionType={actionType}
                        data={
                            currentCategory || {
                                name: "",
                                featured: false,
                            }
                        }
                        loading={formSubmitting}
                        handleCategorySubmit={handleCategorySubmit}
                    />
                </CategoryModal>
            )}
            {currentForm === "subCategory" && (
                <CategoryModal handleCloseModal={handleCloseCategoryModal}>
                    <SubCategoryForm
                        title={`${actionType} SubCategory`}
                        data={subCategoryFormData}
                        handleSubmit={handleSubCategorySubmit}
                        loading={formSubmitting}
                        handleFormData={setSubCategoryFormData}
                    />
                </CategoryModal>
            )}
        </div>
    );
}
