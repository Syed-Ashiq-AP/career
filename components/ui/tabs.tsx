"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type Tab = {
    title: string;
    value: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content?: string | React.ReactNode | any;
};

export const Tabs = ({
    id,
    tabs: propTabs,
    containerClassName,
    activeTabClassName,
    tabClassName,
    contentClassName,
    forceUpdateKey,
    query,
}: {
    id: string;
    tabs: Tab[];
    containerClassName?: string;
    activeTabClassName?: string;
    tabClassName?: string;
    contentClassName?: string;
    forceUpdateKey?: number | string;
    query: string;
}) => {
    const [active, setActive] = useState<Tab>(propTabs[0]);
    const [tabs, setTabs] = useState<Tab[]>(propTabs);

    const [contentHash, setContentHash] = useState(0);
    const [prevForceUpdateKey, setPrevForceUpdateKey] =
        useState(forceUpdateKey);

    useEffect(() => {
        if (prevForceUpdateKey !== forceUpdateKey) {
            setTabs(propTabs);
            setPrevForceUpdateKey(forceUpdateKey);
            setContentHash((prev) => prev + 1);
        }
    }, [forceUpdateKey, prevForceUpdateKey, propTabs]);

    const moveSelectedTabToTop = (idx: number) => {
        const selectedTab = tabs[idx];
        setActive(selectedTab);
    };

    return (
        <>
            <div className="sticky top-0 z-15 w-full bg-background/95  backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 rounded-b-xl">
                <p className=" capitalize text-lg font-semibold mb-4 w-8/12 text-center lg:text-left lg:w-full truncate mx-auto">
                    {query}
                </p>
                <div
                    className={cn(
                        "flex flex-row items-center justify-start [perspective:1000px] relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full",
                        containerClassName
                    )}
                >
                    {tabs.map((tab, idx) => (
                        <button
                            key={tab.title}
                            onClick={() => {
                                setActive(tab);
                                moveSelectedTabToTop(idx);
                            }}
                            className={cn(
                                "relative px-4 py-2 rounded-full",
                                tabClassName
                            )}
                            style={{
                                transformStyle: "preserve-3d",
                            }}
                        >
                            {active.value === tab.value && (
                                <motion.div
                                    layoutId={"clickedbutton" + id}
                                    transition={{
                                        type: "spring",
                                        bounce: 0.3,
                                        duration: 0.6,
                                    }}
                                    className={cn(
                                        "absolute inset-0 bg-gray-200 dark:bg-zinc-800 rounded-full ",
                                        activeTabClassName
                                    )}
                                />
                            )}

                            <span className="relative block text-black dark:text-white">
                                {tab.title}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
            <FadeInDiv
                id={id}
                active={active}
                tabs={tabs}
                key={`${active.value}-${tabs.length}-${contentHash}`}
                className={cn("mt-12 ", contentClassName)}
            />
        </>
    );
};

export const FadeInDiv = ({
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
    const containerRef = useRef<HTMLDivElement>(null);
    const activeTabRef = useRef<HTMLDivElement>(null);

    const activeTabValue = active.value;

    const currentActiveTab =
        tabs.find((tab) => tab.value === active.value) || active;

    useEffect(() => {
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
