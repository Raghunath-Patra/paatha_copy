'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getAuthHeaders } from '../../../utils/auth';

interface VideoGenerationProps {
  projectId: string;
  onBackToEditor: () => void;
  onBackToProjects: () => void;
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

const VideoPlayerModal = ({ 
  videoUrl, 
  projectId, 
  projectTitle,
  onClose 
}: { 
  videoUrl: string; 
  projectId: string; 
  projectTitle?: string;
  onClose: () => void; 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleVideoLoad = () => {
    setIsLoading(false);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setError('Failed to load video. Please try again.');
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(projectTitle || 'educational_video').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${projectId.substring(0, 8)}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div 
        ref={containerRef}
        className={`relative bg-black rounded-lg overflow-hidden shadow-2xl ${
          isFullscreen ? 'w-full h-full' : 'max-w-4xl max-h-[90vh] w-full mx-4'
        }`}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent z-10 p-4">
          <div className="flex justify-between items-center text-white">
            <div>
              <h3 className="font-semibold text-lg">
                {projectTitle || 'Generated Educational Video'}
              </h3>
              <p className="text-sm text-gray-300">Project ID: {projectId.substring(0, 8)}...</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Download Video"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"/>
                </svg>
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Toggle Fullscreen"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zM16 4a1 1 0 00-1-1h-4a1 1 0 000 2h1.586l-2.293 2.293a1 1 0 001.414 1.414L13 6.414V8a1 1 0 002 0V4z"/>
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading video...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="mb-4">{error}</p>
                <button
                  onClick={onClose}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full max-h-[70vh] object-contain"
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Play/Pause Overlay */}
          {!isLoading && !error && (
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer group"
              onClick={togglePlayPause}
            >
              <div className={`bg-black/50 rounded-full p-4 transition-opacity ${
                isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
              }`}>
                {isPlaying ? (
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1zM14 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1z"/>
                  </svg>
                ) : (
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z"/>
                  </svg>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {!isLoading && !error && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(currentTime / duration) * 100}%, #6b7280 ${(currentTime / duration) * 100}%, #6b7280 100%)`
                }}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlayPause}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1zM14 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z"/>
                    </svg>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.76L4.83 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.83l3.553-3.76a1 1 0 011.617.76zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"/>
                      </svg>
                    ) : volume > 0.5 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.76L4.83 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.83l3.553-3.76a1 1 0 011.617.76zM12.146 6.146a.5.5 0 01.708 0 4.5 4.5 0 010 6.708.5.5 0 01-.708-.708 3.5 3.5 0 000-4.95.5.5 0 010-.708zm2.122-2.122a.5.5 0 01.708 0 8.5 8.5 0 010 12.708.5.5 0 01-.708-.708 7.5 7.5 0 000-10.292.5.5 0 010-.708z"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.76L4.83 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.83l3.553-3.76a1 1 0 011.617.76zM12.146 6.146a.5.5 0 01.708 0 4.5 4.5 0 010 6.708.5.5 0 01-.708-.708 3.5 3.5 0 000-4.95.5.5 0 010-.708z"/>
                      </svg>
                    )}
                  </button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <span className="text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">Video Player</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function VideoGeneration({
  projectId,
  onBackToEditor,
  onBackToProjects
}: VideoGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info' | 'existing'; message: string } | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Use ref to track intervals for cleanup
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoLoadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check for existing video on component mount
  useEffect(() => {
    checkExistingVideo();
  }, [projectId]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (videoLoadingTimeoutRef.current) {
        clearTimeout(videoLoadingTimeoutRef.current);
      }
    };
  }, []);

  const checkExistingVideo = async () => {
    try {
      setIsInitialLoading(true);
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        console.error('Not authenticated');
        setStatus({ type: 'error', message: 'Authentication required' });
        return;
      }

      // Check if video exists and get project title
      const response = await fetch(`${API_URL}/api/video-generator/project/${projectId}/video-status`, {
        headers
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Set project title from API response
        setProjectTitle(result.projectTitle || '');
        
        if (result.videoExists && result.videoUrl) {
          // Video already exists, show it directly
          setVideoUrl(result.videoUrl);
          setStatus({ 
            type: 'existing', 
            message: 'Video already exists! You can watch it, regenerate, or download it.' 
          });
        }
        // If video doesn't exist, component will show the generation interface
      } else {
        console.error('Failed to check video status:', result.error);
        // Don't show error for this, just proceed with generation interface
      }
    } catch (error) {
      console.error('Error checking existing video:', error);
      // Don't show error for this, just proceed with generation interface
    } finally {
      setIsInitialLoading(false);
    }
  };

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
      progressIntervalRef.current = setInterval(() => {
        if (currentStage < stages.length) {
          const stage = stages[currentStage];
          setGenerationProgress(stage.progress);
          setStatus({ type: 'info', message: stage.message });
          currentStage++;
        } else {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
        }
      }, 800);

      const response = await fetch(`${API_URL}/api/video-generator/generate-video`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          projectId: projectId
        })
      });

      // Clear interval when API call completes
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      setGenerationProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (result.success) {
        // Handle different backend responses
        if (result.useExisting) {
          // Video already existed and was up to date
          setStatus({ 
            type: 'existing', 
            message: `🎉 Video was already up to date! ${result.audioFilesReused ? `(Reused ${result.audioFilesReused} audio files)` : ''}` 
          });
        } else {
          // New video was generated
          setStatus({ 
            type: 'success', 
            message: `🎉 Video generated successfully! ${result.audioFilesReused ? `(Reused ${result.audioFilesReused} audio files for faster generation)` : ''}` 
          });
        }
        
        // Get the proper streaming URL
        const streamResponse = await fetch(`${API_URL}/api/video-generator/stream/${projectId}`, { 
          headers 
        });
        
        if (streamResponse.ok) {
          const streamResult = await streamResponse.json();
          if (streamResult.success && streamResult.streamUrl) {
            setVideoUrl(streamResult.streamUrl);
          } else {
            // Fallback to the old endpoint if stream fails
            setVideoUrl(`${API_URL}/api/video-generator/video/${result.projectId || projectId}`);
          }
        } else {
          // Fallback to the old endpoint if stream fails
          setVideoUrl(`${API_URL}/api/video-generator/video/${result.projectId || projectId}`);
        }
        
        setIsVideoLoading(true);
        
        // Simulate video loading time with proper cleanup
        videoLoadingTimeoutRef.current = setTimeout(() => {
          setIsVideoLoading(false);
          videoLoadingTimeoutRef.current = null;
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to generate video');
      }
    } catch (error) {
      console.error('Video generation error:', error);
      setStatus({ 
        type: 'error', 
        message: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      setGenerationProgress(0);
    } finally {
      setIsGenerating(false);
      // Ensure cleanup
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  };

  function getIndianDateString(): string {
    // Create a new date object
    const date = new Date();

    // Convert the date to IST (Indian Standard Time) by setting the timezone offset
    const indiaTime = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    // Extract day, month, and year
    const day = indiaTime.getDate().toString().padStart(2, '0');
    const month = (indiaTime.getMonth() + 1).toString().padStart(2, '0');
    const year = indiaTime.getFullYear();

    // Return date in "DD-MM-YYYY" format
    return `${day}-${month}-${year}`;
  }

  const downloadVideo = async () => {
    if (!videoUrl || !projectId) {
      setStatus({ type: 'error', message: 'Video not available for download' });
      return;
    }

    try {
      setStatus({ type: 'info', message: 'Preparing download...' });
      
      // Download directly from the videoUrl
      const response = await fetch(videoUrl);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(projectTitle || 'educational_video').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${getIndianDateString()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatus({ type: 'success', message: 'Download started successfully!' });
      
      // Clear status after 3 seconds
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error('Download error:', error);
      setStatus({ type: 'error', message: 'Download failed. Please try again.' });
    }
  };

  const downloadPDF = async () => {
    try {
      setStatus({ type: 'info', message: 'Preparing PDF download...' });
      
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) throw new Error('Authentication required');

      const response = await fetch(`${API_URL}/api/video-generator/project/${projectId}/export-pdf`, {
        headers
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(projectTitle || 'project').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_script.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus({ type: 'success', message: 'PDF downloaded successfully!' });
      
      // Clear status after 3 seconds
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error('PDF download error:', error);
      setStatus({ type: 'error', message: 'PDF download failed. Please try again.' });
    }
  };

  const createNewVideo = () => {
    // Clear all state before navigation
    setIsGenerating(false);
    setGenerationProgress(0);
    setStatus(null);
    setVideoUrl(null);
    setIsVideoLoading(false);
    
    // Clear any active timeouts/intervals
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (videoLoadingTimeoutRef.current) {
      clearTimeout(videoLoadingTimeoutRef.current);
      videoLoadingTimeoutRef.current = null;
    }
    
    // Navigate to create page
    window.location.href = '/video-generator/create';
  };

  // Enhanced skeleton loading component
  const GenerationSkeleton = () => (
    <div className="bg-white rounded-xl p-6 sm:p-8 shadow-xl border border-gray-100">
      <div className="text-center animate-pulse">
        {/* Icon skeleton */}
        <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-6"></div>
        
        {/* Title skeleton */}
        <div className="h-8 bg-gray-300 rounded-lg max-w-md mx-auto mb-4"></div>
        
        {/* Description skeleton */}
        <div className="space-y-2 mb-8">
          <div className="h-4 bg-gray-200 rounded max-w-2xl mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded max-w-xl mx-auto"></div>
        </div>
        
        {/* Button skeleton */}
        <div className="h-12 bg-gray-300 rounded-xl max-w-xs mx-auto mb-8"></div>
      </div>
      
      {/* Project info skeleton */}
      <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="animate-pulse">
            <div className="h-5 bg-gray-300 rounded max-w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded max-w-36"></div>
          </div>
          <div className="flex items-center gap-2 animate-pulse">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
      
      {/* Navigation skeleton */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 pt-6 border-t border-gray-200">
        <div className="h-12 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
      </div>
    </div>
  );

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

      {/* Show skeleton loading while checking for existing video */}
      {isInitialLoading ? (
        <GenerationSkeleton />
      ) : (
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
                    🎥 Generate Video
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
                  Video Ready!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your educational video is ready! You can watch it below, regenerate if needed, or download it for later use.
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
                    onError={() => {
                      console.error('Video failed to load');
                      setStatus({ type: 'error', message: 'Failed to load video. Please try regenerating.' });
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Play in Modal Button */}
                  <div className="mt-4">
                    <button
                      onClick={() => setShowVideoPlayer(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-md flex items-center gap-2 mx-auto"
                    >
                      <span>🎬</span>
                      Open in Full Player
                    </button>
                  </div>
                </div>
              )}

              {!isVideoLoading && (
                <div className="flex flex-col sm:flex-row justify-center gap-4 flex-wrap mb-6">
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
                    onClick={generateVideo}
                    disabled={isGenerating}
                    className={`${
                      isGenerating 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transform hover:scale-105'
                    } text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md flex items-center gap-2 justify-center`}
                  >
                    <span>{isGenerating ? '🔄' : '🔄'}</span>
                    {isGenerating ? 'Regenerating...' : 'Regenerate Video'}
                  </button>
                  
                  <button
                    onClick={createNewVideo}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-md flex items-center gap-2 justify-center"
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
              status.type === 'existing' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-300' :
              'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-300'
            }`}>
              <div className="flex items-center justify-center">
                <span className="mr-3 text-lg">
                  {status.type === 'success' ? '✅' : 
                   status.type === 'error' ? '❌' : 
                   status.type === 'existing' ? '📹' :
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
                <h4 className="font-semibold text-gray-800 mb-1">
                  {projectTitle || `Project ID: ${projectId.substring(0, 8)}...`}
                </h4>
                <p className="text-sm text-gray-600">
                  Educational Video Generation
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className={`w-2 h-2 rounded-full ${
                  isGenerating ? 'bg-yellow-500 animate-pulse' : 
                  videoUrl ? 'bg-blue-500' : 'bg-green-500'
                }`}></span>
                {isGenerating ? 'Generating...' : 
                 videoUrl ? 'Video ready' : 'Ready for generation'}
              </div>
            </div>
          </div>

          {/* Enhanced Navigation */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onBackToEditor}
              disabled={isGenerating}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 min-w-[160px] justify-center ${
                isGenerating 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transform hover:scale-105 shadow-md hover:shadow-lg'
              }`}
            >
              <span className="text-lg">✏️</span>
              Back to Editor
            </button>

            <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
            <span className="text-gray-400 text-sm sm:hidden">or</span>

            <button
              onClick={onBackToProjects}
              disabled={isGenerating}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 min-w-[160px] justify-center ${
                isGenerating 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white transform hover:scale-105 shadow-md hover:shadow-lg'
              }`}
            >
              <span className="text-lg">📁</span>
              Back to Projects
            </button>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {showVideoPlayer && videoUrl && (
        <VideoPlayerModal
          videoUrl={videoUrl}
          projectId={projectId}
          projectTitle={projectTitle}
          onClose={() => setShowVideoPlayer(false)}
        />
      )}
    </div>
  );
}