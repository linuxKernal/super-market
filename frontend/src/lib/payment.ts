import { API_URL, VITE_RAZORPAY_ID } from "@/config";

interface PaymentOptions {
    amount: number;
    orderId: string;
    name: string;
    email: string;
    phone: string;
}

export function makePayment({
    amount,
    orderId,
    name,
    email,
    phone,
}: PaymentOptions) {
    const options = {
        key: VITE_RAZORPAY_ID,
        amount: amount * 100,
        currency: "INR",
        name: "Super Mart",
        description: "Test Transaction",
        image: "https://www.gstatic.com/marketing-cms/assets/images/a4/97/92c1ec494d129f3fb8d7caa91584/gemini-update.png=s48-fcrop64=1,00000000ffffffff-rw",
        order_id: orderId,
        callback_url: API_URL + "/payment/verify-payment",
        prefill: {
            name: name,
            email: email,
            contact: phone,
        },
        notes: {
            address: "Razorpay Corporate Office",
        },
        theme: {
            color: "#3399cc",
        },
        modal: {
            confirm_close: false,
        },
    };
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
}
