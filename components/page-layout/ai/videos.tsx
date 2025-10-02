"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type VideoResult = { imageUrl: string; link: string };
const Videos = ({ videos }: { videos?: VideoResult[] | null }) => {
    const [hovered, setHovered] = useState<number | null>(null);

    if (!videos) return;
    return (
        <div className="min-h-screen px-4 py-20 md:px-6 rounded-lg border bg-card p-5 w-full">
            <div className="columns-1 gap-4 space-y-4 transition-all sm:columns-2 md:columns-3">
                {videos.map((video, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        onMouseEnter={() => setHovered(index)}
                        onMouseLeave={() => setHovered(null)}
                        className="group relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 ease-in-out"
                    >
                        <Link href={video.link} target="_blank">
                            <motion.img
                                src={video.imageUrl}
                                alt={`Video thumbnail`}
                                className={`w-full rounded-lg object-cover transition-all duration-300 ease-in-out ${
                                    hovered === null
                                        ? "blur-0 scale-100"
                                        : hovered === index
                                          ? "blur-0 scale-105 brightness-75"
                                          : "blur-xs"
                                }`}
                                whileHover={{ scale: 1.05 }}
                            />

                            {/* Dark overlay on hover */}
                            <div
                                className={`absolute inset-0 bg-black/30 rounded-lg transition-opacity duration-300 ease-in-out ${
                                    hovered === index
                                        ? "opacity-100"
                                        : "opacity-0"
                                }`}
                            />

                            {/* Play button overlay */}
                            <div
                                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ease-in-out ${
                                    hovered === index
                                        ? "opacity-100"
                                        : "opacity-0"
                                }`}
                            >
                                <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                                    <svg
                                        className="w-8 h-8 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            </div>

                            <motion.span
                                className={cn(
                                    "absolute transition-all p-2 text-xs text-white font-medium",
                                    hovered === null
                                        ? "top-full opacity-0 -bottom-full"
                                        : hovered === index &&
                                              " top-auto bottom-0 opacity-100"
                                )}
                            >
                                Video
                            </motion.span>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Videos;
