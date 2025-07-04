"use client";
import { ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { User } from "better-auth";
import { createContext } from "react";
import { authClient } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";

type userContextType = {
    user: User | null;
    hasSession: boolean;
};

const UserContext = createContext<userContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const path = usePathname();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (path === "/" || path.includes("auth")) return;
        const enquireSession = async () => {
            const { data: session, error } = await authClient.getSession();
            !session ? router.push("/auth/sign-in") : setUser(session.user);
        };
        enquireSession();
    }, []);

    const value = useMemo(
        () => ({
            user,
            hasSession: user !== null,
        }),
        [user]
    );

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
};

export const useUser = () => {
    const userContext = useContext(UserContext);
    if (userContext === undefined) {
        throw new Error("useUser must be used within userProvider");
    }
    return userContext;
};
