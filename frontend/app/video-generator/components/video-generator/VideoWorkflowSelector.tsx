'use client';

import React from 'react';

interface VideoWorkflowSelectorProps {
  workflowMode: 'simple' | 'advanced';
  setWorkflowMode: (mode: 'simple' | 'advanced') => void;
}

export default function VideoWorkflowSelector({ workflowMode, setWorkflowMode }: VideoWorkflowSelectorProps) {
  return (
    <div className="mb-8 px-4 sm:px-6 lg:px-8">
      <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6 sm:mb-8 text-gray-800">
        Choose Your Workflow
      </h2>
      
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center max-w-4xl mx-auto">
        <div
          onClick={() => setWorkflowMode('simple')}
          className={`cursor-pointer p-6 sm:p-8 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg min-w-0 sm:min-w-[280px] text-center group ${
            workflowMode === 'simple'
              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg ring-2 ring-blue-200'
              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50'
          }`}
        >
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 transition-transform duration-300 group-hover:scale-110">🚀</div>
          <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 text-gray-800">
            Quick Generation
          </h3>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            One-click video creation<br />
            <span className="text-blue-600 font-medium">Content → Video</span>
          </p>
          <div className={`mt-4 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
            workflowMode === 'simple'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700'
          }`}>
            Perfect for beginners
          </div>
        </div>

        <div
          onClick={() => setWorkflowMode('advanced')}
          className={`cursor-pointer p-6 sm:p-8 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg min-w-0 sm:min-w-[280px] text-center group ${
            workflowMode === 'advanced'
              ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg ring-2 ring-purple-200'
              : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50'
          }`}
        >
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 transition-transform duration-300 group-hover:scale-110">⚙️</div>
          <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 text-gray-800">
            Advanced Workflow
          </h3>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Step-by-step with editing<br />
            <span className="text-purple-600 font-medium">Content → Script → Edit → Video</span>
          </p>
          <div className={`mt-4 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
            workflowMode === 'advanced'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-700'
          }`}>
            Full control & customization
          </div>
        </div>
      </div>
    </div>
  );
}