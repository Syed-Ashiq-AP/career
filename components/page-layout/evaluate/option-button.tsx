import React, { FC } from "react";
import { buttonVariants } from "../../ui/button";
import { NeumorphButton, NeumorphButtonProps } from "../../ui/neumorph-button";
import { HTMLMotionProps } from "framer-motion";
import { VariantProps } from "class-variance-authority";

export interface OptionButtonProps
  extends HTMLMotionProps<"button">,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  backgroundImage?: string;
}

const OptionButton: FC<NeumorphButtonProps & { backgroundImage?: string }> = ({
  children,
  backgroundImage,
  className,
  style,
  ...props
}) => {
  const combinedStyle = backgroundImage
    ? {
        ...style,
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : style;

  return (
    <NeumorphButton className={className} style={combinedStyle} {...props}>
      {children}
    </NeumorphButton>
  );
};

export default OptionButton;
