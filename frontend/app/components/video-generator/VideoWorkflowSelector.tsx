'use client';

import React from 'react';

interface VideoWorkflowSelectorProps {
  workflowMode: 'simple' | 'advanced';
  setWorkflowMode: (mode: 'simple' | 'advanced') => void;
}

export default function VideoWorkflowSelector({ workflowMode, setWorkflowMode }: VideoWorkflowSelectorProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-center mb-6 text-gray-800">
        Choose Your Workflow
      </h2>
      
      <div className="flex gap-6 justify-center">
        <div
          onClick={() => setWorkflowMode('simple')}
          className={`cursor-pointer p-6 rounded-xl border-2 transition-all hover:scale-105 min-w-[250px] text-center ${
            workflowMode === 'simple'
              ? 'border-red-500 bg-red-50 shadow-lg'
              : 'border-gray-200 bg-white hover:border-red-300'
          }`}
        >
          <div className="text-3xl mb-3">🚀</div>
          <h3 className="font-bold text-lg mb-2 text-gray-800">Quick Generation</h3>
          <p className="text-sm text-gray-600">
            One-click video creation<br />
            Content → Video
          </p>
        </div>

        <div
          onClick={() => setWorkflowMode('advanced')}
          className={`cursor-pointer p-6 rounded-xl border-2 transition-all hover:scale-105 min-w-[250px] text-center ${
            workflowMode === 'advanced'
              ? 'border-red-500 bg-red-50 shadow-lg'
              : 'border-gray-200 bg-white hover:border-red-300'
          }`}
        >
          <div className="text-3xl mb-3">⚙️</div>
          <h3 className="font-bold text-lg mb-2 text-gray-800">Advanced Workflow</h3>
          <p className="text-sm text-gray-600">
            Step-by-step with editing<br />
            Content → Script → Edit → Video
          </p>
        </div>
      </div>
    </div>
  );
}