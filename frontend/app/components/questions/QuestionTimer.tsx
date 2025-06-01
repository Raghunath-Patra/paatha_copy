// frontend/app/components/questions/QuestionTimer.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  isVisible?: boolean;
  onTimeUpdate: (seconds: number) => void;
  shouldStop?: boolean;
  resetTrigger?: number; // Changed: Use a number that increments to trigger reset
}

const QuestionTimer = ({ 
  isVisible = true, 
  onTimeUpdate, 
  shouldStop = false,
  resetTrigger = 0 // Changed: Default to 0
}: TimerProps) => {
  const [seconds, setSeconds] = useState(0);
  const timerRunning = useRef(true);
  const lastReportedTime = useRef(0);
  const lastResetTrigger = useRef(0); // Track the last reset trigger value

  // Immediate effect when shouldStop changes
  useEffect(() => {
    if (shouldStop) {
      console.log('Timer stopped immediately at:', seconds);
      timerRunning.current = false;
      
      // Ensure we report the final time
      if (lastReportedTime.current !== seconds) {
        lastReportedTime.current = seconds;
        onTimeUpdate(seconds);
      }
    }
  }, [shouldStop, seconds, onTimeUpdate]);

  // Report time to parent whenever seconds changes
  useEffect(() => {
    lastReportedTime.current = seconds;
    onTimeUpdate(seconds);
  }, [seconds, onTimeUpdate]);

  // Reset effect - Fixed logic
  useEffect(() => {
    if (resetTrigger !== lastResetTrigger.current && resetTrigger > 0) {
      console.log('Resetting timer from useEffect, trigger:', resetTrigger);
      setSeconds(0);
      timerRunning.current = true;
      lastResetTrigger.current = resetTrigger;
      lastReportedTime.current = 0;
      
      // Report the reset time immediately
      onTimeUpdate(0);
    }
  }, [resetTrigger, onTimeUpdate]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (!shouldStop) {
      timerRunning.current = true;
      interval = setInterval(() => {
        if (timerRunning.current) {
          setSeconds(prev => prev + 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [shouldStop]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Clock size={16} />
      <span 
        className={`font-medium ${shouldStop ? 'text-red-600' : ''}`} 
        data-testid="timer-display"
      >
        {formatTime(seconds)}
        {shouldStop && <span className="ml-1">(stopped)</span>}
      </span>
    </div>
  );
};

export default QuestionTimer;