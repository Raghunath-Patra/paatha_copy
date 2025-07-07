// app/page.tsx - Updated with role-based routing
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from './components/navigation/Navigation';
import { useSupabaseAuth } from './contexts/SupabaseAuthContext';
import EnhancedLogo from './components/common/EnhancedLogo';
import EnhancedSpinner from './components/common/EnhancedSpinner';
import EnhancedBoardCard from './components/common/EnhancedBoardCard';

// Static board structure to prevent re-creation
const BOARD_STRUCTURE = {
  cbse: {
    display_name: "CBSE",
    classes: {
      viii: { display_name: "Class VIII" },
      ix: { display_name: "Class IX" },
      x: { display_name: "Class X" },
      xi: { display_name: "Class XI" },
      xii: { display_name: "Class XII" }
    }
  },
  karnataka: {
    display_name: "Karnataka State Board", 
    classes: {
      "8th": { display_name: "8th Class" },
      "9th": { display_name: "9th Class" },
      "10th": { display_name: "10th Class" },
      "puc-1": { display_name: "PUC-I" },
      "puc-2": { display_name: "PUC-II" }
    }
  }
} as const;

// Skeleton loader component
const BoardCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 animate-pulse">
    <div className="h-5 sm:h-6 bg-gray-200 rounded mb-3 sm:mb-4 w-3/4"></div>
    <div className="space-y-2 sm:space-y-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

