// frontend/app/(auth)/reset-password/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import PasswordReset from '../../components/auth/PasswordReset';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';
import EnhancedLogo from '../../components/common/EnhancedLogo';

// Enhanced themed loading skeleton
const ThemedResetLoadingSkeleton = () => (
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
    
    <div className="w-full max-w-md p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl text-center border border-white/50 relative overflow-hidden mx-4">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-50/30 to-transparent opacity-50"></div>
      
      <div className="relative z-10">
        <div className="w-12 h-12 border-4 border-orange-200 rounded-full animate-spin border-t-orange-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-medium mb-2 text-gray-800">Verifying Reset Link</h2>
        <p className="text-gray-600">Please wait while we verify your password reset link...</p>
      </div>
    </div>
  </div>
);

// Enhanced error display
const ThemedErrorDisplay = ({ error }: { error: string }) => (
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
    
    <div className="w-full max-w-md p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl text-center border border-red-200/50 relative overflow-hidden mx-4">
      {/* Error gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-50/30 to-pink-50/30 opacity-50"></div>
      
      <div className="relative z-10">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium mb-2 text-red-800">Invalid Reset Link</h2>
        <p className="text-red-700 mb-4">{error}</p>
        <div className="flex items-center justify-center gap-2 text-sm text-red-600 mb-4">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          <span>Redirecting to password reset request...</span>
        </div>
      </div>
    </div>
  </div>
);

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [validToken, setValidToken] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Supabase handles the password reset flow via URL parameters
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Invalid or expired reset link. Please request a new one.');
        setTimeout(() => {
          router.push('/forgot-password');
        }, 3000);
        return;
      }

      setValidToken(true);
    };

    checkSession();
  }, [router]);

  if (error) {
    return <ThemedErrorDisplay error={error} />;
  }

  if (!validToken) {
    return <ThemedResetLoadingSkeleton />;
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
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
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
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .stagger-1 { animation-delay: 0.2s; }
        .stagger-2 { animation-delay: 0.4s; }
        .stagger-3 { animation-delay: 0.6s; }
        
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
          <div className="text-center mb-8 opacity-0 animate-fade-in-up stagger-1">
            <div className="animate-float">
              <EnhancedLogo 
                className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-4" 
                showText={false}
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">
              Create New Password
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
              Almost there! Enter your new password below to complete the reset process.
            </p>
          </div>

          {/* Enhanced Password Reset Form Container */}
          <div className="w-full max-w-md opacity-0 animate-fade-in-up stagger-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/50 relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/20 via-orange-50/20 to-yellow-50/20 opacity-50"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              
              <div className="relative z-10">
                <PasswordReset />
              </div>
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="mt-8 text-center opacity-0 animate-fade-in stagger-3">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Your new password will be encrypted and secure</span>
            </div>
            <p className="text-xs text-gray-500">
              Make sure to use a strong password with at least 8 characters
            </p>
          </div>
        </div>
      </div>
    </>
  );
}