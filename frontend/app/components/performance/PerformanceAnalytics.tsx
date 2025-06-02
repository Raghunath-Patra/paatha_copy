import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  LineChart,
  Line
} from 'recharts';

// ✅ NEW: Lightweight analytics data types
interface AnalyticsDataPoint {
  attempt_number: number;
  score: number;
  time_taken: number;
  timestamp: string;
  difficulty: string;
  type: string;
  bloom_level: string;
  category: string;
}

interface CategoryPerformance {
  [category: string]: {
    total_attempts: number;
    average_score: number;
    best_score: number;
  };
}

interface PerformanceAnalyticsData {
  analytics_data: AnalyticsDataPoint[];
  score_trends: Array<{attempt: number; score: number; date: string}>;
  category_performance: CategoryPerformance;
  difficulty_breakdown: any;
  time_performance: Array<{time_taken: number; score: number; category: string}>;
}

// ✅ EXISTING: Legacy data types (preserved from original)
interface AttemptMetadata {
  questionNumber?: string;
  source?: string;
  level?: string;
  bloomLevel?: string;
  statistics?: {
    totalAttempts: number;
    averageScore: number;
  };
}

interface Question {
  section_id?: string;
}

interface Attempt {
  score: number;
  metadata?: AttemptMetadata;
  question?: Question;
}

interface SectionData {
  id: string;
  name: string;
  attempted: number;
  total: number;
  averageScore: number;
}

// ✅ UPDATED: Props interface supporting both formats
interface PerformanceAnalyticsProps {
  // NEW: Lightweight analytics data (preferred)
  analyticsData?: PerformanceAnalyticsData;
  
