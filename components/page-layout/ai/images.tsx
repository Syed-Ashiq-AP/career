"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type ImageResult = { title: string; link: string };
const Images = ({ images }: { images?: ImageResult[] | null }) => {
    const [hovered, setHovered] = useState<number | null>(null);

    if (!images) return;
    return (
        <div className="min-h-screen px-4 py-20 md:px-6 rounded-lg border bg-card p-5 w-full">
            <div className="columns-1 gap-4 space-y-4 transition-all sm:columns-2 md:columns-3">
                {images.map((img, index) => (
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
                        <Link href={img.link} target="_blank">
                            <motion.img
                                src={img.link}
                                alt={img.title}
                                className={`w-full rounded-lg object-cover transition-all duration-300 ease-in-out ${
                                    hovered === null
                                        ? "blur-0 scale-100"
                                        : hovered === index
                                          ? "blur-0 scale-105 brightness-75"
                                          : "blur-xs"
                                }`}
                                whileHover={{ scale: 1.05 }}
                            />
                            <div
                                className={`absolute inset-0 bg-black/30 rounded-lg transition-opacity duration-300 ease-in-out ${
                                    hovered === index
                                        ? "opacity-100"
                                        : "opacity-0"
                                }`}
                            />
                            <motion.span
                                className={cn(
                                    "absolute transition-all p-2 text-xs",
                                    hovered === null
                                        ? "top-full opacity-0 -bottom-full"
                                        : hovered === index &&
                                              " top-auto bottom-0 opacity-100"
                                )}
                            >
                                {img.title}
                            </motion.span>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Images;
