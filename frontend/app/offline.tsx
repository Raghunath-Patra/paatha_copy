// frontend/app/offline.tsx
'use client';

import React from 'react';

export default function Offline() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4">
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-md w-full text-center">
        <div className="text-4xl mb-4">📶</div>
        <h1 className="text-2xl font-medium mb-2">You're offline</h1>
        <p className="text-neutral-600 mb-4">
          Please check your internet connection to continue using Paaṭha AI.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}