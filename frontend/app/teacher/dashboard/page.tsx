// frontend/app/teacher/dashboard/page.tsx
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
  Edit,
  Lock,
  FileText,
  Users,
  BookOpen
} from 'lucide-react';

interface Course {
  id: string;
  course_name: string;
  course_code: string;
  description?: string;
  board: string;
  class_level: string;
  subject: string;
  is_active: boolean;
  max_students: number;
  current_students: number;
  total_quizzes: number;
  created_at: string;
}

interface Quiz {
  id: string;
  course_id: string;
  course_name: string;
  title: string;
  description?: string;
  total_marks: number;
  passing_marks: number;
  is_published: boolean;
  total_questions: number;
  total_attempts: number;
  average_score?: number;
  start_time?: string;
  end_time?: string;
  created_at: string;
}

interface DashboardStats {
  total_courses: number;
  total_students: number;
  total_quizzes: number;
  active_courses: number;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, profile } = useSupabaseAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_courses: 0,
    total_students: 0,
    total_quizzes: 0,
    active_courses: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New state for quiz modal
  const [showAllQuizzesModal, setShowAllQuizzesModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all'); // 'all', 'draft', 'published'
  const [filterCourse, setFilterCourse] = useState<string>('all'); // 'all' or course_id

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check if user is a teacher
  useEffect(() => {
    if (profile && profile.role !== 'teacher') {
      router.push('/student/dashboard'); // Redirect non-teachers
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

        // Fetch courses
        const coursesResponse = await fetch(`${API_URL}/api/teacher/courses/`, {
          headers
        });

        if (!coursesResponse.ok) {
          throw new Error('Failed to fetch courses');
        }

        const coursesData = await coursesResponse.json();
        setCourses(coursesData);

        // Fetch ALL quizzes
        const quizzesResponse = await fetch(`${API_URL}/api/teacher/quizzes/`, {
          headers
        });

        if (!quizzesResponse.ok) {
          throw new Error('Failed to fetch quizzes');
        }

        const quizzesData = await quizzesResponse.json();
        setAllQuizzes(quizzesData);

        // Calculate stats
        const totalStudents = coursesData.reduce((sum: number, course: Course) => 
          sum + course.current_students, 0);
        const activeCourses = coursesData.filter((course: Course) => course.is_active).length;

        setStats({
          total_courses: coursesData.length,
          total_students: totalStudents,
          total_quizzes: quizzesData.length,
          active_courses: activeCourses
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

  // Helper functions for Indian timezone
  const getIndiaTime = () => {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const indiaTime = new Date(utcTime + (5.5 * 3600000)); // UTC+5:30
    return indiaTime;
  };

  const parseIndiaDateTime = (dateString: string) => {
    if (!dateString) return null;
    
    // If the string already has timezone info, use it directly
    if (dateString.includes('T') && (dateString.includes('Z') || dateString.includes('+'))) {
      return new Date(dateString);
    }
    
    // If it's a naive datetime string, assume it's in India timezone
    const date = new Date(dateString);
    // Adjust for India timezone (subtract 5.5 hours to get UTC, then let browser handle local display)
    const utcTime = date.getTime() - (5.5 * 3600000);
    return new Date(utcTime);
  };

  // Helper functions for quiz status
  const getQuizStatusInfo = (quiz: Quiz) => {
    const now = getIndiaTime();
    const startTime = quiz.start_time ? parseIndiaDateTime(quiz.start_time) : null;
    const endTime = quiz.end_time ? parseIndiaDateTime(quiz.end_time) : null;

    if (!quiz.is_published) {
      return {
        label: 'Draft',
        color: 'bg-gray-100 text-gray-800',
        icon: FileText,
        description: 'Not published yet',
        canEdit: true
      };
    }

    // Published quiz
    if (startTime && startTime > now) {
      return {
        label: 'Scheduled',
        color: 'bg-blue-100 text-blue-800',
        icon: Clock,
        description: 'Published, will start later',
        canEdit: true
      };
    }

    if (endTime &&  endTime < now) {
      return {
        label: 'Completed',
        color: 'bg-orange-200 text-gray-800',
        icon: XCircle,
        description: 'Quiz has ended',
        canEdit: false
      };
    }

    return {
      label: 'Active',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      description: 'Published and active',
      canEdit: false
    };
  };

  const handleQuizClick = (quiz: Quiz) => {
    const statusInfo = getQuizStatusInfo(quiz);
    if (statusInfo.canEdit) {
      router.push(`/teacher/quizzes/${quiz.id}/edit`);
    }
  };

  const getFilteredQuizzes = () => {
    let filtered = allQuizzes;

    // Filter by status
    if (filterStatus === 'draft') {
      filtered = filtered.filter(quiz => !quiz.is_published);
    } else if (filterStatus === 'published') {
      filtered = filtered.filter(quiz => quiz.is_published);
    }

    // Filter by course
    if (filterCourse !== 'all') {
      filtered = filtered.filter(quiz => quiz.course_id === filterCourse);
    }

    return filtered;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = parseIndiaDateTime(dateString);
    if (!date) return '';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
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

  // Show draft quizzes and editable published quizzes
  const editableQuizzes = allQuizzes.filter(quiz => {
    const statusInfo = getQuizStatusInfo(quiz);
    return statusInfo.canEdit;
  }).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <Navigation />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.full_name || 'Teacher'}!
          </h2>
          <p className="text-gray-600">
            Manage your courses, create quizzes, and track student progress.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_courses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_students}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Quizzes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_quizzes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_courses}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/teacher/courses/create')}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="text-center">
                <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Create New Course</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/teacher/quizzes/create')}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <div className="text-center">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Create New Quiz</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/teacher/questions/browse')}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              <div className="text-center">
                <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Browse Questions</p>
              </div>
            </button>
          </div>
        </div>

        {/* All Quizzes Modal */}
        {showAllQuizzesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">All Quizzes</h3>
                <button
                  onClick={() => setShowAllQuizzesModal(false)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Filters */}
              <div className="border-b p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Quizzes ({allQuizzes.length})</option>
                      <option value="draft">Draft ({allQuizzes.filter(q => !q.is_published).length})</option>
                      <option value="published">Published ({allQuizzes.filter(q => q.is_published).length})</option>
                    </select>
                  </div>

                  {/* Course Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                    <select
                      value={filterCourse}
                      onChange={(e) => setFilterCourse(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Courses</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_name} ({course.course_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
                {getFilteredQuizzes().length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">No quizzes found</p>
                    <p className="text-gray-400 text-sm">
                      {filterStatus === 'draft' ? 'No draft quizzes found' :
                       filterStatus === 'published' ? 'No published quizzes found' :
                       'Create your first quiz to get started'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getFilteredQuizzes().map((quiz) => {
                      const statusInfo = getQuizStatusInfo(quiz);
                      const Icon = statusInfo.icon;
                      
                      return (
                        <div 
                          key={quiz.id}
                          className={`border rounded-lg p-4 transition-colors ${
                            statusInfo.canEdit ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed opacity-75'
                          }`}
                          onClick={() => statusInfo.canEdit && handleQuizClick(quiz)}
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
                                {quiz.total_questions} questions
                              </div>
                              <div className="text-sm text-gray-600">
                                {quiz.total_marks} marks
                              </div>
                              {quiz.total_attempts > 0 && (
                                <div className="text-sm text-blue-600">
                                  {quiz.total_attempts} attempts
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
                              <BarChart3 className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{quiz.total_attempts} attempts</span>
                            </div>
                            {quiz.start_time && (
                              <div className="flex items-center col-span-2 lg:col-span-1">
                                <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">Start: {formatDate(quiz.start_time)}</span>
                              </div>
                            )}
                            {quiz.average_score != null && (
                              <div className="flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">Avg: {quiz.average_score.toFixed(1)}%</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Action button for editable quizzes */}
                          {statusInfo.canEdit && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-600 font-medium">
                                  Click to edit quiz
                                </span>
                                <Edit className="h-4 w-4 text-green-600" />
                              </div>
                            </div>
                          )}

                          {/* Lock indicator for non-editable quizzes */}
                          {!statusInfo.canEdit && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-medium">
                                  Quiz is active - editing disabled
                                </span>
                                <Lock className="h-4 w-4 text-gray-500" />
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
          {/* Recent Courses */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Courses</h3>
              <button
                onClick={() => router.push('/teacher/courses')}
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
                      {course.board.toUpperCase()} • Class {course.class_level} • {course.subject}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {course.current_students} students • {course.total_quizzes} quizzes
                    </p>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block mb-1">
                      {course.course_code}
                    </span>
                    <div className="sm:mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        course.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {course.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No courses yet</p>
                  <button
                    onClick={() => router.push('/teacher/courses/create')}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Create your first course
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Editable Quizzes */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Editable Quizzes</h3>
              <button
                onClick={() => setShowAllQuizzesModal(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {editableQuizzes.map((quiz) => {
                const statusInfo = getQuizStatusInfo(quiz);
                const Icon = statusInfo.icon;
                
                return (
                  <div 
                    key={quiz.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleQuizClick(quiz)}
                  >
                    <div className="flex-1 mb-2 sm:mb-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">{quiz.title}</h4>
                        <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </div>
                      <p className="text-sm text-gray-600">{quiz.course_name}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {quiz.total_questions} questions • {quiz.total_marks} marks
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} mb-1`}>
                        {statusInfo.label}
                      </span>
                      <p className="text-xs text-gray-500">
                        {quiz.total_attempts} attempts
                      </p>
                      {quiz.average_score != null && (
                        <p className="text-xs text-blue-600">
                          Avg: {quiz.average_score.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {editableQuizzes.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No editable quizzes</p>
                  <p className="text-xs text-gray-400 mt-1">
                    All quizzes are either active or you have no quizzes yet
                  </p>
                  <button
                    onClick={() => router.push('/teacher/quizzes/create')}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Create your first quiz
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}