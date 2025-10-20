import Account from "@/components/page-layout/account/account";
import Sessions from "@/components/page-layout/account/session";
import Orders from "@/components/page-layout/account/subscription";
import { auth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { RedirectToSignIn } from "@daveyplate/better-auth-ui";
import { headers } from "next/headers";
import React from "react";

const Page = async () => {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) return <RedirectToSignIn />;
    const { user } = session;

    return (
        <div className="w-full flex flex-col items-center space-y-4 max-w-2xl mx-auto mt-10 px-5">
            <div className="w-full flex flex-col space-y-4">
                <Account user={user} />
                <Orders />
                <Sessions />
            </div>
        </div>
    );
};

export default Page;
