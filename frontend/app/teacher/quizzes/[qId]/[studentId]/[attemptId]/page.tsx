'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useSupabaseAuth } from '../../../../../contexts/SupabaseAuthContext';
import { supabase } from '../../../../../utils/supabase';
import Navigation from '../../../../../components/navigation/Navigation';
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
  User,
  Mail,
  School,
  GraduationCap,
  Download,
  MessageSquare,
  Home,
  Hourglass,
  Sparkles,
  RefreshCw,
  Zap,
  ThumbsUp,
  TrendingUp,
  Eye,
  FileText
} from 'lucide-react';

interface QuizAttempt {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
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
}

interface QuestionWithAnswer {
  question_id: string;
  question_text: string;
  question_type: string;
  options?: string[];
  student_answer: string;
  correct_answer: string;
  explanation?: string;
  feedback?: string;
  marks: number;
  score: number | null; // Can be null if not graded yet
  is_correct: boolean | null; // Can be null if not graded yet
  time_spent?: number;
  confidence_level?: number;
  flagged_for_review?: boolean;
}

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  board: string;
  class_level: string;
  institution_name: string;
}

interface AttemptResults {
  attempt: QuizAttempt;
  questions_with_answers: QuestionWithAnswer[];
  summary: {
    total_questions: number;
    correct_answers: number;
    total_marks: number;
    obtained_marks: number;
    percentage: number;
    passed: boolean;
    time_taken?: number;
    ai_grading_used?: boolean;
    quiz_title: string;
    quiz_passing_marks: number;
  };
  student_info: StudentInfo;
}

