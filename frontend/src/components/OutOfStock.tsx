import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Package } from "lucide-react";
import ProductListCard from "./ProductListCard";
import type { CartItem } from "@/contexts/CartContext";

type Props = {
    products: CartItem[];
};

export default function OutOfStock({ products }: Props) {
    return (
        <div className="">
            <Collapsible
                className="rounded-sm bg-red-50 border border-red-300"
                defaultOpen
            >
                <CollapsibleTrigger className="text-red-500 rounded-t-sm rounded-b-sm p-2 flex w-full items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                        <Package />
                        Out of stock products
                    </span>
                    <ChevronDown />
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2 rounded-b-sm border-t border-t-red-300 divide-y-[1px] divide-red-200">
                    {products.map((item) => {
                        return <ProductListCard product={item.product} />;
                    })}
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
