// frontend/app/student/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../utils/supabase';
import Navigation from '../../components/navigation/Navigation';
import { 
  Clock, 
  Calendar, 
  Award, 
  CheckCircle, 
  XCircle, 
  Eye,
  X,
  BarChart3,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Timer,
  Ban
} from 'lucide-react';

interface Course {
  id: string;
  course_name: string;
  course_code: string;
  description?: string;
  board: string;
  class_level: string;
  subject: string;
  teacher_name?: string;
  teacher_email: string;
  enrollment_status: string;
  enrolled_at: string;
  total_quizzes: number;
  completed_quizzes: number;
  average_score: number;
}

interface QuizSummary {
  id: string;
  title: string;
  course_name: string;
  description?: string;
  total_marks: number;
  passing_marks: number;
  time_limit?: number;
  is_published: boolean;
  start_time?: string;
  end_time?: string;
  attempts_allowed: number;
  my_attempts: number;
  best_score?: number;
  status: string; // 'not_started', 'in_progress', 'completed' (based on student's attempts)
  quiz_status_value: string; // 'not_started', 'in_progress', 'time_expired' (based on quiz timing)
}

interface DashboardStats {
  total_courses: number;
  total_quizzes_available: number;
  completed_quizzes: number;
  average_score: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user, profile } = useSupabaseAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<QuizSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_courses: 0,
    total_quizzes_available: 0,
    completed_quizzes: 0,
    average_score: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [joiningCourse, setJoiningCourse] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  
  // New state for quiz modal
  const [showAllQuizzesModal, setShowAllQuizzesModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all'); // 'all', 'available', 'completed', 'expired'

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check if user is a student
  useEffect(() => {
    if (profile && profile.role !== 'student') {
      router.push('/teacher/dashboard'); // Redirect teachers to teacher dashboard
    }
  }, [profile, router]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Get access token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const headers = {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        };

        // Fetch enrolled courses
        const coursesResponse = await fetch(`${API_URL}/api/student/courses/`, {
          headers
        });

        if (!coursesResponse.ok) {
          throw new Error('Failed to fetch courses');
        }

        const coursesData = await coursesResponse.json();
        setCourses(coursesData);

        // Fetch ALL quizzes from all courses (not just recent)
        const allQuizzes: QuizSummary[] = [];
        for (const course of coursesData) {
          try {
            const quizzesResponse = await fetch(`${API_URL}/api/student/courses/${course.id}/quizzes`, {
              headers
            });
            if (quizzesResponse.ok) {
              const quizzes = await quizzesResponse.json();
              allQuizzes.push(...quizzes.map((quiz: QuizSummary) => ({
                ...quiz,
                course_name: course.course_name // Add course name for display
              })));
            }
          } catch (err) {
            console.error(`Error fetching quizzes for course ${course.id}:`, err);
          }
        }

        // Sort by created date or start time
        allQuizzes.sort((a, b) => {
          const dateA = new Date(a.start_time || 0);
          const dateB = new Date(b.start_time || 0);
          return dateB.getTime() - dateA.getTime();
        });

        setAllQuizzes(allQuizzes);

        // Calculate stats
        const totalQuizzesAvailable = allQuizzes.length;
        const completedQuizzes = allQuizzes.filter(quiz => quiz.status === 'completed').length;
        const totalScore = coursesData.reduce((sum: number, course: Course) => 
          sum + course.average_score, 0);
        const averageScore = coursesData.length > 0 ? totalScore / coursesData.length : 0;

        setStats({
          total_courses: coursesData.length,
          total_quizzes_available: totalQuizzesAvailable,
          completed_quizzes: completedQuizzes,
          average_score: averageScore
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleJoinCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim()) return;

    try {
      setJoiningCourse(true);
      setJoinError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(`${API_URL}/api/student/courses/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ course_code: courseCode.trim().toUpperCase() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to join course');
      }

      // Refresh the page to show the new course
      window.location.reload();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setJoiningCourse(false);
    }
  };

  // Helper functions for quiz status
  const getQuizStatusInfo = (quiz: QuizSummary) => {
    // First check quiz timing status
    if (quiz.quiz_status_value === 'not_started') {
      return {
        label: 'Not Started',
        color: 'bg-gray-100 text-gray-800',
        icon: Timer,
        description: 'Quiz will start later'
      };
    }
    
    if (quiz.quiz_status_value === 'time_expired') {
      return {
        label: 'Expired',
        color: 'bg-red-100 text-red-800',
        icon: Ban,
        description: 'Quiz time has ended'
      };
    }

    // If quiz is in valid time window, check student status
    switch (quiz.status) {
      case 'not_started':
        return {
          label: 'Available',
          color: 'bg-blue-100 text-blue-800',
          icon: PlayCircle,
          description: 'Ready to start'
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          color: 'bg-yellow-100 text-yellow-800',
          icon: PauseCircle,
          description: `${quiz.my_attempts}/${quiz.attempts_allowed} attempts used`
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          description: `${quiz.my_attempts}/${quiz.attempts_allowed} attempts used`
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800',
          icon: AlertCircle,
          description: ''
        };
    }
  };

  const isQuizClickable = (quiz: QuizSummary) => {
    // Can click if:
    // 1. Available to attempt (in time window and has attempts left)
    // 2. Completed (to view results)
    return (quiz.quiz_status_value === 'in_progress' && 
            (quiz.status === 'not_started' || (quiz.status === 'in_progress' && quiz.my_attempts < quiz.attempts_allowed))) ||
           quiz.status === 'completed';
  };

  const handleQuizClick = (quiz: QuizSummary) => {
    //router.push(`/student/quiz/${quiz.id}`);
    if (quiz.status === 'completed') {
      // For completed quizzes, we don't have attempt ID here, so go to quiz page
      // The quiz page will show previous attempts
      router.push(`/student/quiz/${quiz.id}`);
    } else if (quiz.quiz_status_value === 'in_progress' && 
               (quiz.status === 'not_started' || (quiz.status === 'in_progress' && quiz.my_attempts < quiz.attempts_allowed))) {
      // For available quizzes, go to take quiz
      router.push(`/student/quiz/${quiz.id}`);
    }
  };

  const getFilteredQuizzes = () => {
    switch (filterStatus) {
      case 'available':
        return allQuizzes.filter(quiz => 
          quiz.quiz_status_value === 'in_progress' && 
          (quiz.status === 'not_started' || (quiz.status === 'in_progress' && quiz.my_attempts < quiz.attempts_allowed))
        );
      case 'completed':
        return allQuizzes.filter(quiz => quiz.status === 'completed');
      case 'expired':
        return allQuizzes.filter(quiz => quiz.quiz_status_value === 'time_expired' || quiz.quiz_status_value === 'not_started');
      default:
        return allQuizzes;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
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
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show available quizzes instead of recent ones
  const availableQuizzes = allQuizzes.filter(quiz => 
    quiz.quiz_status_value === 'in_progress' && 
    (quiz.status === 'not_started' || (quiz.status === 'in_progress' && quiz.my_attempts < quiz.attempts_allowed))
  ).slice(0, 5); // Show only first 5 available quizzes

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <Navigation />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name || 'Student'}!
          </h2>
          <p className="text-gray-600">
            Join courses, take quizzes, and track your learning progress.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_courses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Quizzes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed_quizzes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Quizzes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_quizzes_available}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.average_score.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setShowJoinForm(true)}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-sm font-medium text-gray-600">Join New Course</p>
              </div>
            </button>

            <button
              onClick={() => setShowAllQuizzesModal(true)}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <div className="text-center">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium text-gray-600">Browse All Quizzes</p>
              </div>
            </button>
          </div>
        </div>

        {/* Join Course Modal */}
        {showJoinForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Join a Course</h3>
              <form onSubmit={handleJoinCourse}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter 8-character course code"
                    maxLength={8}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get the course code from your teacher
                  </p>
                </div>
                {joinError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {joinError}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={joiningCourse}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {joiningCourse ? 'Joining...' : 'Join Course'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinForm(false);
                      setCourseCode('');
                      setJoinError(null);
                    }}
                    className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* All Quizzes Modal */}
        {showAllQuizzesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">All Available Quizzes</h3>
                <button
                  onClick={() => setShowAllQuizzesModal(false)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Filter Tabs */}
              <div className="border-b overflow-x-auto">
                <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max">
                  {[
                    { key: 'all', label: 'All Quizzes', count: allQuizzes.length },
                    { key: 'available', label: 'Available', count: allQuizzes.filter(q => q.quiz_status_value === 'in_progress' && (q.status === 'not_started' || (q.status === 'in_progress' && q.my_attempts < q.attempts_allowed))).length },
                    { key: 'completed', label: 'Completed', count: allQuizzes.filter(q => q.status === 'completed').length },
                    { key: 'expired', label: 'Expired/Upcoming', count: allQuizzes.filter(q => q.quiz_status_value === 'time_expired' || q.quiz_status_value === 'not_started').length }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setFilterStatus(tab.key)}
                      className={`py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                        filterStatus === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </nav>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
                {getFilteredQuizzes().length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">No quizzes found</p>
                    <p className="text-gray-400 text-sm">
                      {filterStatus === 'all' ? 'Join courses to access quizzes' : 
                       filterStatus === 'available' ? 'No quizzes available to take right now' :
                       filterStatus === 'completed' ? 'You haven\'t completed any quizzes yet' :
                       'No expired or upcoming quizzes'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getFilteredQuizzes().map((quiz) => {
                      const statusInfo = getQuizStatusInfo(quiz);
                      const Icon = statusInfo.icon;
                      const clickable = isQuizClickable(quiz);
                      
                      return (
                        <div 
                          key={quiz.id}
                          className={`border rounded-lg p-4 transition-colors ${
                            clickable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed opacity-75'
                          }`}
                          onClick={() => clickable && handleQuizClick(quiz)}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3">
                            <div className="flex-1 mb-2 sm:mb-0">
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                                <h4 className="font-semibold text-gray-900">{quiz.title}</h4>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium self-start ${statusInfo.color}`}>
                                  <Icon className="h-3 w-3 mr-1" />
                                  {statusInfo.label}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{quiz.course_name}</p>
                              {quiz.description && (
                                <p className="text-sm text-gray-500 mb-2">{quiz.description}</p>
                              )}
                              <p className="text-xs text-gray-500">{statusInfo.description}</p>
                            </div>
                            
                            <div className="text-left sm:text-right sm:ml-4 flex-shrink-0">
                              <div className="text-sm font-medium text-gray-900">
                                {quiz.total_marks} marks
                              </div>
                              {quiz.best_score !== undefined && (
                                <div className="text-sm text-blue-600">
                                  Best: {quiz.best_score.toFixed(1)}%
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs text-gray-500">
                            <div className="flex items-center">
                              <Award className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">Passing: {quiz.passing_marks}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{quiz.time_limit ? `${quiz.time_limit} min` : 'No limit'}</span>
                            </div>
                            <div className="flex items-center">
                              <BarChart3 className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{quiz.my_attempts}/{quiz.attempts_allowed} attempts</span>
                            </div>
                            {quiz.start_time && (
                              <div className="flex items-center col-span-2 lg:col-span-1">
                                <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{formatDate(quiz.start_time)}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Action button for clickable quizzes */}
                          {clickable && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-600 font-medium">
                                  Click to {quiz.status === 'completed' ? 'view results' : 
                                           quiz.status === 'not_started' ? 'start quiz' : 'continue quiz'}
                                </span>
                                {quiz.status === 'completed' ? (
                                  <Eye className="h-4 w-4 text-green-600" />
                                ) : (
                                  <PlayCircle className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div className="border-t p-4 bg-gray-50">
                <button
                  onClick={() => setShowAllQuizzesModal(false)}
                  className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Courses */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">My Courses</h3>
              <button
                onClick={() => router.push('/student/courses')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {courses.slice(0, 5).map((course) => (
                <div key={course.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1 mb-2 sm:mb-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">{course.course_name}</h4>
                    <p className="text-sm text-gray-600">
                      {course.teacher_name} • {course.board.toUpperCase()} • Class {course.class_level}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {course.completed_quizzes}/{course.total_quizzes} quizzes completed
                    </p>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block mb-1">
                      {course.course_code}
                    </span>
                    <div className="sm:mt-1">
                      <span className="text-sm font-medium text-blue-600">
                        {course.average_score.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No courses joined yet</p>
                  <button
                    onClick={() => setShowJoinForm(true)}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Join your first course
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Available Quizzes */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Available Quizzes</h3>
              <button
                onClick={() => setShowAllQuizzesModal(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {availableQuizzes.map((quiz) => {
                const statusInfo = getQuizStatusInfo(quiz);
                const Icon = statusInfo.icon;
                const clickable = isQuizClickable(quiz);
                
                return (
                  <div 
                    key={quiz.id} 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg transition-colors ${
                      clickable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed opacity-75'
                    }`}
                    onClick={() => clickable && handleQuizClick(quiz)}
                  >
                    <div className="flex-1 mb-2 sm:mb-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">{quiz.title}</h4>
                        <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </div>
                      <p className="text-sm text-gray-600">{quiz.course_name}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {quiz.total_marks} marks • {quiz.time_limit ? `${quiz.time_limit} min` : 'No time limit'}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} mb-1`}>
                        {statusInfo.label}
                      </span>
                      <p className="text-xs text-gray-500">
                        {quiz.my_attempts}/{quiz.attempts_allowed} attempts
                      </p>
                      {quiz.best_score !== undefined && (
                        <p className="text-xs text-blue-600">
                          Best: {quiz.best_score.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {availableQuizzes.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No quizzes available to take right now</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Check back later or join more courses
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}