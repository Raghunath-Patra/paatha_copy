// File: frontend/app/video-generator/create/page.tsx (New project creation)
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import Navigation from '../../components/navigation/Navigation';
import CreditDisplay from '../components/credits/CreditDisplay';
import VideoWorkflowSelector from '../components/video-generator/VideoWorkflowSelector';
import VideoContentInput from '../components/video-generator/VideoContentInput';

export default function CreateVideoPage() {
  const router = useRouter();
  const { user } = useSupabaseAuth();
  const [workflowMode, setWorkflowMode] = useState<'simple' | 'advanced'>('simple');
  const [currentStep, setCurrentStep] = useState(1);

  const handleScriptGenerated = (project: any, slides: any[]) => {
    // Redirect to edit page for the newly created project
    router.push(`/video-generator/${project.id}/edit`);
  };

  const handleCompleteVideoGenerated = (projectId: string) => {
    // Redirect to play page for the completed project
    router.push(`/video-generator/${projectId}/play`);
  };

  const handleBackToProjects = () => {
    router.push('/video-generator');
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToProjects}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Projects
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Create New Video</h1>
          </div>
          {/* Credits and Navigation side by side */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <CreditDisplay />
            <Navigation />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6">
          {currentStep === 1 && (
            <>
              <VideoWorkflowSelector
                workflowMode={workflowMode}
                setWorkflowMode={setWorkflowMode}
              />
              <VideoContentInput
                workflowMode={workflowMode}
                onScriptGenerated={handleScriptGenerated}
                onCompleteVideoGenerated={handleCompleteVideoGenerated}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
