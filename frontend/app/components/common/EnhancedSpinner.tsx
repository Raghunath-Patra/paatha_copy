// components/common/EnhancedSpinner.tsx
'use client';

import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const EnhancedSpinner: React.FC<SpinnerProps> = ({ 
  size = "md", 
  message = "Loading..." 
}) => {
  const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };
  
  return (
    <>
      <style jsx>{`
        @keyframes spin-pulse {
          0% {
            transform: rotate(0deg) scale(1);
            opacity: 1;
          }
          50% {
            transform: rotate(180deg) scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: rotate(360deg) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes dot-bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .enhanced-spinner {
          animation: spin-pulse 1.5s linear infinite;
        }
        
        .dot-1 { animation: dot-bounce 1.4s infinite ease-in-out both; animation-delay: -0.32s; }
        .dot-2 { animation: dot-bounce 1.4s infinite ease-in-out both; animation-delay: -0.16s; }
        .dot-3 { animation: dot-bounce 1.4s infinite ease-in-out both; }
      `}</style>
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className={`${sizeClasses[size]} border-4 border-red-200 rounded-full enhanced-spinner border-t-red-500 border-r-orange-500`}></div>
          <div className={`absolute inset-0 ${sizeClasses[size]} border-4 border-transparent rounded-full animate-ping border-t-red-300`}></div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full dot-1"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full dot-2"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full dot-3"></div>
          </div>
          <span className="text-gray-600 text-sm font-medium">{message}</span>
        </div>
      </div>
    </>
  );
};

export default EnhancedSpinner;