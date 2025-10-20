import React, { ReactNode } from "react";
import { ThemeProvider } from "./providers/theme-provider";
import { BetterAuthUIProvider } from "./providers/better-auth-ui-provider";
import { CheckoutRedirect } from "./auth/checkout-redirect";

const Provider = ({ children }: { children: ReactNode }) => {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <BetterAuthUIProvider>
                <CheckoutRedirect />
                {children}
            </BetterAuthUIProvider>
        </ThemeProvider>
    );
};

export default Provider;
