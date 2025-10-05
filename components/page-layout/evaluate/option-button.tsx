import React, { FC } from "react";
import { buttonVariants } from "../../ui/button";
import { NeumorphButton, NeumorphButtonProps } from "../../ui/neumorph-button";
import { HTMLMotionProps } from "framer-motion";
import { VariantProps } from "class-variance-authority";

export interface OptionButtonProps
    extends HTMLMotionProps<"button">,
        VariantProps<typeof buttonVariants> {
    children: React.ReactNode;
}

const OptionButton: FC<NeumorphButtonProps> = ({ children, ...props }) => {
    return <NeumorphButton {...props}>{children}</NeumorphButton>;
};

export default OptionButton;
