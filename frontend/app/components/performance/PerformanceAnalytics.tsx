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
  Cell
} from 'recharts';

// Define types for the data structures
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

// We've removed the section breakdown, but keeping the interface definition
// in case it's referenced elsewhere in the component implementation
interface SectionData {
  id: string;
  name: string;
  attempted: number;
  total: number;
  averageScore: number;
}

const PerformanceAnalytics: React.FC<{ attempts: Attempt[] }> = ({ attempts = [] }) => {
  const [difficultyData, setDifficultyData] = useState<Array<{name: string, score: number, count: number}>>([]);
  const [bloomData, setBloomData] = useState<Array<{name: string, score: number, count: number}>>([]);
  const [sectionData, setSectionData] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);

  // Process the data for different visualizations
  useEffect(() => {
    if (!attempts || attempts.length === 0) {
      setLoading(false);
      return;
    }
    
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
    
    // Aggregate data from attempts
    attempts.forEach(attempt => {
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

    // Convert aggregated data to chart format
    const diffData = Object.entries(difficultyScores).map(([difficulty, data]) => ({
      name: difficulty,
      score: data.count > 0 ? parseFloat((data.total / data.count).toFixed(1)) : 0,
      count: data.count
    }));
    
    const bloomData = Object.entries(bloomScores).map(([level, data]) => ({
      name: level,
      score: data.count > 0 ? parseFloat((data.total / data.count).toFixed(1)) : 0,
      count: data.count
    }));
    
    setDifficultyData(diffData);
    setBloomData(bloomData);
    setLoading(false);
  }, [attempts]);

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
      
      {/* Difficulty Level Analysis */}
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
      
      {/* Bloom's Taxonomy Analysis */}
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
    </div>
  );
};

export default PerformanceAnalytics;