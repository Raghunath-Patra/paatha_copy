// VideoProjectBrowser.tsx - Enhanced with better UI, shimmer effects, and blue-purple theme

'use client';

import React, { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../../utils/auth';
import VideoPlayerPopup from './VideoPlayerPopup';

// Define proper TypeScript interfaces
interface Project {
  projectId: string;
  title: string;
  createdAt: string;
  status: string;
  lessonStepsCount: number;
  speakers: string[];
  visualFunctions: string[];
  hasVideo: boolean;
  videoFiles: string[];
}

interface VideoProjectBrowserProps {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  onProjectAction: (projectId: string, action: string) => void;
  onCreateNew: () => void;
}

// Enhanced Skeleton Loading Components with Shimmer Effect
const ShimmerEffect = () => (
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
);

const ProjectCardSkeleton = () => (
  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 animate-pulse overflow-hidden relative">
    <ShimmerEffect />
    
    {/* Header */}
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1 pr-4">
        <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-4/5 mb-2"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-2/3"></div>
      </div>
      <div className="h-7 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
    </div>

    {/* Stats */}
    <div className="flex justify-between items-center text-sm mb-6">
      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24"></div>
      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-20"></div>
      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-28"></div>
    </div>

    {/* Action Buttons */}
    <div className="flex flex-wrap gap-2">
      <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-16"></div>
      <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-14"></div>
      <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-20"></div>
      <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-16"></div>
    </div>
  </div>
);

const ProjectGridSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-2 sm:p-3">
    <div className="w-full">
      {/* Header - Always Visible */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent flex items-center gap-3">
          <span className="text-3xl">📁</span>
          My Video Projects
        </h1>
        <div className="flex gap-3">
          <button
            disabled
            className="bg-gray-300 text-gray-500 px-4 py-2 rounded-xl font-medium cursor-not-allowed transition-all"
          >
            🔄 Refresh
          </button>
          <button
            disabled
            className="bg-gray-300 text-gray-500 px-6 py-2 rounded-xl font-medium cursor-not-allowed transition-all"
          >
            ➕ New Project
          </button>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>

    <style jsx>{`
      @keyframes shimmer {
        100% {
          transform: translateX(100%);
        }
      }
    `}</style>
  </div>
);

// Enhanced Empty State Component
const EmptyProjectsState = ({ onCreateNew }: { onCreateNew: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-2 sm:p-3">
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent flex items-center gap-3">
          <span className="text-3xl">📁</span>
          My Video Projects
        </h1>
        <div className="flex gap-3">
          <button
            disabled
            className="bg-gray-300 text-gray-500 px-4 py-2 rounded-xl font-medium cursor-not-allowed transition-all"
          >
            🔄 Refresh
          </button>
          <button
            onClick={onCreateNew}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-medium transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
          >
            ➕ New Project
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center py-16">
        <div className="mb-8">
          <div className="text-8xl mb-6 animate-bounce">📁</div>
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent mb-4">
            No Projects Found
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            You haven't created any video projects yet. Get started with AI-powered video creation and transform your ideas into professional videos!
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <button
            onClick={onCreateNew}
            className="group w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1 flex items-center justify-center space-x-3"
          >
            <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Start Creating</span>
          </button>
          
          <div className="flex items-center space-x-3 text-gray-500 text-lg">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>No experience required</span>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-blue-100 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-800">AI-Powered Creation</h3>
            <p className="text-gray-600 leading-relaxed">Advanced AI transforms your ideas into professional videos automatically with intelligent scene generation and voice synthesis.</p>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-purple-100 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-800">Minutes, Not Hours</h3>
            <p className="text-gray-600 leading-relaxed">Generate complete videos in minutes instead of spending days editing. From concept to final video in record time.</p>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-800">Professional Quality</h3>
            <p className="text-gray-600 leading-relaxed">Studio-quality output ready for any platform or presentation. Export in multiple formats and resolutions.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function VideoProjectBrowser({
  projects,
  setProjects,
  onProjectAction,
  onCreateNew
}: VideoProjectBrowserProps) {
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  
  // Video player state
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentVideoProject, setCurrentVideoProject] = useState<Project | null>(null);
  const [videoLoading, setVideoLoading] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    loadProjects();
  }, []);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (currentVideoUrl && currentVideoUrl.startsWith('blob:')) {
        console.log('🧹 Cleaning up blob URL on unmount');
        URL.revokeObjectURL(currentVideoUrl);
      }
    };
  }, [currentVideoUrl]);

  // Transform project data for frontend
  const transformProjectForFrontend = (project: any): Project => {
    return {
      projectId: project.id,
      title: project.title,
      createdAt: project.created_at,
      status: project.status,
      lessonStepsCount: project.lesson_steps?.length || 0,
      speakers: project.speakers?.map((s: any) => s.name) || [],
      visualFunctions: project.visualFunctions?.map((vf: any) => vf.function_name) || [],
      hasVideo: project.videos && project.videos.length > 0,
      videoFiles: project.videos?.map((v: any) => v.storage_path) || []
    };
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        console.error('Not authenticated');
        setProjects([]);
        return;
      }

      const response = await fetch(`${API_URL}/api/video-generator/projects`, {
        headers
      });
      const result = await response.json();
      
      if (result.success) {
        const transformedProjects = result.projects.map(transformProjectForFrontend);
        setProjects(transformedProjects);
      } else {
        console.error('Failed to load projects:', result.error);
        setProjects([]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        console.error('Not authenticated');
        return;
      }

      const response = await fetch(`${API_URL}/api/video-generator/project/${projectId}`, {
        method: 'DELETE',
        headers
      });
      
      if (response.ok) {
        setProjects(projects.filter(p => p.projectId !== projectId));
        setShowDeleteModal(false);
        setProjectToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  // Use signed URL approach for streaming
  const handlePlayVideo = async (project: Project) => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        alert('Please log in to play videos');
        return;
      }

      setVideoLoading(project.projectId);
      
      console.log('🎬 Getting video URL for project:', project.projectId);
      
      // Get signed URL for streaming
      const signedUrlResponse = await fetch(`${API_URL}/api/video-generator/stream/${project.projectId}`, {
        method: 'GET',
        headers
      });
      
      if (!signedUrlResponse.ok) {
        setVideoLoading(null);
        console.error('Video URL fetch failed:', signedUrlResponse.status);
        
        if (signedUrlResponse.status === 401 || signedUrlResponse.status === 403) {
          alert('Not authorized to access this video.');
        } else if (signedUrlResponse.status === 404) {
          alert('Video not found. It may still be processing.');
        } else {
          alert('Failed to get video URL. Please try again.');
        }
        return;
      }
      
      const urlData = await signedUrlResponse.json();
      console.log('✅ Video URL received:', urlData);
      
      if (!urlData.success || !urlData.streamUrl) {
        setVideoLoading(null);
        alert('Invalid video URL received.');
        return;
      }
      
      // Clean up any previous blob URL (just in case)
      if (currentVideoUrl && currentVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentVideoUrl);
      }
      
      // Use signed URL for streaming
      setCurrentVideoUrl(urlData.streamUrl);
      setCurrentVideoProject(project);
      setShowVideoPlayer(true);
      setVideoLoading(null);
      
    } catch (error) {
      console.error('❌ Error getting video URL:', error);
      setVideoLoading(null);
      alert('Error loading video. Please check your connection.');
    }
  };

  // Close video player and cleanup
  const handleCloseVideoPlayer = () => {
    // Clean up blob URL to free memory (only if it's a blob)
    if (currentVideoUrl && currentVideoUrl.startsWith('blob:')) {
      console.log('🧹 Cleaning up blob URL on close');
      URL.revokeObjectURL(currentVideoUrl);
    }
    
    setShowVideoPlayer(false);
    setCurrentVideoUrl('');
    setCurrentVideoProject(null);
  };

  const handleDownloadVideo = async (projectId: string) => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        console.error('Not authenticated');
        alert('Please log in to download videos');
        return;
      }

      const response = await fetch(`${API_URL}/api/video-generator/download/${projectId}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video-${projectId}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        console.error('Failed to download video');
        alert('Failed to download video. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading video:', error);
      alert('Error downloading video. Please try again.');
    }
  };

  // Helper function to map status to display info
  const getStatusInfo = (status: string) => {
    const statusMap = {
      'completed': { text: 'Video Ready', emoji: '✅', color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' },
      'script_ready': { text: 'Script Ready', emoji: '📝', color: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200' },
      'input_only': { text: 'Input Only', emoji: '📄', color: 'bg-gradient-to-r from-orange-100 to-orange-100 text-orange-800 border border-orange-200' },
      'empty': { text: 'Empty', emoji: '❓', color: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200' }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.empty;
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
  };

  // Show skeleton loading while loading
  if (loading) {
    return <ProjectGridSkeleton />;
  }

  // Show empty state only when no projects and not loading
  if (projects.length === 0) {
    return <EmptyProjectsState onCreateNew={onCreateNew} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent flex items-center gap-3">
            <span className="text-3xl">📁</span>
            My Video Projects
            <span className="text-sm font-normal bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full">
              {projects.length}
            </span>
          </h1>
          <div className="flex gap-3">
            <button
              onClick={loadProjects}
              className="bg-white/80 backdrop-blur-sm hover:bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-4 py-2 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
            >
              🔄 Refresh
            </button>
            <button
              onClick={onCreateNew}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-medium transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
            >
              ➕ New Project
            </button>
          </div>
        </div>

        {/* Enhanced Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {projects.map((project) => {
            const statusInfo = getStatusInfo(project.status);
            const createdDate = new Date(project.createdAt).toLocaleDateString();
            const isLoadingVideo = videoLoading === project.projectId;

            return (
              <div
                key={project.projectId}
                onClick={() => handleProjectClick(project)}
                className="group bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:bg-white"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 pr-3">
                    <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 text-lg group-hover:text-blue-700 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded-md inline-block">
                      ID: {project.projectId.substring(0, 8)}...
                    </p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${statusInfo.color} shadow-sm`}>
                    {statusInfo.emoji} {statusInfo.text}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex justify-between items-center text-sm text-gray-600 mb-6 bg-gray-50/50 rounded-xl p-3">
                  <div className="flex items-center gap-1">
                    <span>📅</span>
                    <span className="font-medium">{createdDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📋</span>
                    <span className="font-medium">{project.lessonStepsCount || 0} steps</span>
                  </div>
                  {project.hasVideo && (
                    <div className="flex items-center gap-1">
                      <span>🎬</span>
                      <span className="font-medium">{project.videoFiles?.length || 1} video(s)</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  {project.status === 'completed' && (
                    <button
                      onClick={() => handlePlayVideo(project)}
                      disabled={isLoadingVideo}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                        isLoadingVideo 
                          ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transform hover:-translate-y-0.5 shadow-lg hover:shadow-green-500/25'
                      }`}
                      title="Stream video (recommended)"
                    >
                      {isLoadingVideo ? (
                        <>
                          <span className="animate-spin inline-block mr-1">⏳</span>
                          Loading...
                        </>
                      ) : (
                        '▶️ Play'
                      )}
                    </button>
                  )}
                  
                  {(project.status === 'script_ready' || project.status === 'completed') && (
                    <button
                      onClick={() => onProjectAction(project.projectId, 'edit')}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-orange-500/25"
                    >
                      ✏️ Edit
                    </button>
                  )}
                  
                  {project.status === 'input_only' && (
                    <button
                      onClick={() => onProjectAction(project.projectId, 'continue')}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-blue-500/25"
                    >
                      ▶️ Continue
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDownloadVideo(project.projectId)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-indigo-500/25"
                  >
                    ⬇️ Download
                  </button>
                  <button
                    onClick={() => {
                      setProjectToDelete(project.projectId);
                      setShowDeleteModal(true);
                    }}
                    className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-red-500/25"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Video Player Popup */}
      {showVideoPlayer && currentVideoProject && (
        <VideoPlayerPopup
          isOpen={showVideoPlayer}        
          onClose={handleCloseVideoPlayer} 
          videoUrl={currentVideoUrl}
          projectTitle={currentVideoProject.title}
          projectId={currentVideoProject.projectId}
        />
      )}

      {/* Enhanced Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent flex items-center gap-2">
                📁 Project Details
              </h3>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
                <strong className="text-gray-700 block mb-1">Title:</strong>
                <p className="text-gray-900 font-medium">{selectedProject.title}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <strong className="text-gray-700 block mb-1">Status:</strong>
                  <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-medium ${getStatusInfo(selectedProject.status).color}`}>
                    {getStatusInfo(selectedProject.status).emoji} {getStatusInfo(selectedProject.status).text}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl">
                  <strong className="text-gray-700 block mb-1">Steps:</strong>
                  <p className="text-gray-900 font-medium">{selectedProject.lessonStepsCount || 0}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl">
                <strong className="text-gray-700 block mb-1">Created:</strong>
                <p className="text-gray-900 font-medium">{new Date(selectedProject.createdAt).toLocaleString()}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl">
                <strong className="text-gray-700 block mb-1">Speakers:</strong>
                <p className="text-gray-900 font-medium">{selectedProject.speakers?.join(', ') || 'None'}</p>
              </div>
              
              {selectedProject.visualFunctions?.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <strong className="text-gray-700 block mb-1">Visual Functions:</strong>
                  <p className="text-gray-900 font-medium">{selectedProject.visualFunctions.join(', ')}</p>
                </div>
              )}
              
              {selectedProject.hasVideo && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                  <strong className="text-gray-700 block mb-1">Videos:</strong>
                  <p className="text-gray-900 font-medium flex items-center gap-2">
                    🎬 {selectedProject.videoFiles?.length || 1} video(s) available
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3 mt-8">
              {selectedProject.status === 'completed' && (
                <button
                  onClick={() => {
                    handlePlayVideo(selectedProject);
                    setSelectedProject(null);
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-green-500/25"
                >
                  ▶️ Play Video
                </button>
              )}
              <button
                onClick={() => {
                  onProjectAction(selectedProject.projectId, 'edit');
                  setSelectedProject(null);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-blue-500/25"
              >
                ✏️ Edit Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                🗑️ Confirm Delete
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete this project?
              </p>
              <p className="text-red-600 font-semibold">
                ⚠️ This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => projectToDelete && handleDeleteProject(projectToDelete)}
                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-red-500/25"
              >
                🗑️ Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}