import { VariantProps } from "class-variance-authority";
import { HTMLMotionProps } from "motion/react";
import React, { ReactNode } from "react";
import { buttonVariants } from "../ui/button";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ButtonProps
  extends HTMLMotionProps<"button">,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  backgroundImage?: string;
  imageLoading?: boolean;
}

export const Button = ({
  children,
  backgroundImage,
  imageLoading = false,
  className,
  style,
  ...props
}: ButtonProps) => {
  return (
    <motion.button
      className={cn(
        "justify-center px-4 text-sm font-medium items-center transition-[box-shadow,background-color] disabled:cursor-not-allowed disabled:opacity-50 flex active:transition-none bg-[#36322F]  text-white  hover:enabled:bg-[#4a4542]  disabled:bg-[#8c8885] [box-shadow:inset_0px_-2.108433723449707px_0px_0px_#171310,0px_1.2048193216323853px_6.325301647186279px_0px_rgba(58,33,8,58%)]hover:enabled:[box-shadow:inset_0px_-2.53012px_0px_0px_#171310,0px_1.44578px_7.59036px_0px_rgba(58,33,8,64%)] disabled:shadow-none active:bg-[#2A2724] active:[box-shadow:inset_0px_-1.5px_0px_0px_#171310,0px_0.5px_2px_0px_rgba(58,33,8,70%)]  py-2 rounded-[9px]",
        "bg-cover bg-center bg-no-repeat relative overflow-hidden",
        className
      )}
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${backgroundImage})`,
      }}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      {...props}
    >
      {imageLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}
      <span className={cn("relative z-10", imageLoading && "opacity-50")}>
        {children}
      </span>
    </motion.button>
  );
};
