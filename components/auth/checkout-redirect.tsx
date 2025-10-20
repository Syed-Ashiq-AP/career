"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function CheckoutRedirect() {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, isPending } = authClient.useSession();

    const checkAndRedirectToCheckout = useCallback(
        async (userId: string) => {
            // Don't redirect if already on checkout page or auth pages
            if (
                pathname.startsWith("/checkout") ||
                pathname.startsWith("/auth")
            ) {
                return;
            }

            try {
                const response = await fetch("/api/auth/check-first-login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ userId }),
                });

                if (response.ok) {
                    const { shouldShowCheckout } = await response.json();

                    if (shouldShowCheckout) {
                        // Mark as seen and redirect to checkout
                        await fetch("/api/auth/mark-checkout-seen", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ userId }),
                        });

                        router.push("/checkout");
                    }
                }
            } catch (error) {
                console.error("Error checking first login:", error);
            }
        },
        [router, pathname]
    );

    useEffect(() => {
        if (isPending) return;

        if (session?.user) {
            // Check if user has seen checkout page
            checkAndRedirectToCheckout(session.user.id);
        }
    }, [session, isPending, checkAndRedirectToCheckout]);

    return null; // This component doesn't render anything
}
