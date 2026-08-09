import { Link, useLocation } from "react-router";
import { ShoppingCart, CircleUserRound } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/authContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import HamburgerMenu from "./HamburgerMenu";
import HeaderLogoTitle from "./HeaderLogoTitle";

type Prop = {
    setOpenCart: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Header({ setOpenCart }: Prop) {
    const { pathname } = useLocation();
    const { totalItems } = useCart();

    const { isFetchingUser, user, isAuthenticated } = useAuth();

    return (
        <header className="sticky top-0 z-50 py-4 px-2 md:px-8 flex bg-slate-50 justify-between w-full items-center">
            <HeaderLogoTitle />
            <div className="flex gap-2 md:gap-8 items-center">
                {isFetchingUser && (
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full animate-pulse bg-neutral-200"></div>
                        <div className="h-3 w-26 rounded-xl bg-gray-200"></div>
                    </div>
                )}
                {isAuthenticated && !isFetchingUser && (
                    <DropdownMenu>
                        <DropdownMenuTrigger className="outline-none">
                            <span className="flex justify-center items-center gap-2 cursor-default">
                                {user?.image ? (
                                    <img
                                        src={user.image}
                                        className="size-8 rounded-full"
                                        alt=""
                                    />
                                ) : (
                                    <CircleUserRound size={30} />
                                )}

                                <h1>{user!.fullname.split(" ")[0]}</h1>
                            </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel className="select-none">
                                My Account
                            </DropdownMenuLabel>
                            <DropdownMenuItem className="hover:bg-neutral-500/10">
                                <Link to="/settings">Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-neutral-500/10">
                                <Link to="/orders">Orders</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-neutral-500/10">
                                <Link to="/logout">logout</Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                <div className="flex items-center gap-x-4">
                    {!isAuthenticated && !pathname.startsWith("/login") && (
                        <Link
                            to="/login"
                            className="bg-sky-500 text-white py-1 rounded-md px-4"
                        >
                            Login
                        </Link>
                    )}
                    <HamburgerMenu />
                </div>

                {!pathname.startsWith("/dashboard") && isAuthenticated && (
                    <div>
                        <button
                            onClick={() => setOpenCart(true)}
                            className="md:flex hidden gap-2 items-center bg-green-500 text-white py-1 px-2 rounded-md relative"
                        >
                            <span>Cart</span>
                            <ShoppingCart />
                            <span className="absolute -top-3 -right-3 size-6 flex items-center justify-center rounded-full bg-orange-600">
                                {totalItems}
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
