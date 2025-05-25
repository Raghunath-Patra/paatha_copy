// components/common/EnhancedBoardCard.tsx
'use client';

import React, { useState } from 'react';

interface ClassInfo {
  display_name: string;
}

interface Classes {
  [key: string]: ClassInfo;
}

interface EnhancedBoardCardProps {
  board: string;
  displayName: string;
  classes: Classes;
  onClick: (board: string, classKey: string) => void;
  isLoading?: boolean;
}

const EnhancedBoardCard: React.FC<EnhancedBoardCardProps> = ({ 
  board, 
  displayName, 
  classes, 
  onClick, 
  isLoading = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm animate-pulse border border-gray-100">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="h-5 sm:h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-5 w-5 sm:h-6 sm:w-6 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 w-3 sm:h-4 sm:w-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <>
      <style jsx>{`
        @keyframes card-hover {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-4px) scale(1.02); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .card-hover-effect {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover-effect:hover {
          animation: card-hover 0.3s ease-out forwards;
        }
        
        .shimmer-line {
          position: relative;
          overflow: hidden;
        }
        
        .shimmer-line::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transform: translateX(-100%);
          animation: shimmer 2s infinite;
        }
      `}</style>
      
      <div 
        className="group bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-xl card-hover-effect border border-gray-100 hover:border-red-200 backdrop-blur-sm relative overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: isHovered 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,245,245,0.95) 100%)'
            : 'rgba(255,255,255,0.95)'
        }}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-400 to-orange-400 rounded-full blur-xl"></div>
          <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-tr from-yellow-400 to-red-400 rounded-full blur-lg"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 group-hover:text-red-600 transition-colors duration-300">
              {displayName}
            </h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full bg-green-400 transition-all duration-300 ${isHovered ? 'animate-pulse scale-125' : ''}`} />
              <div className={`w-1 h-1 rounded-full bg-orange-400 transition-all duration-300 ${isHovered ? 'animate-ping' : ''}`} />
            </div>
          </div>
          
          <div className="space-y-1 sm:space-y-2">
            {Object.entries(classes).map(([classKey, classInfo], index) => (
              <button
                key={classKey}
                onClick={() => onClick(board, classKey)}
                className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 transition-all duration-300 flex items-center justify-between group/item border border-transparent hover:border-red-100 shimmer-line"
                style={{
                  animationDelay: `${index * 100}ms`,
                  transform: isHovered ? `translateX(${index * 2}px)` : 'translateX(0px)'
                }}
              >
                <span className="text-sm sm:text-base text-gray-700 group-hover/item:text-gray-900 font-medium transition-colors">
                  {classInfo.display_name}
                </span>
                <svg 
                  className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover/item:text-red-500 transition-all duration-300 transform group-hover/item:translate-x-1"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
        
        {/* Corner decoration */}
        <div className={`absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 opacity-10 transition-opacity duration-300 ${isHovered ? 'opacity-20' : ''}`}>
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full animate-ping"></div>
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-2 h-2 sm:w-3 sm:h-3 bg-red-400 rounded-full"></div>
        </div>
      </div>
    </>
  );
};

export default EnhancedBoardCard;