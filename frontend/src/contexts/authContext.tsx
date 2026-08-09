import { API_URL } from "@/config";
import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
    useEffect,
} from "react";

interface User {
    id: number;
    fullname: string;
    email: string;
    image: string;
    role: string;
    cart_id: number;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isFetchingUser: boolean;
    setUserData: (user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isFetchingUser, setIsFetchingUser] = useState(false);

    const isAuthenticated = !!user;

    const setUserData = useCallback(function (user: User) {
        setUser(user);
    }, []);

    const logout = useCallback(() => {
        setUser(null);
    }, []);

    useEffect(
        function () {
            async function fetchUser() {
                setIsFetchingUser(true);
                const res = await fetch(`${API_URL}/users/me`, {
                    credentials: "include",
                });
                const data = await res.json();
                if (data?.status === "success") setUserData(data.data);
                setIsFetchingUser(false);
            }
            fetchUser();
        },
        [setUserData]
    );

    const contextValue: AuthContextType = {
        user,
        isAuthenticated,
        isFetchingUser,
        setUserData,
        logout,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

/* eslint-disable-next-line react-refresh/only-export-components */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
