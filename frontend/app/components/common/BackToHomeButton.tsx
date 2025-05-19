// frontend/app/components/common/BackToHomeButton.tsx

'use client';

import { Home } from 'lucide-react';

export default function BackToHomeButton() {
  const handleHomeClick = () => {
    window.location.href = '/';
  };

  return (
    <button
      onClick={handleHomeClick}
      className="p-2 rounded-lg bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 shadow-sm"
      title="Home"
    >
      <Home size={24} />
    </button>
  );
}