  // LEGACY: Full attempts array (backward compatibility)
  attempts?: Attempt[];
}

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ 
  analyticsData, 
  attempts = [] 
}) => {
  const [difficultyData, setDifficultyData] = useState<Array<{name: string, score: number, count: number}>>([]);
  const [bloomData, setBloomData] = useState<Array<{name: string, score: number, count: number}>>([]);
  const [scoreTrends, setScoreTrends] = useState<Array<{attempt: number, score: number}>>([]);
  const [sectionData, setSectionData] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Process data from either new analytics data or legacy attempts
  useEffect(() => {
    // Priority: Use new analytics data if available, otherwise process legacy attempts
    if (analyticsData && analyticsData.analytics_data.length > 0) {
      processAnalyticsData(analyticsData);
    } else if (attempts && attempts.length > 0) {
      processLegacyAttempts(attempts);
    } else {
      setLoading(false);
    }
  }, [analyticsData, attempts]);

  // ✅ NEW: Process lightweight analytics data (fast)
  const processAnalyticsData = (data: PerformanceAnalyticsData) => {
    try {
      // Process difficulty data
      const difficultyScores: Record<string, {total: number, count: number}> = {
        'Easy': { total: 0, count: 0 },
        'Medium': { total: 0, count: 0 },
        'Hard': { total: 0, count: 0 }
      };
      
      // Process Bloom's taxonomy data
      const bloomScores: Record<string, {total: number, count: number}> = {
        'Remember': { total: 0, count: 0 },
        'Understand': { total: 0, count: 0 },
        'Apply': { total: 0, count: 0 },
        'Analyze': { total: 0, count: 0 },
        'Evaluate': { total: 0, count: 0 },
        'Create': { total: 0, count: 0 }
      };

      // Aggregate from lightweight analytics data
      data.analytics_data.forEach(point => {
        // Difficulty aggregation
        const difficulty = point.difficulty || 'Medium';
        if (difficultyScores[difficulty]) {
          difficultyScores[difficulty].total += point.score;
          difficultyScores[difficulty].count += 1;
        }
        
        // Bloom's taxonomy aggregation
        const bloomLevel = point.bloom_level || 'Understand';
        if (bloomScores[bloomLevel]) {
          bloomScores[bloomLevel].total += point.score;
          bloomScores[bloomLevel].count += 1;
        }
      });

      // Convert to chart format
      const diffData = Object.entries(difficultyScores).map(([difficulty, data]) => ({
        name: difficulty,
        score: data.count > 0 ? parseFloat((data.total / data.count).toFixed(1)) : 0,
        count: data.count
      }));
      
      const bloomDataProcessed = Object.entries(bloomScores).map(([level, data]) => ({
        name: level,
        score: data.count > 0 ? parseFloat((data.total / data.count).toFixed(1)) : 0,
        count: data.count
      }));

      // Score trends from analytics data
      const trends = data.score_trends.map(trend => ({
        attempt: trend.attempt,
        score: trend.score
      }));
      
      setDifficultyData(diffData);
      setBloomData(bloomDataProcessed);
      setScoreTrends(trends);
      setLoading(false);
      
    } catch (error) {
      console.error('Error processing analytics data:', error);
      setLoading(false);
    }
  };

  // ✅ LEGACY: Process full attempts array (slower - backward compatibility)
  const processLegacyAttempts = (attemptsArray: Attempt[]) => {
    try {
      // Process data for difficulty chart
      const difficultyScores: Record<string, {total: number, count: number}> = {
        'Easy': { total: 0, count: 0 },
        'Medium': { total: 0, count: 0 },
        'Hard': { total: 0, count: 0 }
      };
      
      // Process data for Bloom's taxonomy chart
      const bloomScores: Record<string, {total: number, count: number}> = {
        'Remember': { total: 0, count: 0 },
        'Understand': { total: 0, count: 0 },
        'Apply': { total: 0, count: 0 },
        'Analyze': { total: 0, count: 0 },
        'Evaluate': { total: 0, count: 0 },
        'Create': { total: 0, count: 0 }
      };
      
      // Aggregate data from attempts (original logic preserved)
      attemptsArray.forEach(attempt => {
        if (!attempt.metadata) return;
        
        // For difficulty data
        const difficulty = attempt.metadata.level || 'Medium';
        if (difficultyScores[difficulty]) {
          difficultyScores[difficulty].total += attempt.score;
          difficultyScores[difficulty].count += 1;
        }
        
        // For Bloom's taxonomy data
        const bloomLevel = attempt.metadata.bloomLevel || 'Understand';
        if (bloomScores[bloomLevel]) {
          bloomScores[bloomLevel].total += attempt.score;
          bloomScores[bloomLevel].count += 1;
        }
      });

      // Convert aggregated data to chart format (original logic preserved)
      const diffData = Object.entries(difficultyScores).map(([difficulty, data]) => ({
        name: difficulty,
        score: data.count > 0 ? parseFloat((data.total / data.count).toFixed(1)) : 0,
        count: data.count
      }));
      
      const bloomDataProcessed = Object.entries(bloomScores).map(([level, data]) => ({
        name: level,
        score: data.count > 0 ? parseFloat((data.total / data.count).toFixed(1)) : 0,
        count: data.count
      }));

      // Generate score trends from attempts
      const trends = attemptsArray.map((attempt, index) => ({
        attempt: index + 1,
        score: attempt.score
      }));
      
      setDifficultyData(diffData);
      setBloomData(bloomDataProcessed);
      setScoreTrends(trends);
      setLoading(false);
      
    } catch (error) {
      console.error('Error processing legacy attempts:', error);
      setLoading(false);
    }
  };

  // Get color based on score for the bar chart - red for low scores, green for high scores
  const getScoreColor = (score: number): string => {
    if (score >= 8) return '#4CAF50'; // Green for score 8-10
    if (score >= 6) return '#8BC34A'; // Light green for score 6-8
    if (score >= 4) return '#FFC107'; // Yellow for score 4-6
    if (score >= 2) return '#FF9800'; // Orange for score 2-4
    return '#F44336'; // Red for score 0-2
  };

  if (loading) {
    return <div className="p-4 text-center">Loading performance data...</div>;
  }

  if (difficultyData.length === 0 || bloomData.length === 0) {
    return <div className="p-4 text-center">No performance data available for this chapter yet.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h2 className="text-xl font-medium mb-4">Performance Analytics</h2>
      
      {/* ✅ NEW: Score Trends Chart (if we have analytics data) */}
      {analyticsData && scoreTrends.length > 3 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Score Progression Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="attempt" />
                <YAxis domain={[0, 10]} />
                <Tooltip formatter={(value) => [`${value}/10`, 'Score']} />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* ✅ EXISTING: Difficulty Level Analysis (preserved original design) */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Performance by Difficulty</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={difficultyData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 10]} />
              <YAxis dataKey="name" type="category" />
              <Tooltip 
                formatter={(value) => [`${value}/10`, 'Score']}
                labelFormatter={(value) => `Difficulty: ${value}`}
              />
              <Legend />
              <Bar 
                dataKey="score" 
                name="Average Score" 
                fill="#8884d8"
                background={{ fill: '#eee' }}
                label={{ position: 'right', formatter: (val: any) => `${val}/10` }}
              >
                {difficultyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* ✅ EXISTING: Bloom's Taxonomy Analysis (preserved original design) */}
      <div>
        <h3 className="text-lg font-medium mb-2">Performance by Bloom's Taxonomy</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={bloomData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={30} domain={[0, 10]} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip formatter={(value) => `${value}/10`} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ✅ NEW: Additional insights if we have analytics data */}
      {analyticsData && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Performance Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="font-medium text-gray-700">Question Categories</p>
              <div className="mt-2 space-y-1">
                {Object.entries(analyticsData.category_performance).map(([category, data]) => (
                  <div key={category} className="flex justify-between">
                    <span className="text-gray-600">{category}:</span>
                    <span className="font-medium">{data.average_score.toFixed(1)}/10</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="font-medium text-gray-700">Time Analysis</p>
              <div className="mt-2">
                <p className="text-gray-600">
                  Avg time per question: {Math.round(
                    analyticsData.analytics_data.reduce((acc, curr) => acc + curr.time_taken, 0) / 
                    analyticsData.analytics_data.length
                  )} seconds
                </p>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="font-medium text-gray-700">Recent Trend</p>
              <div className="mt-2">
                {scoreTrends.length >= 2 && (
                  <p className="text-gray-600">
                    {scoreTrends[scoreTrends.length - 1].score > scoreTrends[scoreTrends.length - 2].score ? 
                      '📈 Improving' : scoreTrends[scoreTrends.length - 1].score < scoreTrends[scoreTrends.length - 2].score ?
                      '📉 Declining' : '➡️ Stable'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalytics;