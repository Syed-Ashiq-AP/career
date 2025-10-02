import React, { FC } from "react";
import { buttonVariants } from "../../ui/button";
import { NeumorphButton } from "../../ui/neumorph-button";
import { HTMLMotionProps } from "framer-motion";
import { VariantProps } from "class-variance-authority";

export interface OptionButtonProps
    extends HTMLMotionProps<"button">,
        VariantProps<typeof buttonVariants> {
    children: React.ReactNode;
}

const OptionButton: FC<OptionButtonProps> = ({ children, size, ...props }) => {
    // Map the size prop to NeumorphButton's expected values
    let mappedSize: "small" | "medium" | "large" | null | undefined;
    switch (size) {
        case "sm":
            mappedSize = "small";
            break;
        case "lg":
            mappedSize = "large";
            break;
        case "default":
        case undefined:
        case null:
            mappedSize = "medium";
            break;
        default:
            mappedSize = undefined;
    }

    return (
        <NeumorphButton {...props} size={mappedSize}>
            {children}
        </NeumorphButton>
    );
};

export default OptionButton;
