import React from "react";
import Logo from "../logo";
import ThemeToggle from "../theme-toggle";
import { UserButton } from "@daveyplate/better-auth-ui";

const Navbar = () => {
    return (
        <div className="flex justify-between px-2 md:px-10 py-4">
            <Logo />
            <div className="flex gap-4 md:gap-8 items-center">
                <ThemeToggle />
                <UserButton size={"icon"} variant={"ghost"} />
            </div>
        </div>
    );
};

export default Navbar;
