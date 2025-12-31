import Link from "next/link";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Menu } from "@/components/side-panel/menu";
import {
    Sheet,
    SheetHeader,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";

export function SheetMenu() {
    return (
        <Sheet>
            <SheetTrigger className="lg:hidden" asChild>
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
                className="sm:w-72 px-3 h-full flex flex-col  overflow-auto"
                side="left"
            >
                <SheetHeader>
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
                <Menu isOpen />
            </SheetContent>
        </Sheet>
    );
}
