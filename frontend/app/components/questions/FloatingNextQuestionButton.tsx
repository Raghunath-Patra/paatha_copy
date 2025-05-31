// frontend/app/components/questions/FloatingNextQuestionButton.tsx
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface FloatingNextQuestionButtonProps {
  onNextQuestion: () => void;
}

const FloatingNextQuestionButton: React.FC<FloatingNextQuestionButtonProps> = ({
  onNextQuestion
}) => {
  return (
    <button
      onClick={onNextQuestion}
      className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-full shadow-lg hover:from-red-600 hover:to-orange-600 transition-all duration-300 hover:scale-110 group"
      aria-label="Next Question"
    >
      <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
    </button>
  );
};

export default FloatingNextQuestionButton;