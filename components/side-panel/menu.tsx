"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
// import { getMenuList } from "@/lib/menu-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapseMenuButton } from "@/components/side-panel/collapse-menu-button";
import UseChatbot from "@/hooks/use-chat";
import { createAuthClient } from "better-auth/react";
import { UserAvatar } from "@daveyplate/better-auth-ui";
import { authClient } from "@/lib/auth-client";

const { useSession } = createAuthClient();
interface MenuProps {
    isOpen: boolean | undefined;
}

export function Menu({ isOpen }: MenuProps) {
    const pathname = usePathname();
    const { menu } = UseChatbot();
    const { data: session } = useSession();

    const router = useRouter();

    const signOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/auth/sign-in");
                },
            },
        });
    };

    return (
        <ScrollArea className="[&>div>div[style]]:!block">
            <nav className="mt-8 h-full w-full">
                <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-2">
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
                    <li className="w-full grow flex items-end justify-center">
                        {session && (
                            <div className=" p-1 rounded-lg border shadow items-center">
                                <div className="flex space-x-4 px-2 pt-2">
                                    <UserAvatar className="mx-auto" />
                                    {isOpen && (
                                        <div>
                                            <p className="font-medium">
                                                {session.user.name}
                                            </p>
                                            <span className="text-sm text-foreground">
                                                {session.user.email}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    onClick={signOut}
                                    variant="outline"
                                    className="w-full justify-center h-10 mt-5"
                                >
                                    <span
                                        className={cn(
                                            isOpen === false ? "" : "mr-4"
                                        )}
                                    >
                                        <LogOut size={18} />
                                    </span>
                                    <p
                                        className={cn(
                                            "whitespace-nowrap",
                                            isOpen === false
                                                ? "opacity-0 hidden"
                                                : "opacity-100"
                                        )}
                                    >
                                        Sign out
                                    </p>
                                </Button>
                            </div>
                        )}
                    </li>
                </ul>
            </nav>
        </ScrollArea>
    );
}
