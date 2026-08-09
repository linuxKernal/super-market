import TextInput from "./TextInput";
import CheckBox from "./CheckBox";
import { type Action, type CategoryForm } from "@/pages/CategoriesPage";
import InputImage from "./InputImage";
import { useState, type FormEvent } from "react";

type Props = {
    handleCategorySubmit: (data: CategoryForm) => Promise<void>;
    data: CategoryForm;
    title: string;
    actionType: Action;
    loading: boolean;
};

export default function CategoryForm({
    handleCategorySubmit,
    title,
    data,
    actionType,
    loading,
}: Props) {
    const [category, setCategory] = useState<CategoryForm>(data);
    const [errors, setErrors] = useState({
        name: "",
        image: "",
    });
    function handleFormInput<K extends keyof CategoryForm>(
        e: HTMLInputElement,
        propertyName: K
    ) {
        const isImg = e.type === "file";
        const value = isImg
            ? (e.files![0]! as File)
            : e.type === "checkbox"
            ? e.checked
            : (e.value as string);
        setCategory((prev) => {
            const data: CategoryForm = { ...prev, [propertyName]: value };
            if (isImg) {
                data.image = URL.createObjectURL(value as File);
            }
            data[propertyName] = value as CategoryForm[K];
            return data;
        });
    }
    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (category.name.trim() === "") {
            setErrors((prev) => ({
                ...prev,
                name: "Category Name is required",
            }));
            return;
        } else
            setErrors((prev) => ({
                ...prev,
                name: "",
            }));
        if (!category.file && actionType === "create") {
            setErrors((prev) => ({
                ...prev,
                image: "Category Image is required",
            }));
            return;
        } else
            setErrors((prev) => ({
                ...prev,
                image: "",
            }));
        handleCategorySubmit(category);
    }
    return (
        <div className="bg-white w-96 rounded-sm p-4 relative">
            <h2 className="text-xl pb-4 capitalize">{title}</h2>
            <form onSubmit={handleSubmit} className="">
                <TextInput
                    placeholder="Category"
                    id="category_name"
                    defaultValue={category.name}
                    handleInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFormInput(e.target, "name")
                    }
                />
                <p className="text-red-500 text-sm">{errors.name}</p>
                <div className="w-full mt-1 mb-4">
                    <CheckBox
                        label="Featured"
                        defaultValue={category.featured}
                        handleInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleFormInput(e.target, "featured")
                        }
                    />
                </div>
                <InputImage
                    preview={category.image}
                    handleInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFormInput(e.target, "file")
                    }
                />
                <p className="text-red-500 text-sm">{errors.image}</p>
                <div className="mt-8">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-sky-500 text-white py-2 w-full rounded-sm disabled:bg-sky-300"
                    >
                        {loading ? "saving..." : "save"}
                    </button>
                </div>
            </form>
        </div>
    );
}
