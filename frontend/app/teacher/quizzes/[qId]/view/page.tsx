// Enhanced Teacher Quiz View Results Page
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
  Zap
} from 'lucide-react';

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
  _stats?: QuizStats; // Embedded stats from backend
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

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check if user is a teacher
  useEffect(() => {
    if (profile && profile.role !== 'teacher') {
      router.push('/');
    }
  }, [profile, router]);

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

      // Fetch quiz details
      const quizResponse = await fetch(`${API_URL}/api/teacher/quizzes/${quizId}`, {
        headers
      });

      if (!quizResponse.ok) {
        throw new Error('Failed to fetch quiz details');
      }

      const quizData = await quizResponse.json();
      setQuiz(quizData);

      // Fetch quiz attempts/results
      const attemptsResponse = await fetch(`${API_URL}/api/teacher/quizzes/${quizId}/results`, {
        headers
      });

      if (attemptsResponse.ok) {
        const attemptsData = await attemptsResponse.json();
        
        if (Array.isArray(attemptsData)) {
          setAttempts(attemptsData);
          
          // Extract stats from first attempt if available
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

  // Auto-refresh for auto-graded quizzes
  useEffect(() => {
    if (quiz?.auto_grade && attempts.length > 0) {
      const ungraded = attempts.some(a => !a.is_auto_graded && a.status === 'completed');
      
      if (ungraded) {
        const interval = setInterval(() => {
          fetchQuizResults();
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
      }
    }
  }, [quiz, attempts]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Memoized sorting
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
                <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
                <p className="text-sm text-gray-600">{quiz.course_name}</p>
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
                <p className="text-2xl font-bold text-gray-900">{quiz.total_questions}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Award className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Marks</p>
                <p className="text-2xl font-bold text-gray-900">{quiz.total_marks}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Time Limit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {quiz.time_limit ? `${quiz.time_limit}m` : 'No limit'}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Passing Marks</p>
                <p className="text-2xl font-bold text-gray-900">{quiz.passing_marks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grading Status Banner */}
        {gradingInfo && gradingInfo.pending > 0 && quiz.auto_grade && (
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
                  Auto-Grading in Progress! ⚡
                </h3>
                <p className="text-blue-800 mb-3">
                  {gradingInfo.pending} submission{gradingInfo.pending !== 1 ? 's are' : ' is'} being automatically graded. 
                  This process ensures fair and consistent evaluation for all students.
                </p>
                <div className="flex items-center space-x-6 text-sm text-blue-700">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                    {gradingInfo.graded} Graded
                  </div>
                  <div className="flex items-center">
                    <Hourglass className="h-4 w-4 mr-1 text-yellow-600 animate-pulse" />
                    {gradingInfo.pending} Processing
                  </div>
                  {gradingInfo.inProgress > 0 && (
                    <div className="flex items-center">
                      <PlayCircle className="h-4 w-4 mr-1 text-blue-600" />
                      {gradingInfo.inProgress} In Progress
                    </div>
                  )}
                </div>
                <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${(gradingInfo.graded / (gradingInfo.graded + gradingInfo.pending)) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
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
          <div className="bg-white rounded-lg shadow-sm border p-12">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-medium text-gray-900 mb-3">Ready for Student Participation! 🚀</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Your quiz is set up and ready to go. Once students start taking the quiz, their results and analytics will appear here.
              </p>
              
              {/* Quiz Status Checklist */}
              <div className="bg-gray-50 rounded-lg p-6 max-w-lg mx-auto">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Quiz Setup Status
                </h4>
                <div className="space-y-3 text-left">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm text-gray-700">
                      Quiz is {quiz.is_published ? 'published and visible' : 'created but not published'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm text-gray-700">
                      {quiz.total_questions} question{quiz.total_questions !== 1 ? 's' : ''} configured
                    </span>
                  </div>
                  <div className="flex items-center">
                    {quiz.auto_grade ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    ) : (
                      <Settings className="h-4 w-4 text-blue-500 mr-3" />
                    )}
                    <span className="text-sm text-gray-700">
                      {quiz.auto_grade ? 'Auto-grading enabled' : 'Manual grading configured'}
                    </span>
                  </div>
                  {quiz.start_time && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-blue-500 mr-3" />
                      <span className="text-sm text-gray-700">
                        Starts: {formatDate(quiz.start_time)}
                      </span>
                    </div>
                  )}
                  {quiz.end_time && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-orange-500 mr-3" />
                      <span className="text-sm text-gray-700">
                        Ends: {formatDate(quiz.end_time)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Encouragement Message */}
              <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2 text-green-800 font-medium">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  <span>Everything looks great!</span>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Your quiz is professionally configured. Students can now start taking it!
                </p>
              </div>

              {/* Action Buttons */}
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
        )}
      </div>
    </div>
  );
}