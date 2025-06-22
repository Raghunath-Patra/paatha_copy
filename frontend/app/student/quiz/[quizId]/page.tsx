// frontend/app/student/quiz/[quizId]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import { supabase } from '../../../utils/supabase';
import Navigation from '../../../components/navigation/Navigation';
import { 
  Clock, 
  Calendar, 
  Award, 
  CheckCircle, 
  XCircle, 
  Eye,
  X,
  BarChart3
} from 'lucide-react';

interface QuizDetails {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  time_limit?: number;
  total_marks: number;
  passing_marks: number;
  attempts_allowed: number;
  start_time?: string;
  end_time?: string;
  course_name: string;
  teacher_name?: string;
  my_attempts: number;
  best_score?: number;
  can_attempt: boolean;
  time_remaining?: number;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options?: string[];
  marks: number;
  order_index: number;
}

interface AttemptResponse {
  id: string;
  quiz_id: string;
  quiz_title: string;
  attempt_number: number;
  obtained_marks: number;
  total_marks: number;
  percentage: number;
  started_at: string;
  submitted_at?: string;
  time_taken?: number;
  status: string;
  is_auto_graded: boolean;
  teacher_reviewed: boolean;
  responses?: Record<string, any>;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  quiz_title: string;
  attempt_number: number;
  obtained_marks: number;
  total_marks: number;
  percentage: number;
  started_at: string;
  submitted_at?: string;
  time_taken?: number;
  status: string;
}

