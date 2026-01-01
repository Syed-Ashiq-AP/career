"use client";

import Link from "next/link";
import {
    Bookmark,
    LucideIcon,
    MessageCircleMore,
    SquarePen,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapseMenuButton } from "@/components/side-panel/collapse-menu-button";
import { useUserData } from "@/hooks/use-user";
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuLabel,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

interface MenuProps {
    isOpen: boolean | undefined;
}

type Submenu = {
    href: string;
    label: string;
    icon?: LucideIcon;
    active?: boolean;
};

type Menu = {
    href: string;
    label: string;
    active?: boolean;
    icon: LucideIcon;
    submenus?: Submenu[];
};

type Group = {
    groupLabel: string;
    menus: Menu[];
};

export function Menu({ isOpen }: MenuProps) {
    const pathname = usePathname();
    const { conversations } = useUserData();
    const menu: Group[] = [
        {
            groupLabel: "",
            menus: [
                {
                    href: "/survey",
                    label: "Survey",
                    icon: Bookmark,
                },
                {
                    href: "#",
                    label: "Chats",
                    icon: MessageCircleMore,
                    submenus: [
                        {
                            href: "/",
                            icon: SquarePen,
                            label: "New Chat",
                        },
                        ...conversations.map((chat) => ({
                            href: `/${chat.id}`,
                            label: chat.title,
                        })),
                    ],
                },
            ],
        },
    ];

    return (
        <ScrollArea className="[&>div>div[style]]:block!">
            <nav className="mt-8 h-full w-full">
                <ul className="flex flex-col items-start space-y-1 px-2">
                    {menu.map(({ groupLabel, menus }, index) => (
                        <li
                            className={cn("w-full", groupLabel ? "pt-5" : "")}
                            key={index}
                        >
                            {(isOpen && groupLabel) || isOpen === undefined ? (
                                <p className="text-sm font-medium text-muted-foreground px-4 pb-2 max-w-[248px] truncate">
                                    {groupLabel}
                                </p>
                            ) : (
                                !isOpen &&
                                isOpen !== undefined && <p className="pb-2"></p>
                            )}
                            {menus.map(
                                (
                                    {
                                        href,
                                        label,
                                        icon: Icon,
                                        active,
                                        submenus,
                                    },
                                    index
                                ) =>
                                    !submenus || submenus.length === 0 ? (
                                        <div className="w-full" key={index}>
                                            <Button
                                                variant={
                                                    (active === undefined &&
                                                        pathname.startsWith(
                                                            href
                                                        )) ||
                                                    active
                                                        ? "secondary"
                                                        : "ghost"
                                                }
                                                className="w-full justify-start h-10 mb-1"
                                                asChild
                                            >
                                                <Link href={href}>
                                                    <span
                                                        className={cn(
                                                            isOpen === false
                                                                ? ""
                                                                : "mr-4"
                                                        )}
                                                    >
                                                        <Icon size={18} />
                                                    </span>
                                                    <p
                                                        className={cn(
                                                            "max-w-[200px] truncate",
                                                            isOpen === false
                                                                ? "-translate-x-96 opacity-0"
                                                                : "translate-x-0 opacity-100"
                                                        )}
                                                    >
                                                        {label}
                                                    </p>
                                                </Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="w-full" key={index}>
                                            <CollapseMenuButton
                                                icon={Icon}
                                                label={label}
                                                submenus={submenus}
                                                isOpen={isOpen}
                                            />
                                        </div>
                                    )
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        </ScrollArea>
    );
}
