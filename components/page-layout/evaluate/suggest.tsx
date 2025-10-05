import { Career } from "@/components/providers/career-evaluation-provider";
import CareerCard from "./career-card";
import { useState } from "react";
import { toast } from "sonner";

const Suggest = ({
    careers,
    onGuide,
}: {
    careers: Career[];
    onGuide: ((career: string) => Promise<void>) | null;
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGuide = async (career: string) => {
        setIsLoading(true);
        try {
            await onGuide?.(career);
        } catch {
            toast("Failed to load guide!");
        }
        setIsLoading(false);
    };

    return careers.map((career, i) => (
        <CareerCard
            onGuide={handleGuide}
            isLoading={isLoading}
            key={i}
            career={career.title}
            rank={i + 1}
            description={career.description}
            match={career.match_percentage}
        />
    ));
};

export default Suggest;
