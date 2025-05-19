// frontend/app/components/questions/SwipeToNextQuestion.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

interface SwipeToNextQuestionProps {
  onNextQuestion: () => void;
  visible?: boolean; // Make it optional with no default value
}

const SwipeToNextQuestion: React.FC<SwipeToNextQuestionProps> = ({
  onNextQuestion,
  visible // No default value - will be managed based on device type
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const maxTrackWidth = 240; // Maximum width of the track
  const requiredSwipePercentage = 80; // Percentage of track that needs to be swiped
  
  // Check if device is desktop (don't show this component on desktop)
  useEffect(() => {
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 768); // 768px is the md breakpoint in Tailwind
    };
    
    // Initial check
    checkDevice();
    
    // Listen for resize events
    window.addEventListener('resize', checkDevice);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Detect when camera is active by checking for fullscreen video element
  useEffect(() => {
    const checkForCamera = () => {
      // Look for the video element that indicates camera is active
      const cameraElement = document.querySelector('video');
      const fullscreenCamera = document.querySelector('.fixed.inset-0.z-50');
      
      // If either is found, camera is likely active
      setIsCameraActive(!!cameraElement || !!fullscreenCamera);
    };

    // Check initially and on mutation
    checkForCamera();
    
    // Set up mutation observer to detect DOM changes (camera opening/closing)
    const observer = new MutationObserver(checkForCamera);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);
  
  // Update visibility based on props, device type, and camera status
  useEffect(() => {
    // Hide when camera is active, regardless of other conditions
    if (isCameraActive) {
      setIsVisible(false);
      return;
    }
    
    // On mobile, show swipe gesture always (when not explicitly hidden via visible=false)
    // On desktop, hide the swipe since we'll use the floating button instead
    setIsVisible(visible !== false && !isDesktop);
  }, [visible, isDesktop, isCameraActive]);
  
  // Reset position when visibility changes
  useEffect(() => {
    setPosition(0);
  }, [isVisible]);
  
  // Handle touch/mouse events
  const handleStart = (clientX: number) => {
    if (!isVisible) return;
    setIsDragging(true);
    setStartX(clientX);
  };
  
  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    
    // Calculate new position
    const diff = clientX - startX;
    const newPosition = Math.max(0, Math.min(maxTrackWidth, diff));
    setPosition(newPosition);
    
    // Check if swiped far enough to trigger
    if (newPosition >= (maxTrackWidth * requiredSwipePercentage / 100)) {
      // Trigger the next question action
      setIsDragging(false);
      setPosition(0);
      onNextQuestion();
    }
  };
  
  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Reset position if not swiped far enough
    if (position < (maxTrackWidth * requiredSwipePercentage / 100)) {
      setPosition(0);
    }
  };
  
  // Don't render when not visible
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-24 inset-x-0 z-40 flex justify-center px-4">
      <div 
        ref={trackRef}
        className="relative bg-gray-200 rounded-full h-14 w-full max-w-xs shadow-md"
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => isDragging && handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
      >
        {/* Track background with text */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-medium pointer-events-none">
          Swipe to Next Question <ArrowRight className="ml-2" size={18} />
        </div>
        
        {/* Draggable handle */}
        <div 
          ref={handleRef}
          className="absolute left-0 top-0 bottom-0 flex items-center justify-center
                    bg-blue-600 rounded-full h-14 min-w-14 shadow-sm cursor-grab"
          style={{ 
            width: `${Math.max(56, position)}px`
          }}
        >
          <ArrowRight className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
};

export default SwipeToNextQuestion;