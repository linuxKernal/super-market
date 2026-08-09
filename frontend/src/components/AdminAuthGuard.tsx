import { Navigate } from "react-router";
import { useAuth } from "@/contexts/authContext";

export default function AdminAuthGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isAuthenticated, isFetchingUser } = useAuth();

    if (isFetchingUser) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative flex h-8 w-8">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-8 w-8 bg-sky-500"></span>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || user?.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
