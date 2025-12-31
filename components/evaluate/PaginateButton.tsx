"use client";
import React, { useState } from "react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ClassNameValue } from "tailwind-merge";

const direction: { [key: string]: any } = {
    left: {
        initial: "-left-1/4",
        final: "left-5",
        Icon: ChevronLeft,
    },
    right: {
        initial: "-right-1/4",
        final: "right-5",
        Icon: ChevronRight,
    },
};

export const PaginateButton = ({
    dir,
    className,
    show,
    onClick,
}: {
    dir: "left" | "right";
    show: boolean;
    onClick?: () => void;
    className?: ClassNameValue;
}) => {
    const { initial, final, Icon } = direction[dir];

    return (
        <div className=" h-full flex-1 w-full">
            <Button
                className={cn(
                    "absolute transition-all my-auto md:top-0 md:bottom-0 bottom-10 size-fit",
                    show ? final : initial,
                    className
                )}
                onClick={onClick}
                disabled={!show}
            >
                <Icon />
            </Button>
        </div>
    );
};
