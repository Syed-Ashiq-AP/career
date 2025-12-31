"use client";

import { AuthUIProvider, RedirectToSignIn } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { authClient } from "@/lib/auth-client";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/providers/user-provider";

export function Providers({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { id }: { id: string | undefined } = useParams();
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            <AuthUIProvider
                authClient={authClient}
                navigate={router.push}
                replace={router.replace}
                onSessionChange={() => {
                    router.refresh();
                }}
                Link={Link}
            >
                <RedirectToSignIn />
                <UserProvider id={id ?? null}>{children}</UserProvider>
            </AuthUIProvider>
        </ThemeProvider>
    );
}
