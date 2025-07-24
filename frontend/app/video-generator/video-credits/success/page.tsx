'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../components/navigation/Navigation';

export default function VideoCreditsSuccessPage() {
  const router = useRouter();
  
  // Redirect back to credits page after delay
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.push('/video-credits');
    }, 5000);
    
    return () => clearTimeout(redirectTimer);
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="container-fluid px-8 py-6">
        <div className="max-w-[1600px] mx-auto w-full">
          <div className="flex justify-between items-center mb-8">
            <button 
              onClick={() => router.back()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
            <Navigation />
          </div>
          
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-indigo-100 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-indigo-50/30"></div>
            
            <div className="relative">
              {/* Success Icon with Animation */}
              <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                Credits Added Successfully!
              </h1>
              <p className="text-gray-600 mb-8">
                Your video generation credits have been added to your account and are ready to use.
              </p>
              
              <div className="space-y-4">
                <Link 
                  href="/video-credits"
                  className="block w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
                >
                  View My Credits
                </Link>
                
                <Link 
                  href="/video-generation"
                  className="block w-full py-3 px-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-medium rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
                >
                  Generate Video
                </Link>
              </div>
              
              <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-sm text-indigo-700 flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Redirecting to credits page in 5 seconds...</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}