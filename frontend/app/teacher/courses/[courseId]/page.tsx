// frontend/app/teacher/courses/[courseId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import { supabase } from '../../../utils/supabase';
import Navigation from '../../../components/navigation/Navigation';
import { 
  ArrowLeft,
  Users,
  FileText,
  Settings,
  Plus,
  Eye,
  Edit,
  UserPlus,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Award,
  BarChart3,
  School,
  GraduationCap,
  BookOpen,
  Mail,
  MoreVertical,
  Trash2
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

interface Student {
  id: string;
  full_name: string;
  email: string;
  enrollment_date: string;
  status: string;
  total_quizzes_taken: number;
  average_score: number;
}

interface Quiz {
  id: string;
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

interface CourseStats {
  total_students: number;
  active_students: number;
  total_quizzes: number;
  published_quizzes: number;
  total_attempts: number;
  average_class_score: number;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useSupabaseAuth();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'quizzes' | 'settings'>('overview');
  const [copiedCode, setCopiedCode] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (profile && profile.role !== 'teacher') {
      router.push('/student/dashboard');
    }
  }, [profile, router]);

  useEffect(() => {
    const loadCourseData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Try to get course data from sessionStorage first (passed from parent)
        const storedCourseData = sessionStorage.getItem('courseData');
        if (storedCourseData) {
          const courseData = JSON.parse(storedCourseData);
          if (courseData.id === courseId) {
            setCourse(courseData);
            // Clear the stored data
            sessionStorage.removeItem('courseData');
          }
        }

        // Get access token for API calls
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const headers = {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        };

        // If we don't have course data, fetch it
        if (!course) {
          const courseResponse = await fetch(`${API_URL}/api/teacher/courses/${courseId}`, {
            headers
          });

          if (!courseResponse.ok) {
            throw new Error('Failed to fetch course details');
          }

          const courseData = await courseResponse.json();
          setCourse(courseData);
        }

        // Fetch students
        const studentsResponse = await fetch(`${API_URL}/api/teacher/courses/${courseId}/students`, {
          headers
        });

        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          setStudents(studentsData);
        }

        // Fetch course quizzes
        const quizzesResponse = await fetch(`${API_URL}/api/teacher/quizzes/?course_id=${courseId}`, {
          headers
        });

        if (quizzesResponse.ok) {
          const quizzesData = await quizzesResponse.json();
          setQuizzes(quizzesData);
        }

        // Calculate stats from available data
        const courseStats: CourseStats = {
          total_students: students.length,
          active_students: students.filter(s => s.status === 'active').length,
          total_quizzes: quizzes.length,
          published_quizzes: quizzes.filter(q => q.is_published).length,
          total_attempts: quizzes.reduce((sum, q) => sum + q.total_attempts, 0),
          average_class_score: students.length > 0 
            ? students.reduce((sum, s) => sum + s.average_score, 0) / students.length 
            : 0
        };
        setStats(courseStats);

      } catch (err) {
        console.error('Error loading course data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [user, courseId, course]);

  const handleCopyCode = () => {
    if (course) {
      navigator.clipboard.writeText(course.course_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getQuizStatusInfo = (quiz: Quiz) => {
    const now = new Date();
    const startTime = quiz.start_time ? new Date(quiz.start_time) : null;
    const endTime = quiz.end_time ? new Date(quiz.end_time) : null;

    if (!quiz.is_published) {
      return {
        label: 'Draft',
        color: 'bg-gray-100 text-gray-800',
        icon: FileText
      };
    }

    if (startTime && startTime > now) {
      return {
        label: 'Scheduled',
        color: 'bg-blue-100 text-blue-800',
        icon: Clock
      };
    }

    if (endTime && endTime < now) {
      return {
        label: 'Completed',
        color: 'bg-gray-100 text-gray-800',
        icon: XCircle
      };
    }

    return {
      label: 'Active',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-32 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Course not found'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
          >
            Go Back
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Course Details</h1>
            </div>
            <Navigation />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between">
            <div className="flex-1 mb-4 lg:mb-0">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-900">{course.course_name}</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  course.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {course.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center space-x-1">
                  <School className="h-4 w-4" />
                  <span>{course.board.toUpperCase()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <GraduationCap className="h-4 w-4" />
                  <span>Class {course.class_level}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.subject}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(course.created_at)}</span>
                </div>
              </div>

              {course.description && (
                <p className="text-gray-700 mb-4">{course.description}</p>
              )}

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Course Code:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                  {course.course_code}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Copy course code"
                >
                  {copiedCode ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push(`/teacher/courses/${courseId}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Course</span>
              </button>
              <button
                onClick={() => router.push(`/teacher/quizzes/create?course_id=${courseId}`)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Quiz</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Students</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_students}/{course.max_students}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Quizzes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_quizzes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_attempts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Class Average</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.average_class_score.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'students', label: 'Students', icon: Users },
                { id: 'quizzes', label: 'Quizzes', icon: FileText },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Course Overview</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
                      <div className="space-y-3">
                        {quizzes.slice(0, 3).map((quiz) => (
                          <div key={quiz.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{quiz.title}</p>
                              <p className="text-sm text-gray-600">{quiz.total_attempts} attempts</p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              getQuizStatusInfo(quiz).color
                            }`}>
                              {getQuizStatusInfo(quiz).label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Top Performers</h4>
                      <div className="space-y-3">
                        {students
                          .sort((a, b) => b.average_score - a.average_score)
                          .slice(0, 3)
                          .map((student, index) => (
                          <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-medium text-gray-900">{student.full_name}</p>
                                <p className="text-sm text-gray-600">{student.total_quizzes_taken} quizzes</p>
                              </div>
                            </div>
                            <span className="font-medium text-green-600">
                              {student.average_score.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Enrolled Students</h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Add Student</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quizzes Taken
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Average Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                              <div className="text-sm text-gray-500">Joined {formatDate(student.enrollment_date)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {student.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.total_quizzes_taken}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.average_score.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              student.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">
                              <Mail className="h-4 w-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {students.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">No students enrolled yet</p>
                    <p className="text-gray-400 text-sm mb-4">
                      Share the course code <strong>{course.course_code}</strong> with students to let them join
                    </p>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Invite Students
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quizzes Tab */}
            {activeTab === 'quizzes' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Course Quizzes</h3>
                  <button
                    onClick={() => router.push(`/teacher/quizzes/create?course_id=${courseId}`)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Quiz</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {quizzes.map((quiz) => {
                    const statusInfo = getQuizStatusInfo(quiz);
                    const Icon = statusInfo.icon;
                    
                    return (
                      <div key={quiz.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-gray-900">{quiz.title}</h4>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                <Icon className="h-3 w-3 mr-1" />
                                {statusInfo.label}
                              </span>
                            </div>
                            {quiz.description && (
                              <p className="text-sm text-gray-600 mb-2">{quiz.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{quiz.total_questions} questions</span>
                              <span>{quiz.total_marks} marks</span>
                              <span>{quiz.total_attempts} attempts</span>
                              {quiz.average_score != null && (
                                <span>Avg: {quiz.average_score.toFixed(1)}%</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => router.push(`/teacher/quizzes/${quiz.id}/edit`)}
                              className="p-2 text-gray-400 hover:text-blue-600"
                              title="Edit Quiz"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/teacher/quizzes/${quiz.id}/view`)}
                              className="p-2 text-gray-400 hover:text-green-600"
                              title="View Results"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {quizzes.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">No quizzes created yet</p>
                    <p className="text-gray-400 text-sm mb-4">
                      Create your first quiz for this course
                    </p>
                    <button
                      onClick={() => router.push(`/teacher/quizzes/create?course_id=${courseId}`)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Create First Quiz
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Course Settings</h3>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Course Information</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Update course details, description, and other settings.
                    </p>
                    <button
                      onClick={() => router.push(`/teacher/courses/${courseId}/edit`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Edit Course Details
                    </button>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Student Enrollment</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Manage student enrollment limits and access settings.
                    </p>
                    <div className="text-sm text-gray-600">
                      Current: {course.current_students}/{course.max_students} students
                    </div>
                  </div>

                  <div className="border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2">Danger Zone</h4>
                    <p className="text-sm text-red-600 mb-4">
                      These actions cannot be undone. Please be careful.
                    </p>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2">
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Course</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}