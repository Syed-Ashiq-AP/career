import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-ui-provider";
import { UserProvider } from "@/components/user-context";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Career Generator",
    description: "Get career Advice",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1"
                />
            </head>
            <body
                className={`${inter.variable} ${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
            >
                <AuthProvider>
                    <UserProvider>
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="dark"
                            enableSystem
                            disableTransitionOnChange
                        >
                            {children}

                            <Toaster />
                        </ThemeProvider>
                    </UserProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
