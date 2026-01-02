/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { Input } from "@/components/ui/input";
import { useUserData } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { Search, Timer } from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";

export default function page() {
    const { conversations } = useUserData();
    const conversationsLen = conversations.length - 1;
    const [search, setSearch] = useState("");
    const filteredConverations = useMemo(() => {
        return conversations.filter((conversation) =>
            conversation.title.toLowerCase().includes(search.toLowerCase())
        );
    }, [conversations, search]);
    return (
        <main className="flex flex-col overflow-hidden size-full mx-auto max-w-5xl p-5">
            <div className="relative">
                <Search
                    className=" absolute left-2 top-0 bottom-0 my-auto text-muted-foreground"
                    size={20}
                />
                <Input
                    className="pl-10"
                    placeholder="Search your Conversations..."
                    value={search}
                    onInput={(e) => {
                        setSearch((e.target as HTMLInputElement).value);
                    }}
                />
            </div>
            <div className="h-full overflow-y-auto">
                <ul className="flex flex-col my-4">
                    {filteredConverations.map((conversation, i) => (
                        <li
                            key={conversation.id}
                            className={cn(
                                "p-2",
                                i !== conversationsLen && "border-b"
                            )}
                        >
                            <Link
                                href={`/${conversation.id}`}
                                className="font-semibold hover:text-muted-foreground transition-colors"
                            >
                                {conversation.title}
                            </Link>
                            <div className="flex space-x-2 my-2 items-center text-muted-foreground text-xs">
                                <Timer size={15} />
                                <span>
                                    {new Date(
                                        conversation.updatedAt
                                    ).toDateString()}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </main>
    );
}
