// frontend/app/video-generator/hooks/useCreditRefresh.ts
// Custom hook to access credit refresh functionality

'use client';

import { useContext } from 'react';
import { CreditContext } from '../components/navigation/Navigation';

export const useCreditRefresh = () => {
  const context = useContext(CreditContext);
  
  if (!context) {
    // Return a no-op function if context is not available
    console.warn('useCreditRefresh used outside of CreditContext. Refresh will not work.');
    return {
      refreshCredits: async () => {
        console.warn('Credit refresh not available outside of Navigation context');
      }
    };
  }
  
  return context;
};

// Alternative: Create a global credit refresh hook using a custom event system
export const useGlobalCreditRefresh = () => {
  const refreshCredits = async () => {
    // Dispatch a custom event that the Navigation component can listen to
    window.dispatchEvent(new CustomEvent('refreshCredits'));
  };

  return { refreshCredits };
};