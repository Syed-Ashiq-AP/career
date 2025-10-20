"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

function Tabs({
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
    return (
        <TabsPrimitive.Root
            data-slot="tabs"
            className={cn("flex flex-col gap-2", className)}
            {...props}
        />
    );
}

function TabsList({
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            className={cn(
                "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
                className
            )}
            {...props}
        />
    );
}

function TabsTrigger({
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
    return (
        <TabsPrimitive.Trigger
            data-slot="tabs-trigger"
            className={cn(
                "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className
            )}
            {...props}
        />
    );
}

function TabsContent({
    className,
    ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
    return (
        <TabsPrimitive.Content
            data-slot="tabs-content"
            className={cn("flex-1 outline-none", className)}
            {...props}
        />
    );
}
export type Tab = {
    title: string;
    value: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content?: string | React.ReactNode | any;
};

const FadeInDiv = ({
    id,
    className,
    active,
    tabs,
}: {
    id: string;
    className?: string;
    key?: string;
    active: Tab;
    tabs: Tab[];
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const activeTabRef = React.useRef<HTMLDivElement>(null);

    const activeTabValue = active.value;

    const currentActiveTab =
        tabs.find((tab) => tab.value === active.value) || active;

    React.useEffect(() => {
        const updateHeight = () => {
            if (activeTabRef.current && containerRef.current) {
                const activeTabHeight = activeTabRef.current.scrollHeight;
                containerRef.current.style.minHeight = `${activeTabHeight}px`;
            }
        };

        const timeoutId = setTimeout(() => {
            updateHeight();
        }, 100);

        const resizeObserver = new ResizeObserver(() => {
            // Debounce the resize updates
            clearTimeout(timeoutId);
            setTimeout(() => {
                updateHeight();
            }, 100);
        });

        if (activeTabRef.current) {
            resizeObserver.observe(activeTabRef.current);
        }

        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
        };
    }, [activeTabValue]);

    return (
        <div
            ref={containerRef}
            className="relative w-full transition-all duration-300 ease-out mb-14"
            style={{ minHeight: "auto" }}
        >
            <motion.div
                key={`${active.value}-${id}`}
                ref={activeTabRef}
                layoutId={`${active.value}${id}`}
                animate={{
                    y: [0, 40, 0],
                }}
                transition={{ duration: 0.3 }}
                className={cn("w-full", className)}
            >
                <div>{currentActiveTab.content}</div>
            </motion.div>
        </div>
    );
};

export { Tabs, TabsList, TabsTrigger, TabsContent, FadeInDiv };
