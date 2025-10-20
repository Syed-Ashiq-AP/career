"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type VideoResult = { imageUrl: string; link: string; title?: string };
const Videos = ({ videos }: { videos?: VideoResult[] | null }) => {
    const [hovered, setHovered] = useState<number | null>(null);
    const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

    const handleImageError = (index: number) => {
        setFailedImages((prev) => new Set(prev).add(index));
    };

    if (!videos || videos.length === 0) {
        return (
            <div className="flex items-center justify-center h-32">
                <p className="text-gray-500">No videos available</p>
            </div>
        );
    }

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
                            {!failedImages.has(index) && video.imageUrl ? (
                                <motion.img
                                    src={video.imageUrl}
                                    alt={video.title || `Video thumbnail`}
                                    className={`w-full rounded-lg object-cover transition-all duration-300 ease-in-out ${
                                        hovered === null
                                            ? "blur-0 scale-100"
                                            : hovered === index
                                              ? "blur-0 scale-105 brightness-75"
                                              : "blur-xs"
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    onError={(event) => {
                                        // Try fallback thumbnail sizes for YouTube
                                        const currentSrc = (
                                            event.target as HTMLImageElement
                                        ).src;
                                        if (
                                            currentSrc.includes(
                                                "maxresdefault.jpg"
                                            )
                                        ) {
                                            // Fallback to medium quality
                                            (
                                                event.target as HTMLImageElement
                                            ).src = currentSrc.replace(
                                                "maxresdefault.jpg",
                                                "mqdefault.jpg"
                                            );
                                        } else if (
                                            currentSrc.includes("mqdefault.jpg")
                                        ) {
                                            // Fallback to standard quality
                                            (
                                                event.target as HTMLImageElement
                                            ).src = currentSrc.replace(
                                                "mqdefault.jpg",
                                                "sddefault.jpg"
                                            );
                                        } else {
                                            // Final fallback - show placeholder
                                            handleImageError(index);
                                        }
                                    }}
                                />
                            ) : (
                                // Fallback when thumbnail fails to load or is missing
                                <div
                                    className={`w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out ${
                                        hovered === null
                                            ? "scale-100"
                                            : hovered === index
                                              ? "scale-105 brightness-75"
                                              : ""
                                    }`}
                                >
                                    <div className="text-center">
                                        <svg
                                            className="w-12 h-12 mx-auto text-gray-400 mb-2"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <p className="text-sm text-gray-500">
                                            {video.title || "Video"}
                                        </p>
                                    </div>
                                </div>
                            )}

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
                                    "absolute transition-all p-2 text-xs text-white font-medium bg-black/50 rounded",
                                    hovered === null
                                        ? "top-full opacity-0 -bottom-full"
                                        : hovered === index &&
                                              " top-auto bottom-2 left-2 right-2 opacity-100"
                                )}
                            >
                                {video.title || "Video"}
                            </motion.span>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Videos;
