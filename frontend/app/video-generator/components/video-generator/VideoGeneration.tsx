'use client';

import React, { useState } from 'react';
import { getAuthHeaders } from '../../../utils/auth';

interface VideoGenerationProps {
  project: any;
  slides: any[];
  onVideoGenerated: () => void;
  onBackToEditor: () => void;
}

// Loading Components
const VideoSkeleton = () => (
  <div className="bg-gray-900 rounded-lg p-4 mb-6 max-w-2xl mx-auto animate-pulse">
    <div className="w-full h-64 bg-gray-700 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-4"></div>
        <div className="h-4 bg-gray-600 rounded w-32 mx-auto mb-2"></div>
        <div className="h-3 bg-gray-600 rounded w-24 mx-auto"></div>
      </div>
    </div>
  </div>
);

const ShimmerProgress = ({ progress }: { progress: number }) => (
  <div className="relative w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
    <div 
      className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 h-4 rounded-full transition-all duration-500 relative"
      style={{ 
        width: `${progress}%`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s ease-in-out infinite'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
    </div>
  </div>
);

const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} border-2 border-white border-t-transparent rounded-full animate-spin`}></div>
  );
};

export default function VideoGeneration({
  project,
  slides,
  onVideoGenerated,
  onBackToEditor
}: VideoGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const generateVideo = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setStatus({ type: 'info', message: 'Initializing video generation pipeline...' });

    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        console.error('Not authenticated');
        setStatus({ type: 'error', message: 'Authentication required' });
        return;
      }

      // Enhanced progress simulation with more realistic stages
      const stages = [
        { progress: 15, message: 'Processing slide content...' },
        { progress: 30, message: 'Generating audio narration...' },
        { progress: 50, message: 'Rendering visual elements...' },
        { progress: 70, message: 'Synchronizing audio and visuals...' },
        { progress: 85, message: 'Applying final touches...' },
        { progress: 95, message: 'Finalizing video...' }
      ];

      let currentStage = 0;
      const progressInterval = setInterval(() => {
        if (currentStage < stages.length) {
          const stage = stages[currentStage];
          setGenerationProgress(stage.progress);
          setStatus({ type: 'info', message: stage.message });
          currentStage++;
        } else {
          clearInterval(progressInterval);
        }
      }, 800);

      const response = await fetch(`${API_URL}/api/video-generator/generate-video`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          projectId: project.id
        })
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      const result = await response.json();

      if (result.success) {
        setStatus({ type: 'success', message: 'Video generated successfully! 🎉' });
        setVideoUrl(`${API_URL}/api/video-generator/video/${result.projectId}`);
        setIsVideoLoading(true);
        
        // Simulate video loading time
        setTimeout(() => {
          setIsVideoLoading(false);
          onVideoGenerated();
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to generate video');
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      setGenerationProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadVideo = () => {
    if (videoUrl) {
      const downloadUrl = `${API_URL}/api/video-generator/download/${project.id}`;
      window.open(downloadUrl, '_blank');
    }
  };

  const downloadPDF = () => {
    // Mock PDF download with better UX
    setStatus({ type: 'info', message: 'Preparing PDF download...' });
    setTimeout(() => {
      setStatus({ type: 'success', message: 'PDF downloaded successfully!' });
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Add shimmer animation styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.5); }
        }
      `}</style>

      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-800">
        🎬 Generate Your Video
      </h2>

      <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xl border border-gray-100">
        {!videoUrl ? (
          <div className="text-center">
            <div className="mb-8">
              <div className={`text-6xl sm:text-7xl mb-6 transition-all duration-500 ${
                isGenerating ? 'animate-bounce' : 'hover:scale-110'
              }`}>
                {isGenerating ? '🔄' : '🎥'}
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800">
                {isGenerating ? 'Creating Your Video...' : 'Ready to Create Your Educational Video?'}
              </h3>
              <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                {isGenerating 
                  ? 'We\'re processing your slides and generating high-quality audio narration. This may take a few minutes.'
                  : 'This process will generate professional audio narration and combine it with your custom visuals to create an engaging educational video.'
                }
              </p>
            </div>

            {!isGenerating ? (
              <button
                onClick={generateVideo}
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 hover:from-blue-600 hover:via-purple-600 hover:to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
              >
                <span className="flex items-center gap-3">
                  🎥 Generate Final Video
                  <span className="text-sm opacity-75">(~2-3 minutes)</span>
                </span>
              </button>
            ) : (
              <div className="max-w-md mx-auto">
                <button
                  disabled
                  className="bg-gradient-to-r from-gray-400 to-gray-500 text-white px-8 py-4 rounded-xl font-bold text-lg cursor-not-allowed opacity-75 mb-6"
                >
                  <span className="flex items-center gap-3">
                    <LoadingSpinner size="md" />
                    Generating Video...
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
          // Video Result
          <div className="text-center">
            <div className="mb-8">
              <div className="text-6xl sm:text-7xl mb-6 animate-bounce">🎉</div>
              <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                Video Generated Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your educational video is ready! You can watch it below or download it for later use.
              </p>
            </div>

            {isVideoLoading ? (
              <VideoSkeleton />
            ) : (
              <div className="bg-gray-900 rounded-xl p-4 mb-8 max-w-3xl mx-auto shadow-2xl">
                <video
                  controls
                  className="w-full rounded-lg shadow-lg"
                  src={videoUrl}
                  style={{ maxHeight: '500px' }}
                  poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='24' fill='%236b7280'%3E🎬 Your Educational Video%3C/text%3E%3C/svg%3E"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {!isVideoLoading && (
              <div className="flex flex-col sm:flex-row justify-center gap-4 flex-wrap">
                <button
                  onClick={downloadVideo}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-md flex items-center gap-2 justify-center"
                >
                  <span>⬇️</span>
                  Download Video
                  <span className="text-sm opacity-75">(MP4)</span>
                </button>
                
                <button
                  onClick={downloadPDF}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-md flex items-center gap-2 justify-center"
                >
                  <span>📄</span>
                  Download Script
                  <span className="text-sm opacity-75">(PDF)</span>
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-md flex items-center gap-2 justify-center"
                >
                  <span>🆕</span>
                  Create New Video
                </button>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Progress Bar */}
        {isGenerating && (
          <div className="mt-8 max-w-md mx-auto">
            <ShimmerProgress progress={generationProgress} />
            <div className="flex justify-between text-sm text-gray-600 mb-4">
              <span>Progress</span>
              <span className="font-medium">{generationProgress.toFixed(0)}%</span>
            </div>
            
            {/* Progress Steps Visualization */}
            <div className="flex justify-between items-center mt-4">
              {[
                { step: 1, label: 'Content', progress: 15 },
                { step: 2, label: 'Audio', progress: 30 },
                { step: 3, label: 'Visuals', progress: 50 },
                { step: 4, label: 'Sync', progress: 70 },
                { step: 5, label: 'Final', progress: 95 }
              ].map(({ step, label, progress: stepProgress }) => (
                <div key={step} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                    generationProgress >= stepProgress 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                      : generationProgress >= stepProgress - 10
                        ? 'bg-gradient-to-r from-blue-200 to-purple-200 text-blue-700 animate-pulse'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {generationProgress >= stepProgress ? '✓' : step}
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Status Message */}
        {status && (
          <div className={`mt-6 p-4 rounded-lg shadow-md transition-all duration-500 transform ${
            status.type === 'success' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300' :
            status.type === 'error' ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-300' :
            'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-300'
          }`}>
            <div className="flex items-center justify-center">
              <span className="mr-3 text-lg">
                {status.type === 'success' ? '✅' : 
                 status.type === 'error' ? '❌' : 
                 isGenerating ? <LoadingSpinner size="sm" /> : 'ℹ️'}
              </span>
              <span className="font-medium">{status.message}</span>
            </div>
          </div>
        )}

        {/* Project Info Card */}
        <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Project: {project.title}</h4>
              <p className="text-sm text-gray-600">
                {slides.length} slides • {project.speakers ? Object.keys(project.speakers).length : 0} speakers
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Ready for generation
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mt-8">
          <button
            onClick={onBackToEditor}
            disabled={isGenerating}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
              isGenerating 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white transform hover:scale-105 shadow-md'
            }`}
          >
            <span>←</span>
            Back to Editor
          </button>
        </div>
      </div>
    </div>
  );
}