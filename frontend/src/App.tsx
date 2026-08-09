import { Route, Routes, useLocation } from "react-router";
import { useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { ToastContainer } from "react-toastify";
import Footer from "./components/Footer";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import Sheet from "./components/Cart";
import Dashboard from "./pages/DashboardPage";
import DashboardHome from "./components/DashboardHome";
import CategoriesPage from "./pages/CategoriesPage";
import ProductTab from "./components/ProductTab";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import LogoutPage from "./pages/LogoutPage";
import OauthSuccessCallback from "./pages/OauthSuccessCallback";
import DashboardUsersTab from "./components/DashboardUsersTab";
import PageNotFound404 from "./pages/PageNotFound404";
import PaymentCallback from "./pages/PaymentCallback";
import SettingsPage from "./pages/SettingsPage";
import OrdersPage from "./pages/OrdersPage";
import AdminAuthGuard from "./components/AdminAuthGuard";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
    const location = useLocation();
    const { openCart, setOpenCart, showOverlay } = useAppContext();

    useEffect(() => {
        if (openCart) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => { document.body.style.overflow = "auto"; };
    }, [openCart]);

    function hideSheet(e: React.MouseEvent<HTMLDivElement>) {
        const el = e.target as HTMLDivElement;
        if (el.id === "sheet_root" && openCart) setOpenCart(false);
    }

    const isDashboard = location.pathname.startsWith("/dashboard");

    return (
        <div
            className={`${isDashboard ? "h-screen" : "min-h-screen flex flex-col"} font-poppins relative ${openCart && "overflow-hidden"
                }`}
        >
            <div className={`grid grid-rows-[auto_1fr_auto] flex-1 ${isDashboard ? "h-full" : ""}`}>
                <Header setOpenCart={setOpenCart} />
                <main className={`${isDashboard ? "h-full overflow-y-auto overflow-x-hidden min-h-0" : "flex-1 pb-10"}`}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/logout" element={<LogoutPage />} />
                        <Route
                            path="/oauth/success"
                            element={<OauthSuccessCallback />}
                        />
                        <Route path="/register" element={<SignupPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route
                            path="/categories/:c_id/products"
                            element={<ProductsPage />}
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <AdminAuthGuard>
                                    <Dashboard />
                                </AdminAuthGuard>
                            }
                        >
                            <Route
                                index
                                element={<DashboardHome />}
                            />
                            <Route
                                path="users"
                                element={<DashboardUsersTab />}
                            />
                            <Route
                                path="Categories"
                                element={<CategoriesPage />}
                            />
                            <Route path="products" element={<ProductTab />} />
                        </Route>
                        <Route
                            path="/payment/callback"
                            element={<PaymentCallback />}
                        />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="*" element={<PageNotFound404 />} />
                    </Routes>
                </main>
                {!location.pathname.startsWith("/dashboard") && <Footer />}
            </div>
            <ToastContainer pauseOnHover={false} pauseOnFocusLoss={false} />
            {openCart && (
                <div
                    id="sheet_root"
                    className="fixed inset-0 bg-black/40 z-[99]"
                    onClick={hideSheet}
                >
                    <div
                        className={`fixed right-0 inset-y-0 w-96 bg-white animate-sheet`}
                    >
                        <Sheet setOpenCart={setOpenCart} />
                    </div>
                </div>
            )}
            {showOverlay && (
                <div className="absolute inset-0 bg-black/30 z-30"></div>
            )}
        </div>
    );
}

export default App;
