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
        {/* Animated background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
          <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
               style={{animationDuration: '2s'}} />
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
            <p className="text-gray-600 animate-pulse">Loading your question...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-md text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-medium mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/try')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-md text-center">
          <h2 className="text-xl font-medium mb-4">No questions available</h2>
          <p className="text-gray-600 mb-6">Please try again later.</p>
          <button
            onClick={() => router.push('/try')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <div className="container-fluid px-8 py-6">
        <div className="max-w-[1600px] mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Logo className="h-8 w-8" showText={true} />
            <div className="text-sm font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto">
            {/* Progress bar */}
            <div className="w-full bg-gray-200 h-2 rounded-full mb-8">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
            
            {/* Timer */}
            <div className="text-right text-sm text-gray-500 mb-2">
              Time: {Math.floor(timers[currentQuestionIndex] / 60)}:{(timers[currentQuestionIndex] % 60).toString().padStart(2, '0')}
            </div>
            
            {/* Question card */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="text-sm text-blue-600 mb-2">
                {currentQuestion.category}
              </div>
              <h2 className="text-xl font-medium mb-6">{currentQuestion.question_text}</h2>
              
              {/* Question type-specific UI */}
              {currentQuestion.type === 'MCQ' ? (
                // MCQ question
                <div className="space-y-3">
                  {isSubmitting && (
                    <div className="flex justify-center my-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2">Submitting...</span>
                    </div>
                  )}
                  {currentQuestion.options?.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleMCQSelection(option)}
                      disabled={showFeedback || isSubmitting}
                      className={`w-full text-left p-3 rounded-lg border transition-colors
                        ${showFeedback && option === currentResult?.correct_answer
                          ? 'bg-green-50 border-green-500'
                          : showFeedback && option === answers[currentQuestionIndex]
                          ? 'bg-red-50 border-red-500'
                          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'}
                        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                // Short answer question
                <form onSubmit={handleShortAnswerSubmit}>
                  <textarea
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    disabled={showFeedback || isSubmitting}
                    placeholder="Type your answer here..."
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                    required
                  ></textarea>
                  {isSubmitting ? (
                    <div className="flex justify-center mt-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2">Submitting...</span>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={showFeedback || isSubmitting || !answerInput.trim()}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Submit Answer
                    </button>
                  )}
                </form>
              )}
              
              {/* Feedback */}
              {showFeedback && (
                <div className={`mt-4 p-4 rounded-lg ${
                  currentQuestion.type === 'MCQ' 
                    ? (isMCQCorrect ? 'bg-green-50' : 'bg-red-50') 
                    : (isCorrect ? 'bg-green-50' : 'bg-amber-50')
                }`}>
                  <div className="font-medium mb-2">
                    {currentQuestion.type === 'MCQ' 
                      ? (isMCQCorrect ? 'Correct! ✅' : 'Incorrect ❌')
                      : `Score: ${currentResult?.score}/10`
                    }
                  </div>
                  <p>{currentResult?.feedback}</p>
                  
                  {!isCorrect && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="font-medium">Correct Answer:</div>
                      <p>{currentResult?.correct_answer}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Full screen overlay when navigating to results */}
      {isNavigatingToResults && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-medium">Preparing your results...</p>
          </div>
        </div>
      )}
    </div>
  );
}