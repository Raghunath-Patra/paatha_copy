// frontend/app/components/questions/PrefetchIndicator.tsx
import React from 'react';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface PrefetchIndicatorProps {
  isPrefetching: boolean;
  hasPrefetchedQuestion: boolean;
  prefetchError: string | null;
  className?: string;
}

const PrefetchIndicator: React.FC<PrefetchIndicatorProps> = ({
  isPrefetching,
  hasPrefetchedQuestion,
  prefetchError,
  className = ""
}) => {
  // Don't show anything if no prefetch activity
  if (!isPrefetching && !hasPrefetchedQuestion && !prefetchError) {
    return null;
  }

  const getIndicatorContent = () => {
    if (isPrefetching) {
      return {
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        text: "Preparing next question...",
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        borderColor: "border-blue-200"
      };
    }
    
    if (prefetchError) {
      return {
        icon: <AlertCircle className="w-3 h-3" />,
        text: "No more questions available",
        bgColor: "bg-orange-50",
        textColor: "text-orange-700",
        borderColor: "border-orange-200"
      };
    }
    
    if (hasPrefetchedQuestion) {
      return {
        icon: <CheckCircle className="w-3 h-3" />,
        text: "Next question ready!",
        bgColor: "bg-green-50",
        textColor: "text-green-700",
        borderColor: "border-green-200"
      };
    }
    
    return null;
  };

  const content = getIndicatorContent();
  if (!content) return null;

  return (
    <div className={`${content.bgColor} ${content.borderColor} ${content.textColor} border rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-2 shadow-sm ${className}`}>
      {content.icon}
      <span>{content.text}</span>
    </div>
  );
};

export default PrefetchIndicator;