// app/(auth)/login/page.tsx - Enhanced with URL parameter handling
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginForm from '../../components/auth/LoginForm';
import EnhancedLogo from '../../components/common/EnhancedLogo';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showMessage, setShowMessage] = useState<{type: 'success' | 'info' | 'error', message: string} | null>(null);

  useEffect(() => {
    const registered = searchParams.get('registered');
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');
    const reset = searchParams.get('reset');

    // Show appropriate message based on URL parameters
    if (verified === 'true') {
      setShowMessage({
        type: 'success',
        message: 'Email verified successfully! You can now log in with your credentials.'
      });
    } else if (registered === 'true') {
      setShowMessage({
        type: 'info',
        message: 'Registration successful! Please check your email to verify your account, then return here to log in.'
      });
    } else if (reset === 'success') {
      setShowMessage({
        type: 'success',
        message: 'Password reset successful! You can now log in with your new password.'
      });
    } else if (error) {
      const errorMessages: Record<string, string> = {
        'auth_failed': 'Authentication failed. Please try again.',
        'callback_failed': 'There was an issue processing your request. Please try again.',
        'no_session': 'Unable to establish session. Please try logging in again.',
        'invalid_credentials': 'Invalid email or password. Please check your credentials and try again.'
      };
      setShowMessage({
        type: 'error',
        message: errorMessages[error] || 'An error occurred. Please try again.'
      });
    }

    // Clear URL parameters after showing message
    if (registered || verified || error || reset) {
      // Use setTimeout to allow message to be shown first
      setTimeout(() => {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('registered');
        newUrl.searchParams.delete('verified');
        newUrl.searchParams.delete('error');
        newUrl.searchParams.delete('reset');
        
        // Only push if URL actually changed
        if (newUrl.toString() !== window.location.href) {
          router.replace(newUrl.pathname);
        }
      }, 100);
    }
  }, [searchParams, router]);

  return (
    <>
      {/* Enhanced animations and effects */}
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
          50% { transform: translateY(-10px); }
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
        
        .stagger-1 { animation-delay: 0.2s; }
        .stagger-2 { animation-delay: 0.4s; }
        .stagger-3 { animation-delay: 0.6s; }
      `}</style>

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
        {/* Animated background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-blue-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-purple-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
          <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-indigo-200/20 rounded-full animate-ping" 
               style={{animationDuration: '2s'}} />
          <div className="absolute top-1/4 right-1/3 w-6 h-6 sm:w-10 sm:h-10 bg-blue-100/40 rounded-full animate-pulse animate-float" 
               style={{animationDuration: '3.5s', animationDelay: '2s'}} />
          <div className="absolute bottom-1/3 left-1/6 w-4 h-4 sm:w-8 sm:h-8 bg-purple-100/30 rounded-full animate-bounce" 
               style={{animationDuration: '2.5s', animationDelay: '1.5s'}} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Logo Section */}
          <div className="text-center mb-8 opacity-0 animate-fade-in-up stagger-1">
            <EnhancedLogo 
              className="h-12 w-12 sm:h-16 sm:w-16" 
              showText={true}
            />
            <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
              Welcome back! Sign in to continue your learning journey.
            </p>
          </div>

          {/* Message Display */}
          {showMessage && (
            <div className={`w-full max-w-md mb-6 p-4 rounded-lg border opacity-0 animate-fade-in-up stagger-2 ${
              showMessage.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
              showMessage.type === 'info' ? 'bg-blue-50 text-blue-800 border-blue-200' :
              'bg-red-50 text-red-800 border-red-200'
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {showMessage.type === 'success' && (
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {showMessage.type === 'info' && (
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                  {showMessage.type === 'error' && (
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{showMessage.message}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setShowMessage(null)}
                    className="inline-flex text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Login Form Container */}
          <div className="w-full max-w-md opacity-0 animate-fade-in-up stagger-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/50">
              <LoginForm />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center opacity-0 animate-fade-in stagger-3">
            <p className="text-xs text-gray-500">
              Don't have an account?{' '}
              <a href="/register" className="text-indigo-600 hover:text-indigo-700 transition-colors">
                Sign up here
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}