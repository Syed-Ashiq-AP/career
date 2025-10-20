import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import React from "react";
import Providers from "@/components/page-layout/ai/providers";

const page = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    return (
        <>
            <Providers userId={session?.user.id as string}></Providers>
        </>
    );
};

export default page;
