// frontend/app/teacher/courses/[courseId]/page.tsx - ENHANCED with Practice Performance
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import { supabase } from '../../../utils/supabase';
import Navigation from '../../../components/navigation/Navigation';
import DeleteCourseModal from '../../../components/course/DeleteCourseModal';
import StudentPracticeDetailsModal from '../../../components/course/StudentPracticeDetailsModal';
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
  Trash2,
  TrendingUp,
  TrendingDown,
  Target,
  Filter,
  Search,
  Download,
  RefreshCw,
  Send,
  Bell,
  X,
  AlertCircle,
  Info,
  ClipboardList,
  MessageSquare
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

// NEW: Practice Performance Interfaces
interface StudentPracticePerformance {
  student_id: string;
  student_name: string;
  student_email: string;
  total_practice_attempts: number;
  average_practice_score: number;
  total_practice_time: number;
  unique_questions_attempted: number;
  chapters_covered: number[];
  best_score: number;
  latest_attempt_date?: string;
  performance_trend: 'improving' | 'declining' | 'stable';
}

interface ChapterPerformance {
  chapter: number;
  chapter_name?: string;
  total_attempts: number;
  average_score: number;
  student_count: number;
  best_score: number;
  worst_score: number;
}

interface PracticePerformanceStats {
  total_students_practiced: number;
  total_practice_attempts: number;
  overall_average_score: number;
  most_attempted_chapter?: number;
  best_performing_chapter?: number;
  chapters_covered: number[];
}

interface CoursePracticePerformance {
  students: StudentPracticePerformance[];
  chapters: ChapterPerformance[];
  stats: PracticePerformanceStats;
}

