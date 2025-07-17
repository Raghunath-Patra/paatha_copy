'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import Navigation from '../components/navigation/Navigation';
import EnhancedSpinner from '../components/common/EnhancedSpinner';

// Import video generation components (we'll create these)
import VideoWorkflowSelector from '../components/video-generator/VideoWorkflowSelector';
import VideoContentInput from '../components/video-generator/VideoContentInput';
import VideoScriptEditor from '../components/video-generator/VideoScriptEditor';
import VideoGeneration from '../components/video-generator/VideoGeneration';
import VideoProjectBrowser from '../components/video-generator/VideoProjectBrowser';

export default function VideoGeneratorPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useSupabaseAuth();
  const [currentTab, setCurrentTab] = useState('projects');
  const [currentStep, setCurrentStep] = useState(1);
  const [workflowMode, setWorkflowMode] = useState<'simple' | 'advanced'>('simple');
  const [currentProject, setCurrentProject] = useState(null);
  const [slides, setSlides] = useState([]);
  const [allProjects, setAllProjects] = useState<any[]>([]); // Fix: Explicitly type as any[]

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <EnhancedSpinner size="lg" message="Loading video generator..." />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Navigation */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🎬 Video Generator</h1>
          <Navigation />
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6 gap-4 bg-white rounded-lg p-2 shadow-sm">
          <button
            onClick={() => setCurrentTab('projects')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentTab === 'projects'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📁 My Projects
          </button>
          <button
            onClick={() => setCurrentTab('create')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentTab === 'create'
                ? 'bg-red-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ➕ Create New
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {currentTab === 'projects' ? (
            <VideoProjectBrowser
              projects={allProjects}
              setProjects={setAllProjects}
              onProjectSelect={(project) => {
                setCurrentProject(project);
                setCurrentTab('create');
                setCurrentStep(2);
              }}
            />
          ) : (
            <div className="p-6">
              {/* Workflow Selector */}
              {currentStep === 1 && (
                <VideoWorkflowSelector
                  workflowMode={workflowMode}
                  setWorkflowMode={setWorkflowMode}
                />
              )}

              {/* Pipeline Steps */}
              {workflowMode === 'advanced' && (
                <div className="flex justify-center mb-8 gap-4">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                        currentStep === step
                          ? 'bg-red-500 text-white'
                          : currentStep > step
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                        {step}
                      </div>
                      <span className="text-sm font-medium">
                        {step === 1 ? 'Input Content' : step === 2 ? 'Edit Script' : 'Generate Video'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Step Content */}
              {currentStep === 1 && (
                <VideoContentInput
                  workflowMode={workflowMode}
                  onScriptGenerated={(project, projectSlides) => {
                    setCurrentProject(project);
                    setSlides(projectSlides);
                    setCurrentStep(2);
                  }}
                  onCompleteVideoGenerated={() => {
                    // Refresh projects and show success
                    setCurrentTab('projects');
                  }}
                />
              )}

              {currentStep === 2 && currentProject && (
                <VideoScriptEditor
                  project={currentProject}
                  slides={slides}
                  onSlidesUpdate={setSlides}
                  onProceedToVideo={() => setCurrentStep(3)}
                  onBackToInput={() => setCurrentStep(1)}
                />
              )}

              {currentStep === 3 && currentProject && (
                <VideoGeneration
                  project={currentProject}
                  slides={slides}
                  onVideoGenerated={() => {
                    // Refresh projects
                    setCurrentTab('projects');
                  }}
                  onBackToEditor={() => setCurrentStep(2)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}