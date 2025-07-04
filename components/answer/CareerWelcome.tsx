import React from 'react';
import { GraduationCap, BookOpen, Target, Users } from '@phosphor-icons/react';

interface CareerWelcomeProps {
  handleFollowUpClick: (question: string) => void;
}

const CareerWelcome = ({ handleFollowUpClick }: CareerWelcomeProps) => {
  const careerCategories = [
    {
      icon: <GraduationCap size={24} />,
      title: "Engineering & Technology",
      description: "IITs, NITs, Engineering Colleges, JEE Preparation",
      examples: ["Best engineering colleges 2025", "JEE Main preparation strategy", "Computer Science vs IT"]
    },
    {
      icon: <BookOpen size={24} />,
      title: "Medical & Healthcare",
      description: "MBBS, NEET, Medical Colleges, Healthcare Careers",
      examples: ["NEET 2025 exam pattern", "Top medical colleges in India", "AIIMS admission process"]
    },
    {
      icon: <Target size={24} />,
      title: "Career Planning",
      description: "Stream Selection, Career Options, Skill Development",
      examples: ["Science vs Commerce after 10th", "Highest paying careers 2025", "Skills for future jobs"]
    },
    {
      icon: <Users size={24} />,
      title: "Scholarships & Support",
      description: "Government Schemes, Financial Aid, Reservations",
      examples: ["Scholarships for SC/ST students", "Education loans for engineering", "Merit scholarships 2025"]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 mb-6 md:mb-8">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 dark:text-white text-gray-900">
          Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CareerAI</span>
        </h1>
        <p className="text-base md:text-lg dark:text-gray-300 text-gray-600 mb-2">
          Your Smart Career & Education Companion
        </p>
        <p className="text-sm md:text-base dark:text-gray-400 text-gray-500">
          Get comprehensive guidance on courses, colleges, entrance exams, and career planning for India 2025
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
        {careerCategories.map((category, index) => (
          <div key={index} className="dark:bg-slate-800 bg-white rounded-lg p-3 md:p-4 border dark:border-slate-700 border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-2 md:mb-3">
              <div className="text-blue-600 dark:text-blue-400 mr-2 md:mr-3 flex-shrink-0">
                {category.icon}
              </div>
              <h3 className="text-base md:text-lg font-semibold dark:text-white text-gray-900">{category.title}</h3>
            </div>
            <p className="text-xs md:text-sm dark:text-gray-300 text-gray-600 mb-2 md:mb-3">{category.description}</p>
            <div className="space-y-1">
              {category.examples.map((example, exampleIndex) => (
                <button
                  key={exampleIndex}
                  onClick={() => handleFollowUpClick(example)}
                  className="block w-full text-left text-xs dark:text-blue-400 text-blue-600 hover:underline py-1"
                >
                  • {example}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-xs md:text-sm dark:text-gray-400 text-gray-500 mb-3 md:mb-4">
          💡 Pro Tip: You can ask specific questions like "Best colleges for Computer Science in Tamil Nadu" or "How to prepare for GATE 2025"
        </p>
        <div className="flex flex-wrap justify-center gap-1 md:gap-2">
          <span className="px-2 md:px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
            Entrance Exams
          </span>
          <span className="px-2 md:px-3 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
            College Rankings
          </span>
          <span className="px-2 md:px-3 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
            Study Plans
          </span>
          <span className="px-2 md:px-3 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full">
            Career Guidance
          </span>
        </div>
      </div>
    </div>
  );
};

export default CareerWelcome;
