// frontend/app/components/common/AllSubjectsButton.tsx

'use client';

import { Home } from 'lucide-react';

export default function AllSubjectsButton() {
  const handleHomeClick = () => {
    // Use direct window navigation instead of router
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