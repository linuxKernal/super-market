import { useCallback, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router";
import { useInfiniteQuery, useQueries } from "@tanstack/react-query";
import Spinner from "@/components/Spinner";
import ProductsList from "@/components/ProductsList";
import type { Product } from "@/components/Products";
import { useOnScreen } from "@/hooks/useOnScreen";
import {
    getCategory,
    getProductsBySubcategory,
    getSubcategories,
} from "@/services/categories";
import { unwrapResponse } from "@/services/api";

export type Category = {
    id: number;
    name: string;
    image: string;
    featured: boolean;
};

export type CreateCategory = Omit<Category, "id">;

export type SubCategory = {
    id: number;
    label: string;
    image: string;
    category_id: number;
};

export type CreateSubCategory = Omit<SubCategory, "id">;

export default function ProductsPage() {
    const { c_id } = useParams();

    const [searchParams, setSearchParams] = useSearchParams();
    const subCategoryState = searchParams.get("sub-category");

    const [
        { data: category, isPending: categoryLoading },
        { data: subcategories, isPending: subcategoryLoading },
    ] = useQueries({
        queries: [
            {
                queryKey: ["category", c_id],
                queryFn: () => getCategory(+c_id!),
                enabled: !!c_id,
                select: unwrapResponse<Category>,
            },
            {
                queryKey: ["subcategories", c_id],
                queryFn: () => getSubcategories(+c_id!),
                staleTime: 0,
                enabled: !!c_id,
                select: unwrapResponse<SubCategory[]>,
            },
        ],
    });

    const currentCategoryId = subCategoryState
        ? Number(subCategoryState)
        : subcategories?.data?.[0]?.id;

    const setUrlStateParam = useCallback(
        function (id: string) {
            const newParams = new URLSearchParams(searchParams);
            newParams.set("sub-category", id);
            setSearchParams(newParams, { replace: true });
        },
        [searchParams, setSearchParams]
    );

    const {
        isError,
        isLoading,
        data: products,
        isFetching,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteQuery({
        queryKey: ["products", c_id, currentCategoryId],
        queryFn: async ({ pageParam }) => {
            const apiResponse = await getProductsBySubcategory(
                +c_id!,
                currentCategoryId!,
                pageParam
            );

            if (apiResponse.status === "error") {
                throw new Error(apiResponse.error);
            }

            return {
                data: apiResponse.data,
                page: apiResponse.page,
                totalPages: apiResponse.total_pages,
            };
        },
        initialPageParam: 1,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        enabled: !!c_id && !!currentCategoryId,
        // select: unwrapResponse<Product[]>,
        getNextPageParam: ({
            page,
            totalPages,
        }: ReturnType<typeof unwrapResponse<Product[]>>) => {
            return page! < totalPages! ? page! + 1 : undefined;
        },
    });

    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }
    }, [currentCategoryId]);

    const [bottomElementRef, isBottomVisible] = useOnScreen({
        threshold: 0.1,
        rootMargin: "0px",
    });

    const hasFetchedForCurrentVisibility = useRef(false);

    useEffect(
        function () {
            if (!isBottomVisible) {
                hasFetchedForCurrentVisibility.current = false;
                return;
            }

            if (
                isBottomVisible &&
                !isLoading &&
                !isFetchingNextPage &&
                hasNextPage &&
                !hasFetchedForCurrentVisibility.current
            ) {
                hasFetchedForCurrentVisibility.current = true;
                fetchNextPage();
            }
        },
        [
            isBottomVisible,
            isLoading,
            isFetchingNextPage,
            fetchNextPage,
            hasNextPage,
        ]
    );

    const allProducts = products?.pages.flatMap((page) => page.data) || [];

    return (
        <div className="w-full md:w-10/12 mx-auto px-2 md:px-0">
            {categoryLoading ? (
                <h1 className="w-56 mt-4 h-8 animate-pulse bg-neutral-200 rounded-lg"></h1>
            ) : (
                <h1 className="mt-4 text-xl md:text-3xl font-semibold">
                    {category?.data?.name}
                </h1>
            )}

            <div className="border border-neutral-200 w-full h-auto md:h-[66vh] my-5 grid grid-cols-1 md:grid-cols-[10rem_1fr]">
                <div className="py-2 md:py-4 border-b md:border-b-0 md:border-r border-neutral-200 px-2 md:min-h-full relative">
                    {subcategoryLoading ? (
                        <div className="absolute top-0 bottom-0 left-0 right-0 m-auto h-fit w-fit">
                            <Spinner />
                        </div>
                    ) : subcategories && subcategories?.data?.length > 0 ? (
                        <ul className="flex md:grid gap-x-3 md:gap-x-0 md:gap-y-4 justify-start md:justify-center overflow-x-auto md:overflow-x-visible md:overflow-y-auto md:h-full pb-2 md:pb-0 scrollbar-thin-custom">
                            {subcategories?.data?.map((item) => {
                                const isActive = currentCategoryId === item.id;
                                return (
                                    <li
                                        key={item.id}
                                        role="button"
                                        className={`flex md:grid flex-col items-center justify-center border rounded-sm hover:bg-neutral-200/30 p-2 cursor-pointer w-20 md:w-auto flex-shrink-0 ${isActive
                                            ? "bg-neutral-300/10 border-neutral-200"
                                            : "border-transparent"
                                            }`}
                                        onClick={() =>
                                            setUrlStateParam(item.id.toString())
                                        }
                                    >
                                        <div className="mx-auto">
                                            <img
                                                className="size-14 md:size-20"
                                                src={item.image}
                                                alt={item.label}
                                            />
                                        </div>
                                        <p className="text-center text-xs md:text-base">
                                            {item.label}
                                        </p>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <h1 className="text-sm">No Sub Categories Found</h1>
                    )}
                </div>
                <div className="p-2 md:p-4 min-h-[50vh] md:min-h-full relative">
                    {isError ? (
                        <div className="absolute top-0 bottom-0 left-0 right-0 m-auto h-fit w-fit text-center">
                            <p className="text-red-500 text-lg">Failed to load products.</p>
                            <p className="text-neutral-400 text-sm">Please try again later.</p>
                        </div>
                    ) : (
                        <>
                            {currentCategoryId && allProducts.length > 0 && (
                                <ProductsList
                                    products={allProducts}
                                    scrollContainerRef={scrollContainerRef}
                                    bottomElementRef={bottomElementRef}
                                />
                            )}

                            {!allProducts?.length && !isFetching && (
                                <h1 className="absolute top-0 bottom-0 left-0 right-0 m-auto text-neutral-400 text-lg h-fit w-fit">
                                    No products found.
                                </h1>
                            )}

                            {isFetching && (
                                <div
                                    className={`absolute ${allProducts?.length > 0 ? "" : "top-0"
                                        } bottom-2 left-0 right-0 m-auto h-fit w-fit`}
                                >
                                    <Spinner />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// import { useCallback, useEffect, useRef, useState } from "react";
// import { useParams, useSearchParams } from "react-router";
// import { toast } from "react-toastify";
// import { useQueries } from "@tanstack/react-query";
// import { API_URL } from "@/config";
// import Spinner from "@/components/Spinner";
// import ProductsList from "@/components/ProductsList";
// import type { Product } from "@/components/Products";
// import { useOnScreen } from "@/hooks/useOnScreen";
// import { getCategory, getSubcategories } from "@/services/categories";
// import { unwrapResponse } from "@/services/api";

// export type Category = {
//     id: number;
//     name: string;
//     image: string;
//     featured: boolean;
// };

// export type CreateCategory = Omit<Category, "id">;

// export type SubCategory = {
//     id: number;
//     label: string;
//     image: string;
//     category_id: number;
// };

// export type CreateSubCategory = Omit<SubCategory, "id">;

// type SubCategoriesWithProductsAndPage = Record<
//     number,
//     {
//         page: number;
//         totalPages: number;
//         products: Product[];
//     }
// >;

// export default function ProductsPage() {
//     const { c_id } = useParams();

//     const [searchParams, setSearchParams] = useSearchParams();
//     const subCategoryState = searchParams.get("sub-category");

//     const [loading, setLoading] = useState({
//         products: true,
//     });

//     const [products, setProducts] = useState<SubCategoriesWithProductsAndPage>(
//         {}
//     );

//     const [
//         { data: category, isPending: categoryLoading },
//         { data: subcategories, isPending: subcategoryLoading },
//     ] = useQueries({
//         queries: [
//             {
//                 queryKey: ["category", c_id],
//                 queryFn: () => getCategory(+c_id!),
//                 enabled: !!c_id,
//                 select: unwrapResponse<Category>,
//             },
//             {
//                 queryKey: ["subcategories", c_id],
//                 queryFn: () => getSubcategories(+c_id!),
//                 staleTime: 0,
//                 enabled: !!c_id,
//                 select: unwrapResponse<SubCategory[]>,
//             },
//         ],
//     });

//     const currentCategoryId = subCategoryState
//         ? Number(subCategoryState)
//         : subcategories?.[0]?.id;

//     const productsFresh = useRef(products);
//     const scrollContainerRef = useRef<HTMLDivElement | null>(null);

//     const [bottomElementRef, isBottomVisible] = useOnScreen({
//         threshold: 0.1,
//         rootMargin: "0px",
//     });

//     const groupBySubCategories = useCallback(function groupBySubCategories(
//         items: Product[],
//         totalPages: number,
//         id?: number
//     ) {
//         setProducts((prevProducts) => {
//             const newProducts = { ...prevProducts };

//             if (id) {
//                 if (id in newProducts) {
//                     newProducts[id] = {
//                         ...newProducts[id],
//                         products: [...newProducts[id].products, ...items],
//                         page: newProducts[id].page + 1,
//                     };
//                 } else {
//                     newProducts[id] = {
//                         page: 1,
//                         totalPages,
//                         products: items,
//                     };
//                 }
//             } else {
//                 const groupByCategories = items.reduce((prev, curr) => {
//                     if (curr.categoryId in prev)
//                         prev[curr.categoryId].push(curr);
//                     else prev[curr.categoryId] = [curr];
//                     return prev;
//                 }, {} as Record<number, Product[]>);

//                 Object.entries(groupByCategories).forEach(([, value]) => {
//                     const catId = value[0].categoryId;
//                     if (catId in newProducts) {
//                         newProducts[catId] = {
//                             ...newProducts[catId],
//                             products: [
//                                 ...newProducts[catId].products,
//                                 ...value,
//                             ],
//                         };
//                     } else {
//                         newProducts[catId] = {
//                             page: 1,
//                             totalPages: NaN,
//                             products: value,
//                         };
//                     }
//                 });
//             }
//             productsFresh.current = newProducts;
//             return newProducts;
//         });
//     },
//     []);

//     const fetchingRef = useRef(false);

//     const fetchProducts = useCallback(
//         async function (sc_id: number) {
//             if (fetchingRef.current) return;
//             const currentPage =
//                 sc_id && productsFresh.current && productsFresh.current[sc_id]
//                     ? productsFresh.current[sc_id].page
//                     : 0;

//             const nextPage = currentPage + 1;

//             if (sc_id && nextPage > productsFresh.current[sc_id]?.totalPages)
//                 return;
//             fetchingRef.current = true;
//             setLoading((prev) => ({
//                 ...prev,
//                 products: true,
//             }));

//             const res = await fetch(
//                 `${API_URL}/categories/${c_id}${
//                     sc_id ? `/subcategories/${sc_id}` : ""
//                 }/products?page=${nextPage}&size=8`
//             );
//             const resData = await res.json();

//             if (resData.status === "success") {
//                 const { data }: { data: Product[] } = resData;
//                 groupBySubCategories(data, resData.total_pages, sc_id);
//                 fetchingRef.current = false;
//             } else {
//                 toast.error("Failed to load products");
//             }

//             fetchingRef.current = false;
//             setLoading((prev) => ({
//                 ...prev,
//                 products: false,
//             }));
//         },
//         [c_id, groupBySubCategories]
//     );

//     const setUrlStateParam = useCallback(
//         function (id: string) {
//             const newParams = new URLSearchParams(searchParams);
//             newParams.set("sub-category", id);
//             setSearchParams(newParams, { replace: true });
//         },
//         [searchParams, setSearchParams]
//     );

//     useEffect(
//         function () {
//             if (isBottomVisible && currentCategoryId) {
//                 fetchProducts(currentCategoryId);
//             }
//         },
//         [isBottomVisible, currentCategoryId, fetchProducts]
//     );

//     if (!currentCategoryId && subcategories?.length) {
//         setUrlStateParam(subcategories[0].id.toString());
//     }

//     useEffect(() => {
//         if (scrollContainerRef.current) {
//             scrollContainerRef.current.scrollTo({
//                 top: 0,
//                 behavior: "smooth",
//             });
//         }
//     }, [currentCategoryId]);

//     return (
//         <div className="w-10/12 mx-auto">
//             {categoryLoading ? (
//                 <h1 className="w-56 mt-4 h-8 animate-pulse bg-neutral-200 rounded-lg"></h1>
//             ) : (
//                 <h1 className="mt-4 text-3xl font-semibold">
//                     {category?.name}
//                 </h1>
//             )}

//             <div className="border border-neutral-200 w-full h-[66vh]  my-5 grid grid-cols-[10rem_1fr]">
//                 <div className="py-4 border-r border-neutral-200 px-2 min-h-full relative">
//                     {subcategoryLoading ? (
//                         <div className="absolute top-0 bottom-0 left-0 right-0 m-auto h-fit w-fit">
//                             <Spinner />
//                         </div>
//                     ) : subcategories && subcategories?.length > 0 ? (
//                         <ul className="grid gap-y-4 justify-center overflow-y-auto h-full scrollbar-thin-custom">
//                             {subcategories?.map((item) => {
//                                 const isActive = currentCategoryId === item.id;
//                                 return (
//                                     <li
//                                         className={`grid justify-center border rounded-sm hover:bg-neutral-200/30 p-2 ${
//                                             isActive
//                                                 ? "bg-neutral-300/10 border-neutral-200"
//                                                 : "border-transparent"
//                                         }`}
//                                         onClick={() =>
//                                             setUrlStateParam(item.id.toString())
//                                         }
//                                     >
//                                         <div className="mx-auto">
//                                             <img
//                                                 className="size-20"
//                                                 src={item.image}
//                                                 alt=""
//                                             />
//                                         </div>
//                                         <p className="text-center">
//                                             {item.label}
//                                         </p>
//                                     </li>
//                                 );
//                             })}
//                         </ul>
//                     ) : (
//                         <h1 className="text-sm">No Sub-Categories Found</h1>
//                     )}
//                 </div>
//                 <div className="p-4 min-h-full relative">
//                     {currentCategoryId &&
//                         products[currentCategoryId]?.products.length > 0 && (
//                             <ProductsList
//                                 products={products[currentCategoryId!].products}
//                                 scrollContainerRef={scrollContainerRef}
//                                 bottomElementRef={bottomElementRef}
//                             />
//                         )}

//                     {Object.keys(products).length === 0 &&
//                         !loading.products &&
//                         !!currentCategoryId && (
//                             <h1 className="absolute top-0 bottom-0 left-0 right-0 m-auto text-neutral-400 text-lg h-fit w-fit">
//                                 No products found.
//                             </h1>
//                         )}

//                     {loading.products && (
//                         <div
//                             className={`absolute ${
//                                 products[currentCategoryId!]?.products.length >
//                                 0
//                                     ? ""
//                                     : "top-0"
//                             } bottom-2 left-0 right-0 m-auto h-fit w-fit`}
//                         >
//                             <Spinner />
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }
