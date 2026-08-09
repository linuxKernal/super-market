import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { X, Tag } from "lucide-react";

export default function CheckOutDetails() {
    const {
        coupons,
        totalPrice,
        savedAmount,
        deliveryCharges,
        applyCouponCode,
        removeCouponCode,
        grandTotal,
    } = useCart();

    const [couponCode, setCouponCode] = useState<string>();
    const [couponError, setCouponError] = useState<string>();

    const isFreeDelivery = deliveryCharges === 0;

    async function handleCouponCode() {
        if (!couponCode?.trim()) return;

        try {
            await applyCouponCode(couponCode);
        } catch (error) {
            if (error instanceof Error) {
                setCouponError(error.message);
                setTimeout(function () {
                    setCouponError("");
                }, 5000);
            }
        }

        setCouponCode("");
    }

    return (
        <div className="bg-white text-neutral-800 rounded-md">
            <h1 className="mb-2 font-bold px-4 pt-4">Bill Details</h1>
            <div className="mb-3 px-4">
                <div className="mb-1">
                    <div className="flex gap-2 mb-0.5">
                        <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => {
                                if (couponError) setCouponError("");
                                setCouponCode(e.target.value);
                            }}
                            placeholder="Coupon code"
                            className={`w-full border px-2  ${
                                couponError
                                    ? "border-red-500"
                                    : "border-neutral-400"
                            } text-sm outline-none ring-0 focus:outline-none`}
                        />
                        <button
                            onClick={handleCouponCode}
                            disabled={!couponCode}
                            className={`px-4 py-1 bg-neutral-600 text-white ${
                                !couponCode
                                    ? "cursor-not-allowed"
                                    : "cursor-pointer"
                            }  disabled:opacity-40`}
                        >
                            Apply
                        </button>
                    </div>
                    {couponError && (
                        <p className="text-sm text-red-500">{couponError}</p>
                    )}
                </div>

                <div className="flex gap-2 flex-wrap">
                    {coupons.map(({ code }) => {
                        return (
                            <span className="flex gap-3 items-center bg-neutral-200 w-fit text-neutral-600 p-1">
                                <div className="flex items-center gap-2">
                                    <Tag className="size-4" />
                                    <b className="font-medium text-sm">
                                        {code}
                                    </b>
                                </div>
                                <button onClick={() => removeCouponCode(code)}>
                                    <X className="size-4 text-red-500" />
                                </button>
                            </span>
                        );
                    })}
                </div>
                {coupons.map(({ code, save }) => (
                    <p className="text-sm mt-2 text-green-600">
                        Coupon <b>{code}</b> applied! You saved <b>₹{save}</b>
                    </p>
                ))}
            </div>

            <div className="px-4 text-sm space-y-1">
                <div className="grid grid-cols-[1fr_auto]">
                    <div className="flex gap-2">
                        <p className="font-medium">Subtotal</p>
                        {savedAmount > 0 && (
                            <span className="flex bg-sky-100 text-blue-600 rounded-lg font-medium w-fit px-1 text-[10px] items-center">
                                <p className="mr-1">Saved</p>
                                <p className="font-sans">&#8377;</p>
                                <p>{savedAmount}</p>
                            </span>
                        )}
                    </div>
                    <div className="flex">
                        <p className="font-sans">&#8377;</p>
                        <p>{totalPrice}</p>
                    </div>
                </div>
                {coupons.map((c, index) => {
                    return (
                        <div className="grid grid-cols-[1fr_auto] text-red-500">
                            <div className="">
                                <p className="font-medium">
                                    Coupon {index + 1} Discount
                                </p>
                            </div>
                            <div className="flex">
                                <p className="font-sans">-&#8377;</p>
                                <p>{c.save}</p>
                            </div>
                        </div>
                    );
                })}
                <div className="grid grid-cols-[1fr_auto]">
                    <div className="">
                        <p className="font-medium">Delivery </p>
                    </div>
                    <div className="flex gap-1">
                        <span
                            className={`flex ${
                                isFreeDelivery && "line-through"
                            }`}
                        >
                            <p className="font-sans">&#8377;</p>
                            <p>{deliveryCharges}</p>
                        </span>
                        {isFreeDelivery && (
                            <span className="text-green-600">FREE</span>
                        )}
                    </div>
                </div>
            </div>
            <div className="w-11/12 min-h-[1.1px] mt-1 bg-neutral-400 mx-auto"></div>
            <div className="grid grid-cols-[1fr_auto] rounded-b-md py-2 mt-1 px-4">
                <div className="">
                    <p className="font-bold">Total</p>
                </div>
                <div>
                    <b className="font-sans">&#8377;</b>
                    <b>{grandTotal}</b>
                </div>
            </div>
        </div>
    );
}
