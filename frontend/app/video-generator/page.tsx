// File: frontend/app/video-generator/page.tsx (Enhanced Landing Page)
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import Navigation from '../components/navigation/Navigation';
import EnhancedSpinner from '../components/common/EnhancedSpinner';
import { getAuthHeaders } from '../utils/auth';
import VideoProjectBrowser from './components/video-generator/VideoProjectBrowser';

// Define the Project interface
interface Project {
  projectId: string;
  title: string;
  createdAt: string;
  status: string;
  lessonStepsCount: number;
  speakers: string[];
  visualFunctions: string[];
  hasVideo: boolean;
  videoFiles: string[];
}

interface UserBalance {
  available_credits: number;
  current_package: {
    name: string;
    total_credits: number;
  } | null;
  purchased_at: string | null;
  is_new_user?: boolean;
  eligible_for_bonus?: boolean;
}

// Animated Bonus Popup Component
const BonusClaimPopup = ({ 
  isOpen, 
  onClaim, 
  onClose, 
  loading = false,
  showSuccess = false,
  successData = null
}: { 
  isOpen: boolean; 
  onClaim: () => void; 
  onClose: () => void;
  loading?: boolean;
  showSuccess?: boolean;
  successData?: { credits_granted: number; message: string } | null;
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [giftOpened, setGiftOpened] = useState(false);

  useEffect(() => {
    if (isOpen && !showSuccess) {
      setAnimationPhase(0);
      setGiftOpened(false);
      const timer1 = setTimeout(() => setAnimationPhase(1), 300);
      const timer2 = setTimeout(() => setAnimationPhase(2), 800);
      const timer3 = setTimeout(() => setAnimationPhase(3), 1300);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
    
    if (showSuccess) {
      setAnimationPhase(0);
      setTimeout(() => setGiftOpened(true), 500);
    }
  }, [isOpen, showSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-sm sm:max-w-md w-full text-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 opacity-50"></div>
        
        {!showSuccess ? (
          <>
            {/* Floating Emojis - Responsive positioning */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 text-lg sm:text-2xl animate-bounce" style={{ animationDelay: '0s' }}>🎉</div>
            <div className="absolute top-3 right-3 sm:top-6 sm:right-6 text-base sm:text-xl animate-bounce" style={{ animationDelay: '0.5s' }}>✨</div>
            <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 text-base sm:text-xl animate-bounce" style={{ animationDelay: '1s' }}>🚀</div>
            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 text-lg sm:text-2xl animate-bounce" style={{ animationDelay: '1.5s' }}>💫</div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Welcome Message */}
              <div className={`transition-all duration-500 ${animationPhase >= 1 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
                <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4 animate-pulse">🎁</div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-2">
                  Welcome to Video Generator!
                </h2>
              </div>

              {/* Bonus Announcement */}
              <div className={`transition-all duration-500 ${animationPhase >= 2 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  As a new user, you're eligible for
                </p>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base sm:text-lg lg:text-xl font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg mb-3 sm:mb-4 animate-pulse">
                  FREE BONUS CREDITS!
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`transition-all duration-500 ${animationPhase >= 3 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
                <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                  Get started with AI-powered video creation immediately!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                  <button
                    onClick={onClose}
                    className="order-2 sm:order-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                    disabled={loading}
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={onClaim}
                    disabled={loading}
                    className="order-1 sm:order-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Claiming...</span>
                      </>
                    ) : (
                      <>
                        <span>🎉</span>
                        <span>Claim Free Credits</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Success Animation */
          <div className="relative z-10">
            {/* Confetti Rain - Responsive */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce text-sm sm:text-base"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`
                  }}
                >
                  {['🎉', '🎊', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)]}
                </div>
              ))}
            </div>

            {/* Gift Box Opening Animation */}
            <div className={`transition-all duration-1000 ${giftOpened ? 'scale-110' : 'scale-100'}`}>
              <div className="text-5xl sm:text-6xl lg:text-8xl mb-3 sm:mb-4 relative">
                {giftOpened ? (
                  <div className="animate-pulse">
                    <div className="relative">
                      📦
                      <div className="absolute inset-0 text-3xl sm:text-4xl lg:text-6xl animate-bounce" style={{ animationDelay: '0.2s' }}>
                        ✨
                      </div>
                    </div>
                  </div>
                ) : (
                  '🎁'
                )}
              </div>
            </div>

            {/* Success Message */}
            <div className={`transition-all duration-700 delay-300 ${giftOpened ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3 sm:mb-4 animate-pulse">
                🎊 Congratulations! 🎊
              </h2>
              
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg sm:text-xl lg:text-2xl font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-xl mb-3 sm:mb-4 animate-bounce shadow-lg">
                + {successData?.credits_granted} FREE CREDITS!
              </div>
              
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 sm:mb-6">
                You're all set to create amazing videos! 🚀
              </p>
              
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl text-base sm:text-lg"
              >
                Start Creating! 🎬
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
const CreditDisplay = ({ userBalance, onClick }: { userBalance: UserBalance | null, onClick: () => void }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false); // Add loading state
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!userBalance) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center space-x-2 sm:space-x-3 bg-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-sm">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
          <div className="w-20 sm:w-24 h-4 sm:h-5 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const handleCreditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPopup(!showPopup);
  };

  // Enhanced upgrade handler with loading state
  const handleUpgradeClick = async () => {
    setIsNavigating(true); // Start loading animation
    
    
    // Small delay to show the loading animation before navigation
    setTimeout(() => {
      setShowPopup(false);
      onClick(); // Navigate to video-credits page
    }, 300);
  };

  return (
    <div className="relative">
      <button
        onClick={handleCreditClick}
        className="flex items-center space-x-2 sm:space-x-3 bg-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border hover:border-blue-300 group"
        disabled={isNavigating} // Disable during navigation
      >
        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600 text-xs sm:text-sm font-bold">₹</span>
        </div>
        <div className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-600 whitespace-nowrap">
          {formatNumber(userBalance.available_credits)} credits left
        </div>
      </button>

      {/* Credit Details Popup */}
      {showPopup && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPopup(false)}
          />
          
          {/* Popup Content */}
          <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-lg sm:rounded-xl shadow-xl border z-50 p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">💳 Credit Details</h3>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Available Credits */}
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-blue-800">Available Credits</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-600 font-bold text-sm sm:text-base">₹</span>
                    <span className="text-base sm:text-lg font-bold text-blue-900">
                      {formatNumber(userBalance.available_credits)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Package */}
              {userBalance.current_package ? (
                <div className="border-l-4 border-purple-400 pl-3 sm:pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700">Current Package</p>
                      <p className="text-sm sm:text-lg font-semibold text-gray-900">
                        {userBalance.current_package.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm text-gray-500">Total Credits</p>
                      <div className="flex items-center space-x-1">
                        <span className="text-purple-600 text-sm sm:text-base">₹</span>
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">
                          {formatNumber(userBalance.current_package.total_credits)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-l-4 border-gray-300 pl-3 sm:pl-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-700">Current Package</p>
                  <p className="text-gray-500 text-sm">No active package</p>
                </div>
              )}

              {/* Purchase Date */}
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-gray-600">Purchased On</span>
                <span className="font-medium text-gray-900">
                  {formatDate(userBalance.purchased_at)}
                </span>
              </div>
            </div>

            {/* Enhanced Upgrade Button with Loading Animation */}
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
              <button
                onClick={handleUpgradeClick}
                disabled={isNavigating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-2 text-sm sm:text-base disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
              >
                {isNavigating ? (
                  <>
                    {/* Loading spinner */}
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    {/* Up arrow icon with bounce animation */}
                    <svg 
                      className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:animate-bounce" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                    <span>Upgrade Package</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Loading overlay for the entire credit display during navigation */}
      {isNavigating && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center z-60">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Animated Text Component
const AnimatedText = ({ texts, className = "" }: { texts: string[], className?: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % texts.length);
        setIsVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <span className={`inline-block transition-all duration-300 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'} ${className}`}>
      {texts[currentIndex]}
    </span>
  );
};

// Floating Orbs Component for background animation
const FloatingOrbs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large floating orb */}
      <div className="absolute -top-10 -left-10 w-32 sm:w-48 h-32 sm:h-48 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-xl animate-pulse"></div>
      
      {/* Medium floating orb */}
      <div className="absolute top-1/4 -right-8 w-24 sm:w-36 h-24 sm:h-36 bg-gradient-to-br from-purple-400/15 to-indigo-500/15 rounded-full blur-lg animate-bounce" style={{ animationDuration: '3s' }}></div>
      
      {/* Small floating orb */}
      <div className="absolute bottom-1/4 left-1/4 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-indigo-400/20 to-blue-500/20 rounded-full blur-md animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Tiny accent orbs */}
      <div className="absolute top-1/2 left-1/6 w-8 sm:w-12 h-8 sm:h-12 bg-gradient-to-br from-blue-300/25 to-purple-400/25 rounded-full blur-sm animate-bounce" style={{ animationDuration: '4s', animationDelay: '2s' }}></div>
      <div className="absolute bottom-1/3 right-1/4 w-6 sm:w-10 h-6 sm:h-10 bg-gradient-to-br from-purple-300/30 to-indigo-400/30 rounded-full blur-sm animate-pulse" style={{ animationDelay: '0.5s' }}></div>
    </div>
  );
};

