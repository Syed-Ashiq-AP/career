"use client";
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !theme) return <Skeleton className="size-9 rounded-lg" />;

    return (
        <Button
            size={"icon"}
            variant={"ghost"}
            onClick={() =>
                setTheme((cur) => (cur === "light" ? "dark" : "light"))
            }
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
            {theme === "light" && <Sun />}
            {theme === "dark" && <Moon />}
        </Button>
    );
};

export default ThemeToggle;
