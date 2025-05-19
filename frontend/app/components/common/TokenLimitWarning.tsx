// frontend/app/components/common/TokenLimitWarning.tsx

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface TokenLimitWarningProps {
  isVisible: boolean;
  onClose?: () => void;  // Make onClose optional
  isPremium?: boolean;
  allowClose?: boolean;  // New prop to control if close button is shown
}

const TokenLimitWarning: React.FC<TokenLimitWarningProps> = ({
  isVisible,
  onClose,
  isPremium = false,
  allowClose = true  // Default to allowing close
}) => {
  if (!isVisible) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 relative">
      {/* Only show close button if allowClose is true and onClose is provided */}
      {allowClose && onClose && (
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
          aria-label="Close warning"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}

      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-red-800 text-base font-medium mb-1">
            Daily Usage Limit Reached
          </p>
          <p className="text-red-700 text-sm mb-3">
            {isPremium 
              ? "You've reached your daily usage limit. Your limit will reset at midnight IST."
              : "You've reached your daily usage limit. Upgrade to Premium for increased limits or try again tomorrow."}
          </p>
          
          {!isPremium && (
            <button
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/upgrade';
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Upgrade to Premium
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenLimitWarning;