import { useCart } from "@/contexts/CartContext";
import ProductCounter from "./ProductCounter";
import type { Product } from "./Products";

type Props = {
    product: Product;
};

export default function ProductCard({ product }: Props) {
    const productName =
        product.name.length <= 40
            ? product.name
            : product.name.slice(0, 40) + "...";
    const discountPrice = Number(
        (product.discount
            ? ((100 - product.discount) / 100) * product.price
            : 0
        ).toFixed(2)
    );
    const savings = (product.price - discountPrice).toFixed(2);
    const { addItem, items, updateItem } = useCart();

    const cartProduct = items.find((item) => item.product.id === product.id);
    const count = cartProduct?.quantity ?? 0;

    function handleIncrement() {
        if (!cartProduct) addItem(product);
        else updateItem(cartProduct.id, count + 1);
    }

    function handleDecrement() {
        updateItem(cartProduct!.id, count - 1);
    }
    return (
        <div
            className={`w-56 border border-neutral-200 rounded-md grid grid-rows-[auto_1fr] relative ${!product.isStock && "pointer-events-none"
                }`}
        >
            <div className="absolute left-2 top-0 z-10">
                {product.discount && (
                    <div className="relative">
                        <svg
                            width="29"
                            height="28"
                            viewBox="0 0 29 28"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M28.9499 0C28.3999 0 27.9361 1.44696 27.9361 2.60412V27.9718L24.5708 25.9718L21.2055 27.9718L17.8402 25.9718L14.4749 27.9718L11.1096 25.9718L7.74436 27.9718L4.37907 25.9718L1.01378 27.9718V2.6037C1.01378 1.44655 0.549931 0 0 0H28.9499Z"
                                fill="#538CEE"
                            ></path>
                        </svg>
                        <p className="text-white absolute flex justify-center items-center inset-0 text-center leading-[10px] text-[9px] font-extrabold">
                            {product.discount}% OFF
                        </p>
                    </div>
                )}
            </div>

            <div className="w-full h-40 relative">
                {!product.isStock && (
                    <p className="absolute z-10 top-20 left-0 -rotate-12 right-0 m-auto w-fit px-4 flex justify-center text-red-500 bg-red-50 border border-red-500 rounded-md items-center">
                        Out Of Stock
                    </p>
                )}
                <img
                    src={product.image}
                    className={`w-full h-full object-contain rounded-t-md ${!product.isStock && "opacity-55"
                        }`}
                    alt=""
                />
            </div>
            <div
                className={`p-4 text-neutral-800 flex flex-col justify-between ${!product.isStock && "opacity-55"
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
                                {savings}
                            </span>
                        )}
                    </div>
                    <ProductCounter
                        handleIncrement={handleIncrement}
                        handleDecrement={handleDecrement}
                        count={count}
                    />
                </div>
            </div>
        </div>
    );
}