export default function TeacherAttemptDetail() {
  const router = useRouter();
  const params = useParams();
  const { user, profile } = useSupabaseAuth();
  
  const quizId = params?.qId as string;
  const studentId = params?.studentId as string;
  const attemptId = params?.attemptId as string;
  
  const [results, setResults] = useState<AttemptResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check if user is a teacher
  useEffect(() => {
    if (profile && profile.role !== 'teacher') {
      router.push('/');
    }
  }, [profile, router]);

  // Check if attempt is graded
  const isGraded = results?.questions_with_answers.some(q => q.score !== null) || false;
  const isPendingGrading = results && !isGraded;

  const fetchAttemptResults = async (showRefreshing = false) => {
    if (!user || !quizId || !attemptId) return;

    try {
      if (showRefreshing) setRefreshing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/teacher/quizzes/${quizId}/students/${studentId}/attempts/${attemptId}/results`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch attempt results');
      }

      const data = await response.json();
      setResults(data);
      setLoading(false);
      
    } catch (err) {
      console.error('Error fetching attempt results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load attempt results');
      setLoading(false);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttemptResults();
  }, [user, quizId, attemptId, API_URL, router]);

  // Auto-refresh for pending grading
  useEffect(() => {
    if (isPendingGrading) {
      const interval = setInterval(() => {
        fetchAttemptResults();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isPendingGrading]);

  const formatTime = (minutes: number) => {
    if (!minutes) return '0m';
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

  const handleRefresh = () => {
    fetchAttemptResults(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading attempt results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Results</h2>
          <p className="text-gray-600 mb-4">{error}</p>
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

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Results Not Found</h2>
          <p className="text-gray-600">Unable to load attempt results. Please try again.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = results.questions_with_answers[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{results.summary.quiz_title}</h1>
                  <p className="text-sm text-gray-600">
                    {results.student_info.name} • Attempt #{results.attempt.attempt_number}
                    {results.attempt.submitted_at && ` • Submitted ${formatDate(results.attempt.submitted_at)}`}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isPendingGrading && (
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Checking...' : 'Check Status'}
                </button>
              )}
              <Navigation />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Grading Status Banner */}
        {isPendingGrading && (
          <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Hourglass className="h-5 w-5 text-yellow-600 animate-pulse" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                  Student Submission Under Review ⚡
                </h3>
                <p className="text-yellow-800 mb-3">
                  {results.student_info.name}'s quiz submission is currently being processed by our AI grading system. 
                  The detailed scores and feedback will be available once grading is complete.
                </p>
                <div className="flex items-center space-x-4 text-sm text-yellow-700">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Submitted: {formatDate(results.attempt.submitted_at || results.attempt.started_at)}
                  </div>
                  <div className="flex items-center">
                    <Brain className="h-4 w-4 mr-1" />
                    AI Grading in Progress
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {results.summary.total_questions} Questions Submitted
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Score Card */}
            <div className={`rounded-lg border p-6 ${
              isPendingGrading ? 'bg-blue-50 border-blue-200' : getScoreBgColor(results.summary.percentage)
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isPendingGrading ? 'Student Submission' : 'Student Performance'}
                  </h2>
                  <p className="text-gray-600">
                    {isPendingGrading ? (
                      <span className="flex items-center text-blue-600">
                        <Hourglass className="h-5 w-5 mr-1 animate-pulse" />
                        Under Review
                      </span>
                    ) : results.summary.passed ? (
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
                  {isPendingGrading ? (
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        <Brain className="h-12 w-12 mx-auto" />
                      </div>
                      <div className="text-sm text-blue-700">Processing...</div>
                    </div>
                  ) : (
                    <>
                      <div className={`text-4xl font-bold ${getScoreColor(results.summary.percentage)}`}>
                        {results.summary.percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {results.summary.obtained_marks}/{results.summary.total_marks} marks
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Pending Grading Overview */}
            {isPendingGrading && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-center py-6">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <Eye className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Submission Successfully Received! 🎯
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {results.student_info.name} has completed their quiz attempt. The AI grading system is now 
                    evaluating their responses for accuracy and providing personalized feedback.
                  </p>
                  
                  {/* Submission Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-green-900">Completed</div>
                      <div className="text-xs text-green-700">
                        {results.questions_with_answers.filter(q => q.student_answer.trim()).length}/{results.summary.total_questions} questions
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-blue-900">Time Taken</div>
                      <div className="text-xs text-blue-700">{formatTime(results.summary.time_taken || 0)}</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="text-sm font-medium text-purple-900">Effort Level</div>
                      <div className="text-xs text-purple-700">
                        {results.questions_with_answers.some(q => q.confidence_level) ? 'High Engagement' : 'Good Participation'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Question Navigation */}
            {!isPendingGrading && !showAllQuestions && results.questions_with_answers.length > 0 && (
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
                    {currentQuestion.options && currentQuestion.options.length > 0 && (
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
                                <span className="ml-2 text-xs">(Student's answer)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Student Answer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Student's Answer:</h5>
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

                    {/* Feedback */}
                    {currentQuestion.feedback && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                          <Lightbulb className="h-4 w-4 mr-1" />
                          AI Feedback:
                          {currentQuestion.question_type.toLowerCase() !== 'mcq' && (
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

                    {/* Explanation */}
                    {currentQuestion.explanation && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Explanation:</h5>
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                          <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
                        </div>
                      </div>
                    )}

                    {/* Question Metadata */}
                    {(currentQuestion.confidence_level || currentQuestion.flagged_for_review || currentQuestion.time_spent) && (
                      <div className="flex items-center space-x-4 text-xs text-gray-500 pt-2 border-t">
                        {currentQuestion.confidence_level && (
                          <span className="flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            Student Confidence: {currentQuestion.confidence_level}/5
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
            {!isPendingGrading && results.questions_with_answers.length > 0 && (
              <div className="text-center">
                <button
                  onClick={() => setShowAllQuestions(!showAllQuestions)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                >
                  {showAllQuestions ? 'Show Question by Question' : 'Show All Questions'}
                </button>
              </div>
            )}

            {/* All Questions View */}
            {!isPendingGrading && showAllQuestions && (
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
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Student's Answer:</h5>
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
                          AI Feedback:
                          {question.question_type.toLowerCase() !== 'mcq' && (
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

                    {question.explanation && (
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
            {/* Student Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Student Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{results.student_info.name}</p>
                    <p className="text-xs text-gray-500">Full Name</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{results.student_info.email}</p>
                    <p className="text-xs text-gray-500">Email</p>
                  </div>
                </div>
                {results.student_info.board && (
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {results.student_info.board.toUpperCase()} Class {results.student_info.class_level}
                      </p>
                      <p className="text-xs text-gray-500">Academic Level</p>
                    </div>
                  </div>
                )}
                {results.student_info.institution_name && (
                  <div className="flex items-center space-x-3">
                    <School className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{results.student_info.institution_name}</p>
                      <p className="text-xs text-gray-500">Institution</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isPendingGrading ? 'Submission Summary' : 'Quick Stats'}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600">
                    <Target className="h-4 w-4 mr-2" />
                    {isPendingGrading ? 'Questions Answered' : 'Questions Correct'}
                  </span>
                  <span className="font-medium">
                    {isPendingGrading ? 
                      `${results.questions_with_answers.filter(q => q.student_answer.trim()).length}/${results.summary.total_questions}` :
                      `${results.summary.correct_answers}/${results.summary.total_questions}`
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600">
                    <Award className="h-4 w-4 mr-2" />
                    {isPendingGrading ? 'Maximum Marks' : 'Total Score'}
                  </span>
                  <span className="font-medium">
                    {isPendingGrading ? 
                      `${results.summary.total_marks} marks` :
                      `${results.summary.obtained_marks}/${results.summary.total_marks}`
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    Time Taken
                  </span>
                  <span className="font-medium">{formatTime(results.summary.time_taken || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Attempt Number
                  </span>
                  <span className="font-medium">#{results.attempt.attempt_number}</span>
                </div>
                {results.summary.ai_grading_used && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm text-gray-600">
                      <Brain className="h-4 w-4 mr-2" />
                      AI Grading
                    </span>
                    <span className="text-xs text-blue-600">Used</span>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Breakdown (only show if graded) */}
            {!isPendingGrading && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Accuracy</span>
                    <span className="font-medium">
                      {results.summary.total_questions > 0 ? 
                        ((results.summary.correct_answers / results.summary.total_questions) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: results.summary.total_questions > 0 ? 
                          `${(results.summary.correct_answers / results.summary.total_questions) * 100}%` : '0%'
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-medium ${results.summary.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {results.summary.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Passing Marks</span>
                    <span className="font-medium">{results.summary.quiz_passing_marks}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Encouragement for Pending Grading */}
            {isPendingGrading && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <ThumbsUp className="h-5 w-5 mr-2 text-blue-600" />
                  Great Participation! 🌟
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>✅ Student completed the quiz</p>
                  <p>✅ All responses submitted</p>
                  <p>✅ Time: {formatTime(results.summary.time_taken || 0)}</p>
                  <p className="mt-3 text-blue-700 font-medium">
                    🎯 Results will be available once AI grading is complete.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push(`/teacher/quizzes/${quizId}/view`)}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                >
                  <BarChart3 className="h-4 w-4 mr-2 inline" />
                  Back to Quiz Results
                </button>
                <button 
                  onClick={() => router.push('/teacher/dashboard')}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100"
                >
                  <Home className="h-4 w-4 mr-2 inline" />
                  Teacher Dashboard
                </button>
                {!isPendingGrading && (
                  <button 
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={() => window.print()}
                  >
                    <Download className="h-4 w-4 mr-2 inline" />
                    Download Report
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}