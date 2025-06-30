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
  Ban,
  BookOpen,
  Target,
  ChevronRight,
  GraduationCap,
  Zap
} from 'lucide-react';

// Board structure for quick access to learning paths
const BOARD_STRUCTURE = {
  cbse: {
    display_name: "CBSE",
    classes: {
      viii: { display_name: "Class VIII" },
      ix: { display_name: "Class IX" },
      x: { display_name: "Class X" },
      xi: { display_name: "Class XI" },
      xii: { display_name: "Class XII" }
    }
  },
  karnataka: {
    display_name: "Karnataka State Board", 
    classes: {
      "8th": { display_name: "8th Class" },
      "9th": { display_name: "9th Class" },
      "10th": { display_name: "10th Class" },
      "puc-1": { display_name: "PUC-I" },
      "puc-2": { display_name: "PUC-II" }
    }
  }
} as const;

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
  average_score: number | null;
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
  best_score?: number | null;
  status: string; // 'not_started', 'in_progress', 'completed' (based on student's attempts)
  quiz_status_value: string; // 'not_started', 'in_progress', 'time_expired' (based on quiz timing)
}

interface DashboardStats {
  total_courses: number;
  total_quizzes_available: number;
  completed_quizzes: number;
  average_score: number;
}

// Helper function to safely format numbers
const safeToFixed = (value: number | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0';
  }
  return value.toFixed(decimals);
};

