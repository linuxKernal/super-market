import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { API_URL } from "@/config";
import { useAuth } from "@/contexts/authContext";

export default function LogoutPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const handleLogout = async () => {
            try {
                const res = await fetch(`${API_URL}/auth/logout`, {
                    credentials: "include",
                });
                const data = await res.json();
                if (data.status !== "success")
                    throw new Error("something went wrong in logout process");
                logout();
                navigate("/login", {
                    replace: true,
                    state: {
                        logoutSuccess: true,
                    },
                });
            } catch (error) {
                console.error("Logout error:", error);
            }
        };

        handleLogout();
    }, [navigate, logout]);

    return (
        <div style={styles.container}>
            <div style={styles.spinner}></div>
            <p>Logging you out...</p>
        </div>
    );
}

// Simple CSS-in-JS for the loading spinner
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
    },
    spinner: {
        border: "4px solid #f3f3f3",
        borderTop: "4px solid #3498db",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        animation: "spin 1s linear infinite",
        marginBottom: "1rem",
    },
};
