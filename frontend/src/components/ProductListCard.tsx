import { useCart } from "@/contexts/CartContext";
import ProductCounter from "./ProductCounter";
import type { Product } from "./Products";
import { getDiscountPrice } from "@/lib/utils";
import { X } from "lucide-react";

type Props = {
    product: Product;
};

const NAME_LIMIT = 30;

function ProductListCard({ product }: Props) {
    const productName =
        product.name.length <= NAME_LIMIT
            ? product.name
            : product.name.slice(0, NAME_LIMIT) + "...";

    const { discountPrice, saved } = getDiscountPrice(
        product.price,
        product.discount
    );

    const { addItem, items, updateItem, removeItem } = useCart();

    const cartProduct = items.find((item) => item.product.id === product.id);
    const count = cartProduct?.quantity ?? 0;

    function handleIncrement() {
        if (!cartProduct) addItem(product);
        else updateItem(cartProduct.id, count + 1);
    }

    function handleDecrement() {
        updateItem(cartProduct!.id, count - 1);
    }

    function handleRemoveCartItem() {
        removeItem(cartProduct!.id);
    }

    return (
        <div
            className={`w-full grid grid-cols-[auto_1fr_auto] gap-2 items-center relative`}
        >
            {!product.isStock && (
                <button
                    onClick={handleRemoveCartItem}
                    className="absolute top-2 flex p-0.5 justify-center text-red-500 hover:!bg-red-500 hover:text-white items-center right-2  border border-red-500 rounded-full"
                >
                    <X className="size-4" />
                </button>
            )}
            <div className="w-20 h-20 relative border border-neutral-200 rounded-md">
                <img
                    src={product.image}
                    className={`w-full h-full object-cover rounded-t-md rounded-md ${
                        !product.isStock && "opacity-70"
                    }`}
                    alt=""
                />
            </div>
            {!product.isStock && (
                <p className="absolute z-10 top-0 bottom-0 h-fit select-none -rotate-6 border border-red-400 bg-red-50 left-0 text-sm right-0 m-auto px-2 py-1 w-max flex justify-center text-red-500 rounded-md items-center">
                    Out Of Stock
                </p>
            )}
            <div
                className={`p-4 text-neutral-800 flex flex-col justify-between ${
                    !product.isStock && "opacity-70"
                }`}
            >
                <div className="space-y-1">
                    <h1 className="text-sm font-semibold">{productName}</h1>
                    <p className="text-neutral-600">
                        {product.weight} {product.unit}
                    </p>
                </div>
                <div className="flex justify-between items-center mt-3">
                    <div className="flex gap-1 items-center flex-wrap">
                        {product.discount && (
                            <b className="font-bold leading-3 flex">
                                <p className="font-sans">&#8377;</p>
                                {discountPrice}
                            </b>
                        )}

                        <b
                            className={
                                product.discount
                                    ? "line-through text-neutral-400 font-medium text-sm leading-3"
                                    : ""
                            }
                        >
                            &#8377;{product.price}
                        </b>
                        {product.discount && (
                            <span className="text-green-500 flex gap-1 text-sm w-full shrink-0">
                                <p>SAVE</p> <p className="font-sans">&#8377;</p>
                                {saved}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div
                className={`${
                    !product.isStock &&
                    "opacity-70 cursor-not-allowed pointer-events-none"
                }`}
            >
                <ProductCounter
                    handleDecrement={handleDecrement}
                    handleIncrement={handleIncrement}
                    count={count}
                />
            </div>
        </div>
    );
}

export default ProductListCard;
