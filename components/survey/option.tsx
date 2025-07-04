import React from "react";

const Option = () => {
    return (
        <button className="w-full text-left p-4 rounded-lg border  hover:border-blue-600 hover:bg-blue-900 transition-all duration-200 group">
            <div className="flex items-start">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-900 group-hover:bg-blue-100 text-gray-600 group-hover:text-blue-600 rounded-full text-sm font-medium mr-3 flex-shrink-0">
                    A
                </span>
                <div className="flex-1">
                    <p className="font-medium">option</p>
                </div>
            </div>
        </button>
    );
};

export default Option;
