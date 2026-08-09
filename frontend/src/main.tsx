import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App.tsx";
import AppContextProvider from "./contexts/AppContext.tsx";
import { CartProvider } from "./contexts/CartContext.tsx";
import { AuthProvider } from "./contexts/authContext.tsx";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AppContextProvider>
            <AuthProvider>
                <CartProvider>
                    <QueryClientProvider client={queryClient}>
                        <BrowserRouter>
                            <App />
                        </BrowserRouter>
                    </QueryClientProvider>
                </CartProvider>
            </AuthProvider>
        </AppContextProvider>
    </StrictMode>
);
