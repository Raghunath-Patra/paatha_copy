'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award, 
  Target, 
  Brain, 
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Lightbulb,
  AlertCircle,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

const QuizResults = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { quizId, attemptId } = router.query;
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [isRichData, setIsRichData] = useState(false); // Track if we have full submission data

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // First check if we have rich data from recent submission
        const storedResults = sessionStorage.getItem(`quiz_results_${attemptId}`);
        
        if (storedResults) {
          // We have rich data from immediate submission
          const richData = JSON.parse(storedResults);
          setResults(richData);
          setIsRichData(true);
          setLoading(false);
          
          // Clear the stored data to prevent stale data on future visits
          sessionStorage.removeItem(`quiz_results_${attemptId}`);
          return;
        }

        // No rich data available, fetch basic data from API
        const response = await fetch(`${API_URL}/api/student/quizzes/attempts/${attemptId}/results`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }

        const data = await response.json();
        setResults(data);
        setIsRichData(false); // This is basic data from database
        setLoading(false);
        
      } catch (error) {
        console.error('Error fetching results:', error);
        setLoading(false);
        
        // Fallback mock data for development
        const mockData = {
          attempt: {
            id: "attempt-123",
            quiz_id: quizId,
            quiz_title: "Physics Chapter 1 - Motion",
            attempt_number: 1,
            obtained_marks: 47,
            total_marks: 60,
            percentage: 78.33,
            started_at: "2024-01-15T10:00:00Z",
            submitted_at: "2024-01-15T10:45:00Z",
            time_taken: 45,
            status: "completed"
          },
          questions_with_answers: [
            {
              question_id: "q1",
              question_text: "What is Newton's first law of motion?",
              question_type: "short_answer",
              options: null,
              student_answer: "An object at rest stays at rest and an object in motion stays in motion unless acted upon by an external force.",
              correct_answer: "An object at rest stays at rest and an object in motion stays in motion with constant velocity unless acted upon by an unbalanced external force.",
              explanation: "Newton's first law, also known as the law of inertia, describes the tendency of objects to resist changes in their motion.",
              feedback: "Excellent understanding! You've captured the core concept perfectly. You could enhance your answer by mentioning 'unbalanced' force and 'constant velocity' for complete precision.",
              marks: 10,
              score: 9,
              is_correct: true,
              time_spent: 120,
              confidence_level: 4,
              flagged_for_review: false
            },
            {
              question_id: "q2",
              question_text: "Which of the following is a vector quantity?",
              question_type: "mcq",
              options: ["Speed", "Distance", "Velocity", "Time"],
              student_answer: "Velocity",
              correct_answer: "Velocity",
              explanation: "Velocity is a vector quantity because it has both magnitude and direction, unlike speed which only has magnitude.",
              feedback: "Correct!",
              marks: 5,
              score: 5,
              is_correct: true,
              time_spent: 30,
              confidence_level: 5,
              flagged_for_review: false
            },
            {
              question_id: "q3",
              question_text: "Calculate the acceleration of a car that goes from 0 to 60 mph in 8 seconds.",
              question_type: "numerical",
              options: null,
              student_answer: "7.5 mph/s",
              correct_answer: "7.5 mph/s or 3.36 m/s²",
              explanation: "Acceleration = (final velocity - initial velocity) / time = (60 - 0) / 8 = 7.5 mph/s. In SI units: 3.36 m/s².",
              feedback: "Good work! You got the calculation right. For completeness, you could also convert to standard SI units (m/s²).",
              marks: 15,
              score: 12,
              is_correct: true,
              time_spent: 300,
              confidence_level: 3,
              flagged_for_review: true
            },
            {
              question_id: "q4",
              question_text: "Explain the difference between mass and weight.",
              question_type: "essay",
              options: null,
              student_answer: "Mass is how much matter is in an object and weight is the force of gravity on that object.",
              correct_answer: "Mass is the amount of matter in an object and is constant regardless of location. Weight is the gravitational force acting on an object and varies with location (different on Earth vs Moon).",
              explanation: "This is a common source of confusion. Mass is measured in kg and is invariant, while weight is measured in Newtons and depends on gravitational field strength.",
              feedback: "You've grasped the basic concept well! To strengthen your answer, mention that mass is constant regardless of location while weight varies (e.g., different on Earth vs Moon), and include the units (kg for mass, N for weight).",
              marks: 20,
              score: 14,
              is_correct: true,
              time_spent: 240,
              confidence_level: 2,
              flagged_for_review: false
            },
            {
              question_id: "q5",
              question_text: "What is the SI unit of force?",
              question_type: "mcq",
              options: ["Joule", "Newton", "Watt", "Pascal"],
              student_answer: "Joule",
              correct_answer: "Newton",
              explanation: "The Newton (N) is the SI unit of force. 1 Newton = 1 kg⋅m/s².",
              feedback: "Incorrect. The correct answer is Newton.",
              marks: 5,
              score: 0,
              is_correct: false,
              time_spent: 45,
              confidence_level: 3,
              flagged_for_review: false
            },
            {
              question_id: "q6",
              question_text: "Define momentum and state its formula.",
              question_type: "short_answer",
              options: null,
              student_answer: "Momentum is mass times velocity. p = mv",
              correct_answer: "Momentum is the product of an object's mass and velocity. Formula: p = mv, where p is momentum, m is mass, and v is velocity.",
              explanation: "Momentum is a vector quantity that describes the motion of an object. It's conserved in isolated systems.",
              feedback: "Perfect! You've provided both the definition and formula correctly. Momentum is indeed mass times velocity (p = mv).",
              marks: 5,
              score: 5,
              is_correct: true,
              time_spent: 90,
              confidence_level: 5,
              flagged_for_review: false
            }
          ],
          summary: {
            total_questions: 6,
            correct_answers: 5,
            total_marks: 60,
            obtained_marks: 47,
            percentage: 78.33,
            passed: true,
            time_taken: 45,
            ai_grading_used: true,
            ai_token_usage: {
              prompt_tokens: 1245,
              completion_tokens: 892,
              total_tokens: 2137
            }
          }
        };
        
        setResults(mockData);
        setIsRichData(true); // Mock as rich data for demo
        setLoading(false);
      }
    };

    if (attemptId) {
      fetchResults();
    }
  }, [attemptId, quizId]);

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 border-green-200';
    if (percentage >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const currentQuestion = results?.questions_with_answers[currentQuestionIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Results Not Found</h2>
          <p className="text-gray-600">Unable to load quiz results. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{results.attempt.quiz_title}</h1>
              <p className="text-sm text-gray-600">
                Attempt #{results.attempt.attempt_number} • Submitted {formatDate(results.attempt.submitted_at)}
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data Status Banner */}
        {!isRichData && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">
                You're viewing basic results. Some detailed information like AI feedback and explanations may not be available.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Score Card */}
            <div className={`rounded-lg border p-6 ${getScoreBgColor(results.summary.percentage)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Quiz Results</h2>
                  <p className="text-gray-600">
                    {results.summary.passed ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="h-5 w-5 mr-1" />
                        Passed
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600">
                        <XCircle className="h-5 w-5 mr-1" />
                        Failed
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold ${getScoreColor(results.summary.percentage)}`}>
                    {results.summary.percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {results.summary.obtained_marks}/{results.summary.total_marks} marks
                  </div>
                </div>
              </div>
            </div>

            {/* Question Navigation */}
            {!showAllQuestions && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Question {currentQuestionIndex + 1} of {results.questions_with_answers.length}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentQuestionIndex(Math.min(results.questions_with_answers.length - 1, currentQuestionIndex + 1))}
                      disabled={currentQuestionIndex === results.questions_with_answers.length - 1}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Current Question */}
                {currentQuestion && (
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentQuestion.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {currentQuestion.is_correct ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{currentQuestion.question_text}</h4>
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Type:</span> {currentQuestion.question_type} • 
                          <span className="font-medium ml-2">Marks:</span> {currentQuestion.score}/{currentQuestion.marks}
                          {currentQuestion.time_spent && (
                            <>
                              <span className="font-medium ml-2">Time:</span> {Math.floor(currentQuestion.time_spent / 60)}m {currentQuestion.time_spent % 60}s
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* MCQ Options */}
                    {currentQuestion.options && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Options:</h5>
                        <div className="space-y-1">
                          {currentQuestion.options.map((option, index) => (
                            <div
                              key={index}
                              className={`p-2 rounded text-sm ${
                                option === currentQuestion.correct_answer ? 'bg-green-100 text-green-800' :
                                option === currentQuestion.student_answer ? 'bg-red-100 text-red-800' :
                                'bg-gray-50 text-gray-700'
                              }`}
                            >
                              <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                              {option === currentQuestion.correct_answer && (
                                <span className="ml-2 text-xs">(Correct)</span>
                              )}
                              {option === currentQuestion.student_answer && option !== currentQuestion.correct_answer && (
                                <span className="ml-2 text-xs">(Your answer)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Student Answer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Your Answer:</h5>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-gray-900">{currentQuestion.student_answer || 'No answer provided'}</p>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Correct Answer:</h5>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-gray-900">{currentQuestion.correct_answer}</p>
                        </div>
                      </div>
                    </div>

                    {/* Feedback - only show if available */}
                    {currentQuestion.feedback && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Lightbulb className="h-4 w-4 mr-1" />
                          Feedback:
                          {isRichData && (
                            <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              AI Generated
                            </span>
                          )}
                        </h5>
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-sm text-gray-900">{currentQuestion.feedback}</p>
                        </div>
                      </div>
                    )}

                    {/* Explanation - only show if available */}
                    {isRichData && currentQuestion.explanation && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Explanation:</h5>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
                        </div>
                      </div>
                    )}

                    {/* Question Metadata - only show if available */}
                    {isRichData && (
                      <div className="flex items-center space-x-4 text-xs text-gray-500 pt-2 border-t">
                        {currentQuestion.confidence_level && (
                          <span className="flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            Confidence: {currentQuestion.confidence_level}/5
                          </span>
                        )}
                        {currentQuestion.flagged_for_review && (
                          <span className="flex items-center text-amber-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Flagged for review
                          </span>
                        )}
                        {currentQuestion.time_spent && (
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Time: {Math.floor(currentQuestion.time_spent / 60)}m {currentQuestion.time_spent % 60}s
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Question Grid Navigation */}
                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-10 gap-2">
                    {results.questions_with_answers.map((q, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-8 h-8 rounded text-xs font-medium ${
                          index === currentQuestionIndex ? 'bg-blue-600 text-white' :
                          q.is_correct ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                          'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Toggle View Button */}
            <div className="text-center">
              <button
                onClick={() => setShowAllQuestions(!showAllQuestions)}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
              >
                {showAllQuestions ? 'Show Question by Question' : 'Show All Questions'}
              </button>
            </div>

            {/* All Questions View */}
            {showAllQuestions && (
              <div className="space-y-6">
                {results.questions_with_answers.map((question, index) => (
                  <div key={question.question_id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-start space-x-3 mb-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        question.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {question.is_correct ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Question {index + 1}: {question.question_text}</h4>
                        <div className="mt-1 text-sm text-gray-600">
                          Score: {question.score}/{question.marks} marks
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Your Answer:</h5>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-gray-900">{question.student_answer || 'No answer provided'}</p>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Correct Answer:</h5>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-gray-900">{question.correct_answer}</p>
                        </div>
                      </div>
                    </div>

                    {question.feedback && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Lightbulb className="h-4 w-4 mr-1" />
                          Feedback:
                          {isRichData && (
                            <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              AI Generated
                            </span>
                          )}
                        </h5>
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-sm text-gray-900">{question.feedback}</p>
                        </div>
                      </div>
                    )}

                    {/* Only show explanation for rich data */}
                    {isRichData && question.explanation && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Explanation:</h5>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <p className="text-sm text-gray-700">{question.explanation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600">
                    <Target className="h-4 w-4 mr-2" />
                    Questions Correct
                  </span>
                  <span className="font-medium">{results.summary.correct_answers}/{results.summary.total_questions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600">
                    <Award className="h-4 w-4 mr-2" />
                    Total Score
                  </span>
                  <span className="font-medium">{results.summary.obtained_marks}/{results.summary.total_marks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    Time Taken
                  </span>
                  <span className="font-medium">{formatTime(results.summary.time_taken)}</span>
                </div>
                {isRichData && results.summary.ai_grading_used && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm text-gray-600">
                      <Brain className="h-4 w-4 mr-2" />
                      AI Grading
                    </span>
                    <span className="text-xs text-blue-600">Used</span>
                  </div>
                )}
                {isRichData && results.summary.ai_token_usage && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm text-gray-600">
                      <Brain className="h-4 w-4 mr-2" />
                      AI Tokens
                    </span>
                    <span className="text-xs text-gray-600">{results.summary.ai_token_usage.total_tokens}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Accuracy</span>
                  <span className="font-medium">
                    {((results.summary.correct_answers / results.summary.total_questions) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(results.summary.correct_answers / results.summary.total_questions) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Question Types Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Types</h3>
              <div className="space-y-2">
                {Object.entries(
                  results.questions_with_answers.reduce((acc, q) => {
                    acc[q.question_type] = (acc[q.question_type] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 capitalize">{type.replace('_', ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100">
                  <BarChart3 className="h-4 w-4 mr-2 inline" />
                  View Analytics
                </button>
                <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Retake Quiz
                </button>
                <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Download Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;