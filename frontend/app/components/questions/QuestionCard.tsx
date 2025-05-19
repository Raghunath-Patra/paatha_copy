// frontend/app/components/questions/QuestionCard.tsx

import React from 'react';
import StatsCard from './StatsCard';

interface QuestionCardProps {
  question: string;
  difficulty: string;
  type: string;
  bloomLevel?: string;
  category?: string;
  questionNumber?: string;
  statistics?: {
    total_attempts: number;
    average_score: number;
  };
}

const QuestionCard = ({
  question,
  difficulty,
  type,
  bloomLevel,
  category,
  questionNumber,
  statistics
}: QuestionCardProps) => {
  // Extract just the number from questionNumber if it exists
  const number = questionNumber?.match(/\d+$/)?.[0];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 min-h-[200px] flex flex-col question-card">
      {/* Responsive metadata tags */}
      <div className="flex flex-wrap gap-1.5 mb-2 metadata-tags">
        {/* Question number */}
        {number && (
          <div className="metadata-tag bg-gray-100 text-gray-800 text-center rounded-full px-2 py-0.5 text-xs">
            Q #{number.padStart(3, '0')}
          </div>
        )}
        
        {/* Source/Category */}
        {category && (
          <div className="metadata-tag bg-orange-100 text-orange-800 text-center rounded-full px-2 py-0.5 text-xs">
            {category}
          </div>
        )}

        {/* Difficulty */}
        <div className="metadata-tag bg-blue-100 text-blue-800 text-center rounded-full px-2 py-0.5 text-xs">
          Level: {difficulty}
        </div>

        {/* Question Type */}
        <div className="metadata-tag bg-purple-100 text-purple-800 text-center rounded-full px-2 py-0.5 text-xs">
          Type: {type}
        </div>

        {/* Bloom's Level */}
        {bloomLevel && (
          <div className="metadata-tag bg-green-100 text-green-800 text-center rounded-full px-2 py-0.5 text-xs">
            Bloom: {bloomLevel}
          </div>
        )}
      </div>

      {/* Statistics Display */}
      {statistics && (
        <StatsCard 
          totalAttempts={statistics.total_attempts}
          averageScore={statistics.average_score}
        />
      )}
      
      {/* Question text */}
      <div className="prose max-w-none flex-grow mt-2 sm:mt-4 question-text">
        <p className="whitespace-pre-line leading-relaxed">
          {question.split('\n\n').map((paragraph, i) => (
            <React.Fragment key={i}>
              {paragraph.split('\n').map((line, j) => (
                <React.Fragment key={j}>
                  {line}
                  {j < paragraph.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
              {i < question.split('\n\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      </div>
    </div>
  );
};

export default QuestionCard;