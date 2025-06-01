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
      
      // Show signup prompt after 3 seconds
      setTimeout(() => {
        setShowSignupPrompt(true);
      }, 3000);
      
    } catch (error) {
      console.error('Error parsing results:', error);
      router.push('/try');
    }
  }, [router]);
  
  const handleShare = async (method: string) => {
    if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center relative">
        {/* Animated background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
          <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
               style={{animationDuration: '2s'}} />
        </div>
        
        <div className="relative z-10">
          <div className="w-10 h-10 border-4 border-red-200 rounded-full animate-spin border-t-red-500"></div>
        </div>
      </div>
    );
  }
    
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
  
  if (!results) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Calculate total score
  const totalScore = results.results.reduce((sum, result) => sum + result.score, 0);
  const averageScore = (totalScore / results.results.length).toFixed(1); // Use toFixed(1) to show one decimal place
  
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
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <div className="container-fluid px-8 py-6">
        <div className="max-w-[1600px] mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <Logo className="h-12 w-12" showText={true} />
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h1 className="text-2xl font-semibold mb-6 text-center">Your Challenge Results</h1>
              
              {/* Score display */}
              <div className="flex justify-center mb-6">
                <div className="flex items-center justify-center w-24 h-24 bg-blue-50 rounded-full">
                  <div className="text-3xl font-bold text-blue-600">{averageScore}/10</div>
                </div>
              </div>
              
              {/* Emoji score */}
              <div className="flex justify-center gap-4 mb-8">
                {emojiScores.map((emoji, index) => (
                  <div key={index} className="text-3xl">
                    {emoji}
                  </div>
                ))}
              </div>
              
              {/* Question details */}
              <div className="mb-8 space-y-4">
                {results.questions.map((question, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm text-blue-600 mb-1">{question.category}</div>
                        <div className="font-medium">{question.question_text}</div>
                      </div>
                      <div className="text-lg font-bold">
                        {results.results[index].score}/10
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-2 border-t text-sm">
                      <div><span className="font-medium">Your answer:</span> {results.answers[index]}</div>
                      <div className="mt-1"><span className="font-medium">Feedback:</span> {results.results[index].feedback}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Insights */}
              <div className="bg-blue-50 rounded-lg p-4 mb-8">
                <h2 className="text-lg font-medium mb-3">Paaṭha AI Insights:</h2>
                <div className="space-y-2">
                  {strongCategories.length > 0 && (
                    <div className="flex items-start">
                      <div className="text-green-500 mr-2">✅</div>
                      <div>
                        <span className="font-medium">Strong in:</span> {strongCategories.join(', ')}
                      </div>
                    </div>
                  )}
                  
                  {weakCategories.length > 0 && (
                    <div className="flex items-start">
                      <div className="text-amber-500 mr-2">⚠️</div>
                      <div>
                        <span className="font-medium">Needs improvement:</span> {weakCategories.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Shareable card - now centered */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6 text-center">
                <h3 className="text-lg font-medium mb-3">I scored {averageScore}/10! Can you beat me?</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg my-4 whitespace-pre-wrap">
                  {shareText}
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Share on WhatsApp
                  </button>
                </div>
              </div>
              
              {/* Actions - with new direct call to action */}
              <div className="flex flex-col gap-4">
                <div className="text-center text-sm text-gray-600 mb-2">
                Challenge yourself with general puzzles and academic questions from CBSE, Karnataka Board, and more. Try now!                
                </div>
                <Link
                  href="/register"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
            
            {/* Removed prompt section as requested */}
          </div>
        </div>
      </div>
    </div>
  );
}