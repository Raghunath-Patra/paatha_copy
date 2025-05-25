import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Zap, Target, ArrowRight, RefreshCw, Clock } from 'lucide-react';

interface DailyLimitReachedProps {
  questionsUsedToday?: number;
  planName?: string;
  displayName?: string;
  onUpgrade?: () => void;
  onGoBack?: () => void;
  showStats?: boolean;
}

// Enhanced Logo Component (matches your existing one)
const EnhancedLogo = ({ className = "h-16 w-16", showText = true }) => (
  <div className="flex flex-col items-center">
    <div className={`${className} relative group`}>
      {/* Main logo circle with gradient */}
      <div className="w-full h-full bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
        {/* Inner logo */}
        <div className="text-white font-bold text-2xl sm:text-3xl tracking-tight">
          पा
        </div>
        {/* Subtle inner glow */}
        <div className="absolute inset-2 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
      </div>
      
      {/* Floating animation ring */}
      <div className="absolute inset-0 border-2 border-orange-300/30 rounded-full animate-ping"></div>
    </div>
    
    {showText && (
      <div className="mt-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
          Paaṭha AI
        </h1>
        <p className="text-sm text-gray-600 mt-1">Personalized Learning</p>
      </div>
    )}
  </div>
);

// Stats component
const TodayStats = ({ questionsUsed }: { questionsUsed: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const achievements = [
    { icon: "🎯", label: "Questions Completed", value: questionsUsed },
    { icon: "⚡", label: "Learning Sessions", value: "1" },
    { icon: "🏆", label: "Progress Made", value: "Great!" }
  ];

  return (
    <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <h3 className="text-lg font-semibold text-center text-gray-800 mb-6">
        🎉 Today's Learning Journey
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {achievements.map((achievement, index) => (
          <div 
            key={index}
            className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50 hover:shadow-md transition-all duration-200 hover:scale-105"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="text-2xl mb-2">{achievement.icon}</div>
            <div className="font-semibold text-gray-800 text-lg">{achievement.value}</div>
            <div className="text-xs text-gray-600">{achievement.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main component
const DailyLimitReached: React.FC<DailyLimitReachedProps> = ({
  questionsUsedToday = 0,
  planName = 'free',
  displayName = 'Free Plan',
  onUpgrade,
  onGoBack,
  showStats = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer1 = setTimeout(() => setIsVisible(true), 200);
    const timer2 = setTimeout(() => setShowFeatures(true), 1000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push('/upgrade');
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      router.back();
    }
  };

  const premiumFeatures = [
    { icon: <Zap className="w-5 h-5" />, title: "Unlimited Questions", desc: "Practice as much as you want" },
    { icon: <Target className="w-5 h-5" />, title: "Advanced Analytics", desc: "Detailed performance insights" },
    { icon: <Trophy className="w-5 h-5" />, title: "Priority Support", desc: "Get help when you need it" }
  ];

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.5); }
        }
        
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
        
        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative overflow-hidden">
        {/* Animated background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse float-animation" 
               style={{animationDuration: '3s', animationDelay: '0s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce float-animation" 
               style={{animationDuration: '4s', animationDelay: '1s'}} />
          <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping float-animation" 
               style={{animationDuration: '2s', animationDelay: '0.5s'}} />
          <div className="absolute top-1/4 left-1/3 w-6 h-6 sm:w-10 sm:h-10 bg-red-100/40 rounded-full animate-pulse float-animation" 
               style={{animationDuration: '3.5s', animationDelay: '2s'}} />
          <div className="absolute bottom-1/3 left-1/6 w-4 h-4 sm:w-8 sm:h-8 bg-yellow-100/30 rounded-full animate-bounce float-animation" 
               style={{animationDuration: '2.5s', animationDelay: '1.5s'}} />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 relative z-10">
          <div className="max-w-4xl mx-auto w-full">
            
            {/* Main Content */}
            <div className={`text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              
              {/* Logo */}
              <div className="mb-8">
                <EnhancedLogo className="h-20 w-20 sm:h-24 sm:w-24 mx-auto" showText={true} />
              </div>

              {/* Main Message */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 mb-8 shadow-lg border border-white/50 relative overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-transparent opacity-50"></div>
                
                <div className="relative z-10">
                  <div className="text-4xl sm:text-5xl mb-4">🎯</div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
                    Daily Learning Goal Achieved!
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
                    You've reached your daily usage limit on the <span className="font-semibold text-orange-600">{displayName}</span>. 
                    Great progress today! Ready to unlock unlimited learning?
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      onClick={handleUpgrade}
                      className="group relative overflow-hidden bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105 pulse-glow flex items-center gap-3"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative z-10 flex items-center gap-3">
                        <Zap className="w-5 h-5" />
                        Upgrade to Premium
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>

                    <button
                      onClick={handleGoBack}
                      className="text-gray-600 px-6 py-3 rounded-full font-medium hover:bg-white/60 transition-all duration-200 flex items-center gap-2 group"
                    >
                      <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                      Go Back
                    </button>
                  </div>
                </div>
              </div>

              {/* Today's Stats */}
              {showStats && questionsUsedToday > 0 && (
                <div className="mb-8">
                  <TodayStats questionsUsed={questionsUsedToday} />
                </div>
              )}

              {/* Premium Features */}
              {showFeatures && (
                <div className="transition-all duration-700 opacity-100 translate-y-0">
                  <h3 className="text-xl font-semibold text-center text-gray-800 mb-6">
                    🚀 Unlock Premium Features
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
                    {premiumFeatures.map((feature, index) => (
                      <div 
                        key={index}
                        className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/50 hover:shadow-md transition-all duration-200 hover:scale-105 group"
                        style={{ animationDelay: `${index * 100 + 1200}ms` }}
                      >
                        <div className="text-orange-500 mb-3 group-hover:scale-110 transition-transform duration-200">
                          {feature.icon}
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-2">{feature.title}</h4>
                        <p className="text-sm text-gray-600">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset Information */}
              <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200/50 max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Your daily limit will reset at midnight UTC
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Come back tomorrow to continue your learning journey!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DailyLimitReached;