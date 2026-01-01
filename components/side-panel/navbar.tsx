"use client";

import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";
import { UserButton } from "@daveyplate/better-auth-ui";
import {
    BotMessageSquare,
    ListTodo,
    MessageCircleQuestionMark,
    SettingsIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const headerMenu = [
    {
        label: "Library",
        href: "/library",
        isActive: (slug: string) => slug.includes("library"),
        Icon: MessageCircleQuestionMark,
    },
    {
        label: "Assistant",
        href: "/",
        isActive: (slug: string) =>
            !slug.includes("survey") &&
            !slug.includes("library") &&
            !slug.includes("account"),
        Icon: BotMessageSquare,
    },
    {
        label: "Survey",
        href: "/survey",
        isActive: (slug: string) => slug.includes("survey"),
        Icon: ListTodo,
    },
];

export function Navbar() {
    const pathname = usePathname();
    const isMobile = useIsMobile();
    return (
        <header className="w-full bg-neutral-900 flex justify-between border-b items-center px-4 min-h-13">
            {isMobile ? (
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
                    className="max-h-8 w-auto"
                    alt="Crescent Logo"
                    width={140}
                    height={36}
                />
            )}
            <nav>
                <ul className="flex space-x-4 font-semibold text-sm">
                    {headerMenu.map((item, i) => (
                        <li key={i}>
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex gap-1 items-center cursor-pointer p-2 py-4 text-muted-foreground hover:text-white transition-colors",
                                    item.isActive(pathname) &&
                                        "border-b border-white text-white"
                                )}
                            >
                                <item.Icon size={20} />
                                <span className="hidden md:inline">
                                    {item.label}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <UserButton
                disableDefaultLinks
                additionalLinks={[
                    {
                        href: "/account",
                        icon: <SettingsIcon />,
                        label: "Settings",
                    },
                ]}
                variant={"ghost"}
                size={"icon"}
            />
        </header>
    );
}
