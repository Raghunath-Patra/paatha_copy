// frontend/app/try/challenge/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

export default function ChallengePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralShareId = searchParams?.get('ref') || null;
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [timers, setTimers] = useState<number[]>([0, 0, 0]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigatingToResults, setIsNavigatingToResults] = useState(false);
  
  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        
        // Use absolute URL to the backend API
        let url = 'https://api.paatha.ai/api/try/questions';
        if (referralShareId) {
          url += `?referral_share_id=${referralShareId}`;
        }
        
        console.log("Fetching questions from:", url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          let errorMessage = 'Failed to load questions';
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorMessage;
          } catch (parseError) {
            // If it's not JSON, try to get the text
            try {
              const errorText = await response.text();
              console.error('Error response (not JSON):', errorText);
              errorMessage = `Failed to load questions: ${response.status} ${response.statusText}`;
            } catch (textError) {
              console.error('Error getting response text:', textError);
            }
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        if (!data.questions || data.questions.length === 0) {
          throw new Error('No questions available');
        }
        
        setQuestions(data.questions);
        
        // Initialize arrays
        setAnswers(new Array(data.questions.length).fill(''));
        setResults(new Array(data.questions.length).fill(null));
        setStartTime(new Date());
      } catch (err) {
        console.error('Error fetching questions:', err);
        
        // Fallback to hardcoded questions if API fails
        const fallbackQuestions = [
          {
            id: "1",
            question_text: "What is 2 + 2?",
            type: "MCQ",
            difficulty: "easy",
            options: ["3", "4", "5", "6"],
            category: "Mathematics"
          },
          {
            id: "2",
            question_text: "What is the capital of France?",
            type: "MCQ",
            difficulty: "easy",
            options: ["London", "Berlin", "Paris", "Madrid"],
            category: "Geography"
          },
          {
            id: "3",
            question_text: "Explain how the water cycle works.",
            type: "short_answer",
            difficulty: "medium",
            category: "Science"
          }
        ];
        
        console.log("Using fallback questions");
        setQuestions(fallbackQuestions);
        setAnswers(new Array(fallbackQuestions.length).fill(''));
        setResults(new Array(fallbackQuestions.length).fill(null));
        setStartTime(new Date());
        
        setError(null); // Clear error since we're using fallback questions
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [referralShareId]);
  
  // Handle timer
  useEffect(() => {
    if (!startTime || showFeedback) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      
      // Update timers array
      setTimers(prev => {
        const newTimers = [...prev];
        newTimers[currentQuestionIndex] = elapsed;
        return newTimers;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startTime, currentQuestionIndex, showFeedback]);
  
  // Client-side grading fallback function
  const gradeAnswerLocally = (questionId: string, userAnswer: string): AttemptResult => {
    // Hardcoded answers for fallback questions
    const fallbackAnswers: Record<string, {answer: string, explanation: string}> = {
      "1": {answer: "4", explanation: "Basic addition: 2 + 2 = 4"},
      "2": {answer: "Paris", explanation: "Paris is the capital city of France."},
      "3": {answer: "The water cycle is the continuous movement of water on, above, and below Earth's surface through processes of evaporation, condensation, precipitation, and collection.", 
            explanation: "The water cycle involves water evaporating from bodies of water, condensing into clouds, precipitating as rain or snow, and collecting in bodies of water again."}
    };
    
    const fallback = fallbackAnswers[questionId];
    
    if (questionId === "1" || questionId === "2") {  // MCQ questions
      const isCorrect = userAnswer.trim() === fallback?.answer.trim();
      return {
        id: `local-${Date.now()}`,
        score: isCorrect ? 10 : 0,
        feedback: isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${fallback?.answer}`,
        correct_answer: fallback?.answer || "",
        explanation: fallback?.explanation
      };
    } else {  // Short answer
      // Simple grading for fallback
      const wordCount = userAnswer.trim().split(/\s+/).length;
      const score = Math.min(Math.max(wordCount / 3, 3), 10);
      return {
        id: `local-${Date.now()}`,
        score,
        feedback: score >= 7 ? "Good answer! You've covered most of the key points." : "Your answer could be more complete. Consider adding more details.",
        correct_answer: fallback?.answer || "",
        explanation: fallback?.explanation
      };
    }
  };
  
  const submitAnswer = async (selectedAnswer: string) => {
    if (showFeedback || isSubmitting) return;
    
    try {
      // Set submitting state
      setIsSubmitting(true);
      
      // Stop timer
      const timeTaken = timers[currentQuestionIndex];
      
      // Update answers
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = selectedAnswer;
      setAnswers(newAnswers);
      
      // If the question ID starts with a number (our fallback questions), use local grading
      const questionId = questions[currentQuestionIndex].id;
      let result;
      
      if (questionId === "1" || questionId === "2" || questionId === "3") {
        // Use local grading for fallback questions
        result = gradeAnswerLocally(questionId, selectedAnswer);
      } else {
        // Use API for real questions
        try {
          const response = await fetch('https://api.paatha.ai/api/try/grade', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              question_id: questionId,
              answer: selectedAnswer,
              time_taken: timeTaken,
              referral_share_id: referralShareId,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to grade answer');
          }
          
          result = await response.json();
        } catch (apiError) {
          console.error('API grading error, falling back to local grading:', apiError);
          // Fallback to local grading if API fails
          result = gradeAnswerLocally(questionId, selectedAnswer);
        }
      }
      
      // Update results
      const newResults = [...results];
      newResults[currentQuestionIndex] = result;
      setResults(newResults);
      
      // Show feedback
      setShowFeedback(true);
      setIsSubmitting(false);
      
      // Move to next question after a delay or finish
      setTimeout(() => {
        setShowFeedback(false);
        
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setStartTime(new Date()); // Reset timer for next question
          setAnswerInput(''); // Clear input for next question
        } else {
          // All questions answered - store results
          localStorage.setItem('paaṭha_challenge_results', JSON.stringify({
            questions,
            answers: newAnswers,
            results: newResults,
            timestamp: new Date().toISOString()
          }));
          
          // Set navigating state to prevent flicker
          setIsNavigatingToResults(true);
          
          // Navigate to results page
          router.push('/try/results');
        }
      }, 3000);
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
      console.error('Error submitting answer:', err);
    }
  };
  
  const handleMCQSelection = (option: string) => {
    submitAnswer(option);
  };
  
  const handleShortAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim()) return;
    submitAnswer(answerInput);
  };
  
  // Get current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // Calculate feedback display
  const currentResult = results[currentQuestionIndex];
  const isCorrect = currentResult?.score >= 7; // For short answers
  const isMCQCorrect = currentQuestion?.type === 'MCQ' && currentResult?.score === 10;
  
  if (loading) {
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
            <p className="text-gray-600 animate-pulse">Loading your challenge questions...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center relative">
        {/* Animated background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-md text-center border border-white/50 relative z-10">
          <div className="text-red-500 text-3xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/try')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center relative">
        {/* Animated background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-md text-center border border-white/50 relative z-10">
          <div className="text-4xl mb-4">📝</div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">No questions available</h2>
          <p className="text-gray-600 mb-6">Please try again later.</p>
          <button
            onClick={() => router.push('/try')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* Enhanced animations and styling */}
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
        
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3);
          }
          50% { 
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
          }
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
        
        .pulse-glow {
          animation: pulse-glow 2s infinite;
        }
        
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
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
            <div className="flex items-center justify-between mb-8 opacity-0 animate-fade-in stagger-1">
              <Logo className="h-8 w-8 sm:h-10 sm:w-10" showText={true} />
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-blue-200/50">
                <div className="text-sm font-medium text-blue-700">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
              </div>
            </div>
            
            <div className="max-w-2xl mx-auto">
              {/* Progress bar */}
              <div className="w-full bg-white/60 backdrop-blur-sm h-3 rounded-full mb-8 shadow-sm border border-white/50 overflow-hidden opacity-0 animate-fade-in stagger-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
              
              {/* Timer */}
              <div className="text-right mb-4 opacity-0 animate-fade-in stagger-3">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-50 to-red-50 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-orange-200/50">
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-orange-700">
                    {Math.floor(timers[currentQuestionIndex] / 60)}:{(timers[currentQuestionIndex] % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
              
              {/* Question card */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-white/50 opacity-0 animate-fade-in-up stagger-4">
                <div className="text-sm text-blue-600 mb-3 font-medium bg-blue-50 px-3 py-1 rounded-full w-fit">
                  {currentQuestion.category}
                </div>
                <h2 className="text-xl font-semibold mb-6 text-gray-800 leading-relaxed">{currentQuestion.question_text}</h2>
                
                {/* Question type-specific UI */}
                {currentQuestion.type === 'MCQ' ? (
                  // MCQ question
                  <div className="space-y-3">
                    {isSubmitting && (
                      <div className="flex justify-center items-center my-6 bg-blue-50/80 backdrop-blur-sm rounded-lg py-4 border border-blue-200/50">
                        <div className="relative">
                          <div className="w-8 h-8 border-4 border-blue-200 rounded-full animate-spin border-t-blue-500"></div>
                          <div className="absolute inset-0 w-8 h-8 border-4 border-transparent rounded-full animate-ping border-t-blue-300"></div>
                        </div>
                        <span className="ml-3 text-blue-700 font-medium">Analyzing your answer...</span>
                      </div>
                    )}
                    {currentQuestion.options?.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleMCQSelection(option)}
                        disabled={showFeedback || isSubmitting}
                        className={`w-full text-left p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] hover:shadow-md
                          ${showFeedback && option === currentResult?.correct_answer
                            ? 'bg-green-50/90 backdrop-blur-sm border-green-400 shadow-lg shadow-green-200/50'
                            : showFeedback && option === answers[currentQuestionIndex]
                            ? 'bg-red-50/90 backdrop-blur-sm border-red-400 shadow-lg shadow-red-200/50'
                            : 'border-gray-200 bg-white/60 backdrop-blur-sm hover:border-blue-400 hover:bg-blue-50/80'}
                          ${isSubmitting ? 'opacity-50 cursor-not-allowed transform-none' : ''}
                        `}
                      >
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300 mr-3 flex items-center justify-center text-xs font-semibold bg-white">
                            {String.fromCharCode(65 + index)}
                          </div>
                          {option}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  // Short answer question
                  <form onSubmit={handleShortAnswerSubmit} className="space-y-4">
                    <textarea
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      disabled={showFeedback || isSubmitting}
                      placeholder="Type your answer here..."
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] bg-white/80 backdrop-blur-sm transition-all duration-200 disabled:opacity-50"
                      required
                    ></textarea>
                    {isSubmitting ? (
                      <div className="flex justify-center items-center py-4 bg-blue-50/80 backdrop-blur-sm rounded-lg border border-blue-200/50">
                        <div className="relative">
                          <div className="w-8 h-8 border-4 border-blue-200 rounded-full animate-spin border-t-blue-500"></div>
                          <div className="absolute inset-0 w-8 h-8 border-4 border-transparent rounded-full animate-ping border-t-blue-300"></div>
                        </div>
                        <span className="ml-3 text-blue-700 font-medium">Analyzing your answer...</span>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={showFeedback || isSubmitting || !answerInput.trim()}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] font-medium"
                      >
                        Submit Answer
                      </button>
                    )}
                  </form>
                )}
                
                {/* Feedback */}
                {showFeedback && (
                  <div className={`mt-6 p-4 rounded-lg border animate-slide-up ${
                    currentQuestion.type === 'MCQ' 
                      ? (isMCQCorrect ? 'bg-green-50/90 backdrop-blur-sm border-green-200 shadow-lg shadow-green-200/50' : 'bg-red-50/90 backdrop-blur-sm border-red-200 shadow-lg shadow-red-200/50') 
                      : (isCorrect ? 'bg-green-50/90 backdrop-blur-sm border-green-200 shadow-lg shadow-green-200/50' : 'bg-amber-50/90 backdrop-blur-sm border-amber-200 shadow-lg shadow-amber-200/50')
                  }`}>
                    <div className="font-semibold mb-3 text-lg flex items-center">
                      {currentQuestion.type === 'MCQ' 
                        ? (isMCQCorrect ? '🎉 Correct!' : '❌ Incorrect')
                        : `📊 Score: ${currentResult?.score}/10`
                      }
                    </div>
                    <p className="text-gray-700 mb-3">{currentResult?.feedback}</p>
                    
                    {!isCorrect && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="font-medium text-gray-800 mb-2">💡 Correct Answer:</div>
                        <p className="text-gray-700 bg-white/50 p-3 rounded-lg">{currentResult?.correct_answer}</p>
                      </div>
                    )}
                    
                    <div className="mt-4 text-center">
                      <div className="text-sm text-gray-600">
                        {currentQuestionIndex < questions.length - 1 
                          ? `Moving to question ${currentQuestionIndex + 2} in a moment...`
                          : 'Preparing your results...'
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Full screen overlay when navigating to results */}
        {isNavigatingToResults && (
          <div className="fixed inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-white/50">
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-red-200 rounded-full animate-spin border-t-red-500 mx-auto"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-red-300 mx-auto"></div>
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-2">Analyzing your performance...</p>
              <p className="text-sm text-gray-600">Preparing personalized insights</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}