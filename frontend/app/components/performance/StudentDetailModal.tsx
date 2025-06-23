// frontend/components/performance/StudentDetailModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar, 
  Clock, 
  Award, 
  BookOpen,
  ChevronDown,
  ChevronUp,
  Filter,
  Download
} from 'lucide-react';
import { supabase } from '../../utils/supabase';

interface StudentAttempt {
  id: string;
  question_id: string;
  question_text?: string;
  user_answer: string;
  correct_answer?: string;
  score: number;
  max_score: number;
  feedback: string;
  time_taken: number;
  chapter: number;
  difficulty?: string;
  question_type?: string;
  attempted_at: string;
}

interface StudentDetailResponse {
  student_id: string;
  course_id: string;
  chapter_filter?: number;
  total_attempts: number;
  attempts: StudentAttempt[];
}

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  total_practice_attempts: number;
  average_practice_score: number;
  total_practice_time: number;
  unique_questions_attempted: number;
  chapters_covered: number[];
  best_score: number;
  latest_attempt_date?: string;
  performance_trend: 'improving' | 'declining' | 'stable';
}

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentInfo;
  courseId: string;
}

export default function StudentDetailModal({ isOpen, onClose, student, courseId }: StudentDetailModalProps) {
  const [detailData, setDetailData] = useState<StudentDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [expandedAttempts, setExpandedAttempts] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'chapter'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (isOpen && student) {
      fetchStudentDetails();
    }
  }, [isOpen, student, selectedChapter]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };

      const params = new URLSearchParams();
      if (selectedChapter) {
        params.append('chapter', selectedChapter.toString());
      }

      const queryString = params.toString();
      const url = `${API_URL}/api/teacher/courses/${courseId}/practice-performance/student/${student.id}${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error('Failed to fetch student details');
      }

      const data = await response.json();
      setDetailData(data);

    } catch (err) {
      console.error('Error fetching student details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
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

  const getScoreColor = (score: number, maxScore: number = 10) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const toggleAttemptExpansion = (attemptId: string) => {
    setExpandedAttempts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(attemptId)) {
        newSet.delete(attemptId);
      } else {
        newSet.add(attemptId);
      }
      return newSet;
    });
  };

  const getSortedAttempts = () => {
    if (!detailData?.attempts) return [];

    return [...detailData.attempts].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.attempted_at).getTime() - new Date(b.attempted_at).getTime();
          break;
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'chapter':
          comparison = a.chapter - b.chapter;
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  };

  const getChapterStats = () => {
    if (!detailData?.attempts) return {};

    const chapterStats: { [key: number]: { attempts: number; avgScore: number; totalScore: number } } = {};
    
    detailData.attempts.forEach(attempt => {
      if (!chapterStats[attempt.chapter]) {
        chapterStats[attempt.chapter] = { attempts: 0, avgScore: 0, totalScore: 0 };
      }
      chapterStats[attempt.chapter].attempts++;
      chapterStats[attempt.chapter].totalScore += attempt.score;
    });

    Object.keys(chapterStats).forEach(chapter => {
      const chapterNum = parseInt(chapter);
      chapterStats[chapterNum].avgScore = chapterStats[chapterNum].totalScore / chapterStats[chapterNum].attempts;
    });

    return chapterStats;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
            <p className="text-gray-600">{student.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Student Summary Stats */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Target className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-gray-600">Total Attempts</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">{student.total_practice_attempts}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Award className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-gray-600">Average Score</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{student.average_practice_score.toFixed(1)}/10</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Clock className="h-4 w-4 text-purple-600" />
                <p className="text-sm font-medium text-gray-600">Time Spent</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">{formatTime(student.total_practice_time)}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <BookOpen className="h-4 w-4 text-orange-600" />
                <p className="text-sm font-medium text-gray-600">Chapters</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">{student.chapters_covered.length}</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                {getTrendIcon(student.performance_trend)}
                <p className="text-sm font-medium text-gray-600">Trend</p>
              </div>
              <p className="text-lg font-bold capitalize text-gray-700">{student.performance_trend}</p>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="p-6 border-b bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Chapter</label>
                <select
                  value={selectedChapter || ''}
                  onChange={(e) => setSelectedChapter(e.target.value ? parseInt(e.target.value) : null)}
                  className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Chapters</option>
                  {student.chapters_covered.sort((a, b) => a - b).map(chapter => (
                    <option key={chapter} value={chapter}>Chapter {chapter}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sort, order] = e.target.value.split('-');
                    setSortBy(sort as any);
                    setSortOrder(order as any);
                  }}
                  className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date-desc">Latest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="score-desc">Highest Score</option>
                  <option value="score-asc">Lowest Score</option>
                  <option value="chapter-asc">Chapter (Low to High)</option>
                  <option value="chapter-desc">Chapter (High to Low)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={fetchStudentDetails}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chapter Performance Summary */}
        {detailData && (
          <div className="p-6 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chapter Performance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(getChapterStats()).map(([chapter, stats]) => (
                <div key={chapter} className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Chapter {chapter}</h4>
                    <span className="text-sm text-gray-500">{stats.attempts} attempts</span>
                  </div>
                  <div className="text-center">
                    <p className={`text-xl font-bold px-2 py-1 rounded ${getScoreColor(stats.avgScore)}`}>
                      {stats.avgScore.toFixed(1)}/10
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attempts List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchStudentDetails}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : detailData && detailData.attempts.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {getSortedAttempts().map((attempt) => {
                const isExpanded = expandedAttempts.has(attempt.id);
                
                return (
                  <div key={attempt.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-900">
                          Chapter {attempt.chapter}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreColor(attempt.score, attempt.max_score)}`}>
                          {attempt.score}/{attempt.max_score}
                        </span>
                        {attempt.difficulty && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(attempt.difficulty)}`}>
                            {attempt.difficulty}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {formatTime(attempt.time_taken)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {formatDate(attempt.attempted_at)}
                        </span>
                        <button
                          onClick={() => toggleAttemptExpansion(attempt.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {attempt.question_text && (
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                        <p className="text-gray-700 text-sm">{attempt.question_text}</p>
                      </div>
                    )}

                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-2">Student Answer:</h4>
                      <p className="text-gray-700 text-sm bg-blue-50 p-3 rounded-lg">{attempt.user_answer}</p>
                    </div>

                    {isExpanded && (
                      <div className="space-y-3 pt-3 border-t border-gray-200">
                        {attempt.correct_answer && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Correct Answer:</h4>
                            <p className="text-gray-700 text-sm bg-green-50 p-3 rounded-lg">{attempt.correct_answer}</p>
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Feedback:</h4>
                          <p className="text-gray-700 text-sm bg-yellow-50 p-3 rounded-lg">{attempt.feedback}</p>
                        </div>

                        {attempt.question_type && (
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Type: {attempt.question_type}</span>
                            <span>Question ID: {attempt.question_id}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No practice attempts found</p>
              <p className="text-gray-400 text-sm">
                {selectedChapter ? `No attempts found for Chapter ${selectedChapter}` : 'This student hasn\'t attempted any questions yet'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}