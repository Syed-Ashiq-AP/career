"use client";
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { useUserData } from "@/hooks/use-user";

const Orders = () => {
    const { orders } = useUserData();
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
