// components/course/StudentPracticeDetailsModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Clock, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  BookOpen, 
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Zap,
  Brain,
  Trophy,
  ChevronRight,
  ChevronDown,
  Filter,
  Eye
} from 'lucide-react';

interface StudentPracticeDetail {
  student_id: string;
  student_name: string;
  student_email: string;
  total_practice_attempts: number;
  average_practice_score: number;
  total_practice_time: number;
  unique_questions_attempted: number;
  chapters_covered: number[];
  best_score: number;
  worst_score: number;
  latest_attempt_date?: string;
  performance_trend: 'improving' | 'declining' | 'stable';
  streak_days: number;
  last_practice_date?: string;
  weekly_attempts: number;
  improvement_rate: number;
}

interface ChapterDetail {
  chapter: number;
  chapter_name?: string;
  attempts: number;
  average_score: number;
  best_score: number;
  worst_score: number;
  time_spent: number;
  questions_attempted: number;
  accuracy_rate: number;
  last_attempted: string;
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}

interface PracticeSession {
  id: string;
  date: string;
  chapter: number;
  questions_attempted: number;
  score: number;
  time_spent: number;
  accuracy: number;
  topics_covered: string[];
}

interface StudentPracticeDetailsData {
  student: StudentPracticeDetail;
  chapters: ChapterDetail[];
  recent_sessions: PracticeSession[];
  performance_analytics: {
    weekly_trend: Array<{ week: string; score: number; attempts: number }>;
    accuracy_by_topic: Array<{ topic: string; accuracy: number }>;
    time_distribution: Array<{ hour: number; attempts: number }>;
    streak_info: {
      current_streak: number;
      longest_streak: number;
      streak_start: string;
    };
  };
  recommendations: string[];
}

interface StudentPracticeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  courseId: string;
  studentName: string;
  apiUrl: string;
  authHeaders: Record<string, string>;
}

