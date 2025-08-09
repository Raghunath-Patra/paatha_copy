// frontend/app/video-generator/hooks/useCreditRefresh.ts
// Simple hook that uses global events to refresh credits

'use client';

export const useCreditRefresh = () => {
  const refreshCredits = async () => {
    // Dispatch a custom event that the CreditDisplay component listens to
    window.dispatchEvent(new CustomEvent('refreshCredits'));
  };

  return { refreshCredits };
};

// Also export a direct function for convenience
export const refreshCreditsGlobally = () => {
  window.dispatchEvent(new CustomEvent('refreshCredits'));
};