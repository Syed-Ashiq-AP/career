import React from "react";
import { Clock, Star, TrendUp, Users } from "@phosphor-icons/react";

const CareerStats = () => {
    const stats = [
        {
            icon: <Star size={20} />,
            label: "Top Colleges Covered",
            value: "500+",
            description: "IITs, NITs, Medical & Engineering",
        },
        {
            icon: <TrendUp size={20} />,
            label: "Career Paths",
            value: "100+",
            description: "Detailed career guidance available",
        },
        {
            icon: <Clock size={20} />,
            label: "Updated Info",
            value: "2025",
            description: "Latest exam patterns & syllabi",
        },
        {
            icon: <Users size={20} />,
            label: "Success Stories",
            value: "1000+",
            description: "Students guided successfully",
        },
    ];

    return (
        <div className="mt-8 p-6 dark:bg-slate-800/50 bg-gray-50 rounded-lg border dark:border-slate-700 border-gray-200">
            <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4 text-center">
                Why Choose CareerAI?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                        <div className="flex justify-center mb-2 text-blue-600 dark:text-blue-400">
                            {stat.icon}
                        </div>
                        <div className="text-xl font-bold dark:text-white text-gray-900 mb-1">
                            {stat.value}
                        </div>
                        <div className="text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">
                            {stat.label}
                        </div>
                        <div className="text-xs dark:text-gray-400 text-gray-500">
                            {stat.description}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 text-center">
                <p className="text-sm dark:text-gray-400 text-gray-600">
                    🇮🇳 Specialized for Indian Education System | 📚 NEP 2025
                    Compliant | 🎯 AI-Powered Guidance
                </p>
            </div>
        </div>
    );
};

export default CareerStats;
