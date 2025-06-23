// frontend/components/performance/PracticeAnalyticsTeacher.tsx
'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Clock,
  Users,
  BookOpen,
  BarChart3
} from 'lucide-react';

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

interface PracticeAnalyticsData {
  students: StudentPracticePerformance[];
  chapters: ChapterPerformance[];
  stats: PracticePerformanceStats;
}

interface PracticeAnalyticsProps {
  data: PracticeAnalyticsData;
  courseInfo?: {
    board: string;
    class_level: string;
    subject: string;
  };
}

export default function PracticeAnalyticsTeacher({ data, courseInfo }: PracticeAnalyticsProps) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Prepare chapter performance data for charts
  const chapterData = data.chapters
    .sort((a, b) => a.chapter - b.chapter)
    .map(chapter => ({
      chapter: `Ch ${chapter.chapter}`,
      average_score: parseFloat(chapter.average_score.toFixed(1)),
      total_attempts: chapter.total_attempts,
      student_count: chapter.student_count,
      best_score: parseFloat(chapter.best_score.toFixed(1)),
      worst_score: parseFloat(chapter.worst_score.toFixed(1))
    }));

  // Prepare student performance distribution
  const scoreDistribution = [
    { range: '9-10', count: data.students.filter(s => s.average_practice_score >= 9).length, color: '#10B981' },
    { range: '7-8.9', count: data.students.filter(s => s.average_practice_score >= 7 && s.average_practice_score < 9).length, color: '#3B82F6' },
    { range: '5-6.9', count: data.students.filter(s => s.average_practice_score >= 5 && s.average_practice_score < 7).length, color: '#F59E0B' },
    { range: '0-4.9', count: data.students.filter(s => s.average_practice_score < 5).length, color: '#EF4444' }
  ];

  // Prepare student engagement data (attempts vs performance)
  const engagementData = data.students.map(student => ({
    name: student.student_name.split(' ')[0], // First name only for readability
    attempts: student.total_practice_attempts,
    score: parseFloat(student.average_practice_score.toFixed(1)),
    time: Math.round(student.total_practice_time / 60), // Convert to minutes
    trend: student.performance_trend
  }));

  // Performance trend distribution
  const trendData = [
    { 
      name: 'Improving', 
      value: data.students.filter(s => s.performance_trend === 'improving').length,
      color: '#10B981'
    },
    { 
      name: 'Stable', 
      value: data.students.filter(s => s.performance_trend === 'stable').length,
      color: '#6B7280'
    },
    { 
      name: 'Declining', 
      value: data.students.filter(s => s.performance_trend === 'declining').length,
      color: '#EF4444'
    }
  ];

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!data.students.length) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Practice Data Available</h3>
          <p className="text-gray-600">Students haven't started practicing questions yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Active Learners</p>
              <p className="text-3xl font-bold">{data.stats.total_students_practiced}</p>
            </div>
            <Users className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Overall Average</p>
              <p className="text-3xl font-bold">{data.stats.overall_average_score.toFixed(1)}/10</p>
            </div>
            <Award className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Attempts</p>
              <p className="text-3xl font-bold">{data.stats.total_practice_attempts}</p>
            </div>
            <Target className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Chapters Covered</p>
              <p className="text-3xl font-bold">{data.stats.chapters_covered.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Main Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chapter Performance Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Chapter-wise Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chapterData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="chapter" />
              <YAxis domain={[0, 10]} />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'average_score') return [`${value}/10`, 'Average Score'];
                  if (name === 'total_attempts') return [value, 'Total Attempts'];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="average_score" fill="#3B82F6" name="Average Score" />
              <Bar dataKey="total_attempts" fill="#10B981" name="Total Attempts" yAxisId="right" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Score Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={scoreDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ range, count, percent }) => `${range}: ${count} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {scoreDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Student Engagement Scatter Plot */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Engagement vs Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="attempts" name="Attempts" />
              <YAxis dataKey="score" name="Score" domain={[0, 10]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value: any, name: string, props: any) => {
                  if (name === 'score') return [`${value}/10`, 'Average Score'];
                  if (name === 'attempts') return [value, 'Total Attempts'];
                  return [value, name];
                }}
                labelFormatter={(label: any, payload: any) => {
                  if (payload && payload[0]) {
                    return `${payload[0].payload.name} (${formatTime(payload[0].payload.time)} spent)`;
                  }
                  return label;
                }}
              />
              <Scatter 
                dataKey="score" 
                fill="#8884d8"
                shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  const size = Math.max(4, Math.min(12, payload.attempts / 2));
                  const color = payload.trend === 'improving' ? '#10B981' : 
                               payload.trend === 'declining' ? '#EF4444' : '#6B7280';
                  return <circle cx={cx} cy={cy} r={size} fill={color} />;
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Improving</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span>Stable</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Declining</span>
            </div>
          </div>
        </div>

        {/* Performance Trends */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={trendData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {trendData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
          <div className="space-y-3">
            {data.students
              .sort((a, b) => b.average_practice_score - a.average_practice_score)
              .slice(0, 5)
              .map((student, index) => (
                <div key={student.student_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
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
                    <p className="font-bold text-green-600">{student.average_practice_score.toFixed(1)}/10</p>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(student.performance_trend)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Most Attempted Chapter</h4>
              </div>
              <p className="text-blue-800">
                {data.stats.most_attempted_chapter ? `Chapter ${data.stats.most_attempted_chapter}` : 'No data available'}
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-900">Best Performing Chapter</h4>
              </div>
              <p className="text-green-800">
                {data.stats.best_performing_chapter ? `Chapter ${data.stats.best_performing_chapter}` : 'No data available'}
              </p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-purple-900">Engagement Rate</h4>
              </div>
              <p className="text-purple-800">
                {((data.stats.total_students_practiced / Math.max(1, data.students.length)) * 100).toFixed(1)}% of students are actively practicing
              </p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <h4 className="font-medium text-orange-900">Average Study Time</h4>
              </div>
              <p className="text-orange-800">
                {formatTime(Math.round(data.students.reduce((sum, s) => sum + s.total_practice_time, 0) / 60 / data.students.length))} per student
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}