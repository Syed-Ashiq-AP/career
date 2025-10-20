"use client";

import { authClient } from "@/lib/auth-client";
import { Session, User } from "better-auth";
import { redirect } from "next/navigation";
import React, { useEffect, useState } from "react";

type Props = {
    children: React.ReactNode;
    session: { session: Session; user: User };
};

const ProductDisplay = ({ children, session }: Props) => {
    const [status, setStatus] = useState(0);

    useEffect(() => {
        if (!session) return;
        const fetch = async () => {
            const { data } = await authClient.customer.orders.list({
                query: {
                    page: 1,
                    limit: 10,
                },
            });
            if (!data) return;
            const { items } = data.result;
            const orders = items.map((item) => item.productId);
            if (orders.length === 0) setStatus(-1);
            else setStatus(1);
        };
        fetch();
    }, [session]);

    if (!status)
        return (
            <div className="w-full h-full flex justify-center items-center">
                <p>Setting Up...</p>
            </div>
        );
    else if (status === -1) redirect("/checkout");
    else if (status === 1) return children;
};

export default ProductDisplay;
