// frontend/app/components/common/QuestionLimitIndicator.tsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../utils/auth';

interface TokenStatus {
  input_limit: number;
  output_limit: number;
  input_used: number;
  output_used: number;
  input_remaining: number;
  output_remaining: number;
  limit_reached: boolean;
  questions_used_today: number;
  plan_name: string;
  display_name: string;
}

const QuestionLimitIndicator: React.FC = () => {
  // Initialize with default values instead of null
  const [status, setStatus] = useState<TokenStatus>({
    input_limit: 0,
    output_limit: 0,
    input_used: 0,
    output_used: 0,
    input_remaining: 0,
    output_remaining: 0,
    limit_reached: false,
    questions_used_today: 0,
    plan_name: '',
    display_name: ''
  });
  
  // Use isRefreshing instead of loading to indicate data refresh
  const [isRefreshing, setIsRefreshing] = useState(true);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  useEffect(() => {
    const fetchStatus = async () => {
      // Start refreshing but don't clear existing data
      setIsRefreshing(true);
      
      try {
        const { headers, isAuthorized } = await getAuthHeaders();
        
        if (!isAuthorized) {
          console.log('Not authorized to fetch token status');
          return;
        }
        
        const response = await fetch(`${API_URL}/api/user/question-status`, { headers });
        
        if (!response.ok) {
          console.error('Failed to fetch token status', response.status, response.statusText);
          return;
        }
        
        const data = await response.json();
        console.log('Token status data:', data);
        setStatus(data);
      } catch (error) {
        console.error('Error fetching token status:', error);
      } finally {
        setIsRefreshing(false);
      }
    };
    
    fetchStatus();
    
    // Refresh status every minute
    const intervalId = setInterval(fetchStatus, 60000);
    
    return () => clearInterval(intervalId);
  }, [API_URL]);
  
  // Never return null, always render the component
  // The key change is removing this line: if (loading || !status) return null;
  
  // Calculate percentage of usage
  const calculateUsagePercentage = () => {
    // Calculate based on tokens (whichever is higher percentage)
    const inputPercentage = (status.input_used / status.input_limit) * 100;
    const outputPercentage = (status.output_used / status.output_limit) * 100;
    
    // Use the higher percentage
    return Math.min(100, Math.max(inputPercentage, outputPercentage) || 0); // Add fallback for NaN
  };
  
  // Determine color based on usage percentage
  const getBarColor = () => {
    const percentage = calculateUsagePercentage();
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  return (
    <div className={`bg-white rounded-md shadow-sm p-3 w-full transition-opacity duration-300 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm mb-1">
          <span className="text-gray-600">Today's usage:</span>
          <span className="font-medium">
            {status.questions_used_today} questions
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getBarColor()}`} 
            style={{ width: `${calculateUsagePercentage()}%` }} 
          />
        </div>
        
        {status.limit_reached && (
          <div className="text-xs text-red-600 font-medium">
            Daily limit reached. Upgrade to Premium for more usage.
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionLimitIndicator;