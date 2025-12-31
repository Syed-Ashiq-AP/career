"use client";

import { Survey } from "@/components/evaluate/Survey";
import { Navbar } from "@/components/side-panel/navbar";

export default function Home() {
    return (
        <main className="size-full flex flex-col items-center relative overflow-hidden">
            <Navbar />
            <Survey />
        </main>
    );
}
