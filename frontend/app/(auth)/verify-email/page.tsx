// Path: frontend/app/(auth)/verify-email/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';
import EnhancedLogo from '../../components/common/EnhancedLogo';

// Enhanced themed loading skeleton
const ThemedVerifyLoadingSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative">
    {/* Animated background decorations */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
           style={{animationDuration: '3s'}} />
      <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
           style={{animationDuration: '4s'}} />
      <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
           style={{animationDuration: '2s'}} />
    </div>
    
    <div className="max-w-md w-full mx-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center border border-white/50 relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/30 to-transparent opacity-50"></div>
        
        <div className="relative z-10">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-500 mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-blue-300 mx-auto"></div>
          </div>
          <h2 className="text-xl font-medium mb-2 text-gray-800">Verifying Email</h2>
          <p className="text-gray-600">Please wait while we verify your email...</p>
          <div className="flex items-center justify-center gap-1 mt-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Enhanced success display
const ThemedSuccessDisplay = ({ message }: { message: string }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/50 relative overflow-hidden">
    {/* Success gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-green-50/30 to-emerald-50/30 opacity-50"></div>
    
    <div className="relative z-10">
      <div className="flex justify-center items-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center relative">
          <div className="w-20 h-20 bg-green-200/30 rounded-full absolute animate-ping"></div>
          <svg
            className="h-8 w-8 text-green-600 relative z-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>
      <div className="text-center text-green-800">
        <h2 className="text-xl font-medium mb-2">Email Verified!</h2>
        <p className="text-green-700">{message}</p>
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Redirecting to login...</span>
        </div>
      </div>
    </div>
  </div>
);

// Enhanced error display
const ThemedErrorDisplay = ({ message, onReturnToLogin }: { message: string, onReturnToLogin: () => void }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/50 relative overflow-hidden">
    {/* Error gradient overlay */}
    <div className="absolute inset-0 bg-gradient-to-r from-red-50/30 to-pink-50/30 opacity-50"></div>
    
    <div className="relative z-10">
      <div className="flex justify-center items-center mb-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
      </div>
      <div className="text-center text-red-800 mb-6">
        <h2 className="text-xl font-medium mb-2">Verification Issue</h2>
        <p className="text-red-700">{message}</p>
      </div>
      <div className="text-center">
        <button
          onClick={onReturnToLogin}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          Return to Login
        </button>
      </div>
    </div>
  </div>
);

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get the session to check if email is verified
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          // If no session, user needs to sign in again
          setStatus('error');
          setMessage('Verification link expired or invalid. Please sign in again.');
          setTimeout(() => {
            router.push('/login');
          }, 3000);
          return;
        }

        // Check if email is verified
        if (session.user.email_confirmed_at) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');
          
          // Update profile to mark as verified if needed
          await supabase
            .from('profiles')
            .update({ email_verified: true })
            .eq('id', session.user.id);

          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('Email verification pending. Please check your email and click the verification link.');
        }

      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    handleEmailVerification();
  }, [router]);

  if (status === 'verifying') {
    return <ThemedVerifyLoadingSkeleton />;
  }

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
        
        /* Gradient text effect */
        .gradient-text {
          background: linear-gradient(135deg, #dc2626, #ea580c, #d97706);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative">
        {/* Enhanced animated background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
          <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
               style={{animationDuration: '2s'}} />
          <div className="absolute top-1/4 right-1/3 w-6 h-6 sm:w-10 sm:h-10 bg-red-100/40 rounded-full animate-pulse animate-float" 
               style={{animationDuration: '3.5s', animationDelay: '2s'}} />
          <div className="absolute bottom-1/3 left-1/6 w-4 h-4 sm:w-8 sm:h-8 bg-yellow-100/30 rounded-full animate-bounce" 
               style={{animationDuration: '2.5s', animationDelay: '1.5s'}} />
          <div className="absolute top-3/4 right-1/6 w-5 h-5 sm:w-9 sm:h-9 bg-orange-100/25 rounded-full animate-ping" 
               style={{animationDuration: '4.5s', animationDelay: '3s'}} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Enhanced Logo Section */}
          <div className="text-center mb-12 sm:mb-16 opacity-0 animate-fade-in-up stagger-2">
                <EnhancedLogo 
                  className="h-12 w-12 sm:h-16 sm:w-16" 
                  showText={true}
                />
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">
              Email Verification
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
              We're verifying your email address to secure your account.
            </p>
          </div>

          {/* Enhanced Verification Status Container */}
          <div className="w-full max-w-md mx-auto opacity-0 animate-fade-in-up stagger-2">
            {status === 'success' && (
              <ThemedSuccessDisplay message={message} />
            )}

            {status === 'error' && (
              <ThemedErrorDisplay 
                message={message} 
                onReturnToLogin={() => router.push('/login')} 
              />
            )}
          </div>

          {/* Enhanced Footer */}
          <div className="mt-8 text-center opacity-0 animate-fade-in stagger-2">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Your account security is our priority</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Need help? Contact our{' '}
              <a href="/support" className="text-orange-600 hover:text-orange-700 transition-colors">
                support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}