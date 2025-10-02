import React, { ReactNode } from "react";
import { ThemeProvider } from "./providers/theme-provider";
import { BetterAuthUIProvider } from "./providers/better-auth-ui-provider";

const Provider = ({ children }: { children: ReactNode }) => {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <BetterAuthUIProvider>{children}</BetterAuthUIProvider>
        </ThemeProvider>
    );
};

export default Provider;
