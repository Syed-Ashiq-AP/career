"use client";
import { Menu } from "@/components/side-panel/menu";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export function Sidebar() {
    const sidebar = useStore(useSidebar, (x) => x);
    if (!sidebar) return null;
    const { getOpenState, setIsHover, settings } = sidebar;
    return (
        <aside
            className={cn(
                "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300",
                !getOpenState() ? "w-17.5" : "w-72",
                settings.disabled && "hidden"
            )}
        >
            <div
                onMouseEnter={() => setIsHover(true)}
                onMouseLeave={() => setIsHover(false)}
                className="relative h-full flex flex-col px-1 py-4 overflow-y-auto shadow-md dark:shadow-zinc-800 bg-background"
            >
                <Button
                    className={cn(
                        "transition-transform ease-in-out duration-300 mb-1",
                        !getOpenState() ? "translate-x-1" : "translate-x-0"
                    )}
                    variant="link"
                    asChild
                >
                    <Link href="/" className="flex items-center gap-2">
                        {!getOpenState() ? (
                            <Image
                                src={"/logo.png"}
                                className="mr-1"
                                alt="Crescent Logo"
                                width={30}
                                height={30}
                            />
                        ) : (
                            <Image
                                src={"/logo-dark.webp"}
                                className="mr-1"
                                alt="Crescent Logo"
                                width={140}
                                height={36}
                            />
                        )}
                    </Link>
                </Button>
                <Menu isOpen={getOpenState()} />
            </div>
        </aside>
    );
}
