import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "../services/orders";
import { Package, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

export default function OrdersPage() {
    const { data: orders, isLoading, error } = useQuery({
        queryKey: ["orders"],
        queryFn: fetchOrders,
    });

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4 border-gray-200">
                My Orders
            </h1>

            {isLoading && (
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-48 w-full border border-gray-200"></div>
                    ))}
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-center">
                    Found an error while fetching your orders. Please try again later.
                </div>
            )}

            {!isLoading && orders?.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                    <Package className="size-16 text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-600 mb-2">No orders found</h2>
                    <p className="text-gray-500 mb-6">Looks like you haven't made any purchases yet.</p>
                    <Link to="/" className="px-6 py-2 bg-sky-500 hover:bg-sky-600 transition-colors text-white font-medium rounded-lg">
                        Start Shopping
                    </Link>
                </div>
            )}

            <div className="space-y-6">
                {!isLoading && orders?.map(order => {
                    const totalItems = order.order_items.reduce((acc, item) => acc + item.quantity, 0);
                    const formattedDate = new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    return (
                        <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="bg-slate-50 border-b border-gray-100 p-4 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex gap-6 flex-wrap">
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Order Placed</p>
                                        <p className="text-sm font-semibold text-gray-800">{formattedDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Total</p>
                                        <p className="text-sm font-semibold text-gray-800">${(order.amount_paid || order.total_amount)?.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Order ID</p>
                                        <p className="text-sm font-semibold text-gray-800">#{order.id}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                                    <ShieldCheck className="size-4" />
                                    {order.status || 'Completed'}
                                </div>
                            </div>

                            <div className="p-4 sm:p-6">
                                <h3 className="font-semibold text-gray-800 mb-4">{totalItems} {totalItems === 1 ? 'Item' : 'Items'}</h3>

                                <div className="space-y-4">
                                    {order.order_items.map(item => (
                                        <div key={item.id} className="flex gap-4 items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                            <div className="size-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                                {item.product?.image ? (
                                                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <Package className="size-8" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-base font-medium text-gray-900 truncate">
                                                    {item.product?.name || "Unknown Product"}
                                                </h4>
                                                <div className="text-sm text-gray-500 mt-1 flex gap-3">
                                                    <span>Qty: {item.quantity}</span>
                                                    <span>Price: ${item.price_at_purchase.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
