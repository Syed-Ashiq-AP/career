import { Career } from "@/components/providers/career-evaluation-provider";
import CareerCard from "./career-card";

// const careers = [
//     {
//         title: "Back-End Developer",
//         description:
//             "This role involves solving complex technical problems, particularly in software development, and aligns perfectly with your interest in Node.js and building secure systems.",
//         match_percentage: 95,
//     },
//     {
//         title: "Software Engineer",
//         description:
//             "As a software engineer, you can focus on back-end development, particularly in web applications and API services, matching your skills in analytical problem-solving and preference for cloud-based platforms.",
//         match_percentage: 93,
//     },
//     {
//         title: "DevOps Engineer",
//         description:
//             "This position involves working with cloud technologies and tools, focusing on building scalable applications and integrating security measures, which aligns with your interests in AWS and DevOps practices.",
//         match_percentage: 90,
//     },
// ];

const Suggest = ({ careers }: { careers: Career[] }) => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-neutral-950 px-2 gap-8 flex-wrap">
            {careers.map((career, i) => (
                <CareerCard
                    key={i}
                    career={career.title}
                    rank={i + 1}
                    description={career.description}
                    match={career.match_percentage}
                />
            ))}
        </div>
    );
};

export default Suggest;
