import { useLocation, useNavigate } from "react-router";
import Carousel from "../components/Carousel";
import CategoryList from "../components/CategoryList";
import Products from "../components/Products";
import { toast } from "react-toastify";
import { useEffect } from "react";

export default function HomePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { loginSuccess } = location.state || {};
    useEffect(
        function () {
            if (loginSuccess) {
                toast.success("Logged in successfully.", {
                    toastId: "login-success-message",
                    position: "bottom-center",
                });
                navigate(location.pathname, { replace: true, state: null });
            }
        },
        [loginSuccess, navigate, location.pathname]
    );
    return (
        <>
            <Carousel />
            <CategoryList />
            <Products />
        </>
    );
}
