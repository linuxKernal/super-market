import TextInput from "./TextInput";
import { type SubCategoryForm } from "@/pages/CategoriesPage";
import InputImage from "./InputImage";

type Props = {
    handleFormData: React.Dispatch<
        React.SetStateAction<SubCategoryForm | undefined>
    >;
    data?: Partial<SubCategoryForm>;
    title: string;
    loading: boolean;
    handleSubmit: () => void;
};

export default function SubCategoryForm({
    handleFormData,
    title,
    handleSubmit,
    loading,
    data,
}: Props) {
    function handleFormInput<K extends keyof SubCategoryForm>(
        e: HTMLInputElement,
        propertyName: K
    ) {
        // Make it resuable
        const isImg = e.type === "file";
        const value = isImg ? (e.files![0]! as File) : (e.value as string);
        handleFormData((prev) => {
            const data = {
                ...(prev || {}),
                [propertyName]: value,
            } as SubCategoryForm;
            if (isImg) {
                data.image = URL.createObjectURL(value as File);
            }
            data[propertyName] = value as SubCategoryForm[K];
            return data;
        });
    }
    return (
        <div className="bg-white w-96 rounded-sm p-4 relative">
            <h2 className="text-xl pb-4 capitalize">{title}</h2>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
                className="space-y-4"
            >
                <TextInput
                    placeholder="Sub Category"
                    id="subcategory_name"
                    defaultValue={data?.label ?? ""}
                    handleInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFormInput(e.target, "label")
                    }
                />

                <InputImage
                    preview={data?.image ?? ""}
                    handleInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleFormInput(e.target, "file")
                    }
                />
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
