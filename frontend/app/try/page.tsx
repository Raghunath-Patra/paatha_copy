// frontend/app/try/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '../components/common/Logo';

export default function TryPage() {
  const router = useRouter();
  
  // Automatically redirect to the challenge page
  useEffect(() => {
    router.push('/try/challenge');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex flex-col items-center justify-center relative">
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
             style={{animationDuration: '3s'}} />
        <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
             style={{animationDuration: '4s'}} />
        <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
             style={{animationDuration: '2s'}} />
      </div>
      
      <div className="container-fluid px-8 py-6 text-center relative z-10">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <Logo className="h-12 w-12" showText={true} />
          </div>
          
          {/* Loading state while redirecting */}
          <h1 className="text-2xl font-semibold mb-6">Loading Challenge...</h1>
          
          {/* Enhanced loading animation */}
          <div className="relative mb-8">
            <div className="w-16 h-16 border-4 border-red-200 rounded-full animate-spin border-t-red-500 mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-red-300 mx-auto"></div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <p className="text-gray-600 animate-pulse">
              Preparing your 3-question challenge...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}