// Quick stats component - simplified for guaranteed visibility
const QuickStats = ({ isVisible }: { isVisible: boolean }) => {
  const stats = [
    { label: "Students", value: "10K+", color: "text-blue-600" },
    { label: "Questions", value: "50K+", color: "text-green-600" },
    { label: "Success Rate", value: "95%", color: "text-purple-600" },
    { label: "AI Response", value: "<2s", color: "text-orange-600" }
  ];
  
  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200 mb-6 sm:mb-8 shadow-sm transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
        {stats.map((stat, index) => (
          <div key={index} className="group hover:scale-105 transition-transform duration-200">
            <div className={`text-lg sm:text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs sm:text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Daily Challenge Button Component
const DailyChallengeButton = ({ isVisible }: { isVisible: boolean }) => {
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const [isHovered, setIsHovered] = useState(false);

  const handleChallengeClick = () => {
      router.push('/try');
  };

  return (
    <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} mb-8 sm:mb-12`}>
      <div className="text-center">
        <button
          onClick={handleChallengeClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative inline-flex items-center justify-center px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-bold text-white transition-all duration-300 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 overflow-hidden"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:translate-x-full"></div>
          
          {/* Pulsing border */}
          <div className="absolute inset-0 rounded-2xl border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
          
          {/* Content */}
          <div className="relative z-10 flex items-center space-x-3">
            <div className="text-2xl sm:text-3xl animate-bounce">
              🎯
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold">
                Daily Challenge
              </div>
              <div className="text-xs sm:text-sm opacity-90 font-normal">
                Test your knowledge today!
              </div>
            </div>
            <div className={`transform transition-transform duration-300 ${isHovered ? 'translate-x-2' : ''}`}>
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
          
          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/40 rounded-full animate-ping"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 2) * 40}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>
        </button>
        
        {/* Supporting text */}
        <p className="mt-4 text-sm sm:text-base text-gray-600 max-w-md mx-auto">
          Challenge yourself with daily questions and earn points! 
          {!user ? (
            <span className="block mt-1">
              <button
                onClick={() => router.push('/login')}
                className="text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200 underline hover:no-underline"
              >
                Sign in to track your progress
              </button>
            </span>
          ) : (
            <span className="block mt-1 text-green-600 font-medium">
              Welcome back! Your progress is being tracked.
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

// Features component - fixed visibility and made responsive
const Features = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 800); // Reduced delay
    
    return () => clearTimeout(timer);
  }, []);

  const features = [
    { icon: "🎯", title: "Personalized Learning", desc: "AI adapts to your learning style" },
    { icon: "⚡", title: "Instant Feedback", desc: "Get detailed explanations immediately" },
    { icon: "📊", title: "Track Progress", desc: "Monitor your learning journey" }
  ];

  return (
    <div className={`mt-12 sm:mt-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <h3 className="text-lg sm:text-xl font-semibold text-center text-gray-800 mb-6 sm:mb-8">
        Why Choose Paaṭha AI?
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
        {features.map((feature, i) => (
          <div 
            key={i}
            className="bg-white/60 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105 group"
            style={{
              animationDelay: `${i * 100}ms`
            }}
          >
            <div className="text-2xl sm:text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
              {feature.icon}
            </div>
            <h4 className="font-semibold text-gray-800 text-sm sm:text-base mb-2">
              {feature.title}
            </h4>
            <p className="text-xs sm:text-sm text-gray-600">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Auth Button Component
const AuthButton = () => {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 800); // Slightly delayed to let logo animate first
    
    return () => clearTimeout(timer);
  }, []);

  // Don't show auth buttons if user is already logged in
  if (user) {
    return (
      <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="inline-flex items-center px-4 py-3 bg-green-50 border border-green-200 rounded-full text-green-700 text-sm font-medium shadow-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
          Welcome back! Ready to learn?
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* CTA Header */}
      <div className="mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">
          Start Learning Today!
        </h3>
        <p className="text-sm text-gray-600">
          Join 10K+ students already learning smarter
        </p>
      </div>
      
      {/* Buttons */}
      <div className="flex flex-col gap-3 min-w-[200px]">
        {/* Sign Up Button - Primary */}
        <button
          onClick={() => router.push('/register')}
          className="group relative inline-flex items-center justify-center px-6 py-3 text-base font-bold text-white transition-all duration-300 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 overflow-hidden"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:translate-x-full"></div>
          
          {/* Content */}
          <div className="relative z-10 flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Get Started Free</span>
          </div>
          
          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/40 rounded-full animate-ping"
                style={{
                  left: `${30 + i * 20}%`,
                  top: `${40 + (i % 2) * 20}%`,
                  animationDelay: `${i * 0.7}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>
        </button>

        {/* Sign In Button - Secondary */}
        <button
          onClick={() => router.push('/login')}
          className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-red-600 transition-all duration-300 bg-white border border-red-200 rounded-lg shadow-sm hover:shadow-md hover:scale-105 active:scale-95 hover:border-red-300 hover:bg-red-50"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span>Already have an account?</span>
          </div>
        </button>
      </div>
      
      {/* Trust indicators */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
          Free to start
        </div>
        <div className="flex items-center">
          <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
          No credit card
        </div>
      </div>
    </div>
  );
};

// Call to action section
const CallToAction = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1200);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`mt-12 sm:mt-16 text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg sm:rounded-xl p-6 sm:p-8 border border-red-100">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
          Ready to Transform Your Learning?
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto">
          Join thousands of students who are already experiencing the power of AI-driven personalized education.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            Free to start
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            No credit card required
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
            Instant access
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const router = useRouter();
  const { profile, user } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  
  // Role-based redirect effect
  useEffect(() => {
    // Only redirect if we have complete auth information and aren't in a loading state
    if (user && profile && !isLoading) {
      // Add a small delay to ensure all auth state is properly resolved
      const redirectTimer = setTimeout(() => {
        if (profile.role === 'teacher') {
          router.push('/teacher/dashboard');
          return;
        } else if (profile.role === 'student') {
          router.push('/student/dashboard');
          return;
        }
        // If no role is set, stay on landing page
        console.log('User has no role, staying on landing page');
      }, 100); // Small delay to ensure auth state is stable

      return () => clearTimeout(redirectTimer);
    }
  }, [user, profile, router, isLoading]);
  
  // Memoized class selection handler
  const handleClassSelect = React.useCallback((board: string, classLevel: string) => {
    router.push(`/${board}/${classLevel}`);
  }, [router]);
  
  // Memoized board entries
  const boardEntries = useMemo(() => 
    Object.entries(BOARD_STRUCTURE), 
    []
  );
  
  // Fast loading simulation
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setIsLoading(false);
      // Show stats immediately after main loading
      setTimeout(() => setShowStats(true), 100);
      // Show challenge button after stats
      setTimeout(() => setShowChallenge(true), 400);
    }, 300);
    
    const cardsTimer = setTimeout(() => setCardsLoading(false), 500);
    
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(cardsTimer);
    };
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 px-4">
        <EnhancedSpinner size="lg" message="Preparing your learning journey..." />
      </div>
    );
  }
  
  return (
    <>
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
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        
        /* Mobile-first responsive design */
        @media (max-width: 640px) {
          .container-fluid {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
      `}</style>
      
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative">
        {/* Optimized background decorations - responsive */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
          <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
               style={{animationDuration: '2s'}} />
        </div>
        
        <div className="container-fluid px-4 sm:px-8 py-4 sm:py-6 relative z-10">
          <div className="max-w-[1600px] mx-auto w-full">
            {/* Navigation - Highest z-index to prevent blocking */}
            <div className="flex justify-end mb-4 sm:mb-6 opacity-0 animate-fade-in stagger-1 relative z-[100]">
              <Navigation />
            </div>
            
            <div className="max-w-4xl mx-auto relative z-0">
              {/* Enhanced Logo Section - responsive */}
              <div className="text-center mb-12 sm:mb-16 opacity-0 animate-fade-in-up stagger-2">
                <EnhancedLogo 
                  className="h-12 w-12 sm:h-16 sm:w-16" 
                  showText={true}
                />
                <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
                  Experience personalized learning with AI-powered feedback designed for Indian curriculum
                </p>
              </div>
              
              {/* Quick Stats */}
              <QuickStats isVisible={showStats} />
              
              {/* Daily Challenge Button */}
              <DailyChallengeButton isVisible={showChallenge} />
              
              {/* Show board selection only if user is not logged in or doesn't have a role */}
              {(!user || !profile?.role) && (
                <>
                  {/* Board Selection */}
                  <h2 className="text-xl sm:text-2xl font-semibold text-center text-gray-800 mb-6 sm:mb-8 opacity-0 animate-fade-in stagger-4 px-4 sm:px-0">
                    Choose Your Learning Path
                  </h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8">
                    {boardEntries.map(([boardKey, board], index) => (
                      <div 
                        key={boardKey}
                        className="opacity-0 animate-fade-in-up"
                        style={{
                          animationDelay: `${0.5 + (index * 0.2)}s`,
                          animationFillMode: 'forwards'
                        }}
                      >
                        {cardsLoading ? (
                          <BoardCardSkeleton />
                        ) : (
                          <EnhancedBoardCard
                            board={boardKey}
                            displayName={board.display_name}
                            classes={board.classes}
                            onClick={handleClassSelect}
                            isLoading={false}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {/* Features Section */}
              <Features />
              
              {/* Call to Action */}
              <CallToAction />
              
              {/* Bottom spacing for mobile */}
              <div className="h-8 sm:h-16"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}