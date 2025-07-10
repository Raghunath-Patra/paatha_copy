// frontend/app/student/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../utils/supabase';
import Navigation from '../../components/navigation/Navigation';
import StudentNotifications from '../../components/notifications/StudentNotifications';
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
  Zap, 
  Bell, 
  RefreshCw,
  Sparkles,
  Users,
  Brain,
  Plus,
  Search,
  Star,
  Gamepad2
} from 'lucide-react';

// Board structure for AI-driven learning paths
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

// Quick Practice Button Component
const QuickPracticeButton = () => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handlePracticeClick = () => {
    router.push('/try');
  };

  return (
    <button
      onClick={handlePracticeClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative w-full inline-flex items-center justify-center px-4 py-3 text-sm font-semibold text-white transition-all duration-300 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:translate-x-full"></div>
      
      {/* Content */}
      <div className="relative z-10 flex items-center space-x-2">
        <Gamepad2 className="w-4 h-4" />
        <span>Start Practice</span>
        <div className={`transform transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`}>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
};

// Board Card Component for AI Learning Paths
const BoardCard = ({ board, displayName, classes, onClick }: {
  board: string;
  displayName: string;
  classes: Record<string, { display_name: string }>;
  onClick: (board: string, classLevel: string) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 relative overflow-hidden group border border-gray-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors duration-300">
            <Brain className="h-6 w-6 text-blue-600" />
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

// Teacher Courses Section Component
const TeacherCoursesSection = ({ 
  courses, 
  availableQuizzes, 
  onJoinCourse, 
  onViewAllQuizzes,
  onQuizClick,
  getQuizStatusInfo,
  isQuizClickable 
}: {
  courses: Course[];
  availableQuizzes: QuizSummary[];
  onJoinCourse: () => void;
  onViewAllQuizzes: () => void;
  onQuizClick: (quiz: QuizSummary) => void;
  getQuizStatusInfo: (quiz: QuizSummary) => any;
  isQuizClickable: (quiz: QuizSummary) => boolean;
}) => {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Teacher-Led Courses</h3>
            <p className="text-sm text-gray-600">Courses created by your teachers</p>
          </div>
        </div>
        <button
          onClick={onJoinCourse}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Join Course</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
              <p className="text-2xl font-bold text-blue-600">{courses.length}</p>
            </div>
            <GraduationCap className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Quizzes</p>
              <p className="text-2xl font-bold text-green-600">{availableQuizzes.length}</p>
            </div>
            <PlayCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-purple-600">
                {safeToFixed(courses.reduce((sum, course) => sum + (course.average_score || 0), 0) / (courses.length || 1))}%
              </p>
            </div>
            <Award className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">My Courses</h4>
              <button
                // onClick={() => router.push('/student/courses')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
              >
                <span>View All</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {courses.slice(0, 4).map((course) => (
                <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 text-sm">{course.course_name}</h5>
                    <p className="text-xs text-gray-600">
                      {course.teacher_name} • {course.board.toUpperCase()} • Class {course.class_level}
                    </p>
                    <p className="text-xs text-gray-500">
                      {course.completed_quizzes}/{course.total_quizzes} quizzes completed
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {course.course_code}
                    </span>
                    <div className="mt-1">
                      <span className="text-sm font-medium text-blue-600">
                        {safeToFixed(course.average_score)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No courses joined yet</p>
                  <button
                    onClick={onJoinCourse}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Join your first course
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Available Quizzes */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Available Quizzes</h4>
              <button
                onClick={onViewAllQuizzes}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
              >
                <span>View All</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {availableQuizzes.slice(0, 4).map((quiz) => {
                const statusInfo = getQuizStatusInfo(quiz);
                const Icon = statusInfo.icon;
                const clickable = isQuizClickable(quiz);
                
                return (
                  <div 
                    key={quiz.id} 
                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                      clickable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed opacity-75'
                    }`}
                    onClick={() => clickable && onQuizClick(quiz)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-medium text-gray-900 text-sm">{quiz.title}</h5>
                        <Icon className="h-3 w-3 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-600">{quiz.course_name}</p>
                      <p className="text-xs text-gray-500">
                        {quiz.total_marks} marks • {quiz.time_limit ? `${quiz.time_limit} min` : 'No limit'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {quiz.my_attempts}/{quiz.attempts_allowed} attempts
                      </p>
                    </div>
                  </div>
                );
              })}
              {availableQuizzes.length === 0 && (
                <div className="text-center py-8">
                  <PlayCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No quizzes available</p>
                  <p className="text-xs text-gray-400">
                    Join courses to access quizzes
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// AI Learning Paths Section Component (WITHOUT Quick Practice)
const AILearningPathsSection = () => {
  const router = useRouter();

  const handleClassSelect = (board: string, classLevel: string) => {
    router.push(`/${board}/${classLevel}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">AI-Powered Learning Paths</h3>
            <p className="text-sm text-gray-600">Structured learning by board and class</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-2xl animate-pulse">🤖</div>
        </div>
      </div>

      {/* Learning Paths */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Explore Learning Paths</h4>
            <p className="text-sm text-gray-600">
              Browse subjects by board and class for structured learning
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
            <span className="ml-1">AI adapts to your learning pace and provides personalized recommendations</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// NEW: Quick Practice Section Component
const QuickPracticeSection = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
            <Gamepad2 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Quick Practice & Daily Challenge</h3>
            <p className="text-sm text-gray-600">AI-generated questions for instant practice</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-2xl animate-bounce">🎯</div>
        </div>
      </div>

      {/* Quick Practice Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-red-50 rounded-lg p-8 border border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-2xl font-bold text-gray-900 mb-3">Daily Challenge & Practice</h4>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Test your knowledge with AI-generated questions across various topics and difficulty levels. 
              Challenge yourself with adaptive questions that grow with your skills!
            </p>
            
            {/* Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-white/70 rounded-lg border border-white/50 hover:bg-white/90 transition-all duration-200">
                <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-800">Adaptive</p>
                <p className="text-xs text-gray-600 mt-1">Questions adjust to your level</p>
              </div>
              <div className="text-center p-4 bg-white/70 rounded-lg border border-white/50 hover:bg-white/90 transition-all duration-200">
                <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-800">Targeted</p>
                <p className="text-xs text-gray-600 mt-1">Focus on weak areas</p>
              </div>
              <div className="text-center p-4 bg-white/70 rounded-lg border border-white/50 hover:bg-white/90 transition-all duration-200">
                <Zap className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-800">Instant</p>
                <p className="text-xs text-gray-600 mt-1">Immediate feedback</p>
              </div>
              <div className="text-center p-4 bg-white/70 rounded-lg border border-white/50 hover:bg-white/90 transition-all duration-200">
                <Award className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-800">Rewarding</p>
                <p className="text-xs text-gray-600 mt-1">Track your progress</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <QuickPracticeButton />
              </div>
              <div className="sm:w-auto">
                <button className="w-full sm:w-auto px-6 py-3 bg-white/80 text-purple-700 rounded-lg border border-purple-200 hover:bg-white hover:border-purple-300 transition-all duration-200 font-medium">
                  View Progress
                </button>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:block ml-8">
            <div className="relative">
              <div className="text-8xl animate-bounce filter drop-shadow-lg">🎯</div>
              <div className="absolute -top-4 -right-4 text-3xl animate-spin-slow">✨</div>
              <div className="absolute -bottom-2 -left-2 text-2xl animate-pulse">🚀</div>
            </div>
          </div>
        </div>
      </div>

      {/* Practice Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Questions Answered</p>
              <p className="text-3xl font-bold text-purple-600">247</p>
              <p className="text-xs text-gray-500 mt-1">This week</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accuracy Rate</p>
              <p className="text-3xl font-bold text-green-600">87%</p>
              <p className="text-xs text-gray-500 mt-1">Last 100 questions</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Daily Streak</p>
              <p className="text-3xl font-bold text-orange-600">12</p>
              <p className="text-xs text-gray-500 mt-1">Days in a row</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Performance */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Practice Sessions</h4>
        <div className="space-y-3">
          {[
            { subject: "Mathematics", score: 92, questions: 15, time: "2 hours ago" },
            { subject: "Physics", score: 78, questions: 12, time: "Yesterday" },
            { subject: "Chemistry", score: 85, questions: 18, time: "2 days ago" },
          ].map((session, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <h5 className="font-medium text-gray-900">{session.subject}</h5>
                <p className="text-sm text-gray-600">{session.questions} questions • {session.time}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-blue-600">{session.score}%</span>
                <p className="text-xs text-gray-500">Score</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
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
  
  // Quiz modal states
  const [showAllQuizzesModal, setShowAllQuizzesModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  // UPDATED: Tab state to include 'practice'
  const [activeTab, setActiveTab] = useState<'teacher' | 'ai' | 'practice'>('teacher');

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check if user is a student
  useEffect(() => {
    if (profile && profile.role !== 'student') {
      router.push('/teacher/dashboard');
    }
  }, [profile, router]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const headers = {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        };

        const coursesResponse = await fetch(`${API_URL}/api/student/courses/`, {
          headers
        });

        if (!coursesResponse.ok) {
          throw new Error('Failed to fetch courses');
        }

        const coursesData = await coursesResponse.json();
        setCourses(coursesData);

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
                course_name: course.course_name
              })));
            }
          } catch (err) {
            console.error(`Error fetching quizzes for course ${course.id}:`, err);
          }
        }

        allQuizzes.sort((a, b) => {
          const dateA = new Date(a.start_time || 0);
          const dateB = new Date(b.start_time || 0);
          return dateB.getTime() - dateA.getTime();
        });

        setAllQuizzes(allQuizzes);

        const totalQuizzesAvailable = allQuizzes.length;
        const completedQuizzes = allQuizzes.filter(quiz => quiz.status === 'completed').length;
        
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

        await fetchNotificationCount();

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

      window.location.reload();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setJoiningCourse(false);
    }
  };

  const fetchNotificationCount = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${API_URL}/api/student/courses/notifications?limit=1`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.stats.unread_count);
        setHasUnreadNotifications(data.stats.unread_count > 0);
      }
    } catch (err) {
      console.error('Error fetching notification count:', err);
    }
  };

  const handleNotificationUpdate = () => {
    fetchNotificationCount();
  };

  const handleQuizClick = (quiz: QuizSummary) => {
    router.push(`/student/quiz/${quiz.id}`);
  };

  const getQuizStatusInfo = (quiz: QuizSummary) => {
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
        return {
            label: 'In Progress',
            color: 'bg-yellow-100 text-yellow-800',
            icon: PauseCircle,
            description: `${quiz.my_attempts}/${quiz.attempts_allowed} attempts used - ${quiz.attempts_allowed - quiz.my_attempts} remaining`,
            actionMessage: 'Continue quiz'
          };

      case 'completed':
        return {
            label: 'Completed',
            color: 'bg-green-100 text-green-800',
            icon: CheckCircle,
            description: `All attempts used`,
            actionMessage: 'View Results'
          };
        
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
    if (quiz.my_attempts > 0) {
      return true;
    }
    
    if (quiz.quiz_status_value === 'in_progress') {
      const hasAttemptsLeft = quiz.my_attempts < quiz.attempts_allowed;
      if (hasAttemptsLeft && (quiz.status === 'not_started' || quiz.status === 'in_progress')) {
        return true;
      }
    }
    
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
        return allQuizzes.filter(quiz => quiz.my_attempts > 0);
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

  const availableQuizzes = allQuizzes.filter(quiz => 
    quiz.quiz_status_value === 'in_progress' && 
    (quiz.status === 'not_started' || (quiz.status === 'in_progress' && quiz.my_attempts < quiz.attempts_allowed))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="h-6 w-6" />
              {hasUnreadNotifications && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
            <Navigation />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-2xl shadow-2xl p-8 relative overflow-hidden border border-white/20">
      {/* Enhanced Background Elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-400/20 via-purple-400/20 to-transparent rounded-bl-full opacity-80 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-green-400/20 via-emerald-400/20 to-transparent rounded-tr-full opacity-80 animate-pulse"></div>
      <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-yellow-300/10 rounded-full blur-xl animate-bounce"></div>
      
      {/* Floating Sparkles */}
      <div className="absolute top-4 right-20 animate-float">
        <Sparkles className="w-5 h-5 text-purple-400/60" />
      </div>
      <div className="absolute bottom-6 right-1/3 animate-float-delayed">
        <Sparkles className="w-4 h-4 text-blue-400/60" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-1">
                  Welcome back, {profile?.full_name || 'Student'}!
                </h2>
                <p className="text-gray-600 text-lg">
                  Access teacher-led courses, AI learning paths, and quick practice all in one place.
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 backdrop-blur-sm p-5 rounded-xl border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900 text-lg">AI Learning Boost</span>
              </div>
              <p className="text-gray-700 mb-3 leading-relaxed">
                Your AI tutor adapts to your pace and identifies knowledge gaps automatically.
              </p>
              <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg border border-yellow-200/50">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-gray-800">40% faster skill growth with AI assistance</span>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:block ml-6">
            <div className="relative">
              <div className="text-6xl animate-bounce filter drop-shadow-lg">🎓</div>
              <div className="absolute -top-2 -right-2 text-2xl animate-spin-slow">✨</div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite 1.5s;
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>

        {/* UPDATED: Tab Navigation - Added Practice Tab */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-1 inline-flex">
            <button
              onClick={() => setActiveTab('teacher')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'teacher'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Teacher-Led Courses</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'ai'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>Learning Paths</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'practice'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Gamepad2 className="h-4 w-4" />
                <span>Quick Practice</span>
              </div>
            </button>
          </div>
        </div>

        {/* UPDATED: Tab Content - Added Practice Tab */}
        <div className="transition-all duration-300">
          {activeTab === 'teacher' ? (
            <TeacherCoursesSection
              courses={courses}
              availableQuizzes={availableQuizzes}
              onJoinCourse={() => setShowJoinForm(true)}
              onViewAllQuizzes={() => setShowAllQuizzesModal(true)}
              onQuizClick={handleQuizClick}
              getQuizStatusInfo={getQuizStatusInfo}
              isQuizClickable={isQuizClickable}
            />
          ) : activeTab === 'ai' ? (
            <AILearningPathsSection />
          ) : (
            <QuickPracticeSection />
          )}
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
              
              <div className="border-b overflow-x-auto">
                <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max">
                  {[
                    { key: 'all', label: 'All Quizzes', count: allQuizzes.length },
                    { key: 'available', label: 'Available', count: allQuizzes.filter(q => q.quiz_status_value === 'in_progress' && (q.status === 'not_started' || (q.status === 'in_progress' && q.my_attempts < q.attempts_allowed))).length },
                    { key: 'completed', label: 'Completed', count: allQuizzes.filter(q => q.my_attempts > 0).length },
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
                          
                          {clickable && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-green-600 font-medium">
                                  Click to {statusInfo.actionMessage}
                                </span>
                                {quiz.status !== 'not_started' ? (
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
      </div>

      <StudentNotifications
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNotificationUpdate={handleNotificationUpdate}
      />
    </div>
  );
}