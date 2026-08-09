import { API_URL } from "@/config";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getChangedFields<T>(original: T, updated: T) {
    const changes: Partial<T> = {};

    for (const key in updated) {
        if (updated[key] !== original[key]) {
            changes[key] = updated[key];
        }
    }

    return changes;
}

export async function uploadImage(file: File, endpoint: string): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/${endpoint}`, {
        credentials: "include",
        method: "POST",
        body: form,
    });
    const resData = await res.json();
    return resData.public_url;
}

export async function uploadCategoryImage(file: File): Promise<string> {
    return uploadImage(file, "category-images");
}

export async function uploadProductImage(file: File): Promise<string> {
    return uploadImage(file, "product-images");
}

export function getDiscountPrice(price: number, discount?: number | null) {
    if (!discount) return { discountPrice: 0, saved: 0 };

    const discountPrice = Number(
        (discount ? ((100 - discount) / 100) * price : 0).toFixed(2)
    );
    return {
        discountPrice,
        saved: +(price - discountPrice).toFixed(2),
    };
}

type Coupon = {
    status: "success";
    code: string;
    save: number;
};

type CouponError = {
    status: "error";
    error: string;
};

export async function validateCouponCode(
    code: string,
    totalPrice: number
): Promise<Coupon | CouponError> {
    const res = await fetch(`${API_URL}/coupon/check`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            coupon_code: code,
            cart_total: totalPrice,
        }),
    });
    const data = await res.json();

    if (res.status === 200) {
        return {
            status: "success",
            ...data.data,
        };
    }

    return data as CouponError;
}

export function changePropertyCase(
    obj: Record<string, unknown>
): Record<string, unknown> {
    const snakeCaseObject: Record<string, unknown> = {};

    for (const key in obj) {
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        snakeCaseObject[snakeKey] = obj[key];
    }

    return snakeCaseObject;
}
