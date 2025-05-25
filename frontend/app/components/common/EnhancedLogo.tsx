// Enhanced Logo Component (components/common/EnhancedLogo.tsx)
'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  enhanced?: boolean;
}

const EnhancedLogo: React.FC<LogoProps> = ({ 
  className = "h-8 w-8", 
  showText = true, 
  enhanced = true 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  if (!enhanced) {
    // Fallback to original logo
    return (
      <Link href="/" className="flex items-center gap-2">
        <svg 
          viewBox="0 0 512 512" 
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-label="Paaṭha AI Logo"
        >
          <defs>
            <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff3131" />
              <stop offset="33%" stopColor="#ff3131" />
              <stop offset="66%" stopColor="#ffdd33" />
              <stop offset="100%" stopColor="#ecebe7" />
            </linearGradient>
          </defs>
          <g transform="rotate(-45, 256, 256)">
            <path d="M501.98,206.15c-9.769-23.023-25.998-42.56-46.458-56.389c-10.181-6.873-21.446-12.34-33.536-16.068
              c-12.009-3.809-24.842-5.798-38.088-5.798c-16.982,0-33.294,3.316-48.197,9.365c-1.246,0.492-2.402,0.986-3.558,1.568
              c-13.416,5.879-25.675,14.16-36.188,24.017c-3.396,3.227-6.623,6.623-9.858,10.432c-5.709,6.542-11.588,14.079-17.305,21.696
              c-1.157,1.568-2.402,3.226-3.558,4.804c-3.146,4.302-33.212,48.358-38.509,56.226c-2.652,3.97-5.798,8.442-9.195,13.327
              c-0.744,1.076-1.568,2.24-2.393,3.396c-5.636,8.031-11.928,16.481-17.726,23.937c-2.895,3.72-5.798,7.197-8.281,10.1
              c-2.563,2.976-4.884,5.378-6.542,6.954c-7.116,6.704-15.486,12.171-24.672,15.899c-9.194,3.728-19.214,5.798-29.816,5.798
              c-7.286,0-14.322-0.996-20.944-2.815c-3.396-0.913-6.712-2.07-9.939-3.477c-14.248-5.968-26.419-16.068-34.95-28.74
              c-4.302-6.372-7.699-13.327-10.019-20.783c-2.233-7.456-3.558-15.316-3.558-23.597c0-11.014,2.24-21.365,6.21-30.892
              c6.049-14.24,16.149-26.329,28.821-34.942c6.372-4.31,13.326-7.618,20.782-9.939c7.448-2.321,15.316-3.638,23.597-3.638
              c10.602,0.08,20.622,2.07,29.816,5.79c9.187,3.808,17.556,9.194,24.672,15.898c1.658,1.577,3.979,4.059,6.542,6.962
              c4.472,5.216,9.769,11.92,15.074,18.964c2.07,2.814,4.14,5.628,6.21,8.523c7.949-11.588,21.858-31.959,29.144-42.48
              c-1.237-1.658-2.482-3.307-3.72-4.965c-3.316-4.23-6.631-8.281-9.938-12.009c-3.316-3.809-6.462-7.205-9.858-10.432
              c-11.426-10.772-24.922-19.545-39.746-25.586c-14.904-6.049-31.222-9.365-48.196-9.365c-17.637,0-34.53,3.566-49.927,10.108
              c-23.022,9.688-42.487,25.918-56.316,46.369c-6.873,10.19-12.332,21.527-16.141,33.536C1.989,229.997,0,242.75,0,256.004
              c0,17.637,3.558,34.53,10.02,49.846c9.768,23.104,25.998,42.569,46.369,56.397c10.27,6.874,21.535,12.332,33.624,16.141
              c12.008,3.728,24.842,5.717,38.088,5.717c16.974,0,33.293-3.316,48.196-9.356c14.824-6.049,28.239-14.824,39.666-25.506l0.08-0.081
              c3.397-3.146,6.543-6.631,9.858-10.44c5.709-6.542,11.588-14.071,17.305-21.689c1.157-1.577,2.402-3.154,3.558-4.723
              c3.146-4.391,44.307-64.758,47.696-69.642c0.752-1.076,1.577-2.232,2.401-3.396c5.637-7.95,11.928-16.48,17.726-23.928
              c2.895-3.728,5.798-7.206,8.281-10.101c2.564-2.984,4.885-5.386,6.542-6.962c7.116-6.704,15.486-12.09,24.673-15.898
              c2.24-0.906,4.472-1.649,6.792-2.402c7.286-2.15,14.984-3.307,23.023-3.388c11.013,0.08,21.446,2.232,30.882,6.291
              c14.241,5.96,26.42,16.06,34.943,28.732c4.31,6.38,7.706,13.335,10.019,20.782c2.321,7.456,3.566,15.324,3.566,23.605
              c0,11.014-2.24,21.446-6.21,30.883c-6.049,14.24-16.149,26.419-28.821,34.942c-6.372,4.31-13.326,7.707-20.782,9.939
              c-7.367,2.321-15.316,3.648-23.597,3.648c-10.602,0-20.622-2.07-29.816-5.798c-9.187-3.728-17.557-9.195-24.673-15.899
              c-1.658-1.577-3.979-4.059-6.542-6.954c-4.472-5.135-9.776-11.928-15.074-18.963c-2.15-2.815-4.221-5.718-6.291-8.613
              c-0.663,0.994-1.326,1.99-2.07,3.065c-13.666,20.039-22.279,32.71-26.994,39.576c1.237,1.658,2.483,3.235,3.72,4.893
              c3.316,4.221,6.631,8.281,9.938,12c3.234,3.808,6.462,7.294,9.858,10.44c11.426,10.763,24.923,19.538,39.746,25.587
              c14.904,6.04,31.215,9.356,48.197,9.356c17.636,0,34.53-3.558,49.846-10.019c23.103-9.769,42.56-25.999,56.396-46.458
              c6.866-10.181,12.421-21.446,16.141-33.536C510.01,282.083,512,269.25,512,256.004C512,238.367,508.442,221.474,501.98,206.15z"
              fill="url(#mainGradient)"
            />
            <circle cx="385" cy="256" r="48" fill="#ff3131" />
          </g>
        </svg>
        {showText && <span className="font-medium text-xl hidden sm:inline text-[#ff3131]">Paaṭha AI</span>}
      </Link>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes pulse-glow {
          0% { filter: drop-shadow(0 4px 8px rgba(255, 49, 49, 0.2)); }
          100% { filter: drop-shadow(0 6px 20px rgba(255, 49, 49, 0.4)); }
        }
        
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(25px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(25px) rotate(-360deg); }
        }
        
        @keyframes gradient-slide {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        .logo-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .logo-glow {
          animation: pulse-glow 2s ease-in-out infinite alternate;
        }
        
        .orbit-animation {
          animation: orbit 4s linear infinite;
        }
        
        .gradient-text {
          background: linear-gradient(-45deg, #ff3131, #ff6b35, #ffdd33, #ff3131);
          background-size: 300% 300%;
          animation: gradient-slide 3s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
      
      <Link href="/" className={`flex items-center gap-3 ${isLoaded ? 'fade-in-up' : 'opacity-0'}`}>
        <div className="relative">
          <svg 
            viewBox="0 0 512 512" 
            xmlns="http://www.w3.org/2000/svg"
            className={`${className} transition-all duration-500 hover:scale-110 logo-float logo-glow`}
            aria-label="Paaṭha AI Logo"
          >
            <defs>
              <linearGradient id="enhancedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff3131" />
                <stop offset="33%" stopColor="#ff6b35" />
                <stop offset="66%" stopColor="#ffdd33" />
                <stop offset="100%" stopColor="#ffd700" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <g transform="rotate(-45, 256, 256)">
              <path d="M501.98,206.15c-9.769-23.023-25.998-42.56-46.458-56.389c-10.181-6.873-21.446-12.34-33.536-16.068
                c-12.009-3.809-24.842-5.798-38.088-5.798c-16.982,0-33.294,3.316-48.197,9.365c-1.246,0.492-2.402,0.986-3.558,1.568
                c-13.416,5.879-25.675,14.16-36.188,24.017c-3.396,3.227-6.623,6.623-9.858,10.432c-5.709,6.542-11.588,14.079-17.305,21.696
                c-1.157,1.568-2.402,3.226-3.558,4.804c-3.146,4.302-33.212,48.358-38.509,56.226c-2.652,3.97-5.798,8.442-9.195,13.327
                c-0.744,1.076-1.568,2.24-2.393,3.396c-5.636,8.031-11.928,16.481-17.726,23.937c-2.895,3.72-5.798,7.197-8.281,10.1
                c-2.563,2.976-4.884,5.378-6.542,6.954c-7.116,6.704-15.486,12.171-24.672,15.899c-9.194,3.728-19.214,5.798-29.816,5.798
                c-7.286,0-14.322-0.996-20.944-2.815c-3.396-0.913-6.712-2.07-9.939-3.477c-14.248-5.968-26.419-16.068-34.95-28.74
                c-4.302-6.372-7.699-13.327-10.019-20.783c-2.233-7.456-3.558-15.316-3.558-23.597c0-11.014,2.24-21.365,6.21-30.892
                c6.049-14.24,16.149-26.329,28.821-34.942c6.372-4.31,13.326-7.618,20.782-9.939c7.448-2.321,15.316-3.638,23.597-3.638
                c10.602,0.08,20.622,2.07,29.816,5.79c9.187,3.808,17.556,9.194,24.672,15.898c1.658,1.577,3.979,4.059,6.542,6.962
                c4.472,5.216,9.769,11.92,15.074,18.964c2.07,2.814,4.14,5.628,6.21,8.523c7.949-11.588,21.858-31.959,29.144-42.48
                c-1.237-1.658-2.482-3.307-3.72-4.965c-3.316-4.23-6.631-8.281-9.938-12.009c-3.316-3.809-6.462-7.205-9.858-10.432
                c-11.426-10.772-24.922-19.545-39.746-25.586c-14.904-6.049-31.222-9.365-48.196-9.365c-17.637,0-34.53,3.566-49.927,10.108
                c-23.022,9.688-42.487,25.918-56.316,46.369c-6.873,10.19-12.332,21.527-16.141,33.536C1.989,229.997,0,242.75,0,256.004
                c0,17.637,3.558,34.53,10.02,49.846c9.768,23.104,25.998,42.569,46.369,56.397c10.27,6.874,21.535,12.332,33.624,16.141
                c12.008,3.728,24.842,5.717,38.088,5.717c16.974,0,33.293-3.316,48.196-9.356c14.824-6.049,28.239-14.824,39.666-25.506l0.08-0.081
                c3.397-3.146,6.543-6.631,9.858-10.44c5.709-6.542,11.588-14.071,17.305-21.689c1.157-1.577,2.402-3.154,3.558-4.723
                c3.146-4.391,44.307-64.758,47.696-69.642c0.752-1.076,1.577-2.232,2.401-3.396c5.637-7.95,11.928-16.48,17.726-23.928
                c2.895-3.728,5.798-7.206,8.281-10.101c2.564-2.984,4.885-5.386,6.542-6.962c7.116-6.704,15.486-12.09,24.673-15.898
                c2.24-0.906,4.472-1.649,6.792-2.402c7.286-2.15,14.984-3.307,23.023-3.388c11.013,0.08,21.446,2.232,30.882,6.291
                c14.241,5.96,26.42,16.06,34.943,28.732c4.31,6.38,7.706,13.335,10.019,20.782c2.321,7.456,3.566,15.324,3.566,23.605
                c0,11.014-2.24,21.446-6.21,30.883c-6.049,14.24-16.149,26.419-28.821,34.942c-6.372,4.31-13.326,7.707-20.782,9.939
                c-7.367,2.321-15.316,3.648-23.597,3.648c-10.602,0-20.622-2.07-29.816-5.798c-9.187-3.728-17.557-9.195-24.673-15.899
                c-1.658-1.577-3.979-4.059-6.542-6.954c-4.472-5.135-9.776-11.928-15.074-18.963c-2.15-2.815-4.221-5.718-6.291-8.613
                c-0.663,0.994-1.326,1.99-2.07,3.065c-13.666,20.039-22.279,32.71-26.994,39.576c1.237,1.658,2.483,3.235,3.72,4.893
                c3.316,4.221,6.631,8.281,9.938,12c3.234,3.808,6.462,7.294,9.858,10.44c11.426,10.763,24.923,19.538,39.746,25.587
                c14.904,6.04,31.215,9.356,48.197,9.356c17.636,0,34.53-3.558,49.846-10.019c23.103-9.769,42.56-25.999,56.396-46.458
                c6.866-10.181,12.421-21.446,16.141-33.536C510.01,282.083,512,269.25,512,256.004C512,238.367,508.442,221.474,501.98,206.15z"
                fill="url(#enhancedGradient)"
                filter="url(#glow)"
              />
              
              <circle 
                cx="385" 
                cy="256" 
                r="40" 
                fill="#ff3131" 
                className="orbit-animation"
                opacity="0.9"
              />
            </g>
          </svg>
          
          {/* Subtle glow ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400/20 to-orange-400/20 animate-ping"
               style={{ animationDuration: '2s' }} />
        </div>
        
        {showText && (
          <div className="hidden sm:block">
            <span className="font-bold text-xl gradient-text">
              Paaṭha AI
            </span>
            <div className="text-xs text-gray-500 -mt-1">
              Smart Learning
            </div>
          </div>
        )}
      </Link>
    </>
  );
};

export default EnhancedLogo;

// Enhanced Loading Spinner Component (components/common/EnhancedSpinner.tsx)
export const EnhancedSpinner = ({ size = "md", message = "Loading..." }) => {
  const sizeClasses = {
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

// Enhanced Board Card with skeleton loading (components/common/EnhancedBoardCard.tsx)
export const EnhancedBoardCard = ({ 
  board, 
  displayName, 
  classes, 
  onClick, 
  isLoading = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 w-6 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-4"></div>
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
        className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-xl card-hover-effect border border-gray-100 hover:border-red-200 backdrop-blur-sm relative overflow-hidden"
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
          <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-red-400 to-orange-400 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-tr from-yellow-400 to-red-400 rounded-full blur-lg"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 group-hover:text-red-600 transition-colors duration-300">
              {displayName}
            </h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full bg-green-400 transition-all duration-300 ${isHovered ? 'animate-pulse scale-125' : ''}`} />
              <div className={`w-1 h-1 rounded-full bg-orange-400 transition-all duration-300 ${isHovered ? 'animate-ping' : ''}`} />
            </div>
          </div>
          
          <div className="space-y-2">
            {Object.entries(classes).map(([classKey, classInfo], index) => (
              <button
                key={classKey}
                onClick={() => onClick(board, classKey)}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 transition-all duration-300 flex items-center justify-between group/item border border-transparent hover:border-red-100 shimmer-line"
                style={{
                  animationDelay: `${index * 100}ms`,
                  transform: isHovered ? `translateX(${index * 2}px)` : 'translateX(0px)'
                }}
              >
                <span className="text-gray-700 group-hover/item:text-gray-900 font-medium transition-colors">
                  {classInfo.display_name}
                </span>
                <svg 
                  className="w-4 h-4 text-gray-400 group-hover/item:text-red-500 transition-all duration-300 transform group-hover/item:translate-x-1"
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
        <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 transition-opacity duration-300 ${isHovered ? 'opacity-20' : ''}`}>
          <div className="absolute top-2 right-2 w-3 h-3 bg-red-400 rounded-full animate-ping"></div>
          <div className="absolute top-2 right-2 w-3 h-3 bg-red-400 rounded-full"></div>
        </div>
      </div>
    </>
  );
};