export default function TakeQuiz() {
  const router = useRouter();
  const params = useParams();
  const quizId = params?.quizId as string;
  const { user, profile } = useSupabaseAuth();
  
  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<AttemptResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  
  // New state for previous attempts
  const [previousAttempts, setPreviousAttempts] = useState<QuizAttempt[]>([]);
  const [showAttemptsModal, setShowAttemptsModal] = useState(false);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check if user is a student
  useEffect(() => {
    if (profile && profile.role !== 'student') {
      router.push('/'); // Redirect non-students
    }
  }, [profile, router]);

  // Fetch quiz details
  const fetchQuizDetails = useCallback(async () => {
    if (!user || !quizId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(`${API_URL}/api/student/quizzes/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch quiz');
      }

      const quizData = await response.json();
      setQuiz(quizData);
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }, [user, quizId]);

  // Fetch previous attempts for this quiz
  const fetchPreviousAttempts = useCallback(async () => {
    if (!user || !quizId) return;

    try {
      setLoadingAttempts(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(`${API_URL}/api/student/quizzes/attempts/my-attempts`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch attempts');
      }

      const attemptsData = await response.json();
      // Filter attempts for this specific quiz
      const quizAttempts = attemptsData.filter((attempt: AttemptResponse) => attempt.quiz_id === quizId);
      setPreviousAttempts(quizAttempts);
    } catch (err) {
      console.error('Error fetching attempts:', err);
    } finally {
      setLoadingAttempts(false);
    }
  }, [user, quizId]);

  useEffect(() => {
    fetchQuizDetails();
  }, [fetchQuizDetails]);

  // Start quiz attempt
  const startQuizAttempt = async () => {
    if (!quiz) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(`${API_URL}/api/student/quizzes/${quizId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start quiz');
      }

      const attemptData = await response.json();
      setCurrentAttempt(attemptData);

      // Fetch questions
      const questionsResponse = await fetch(`${API_URL}/api/student/quizzes/${quizId}/questions`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!questionsResponse.ok) {
        throw new Error('Failed to fetch questions');
      }

      const questionsData = await questionsResponse.json();
      setQuestions(questionsData);

      // Initialize timer if quiz has time limit
      if (quiz.time_limit) {
        setTimeRemaining(quiz.time_limit * 60); // Convert minutes to seconds
      }

      setShowInstructions(false);
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  // Handle viewing previous attempts
  const handleViewPreviousAttempts = async () => {
    await fetchPreviousAttempts();
    setShowAttemptsModal(true);
  };

  // Navigate to specific attempt results
  const navigateToAttemptResults = (attemptId: string) => {
    router.push(`/student/quiz/${quizId}/results/${attemptId}`);
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format duration
  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get score color
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get score background color
  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Auto-submit when time runs out
          submitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Submit quiz
  const submitQuiz = async () => {
    if (!currentAttempt) return;

    try {
      setSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(`${API_URL}/api/student/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit quiz');
      }

      const resultData = await response.json();
      sessionStorage.setItem(`quiz_results_${resultData.attempt.id}`, JSON.stringify(resultData));
    
      // Redirect to results page with the attempt ID
      router.push(`/student/quiz/${quizId}/results/${resultData.attempt.id}`);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle answer selection
  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Quiz not found</p>
      </div>
    );
  }

  // Show instructions/start page
  if (showInstructions || !currentAttempt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            <Navigation />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Quiz Information</h2>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Course:</span>
                  <span className="ml-2">{quiz.course_name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Teacher:</span>
                  <span className="ml-2">{quiz.teacher_name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Total Marks:</span>
                  <span className="ml-2">{quiz.total_marks}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Passing Marks:</span>
                  <span className="ml-2">{quiz.passing_marks}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Time Limit:</span>
                  <span className="ml-2">{quiz.time_limit ? `${quiz.time_limit} minutes` : 'No limit'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Attempts:</span>
                  <span className="ml-2">{quiz.my_attempts}/{quiz.attempts_allowed}</span>
                </div>
              </div>

              {quiz.description && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{quiz.description}</p>
                </div>
              )}

              {quiz.instructions && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Instructions</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-gray-700">{quiz.instructions}</p>
                  </div>
                </div>
              )}
            </div>

            {!quiz.can_attempt ? (
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-700">
                  You cannot take this quiz at this time. 
                  {quiz.my_attempts >= quiz.attempts_allowed 
                    ? ' You have used all your attempts.'
                    : ' Please check the quiz schedule.'}
                </p>
              </div>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                
                {/* Show Previous Attempts button if user has attempts */}
                {quiz.my_attempts > 0 && (
                  <button
                    onClick={handleViewPreviousAttempts}
                    className="flex-1 py-3 px-4 border border-blue-300 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center justify-center"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Previous Attempts
                  </button>
                )}
                
                <button
                  onClick={startQuizAttempt}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Starting...' : 'Start Quiz'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Previous Attempts Modal */}
        {showAttemptsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Previous Quiz Attempts</h3>
                <button
                  onClick={() => setShowAttemptsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingAttempts ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Loading attempts...</p>
                  </div>
                ) : previousAttempts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No previous attempts found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {previousAttempts.map((attempt) => (
                      <div 
                        key={attempt.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigateToAttemptResults(attempt.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-gray-900">
                              Attempt #{attempt.attempt_number}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              attempt.status === 'completed' ? 'bg-green-100 text-green-800' :
                              attempt.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {attempt.status === 'completed' ? 'Completed' :
                               attempt.status === 'in_progress' ? 'In Progress' :
                               attempt.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-lg font-bold ${getScoreColor(attempt.percentage)}`}>
                              {attempt.percentage.toFixed(1)}%
                            </span>
                            <Eye className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Award className="h-4 w-4 mr-1" />
                            Score: {attempt.obtained_marks}/{attempt.total_marks}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Time: {formatDuration(attempt.time_taken)}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Started: {formatDate(attempt.started_at)}
                          </div>
                          {attempt.submitted_at && (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Submitted: {formatDate(attempt.submitted_at)}
                            </div>
                          )}
                        </div>
                        
                        {/* Score bar */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                attempt.percentage >= 80 ? 'bg-green-500' :
                                attempt.percentage >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(attempt.percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-t p-4 bg-gray-50">
                <button
                  onClick={() => setShowAttemptsModal(false)}
                  className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show quiz questions (existing code continues...)
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
            <div className="flex items-center space-x-4">
              {timeRemaining !== null && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  timeRemaining < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  Time: {formatTime(timeRemaining)}
                </div>
              )}
              <span className="text-sm text-gray-600">
                {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentQuestion && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Question {currentQuestionIndex + 1}
                </h2>
                <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {currentQuestion.marks} mark{currentQuestion.marks !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                {currentQuestion.question_text}
              </p>
            </div>

            {/* Answer options */}
            <div className="space-y-3 mb-6">
              {currentQuestion.question_type.toLowerCase() === 'mcq' && currentQuestion.options ? (
                currentQuestion.options.map((option, index) => (
                  <label key={index} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="mr-3"
                    />
                    <span>{option}</span>
                  </label>
                ))
              ) : (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Type your answer here..."
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-2">
                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={submitQuiz}
                    disabled={submitting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Question navigator */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Question Navigator</h3>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 text-xs font-medium rounded ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : answers[questions[index].id]
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center text-xs text-gray-600 space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-600 rounded mr-1"></div>
              Current
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 rounded mr-1"></div>
              Answered
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-100 rounded mr-1"></div>
              Not answered
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}