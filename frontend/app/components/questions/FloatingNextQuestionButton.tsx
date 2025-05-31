// frontend/app/components/questions/FloatingNextQuestionButton.tsx
// Replace your existing component with this enhanced version

import React from 'react';
import { ArrowRight, X } from 'lucide-react';

interface FloatingNextQuestionButtonProps {
  onNextQuestion: () => void;
  isInstant?: boolean;  // ✅ NEW: Question ready for instant switch
  isBlocked?: boolean;  // ✅ NEW: No more questions available
}

const FloatingNextQuestionButton: React.FC<FloatingNextQuestionButtonProps> = ({
  onNextQuestion,
  isInstant = false,
  isBlocked = false
}) => {
  return (
    <button
      onClick={onNextQuestion}
      disabled={isBlocked}
      className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 group ${
        isBlocked 
          ? 'bg-gray-400 cursor-not-allowed opacity-50' 
          : isInstant 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 pulse-glow-green' 
            : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
      }`}
      title={
        isBlocked 
          ? 'No more questions available' 
          : isInstant 
            ? 'Next question ready - instant switch!' 
            : 'Load next question'
      }
    >
      {isBlocked ? (
        <X className="w-6 h-6 text-white" />
      ) : isInstant ? (
        <div className="flex items-center gap-1">
          <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
        </div>
      ) : (
        <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
      )}
      
      {/* ✅ Add CSS for green glow effect */}
      <style jsx>{`
        .pulse-glow-green {
          animation: pulse-glow-green 2s ease-in-out infinite;
        }
        
        @keyframes pulse-glow-green {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.5);
            transform: scale(1.02);
          }
        }
      `}</style>
    </button>
  );
};

export default FloatingNextQuestionButton;