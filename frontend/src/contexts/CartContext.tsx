import type { Product } from "@/components/Products";
import { API_URL } from "@/config";
import { getDiscountPrice, validateCouponCode } from "@/lib/utils";
import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    type ReactNode,
} from "react";
import { useAuth } from "./authContext";
import { toast } from "react-toastify";

export interface CartItem {
    id: number;
    product: Product;
    quantity: number;
}

type couponCodeWithMessage = {
    code: string;
    save: number;
};

interface CartState {
    items: CartItem[];
    coupons: couponCodeWithMessage[];
}

type CartAction =
    | { type: "INITIALIZE_CART"; payload: CartItem[] }
    | { type: "ADD_ITEM"; payload: { product: Product; id: number } }
    | { type: "REMOVE_ITEM"; payload: number }
    | { type: "UPDATE_ITEM"; payload: { id: number; quantity: number } }
    | { type: "APPLY_COUPON"; payload: { code: string; save: number } }
    | { type: "REMOVE_COUPON"; payload: string }
    | { type: "RESET_CART" }
    | { type: "CLEAR_CART" };

const initialState = {
    items: [],
    coupons: [],
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
    switch (action.type) {
        case "ADD_ITEM": {
            return {
                ...state,
                items: [
                    ...state.items,
                    {
                        product: action.payload.product,
                        quantity: 1,
                        id: action.payload.id,
                    },
                ],
                coupons: [],
            };
        }

        case "INITIALIZE_CART":
            return { ...state, items: action.payload };

        case "REMOVE_ITEM":
            return {
                ...state,
                items: state.items.filter((i) => i.id !== action.payload),
                coupons: [],
            };

        case "UPDATE_ITEM": {
            const { id, quantity } = action.payload;

            const item = state.items.find((item) => item.id === id);

            if (!item) return state;

            if (quantity <= 0) {
                return {
                    ...state,
                    items: state.items.filter((item) => item.id !== id),
                };
            }

            return {
                ...state,
                items: state.items.map((item) =>
                    item.id === id
                        ? {
                            ...item,
                            quantity: quantity,
                        }
                        : item
                ),
                coupons: [],
            };
        }

        case "APPLY_COUPON": {
            const { code, save } = action.payload;
            return {
                ...state,
                coupons: [...state.coupons, { code, save }],
            };
        }

        case "REMOVE_COUPON": {
            return {
                ...state,
                coupons: state.coupons.filter((c) => c.code !== action.payload),
            };
        }

        case "CLEAR_CART":
            return { ...state, items: [] };
        case "RESET_CART":
            return initialState;

        default:
            return state;
    }
};

interface CartContextType {
    items: CartItem[];
    coupons: couponCodeWithMessage[];
    grandTotal: number;
    addItem: (item: Product) => void;
    removeItem: (id: number) => void;
    updateItem: (id: number, quantity: number) => void;
    applyCouponCode: (code: string) => Promise<void>;
    removeCouponCode: (code: string) => void;
    clearCart: () => void;
    totalPrice: number;
    savedAmount: number;
    deliveryCharges: number;
    totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(cartReducer, initialState);

    const { user } = useAuth();

    useEffect(
        function () {
            if (user)
                fetch(`${API_URL}/cart/${user.cart_id}/cart-items`, {
                    credentials: "include",
                })
                    .then((res) => res.json())
                    .then(
                        ({ data }) =>
                            data &&
                            dispatch({ type: "INITIALIZE_CART", payload: data })
                    );
            else dispatch({ type: "RESET_CART" });
        },
        [user]
    );

    async function addItem(item: Product) {
        if (!user) {
            toast.warning("Please Login then add the items to the cart", {
                position: "top-center",
            });
            return;
        }

        const res = await fetch(`${API_URL}/cart/${user.cart_id}/cart-items`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                product_id: item.id,
            }),
        });
        const { data } = await res.json();

        if (data)
            dispatch({
                type: "ADD_ITEM",
                payload: { product: item, id: data.id },
            });
        else alert("Error found when adding the product");
    }

    async function removeItem(id: number) {
        const res = await fetch(
            `${API_URL}/cart/${user!.cart_id}/cart-items/${id}`,
            {
                credentials: "include",
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        const data = await res.json();
        if (data.status !== "success") {
            alert("Error found when deleting the product");
            return;
        }

        dispatch({ type: "REMOVE_ITEM", payload: id });
    }
    async function clearCart() {
        const res = await fetch(`${API_URL}/cart/${user!.cart_id}/cart-items`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data = await res.json();

        if (data.status !== "success") {
            alert(data.error);
            return;
        }
        dispatch({ type: "CLEAR_CART" });
    }

    async function updateItem(id: number, quantity: number) {
        if (quantity <= 0) {
            await removeItem(id);
            return;
        }
        const res = await fetch(
            `${API_URL}/cart/${user!.cart_id}/cart-items/${id}`,
            {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    quantity,
                }),
            }
        );
        const data = await res.json();
        if (data.status === "success")
            dispatch({ type: "UPDATE_ITEM", payload: { id, quantity } });
        else alert("Error found when updating the product");
        console.log(id, quantity);
    }

    async function applyCouponCode(couponCode: string) {
        if (!couponCode) return;

        if (state.coupons.find((c) => c.code === couponCode)) {
            throw new Error("coupon already exists");
        }

        const data = await validateCouponCode(couponCode, totalPrice);

        if (data.status === "success") {
            dispatch({
                type: "APPLY_COUPON",
                payload: {
                    code: couponCode,
                    save: data.save,
                },
            });
        } else {
            throw new Error(data.error);
        }
    }

    const removeCouponCode = (code: string) =>
        dispatch({ type: "REMOVE_COUPON", payload: code });

    const totalPrice = state.items.reduce(
        (sum, i) =>
            i.product.isStock ? sum + (i.product.price - (i.product.discount ?? 0)) * i.quantity : sum,
        0
    );

    const deliveryCharges = totalPrice >= 500 ? 0 : 25;

    const totalItems = state.items.reduce(
        (sum, i) => (i.product.isStock ? sum + i.quantity : sum),
        0
    );
    const savedAmount: number = +state.items
        .reduce((sum, i) => {
            if (!i.product.isStock) return sum;
            const { price, discount } = i.product;

            return (
                getDiscountPrice(price, discount)["saved"] * i.quantity + sum
            );
        }, 0)
        .toFixed(2);

    const totalCouponDiscount = state.coupons.reduce(
        (acc, i) => i.save + acc,
        0
    );

    const grandTotal =
        state.items.length > 0
            ? +(totalPrice + deliveryCharges - totalCouponDiscount).toFixed(2)
            : 0;
    console.log({ grandTotal, totalPrice, deliveryCharges, totalCouponDiscount })

    return (
        <CartContext.Provider
            value={{
                ...state,
                addItem,
                deliveryCharges,
                updateItem,
                applyCouponCode,
                removeCouponCode,
                removeItem,
                grandTotal,
                clearCart,
                savedAmount,
                totalPrice,
                totalItems,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

/* eslint-disable-next-line react-refresh/only-export-components */
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
