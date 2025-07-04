import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "@/components/ui/toaster";
import "./chat.css";

import { AI } from "./action";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";

const meta = {
    title: "CareerAI - Your Smart Career & Education Companion",
    description:
        "AI-powered career guidance, college information, course details, and educational content for students in India 2025",
};
export const metadata: Metadata = {
    ...meta,
    title: {
        default: "CareerAI - Smart Career Guidance",
        template: `%s - CareerAI`,
    },
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon-16x16.png",
        apple: "/apple-touch-icon.png",
    },
    twitter: {
        ...meta,
        card: "summary_large_image",
        site: "@vercel",
    },
    openGraph: {
        ...meta,
        locale: "en-US",
        type: "website",
    },
};

export const viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "white" },
        { media: "(prefers-color-scheme: dark)", color: "black" },
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1, maximum-scale=1"
            />
            <body
                className={`font-sans antialiased ${GeistSans.variable} ${GeistMono.variable}`}
            >
                <Toaster />
                <AI>
                    <Providers
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <div className="flex flex-col min-h-screen">
                            <Header />
                            <main className="flex flex-col flex-1 bg-muted/50 dark:bg-background px-4 overflow-x-hidden">
                                {children}
                            </main>
                        </div>
                    </Providers>
                </AI>
            </body>
        </html>
    );
}

export const runtime = "edge";
