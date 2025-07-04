"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const Logo = () => {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !theme)
        return (
            <a href="../">
                <img
                    src={`/logo-light.webp`}
                    alt="Crescent Logo"
                    className="w-46 p-2"
                />
            </a>
        );

    return (
        <a href="../">
            <img
                src={`/logo-${theme}.webp`}
                alt="Crescent Logo"
                className="w-46 p-2"
            />
        </a>
    );
};

export default Logo;
