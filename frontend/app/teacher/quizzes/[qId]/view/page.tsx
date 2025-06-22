// frontend/app/teacher/quizzes/[qId]/view/page.tsx
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
  Eye
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

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check if user is a teacher
  useEffect(() => {
    if (profile && profile.role !== 'teacher') {
      router.push('/');
    }
  }, [profile, router]);

  useEffect(() => {
    const fetchQuizResults = async () => {
      if (!user || !quizId) return;

      try {
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
          setAttempts(attemptsData.attempts || []);
          setStats(attemptsData.stats || null);
        } else {
          // If the endpoint doesn't exist, we'll still show the quiz with no attempts
          setAttempts([]);
          setStats(null);
        }

      } catch (err) {
        console.error('Error fetching quiz results:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quiz results');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResults();
  }, [user, quizId]);

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

  const sortedAttempts = [...attempts].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.student_name.localeCompare(b.student_name);
        break;
      case 'score':
        comparison = a.percentage - b.percentage;
        break;
      case 'date':
        comparison = new Date(a.submitted_at || a.started_at).getTime() - 
                    new Date(b.submitted_at || b.started_at).getTime();
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (newSortBy: 'name' | 'score' | 'date') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
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
                <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
                <p className="text-sm text-gray-600">{quiz.course_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
              </div>
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
                  <Award className="h-8 w-8 text-yellow-500 mr-3" />
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

            {/* Student Results */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 mb-4 sm:mb-0">Student Results</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Sort by:</span>
                      <button
                        onClick={() => handleSort('name')}
                        className={`text-sm px-3 py-1 rounded ${
                          sortBy === 'name' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => handleSort('score')}
                        className={`text-sm px-3 py-1 rounded ${
                          sortBy === 'score' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Score {sortBy === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                      <button
                        onClick={() => handleSort('date')}
                        className={`text-sm px-3 py-1 rounded ${
                          sortBy === 'date' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                    </div>
                  </div>
                </div>
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedAttempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {attempt.student_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {attempt.student_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`text-sm font-medium ${getScoreColor(attempt.percentage, quiz.passing_marks)}`}>
                              {attempt.obtained_marks}/{attempt.total_marks}
                            </div>
                            <div className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getScoreBgColor(attempt.percentage, quiz.passing_marks)
                            } ${getScoreColor(attempt.percentage, quiz.passing_marks)}`}>
                              {attempt.percentage.toFixed(1)}%
                            </div>
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            attempt.status === 'completed' ? 'bg-green-100 text-green-800' :
                            attempt.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {attempt.status === 'completed' ? 'Completed' :
                             attempt.status === 'in_progress' ? 'In Progress' :
                             attempt.status}
                          </span>
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
              <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Attempts Yet</h3>
              <p className="text-gray-600 mb-6">
                Students haven't started taking this quiz yet. Once they begin, their results will appear here.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Make sure the quiz is published</p>
                <p>• Check if the start time has passed</p>
                <p>• Verify students are enrolled in the course</p>
                <p>• Share the quiz link with your students</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}