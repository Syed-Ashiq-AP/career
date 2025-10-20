import { Button } from "@/components/ui/button";
import { CaretLeftIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import React from "react";
import { CgProfile } from "react-icons/cg";

const AccountSidebar = () => {
    return (
        <Link
            href={"/"}
            className="flex space-x-2 items-center text-neutral-500 text-sm absolute top-5 left-5"
        >
            <CaretLeftIcon className="size-5" /> Back
        </Link>
        // <div className="w-60 border-r h-full p-4 bg-card flex flex-col space-y-8">
        //     <Link
        //         href={"/"}
        //         className="flex space-x-2 items-center text-neutral-500 text-sm"
        //     >
        //         <CaretLeftIcon className="size-5" /> Back
        //     </Link>
        //     <div className="flex-col space-y-2">
        //         <p className="text-neutral-500 text-xs">Account</p>
        //         <Button variant={"ghost"} className="w-full justify-normal">
        //             <CgProfile size={12} />
        //             <span>Account</span>
        //         </Button>
        //     </div>
        // </div>
    );
};

export default AccountSidebar;
