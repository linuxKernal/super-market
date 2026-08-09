import React, {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";

interface AppContextType {
    openCart: boolean;
    setOpenCart: React.Dispatch<React.SetStateAction<boolean>>;
    showOverlay: boolean;
    setShowOverlay: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export default function AppContextProvider({
    children,
}: {
    children: React.ReactNode;
}): ReactNode {
    const [openCart, setOpenCart] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);

    return (
        <AppContext.Provider
            value={{ openCart, setOpenCart, showOverlay, setShowOverlay }}
        >
            {children}
        </AppContext.Provider>
    );
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppContext must be used within AppProvider");
    }
    return context;
}