type ViewMode = 'overview' | 'students' | 'quizzes' | 'practice' | 'settings';
type DataView = 'quiz' | 'practice';

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
  const [activeTab, setActiveTab] = useState<ViewMode>('overview');
  const [copiedCode, setCopiedCode] = useState(false);

  // NEW: Practice Performance State
  const [dataView, setDataView] = useState<DataView>('quiz');
  const [practiceData, setPracticeData] = useState<CoursePracticePerformance | null>(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  
  // Practice Filters
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // NEW: Notification Management States
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'pending' | 'invitations' | 'notices'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationStats, setNotificationStats] = useState({
    total_sent: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
    read: 0
  });
  const [notificationLoading, setNotificationLoading] = useState(false);

  const [addStudentModal, setAddStudentModal] = useState({ isOpen: false });
  const [publicNoticeModal, setPublicNoticeModal] = useState({ isOpen: false });

    const [inviteStudentForm, setInviteStudentForm] = useState({
    student_email: '',
    loading: false,
    error: null as string | null
  });

  const [publicNoticeForm, setPublicNoticeForm] = useState({
    title: '',
    message: '',
    priority: 'medium',
    loading: false,
    error: null as string | null
  });

  const [studentDetailsModal, setStudentDetailsModal] = useState({
    isOpen: false,
    studentId: '',
    studentName: ''
  });

  const [authHeaders, setAuthHeaders] = useState<Record<string, string>>({});


  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

        // Get access token for API calls
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const headers = {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        };

        // Fetch course data first
        const courseResponse = await fetch(`${API_URL}/api/teacher/courses/${courseId}`, {
          headers
        });

        if (!courseResponse.ok) {
          throw new Error('Failed to fetch course details');
        }

        const courseData = await courseResponse.json();
        setCourse(courseData);

        // Fetch students
        const studentsResponse = await fetch(`${API_URL}/api/teacher/courses/${courseId}/students`, {
          headers
        });

        let studentsData = [];
        if (studentsResponse.ok) {
          studentsData = await studentsResponse.json();
          setStudents(studentsData);
        }

        // Fetch course quizzes
        const quizzesResponse = await fetch(`${API_URL}/api/teacher/quizzes/?course_id=${courseId}`, {
          headers
        });

        let quizzesData = [];
        if (quizzesResponse.ok) {
          quizzesData = await quizzesResponse.json();
          setQuizzes(quizzesData);
        }

        // Calculate stats AFTER data is loaded
        const courseStats: CourseStats = {
          total_students: studentsData.length,
          active_students: studentsData.filter((s: Student) => s.status === 'active').length,
          total_quizzes: quizzesData.length,
          published_quizzes: quizzesData.filter((q: Quiz) => q.is_published).length,
          total_attempts: quizzesData.reduce((sum: number, q: Quiz) => sum + q.total_attempts, 0),
          average_class_score: studentsData.length > 0 
            ? studentsData.reduce((sum: number, s: Student) => sum + s.average_score, 0) / studentsData.length 
            : 0
        };
        setStats(courseStats);

        setAuthHeaders(headers);

      } catch (err) {
        console.error('Error loading course data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [user, courseId]);

  const handleDeleteCourse = async (courseId: string) => {
    if (!user || !course) return;

    try {
      setIsDeleting(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${API_URL}/api/teacher/courses/${courseId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      // Success - redirect to courses list
      router.push('/teacher/dashboard');
      
    } catch (err) {
      console.error('Error deleting course:', err);
      alert('Failed to delete course. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // NEW: Open Student Details Modal
  const openStudentDetailsModal = (studentId: string, studentName: string) => {
    setStudentDetailsModal({
      isOpen: true,
      studentId,
      studentName
    });
  };

  const closeStudentDetailsModal = () => {
    setStudentDetailsModal({
      isOpen: false,
      studentId: '',
      studentName: ''
    });
  };

  // NEW: Load Practice Performance Data
  const loadPracticeData = async (forceReload = false) => {
    if (!user || !course) return;

    // Don't reload if data exists and not forced
    if (practiceData && !forceReload && selectedStudent === 'all' && selectedChapter === 'all') {
      return;
    }

    try {
      setPracticeLoading(true);
      setPracticeError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };

      // Build query parameters
      const params = new URLSearchParams();
      if (selectedStudent !== 'all') {
        params.append('student_id', selectedStudent);
      }
      if (selectedChapter !== 'all') {
        params.append('chapter', selectedChapter);
      }

      const queryString = params.toString();
      const url = `${API_URL}/api/teacher/courses/${courseId}/practice-performance${queryString ? `?${queryString}` : ''}`;

      console.log('Loading practice data from:', url);

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch practice performance data: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Practice data loaded:', data);
      setPracticeData(data);

    } catch (err) {
      console.error('Error loading practice data:', err);
      setPracticeError(err instanceof Error ? err.message : 'Failed to load practice data');
    } finally {
      setPracticeLoading(false);
    }
  };

  // Load practice data when switching to practice view or filters change
  useEffect(() => {
    if (course && (
      (activeTab === 'students' && dataView === 'practice') || 
      activeTab === 'practice'
    )) {
      loadPracticeData();
    }
  }, [dataView, selectedStudent, selectedChapter, course, activeTab]);

  // Load practice data immediately when switching to practice tab
  useEffect(() => {
    if (activeTab === 'practice' && course && !practiceData && !practiceLoading) {
      loadPracticeData();
    }
  }, [activeTab, course]);

  const handleCopyCode = () => {
    if (course) {
      navigator.clipboard.writeText(course.course_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // NEW: Fetch Course Notifications
  const fetchCourseNotifications = async () => {
    if (!user || !course) return;

    try {
      setNotificationLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };

      const params = new URLSearchParams();
      if (notificationFilter !== 'all') {
        if (notificationFilter === 'invitations') {
          params.append('type', 'course_invitation');
        } else if (notificationFilter === 'notices') {
          params.append('type', 'public_notice');
        } else {
          params.append('status', notificationFilter);
        }
      }

      const response = await fetch(`${API_URL}/api/teacher/courses/${courseId}/notifications?${params}`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setNotificationStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setNotificationLoading(false);
    }
  };

  // Send Course Invitation
const sendCourseInvitation = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user || !course) return;

  try {
    setInviteStudentForm(prev => ({ ...prev, loading: true, error: null }));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    const headers = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };

    const invitationData = {
      student_email: inviteStudentForm.student_email,
      course_name: course.course_name,
      teacher_name: profile?.full_name || 'Teacher'
    };

    const response = await fetch(`${API_URL}/api/teacher/courses/${courseId}/invite-student`, {
      method: 'POST',
      headers,
      body: JSON.stringify(invitationData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send invitation');
    }

    // Success
    alert('✅ Invitation sent successfully!');
    setInviteStudentForm({ student_email: '', loading: false, error: null });
    setAddStudentModal({ isOpen: false });
    
    // Refresh notifications if modal is open
    if (showNotificationModal) {
      fetchCourseNotifications();
    }

  } catch (err) {
    console.error('Error sending invitation:', err);
    setInviteStudentForm(prev => ({
      ...prev,
      loading: false,
      error: err instanceof Error ? err.message : 'Failed to send invitation'
    }));
  }
};

// Send Public Notice
const sendPublicNotice = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user || !course) return;

  try {
    setPublicNoticeForm(prev => ({ ...prev, loading: true, error: null }));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    const headers = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };

    const noticeData = {
      title: publicNoticeForm.title,
      message: publicNoticeForm.message,
      priority: publicNoticeForm.priority
    };

    const response = await fetch(`${API_URL}/api/teacher/courses/${courseId}/public-notice`, {
      method: 'POST',
      headers,
      body: JSON.stringify(noticeData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send notice');
    }

    // Success
    alert('📢 Public notice sent successfully!');
    setPublicNoticeForm({ title: '', message: '', priority: 'medium', loading: false, error: null });
    setPublicNoticeModal({ isOpen: false });
    
    // Refresh notifications if modal is open
    if (showNotificationModal) {
      fetchCourseNotifications();
    }

  } catch (err) {
    console.error('Error sending notice:', err);
    setPublicNoticeForm(prev => ({
      ...prev,
      loading: false,
      error: err instanceof Error ? err.message : 'Failed to send notice'
    }));
  }
};

  // NEW: Format notification date
  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Filter students based on search term
  const getFilteredStudents = () => {
    if (!practiceData) return [];
    return practiceData.students.filter(student =>
      student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get unique chapters for filter
  const getUniqueChapters = () => {
    if (!practiceData) return [];
    const chapters = new Set<number>();
    practiceData.students.forEach(student => {
      student.chapters_covered.forEach(chapter => chapters.add(chapter));
    });
    return Array.from(chapters).sort((a, b) => a - b);
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
                onClick={() => router.push('/student/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Course Details</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowNotificationModal(true);
                  fetchCourseNotifications();
                }}
                className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center"
                title="Manage Notifications"
              >
                <Bell className="h-5 w-5" />
              </button>
              <Navigation />
            </div>
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
                onClick={() => setPublicNoticeModal(prev => ({ ...prev, isOpen: true }))}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
              >
                <Bell className="h-4 w-4" />
                <span>Send Notice</span>
              </button>
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
                { id: 'practice', label: 'Practice Performance', icon: BarChart3 },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ViewMode)}
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
                      <h4 className="font-medium text-gray-900 mb-3">Recent Quizzes</h4>
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
    {/* Data View Toggle - Enhanced with notifications */}
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-medium text-gray-900">Student Management</h3>
      <div className="flex items-center space-x-4">
        {/* Simple toggle between Quiz and Practice summary */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setDataView('quiz')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              dataView === 'quiz'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Quiz Results
          </button>
          <button
            onClick={() => setDataView('practice')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              dataView === 'practice'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Practice Summary
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setAddStudentModal(prev => ({ ...prev, isOpen: true }))}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>
    </div>

    {/* Quiz Results View */}
    {dataView === 'quiz' && (
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
    )}

    {/* Practice Summary View - SIMPLIFIED */}
    {dataView === 'practice' && (
      <div>
        {practiceLoading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : practiceError ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{practiceError}</p>
            <button
              onClick={() => loadPracticeData(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : practiceData && practiceData.students.length > 0 ? (
          <div className="space-y-6">
            {/* Quick Practice Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600">Students Practicing</p>
                    <p className="text-2xl font-bold text-blue-900">{practiceData.stats.total_students_practiced}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600">Total Attempts</p>
                    <p className="text-2xl font-bold text-green-900">{practiceData.stats.total_practice_attempts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600">Class Average</p>
                    <p className="text-2xl font-bold text-purple-900">{practiceData.stats.overall_average_score.toFixed(1)}/10</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simple Student Practice Overview Table */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">Student Practice Overview</h4>
                <button
                  onClick={() => setActiveTab('practice')}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                >
                  View Full Analytics →
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
                        Practice Attempts
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chapters Covered
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trend
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {practiceData.students.map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.student_name}</div>
                            <div className="text-sm text-gray-500">{student.student_email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.total_practice_attempts}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded ${getScoreColor(student.average_practice_score)}`}>
                            {student.average_practice_score.toFixed(1)}/10
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.chapters_covered.length} chapters
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            {getTrendIcon(student.performance_trend)}
                            <span className={`text-sm ${getTrendColor(student.performance_trend)}`}>
                              {student.performance_trend}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            onClick={() => openStudentDetailsModal(student.student_id, student.student_name)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No practice data available</p>
            <p className="text-gray-400 text-sm">
              Students haven't started practicing questions yet
            </p>
          </div>
        )}
      </div>
    )}

    {/* Empty state for no students */}
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

            {/* Practice Performance Tab */}
{activeTab === 'practice' && (
  <div>

    {/* MOVE: Practice Performance Filters from Students tab */}
    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Students
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-10 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Student
          </label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Students</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Chapter
          </label>
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Chapters</option>
            {getUniqueChapters().map((chapter) => (
              <option key={chapter} value={chapter.toString()}>
                Chapter {chapter}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => loadPracticeData(true)}
            disabled={practiceLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${practiceLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>

    {/* Show practice data if available */}
    {practiceLoading ? (
      <div className="flex justify-center items-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    ) : practiceError ? (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{practiceError}</p>
        <button
          onClick={() => loadPracticeData(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    ) : practiceData ? (
      <div className="space-y-6">
        {/* MOVE: Enhanced Practice Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Students Practicing</p>
                <p className="text-3xl font-bold text-blue-900">{practiceData.stats.total_students_practiced}</p>
                <p className="text-xs text-blue-600">of {students.length} total</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Total Attempts</p>
                <p className="text-3xl font-bold text-green-900">{practiceData.stats.total_practice_attempts}</p>
                <p className="text-xs text-green-600">
                  Avg: {(practiceData.stats.total_practice_attempts / Math.max(practiceData.stats.total_students_practiced, 1)).toFixed(1)} per student
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <Award className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600 font-medium">Overall Average</p>
                <p className="text-3xl font-bold text-purple-900">{practiceData.stats.overall_average_score.toFixed(1)}/10</p>
                <p className="text-xs text-purple-600">
                  {((practiceData.stats.overall_average_score / 10) * 100).toFixed(1)}% accuracy
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600 font-medium">Chapters Covered</p>
                <p className="text-3xl font-bold text-orange-900">{practiceData.stats.chapters_covered.length}</p>
                <p className="text-xs text-orange-600">
                  {practiceData.stats.most_attempted_chapter && `Most: Ch ${practiceData.stats.most_attempted_chapter}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* NEW: Practice Performance Overview Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-medium text-gray-900">Top Practice Performers</h4>
            </div>
            <div className="divide-y divide-gray-200">
              {practiceData.students
                .sort((a, b) => b.average_practice_score - a.average_practice_score)
                .slice(0, 5)
                .map((student, index) => (
                <div key={student.student_id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{student.student_name}</p>
                      <p className="text-sm text-gray-500">{student.total_practice_attempts} attempts</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getScoreColor(student.average_practice_score)}`}>
                      {student.average_practice_score.toFixed(1)}/10
                    </p>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(student.performance_trend)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chapter Performance Overview */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-medium text-gray-900">Chapter Performance Overview</h4>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {practiceData.chapters
                  .sort((a, b) => b.average_score - a.average_score)
                  .slice(0, 5)
                  .map((chapter) => (
                  <div key={chapter.chapter} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Chapter {chapter.chapter}</p>
                      <p className="text-sm text-gray-500">{chapter.student_count} students, {chapter.total_attempts} attempts</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${getScoreColor(chapter.average_score)}`}>
                        {chapter.average_score.toFixed(1)}/10
                      </p>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            chapter.average_score >= 8 ? 'bg-green-500' :
                            chapter.average_score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(chapter.average_score / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MOVE: Student Practice Performance List */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">Detailed Student Performance</h4>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Showing {getFilteredStudents().length} of {practiceData.students.length} students</span>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {getFilteredStudents().map((student) => (
              <div key={student.student_id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className="font-medium text-gray-900">{student.student_name}</h5>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(student.performance_trend)}
                        <span className={`text-sm ${getTrendColor(student.performance_trend)}`}>
                          {student.performance_trend}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{student.student_email}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Attempts</p>
                        <p className="font-medium">{student.total_practice_attempts}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Average Score</p>
                        <p className={`font-medium px-2 py-1 rounded ${getScoreColor(student.average_practice_score)}`}>
                          {student.average_practice_score.toFixed(1)}/10
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Best Score</p>
                        <p className="font-medium text-green-600">{student.best_score.toFixed(1)}/10</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Time Spent</p>
                        <p className="font-medium">{formatTime(student.total_practice_time)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Chapters</p>
                        <p className="font-medium">{student.chapters_covered.length} chapters</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center space-x-4">
                      <div className="flex space-x-1">
                        {student.chapters_covered.slice(0, 5).map((chapter) => (
                          <span key={chapter} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            Ch {chapter}
                          </span>
                        ))}
                        {student.chapters_covered.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{student.chapters_covered.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    {student.latest_attempt_date && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last activity: {formatDate(student.latest_attempt_date)}
                      </p>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col space-y-2">
                    <button 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      onClick={() => openStudentDetailsModal(student.student_id, student.student_name)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MOVE: Chapter Performance Summary */}
        {practiceData.chapters.length > 0 && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-medium text-gray-900">Comprehensive Chapter Analysis</h4>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {practiceData.chapters
                  .sort((a, b) => a.chapter - b.chapter)
                  .map((chapter) => (
                  <div key={chapter.chapter} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">Chapter {chapter.chapter}</h5>
                      <span className="text-sm text-gray-500">{chapter.student_count} students</span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average:</span>
                        <span className={`font-medium ${getScoreColor(chapter.average_score)}`}>
                          {chapter.average_score.toFixed(1)}/10
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Best:</span>
                        <span className="font-medium text-green-600">{chapter.best_score.toFixed(1)}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Worst:</span>
                        <span className="font-medium text-red-600">{chapter.worst_score.toFixed(1)}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Attempts:</span>
                        <span className="font-medium">{chapter.total_attempts}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            chapter.average_score >= 8 ? 'bg-green-500' :
                            chapter.average_score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(chapter.average_score / 10) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Performance: {((chapter.average_score / 10) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NEW: Additional Analytics Section */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">Practice Insights & Recommendations</h4>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Insights */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Key Insights</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-gray-700">
                      {((practiceData.stats.total_students_practiced / students.length) * 100).toFixed(0)}% of students are actively practicing
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <p className="text-gray-700">
                      Average practice time per student: {formatTime(
                        practiceData.students.reduce((sum, s) => sum + s.total_practice_time, 0) / 
                        Math.max(practiceData.students.length, 1)
                      )}
                    </p>
                  </div>
                  {practiceData.stats.best_performing_chapter && (
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <p className="text-gray-700">
                        Chapter {practiceData.stats.best_performing_chapter} has the highest average score
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Recommendations</h5>
                <div className="space-y-2 text-sm">
                  {practiceData.stats.total_students_practiced < students.length * 0.5 && (
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <p className="text-gray-700">
                        Consider encouraging more students to start practicing
                      </p>
                    </div>
                  )}
                  {practiceData.chapters.some(c => c.average_score < 5) && (
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <p className="text-gray-700">
                        Some chapters need additional attention - consider creating targeted quizzes
                      </p>
                    </div>
                  )}
                  {practiceData.students.some(s => s.performance_trend === 'declining') && (
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <p className="text-gray-700">
                        Some students show declining performance - consider personal check-ins
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg">No Practice Data Available</p>
        <p className="text-gray-400 text-sm">
          Students haven't started practicing questions yet
        </p>
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
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                      onClick={() => setShowDeleteModal(true)}>
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
      {/* NEW: Notification Management Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">Course Notifications</h3>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Notification Stats */}
            <div className="p-6 border-b bg-gray-50">
              <div className="grid grid-cols-5 gap-4 text-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{notificationStats.total_sent}</div>
                  <div className="text-sm text-blue-700">Total Sent</div>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{notificationStats.pending}</div>
                  <div className="text-sm text-yellow-700">Pending</div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{notificationStats.accepted}</div>
                  <div className="text-sm text-green-700">Accepted</div>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{notificationStats.declined}</div>
                  <div className="text-sm text-red-700">Declined</div>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{notificationStats.read}</div>
                  <div className="text-sm text-gray-700">Read</div>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="border-b overflow-x-auto">
              <nav className="flex space-x-8 px-6">
                {[
                  { key: 'all', label: 'All', count: notifications.length },
                  { key: 'pending', label: 'Pending', count: notificationStats.pending },
                  { key: 'invitations', label: 'Invitations', count: notifications.filter(n => n.type === 'course_invitation').length },
                  { key: 'notices', label: 'Notices', count: notifications.filter(n => n.type === 'public_notice').length }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setNotificationFilter(tab.key as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      notificationFilter === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>

            {/* Notifications List */}
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {notificationLoading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No notifications found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {notification.type === 'course_invitation' ? (
                              <UserPlus className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Bell className="h-5 w-5 text-purple-600" />
                            )}
                            <h4 className="font-medium text-gray-900">{notification.title}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              notification.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              notification.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              notification.status === 'declined' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {notification.status}
                            </span>
                          </div>
                          
                          {/* <p className="text-gray-600 mb-2">{notification.message}</p> */}
                          
                          {notification.student && (
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>To: {notification.student.full_name}</span>
                              <span>({notification.student.email})</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                            <span>Sent: {formatNotificationDate(notification.created_at)}</span>
                            {notification.responded_at && (
                              <span>Responded: {formatNotificationDate(notification.responded_at)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-4 bg-gray-50 flex justify-between">
              <button
                onClick={() => fetchCourseNotifications()}
                disabled={notificationLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${notificationLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
{addStudentModal.isOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg w-full max-w-md">
      <div className="flex items-center justify-between p-6 border-b">
        <h3 className="text-lg font-medium text-gray-900">Invite Student to Course</h3>
        <button
          onClick={() => {
            setAddStudentModal({ isOpen: false });
            setInviteStudentForm({ student_email: '', loading: false, error: null });
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <form onSubmit={sendCourseInvitation} className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Student Email Address
          </label>
          <input
            type="email"
            value={inviteStudentForm.student_email}
            onChange={(e) => setInviteStudentForm(prev => ({ ...prev, student_email: e.target.value }))}
            placeholder="Enter student's email address"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={inviteStudentForm.loading}
          />
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Course: {course.course_name}</p>
              <p>Code: {course.course_code}</p>
              <p className="mt-1">The student will receive an invitation to join this course.</p>
            </div>
          </div>
        </div>

        {inviteStudentForm.error && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">{inviteStudentForm.error}</p>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => {
              setAddStudentModal({ isOpen: false });
              setInviteStudentForm({ student_email: '', loading: false, error: null });
            }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
            disabled={inviteStudentForm.loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={inviteStudentForm.loading || !inviteStudentForm.student_email}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {inviteStudentForm.loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send Invitation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{/* Public Notice Modal */}
{publicNoticeModal.isOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg w-full max-w-md">
      <div className="flex items-center justify-between p-6 border-b">
        <h3 className="text-lg font-medium text-gray-900">Send Public Notice</h3>
        <button
          onClick={() => {
            setPublicNoticeModal({ isOpen: false });
            setPublicNoticeForm({ title: '', message: '', priority: 'medium', loading: false, error: null });
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <form onSubmit={sendPublicNotice} className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notice Title
          </label>
          <input
            type="text"
            value={publicNoticeForm.title}
            onChange={(e) => setPublicNoticeForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter notice title"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required
            disabled={publicNoticeForm.loading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={publicNoticeForm.message}
            onChange={(e) => setPublicNoticeForm(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Enter your message here..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required
            disabled={publicNoticeForm.loading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            value={publicNoticeForm.priority}
            onChange={(e) => setPublicNoticeForm(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            disabled={publicNoticeForm.loading}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Bell className="h-5 w-5 text-purple-600 mt-0.5" />
            <div className="text-sm text-purple-700">
              <p className="font-medium">To: All students in {course.course_name}</p>
              <p className="mt-1">This notice will be sent to all {students.length} enrolled students.</p>
            </div>
          </div>
        </div>

        {publicNoticeForm.error && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">{publicNoticeForm.error}</p>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => {
              setPublicNoticeModal({ isOpen: false });
              setPublicNoticeForm({ title: '', message: '', priority: 'medium', loading: false, error: null });
            }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
            disabled={publicNoticeForm.loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={publicNoticeForm.loading || !publicNoticeForm.title || !publicNoticeForm.message}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {publicNoticeForm.loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send Notice</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

    <DeleteCourseModal
      isOpen={showDeleteModal}
      onClose={() => setShowDeleteModal(false)}
      onConfirm={handleDeleteCourse}
      course={{
        id: course.id,
        name: course.course_name,
        enrollmentCount: stats?.total_students || 0,
        quizCount: stats?.total_quizzes || 0,
        attemptCount: stats?.total_attempts || 0
      }}
      isDeleting={isDeleting}
    />

      {/* Student Practice Details Modal */}
      <StudentPracticeDetailsModal
        isOpen={studentDetailsModal.isOpen}
        onClose={closeStudentDetailsModal}
        studentId={studentDetailsModal.studentId}
        courseId={courseId}
        studentName={studentDetailsModal.studentName}
        apiUrl={API_URL || ''}
        authHeaders={authHeaders}
      />
    </div>
  );
}
