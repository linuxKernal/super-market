import { type Product } from "./Products";
import ProductCard from "./ProductCard";
import type { RefObject } from "react";

type Props = {
    products: Product[];
    scrollContainerRef: RefObject<HTMLDivElement | null>;
    bottomElementRef: RefObject<null>;
};

export default function ProductsList({
    products,
    scrollContainerRef,
    bottomElementRef,
}: Props) {
    return (
        <div
            className="flex gap-3 sm:gap-4 md:gap-6 flex-wrap justify-center px-0 md:px-2 md:justify-start overflow-y-auto h-full items-start scrollbar-thin-custom"
            ref={scrollContainerRef}
        >
            {products.map((item) => {
                return <ProductCard key={item.id} product={item} />;
            })}

            <div ref={bottomElementRef} className="w-full h-[1px]"></div>
        </div>
    );
}
