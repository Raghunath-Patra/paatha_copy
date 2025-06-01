// frontend/app/components/questions/FloatingNextQuestionButton.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface FloatingNextQuestionButtonProps {
  onNextQuestion: () => void;
  visible?: boolean; // Make it optional with no default value
}

const FloatingNextQuestionButton: React.FC<FloatingNextQuestionButtonProps> = ({ 
  onNextQuestion,
  visible // No default value - will be managed based on device type
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if device is mobile (don't show this component on mobile)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is the md breakpoint in Tailwind
    };
    
    // Initial check
    checkMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Update visibility based on props and device type
  useEffect(() => {
    // On desktop, show button always (when not explicitly hidden via visible=false)
    // On mobile, hide the button since we'll use swipe instead
    setIsVisible(visible !== false && !isMobile);
  }, [visible, isMobile]);
  
  // Don't render when not visible
  if (!isVisible) return null;
  
  return (
    <button
      onClick={onNextQuestion}
      className="fixed right-6 bottom-24 z-50 bg-blue-600 hover:bg-blue-700 
                text-white rounded-full p-4 shadow-lg flex items-center justify-center"
      aria-label="Next Question"
    >
      <div className="flex items-center">
        <span className="mr-2 font-medium">Next Question</span>
        <ArrowRight size={20} />
      </div>
    </button>
  );
};

export default FloatingNextQuestionButton;