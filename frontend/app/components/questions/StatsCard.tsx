// frontend/app/components/questions/StatsCard.tsx

interface StatsCardProps {
    totalAttempts: number;
    averageScore: number;
  }
  
  const StatsCard = ({ totalAttempts, averageScore }: StatsCardProps) => {
    // Common classes for all metadata tags
    const tagClasses = "px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis";
  
    // Get color based on score
    const getScoreColor = (score: number) => {
      if (score >= 8) return 'text-green-600 bg-green-50';
      if (score >= 6) return 'text-yellow-600 bg-yellow-50';
      return 'text-red-600 bg-red-50';
    };
  
    return (
      <div className="flex items-center gap-3 py-2">
        <div className={`${tagClasses} bg-gray-100`}>
          {totalAttempts === 0 ? (
            "Be the first to attempt!"
          ) : (
            `${totalAttempts} ${totalAttempts === 1 ? 'attempt' : 'attempts'}`
          )}
        </div>
        
        {totalAttempts > 0 && (
          <div className={`${tagClasses} ${getScoreColor(averageScore)}`}>
            Average: {averageScore.toFixed(1)}/10
          </div>
        )}
      </div>
    );
  };
  
  export default StatsCard;