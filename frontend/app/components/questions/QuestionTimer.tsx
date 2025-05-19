// frontend/app/components/questions/QuestionTimer.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  isVisible?: boolean;
  onTimeUpdate: (seconds: number) => void;
  shouldStop?: boolean;
  onReset?: () => void;
}

const QuestionTimer = ({ 
  isVisible = true, 
  onTimeUpdate, 
  shouldStop = false,
  onReset 
}: TimerProps) => {
  const [seconds, setSeconds] = useState(0);
  const timerRunning = useRef(true);
  const lastReportedTime = useRef(0);

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

  // Reset effect
  useEffect(() => {
    if (onReset) {
      setSeconds(0);
      timerRunning.current = true;
    }
  }, [onReset]);

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