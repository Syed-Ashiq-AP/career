"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function AuthCallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = authClient.useSession();

    useEffect(() => {
        // If user is authenticated and there's a callback URL, redirect
        if (session) {
            const callbackUrl = searchParams.get("callbackUrl");
            if (callbackUrl && callbackUrl !== window.location.pathname) {
                router.push(callbackUrl);
            }
        }
    }, [session, searchParams, router]);

    return null; // This component doesn't render anything
}