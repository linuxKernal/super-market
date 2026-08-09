import { House, Package, NotebookText, User } from "lucide-react";
import { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { toast } from "react-toastify";

const navLinks = [
    {
        label: "Home",
        url: "/dashboard",
        icon: <House />,
    },
    {
        label: "Users",
        url: "users",
        icon: <User />,
    },
    {
        label: "Categories",
        url: "categories",
        icon: <NotebookText />,
    },
    {
        label: "Products",
        url: "products",
        icon: <Package />,
    },
];

export default function Dashboard() {
    const { pathname, state } = useLocation();
    const navigate = useNavigate();
    const { loginSuccess } = state || {};

    useEffect(
        function () {
            if (loginSuccess) {
                toast.success("Welcome Back Admin", {
                    toastId: "admin-login-success-message",
                    position: "bottom-center",
                });
                navigate(location.pathname, { replace: true, state: null });
            }
        },
        [loginSuccess, navigate, pathname]
    );

    return (
        <div className="grid grid-cols-[auto_1fr] h-full">
            <div className="bg-blue-950 w-64 py-6 px-4 space-y-4 h-full">
                {navLinks.map((item) => {
                    return (
                        <Link
                            key={item.label}
                            to={item.url}
                            className={`flex gap-2 text-white p-2 ${pathname.endsWith(item.url) && "bg-black/20"
                                }`}
                        >
                            {item.icon}
                            <h3>{item.label}</h3>
                        </Link>
                    );
                })}
            </div>
            <div className="h-full overflow-y-auto relative">
                <Outlet />
            </div>
        </div>
    );
}
