// components/common/EnhancedLogo.tsx
'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';

interface EnhancedLogoProps {
  className?: string;
  showText?: boolean;
}

const EnhancedLogo: React.FC<EnhancedLogoProps> = ({ 
  className = "h-12 w-12", 
  showText = true 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
              <linearGradient id="enhancedMainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff3131" />
                <stop offset="33%" stopColor="#ff6b35" />
                <stop offset="66%" stopColor="#ffdd33" />
                <stop offset="100%" stopColor="#ffd700" />
              </linearGradient>
              <filter id="enhancedGlow">
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
                fill="url(#enhancedMainGradient)"
                filter="url(#enhancedGlow)"
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
          <div className="flex flex-col items-center sm:items-start">
            <span className="font-bold text-3xl sm:text-4xl lg:text-5xl gradient-text text-center sm:text-left">
              Paaṭha AI
            </span>
            <div className="text-xs sm:text-sm text-gray-500 -mt-1 opacity-75 text-center sm:text-left">
              Smart Learning Platform
            </div>
          </div>
        )}
      </Link>
    </>
  );
};

export default EnhancedLogo;