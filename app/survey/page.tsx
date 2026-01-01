"use client";

import { Survey } from "@/components/evaluate/Survey";
import { Navbar } from "@/components/side-panel/navbar";

export default function Home() {
    return (
        <main className="h-screen w-full flex flex-col overflow-hidden bg-background">
            <Navbar />
            <div className="flex-1 overflow-y-auto">
                <Survey />
            </div>
        </main>
    );
}
