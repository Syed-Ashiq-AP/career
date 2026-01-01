"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Menu } from "@/components/side-panel/menu";
import {
    Sheet,
    SheetHeader,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet";
import Image from "next/image";
import { useUserData } from "@/hooks/use-user";
import { UserAvatar } from "@daveyplate/better-auth-ui";

export function SheetMenu() {
    const { user } = useUserData();
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    className="h-8"
                    variant="outline"
                    size="icon"
                    suppressHydrationWarning
                >
                    <MenuIcon size={20} />
                </Button>
            </SheetTrigger>
            <SheetContent
                className="sm:w-72 p-3 h-full flex flex-col  overflow-auto"
                side="left"
            >
                <SheetHeader>
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <Button
                        className="flex justify-center items-center pb-2 pt-1"
                        variant="link"
                        asChild
                    >
                        <Link href="/" className="flex items-center gap-2">
                            <Image
                                src={"/logo-dark.webp"}
                                className="mr-1"
                                alt="Crescent Logo"
                                width={140}
                                height={36}
                            />
                        </Link>
                    </Button>
                </SheetHeader>
                <div className="h-full">
                    <Menu isOpen />
                </div>
                {user && (
                    <Button
                        variant={"outline"}
                        className="p-2 h-auto font-normal"
                    >
                        <Link href={"/account"} className="flex space-x-2">
                            <UserAvatar className="mx-auto" />
                            <div className=" text-left">
                                <p className="font-medium">{user.name}</p>
                                <span className="text-sm text-foreground">
                                    {user.email}
                                </span>
                            </div>
                        </Link>
                    </Button>
                )}
            </SheetContent>
        </Sheet>
    );
}
