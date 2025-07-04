import React from 'react';
import { IconPlus } from '@/components/ui/icons';

interface InitialQueriesProps {
  questions: string[];
  handleFollowUpClick: (question: string) => void;
}

const InitialQueries = ({ questions, handleFollowUpClick }: InitialQueriesProps) => {
  const handleQuestionClick = (question: string) => {
    handleFollowUpClick(question);
  };
  
  return (
    <div className="">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-2">
          Popular Career & Education Queries
        </h3>
        <p className="text-sm dark:text-gray-400 text-gray-600">
          Click on any question below to get started
        </p>
      </div>
      <ul className="mt-2 space-y-2">
        {questions.map((question, index) => (
          <li
            key={index}
            className="flex items-center cursor-pointer dark:bg-slate-800 bg-white shadow-lg rounded-lg p-4 hover:shadow-xl transition-shadow border dark:border-slate-700 border-gray-200"
            onClick={() => handleQuestionClick(question)}
          >
            <span role="img" aria-label="career" className="mr-3 dark:text-blue-400 text-blue-600">
              <IconPlus />
            </span>
            <p className="dark:text-white text-gray-900 text-sm sm:text-base font-medium leading-relaxed">{question}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InitialQueries;