// app/page.tsx - Fixed responsive version
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

// Quick stats component - made responsive
const QuickStats = () => {
  const stats = [
    { label: "Students", value: "10K+", color: "text-blue-600" },
    { label: "Questions", value: "50K+", color: "text-green-600" },
    { label: "Success Rate", value: "95%", color: "text-purple-600" },
    { label: "AI Response", value: "<2s", color: "text-orange-600" }
  ];
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-100 mb-6 sm:mb-8 opacity-0 animate-fade-in stagger-3">
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
  const { profile } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(true);
  
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
    const initialTimer = setTimeout(() => setIsLoading(false), 300);
    const cardsTimer = setTimeout(() => setCardsLoading(false), 500); // Faster card loading
    
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
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
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
        </div>
        
        <div className="container-fluid px-4 sm:px-8 py-4 sm:py-6 relative z-10">
          <div className="max-w-[1600px] mx-auto w-full">
            {/* Navigation */}
            <div className="flex justify-end mb-4 sm:mb-6 opacity-0 animate-fade-in stagger-1">
              <Navigation />
            </div>
            
            <div className="max-w-4xl mx-auto">
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
              <QuickStats />
              
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