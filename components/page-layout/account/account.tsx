import React from "react";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import { User } from "better-auth";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

type Props = {
    user: User;
};

const Account = ({ user }: Props) => {
    return (
        <>
            <div className="py-4 border-b font-medium">
                <p>Account</p>
            </div>
            <div className="w-full flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <UserAvatar size={"lg"} />
                    <div className=" text-left">
                        <p className="font-medium">{user.name}</p>
                        <span className="text-sm text-neutral-300">
                            {user.email}
                        </span>
                    </div>
                </div>
                <Button variant={"ghost"} className=" justify-self-end">
                    <Pencil />
                </Button>
            </div>
        </>
    );
};

export default Account;
