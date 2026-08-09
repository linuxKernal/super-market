import { API_URL } from "@/config";
import { type Product } from "../components/Products";

export interface OrderItem {
    id: number;
    quantity: number;
    original_price: number;
    discount_amount: number;
    price_at_purchase: number;
    product: Product;
}

export interface Order {
    id: number;
    created_at: string;
    total_amount: number;
    status: string;
    order_items: OrderItem[];
    amount_paid: number;
}

export async function fetchOrders(): Promise<Order[]> {
    const res = await fetch(`${API_URL}/orders`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Failed to fetch orders.");
    }

    const data = await res.json();
    if (data.status === "error") throw new Error(data.error);
    return data.data;
}
