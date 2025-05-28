// frontend/app/(auth)/register/page.tsx

'use client';

import RegisterForm from '../../components/auth/RegisterForm';
import EnhancedLogo from '../../components/common/EnhancedLogo';

export default function RegisterPage() {
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
              Start your personalized learning journey with AI-powered education tailored for you.
            </p>
          </div>

          {/* Enhanced Register Form Container */}
          <div className="w-full max-w-md opacity-0 animate-fade-in-up stagger-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/50 relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/20 via-orange-50/20 to-yellow-50/20 opacity-50"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              
              <div className="relative z-10">
                <RegisterForm />
              </div>
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="mt-8 text-center opacity-0 animate-fade-in stagger-3">
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              By creating an account, you agree to our{' '}
              <a href="/terms" className="text-orange-600 hover:text-orange-700 transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-orange-600 hover:text-orange-700 transition-colors">
                Privacy Policy
              </a>
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Free to start</span>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}