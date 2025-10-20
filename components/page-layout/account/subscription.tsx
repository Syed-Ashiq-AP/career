"use client";
import { authClient } from "@/lib/auth-client";
import React, { useEffect, useState } from "react";
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";

const Orders = () => {
    const [orders, setOrders] = useState<
        { id: string; name: string; description: string | null }[] | null
    >(null);

    useEffect(() => {
        const fetch = async () => {
            const { data } = await authClient.customer.orders.list({
                query: {
                    page: 1,
                    limit: 10,
                },
            });
            if (!data) return;
            const { items } = data.result;
            const orders = items.map((item) => ({
                id: item.id,
                name: item.product.name,
                description: item.product.description,
            }));
            setOrders(orders);
        };
        fetch();
    }, []);
    return (
        <>
            <div className="py-4 border-b font-medium">
                <p>Your Orders</p>
            </div>
            <div className="w-full flex space-y-2 items-stretch">
                {orders?.map((order) => (
                    <Item key={order.id} variant="outline" className="w-full">
                        <ItemContent>
                            <ItemTitle>{order.name}</ItemTitle>
                            <ItemDescription>
                                {order.description}
                            </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                            <Button variant={"destructive"} size="sm">
                                Cancel
                            </Button>
                        </ItemActions>
                    </Item>
                ))}
            </div>
        </>
    );
};

export default Orders;
