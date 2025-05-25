// frontend/app/components/common/QuestionLimitIndicator.tsx - Fixed version with skeleton loading

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userTokenService } from '../../utils/userTokenService';

interface UserTokenStatus {
  input_limit: number;
  output_limit: number;
  input_used: number;
  output_used: number;
  input_remaining: number;
  output_remaining: number;
  limit_reached: boolean;
  questions_used_today: number;
  plan_name: string;
  display_name: string;
  usage_percentage: number;
  questions_remaining_estimate: number;
  can_fetch_question: boolean;
  can_submit_answer: boolean;
  warning_level: 'safe' | 'warning' | 'critical' | 'blocked';
  timestamp: number;
}

const QuestionLimitIndicator: React.FC = () => {
  const [status, setStatus] = useState<UserTokenStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // Get initial cached status
    const cachedStatus = userTokenService.getTokenStatus();
    if (cachedStatus) {
      setStatus(cachedStatus);
      setIsInitialLoad(false);
      console.log('✅ Initial token status from cache:', {
        warningLevel: cachedStatus.warning_level,
        questionsUsed: cachedStatus.questions_used_today,
        questionsRemaining: cachedStatus.questions_remaining_estimate
      });
    } else {
      // No cached data, trigger background fetch
      setIsRefreshing(true);
      userTokenService.fetchUserTokenStatus();
    }

    // Subscribe to token updates
    const unsubscribe = userTokenService.onTokenUpdate((newStatus: UserTokenStatus) => {
      console.log('🔄 Token status updated:', {
        warningLevel: newStatus.warning_level,
        questionsUsed: newStatus.questions_used_today,
        questionsRemaining: newStatus.questions_remaining_estimate
      });

      // Check if data has meaningfully changed to trigger animation
      if (status && (
        newStatus.questions_used_today !== status.questions_used_today ||
        newStatus.input_used !== status.input_used ||
        newStatus.output_used !== status.output_used ||
        newStatus.warning_level !== status.warning_level
      )) {
        setRecentlyUpdated(true);
        setTimeout(() => setRecentlyUpdated(false), 2000);
      }

      setStatus(newStatus);
      setIsRefreshing(false);
      setIsInitialLoad(false);
    });

    // Periodic refresh to ensure data freshness (every 2 minutes)
    const refreshInterval = setInterval(() => {
      const currentStatus = userTokenService.getTokenStatus();
      if (!currentStatus) {
        // No cached data, fetch in background
        setIsRefreshing(true);
        userTokenService.fetchUserTokenStatus();
      }
    }, 2 * 60 * 1000); // 2 minutes

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [status]);

  // Show skeleton loading during initial load or when no data and refreshing
  if (isInitialLoad || (!status && isRefreshing)) {
    return (
      <>
        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
          
          .animate-pulse-custom {
            animation: pulse 1.5s ease-in-out infinite;
          }
        `}</style>

        <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-3 w-full relative overflow-hidden">
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
          
          <div className="space-y-2 relative">
            {/* Status text skeleton */}
            <div className="flex justify-between items-center text-xs">
              <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24 animate-pulse-custom"></div>
              <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-16 animate-pulse-custom" 
                   style={{ animationDelay: '0.2s' }}></div>
            </div>
            
            {/* Progress bar skeleton */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-gray-300 to-gray-400 rounded-full animate-pulse-custom w-1/3"
                   style={{ animationDelay: '0.4s' }}></div>
            </div>
            
            {/* Loading indicator */}
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="animate-pulse-custom">Loading usage...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show minimal skeleton if no data but not actively loading
  if (!status && !isRefreshing) {
    return (
      <div className="bg-gray-50 rounded-md shadow-sm p-3 w-full opacity-50 border border-gray-200">
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 rounded w-20 animate-pulse mx-auto"></div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="h-full bg-gray-300 rounded-full w-1/4 animate-pulse"></div>
          </div>
          <div className="text-xs text-gray-400 text-center animate-pulse">
            Usage unavailable
          </div>
        </div>
      </div>
    );
  }

  // Determine color and styling based on warning level
  const getIndicatorStyles = () => {
    if (!status) {
      return {
        barColor: 'bg-gray-300',
        textColor: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
    }

    switch (status.warning_level) {
      case 'blocked':
        return {
          barColor: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'critical':
        return {
          barColor: 'bg-red-400',
          textColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'warning':
        return {
          barColor: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'safe':
      default:
        return {
          barColor: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
    }
  };

  const styles = getIndicatorStyles();

  // Format the display message based on status
  const getDisplayMessage = () => {
    if (!status) {
      return { primary: 'Loading...', secondary: 'Checking usage' };
    }

    if (status.limit_reached) {
      return {
        primary: 'Daily limit reached',
        secondary: 'Upgrade to Premium for more'
      };
    }

    if (status.warning_level === 'critical') {
      return {
        primary: `${status.questions_used_today} questions used`,
        secondary: `~${status.questions_remaining_estimate} remaining today`
      };
    }

    if (status.warning_level === 'warning') {
      return {
        primary: `${status.questions_used_today} questions used`,
        secondary: `~${status.questions_remaining_estimate} remaining`
      };
    }

    // Safe level
    return {
      primary: `${status.questions_used_today} questions today`,
      secondary: status.display_name || status.plan_name
    };
  };

  const displayMessage = getDisplayMessage();

  return (
    <>
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 0 rgba(59, 130, 246, 0.4);
            transform: scale(1);
          }
          50% { 
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
            transform: scale(1.02);
          }
        }
        
        @keyframes progress-fill {
          from { width: 0%; }
          to { width: var(--target-width); }
        }
        
        .pulse-glow {
          animation: pulse-glow 1.5s infinite;
        }
        
        .progress-animate {
          animation: progress-fill 1s ease-out forwards;
        }
      `}</style>

      <div 
        className={`${styles.bgColor} ${styles.borderColor} border rounded-lg shadow-sm p-3 w-full transition-all duration-300 ${
          isRefreshing ? 'opacity-70' : 'opacity-100'
        } ${recentlyUpdated ? 'pulse-glow' : ''}`}
      >
        <div className="space-y-2">
          {/* Status text */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs">
            <span className={`${styles.textColor} font-medium transition-all duration-300 ${
              recentlyUpdated ? 'scale-105' : 'scale-100'
            }`}>
              {displayMessage.primary}
            </span>
            <span className={`text-gray-500 mt-0.5 sm:mt-0 text-right ${
              recentlyUpdated ? 'text-blue-600 font-medium' : ''
            }`}>
              {displayMessage.secondary}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden relative">
            {status && (
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${styles.barColor} ${
                  recentlyUpdated ? 'progress-animate' : ''
                }`}
                style={{ 
                  width: `${Math.min(100, status.usage_percentage)}%`,
                  '--target-width': `${Math.min(100, status.usage_percentage)}%`
                } as React.CSSProperties}
              />
            )}
            
            {/* Shimmer effect for active progress */}
            {status && status.usage_percentage > 0 && recentlyUpdated && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            )}
          </div>
          
          {/* Warning messages */}
          {status && status.warning_level === 'critical' && (
            <div className="flex items-center gap-1 text-xs text-red-600 font-medium animate-pulse">
              <span>⚠️</span>
              <span>Nearly at daily limit!</span>
            </div>
          )}
          
          {status && status.limit_reached && (
            <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
              <span>🚫</span>
              <span>Daily limit reached</span>
            </div>
          )}
          
          {/* Refreshing indicator */}
          {isRefreshing && status && (
            <div className="flex items-center justify-center gap-1 text-xs text-blue-600">
              <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Updating...</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QuestionLimitIndicator;