// Daily Challenge Button Component
const DailyChallengeButton = () => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleChallengeClick = () => {
    router.push('/try');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8 relative overflow-hidden">
      {/* Background gradient animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 opacity-50"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Daily Challenge</h3>
            <p className="text-sm text-gray-600">Test your knowledge and earn points!</p>
          </div>
          <div className="text-3xl animate-bounce">🎯</div>
        </div>
        
        <button
          onClick={handleChallengeClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group w-full relative inline-flex items-center justify-center px-6 py-4 text-lg font-bold text-white transition-all duration-300 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 overflow-hidden"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:translate-x-full"></div>
          
          {/* Content */}
          <div className="relative z-10 flex items-center space-x-3">
            <Zap className="w-5 h-5" />
            <span>Start Daily Challenge</span>
            <div className={`transform transition-transform duration-300 ${isHovered ? 'translate-x-2' : ''}`}>
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
          
          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/40 rounded-full animate-ping"
                style={{
                  left: `${20 + i * 20}%`,
                  top: `${30 + (i % 2) * 40}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>
        </button>
        
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            Boost your learning with daily practice questions
          </p>
        </div>
      </div>
    </div>
  );
};

// Board Card Component for Dashboard
const BoardCard = ({ board, displayName, classes, onClick }: {
  board: string;
  displayName: string;
  classes: Record<string, { display_name: string }>;
  onClick: (board: string, classLevel: string) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors duration-300">
            <GraduationCap className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
        </div>
        
        <div className="space-y-2">
          {Object.entries(classes).map(([classKey, classInfo]) => (
            <button
              key={classKey}
              onClick={() => onClick(board, classKey)}
              className="w-full flex items-center justify-between p-3 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group/item"
            >
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 text-gray-400 mr-2 group-hover/item:text-blue-500 transition-colors duration-200" />
                <span className="text-sm font-medium text-gray-700 group-hover/item:text-blue-700 transition-colors duration-200">
                  {classInfo.display_name}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover/item:text-blue-500 group-hover/item:translate-x-1 transition-all duration-200" />
            </button>
          ))}
        </div>
        
        {/* Animated indicator */}
        <div className={`mt-4 flex justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Learning Path Selection Component
const LearningPathSelection = () => {
  const router = useRouter();

  const handleClassSelect = (board: string, classLevel: string) => {
    router.push(`/${board}/${classLevel}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-100 to-transparent rounded-bl-full opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100 to-transparent rounded-tr-full opacity-50"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center mb-2">
              <Target className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Explore Learning Paths</h3>
            </div>
            <p className="text-sm text-gray-600">
              Browse subjects by board and class to start your learning journey
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="text-2xl animate-pulse">📚</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(BOARD_STRUCTURE).map(([boardKey, board]) => (
            <BoardCard
              key={boardKey}
              board={boardKey}
              displayName={board.display_name}
              classes={board.classes}
              onClick={handleClassSelect}
            />
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="flex items-center text-sm text-blue-800">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
            <span className="font-medium">Pro Tip:</span>
            <span className="ml-1">Access comprehensive study materials tailored to your curriculum</span>
          </div>
        </div>
      </div>
    </div>
  );
};

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

        // Calculate stats with null safety
        const totalQuizzesAvailable = allQuizzes.length;
        const completedQuizzes = allQuizzes.filter(quiz => quiz.status === 'completed').length;
        
        // Safe calculation of average score
        const validCourses = coursesData.filter((course: Course) => 
          course.average_score !== null && course.average_score !== undefined && !isNaN(course.average_score)
        );
        const totalScore = validCourses.reduce((sum: number, course: Course) => 
          sum + (course.average_score || 0), 0);
        const averageScore = validCourses.length > 0 ? totalScore / validCourses.length : 0;

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
  // const getQuizStatusInfo = (quiz: QuizSummary) => {
  //   // First check quiz timing status
  //   if (quiz.quiz_status_value === 'not_started') {
  //     return {
  //       label: 'Not Started',
  //       color: 'bg-gray-100 text-gray-800',
  //       icon: Timer,
  //       description: 'Quiz will start later'
  //     };
  //   }
    
  //   if (quiz.quiz_status_value === 'time_expired') {
  //     return {
  //       label: 'Expired',
  //       color: 'bg-red-100 text-red-800',
  //       icon: Ban,
  //       description: 'Quiz time has ended'
  //     };
  //   }

  //   // If quiz is in valid time window, check student status
  //   switch (quiz.status) {
  //     case 'not_started':
  //       return {
  //         label: 'Available',
  //         color: 'bg-blue-100 text-blue-800',
  //         icon: PlayCircle,
  //         description: 'Ready to start'
  //       };
  //     case 'in_progress':
  //       return {
  //         label: 'In Progress',
  //         color: 'bg-yellow-100 text-yellow-800',
  //         icon: PauseCircle,
  //         description: `${quiz.my_attempts}/${quiz.attempts_allowed} attempts used`
  //       };
  //     case 'completed':
  //       return {
  //         label: 'Completed',
  //         color: 'bg-green-100 text-green-800',
  //         icon: CheckCircle,
  //         description: `${quiz.my_attempts}/${quiz.attempts_allowed} attempts used`
  //       };
  //     default:
  //       return {
  //         label: 'Unknown',
  //         color: 'bg-gray-100 text-gray-800',
  //         icon: AlertCircle,
  //         description: ''
  //       };
  //   }
  // };

  // const isQuizClickable = (quiz: QuizSummary) => {
  //   // Can click if:
  //   // 1. Available to attempt (in time window and has attempts left)
  //   // 2. Completed (to view results)
  //   // return (quiz.quiz_status_value === 'in_progress' && 
  //   //         (quiz.status === 'not_started' || (quiz.status === 'in_progress' && quiz.my_attempts < quiz.attempts_allowed))) ||
  //   //        quiz.status === 'completed';
  //   return true; // For now, allow all quizzes to be clickable
  // };

  const handleQuizClick = (quiz: QuizSummary) => {
    router.push(`/student/quiz/${quiz.id}`);
    // if (quiz.status === 'completed') {
    //   // For completed quizzes, we don't have attempt ID here, so go to quiz page
    //   // The quiz page will show previous attempts
    //   router.push(`/student/quiz/${quiz.id}`);
    // } else if (quiz.quiz_status_value === 'in_progress' && 
    //            (quiz.status === 'not_started' || (quiz.status === 'in_progress' && quiz.my_attempts < quiz.attempts_allowed))) {
    //   // For available quizzes, go to take quiz
    //   router.push(`/student/quiz/${quiz.id}`);
    // }
  };

  // Helper functions for quiz status
  const getQuizStatusInfo = (quiz: QuizSummary) => {
    // First check quiz timing status
    if (quiz.quiz_status_value === 'not_started') {
      return {
        label: 'Not Started',
        color: 'bg-gray-100 text-gray-800',
        icon: Timer,
        description: 'Quiz will start later',
        actionMessage: 'Quiz not available yet'
      };
    }
    
    if (quiz.quiz_status_value === 'time_expired') {
      // Check if user has any attempts to view results
      if(quiz.my_attempts == quiz.attempts_allowed) {
        return {
          label: 'Expired',
          color: 'bg-red-100 text-red-800',
          icon: Ban,
          description: 'Quiz time has ended - All attempts used',
          actionMessage: 'View results'
        }
      }
      else if (quiz.my_attempts > 0) {
        return {
          label: 'Expired',
          color: 'bg-red-100 text-red-800',
          icon: Ban,
          description: 'Quiz time has ended',
          actionMessage: 'View previous attempts'
        };
      } else {
        return {
          label: 'Expired',
          color: 'bg-red-100 text-red-800',
          icon: Ban,
          description: 'Quiz time has ended - No attempts made',
          actionMessage: 'Quiz expired'
        };
      }
    }

    // If quiz is in valid time window, check student status and attempts
    const hasAttemptsLeft = quiz.my_attempts < quiz.attempts_allowed;
    
    switch (quiz.status) {
      case 'not_started':
        return {
          label: 'Available',
          color: 'bg-blue-100 text-blue-800',
          icon: PlayCircle,
          description: `Ready to start - ${quiz.attempts_allowed - quiz.my_attempts} attempts remaining`,
          actionMessage: 'Start quiz'
        };
        
      case 'in_progress':
        if (hasAttemptsLeft) {
          return {
            label: 'In Progress',
            color: 'bg-yellow-100 text-yellow-800',
            icon: PauseCircle,
            description: `${quiz.my_attempts}/${quiz.attempts_allowed} attempts used - ${quiz.attempts_allowed - quiz.my_attempts} remaining`,
            actionMessage: 'Continue quiz'
          };
        } else {
          return {
            label: 'All Attempts Used',
            color: 'bg-orange-100 text-orange-800',
            icon: StopCircle,
            description: `${quiz.my_attempts}/${quiz.attempts_allowed} attempts used - No attempts remaining`,
            actionMessage: 'View results'
          };
        }
        
      case 'completed':
        if (hasAttemptsLeft) {
          return {
            label: 'Completed',
            color: 'bg-green-100 text-green-800',
            icon: CheckCircle,
            description: `${quiz.my_attempts}/${quiz.attempts_allowed} attempts used - ${quiz.attempts_allowed - quiz.my_attempts} attempts remaining`,
            actionMessage: 'Retake quiz'
          };
        } else {
          return {
            label: 'All Attempts Used',
            color: 'bg-purple-100 text-purple-800',
            icon: CheckCircle,
            description: `${quiz.my_attempts}/${quiz.attempts_allowed} attempts used - All attempts completed`,
            actionMessage: 'View results'
          };
        }
        
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800',
          icon: AlertCircle,
          description: 'Status unknown',
          actionMessage: 'Check quiz'
        };
    }
  };

  const isQuizClickable = (quiz: QuizSummary) => {
    // Always allow clicking if user has made at least one attempt (to view results)
    if (quiz.my_attempts > 0) {
      return true;
    }
    
    // For quizzes not yet attempted, check timing and attempt availability
    if (quiz.quiz_status_value === 'in_progress') {
      // Quiz is in valid time window
      const hasAttemptsLeft = quiz.my_attempts < quiz.attempts_allowed;
      if (hasAttemptsLeft && (quiz.status === 'not_started' || quiz.status === 'in_progress')) {
        return true;
      }
    }
    
    // Don't allow clicking for expired quizzes with no attempts
    // or quizzes that haven't started yet
    return false;
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
    const date = new Date(dateString);
    const utcTime = date.getTime() - (5.5 * 3600000);
    return new Date(utcTime).toLocaleString();
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
        <div className="mb-8 bg-white rounded-lg shadow-lg p-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-50 via-purple-50 to-transparent rounded-bl-full opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-green-50 to-transparent rounded-tr-full opacity-60"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {profile?.full_name || 'Student'}!
                </h2>
                <p className="text-gray-600 mb-4">
                  Join courses, take quizzes, and track your learning progress.
                </p>
                
                {/* Quick stats in welcome section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{stats.total_courses}</div>
                    <div className="text-xs text-blue-700">Courses</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{stats.completed_quizzes}</div>
                    <div className="text-xs text-green-700">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{stats.total_quizzes_available}</div>
                    <div className="text-xs text-purple-700">Available</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">{safeToFixed(stats.average_score)}%</div>
                    <div className="text-xs text-yellow-700">Avg Score</div>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="text-4xl animate-bounce">🎓</div>
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
                              {quiz.best_score !== undefined && quiz.best_score !== null && (
                                <div className="text-sm text-blue-600">
                                  Best: {safeToFixed(quiz.best_score)}%
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
                                  Click to {statusInfo.actionMessage}
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

        {/* Daily Challenge Section */}
        <DailyChallengeButton />

        {/* Learning Path Selection */}
        <LearningPathSelection />

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
                        {safeToFixed(course.average_score)}%
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
                      {quiz.best_score !== undefined && quiz.best_score !== null && (
                        <p className="text-xs text-blue-600">
                          Best: {safeToFixed(quiz.best_score)}%
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