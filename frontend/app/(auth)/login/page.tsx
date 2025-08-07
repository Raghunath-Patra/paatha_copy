'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginForm from '../../components/auth/LoginForm';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import EnhancedLogo from '../../components/common/EnhancedLogo';

// Enhanced themed loading skeleton
const ThemedAuthLoadingSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative">
    {/* Animated background decorations */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
           style={{animationDuration: '3s'}} />
      <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
           style={{animationDuration: '4s'}} />
      <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
           style={{animationDuration: '2s'}} />
      <div className="absolute top-1/4 right-1/3 w-6 h-6 sm:w-10 sm:h-10 bg-red-100/40 rounded-full animate-pulse" 
           style={{animationDuration: '3.5s', animationDelay: '2s'}} />
      <div className="absolute bottom-1/3 left-1/6 w-4 h-4 sm:w-8 sm:h-8 bg-yellow-100/30 rounded-full animate-bounce" 
           style={{animationDuration: '2.5s', animationDelay: '1.5s'}} />
    </div>
    
    <div className="text-center relative z-10">
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
        <p className="text-gray-600 animate-pulse">Preparing your learning journey...</p>
      </div>
    </div>
  </div>
);

// Enhanced message cards
const ThemedMessageCard = ({ type, children }: { type: 'info' | 'success', children: React.ReactNode }) => {
  const bgColor = type === 'info' ? 'bg-blue-50/90' : 'bg-green-50/90';
  const textColor = type === 'info' ? 'text-blue-700' : 'text-green-700';
  const borderColor = type === 'info' ? 'border-blue-200' : 'border-green-200';
  const gradientOverlay = type === 'info' 
    ? 'bg-gradient-to-r from-blue-50/30 to-indigo-50/30' 
    : 'bg-gradient-to-r from-green-50/30 to-emerald-50/30';
  
  return (
    <div className={`mb-6 p-4 ${bgColor} backdrop-blur-sm ${textColor} rounded-xl max-w-md mx-auto border ${borderColor} shadow-lg relative overflow-hidden`}>
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 ${gradientOverlay} opacity-50`}></div>
      <div className="relative z-10 text-center">
        {children}
      </div>
    </div>
  );
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const registered = searchParams?.get('registered');
  const resetSuccess = searchParams?.get('reset');
  const verified = searchParams?.get('verified');
  const { loading } = useSupabaseAuth();

  useEffect(() => {
    console.log('Login page mounted');  // Debug log
  }, []);

  if (loading) {
    return <ThemedAuthLoadingSkeleton />;
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
          <div className="text-center mb-12 sm:mb-16 opacity-0 animate-fade-in-up stagger-2">
                <EnhancedLogo 
                  className="h-12 w-12 sm:h-16 sm:w-16" 
                  showText={true}
                />
            <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
              Welcome back! Continue your learning journey with AI-powered education.
            </p>
          </div>

          {/* Enhanced Message Cards */}
          <div className="w-full max-w-md opacity-0 animate-fade-in stagger-2">
            {registered && (
              <ThemedMessageCard type="info">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="font-medium mb-1">Check Your Email</div>
                <div className="text-sm">
                  A verification link has been sent to your email address. Please verify your email before logging in.
                </div>
              </ThemedMessageCard>
            )}
            
            {resetSuccess === 'success' && (
              <ThemedMessageCard type="success">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="font-medium mb-1">Password Reset Successful</div>
                <div className="text-sm">
                  Your password has been reset successfully. Please log in with your new password.
                </div>
              </ThemedMessageCard>
            )}
            {verified && (
              <ThemedMessageCard type="success">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="font-medium mb-1">Email Verified Successfully!</div>
                <div className="text-sm">
                  Your email has been verified. You can now log in to your account.
                </div>
              </ThemedMessageCard>
            )}
          </div>

          {/* Enhanced Login Form Container */}
          <div className="w-full max-w-md opacity-0 animate-fade-in-up stagger-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/50 relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/20 via-orange-50/20 to-yellow-50/20 opacity-50"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              
              <div className="relative z-10">
                <LoginForm />
              </div>
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="mt-8 text-center opacity-0 animate-fade-in stagger-3">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-orange-600 hover:text-orange-700 transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-orange-600 hover:text-orange-700 transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}