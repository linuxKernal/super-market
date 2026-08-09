import { X, ChevronRight, MapPin, Plus } from "lucide-react";
import ProductListCard from "./ProductListCard";
import { useCart } from "@/contexts/CartContext";
import { Button } from "./ui/button";
import CheckOutDetails from "./CheckOutDetails";
import OutOfStock from "./OutOfStock";
import { useMemo, useState, useEffect } from "react";
import { makePayment } from "@/lib/payment";
import { API_URL } from "@/config";
import { useAuth } from "@/contexts/authContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";

interface AddressData {
    id: number;
    name: string;
    address_1: string;
    address_2: string;
    mobile: string;
    landmark: string;
    pincode: string;
    city: string;
    state: string;
    country_code: string;
    is_default_shipping: boolean;
}

type Props = {
    setOpenCart: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Cart({ setOpenCart }: Props) {
    const { user } = useAuth();
    const { items, grandTotal, totalItems, clearCart, coupons } = useCart();
    const navigate = useNavigate();

    const [addresses, setAddresses] = useState<AddressData[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [isFetchingAddresses, setIsFetchingAddresses] = useState(true);

    useEffect(() => {
        async function fetchAddresses() {
            try {
                const res = await fetch(`${API_URL}/users/me/addresses`, {
                    credentials: "include",
                });
                const data = await res.json();
                if (data.status === "success") {
                    setAddresses(data.data);
                    if (data.data.length > 0) {
                        const defaultAddr = data.data.find((a: AddressData) => a.is_default_shipping);
                        setSelectedAddressId(defaultAddr ? defaultAddr.id : data.data[0].id);
                    }
                }
            } catch (error) {
                toast.error("Failed to fetch addresses: " + error);
            } finally {
                setIsFetchingAddresses(false);
            }
        }
        if (user) {
            fetchAddresses();
        } else {
            setIsFetchingAddresses(false);
        }
    }, [user]);

    const productsInStock = useMemo(
        function () {
            return items.filter((item) => item.product.isStock);
        },
        [items]
    );

    const outOfStockProducts = useMemo(
        function () {
            return items.filter((item) => !item.product.isStock);
        },
        [items]
    );

    async function handlePayment() {
        if (!selectedAddressId) {
            toast.error("Please select a shipping address");
            return;
        }

        const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

        const orderResponse = await fetch(`${API_URL}/payment/create-order`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                coupons: coupons.map((c) => c["code"]),
                currency: "INR",
                shipping_address_id: selectedAddressId
            }),
        });

        const orderData = await orderResponse.json();
        console.log(orderData);
        if (orderData.status == "created") {
            console.log({ "DEBUG": grandTotal })
            makePayment({
                amount: grandTotal,
                orderId: orderData.id,
                name: user!.fullname,
                email: user!.email,
                phone: selectedAddress?.mobile || "",
            });
        } else {
            toast.error(orderData.error);
        }
    }

    return (
        <div className="grid grid-rows-[auto_1fr_auto] h-full">
            <div className="flex justify-between items-center p-4">
                <h2 className="font-semibold text-xl">My Cart</h2>
                <button onClick={() => setOpenCart(false)}>
                    <X />
                </button>
            </div>
            <div className="h-full bg-sky-50 overflow-y-auto pt-2 px-4 pb-4 scrollbar-thin-custom">
                <div className="decoration-red-500 cursor-pointer py-2 flex items-center justify-between">
                    <h2 className="font-semibold">{totalItems} Items</h2>
                    {items.length > 0 && (
                        <Button
                            onClick={clearCart}
                            variant="destructive"
                            className="bg-red-500 text-sm text-white border border-transparent hover:bg-transparent hover:text-red-500 hover:border-red-500"
                        >
                            Remove all
                        </Button>
                    )}
                </div>
                <div className="space-y-2">
                    {productsInStock.map((item) => {
                        return <ProductListCard product={item.product} />;
                    })}
                </div>
                {outOfStockProducts.length > 0 && (
                    <div className="py-2">
                        <OutOfStock products={outOfStockProducts} />
                    </div>
                )}
                {items.length > 0 && <CheckOutDetails />}
                {items.length > 0 && (
                    <div className="py-4 border-t border-gray-200 mt-2">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-emerald-600" /> Shipping Address
                            </h3>
                        </div>
                        {isFetchingAddresses ? (
                            <div className="text-sm text-gray-500 animate-pulse bg-gray-100 h-10 border border-gray-200 rounded-lg flex items-center px-3">Loading addresses...</div>
                        ) : addresses.length === 0 ? (
                            <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex flex-col gap-3 shadow-sm">
                                <p className="text-sm text-orange-800 font-medium tracking-tight">No delivery address found.</p>
                                <Button
                                    onClick={() => {
                                        setOpenCart(false);
                                        navigate("/settings#addresses");
                                    }}
                                    variant="outline"
                                    className="bg-white hover:bg-orange-100 hover:text-orange-800 border-orange-300 text-orange-700 w-full transition-all"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add Address
                                </Button>
                            </div>
                        ) : (
                            <div className="relative">
                                <select
                                    value={selectedAddressId || ""}
                                    onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                                    className="w-full text-sm font-medium text-gray-800 border-gray-300 rounded-lg p-2.5 pr-8 bg-white shadow-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none border hover:border-gray-400 transition-colors appearance-none cursor-pointer"
                                >
                                    {addresses.map((addr) => (
                                        <option key={addr.id} value={addr.id}>
                                            {addr.name ? `${addr.name} - ` : ""}{addr.address_1}, {addr.city} - {addr.pincode}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="p-4 bg-white border-t border-gray-200">
                <button
                    onClick={handlePayment}
                    disabled={!selectedAddressId && items.length > 0}
                    className={`w-full flex justify-between items-center px-5 py-3 rounded-xl transition-all shadow-md active:scale-[0.98] ${selectedAddressId || items.length === 0
                        ? "bg-green-600 hover:bg-green-700 text-white hover:shadow-lg"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                >
                    <div className="flex flex-col items-start leading-tight">
                        <span className={`text-xs uppercase tracking-wider font-semibold ${selectedAddressId || items.length === 0 ? "text-green-100" : "text-gray-400"}`}>
                            Total Amount
                        </span>
                        <div className="font-bold text-xl flex items-center mt-0.5">
                            <span className="font-sans mr-0.5">&#8377;</span>
                            {grandTotal}
                        </div>
                    </div>
                    <div className="flex items-center font-semibold text-lg group">
                        Proceed
                        <ChevronRight className={`w-5 h-5 ml-1 transition-transform ${selectedAddressId || items.length === 0 ? "group-hover:translate-x-1" : ""}`} />
                    </div>
                </button>
            </div>
        </div>
    );
}
