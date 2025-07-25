'use client';

import React, { useState, useRef } from 'react';
import { getAuthHeaders } from '../../../utils/auth';

// Custom CSS styles for animations
const styles = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .animate-shimmer {
    animation: shimmer 2s infinite linear;
  }

  @keyframes gradient-x {
    0%, 100% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(100%);
    }
  }

  .animate-gradient-x {
    animation: gradient-x 3s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
    }
    50% {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(147, 51, 234, 0.4);
    }
  }

  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  @keyframes slideInFromTop {
    0% {
      transform: translateY(-100%);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideOutToTop {
    0% {
      transform: translateY(0);
      opacity: 1;
    }
    100% {
      transform: translateY(-100%);
      opacity: 0;
    }
  }

  .animate-slide-in {
    animation: slideInFromTop 0.3s ease-out;
  }

  .animate-slide-out {
    animation: slideOutToTop 0.3s ease-in;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  @keyframes bounce-gentle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-5deg); }
    75% { transform: rotate(5deg); }
  }

  @keyframes scale-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-bounce-gentle {
    animation: bounce-gentle 2s ease-in-out infinite;
  }

  .animate-wiggle {
    animation: wiggle 1s ease-in-out infinite;
  }

  .animate-scale-pulse {
    animation: scale-pulse 2s ease-in-out infinite;
  }

  @keyframes fade-in-up {
    0% {
      opacity: 0;
      transform: translateY(30px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fade-out-down {
    0% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(30px);
    }
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.4s ease-out;
  }

  .animate-fade-out-down {
    animation: fade-out-down 0.3s ease-in;
  }
`;

interface VideoContentInputProps {
  workflowMode: 'simple' | 'advanced';
  onScriptGenerated: (project: any, slides: any[]) => void;
  onCompleteVideoGenerated: (projectId: string) => void;
}

// Project Title Popup Component
const ProjectTitlePopup = ({ 
  isVisible, 
  onSubmit, 
  onSkip, 
  isSubmitting 
}: {
  isVisible: boolean;
  onSubmit: (title: string) => void;
  onSkip: () => void;
  isSubmitting: boolean;
}) => {
  const [title, setTitle] = useState('');
  const [isExiting, setIsExiting] = useState(false);

  const handleSubmit = () => {
    if (title.trim()) {
      onSubmit(title.trim());
    }
  };

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(onSkip, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full ${
        isExiting ? 'animate-fade-out-down' : 'animate-fade-in-up'
      }`}>
        <div className="p-8">
          {/* Cute Header with Animation */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4 animate-bounce-gentle">🎬</div>
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              While AI works its magic...
            </h3>
            <p className="text-gray-600">
              Give your awesome project a catchy title! ✨
            </p>
          </div>

          {/* Animated Characters */}
          <div className="flex justify-center space-x-4 mb-6">
            <div className="text-3xl animate-wiggle">🤖</div>
            <div className="text-3xl animate-scale-pulse">💡</div>
            <div className="text-3xl animate-float">🎨</div>
          </div>

          {/* Input Field */}
          <div className="mb-6">
            <label htmlFor="projectTitle" className="block text-sm font-semibold text-gray-700 mb-2">
              Project Title
            </label>
            <input
              id="projectTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chemical Reactions Explained, Math Made Easy..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition-all duration-300 text-lg"
              maxLength={100}
              disabled={isSubmitting}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <div className="text-xs text-right text-gray-500 mt-1">
              {title.length}/100 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || isSubmitting}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                '✨ Set Title'
              )}
            </button>
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-semibold transition-all duration-300 disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>

          {/* Fun Loading Message */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <span className="ml-2">AI is creating something amazing!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loading Component
const ContentInputSkeleton = () => (
  <div className="max-w-4xl mx-auto animate-pulse">
    {/* Title Skeleton */}
    <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg mb-6 w-2/3 mx-auto"></div>

    {/* Quick Actions Skeleton */}
    <div className="flex gap-4 justify-center mb-6 flex-wrap">
      <div className="h-12 w-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg"></div>
    </div>

    {/* File Upload Skeleton */}
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
      <div className="w-16 h-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-full mx-auto mb-4"></div>
      <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-48 mx-auto mb-2"></div>
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-64 mx-auto"></div>
    </div>

    {/* OR Divider Skeleton */}
    <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-8 mx-auto mb-6"></div>

    {/* Content Input Skeleton */}
    <div className="mb-6">
      <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-80 mb-3"></div>
      <div className="w-full h-80 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg"></div>
    </div>

    {/* Action Button Skeleton */}
    <div className="text-center mb-6">
      <div className="h-16 w-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg mx-auto"></div>
    </div>
  </div>
);

// Enhanced File Upload Area
const FileUploadArea = ({ 
  onFileUpload, 
  fileInputRef, 
  isGenerating 
}: { 
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isGenerating: boolean;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/markdown' || file.name.endsWith('.md') || file.type === 'text/plain') {
        // Create a proper FileList-like object and simulate the input change
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        
        if (fileInputRef.current) {
          fileInputRef.current.files = dataTransfer.files;
          const event = new Event('change', { bubbles: true });
          fileInputRef.current.dispatchEvent(event);
        }
      }
    }
  };

  return (
    <div
      onClick={() => !isGenerating && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 cursor-pointer transition-all duration-300 ${
        isDragOver
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg transform scale-[1.02]'
          : isGenerating
          ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-50'
          : 'border-blue-300 hover:border-purple-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:shadow-md hover:transform hover:scale-[1.01]'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt"
        onChange={onFileUpload}
        className="hidden"
        disabled={isGenerating}
      />
      <div className={`text-6xl mb-4 transition-all duration-300 ${
        isDragOver ? 'animate-bounce' : ''
      }`}>
        {isDragOver ? '📤' : '📄'}
      </div>
      <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        {isDragOver ? 'Drop your file here!' : 'Upload Content File'}
      </h3>
      <p className="text-gray-600 mb-2">
        {isDragOver 
          ? 'Release to upload your markdown file'
          : 'Click here or drag and drop a .md or .txt file'
        }
      </p>
      <p className="text-sm text-gray-500">
        Supports: Markdown (.md), Text (.txt)
      </p>
    </div>
  );
};

// Enhanced Progress Bar
const ProgressBar = ({ 
  isGenerating, 
  progress, 
  message 
}: { 
  isGenerating: boolean;
  progress: number;
  message: string;
}) => {
  if (!isGenerating) return null;

  return (
    <div className="mb-6 bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800 flex items-center">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          Processing Your Content
        </h4>
        <span className="text-sm font-medium text-gray-600">{progress.toFixed(0)}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
        <div 
          className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 bg-[length:200%_100%] animate-shimmer transition-all duration-500 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{message}</span>
        <span className="text-blue-600 font-medium">Please wait...</span>
      </div>
    </div>
  );
};

export default function VideoContentInput({ 
  workflowMode, 
  onScriptGenerated, 
  onCompleteVideoGenerated 
}: VideoContentInputProps) {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [fileUploadNotification, setFileUploadNotification] = useState<{ message: string; isVisible: boolean; isExiting: boolean } | null>(null);
  const [showTitlePopup, setShowTitlePopup] = useState(false);
  const [isSubmittingTitle, setIsSubmittingTitle] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setContent(e.target?.result as string);
        
        // Show notification
        const message = `File "${file.name}" loaded successfully! ${(e.target?.result as string).length} characters loaded.`;
        setFileUploadNotification({ message, isVisible: true, isExiting: false });
        
        // Start exit animation after 2.5 seconds
        setTimeout(() => {
          setFileUploadNotification(prev => 
            prev ? { ...prev, isExiting: true } : null
          );
        }, 2500);
        
        // Remove notification completely after animation
        setTimeout(() => {
          setFileUploadNotification(null);
        }, 2800);
      };
      reader.readAsText(file);
    }
  };

  const simulateProgress = (callback: () => void) => {
    setGenerationProgress(0);
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return Math.min(prev + Math.random() * 3, 90);
      });
    }, 900);

    // Call the actual API
    callback();

    return interval;
  };

  const handleTitleSubmit = async (title: string) => {
    if (!currentProjectId) return;
    
    setIsSubmittingTitle(true);
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_URL}/api/video-generator/update-project-title`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ 
          projectId: currentProjectId, 
          title: title 
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowTitlePopup(false);
      } else {
        console.error('Failed to update project title:', result.error);
      }
    } catch (error) {
      console.error('Error updating project title:', error);
    } finally {
      setIsSubmittingTitle(false);
    }
  };

  const handleTitleSkip = () => {
    setShowTitlePopup(false);
  };

  const generateVideo = async () => {
    if (!content.trim()) {
      setStatus({ type: 'error', message: 'Please enter some content or upload a file first.' });
      return;
    }

    setIsGenerating(true);
    
    // Determine the workflow and set appropriate status message
    if (workflowMode === 'simple') {
      setStatus({ type: 'info', message: 'Generating your complete video... This may take 5-15 minutes.' });
    } else {
      setStatus({ type: 'info', message: 'Generating script and visual elements...' });
    }

    const progressInterval = simulateProgress(async () => {
      try {
        const { headers, isAuthorized } = await getAuthHeaders();
        
        if (!isAuthorized) {
          throw new Error('Authentication required');
        }

        // First generate script
        setStatus({ type: 'info', message: 'Creating script and visual elements...' });
        const scriptResponse = await fetch(`${API_URL}/api/video-generator/generate-script`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ content }),
        });

        const scriptResult = await scriptResponse.json();

        if (!scriptResult.success) {
          throw new Error(scriptResult.error || 'Failed to generate script');
        }

        // Store project ID and show title popup
        setCurrentProjectId(scriptResult.project.id);
        setShowTitlePopup(true);

        // For simple workflow, continue with video generation
        if (workflowMode === 'simple') {
          setGenerationProgress(50);
          setStatus({ type: 'info', message: 'Script created! Now generating video with AI narration...' });

          const videoResponse = await fetch(`${API_URL}/api/video-generator/generate-video`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ projectId: scriptResult.project.id }),
          });

          const videoResult = await videoResponse.json();

          clearInterval(progressInterval);
          setGenerationProgress(100);

          if (videoResult.success) {
            setStatus({ type: 'success', message: '🎉 Complete video generated successfully!' });
            setTimeout(() => {
              onCompleteVideoGenerated(videoResult.projectId);
            }, 2000);
            // Auto-hide success message after 3 seconds
            setTimeout(() => {
              setStatus(null);
            }, 3000);
          } else {
            throw new Error(videoResult.error || 'Failed to generate video');
          }
        } else {
          // For advanced workflow, just finish with script
          clearInterval(progressInterval);
          setGenerationProgress(100);
          
          setStatus({ type: 'success', message: '✅ Script generated successfully!' });
          setTimeout(() => {
            onScriptGenerated(scriptResult.project, scriptResult.project.lessonSteps);
          }, 1500);
          // Auto-hide success message after 3 seconds
          setTimeout(() => {
            setStatus(null);
          }, 3000);
        }
      } catch (error) {
        clearInterval(progressInterval);
        setGenerationProgress(0);
        setStatus({ 
          type: 'error', 
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
      } finally {
        setIsGenerating(false);
      }
    });
  };

  // Show skeleton loading during initial load if needed
  if (isInitialLoading) {
    return <ContentInputSkeleton />;
  }

  return (
    <>
      {/* Inject custom CSS styles */}
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {/* Project Title Popup */}
      <ProjectTitlePopup
        isVisible={showTitlePopup}
        onSubmit={handleTitleSubmit}
        onSkip={handleTitleSkip}
        isSubmitting={isSubmittingTitle}
      />
      
      {/* File Upload Notification */}
      {fileUploadNotification && (
        <div className={`fixed top-4 right-4 z-50 max-w-md ${
          fileUploadNotification.isExiting ? 'animate-slide-out' : 'animate-slide-in'
        }`}>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-500 text-white font-bold">
                ✓
              </div>
              <div className="flex-1">
                <div className="font-semibold text-green-800">Success!</div>
                <div className="text-green-700">{fileUploadNotification.message}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
      {/* Enhanced Header with Gradient Text */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
            📝 Create Your Educational Content
          </span>
        </h2>
        <p className="text-gray-600 text-lg md:text-xl lg:text-2xl">
          Transform your ideas into engaging video content with AI-powered generation
        </p>
      </div>

      {/* Enhanced File Upload */}
      <FileUploadArea 
        onFileUpload={handleFileUpload}
        fileInputRef={fileInputRef}
        isGenerating={isGenerating}
      />

      {/* Enhanced OR Divider */}
      <div className="relative text-center text-gray-500 font-semibold mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        </div>
        <div className="relative inline-block bg-gray-50 px-6 py-2 rounded-full border border-gray-200">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold text-lg md:text-xl">
            OR
          </span>
        </div>
      </div>

      {/* Enhanced Content Input */}
      <div className="mb-8">
        <label htmlFor="contentInput" className="block text-xl md:text-2xl lg:text-3xl font-bold mb-4">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ✏️ Enter your educational content
          </span>
        </label>
        <div className="relative">
          <textarea
            id="contentInput"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isGenerating}
            className="w-full h-80 p-6 border-2 border-gray-300 rounded-xl font-mono text-sm md:text-base lg:text-lg resize-vertical focus:border-blue-500 focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-inner"
            placeholder="# Your Educational Content

## Activity 2.1: Understanding Chemical Reactions

* Collect the following solutions from the laboratory...
* Test each solution with indicators...

### Expected Observations:
- Acids turn blue litmus red
- Bases turn red litmus blue

**Learning Objectives:**
Students will understand the properties of acids and bases through hands-on experimentation.

---

Start typing or paste your content here. Supports Markdown formatting for better structure!"
          />
          {/* Character Counter */}
          <div className="absolute bottom-4 right-4 text-xs md:text-sm text-gray-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded">
            {content.length.toLocaleString()} characters
          </div>
        </div>
        <div className="mt-3 text-sm md:text-base text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 mt-0.5 text-lg md:text-xl">💡</span>
            <div>
              <strong className="text-blue-800">Pro Tips:</strong>
              <ul className="mt-2 space-y-1 text-blue-700">
                <li>• Use Markdown formatting (# headers, * bullets, **bold**)</li>
                <li>• Include learning objectives and key concepts</li>
                <li>• Add examples and practical applications</li>
                <li>• Structure content with clear sections</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Single Generate Button */}
      <div className="text-center mb-8">
        <button
          onClick={generateVideo}
          disabled={isGenerating || !content.trim()}
          className="group relative overflow-hidden bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white px-12 py-5 rounded-xl font-bold text-xl md:text-2xl lg:text-3xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:-translate-y-2 hover:animate-pulse-glow"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -skew-x-12 -translate-x-full group-hover:animate-gradient-x transition-transform duration-1000"></div>
          <span className="relative flex items-center justify-center space-x-3">
            <span className="text-2xl md:text-3xl lg:text-4xl">
              {workflowMode === 'simple' ? '🎬' : '📝'}
            </span>
            <span>
              {isGenerating 
                ? 'Generating Magic...' 
                : workflowMode === 'simple' 
                  ? 'Generate Complete Video' 
                  : 'Generate Script & Visuals'
              }
            </span>
          </span>
        </button>
      </div>

      {/* Enhanced Progress Bar */}
      <ProgressBar 
        isGenerating={isGenerating}
        progress={generationProgress}
        message={status?.message || 'Processing...'}
      />

      {/* Enhanced Status Message */}
      {status && !isGenerating && (
        <div className={`p-6 rounded-xl mb-8 shadow-lg border-l-4 ${
          status.type === 'success' 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500 text-green-800' :
          status.type === 'error' 
            ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-500 text-red-800' :
            'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-500 text-blue-800'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold ${
              status.type === 'success' ? 'bg-green-500' :
              status.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}>
              {status.type === 'success' ? '✓' : 
               status.type === 'error' ? '✕' : 'ℹ'}
            </div>
            <div className="flex-1">
              <div className="font-semibold mb-1">
                {status.type === 'success' && 'Success!'}
                {status.type === 'error' && 'Error'}
                {status.type === 'info' && 'Information'}
              </div>
              <div>{status.message}</div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}