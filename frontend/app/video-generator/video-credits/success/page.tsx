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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex justify-between items-center py-4 lg:py-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button 
                onClick={() => router.back()}
                className="flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Payment Success
              </h1>
            </div>
            <div className="hidden lg:block">
              <Navigation />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8 lg:py-12">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl bg-white rounded-xl sm:rounded-2xl shadow-xl border border-green-100 p-6 sm:p-8 lg:p-10 xl:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-emerald-50/20 to-indigo-50/30"></div>
            
            <div className="relative">
              {/* Success Icon with Animation */}
              <div className="relative mb-6 sm:mb-8 lg:mb-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto animate-pulse shadow-lg">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                {/* Floating particles animation */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-2 left-4 w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                  <div className="absolute top-6 right-6 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
                  <div className="absolute bottom-4 left-8 w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
                  <div className="absolute bottom-8 right-2 w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '1.5s'}}></div>
                </div>
              </div>
              
              <div className="mb-6 sm:mb-8 lg:mb-10">
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3 sm:mb-4">
                  Credits Added Successfully!
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                  Your video generation credits have been added to your account and are ready to use.
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 lg:mb-10">
                <Link 
                  href="/video-credits"
                  className="block w-full py-3 sm:py-4 lg:py-5 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm sm:text-base lg:text-lg rounded-lg sm:rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>View My Credits</span>
                  </div>
                </Link>
                
                <Link 
                  href="/video-generator"
                  className="block w-full py-3 sm:py-4 lg:py-5 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium text-sm sm:text-base lg:text-lg rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Generate Video</span>
                  </div>
                </Link>
                
                <Link 
                  href="/dashboard"
                  className="block w-full py-3 sm:py-4 lg:py-5 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-medium text-sm sm:text-base lg:text-lg rounded-lg sm:rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z" />
                    </svg>
                    <span>Go to Dashboard</span>
                  </div>
                </Link>
              </div>
              
              {/* Auto-redirect info */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-center space-x-2 text-indigo-700">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs sm:text-sm lg:text-base font-medium">
                    Redirecting to credits page in 5 seconds...
                  </p>
                </div>
                <div className="mt-3 bg-indigo-200 rounded-full h-1 overflow-hidden">
                  <div className="bg-indigo-600 h-1 rounded-full animate-pulse" style={{
                    animation: 'progress 5s linear forwards',
                  }}></div>
                </div>
              </div>
              
              {/* Success Features */}
              <div className="mt-6 sm:mt-8 lg:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg sm:rounded-xl border border-green-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-green-800 mb-1">Instant Access</h3>
                  <p className="text-xs text-green-600">Credits ready to use</p>
                </div>
                
                <div className="text-center p-3 sm:p-4 bg-indigo-50 rounded-lg sm:rounded-xl border border-indigo-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-indigo-800 mb-1">Secure Payment</h3>
                  <p className="text-xs text-indigo-600">Transaction verified</p>
                </div>
                
                <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg sm:rounded-xl border border-purple-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-purple-800 mb-1">Start Creating</h3>
                  <p className="text-xs text-purple-600">Generate videos now</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <Navigation />
      </div>

      <style jsx global>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}