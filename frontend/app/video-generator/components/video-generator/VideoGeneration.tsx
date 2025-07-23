'use client';

import React, { useState } from 'react';
import { getAuthHeaders } from '../../../utils/auth';

interface VideoGenerationProps {
  project: any;
  slides: any[];
  onVideoGenerated: () => void;
  onBackToEditor: () => void;
}

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

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const generateVideo = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setStatus({ type: 'info', message: 'Generating video with optimized processing...' });

    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        console.error('Not authenticated');
        setStatus({ type: 'error', message: 'Authentication required' });
        return;
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      const response = await fetch(`${API_URL}/api/video-generator/generate-video`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          projectId: project.id // Updated to match server expectation
        })
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      const result = await response.json();

      if (result.success) {
        setStatus({ type: 'success', message: 'Video generated successfully!' });
        // Updated to construct video URL from server response
        setVideoUrl(`${API_URL}/api/video-generator/video/${result.projectId}`);
        
        // Delay before calling onVideoGenerated to show success state
        setTimeout(() => {
          onVideoGenerated();
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to generate video');
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      setGenerationProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadVideo = () => {
    if (videoUrl) {
      // Updated to use download endpoint
      const downloadUrl = `${API_URL}/api/video-generator/download/${project.id}`;
      window.open(downloadUrl, '_blank');
    }
  };

  const downloadPDF = () => {
    // Mock PDF download
    alert('PDF download functionality would be implemented here');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        🎬 Generate Your Video
      </h2>

      <div className="bg-white rounded-lg p-8 shadow-lg">
        {!videoUrl ? (
          <div className="text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">🎥</div>
              <p className="text-lg text-gray-600 mb-8">
                Ready to create your educational video? This process will generate audio narration and combine it with your visuals.
              </p>
            </div>

            <button
              onClick={generateVideo}
              disabled={isGenerating}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? '🔄 Generating...' : '🎥 Generate Final Video'}
            </button>
          </div>
        ) : (
          // Video Result
          <div className="text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-green-600 mb-4">
                Video Generated Successfully!
              </h3>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
              <video
                controls
                className="w-full rounded-lg"
                src={videoUrl}
                style={{ maxHeight: '400px' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={downloadVideo}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                ⬇️ Download Video
              </button>
              <button
                onClick={downloadPDF}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                📄 Download PDF Report
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                🆕 Create New Video
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isGenerating && (
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-red-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-gray-600">
              {generationProgress.toFixed(0)}% complete
            </p>
          </div>
        )}

        {/* Status Message */}
        {status && (
          <div className={`mt-6 p-4 rounded-lg ${
            status.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
            status.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
            'bg-blue-100 text-blue-800 border border-blue-300'
          }`}>
            {status.message}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-center mt-8">
          <button
            onClick={onBackToEditor}
            disabled={isGenerating}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Back to Editor
          </button>
        </div>
      </div>
    </div>
  );
}