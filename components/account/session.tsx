"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from "@/components/ui/item";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const Sessions = () => {
    const router = useRouter();
    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/auth/sign-in");
                },
            },
        });
    };

    const handleSignOutAllSessions = async () => {
        await authClient.revokeSessions();
    };

    return (
        <>
            <div className="py-4 border-b font-medium">
                <p>Sessions</p>
            </div>
            <div className="w-full flex flex-col space-y-2 items-center">
                <Item variant="outline" className="w-full">
                    <ItemContent>
                        <ItemTitle>Sign out</ItemTitle>
                        <ItemDescription>
                            Sign out of current device
                        </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                        <Button
                            onClick={handleSignOut}
                            variant={"outline"}
                            size="sm"
                        >
                            Sign out
                        </Button>
                    </ItemActions>
                </Item>
                <Item variant="outline" className="w-full">
                    <ItemContent>
                        <ItemTitle>Sign out of all sessions</ItemTitle>
                        <ItemDescription>
                            Devices or browsers where you are signed in
                        </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                        <Button
                            onClick={handleSignOutAllSessions}
                            variant={"outline"}
                            size="sm"
                        >
                            Sign out of all sessions
                        </Button>
                    </ItemActions>
                </Item>
            </div>
        </>
    );
};

export default Sessions;
