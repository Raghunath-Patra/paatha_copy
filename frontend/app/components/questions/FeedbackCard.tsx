// frontend/app/components/questions/FeedbackCard.tsx
import React, { useState } from 'react';
import ChatFeedback from './ChatFeedback';

interface FeedbackCardProps {
  score: number;
  feedback: string;
  modelAnswer: string;
  explanation: string;
  transcribedText?: string;
  userAnswer?: string;
  className?: string;
  questionId?: string;
  followUpQuestions?: string[]; // Array of follow-up questions
}

const FeedbackCard = ({
  score,
  feedback,
  modelAnswer,
  explanation,
  transcribedText,
  userAnswer,
  className = '',
  questionId = '',
  followUpQuestions = []
}: FeedbackCardProps) => {
  // State to track if chat interface is showing
  const [showChatInterface, setShowChatInterface] = useState(false);
  // New state to track the selected follow-up question
  const [selectedQuestion, setSelectedQuestion] = useState('');
  
  // Construct display answer combining typed and transcribed text
  const displayAnswer = userAnswer || transcribedText 
    ? [
        userAnswer && `Typed:\n${userAnswer.trim()}`,
        transcribedText && `Handwritten:\n${transcribedText.trim()}`
      ].filter(Boolean).join('\n\n')
    : 'No answer provided';

  // Always include the 'feedback-card' class to help identify when feedback is shown
  const combinedClassName = `bg-white rounded-lg shadow-sm p-4 space-y-4 h-full feedback-card ${className}`;

  // Handle follow-up question click
  const handleFollowUpClick = (question: string) => {
    setSelectedQuestion(question);
    setShowChatInterface(true);
  };

  return (
    <div className={combinedClassName}>
      {/* Score Display */}
      <div className="flex items-center gap-3">
        <div className="text-xl font-medium">Score: {score}/10</div>
        <div className={`h-2 flex-1 rounded-full ${
          score >= 8 ? 'bg-green-200' :
          score >= 6 ? 'bg-yellow-200' :
          'bg-red-200'
        }`}>
          <div
            className={`h-2 rounded-full ${
              score >= 8 ? 'bg-green-500' :
              score >= 6 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${score * 10}%` }}
          />
        </div>
      </div>

      <div className="overflow-auto space-y-4">
        {/* Your Answer Section */}
        <div>
          <h3 className="font-medium mb-2">Your Answer</h3>
          <div className="bg-gray-50 rounded p-3">
            <p className="whitespace-pre-wrap text-gray-700">
              {displayAnswer}
            </p>
          </div>
        </div>

        {/* Feedback Section */}
        <div>
          <h3 className="font-medium mb-2">Feedback</h3>
          <p className="text-gray-700">{feedback}</p>
        </div>

        {/* Model Answer Section */}
        <div>
          <h3 className="font-medium mb-2">Model Answer</h3>
          <p className="text-gray-700">{modelAnswer}</p>
        </div>

        {/* Explanation Section */}
        {explanation && (
          <div>
            <h3 className="font-medium mb-2">Explanation</h3>
            <p className="text-gray-700">{explanation}</p>
          </div>
        )}
        
        {/* Follow-up Questions Section */}
        {followUpQuestions && followUpQuestions.length > 0 && !showChatInterface && (
          <div>
            <h3 className="font-medium mb-2">Follow-up Questions</h3>
            <div className="space-y-2">
              {followUpQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleFollowUpClick(question)}
                  className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Chat component - shown when a follow-up question is clicked */}
      {showChatInterface && (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <ChatFeedback
            questionText={feedback.startsWith('Question:') ? 
              feedback.split('Question:')[1].split('\n')[0].trim() : 
              ''}
            userAnswer={userAnswer || ''}
            feedback={feedback}
            modelAnswer={modelAnswer}
            explanation={explanation}
            transcribedText={transcribedText}
            questionId={questionId}
            initialQuestion={selectedQuestion} // Pass the selected question
          />
        </div>
      )}
    </div>
  );
};

export default FeedbackCard;