// Shimmer Effect Component
const ShimmerText = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-overlay bg-[length:200%_100%]"></div>
      {children}
    </div>
  );
};

// Hero Section Component - Fixed text overlapping issues
const HeroSection = ({ onCreateNew }: { onCreateNew: () => void }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  const encouragingTexts = [
    "Transform your ideas into stunning videos",
    "Create educational content in minutes",
    "AI-powered video generation at your fingertips",
    "Bring your stories to life with AI",
    "Generate engaging educational videos effortlessly"
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full max-w-7xl mx-auto text-center py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6 overflow-hidden">
      {/* Floating Background Orbs */}
      <FloatingOrbs />
      
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-indigo-50/50 animate-gradient-x"></div>
      
      <div className={`relative z-10 max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
        {/* Main Heading with enhanced animations and fixed spacing */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-6 sm:mb-8 leading-tight sm:leading-relaxed lg:leading-relaxed pb-2">
          <ShimmerText className="inline-block">
            <span className="inline-block animate-fade-in-up bg-gradient-to-r from-gray-800 via-blue-600 to-gray-800 bg-clip-text text-transparent animate-shimmer-text bg-[length:200%_100%]">
              Create Amazing Videos 
            </span>
          </ShimmerText>{' '}
          <ShimmerText className="inline-block relative">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient-text bg-[length:200%_auto] relative z-10">
              with AI
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-sweep bg-[length:100%_100%] z-20"></div>
          </ShimmerText>
        </h1>
        
        {/* Subtitle with pulsing gradient accent and reduced spacing */}
        <div className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-7 leading-relaxed min-h-[2rem] sm:min-h-[2.5rem] flex items-center justify-center">
          <AnimatedText 
            texts={encouragingTexts}
            className="font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse-glow py-1"
          />
        </div>

        {/* Call-to-action button with hover animations and reduced spacing */}
        <div className="pt-2">
          <button
            onClick={onCreateNew}
            className="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
          >
            {/* Button gradient overlay animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Button content */}
            <span className="relative z-10 flex items-center space-x-2">
              <span className="text-base sm:text-lg">✨ Start Creating Now</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            
            {/* Sparkle effects on hover */}
            <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute top-0 left-1/4 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
              <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
            </div>
          </button>
        </div>
      </div>

      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes gradient-text {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes shimmer-overlay {
        0% { 
          background-position: -200% 0;
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% { 
          background-position: 200% 0;
          opacity: 0;
        }
      }

      @keyframes shimmer-text {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      @keyframes shimmer-sweep {
        0% { 
          background-position: -100% 0;
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% { 
          background-position: 100% 0;
          opacity: 0;
        }
      }
        
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            filter: brightness(1) saturate(1);
            text-shadow: 0 0 10px rgba(147, 51, 234, 0.3);
          }
          50% { 
            filter: brightness(1.1) saturate(1.2);
            text-shadow: 0 0 20px rgba(147, 51, 234, 0.5);
          }
        }
        
        .animate-gradient-x {
          animation: gradient-x 8s ease infinite;
          background-size: 400% 400%;
        }
        
        .animate-gradient-text {
          animation: gradient-text 3s ease infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-shimmer-overlay {
          animation: shimmer-overlay 3s ease-in-out infinite;
        }

        .animate-shimmer-text {
          animation: shimmer-text 3s ease-in-out infinite;
        }

        .animate-shimmer-sweep {
          animation: shimmer-sweep 2.5s ease-in-out infinite;
          animation-delay: 1s;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default function VideoGeneratorPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useSupabaseAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [showBonusPopup, setShowBonusPopup] = useState(false);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successData, setSuccessData] = useState<{ credits_granted: number; message: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch user balance
  useEffect(() => {
    const fetchUserBalance = async () => {
      try {
        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) return;

        const balanceResponse = await fetch(`${API_URL}/api/video-credits/balance`, { headers });
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setUserBalance(balanceData);
          
          // Show bonus popup for new users
          if (balanceData.is_new_user && balanceData.eligible_for_bonus) {
            setShowBonusPopup(true);
          }
        }
      } catch (error) {
        console.error('Error fetching user balance:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && !authLoading) {
      fetchUserBalance();
    }
  }, [user, authLoading, API_URL]);

  const handleClaimBonus = async () => {
    try {
      setClaimingBonus(true);
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        alert('Please log in to claim bonus credits');
        return;
      }

      const response = await fetch(`${API_URL}/api/video-credits/claim-bonus`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update user balance with new credits
        setUserBalance(prev => prev ? {
          ...prev,
          available_credits: result.new_balance,
          current_package: {
            name: result.package_name,
            total_credits: result.credits_granted
          },
          is_new_user: false,
          eligible_for_bonus: false
        } : null);

        // Show success message
        setSuccessData(result);
        setShowSuccessAnimation(true);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || 'Failed to claim bonus credits'}`);
      }
    } catch (error) {
      console.error('Error claiming bonus:', error);
      alert('Error claiming bonus credits. Please try again.');
    } finally {
      setClaimingBonus(false);
    }
  };

  const handleCloseBonusPopup = () => {
    setShowBonusPopup(false);
    setShowSuccessAnimation(false);
    setSuccessData(null);
  };

  const handleProjectAction = (projectId: string, action: string) => {
    switch (action) {
      case 'edit':
        router.push(`/video-generator/${projectId}/edit`);
        break;
      case 'play':
        router.push(`/video-generator/${projectId}/play`);
        break;
      case 'download':
        router.push(`/video-generator/${projectId}/download`);
        break;
      case 'continue':
        router.push(`/video-generator/${projectId}/continue`);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleCreateNew = () => {
    router.push('/video-generator/create');
  };

  const handleCreditsClick = () => {
    router.push('/video-generator/video-credits');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <EnhancedSpinner size="lg" message="Loading video generator..." />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-4">
        <div className="mb-4 sm:mb-6">
          {/* Desktop: All in one row, Mobile: Title+Nav in first row */}
          <div className="flex justify-between items-center mb-3 sm:mb-0">
            {/* Left side - Title and icon */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="text-2xl">🎬</span>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                <span className="sm:hidden">Video Gen</span>
                <span className="hidden sm:inline">Video Generator</span>
              </h1>
            </div>
            
            {/* Right side - Navigation and Credits (desktop), Navigation only (mobile) */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Credits - hidden on mobile, shown on desktop */}
              <div className="hidden sm:block">
                <CreditDisplay userBalance={userBalance} onClick={handleCreditsClick} />
              </div>
              <Navigation />
            </div>
          </div>
          
          {/* Mobile only: Credits on second row, right-aligned */}
          <div className="flex justify-end sm:hidden">
            <CreditDisplay userBalance={userBalance} onClick={handleCreditsClick} />
          </div>
        </div>

        {/* Always show the main hero section */}
        <HeroSection onCreateNew={handleCreateNew} />
        
        {/* Projects section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <VideoProjectBrowser
            projects={projects}
            setProjects={setProjects}
            onProjectAction={handleProjectAction}
            onCreateNew={handleCreateNew}
          />
        </div>

        {/* Bonus Claim Popup */}
        <BonusClaimPopup
          isOpen={showBonusPopup}
          onClaim={handleClaimBonus}
          onClose={handleCloseBonusPopup}
          loading={claimingBonus}
          showSuccess={showSuccessAnimation}
          successData={successData}
        />
      </div>
    </div>
  );
}