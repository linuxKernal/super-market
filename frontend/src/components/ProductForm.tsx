import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { BadgePercent, IndianRupee, SearchIcon, Warehouse } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import {
    Field,
    FieldContent,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Button } from "./ui/button";
import { units } from "@/constants";
import type { SubCategory } from "@/pages/ProductsPage";
import { Input } from "./ui/input";
import ToggleSwitch from "./ToggleSwitch";
import { changePropertyCase, getChangedFields, uploadProductImage } from "@/lib/utils";
import type { Product } from "./Products";
import { toast } from "react-toastify";
import { createResource, updateResource } from "@/services/api";

type BaseProps = {
    subCategories: Omit<SubCategory, "products">[];
    refetchProducts: () => void;
    handleCloseModal: () => void;
};

type Props =
    | ({
        type: "create";
        currentData?: undefined;
    } & BaseProps)
    | ({
        type: "edit";
        currentData: Product;
    } & BaseProps);

export type NewProduct = Omit<Product, "id">;

const MAX_FILE_SIZE = 2e7;
const ACCEPTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

const imageFileSchema = z.preprocess(
    (val: FileList) => (val.length ? val : undefined),
    z
        .instanceof(FileList, { message: "File is required." })
        .refine((file) => file.length > 0)
        .refine((file) => file?.[0]?.size <= MAX_FILE_SIZE, {
            message: `Max file size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
        })
        .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file?.[0]?.type), {
            message: "Only .jpg, .jpeg, .png, and .webp formats are accepted.",
        })
);
const baseSchema = z.object({
    name: z
        .string()
        .refine((value) => value.length > 0, "Product name is required")
        .min(2, "Name must be at least 2 characters.")
        .max(100, "Name cannot exceed 100 characters.")
        .trim(),
    brandName: z
        .string()
        .refine((value) => value.length > 0, "Brand name is required")
        .min(2, "Brand name must be at least 2 characters.")
        .max(100, "Brand name cannot exceed 100 characters.")
        .trim(),

    price: z
        .number("Price is required")
        .positive("Price must be a positive number.")
        .min(1, "Price must be greater than zero.")
        .max(999999, "Price is too high."),
    // discount: z
    //     .preprocess(
    //         (val) => {
    //             return val === null ? undefined : val;
    //         },

    //         z
    //             .float32("Price must be a number.")
    //             .positive("Discount must be a positive number.")
    //             .min(0.1, "Discount must be greater than zero.")
    //             .max(100, "Discount is too high.")
    //             .optional()
    //     )
    //     .optional(),
    discount: z
        .float32("Price must be a number.")
        .positive("Discount must be a positive number.")
        .min(0.1, "Discount must be greater than zero.")
        .max(100, "Discount is too high.")
        .nullable()
        .optional(),

    categoryId: z.number("Category is required").positive(),

    stocks: z
        .number("Stocks is required")
        .int("Stocks must be a whole number.")
        .min(1, "Stock quantity must be at least 1.")
        .max(9999, "Stock quantity is too high."),
    // isStock: z.boolean().default(true),
    active: z.boolean(),

    weight: z
        .number("Weight is required")
        .positive("Weight must be a positive number.")
        .min(0.01, "Weight must be greater than zero."),

    unit: z
        .string()
        .min(1, "Unit is required.")
        .max(10, "Unit is too long.")
        .trim(),
});

const editSchema = baseSchema.extend({
    image: imageFileSchema.nullish().optional(),
});

const createSchema = baseSchema.extend({
    image: imageFileSchema,
});

type CombinedProductData =
    | z.infer<typeof createSchema>
    | z.infer<typeof editSchema>;

export default function ProductForm({
    type,
    currentData,
    refetchProducts,
    handleCloseModal,
    subCategories,
}: Props) {
    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(type === "create" ? createSchema : editSchema),
        ...(type === "edit"
            ? {
                defaultValues: {
                    name: currentData.name,
                    price: currentData.price,
                    weight: currentData.weight,
                    categoryId: currentData.categoryId,
                    brandName: currentData.brandName,
                    discount: currentData.discount,
                    stocks: currentData.stocks,
                    unit: currentData.unit,
                    active: currentData.active,
                },
            }
            : {}),
    });

    const [preview, setPreview] = useState<string>(currentData?.image ?? "");
    const [imageLoaded, setImageLoaded] = useState(false);
    const [formSubmitting, setFormSubmitting] = useState(false);

    const imageFile = watch("image");

    useEffect(
        function () {
            console.log(imageFile);

            if (imageFile?.[0] instanceof File)
                setPreview(URL.createObjectURL(imageFile[0]));
        },
        [imageFile]
    );

    console.log("render");

    async function onSubmit(data: CombinedProductData) {
        setFormSubmitting(true);
        if (type === "edit") {
            let changedFields = getChangedFields<Partial<Product>>(
                currentData,
                {
                    ...data,
                    ...(data.image
                        ? {
                            image: await uploadProductImage(
                                data.image[0],
                            ),
                        }
                        : { image: currentData.image }),
                }
            );

            changedFields = changePropertyCase(changedFields);

            if (Object.keys(changedFields).length == 0) {
                toast.warn("No changes to update");
                return;
            }

            const resData = await updateResource({
                resource: `products/${currentData.id}`,
                payload: changedFields,
            });

            if (resData.status === "success") {
                refetchProducts();
                toast.success("Successfully Product Updated");
            } else toast.error("error occured when updating the product");
        } else if (type === "create") {
            const createData = data as z.infer<typeof createSchema>;

            const resData = await createResource({
                resource: `products`,
                payload: {
                    ...changePropertyCase(createData),
                    is_stock: true,
                    image: await uploadProductImage(createData.image[0]),
                },
            });

            if (resData.status === "success") {
                refetchProducts();
                toast.success("Successfully created product");
            } else toast.error("error occured when creating the product");
        }
        setFormSubmitting(false);
        handleCloseModal();
    }
    return (
        <div className="bg-white p-8 w-[700px] rounded-sm overflow-y-auto scrollbar-thin-custom">
            <h1
                className={`text-2xl font-medium ${(errors.categoryId || errors.name) && "pb-4"
                    }`}
            >
                {type === "create" ? "Add" : "Update"} Product
            </h1>
            <form className="grid w-full" onSubmit={handleSubmit(onSubmit)}>
                <FieldGroup>
                    <div
                        className={`grid grid-cols-[1fr_1fr_auto] gap-x-4 ${errors.categoryId || errors.name ? "" : "items-end"
                            }`}
                    >
                        <Field>
                            <FieldLabel htmlFor="product_name">
                                Product Name
                            </FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    placeholder="apple"
                                    id="product_name"
                                    {...register("name")}
                                />
                                <InputGroupAddon>
                                    <SearchIcon />
                                </InputGroupAddon>
                            </InputGroup>
                            {errors.name && (
                                <FieldError errors={[errors.name]} />
                            )}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="sub_category">
                                Category
                            </FieldLabel>
                            <Controller
                                name="categoryId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        name={field.name}
                                        value={String(field.value)}
                                        onValueChange={(value) =>
                                            field.onChange(+value)
                                        }
                                    >
                                        <SelectTrigger
                                            className="w-full"
                                            id="sub_category"
                                        >
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            {subCategories.map((sub) => {
                                                return (
                                                    <SelectItem
                                                        key={sub.id}
                                                        value={String(sub.id)}
                                                        className="hover:bg-black/10"
                                                    >
                                                        {sub.label}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.categoryId && (
                                <FieldError errors={[errors.categoryId]} />
                            )}
                        </Field>
                        <div className="size-28">
                            {!imageLoaded && type === "edit" && (
                                <div className="animate-pulse bg-neutral-100 rounded-sm size-28" />
                            )}
                            {preview ? (
                                <img
                                    src={preview}
                                    onLoad={() => setImageLoaded(true)}
                                    className={`transition-opacity duration-500 ${imageLoaded
                                        ? "opacity-100"
                                        : "opacity-0"
                                        }`}
                                    alt=""
                                />
                            ) : (
                                <div className="opacity-20 bg-neutral-300 p-8 rounded-sm border border-neutral-300">
                                    <img
                                        className="object-contain"
                                        src="https://cdn-icons-png.flaticon.com/512/1687/1687806.png"
                                        alt=""
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-x-4">
                        <Field>
                            <FieldLabel htmlFor="brand_name">
                                Brand Name
                            </FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    placeholder="brand"
                                    id="brand_name"
                                    {...register("brandName")}
                                />
                                <InputGroupAddon>
                                    <SearchIcon />
                                </InputGroupAddon>
                            </InputGroup>
                            {errors.brandName && (
                                <FieldError errors={[errors.brandName]} />
                            )}
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="price">Price</FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    type="number"
                                    id="price"
                                    placeholder="Price"
                                    {...register("price", {
                                        valueAsNumber: true,
                                    })}
                                />
                                <InputGroupAddon>
                                    <IndianRupee />
                                </InputGroupAddon>
                            </InputGroup>
                            {errors.price && (
                                <FieldError errors={[errors.price]} />
                            )}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="weight">Weight</FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    type="number"
                                    className="appearance-none"
                                    placeholder="Weight"
                                    {...register("weight", {
                                        valueAsNumber: true,
                                    })}
                                />

                                <InputGroupAddon align="inline-end">
                                    <Controller
                                        name="unit"
                                        control={control}
                                        render={({ field }) => (
                                            <Select
                                                name={field.name}
                                                value={String(field.value)}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger
                                                    className="border-none shadow-none px-0 w-fit"
                                                    id="unit"
                                                >
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    {units.map((unit) => {
                                                        return (
                                                            <SelectItem
                                                                key={unit}
                                                                value={unit}
                                                                className="hover:bg-black/10"
                                                            >
                                                                {unit}
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </InputGroupAddon>
                            </InputGroup>
                            {errors.weight && (
                                <FieldError errors={[errors.weight]} />
                            )}
                        </Field>
                    </div>

                    <div
                        className={`grid grid-cols-3 ${errors.stocks || errors.discount
                            ? "items-center"
                            : "items-end"
                            } gap-x-4`}
                    >
                        <Field>
                            <FieldLabel htmlFor="stock">Stock</FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    type="number"
                                    {...register("stocks", {
                                        valueAsNumber: true,
                                    })}
                                    id="stock"
                                    placeholder="Stock"
                                />
                                <InputGroupAddon>
                                    <Warehouse />
                                </InputGroupAddon>
                            </InputGroup>
                            {errors.stocks && (
                                <FieldError errors={[errors.stocks]} />
                            )}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="discount">Discount</FieldLabel>
                            <InputGroup>
                                <InputGroupInput
                                    type="number"
                                    {...register("discount", {
                                        valueAsNumber: true,
                                    })}
                                    id="discount"
                                    placeholder="discount"
                                />
                                <InputGroupAddon>
                                    <BadgePercent />
                                </InputGroupAddon>
                            </InputGroup>
                            {errors.discount && (
                                <FieldError errors={[errors.discount]} />
                            )}
                        </Field>
                        <Field
                            orientation="horizontal"
                            className="!items-center"
                        >
                            <Controller
                                name="active"
                                control={control}
                                render={({ field }) => (
                                    <ToggleSwitch
                                        checked={field.value}
                                        id={"active"}
                                        handleToggle={field.onChange}
                                    />
                                )}
                            />
                            <FieldContent className="mb-1">
                                <FieldLabel htmlFor="active">
                                    Inactive / Active
                                </FieldLabel>
                            </FieldContent>
                        </Field>
                    </div>

                    <Field>
                        <FieldLabel htmlFor="picture">Image</FieldLabel>
                        <Input
                            id="picture"
                            type="file"
                            {...register("image")}
                        />
                        {errors.image && <FieldError errors={[errors.image]} />}
                    </Field>

                    <Button
                        type="submit"
                        disabled={formSubmitting}
                        className="bg-green-500 text-white w-24 disabled:opacity-50"
                    >
                        {formSubmitting ? "saving..." : "save"}
                    </Button>
                </FieldGroup>
            </form>
        </div>
    );
}
