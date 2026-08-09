import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/authContext";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "./ui/button";
import HeaderLogoTitle from "./HeaderLogoTitle";

export default function HamburgerMenu() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    function handleClick(path: string) {
        setMenuOpen(false);
        navigate(path);
    }

    return (
        <Sheet open={menuOpen} onOpenChange={(val) => setMenuOpen(val)}>
            <SheetTrigger asChild>
                <Button variant="default" size="icon" className="md:hidden">
                    <Menu className="size-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <div className="pt-2 px-2">
                    <div className="mb-5">
                        <HeaderLogoTitle />
                    </div>
                    <div className="divide-y-[0.5px] divide-neutral-300 px-4">
                        {!isAuthenticated && (
                            <>
                                <MenuItem
                                    handleClick={() => handleClick("/login")}
                                >
                                    Login
                                </MenuItem>
                                <MenuItem
                                    handleClick={() => handleClick("/register")}
                                >
                                    Signup
                                </MenuItem>
                            </>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function MenuItem({
    children,
    handleClick,
}: {
    children: string;
    handleClick: () => void;
}) {
    return (
        <div className="py-2 hover:!bg-neutral-400 hover:!border p-4">
            <Button
                onClick={handleClick}
                className="block w-full rounded-none text-lg cursor-pointer"
            >
                {children}
            </Button>
        </div>
    );
}
