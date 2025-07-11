// Enhanced Teacher Quiz View Results Page with Manual Grading
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useSupabaseAuth } from '../../../../contexts/SupabaseAuthContext';
import { supabase } from '../../../../utils/supabase';
import Navigation from '../../../../components/navigation/Navigation';
import { 
  ChevronLeft,
  Users,
  Award,
  Clock,
  Calendar,
  BarChart3,
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Brain,
  Hourglass,
  Sparkles,
  RefreshCw,
  MessageSquare,
  Settings,
  PlayCircle,
  PauseCircle,
  Target,
  Zap,
  Timer,
  Power,
  PowerOff,
  Activity,
  StopCircle
} from 'lucide-react';
import { get } from 'http';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  total_marks: number;
  passing_marks: number;
  time_limit?: number;
  is_published: boolean;
  start_time?: string;
  end_time?: string;
  course_name: string;
  total_questions: number;
  attempts_allowed: number;
  auto_grade: boolean;
}

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
  _stats?: QuizStats;
}

interface QuizStats {
  total_attempts: number;
  unique_students: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  pass_rate: number;
  completion_rate: number;
}

export default function QuizViewResults() {
  const router = useRouter();
  const params = useParams();
  const { user, profile } = useSupabaseAuth();
  
  const quizId = params?.qId as string;
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'date'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [refreshing, setRefreshing] = useState(false);
  const [manualGrading, setManualGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<any>(null);
  const [endingQuiz, setEndingQuiz] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check if user is a teacher
  useEffect(() => {
    if (profile && profile.role !== 'teacher') {
      router.push('/');
    }
  }, [profile, router]);

  const getIndiaTime = () => {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const indiaTime = new Date(utcTime + (5.5 * 3600000));
    return indiaTime;
  };

  const parseIndiaDateTime = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const utcTime = date.getTime() - (5.5 * 3600000);
    return new Date(utcTime);
  };

  const getQuizState = () => {
    if (!quiz) return 'unknown';
    
    const now = getIndiaTime();
    const startTime = quiz.start_time ? parseIndiaDateTime(quiz.start_time) : null;
    const endTime = quiz.end_time ? parseIndiaDateTime(quiz.end_time) : null;

    if (!quiz.is_published) {
      return 'not_published';
    } else if (startTime && now < startTime) {
      return 'not_started';
    } else if (endTime && now > endTime) {
      return 'ended';
    } else {
      return 'active';
    }
  };

  // Manual grading function
  const handleManualGrading = async () => {
    if (!user || !quizId) return;
    
    try {
      setManualGrading(true);
      setGradingResult(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(`${API_URL}/api/teacher/quizzes/${quizId}/trigger-grading`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to trigger grading');
      }

      const result = await response.json();
      setGradingResult(result);
      
      // Refresh the quiz results after grading
      setTimeout(() => {
        fetchQuizResults();
      }, 2000);
      
    } catch (error) {
      console.error('Error triggering manual grading:', error);
      setGradingResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to trigger auto-grading'
      });
    } finally {
      setManualGrading(false);
    }
  };

  const fetchQuizResults = async (showRefreshing = false) => {
    if (!user || !quizId) return;

    try {
      if (showRefreshing) setRefreshing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };

      const quizResponse = await fetch(`${API_URL}/api/teacher/quizzes/${quizId}`, {
        headers
      });

      if (!quizResponse.ok) {
        throw new Error('Failed to fetch quiz details');
      }

      const quizData = await quizResponse.json();
      setQuiz(quizData);

      const attemptsResponse = await fetch(`${API_URL}/api/teacher/quizzes/${quizId}/results`, {
        headers
      });

      if (attemptsResponse.ok) {
        const attemptsData = await attemptsResponse.json();
        
        if (Array.isArray(attemptsData)) {
          setAttempts(attemptsData);
          
          if (attemptsData.length > 0 && attemptsData[0]._stats) {
            setStats(attemptsData[0]._stats);
          } else {
            setStats(null);
          }
        } else {
          setAttempts([]);
          setStats(null);
        }
      } else if (attemptsResponse.status === 404) {
        setAttempts([]);
        setStats(null);
      } else {
        throw new Error(`Failed to fetch quiz results: ${attemptsResponse.status}`);
      }

    } catch (err) {
      console.error('Error fetching quiz results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quiz results');
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuizResults();
  }, [user, quizId, API_URL]);

  useEffect(() => {
    if (quiz?.auto_grade && attempts.length > 0) {
      const ungraded = attempts.some(a => !a.is_auto_graded && a.status === 'completed');
      
      if (ungraded) {
        const interval = setInterval(() => {
          fetchQuizResults();
        }, 30000);

        return () => clearInterval(interval);
      }
    }
  }, [quiz, attempts]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const utcTime = date.getTime() - (5.5 * 3600000);
    return new Date(utcTime).toLocaleString();
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getScoreColor = (percentage: number, passingMarks: number) => {
    const passingPercentage = (passingMarks / (quiz?.total_marks || 100)) * 100;
    if (percentage >= passingPercentage) return 'text-green-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number, passingMarks: number) => {
    const passingPercentage = (passingMarks / (quiz?.total_marks || 100)) * 100;
    if (percentage >= passingPercentage) return 'bg-green-100';
    return 'bg-red-100';
  };

  const getGradingStatusInfo = () => {
    if (!attempts.length) return null;
    
    const completed = attempts.filter(a => a.status === 'completed');
    const graded = completed.filter(a => a.is_auto_graded || a.teacher_reviewed);
    const pending = completed.filter(a => !a.is_auto_graded && !a.teacher_reviewed);
    
    return {
      total: attempts.length,
      completed: completed.length,
      graded: graded.length,
      pending: pending.length,
      inProgress: attempts.filter(a => a.status === 'in_progress').length
    };
  };

  const gradingInfo = getGradingStatusInfo();
  const quizState = getQuizState();

  const sortedAttempts = React.useMemo(() => {
    if (!Array.isArray(attempts) || attempts.length === 0) {
      return [];
    }
    
    return [...attempts].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.student_name || '').localeCompare(b.student_name || '');
          break;
        case 'score':
          comparison = (a.percentage || 0) - (b.percentage || 0);
          break;
        case 'date':
          const dateA = new Date(a.submitted_at || a.started_at).getTime();
          const dateB = new Date(b.submitted_at || b.started_at).getTime();
          comparison = dateA - dateB;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [attempts, sortBy, sortOrder]);

  const handleSort = (newSortBy: 'name' | 'score' | 'date') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const handleRefresh = () => {
    fetchQuizResults(true);
  };

  // Handle ending quiz
  const handleEndQuiz = async () => {
    if (!user || !quizId) return;
    
    // Confirm action
    if (!confirm('Are you sure you want to end this quiz? Students will no longer be able to take it.')) {
      return;
    }
    
    try {
      setEndingQuiz(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(`${API_URL}/api/teacher/quizzes/${quizId}/end`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to end quiz');
      }

      // Refresh the quiz data after successfully ending
      await fetchQuizResults(true);
      
    } catch (error) {
      console.error('Error ending quiz:', error);
      alert(error instanceof Error ? error.message : 'Failed to end quiz');
    } finally {
      setEndingQuiz(false);
    }
  };

  const getTimeToStart = () => {
    if (!quiz?.start_time) return null;
    const now = getIndiaTime();
    const startTime = new Date(quiz.start_time);
    const diff = startTime.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const renderNoAttemptsContent = () => {
    switch (quizState) {
      case 'not_published':
        return (
          <div className="bg-white rounded-lg shadow-sm border p-12">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                <PowerOff className="h-10 w-10 text-gray-500" />
              </div>
              <h3 className="text-2xl font-medium text-gray-900 mb-3">Quiz Not Published</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                This quiz is created but not published yet. Students won't be able to see or take this quiz until you publish it.
              </p>
              
              <div className="bg-yellow-50 rounded-lg p-6 max-w-lg mx-auto mb-8">
                <div className="flex items-center justify-center space-x-2 text-yellow-800 font-medium mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span>Ready to Publish?</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Make sure your quiz is completely configured before publishing. Once published, students will be able to access it.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push(`/teacher/quizzes/${quizId}/edit`)}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2 inline" />
                  Edit & Publish Quiz
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 inline ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh Status
                </button>
              </div>
            </div>
          </div>
        );

      case 'not_started':
        const timeToStart = getTimeToStart();
        return (
          <div className="bg-white rounded-lg shadow-sm border p-12">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                <Timer className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-medium text-gray-900 mb-3">Quiz Starting Soon! ⏰</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Your quiz is published and ready, but hasn't started yet. Students will be able to take it once the start time arrives.
              </p>
              
              <div className="bg-blue-50 rounded-lg p-6 max-w-lg mx-auto mb-8">
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2 text-blue-800 font-medium">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span>Scheduled Start</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-900">
                    {quiz?.start_time ? formatDate(quiz.start_time) : 'Not scheduled'}
                  </p>
                  {timeToStart && (
                    <p className="text-sm text-blue-700">
                      Starting in: <span className="font-medium">{timeToStart}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 max-w-md mx-auto mb-8">
                <div className="flex items-center justify-center space-x-2 text-green-800 font-medium">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>All Systems Ready!</span>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Quiz is published and configured. Students can see it but can't start until the scheduled time.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push(`/teacher/quizzes/${quizId}/edit`)}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2 inline" />
                  Edit Quiz Settings
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 inline ${refreshing ? 'animate-spin' : ''}`} />
                  Check Status
                </button>
              </div>
            </div>
          </div>
        );

      case 'active':
        const hasActiveTimeRestrictions = quiz?.start_time || quiz?.end_time;
        return (
          <div className="bg-white rounded-lg shadow-sm border p-12">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                <Activity className="h-10 w-10 text-green-600 animate-pulse" />
              </div>
              <h3 className="text-2xl font-medium text-gray-900 mb-3">
                {hasActiveTimeRestrictions ? 'Quiz is Live! 🎯' : 'Quiz is Always Available! 🎯'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {hasActiveTimeRestrictions ? 
                  'Your quiz is currently active and students can take it. Results will appear here as students complete their attempts.' :
                  'Your quiz is published with no time restrictions. Students can take it anytime. Results will appear here as students complete their attempts.'
                }
              </p>
              
              <div className="bg-green-50 rounded-lg p-6 max-w-lg mx-auto mb-8">
                <div className="flex items-center justify-center space-x-2 text-green-800 font-medium mb-4">
                  <Power className="h-5 w-5 text-green-600" />
                  <span>{hasActiveTimeRestrictions ? 'Currently Active' : 'Always Available'}</span>
                </div>
                <div className="space-y-2 text-left">
                  {quiz?.start_time ? (
                    <div className="flex items-center text-sm text-green-700">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Started: {formatDate(quiz.start_time)}
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-green-700">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      No start time restriction
                    </div>
                  )}
                  {quiz?.end_time ? (
                    <div className="flex items-center text-sm text-green-700">
                      <PauseCircle className="h-4 w-4 mr-2" />
                      Ends: {formatDate(quiz.end_time)}
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-green-700">
                      <PauseCircle className="h-4 w-4 mr-2" />
                      No end time restriction
                    </div>
                  )}
                  <div className="flex items-center text-sm text-green-700">
                    <Target className="h-4 w-4 mr-2" />
                    {quiz?.total_questions || 0} questions, {quiz?.total_marks || 0} marks
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto mb-8">
                <div className="flex items-center justify-center space-x-2 text-blue-800 font-medium">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span>Monitoring Active</span>
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  This page will automatically update as students submit their attempts. No action needed!
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 inline ${refreshing ? 'animate-spin' : ''}`} />
                  Check for New Attempts
                </button>
              </div>
            </div>
          </div>
        );

      case 'ended':
        return (
          <div className="bg-white rounded-lg shadow-sm border p-12">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-medium text-gray-900 mb-3">Quiz Completed! 🎉</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                The quiz has ended successfully. Unfortunately, no students took this quiz during the active period.
              </p>
              
              <div className="bg-purple-50 rounded-lg p-6 max-w-lg mx-auto mb-8">
                <div className="flex items-center justify-center space-x-2 text-purple-800 font-medium mb-4">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span>Quiz Timeline</span>
                </div>
                <div className="space-y-2 text-left text-sm">
                  {quiz?.start_time && (
                    <div className="flex items-center text-purple-700">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Started: {formatDate(quiz.start_time)}
                    </div>
                  )}
                  {quiz?.end_time && (
                    <div className="flex items-center text-purple-700">
                      <PauseCircle className="h-4 w-4 mr-2" />
                      Ended: {formatDate(quiz.end_time)}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto mb-8">
                <div className="flex items-center justify-center space-x-2 text-blue-800 font-medium">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <span>What's Next?</span>
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  Consider reviewing the quiz setup or scheduling a new quiz session for better student participation.
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 inline ${refreshing ? 'animate-spin' : ''}`} />
                  Final Check
                </button>
              </div>
            </div>
          </div>
        );

      default:
        const hasTimeRestrictions = quiz?.start_time || quiz?.end_time;
        return (
          <div className="bg-white rounded-lg shadow-sm border p-12">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-medium text-gray-900 mb-3">Ready for Student Participation! 🚀</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Your quiz is set up and ready to go. Once students start taking the quiz, their results and analytics will appear here.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 max-w-lg mx-auto">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Quiz Setup Status
                </h4>
                <div className="space-y-3 text-left">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm text-gray-700">
                      Quiz is {quiz?.is_published ? 'published and visible' : 'created but not published'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm text-gray-700">
                      {quiz?.total_questions || 0} question{(quiz?.total_questions || 0) !== 1 ? 's' : ''} configured
                    </span>
                  </div>
                  <div className="flex items-center">
                    {quiz?.auto_grade ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    ) : (
                      <Settings className="h-4 w-4 text-blue-500 mr-3" />
                    )}
                    <span className="text-sm text-gray-700">
                      {quiz?.auto_grade ? 'Auto-grading enabled' : 'Manual grading configured'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {hasTimeRestrictions ? (
                      <Calendar className="h-4 w-4 text-blue-500 mr-3" />
                    ) : (
                      <Clock className="h-4 w-4 text-green-500 mr-3" />
                    )}
                    <span className="text-sm text-gray-700">
                      {hasTimeRestrictions ? 'Time restrictions configured' : 'Available anytime (no time restrictions)'}
                    </span>
                  </div>
                  {quiz?.start_time && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-blue-500 mr-3" />
                      <span className="text-sm text-gray-700">
                        Starts: {formatDate(quiz.start_time)}
                      </span>
                    </div>
                  )}
                  {quiz?.end_time && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-orange-500 mr-3" />
                      <span className="text-sm text-gray-700">
                        Ends: {formatDate(quiz.end_time)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push(`/teacher/quizzes/${quizId}/edit`)}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2 inline" />
                  Edit Quiz Settings
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 inline ${refreshing ? 'animate-spin' : ''}`} />
                  Check for New Attempts
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading quiz results...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Results</h2>
          <p className="text-gray-600 mb-4">{error || 'Quiz not found'}</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{quiz?.title || 'Loading...'}</h1>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-600">{quiz?.course_name || ''}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    quizState === 'active' ? 'bg-green-100 text-green-800' :
                    quizState === 'not_started' ? 'bg-blue-100 text-blue-800' :
                    quizState === 'ended' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {quizState === 'active' ? (quiz?.start_time || quiz?.end_time ? 'Live' : 'Available') :
                     quizState === 'not_started' ? 'Scheduled' :
                     quizState === 'ended' ? 'Completed' :
                     quizState === 'not_published' ? 'Draft' : 'Ready'}
                  </span>
                  {/* End Quiz Button - moved here beside availability text */}
                  {quizState === 'active' && (
                    <button
                      onClick={handleEndQuiz}
                      disabled={endingQuiz}
                      className="flex items-center px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                      title="End this quiz immediately"
                    >
                      {endingQuiz ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Ending...
                        </>
                      ) : (
                        <>
                          <StopCircle className="w-3 h-3 mr-1" />
                          End Quiz
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                title="Refresh results"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Navigation />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quiz Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Questions</p>
                <p className="text-2xl font-bold text-gray-900">{quiz?.total_questions || 0}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Award className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Marks</p>
                <p className="text-2xl font-bold text-gray-900">{quiz?.total_marks || 0}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Time Limit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {quiz?.time_limit ? `${quiz.time_limit}m` : 'No limit'}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Passing Marks</p>
                <p className="text-2xl font-bold text-gray-900">{quiz?.passing_marks || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Grading Status Banner with Manual Trigger */}
        {gradingInfo && gradingInfo.pending > 0 && quiz?.auto_grade && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Brain className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-blue-600" />
                  Auto-Grading Available! ⚡
                </h3>
                <p className="text-blue-800 mb-3">
                  {gradingInfo.pending} submission{gradingInfo.pending !== 1 ? 's are' : ' is'} ready for automatic grading. 
                  You can trigger the grading process manually or wait for the scheduled auto-grading.
                </p>
                <div className="flex items-center space-x-6 text-sm text-blue-700 mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                    {gradingInfo.graded} Graded
                  </div>
                  <div className="flex items-center">
                    <Hourglass className="h-4 w-4 mr-1 text-yellow-600" />
                    {gradingInfo.pending} Pending
                  </div>
                  {gradingInfo.inProgress > 0 && (
                    <div className="flex items-center">
                      <PlayCircle className="h-4 w-4 mr-1 text-blue-600" />
                      {gradingInfo.inProgress} In Progress
                    </div>
                  )}
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${(gradingInfo.graded / (gradingInfo.graded + gradingInfo.pending)) * 100}%` 
                    }}
                  ></div>
                </div>
                
                {/* Manual Grading Result Display */}
                {gradingResult && (
                  <div className={`mb-4 p-4 rounded-lg ${
                    gradingResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {gradingResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className={`font-medium ${gradingResult.success ? 'text-green-800' : 'text-red-800'}`}>
                          {gradingResult.success ? 'Grading Completed!' : 'Grading Failed'}
                        </p>
                        <p className={`text-sm ${gradingResult.success ? 'text-green-700' : 'text-red-700'}`}>
                          {gradingResult.message}
                        </p>
                        {gradingResult.success && gradingResult.graded_submissions > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            ✅ {gradingResult.graded_submissions} submission{gradingResult.graded_submissions !== 1 ? 's' : ''} graded
                            {gradingResult.total_tokens > 0 && ` • ${gradingResult.total_tokens} AI tokens used`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 space-y-2">
                <button
                  onClick={handleManualGrading}
                  disabled={manualGrading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {manualGrading ? (
                    <>
                      <Hourglass className="h-4 w-4 mr-2 inline animate-pulse" />
                      Grading...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2 inline" />
                      Force Grade Now
                    </>
                  )}
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing || manualGrading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 inline ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Checking...' : 'Check Status'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics and Results */}
        {stats && attempts.length > 0 ? (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_attempts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.average_score.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <Target className="h-8 w-8 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pass_rate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-purple-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unique Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.unique_students}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Results Table */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 mb-4 sm:mb-0">Student Results</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Sort by:</span>
                      <button
                        onClick={() => handleSort('name')}
                        className={`text-sm px-3 py-1 rounded transition-colors ${
                          sortBy === 'name' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => handleSort('score')}
                        className={`text-sm px-3 py-1 rounded transition-colors ${
                          sortBy === 'score' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Score {sortBy === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => handleSort('date')}
                        className={`text-sm px-3 py-1 rounded transition-colors ${
                          sortBy === 'date' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  <Eye className="h-4 w-4 inline mr-1" />
                  Click on any row to view detailed results
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attempt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Taken
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedAttempts.map((attempt) => (
                      <tr 
                        key={attempt.id} 
                        className="hover:bg-blue-50 transition-colors cursor-pointer group"
                        onClick={() => router.push(`/teacher/quizzes/${quizId}/${attempt.student_id}/${attempt.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                              {attempt.student_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {attempt.student_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {attempt.is_auto_graded || attempt.teacher_reviewed ? (
                              <>
                                <div className={`text-sm font-medium ${getScoreColor(attempt.percentage, quiz.passing_marks)}`}>
                                  {attempt.obtained_marks}/{attempt.total_marks}
                                </div>
                                <div className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  getScoreBgColor(attempt.percentage, quiz.passing_marks)
                                } ${getScoreColor(attempt.percentage, quiz.passing_marks)}`}>
                                  {attempt.percentage.toFixed(1)}%
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center">
                                <Hourglass className="h-4 w-4 text-yellow-500 mr-2 animate-pulse" />
                                <span className="text-sm text-yellow-700 font-medium">Grading...</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{attempt.attempt_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDuration(attempt.time_taken)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attempt.submitted_at ? formatDate(attempt.submitted_at) : 'In Progress'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                              attempt.status === 'completed' ? 'bg-green-100 text-green-800' :
                              attempt.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {attempt.status === 'completed' ? 'Completed' :
                               attempt.status === 'in_progress' ? 'In Progress' :
                               attempt.status}
                            </span>
                            {attempt.is_auto_graded && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                <Brain className="h-3 w-3 mr-1" />
                                AI
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center text-blue-600 group-hover:text-blue-800">
                            <Eye className="h-4 w-4 mr-1" />
                            <span className="font-medium">View Details</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* No Attempts Message */
          renderNoAttemptsContent()
        )}
      </div>
    </div>
  );
}