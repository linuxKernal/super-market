import Spinner from "@/components/Spinner";
import { useAuth } from "@/contexts/authContext";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function OauthSuccessCallback() {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const redirectPath = user?.role === "admin" ? "/dashboard" : "/";
        if (user?.role)
            setTimeout(
                () =>
                    navigate(redirectPath, {
                        state: {
                            loginSuccess: true,
                        },
                    }),
                1000
            );
    }, [navigate, user?.role]);

    return (
        <div className="h-full">
            <div className="flex flex-col gap-y-3 items-center w-fit mx-auto p-8">
                <Spinner />
                <p className="font-medium">
                    Authentication complete. Redirecting to the home page…
                </p>
            </div>
        </div>
    );
}