const StudentPracticeDetailsModal: React.FC<StudentPracticeDetailsModalProps> = ({
  isOpen,
  onClose,
  studentId,
  courseId,
  studentName,
  apiUrl,
  authHeaders
}) => {
  const [data, setData] = useState<StudentPracticeDetailsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chapters' | 'sessions' | 'analytics'>('overview');
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  // Load detailed student data
  const loadStudentDetails = async () => {
    if (!isOpen || !studentId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${apiUrl}/api/teacher/courses/${courseId}/students/${studentId}/practice-details`,
        { headers: authHeaders }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch student details: ${response.status}`);
      }

      const studentData = await response.json();
      setData(studentData);
    } catch (err) {
      console.error('Error loading student details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentDetails();
  }, [isOpen, studentId]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getTrendIcon = (trend: string, size = 'h-4 w-4') => {
    switch (trend) {
      case 'improving': return <TrendingUp className={`${size} text-green-600`} />;
      case 'declining': return <TrendingDown className={`${size} text-red-600`} />;
      default: return <Target className={`${size} text-gray-600`} />;
    }
  };

  const toggleChapterExpansion = (chapter: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapter)) {
      newExpanded.delete(chapter);
    } else {
      newExpanded.add(chapter);
    }
    setExpandedChapters(newExpanded);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Practice Performance Details</h3>
              <p className="text-sm text-gray-600">{studentName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadStudentDetails}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-gray-50 border-r overflow-y-auto">
            <nav className="p-4 space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'chapters', label: 'Chapter Analysis', icon: BookOpen },
                { id: 'sessions', label: 'Recent Sessions', icon: Clock },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={loadStudentDetails}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : data ? (
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-3">
                          <Target className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="text-sm text-blue-700">Total Attempts</p>
                            <p className="text-2xl font-bold text-blue-900">{data.student.total_practice_attempts}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-3">
                          <Award className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="text-sm text-green-700">Average Score</p>
                            <p className="text-2xl font-bold text-green-900">{data.student.average_practice_score.toFixed(1)}/10</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center space-x-3">
                          <Clock className="h-8 w-8 text-purple-600" />
                          <div>
                            <p className="text-sm text-purple-700">Time Spent</p>
                            <p className="text-2xl font-bold text-purple-900">{formatTime(data.student.total_practice_time)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center space-x-3">
                          <Zap className="h-8 w-8 text-orange-600" />
                          <div>
                            <p className="text-sm text-orange-700">Current Streak</p>
                            <p className="text-2xl font-bold text-orange-900">{data.performance_analytics.streak_info.current_streak}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white border rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <Brain className="h-5 w-5 text-blue-600" />
                          <span>Performance Summary</span>
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Best Score:</span>
                            <span className="font-semibold text-green-600">{data.student.best_score.toFixed(1)}/10</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Worst Score:</span>
                            <span className="font-semibold text-red-600">{data.student.worst_score.toFixed(1)}/10</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Chapters Covered:</span>
                            <span className="font-semibold">{data.student.chapters_covered.length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Questions Attempted:</span>
                            <span className="font-semibold">{data.student.unique_questions_attempted}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Performance Trend:</span>
                            <div className="flex items-center space-x-1">
                              {getTrendIcon(data.student.performance_trend)}
                              <span className="font-semibold capitalize">{data.student.performance_trend}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <Trophy className="h-5 w-5 text-yellow-600" />
                          <span>Achievements & Streaks</span>
                        </h4>
                        <div className="space-y-4">
                          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <Activity className="h-5 w-5 text-yellow-600" />
                              <span className="font-medium text-yellow-800">Current Streak</span>
                            </div>
                            <p className="text-2xl font-bold text-yellow-900">{data.performance_analytics.streak_info.current_streak} days</p>
                            <p className="text-sm text-yellow-700">
                              Since {new Date(data.performance_analytics.streak_info.streak_start).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <Target className="h-5 w-5 text-blue-600" />
                              <span className="font-medium text-blue-800">Longest Streak</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-900">{data.performance_analytics.streak_info.longest_streak} days</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {data.recommendations.length > 0 && (
                      <div className="bg-white border rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          <span>Recommendations</span>
                        </h4>
                        <div className="space-y-3">
                          {data.recommendations.map((recommendation, index) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                              <ChevronRight className="h-4 w-4 text-orange-600 mt-0.5" />
                              <p className="text-orange-800">{recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Chapters Tab */}
                {activeTab === 'chapters' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Chapter-wise Performance</h4>
                    <div className="space-y-3">
                      {data.chapters.map((chapter) => (
                        <div key={chapter.chapter} className="bg-white border rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleChapterExpansion(chapter.chapter)}
                            className="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-4">
                              <span className="font-medium text-gray-900">Chapter {chapter.chapter}</span>
                              <span className={`px-2 py-1 rounded text-sm ${getScoreColor(chapter.average_score)}`}>
                                {chapter.average_score.toFixed(1)}/10
                              </span>
                              <span className="text-sm text-gray-500">{chapter.attempts} attempts</span>
                            </div>
                            {expandedChapters.has(chapter.chapter) ? (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                          
                          {expandedChapters.has(chapter.chapter) && (
                            <div className="border-t p-4 bg-gray-50">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-sm text-gray-600">Best Score</p>
                                  <p className="font-semibold text-green-600">{chapter.best_score.toFixed(1)}/10</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Worst Score</p>
                                  <p className="font-semibold text-red-600">{chapter.worst_score.toFixed(1)}/10</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Time Spent</p>
                                  <p className="font-semibold">{formatTime(chapter.time_spent)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Accuracy</p>
                                  <p className="font-semibold">{chapter.accuracy_rate.toFixed(1)}%</p>
                                </div>
                              </div>
                              <div className="mt-4">
                                <p className="text-sm text-gray-600 mb-2">Difficulty Distribution:</p>
                                <div className="flex space-x-4">
                                  <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-green-400 rounded"></div>
                                    <span className="text-sm">Easy: {chapter.difficulty_distribution.easy}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                                    <span className="text-sm">Medium: {chapter.difficulty_distribution.medium}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-red-400 rounded"></div>
                                    <span className="text-sm">Hard: {chapter.difficulty_distribution.hard}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sessions Tab */}
                {activeTab === 'sessions' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Recent Practice Sessions</h4>
                    <div className="space-y-3">
                      {data.recent_sessions.map((session) => (
                        <div key={session.id} className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                                Chapter {session.chapter}
                              </span>
                              <span className="text-sm text-gray-500">{formatDate(session.date)}</span>
                            </div>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(session.score)}`}>
                              {session.score.toFixed(1)}/10
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Questions</p>
                              <p className="font-medium">{session.questions_attempted}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Time</p>
                              <p className="font-medium">{formatTime(session.time_spent)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Accuracy</p>
                              <p className="font-medium">{session.accuracy.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Topics</p>
                              <p className="font-medium">{session.topics_covered.length} topics</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900">Performance Analytics</h4>
                    
                    {/* Weekly Trend */}
                    <div className="bg-white border rounded-lg p-6">
                      <h5 className="font-medium text-gray-900 mb-4">Weekly Performance Trend</h5>
                      <div className="space-y-2">
                        {data.performance_analytics.weekly_trend.map((week, index) => (
                          <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                            <span className="text-sm text-gray-600">{week.week}</span>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm">{week.attempts} attempts</span>
                              <span className={`px-2 py-1 rounded text-sm ${getScoreColor(week.score)}`}>
                                {week.score.toFixed(1)}/10
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Topic Accuracy */}
                    <div className="bg-white border rounded-lg p-6">
                      <h5 className="font-medium text-gray-900 mb-4">Accuracy by Topic</h5>
                      <div className="space-y-3">
                        {data.performance_analytics.accuracy_by_topic.map((topic, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{topic.topic}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    topic.accuracy >= 80 ? 'bg-green-500' :
                                    topic.accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${topic.accuracy}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{topic.accuracy.toFixed(1)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No practice data available for this student</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Last updated: {data?.student.latest_attempt_date ? formatDate(data.student.latest_attempt_date) : 'Never'}</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                // Export functionality could go here
                console.log('Export data for:', studentName);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPracticeDetailsModal;