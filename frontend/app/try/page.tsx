// frontend/app/try/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '../components/common/Logo';

export default function TryPage() {
  const router = useRouter();
  
  // Automatically redirect to the challenge page
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/try/challenge');
    }, 2000); // Give users a moment to see the beautiful loading screen
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <>
      {/* Enhanced animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% { 
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.6);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        
        .stagger-1 { animation-delay: 0.2s; }
        .stagger-2 { animation-delay: 0.4s; }
        .stagger-3 { animation-delay: 0.6s; }
        .stagger-4 { animation-delay: 0.8s; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Enhanced animated background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
          <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
               style={{animationDuration: '2s'}} />
          <div className="absolute top-1/4 right-1/3 w-6 h-6 sm:w-8 sm:h-8 bg-red-300/20 rounded-full animate-bounce" 
               style={{animationDuration: '5s', animationDelay: '1s'}} />
          <div className="absolute bottom-1/3 left-1/3 w-4 h-4 sm:w-6 sm:h-6 bg-orange-300/25 rounded-full animate-pulse" 
               style={{animationDuration: '4s', animationDelay: '2s'}} />
          <div className="absolute top-3/4 left-1/2 w-10 h-10 sm:w-14 sm:h-14 bg-yellow-300/15 rounded-full animate-bounce" 
               style={{animationDuration: '6s', animationDelay: '0.5s'}} />
        </div>
        
        <div className="container-fluid px-4 sm:px-8 py-6 text-center relative z-10 max-w-md mx-auto">
          {/* Logo with enhanced animation */}
          <div className="flex items-center justify-center mb-8 opacity-0 animate-fade-in-up stagger-1">
            <div className="animate-float">
              <Logo className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-lg" showText={true} />
            </div>
          </div>
          
          {/* Title and subtitle */}
          <div className="mb-12 space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 opacity-0 animate-fade-in-up stagger-2">
              3-Question Challenge
            </h1>
            <p className="text-lg text-gray-600 opacity-0 animate-fade-in-up stagger-3 leading-relaxed">
              Test your knowledge in just 60 seconds!
            </p>
          </div>
          
          {/* Enhanced loading animation */}
          <div className="relative mb-12 opacity-0 animate-fade-in stagger-4">
            <div className="relative mx-auto w-20 h-20">
              <div className="w-20 h-20 border-4 border-red-200 rounded-full animate-spin border-t-red-500 animate-glow"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-ping border-t-red-300"></div>
              <div className="absolute inset-2 w-16 h-16 border-2 border-orange-200 rounded-full animate-spin border-b-orange-400" style={{animationDuration: '1.5s', animationDirection: 'reverse'}}></div>
            </div>
          </div>
          
          {/* Loading indicators */}
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50">
              <p className="text-gray-700 font-medium animate-pulse text-lg">
                Preparing your challenge questions...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Get ready for personalized AI feedback
              </p>
            </div>
            
            {/* Progress indicator */}
            <div className="w-full bg-white/60 backdrop-blur-sm h-2 rounded-full shadow-sm border border-white/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-2000 ease-out shadow-sm"
                   style={{ width: '100%', animationDuration: '2s' }}>
              </div>
            </div>
          </div>
          
          {/* Fun facts or tips while loading */}
          <div className="mt-8 bg-gradient-to-r from-purple-50/80 to-pink-50/80 backdrop-blur-sm rounded-xl p-4 border border-purple-200/50 shadow-sm">
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl mr-2">💡</span>
              <span className="font-medium text-gray-700">Did you know?</span>
            </div>
            <p className="text-sm text-gray-600">
              Our AI analyzes your answers in real-time to provide personalized feedback and learning insights!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}