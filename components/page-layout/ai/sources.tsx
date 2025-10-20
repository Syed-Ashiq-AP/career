import React from "react";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

interface SourceItem {
    title?: string;
    link?: string;
    favicon?: string;
}

interface SourcesProps {
    sources?: SourceItem[];
}

const Sources = ({ sources = [] }: SourcesProps) => {
    if (!sources || sources.length === 0) {
        return (
            <div className="flex flex-wrap w-full">
                <p className="text-gray-500 text-center w-full">
                    No sources available
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-2 w-full">
            {sources.map((source, index) => (
                <a
                    key={index}
                    href={source.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    {source.favicon && (
                        <Image
                            src={source.favicon}
                            alt=""
                            width={16}
                            height={16}
                            className="flex-shrink-0"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                            }}
                        />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                            {source.title || "Untitled"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {source.link}
                        </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </a>
            ))}
        </div>
    );
};

export default Sources;
