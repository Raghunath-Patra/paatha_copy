// frontend/app/try/results/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/common/Logo';

interface Question {
  id: string;
  question_text: string;
  type: string;
  options?: string[];
  category: string;
}

interface AttemptResult {
  id: string;
  score: number;
  feedback: string;
  correct_answer: string;
  explanation?: string;
}

interface ChallengeResults {
  questions: Question[];
  answers: string[];
  results: AttemptResult[];
  timestamp: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<ChallengeResults | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [shareText, setShareText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Get results from localStorage
    const savedResults = localStorage.getItem('paaṭha_challenge_results');
    if (!savedResults) {
      router.push('/try');
      return;
    }
    
    try {
      const parsedResults = JSON.parse(savedResults) as ChallengeResults;
      setResults(parsedResults);
      
      // Generate share text
      const totalScore = parsedResults.results.reduce((sum, result) => sum + result.score, 0);
      const averageScore = (totalScore / parsedResults.results.length).toFixed(1);
      
      // Determine strengths and weaknesses
      const questionsByScore = parsedResults.questions.map((question, index) => ({
        category: question.category,
        score: parsedResults.results[index].score
      }));
      
      const strongCategories = questionsByScore
        .filter(q => q.score >= 7)
        .map(q => q.category);
      
      const weakCategories = questionsByScore
        .filter(q => q.score < 7)
        .map(q => q.category);
      
      const strongCategory = strongCategories.length > 0 ? strongCategories[0] : 'General Knowledge';
      const weakCategory = weakCategories.length > 0 ? weakCategories[0] : '';
      
      // Create emoji scoreboard
      const emojiScore = parsedResults.results.map(result => 
        result.score >= 7 ? '✅' : '❌'
      ).join('');
      
      // Create share text with Paaṭha AI branding and challenge
      const shareText = `📊 Today's Paaṭha AI Challenge
${emojiScore} I scored ${averageScore}/10! 🏆
${strongCategories.length > 0 ? '✅ Strong: ' + strongCategory : ''}
${weakCategories.length > 0 ? '⚠️ Weak: ' + weakCategory : ''}
I challenge you to beat my score! 🧠 Are you up for it?
Try it here 👇
https://www.paatha.ai/try`;
      
      setShareText(shareText);
      
      // Simulate loading completion
      setTimeout(() => {
        setIsLoading(false);
        // Show signup prompt after 3 seconds
        setTimeout(() => {
          setShowSignupPrompt(true);
        }, 3000);
      }, 1000);
      
    } catch (error) {
      console.error('Error parsing results:', error);
      router.push('/try');
    }
  }, [router]);
  
  const handleShare = async (method: string) => {
    if (!results) return;
    
    try {
      // Record share attempt if not already done
      if (!shareId) {
        const attemptIds = results.results.map(r => r.id).filter(id => id);
        
        // Only proceed if we have attempt IDs (from the backend) that aren't local
        if (attemptIds.length > 0 && !attemptIds[0].startsWith('local-')) {
          try {
            const response = await fetch('https://api.paatha.ai/api/try/record-share', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                attempt_ids: attemptIds,
                share_method: method
              }),
            });
            
            if (response.ok) {
              const data = await response.json();
              setShareId(data.share_id);
            }
          } catch (error) {
            console.error('Error recording share:', error);
            // Continue with sharing even if recording fails
          }
        }
      }
      
      // Handle sharing based on method
      if (method === 'whatsapp') {
        shareToWhatsApp();
      }
    } catch (error) {
      console.error('Error sharing results:', error);
    }
  };
  
  const shareToWhatsApp = () => {
    const encodedText = encodeURIComponent(shareText);
    let url = `https://wa.me/?text=${encodedText}`;
    
    // Add share ID as a referral if available
    if (shareId) {
      const encodedShareLink = encodeURIComponent(`https://www.paatha.ai/try?ref=${shareId}`);
      url = `https://wa.me/?text=${encodedText}%0A${encodedShareLink}`;
    }
    
    window.open(url, '_blank');
  };
  
  const tryAgain = () => {
    localStorage.removeItem('paaṭha_challenge_results');
    router.push('/try');
  };
  
  if (isLoading || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center relative">
        {/* Enhanced animated background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
          <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
               style={{animationDuration: '2s'}} />
          <div className="absolute top-1/4 right-1/3 w-6 h-6 sm:w-8 sm:h-8 bg-red-300/20 rounded-full animate-bounce" 
               style={{animationDuration: '5s', animationDelay: '1s'}} />
          <div className="absolute bottom-1/3 left-1/3 w-4 h-4 sm:w-6 sm:h-6 bg-orange-300/25 rounded-full animate-pulse" 
               style={{animationDuration: '4s', animationDelay: '2s'}} />
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
            <p className="text-gray-600 animate-pulse">Analyzing your results...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Calculate total score
  const totalScore = results.results.reduce((sum, result) => sum + result.score, 0);
  const averageScore = (totalScore / results.results.length).toFixed(1);
  
  // Generate emoji score display
  const emojiScores = results.results.map(result => result.score >= 7 ? '✅' : '❌');
  
  // Identify strengths and weaknesses
  const questionCategories = results.questions.map((q, i) => ({
    category: q.category,
    score: results.results[i].score
  }));
  
  const strongCategories = questionCategories
    .filter(q => q.score >= 7)
    .map(q => q.category);
  
  const weakCategories = questionCategories
    .filter(q => q.score < 7)
    .map(q => q.category);

  return (
    <>
      {/* Enhanced animations */}
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
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scoreReveal {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes celebration {
          0%, 50%, 100% { transform: scale(1); }
          25% { transform: scale(1.1); }
          75% { transform: scale(0.95); }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }
        
        .animate-score-reveal {
          animation: scoreReveal 0.8s ease-out forwards;
        }
        
        .animate-celebration {
          animation: celebration 2s ease-in-out infinite;
        }
        
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }
        .stagger-6 { animation-delay: 0.6s; }
        
        .shimmer-effect {
          background: linear-gradient(90deg, 
            rgba(255, 255, 255, 0) 0%, 
            rgba(255, 255, 255, 0.3) 50%, 
            rgba(255, 255, 255, 0) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex flex-col relative">
        {/* Enhanced animated background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
          <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
               style={{animationDuration: '2s'}} />
          <div className="absolute top-1/4 right-1/3 w-6 h-6 sm:w-8 sm:h-8 bg-red-300/20 rounded-full animate-bounce" 
               style={{animationDuration: '5s', animationDelay: '1s'}} />
          <div className="absolute bottom-1/3 left-1/3 w-4 h-4 sm:w-6 sm:h-6 bg-orange-300/25 rounded-full animate-pulse" 
               style={{animationDuration: '4s', animationDelay: '2s'}} />
        </div>

        <div className="container-fluid px-4 sm:px-8 py-4 sm:py-6 relative z-10">
          <div className="max-w-[1600px] mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-center mb-8 opacity-0 animate-fade-in stagger-1">
              <Logo className="h-10 w-10 sm:h-12 sm:w-12" showText={true} />
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-white/50 opacity-0 animate-fade-in-up stagger-2">
                <h1 className="text-2xl font-semibold mb-8 text-center text-gray-800">🎉 Your Challenge Results</h1>
                
                {/* Score display */}
                <div className="flex justify-center mb-8 opacity-0 animate-score-reveal stagger-3">
                  <div className="relative">
                    <div className="flex items-center justify-center w-28 h-28 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full shadow-lg border-4 border-white animate-celebration">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{averageScore}</div>
                        <div className="text-sm text-blue-500 font-medium">/10</div>
                      </div>
                    </div>
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-20 animate-ping"></div>
                  </div>
                </div>
                
                {/* Emoji score */}
                <div className="flex justify-center gap-6 mb-8 opacity-0 animate-fade-in stagger-4">
                  {emojiScores.map((emoji, index) => (
                    <div key={index} className="text-4xl transform hover:scale-110 transition-transform duration-200" 
                         style={{animationDelay: `${0.6 + index * 0.2}s`}}>
                      <div className="animate-fade-in">{emoji}</div>
                    </div>
                  ))}
                </div>
                
                {/* Question details */}
                <div className="mb-8 space-y-4 opacity-0 animate-slide-up stagger-5">
                  {results.questions.map((question, index) => (
                    <div key={index} className="bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm p-4 border border-white/50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm text-blue-600 mb-2 font-medium bg-blue-50 px-3 py-1 rounded-full w-fit">{question.category}</div>
                          <div className="font-medium text-gray-800 mb-2">{question.question_text}</div>
                        </div>
                        <div className="ml-4 flex items-center">
                          <div className="text-2xl font-bold text-right">
                            <span className={`${results.results[index].score >= 7 ? 'text-green-600' : results.results[index].score >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {results.results[index].score}
                            </span>
                            <span className="text-gray-400 text-lg">/10</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-200 text-sm space-y-2">
                        <div className="flex items-start">
                          <span className="font-medium text-gray-700 mr-2">Your answer:</span> 
                          <span className="text-gray-600">{results.answers[index]}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium text-gray-700 mr-2">Feedback:</span> 
                          <span className="text-gray-600">{results.results[index].feedback}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Insights */}
                <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-sm rounded-xl p-6 mb-8 border border-blue-200/50 shadow-sm opacity-0 animate-slide-up stagger-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                    <span className="text-2xl mr-2">🧠</span>
                    Paaṭha AI Insights
                  </h2>
                  <div className="space-y-3">
                    {strongCategories.length > 0 && (
                      <div className="flex items-start bg-green-50/80 backdrop-blur-sm rounded-lg p-3 border border-green-200/50">
                        <div className="text-green-500 mr-3 text-xl">✅</div>
                        <div>
                          <span className="font-medium text-green-800">Strong areas:</span>
                          <span className="text-green-700 ml-2">{strongCategories.join(', ')}</span>
                        </div>
                      </div>
                    )}
                    
                    {weakCategories.length > 0 && (
                      <div className="flex items-start bg-amber-50/80 backdrop-blur-sm rounded-lg p-3 border border-amber-200/50">
                        <div className="text-amber-500 mr-3 text-xl">⚠️</div>
                        <div>
                          <span className="font-medium text-amber-800">Growth opportunities:</span>
                          <span className="text-amber-700 ml-2">{weakCategories.join(', ')}</span>
                        </div>
                      </div>
                    )}
                    
                    {strongCategories.length === 0 && weakCategories.length === 0 && (
                      <div className="flex items-start bg-blue-50/80 backdrop-blur-sm rounded-lg p-3 border border-blue-200/50">
                        <div className="text-blue-500 mr-3 text-xl">🎯</div>
                        <div>
                          <span className="font-medium text-blue-800">Balanced performance across all areas!</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Shareable card */}
                <div className="bg-gradient-to-r from-purple-50/90 to-pink-50/90 backdrop-blur-sm border border-purple-200/50 rounded-xl p-6 mb-6 text-center shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center justify-center">
                    <span className="text-2xl mr-2">🏆</span>
                    Challenge Your Friends!
                  </h3>
                  
                  <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg my-4 text-left whitespace-pre-wrap text-sm font-mono border border-gray-200">
                    {shareText}
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                    >
                      <span className="text-lg">📱</span>
                      Share on WhatsApp
                    </button>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="space-y-4">
                  <div className="text-center text-sm text-gray-600 mb-4 bg-gradient-to-r from-orange-50/80 to-yellow-50/80 backdrop-blur-sm p-4 rounded-lg border border-orange-200/50">
                    <span className="text-xl mr-2">🚀</span>
                    Ready for more? Challenge yourself with personalized questions from CBSE, Karnataka Board, and more!              
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={tryAgain}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                    >
                      🔄 Try Again
                    </button>
                    
                    <Link
                      href="/register"
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium text-center"
                    >
                      ⭐ Create Free Account
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}