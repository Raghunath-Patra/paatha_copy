// VideoProjectBrowser.tsx - Refactored for two-row button layout and improved UI
'use client';

import React, { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../../utils/auth';
import VideoPlayerPopup from './VideoPlayerPopup';

// region --- Icon Components ---
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const ContinueIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const LoadingIcon = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
// endregion

// region --- Type Definitions ---
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
// endregion

// region --- Skeleton Loading Components ---
const ShimmerEffect = () => (
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
);

const ProjectCardSkeleton = () => (
    <div className="bg-white rounded-xl p-5 shadow-lg border border-gray-100 animate-pulse overflow-hidden relative w-full flex flex-col">
      <ShimmerEffect />
      <div className="flex-grow">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-4">
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-4/5 mb-2"></div>
            </div>
            <div className="h-7 w-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
          </div>
  
          {/* Stats */}
          <div className="flex justify-between items-center text-sm mb-5">
            <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-28"></div>
            <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24"></div>
            <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32"></div>
          </div>
      </div>
  
      {/* Action Buttons Skeleton */}
      <div className="flex flex-col gap-2 mt-auto">
          <div className="flex gap-2">
              <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg flex-1"></div>
              <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg flex-1"></div>
          </div>
          <div className="flex gap-2">
              <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg flex-1"></div>
              <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg flex-1"></div>
          </div>
      </div>
    </div>
  );

const ProjectGridSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-2 sm:p-3">
    <div className="w-[90%] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
          My Video Projects
        </h1>
        <div className="flex gap-3">
          <button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded-xl font-medium cursor-not-allowed">
            Refresh
          </button>
          <button disabled className="bg-gray-300 text-gray-500 px-6 py-2 rounded-xl font-medium cursor-not-allowed">
            New Project
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
        100% { transform: translateX(100%); }
      }
    `}</style>
  </div>
);
// endregion

// region --- Empty State Component ---
const EmptyProjectsState = ({ onCreateNew }: { onCreateNew: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-2 sm:p-3">
    <div className="w-[90%] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
          My Video Projects
        </h1>
        <button
          onClick={onCreateNew}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-medium transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
        >
          ➕ New Project
        </button>
      </div>

      {/* Hero Section */}
      <div className="text-center py-16">
        <div className="text-8xl mb-6 animate-bounce">📁</div>
        <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent mb-4">
          No Projects Found
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          You haven't created any video projects yet. Let's change that!
        </p>
        <button
          onClick={onCreateNew}
          className="group w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1"
        >
          Start Creating
        </button>
      </div>
    </div>
  </div>
);
// endregion

export default function VideoProjectBrowser({
  projects,
  setProjects,
  onProjectAction,
  onCreateNew
}: VideoProjectBrowserProps) {
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentVideoProject, setCurrentVideoProject] = useState<Project | null>(null);
  const [videoLoading, setVideoLoading] = useState<string | null>(null);

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    return () => {
      if (currentVideoUrl && currentVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentVideoUrl);
      }
    };
  }, [currentVideoUrl]);

  const transformProjectForFrontend = (project: any): Project => ({
    projectId: project.id,
    title: project.title,
    createdAt: project.created_at,
    status: project.status,
    lessonStepsCount: project.lesson_steps?.length || 0,
    speakers: project.speakers?.map((s: any) => s.name) || [],
    visualFunctions: project.visualFunctions?.map((vf: any) => vf.function_name) || [],
    hasVideo: project.videos && project.videos.length > 0,
    videoFiles: project.videos?.map((v: any) => v.storage_path) || []
  });

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) {
        setProjects([]);
        return;
      }
      const response = await fetch(`${API_URL}/api/video-generator/projects`, { headers });
      const result = await response.json();
      setProjects(result.success ? result.projects.map(transformProjectForFrontend) : []);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTitle = async (projectId: string, title: string) => {
    const originalProject = projects.find(p => p.projectId === projectId);
    const trimmedTitle = title.trim();

    // Exit if title is empty or unchanged
    if (!trimmedTitle || (originalProject && originalProject.title === trimmedTitle)) {
        setEditingProjectId(null);
        return;
    }

    const { headers, isAuthorized } = await getAuthHeaders();
    if (!isAuthorized) return;

    try {
      const response = await fetch(`${API_URL}/api/video-generator/update-project-title`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: projectId,
          title: trimmedTitle
        }),
      });

      if (response.ok) {
        setProjects(projects.map(p => p.projectId === projectId ? { ...p, title: trimmedTitle } : p));
      } else {
        console.error('Failed to update title');
        // Optionally, revert or show an error to the user
      }
    } catch (error) {
      console.error('Error updating project title:', error);
    } finally {
      setEditingProjectId(null);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) return;

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

  const handlePlayVideo = async (project: Project) => {
    setVideoLoading(project.projectId);
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/video-generator/stream/${project.projectId}`, { headers });
      if (!response.ok) throw new Error(`Failed to get stream URL: ${response.statusText}`);
      
      const data = await response.json();
      if (!data.success || !data.streamUrl) throw new Error('Invalid stream URL received');
      
      if (currentVideoUrl && currentVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentVideoUrl);
      }
      
      setCurrentVideoUrl(data.streamUrl);
      setCurrentVideoProject(project);
      setShowVideoPlayer(true);
    } catch (error) {
      console.error('Error preparing video for playback:', error);
      alert('Could not load video. It might still be processing or an error occurred.');
    } finally {
      setVideoLoading(null);
    }
  };

  const handleCloseVideoPlayer = () => {
    if (currentVideoUrl && currentVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentVideoUrl);
    }
    setShowVideoPlayer(false);
    setCurrentVideoUrl('');
    setCurrentVideoProject(null);
  };

  const handleDownloadVideo = async (projectId: string) => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/video-generator/download/${projectId}`, { headers });
      if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-${projectId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading video:', error);
      alert('Failed to download video.');
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      'completed': { text: 'Video Ready', emoji: '✅', color: 'bg-green-100 text-green-800 border-green-200' },
      'script_ready': { text: 'Script Ready', emoji: '📝', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'input_only': { text: 'Input Only', emoji: '📄', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      'empty': { text: 'Empty', emoji: '❓', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.empty;
  };

  if (loading) {
    return <ProjectGridSkeleton />;
  }

  if (projects.length === 0) {
    return <EmptyProjectsState onCreateNew={onCreateNew} />;
  }

  const baseButtonClass = "flex-1 flex justify-center items-center px-2 py-2.5 rounded-lg text-white font-semibold transition-all shadow-sm transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:bg-gray-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-2 sm:p-3">
      <div className="w-[90%] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent flex items-center gap-3">
            My Video Projects
            <span className="text-sm font-normal bg-blue-600 text-white px-3 py-1 rounded-full">
              {projects.length}
            </span>
          </h1>
          <div className="flex gap-3">
            <button
              onClick={loadProjects}
              className="bg-white/80 backdrop-blur-sm hover:bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
            >
              Refresh
            </button>
            <button
              onClick={onCreateNew}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl font-medium transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
            >
              New Project
            </button>
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {projects.map((project) => {
            const statusInfo = getStatusInfo(project.status);
            const createdDate = new Date(project.createdAt).toLocaleDateString();
            const isLoadingVideo = videoLoading === project.projectId;

            const showFirstRow = project.status === 'completed';
            const isEditing = editingProjectId === project.projectId;

            return (
              <div
                key={project.projectId}
                className="group bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1 hover:bg-white w-full flex flex-col"
              >
                <div className="flex-grow">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          onBlur={() => handleUpdateTitle(project.projectId, newTitle)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateTitle(project.projectId, newTitle);
                            if (e.key === 'Escape') setEditingProjectId(null);
                          }}
                          className="w-full p-1 rounded-md border-2 border-blue-500"
                          autoFocus
                        />
                      ) : (
                        <h3
                          className="font-bold text-gray-800 mb-1.5 line-clamp-2 text-lg group-hover:text-blue-700 cursor-pointer"
                          onClick={() => {
                            setEditingProjectId(project.projectId);
                            setNewTitle(project.title);
                          }}
                        >
                          {project.title}
                        </h3>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-sm font-semibold ${statusInfo.color} shadow-sm whitespace-nowrap`}>
                      {statusInfo.emoji} {statusInfo.text}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-4 bg-gray-50/50 rounded-lg p-3">
                    <div title="Creation Date">📅 {createdDate}</div>
                    <div title="Lesson Steps">📋 {project.lessonStepsCount || 0} steps</div>
                    {project.hasVideo && <div title="Video Files">🎬 {project.videoFiles?.length || 1} video(s)</div>}
                  </div>
                </div>

                {/* Action Buttons: Two-row layout */}
                <div className="flex flex-col gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                    {/* --- ROW 1: Play & Download --- */}
                    {showFirstRow && (
                        <div className="flex gap-2">
                             <button
                                onClick={() => handlePlayVideo(project)}
                                disabled={isLoadingVideo}
                                className={`${baseButtonClass} bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600`}
                                title="Play Video"
                            >
                                {isLoadingVideo ? <LoadingIcon /> : <PlayIcon />}
                                <span className="ml-2 text-xs sm:text-sm">Play</span>
                            </button>
                             <button
                                onClick={() => handleDownloadVideo(project.projectId)}
                                className={`${baseButtonClass} bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600`}
                                title="Download Video"
                            >
                                <DownloadIcon />
                               <span className="ml-2 text-xs sm:text-sm">Download</span>
                            </button>
                        </div>
                    )}

                    {/* --- ROW 2: Edit & Delete --- */}
                    <div className="flex gap-2">
                        {(project.status === 'script_ready' || project.status === 'completed') && (
                            <button
                              onClick={() => onProjectAction(project.projectId, 'edit')}
                              className={`${baseButtonClass} bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600`}
                              title="Edit Project"
                            >
                              <EditIcon />
                              <span className="ml-2 text-xs sm:text-sm">Edit</span>
                            </button>
                        )}
                        {project.status === 'input_only' && (
                            <button
                              onClick={() => onProjectAction(project.projectId, 'continue')}
                              className={`${baseButtonClass} bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700`}
                              title="Continue Project"
                            >
                              <ContinueIcon />
                              <span className="ml-2 text-xs sm:text-sm">Continue</span>
                            </button>
                        )}
                        <button
                            onClick={() => {
                              setProjectToDelete(project.projectId);
                              setShowDeleteModal(true);
                            }}
                            className={`${baseButtonClass} bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600`}
                            title="Delete Project"
                          >
                            <DeleteIcon />
                             <span className="ml-2 text-xs sm:text-sm">Delete</span>
                        </button>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Modals and Popups --- */}
      {showVideoPlayer && currentVideoProject && (
        <VideoPlayerPopup
          isOpen={showVideoPlayer}        
          onClose={handleCloseVideoPlayer} 
          videoUrl={currentVideoUrl}
          projectTitle={currentVideoProject.title}
          projectId={currentVideoProject.projectId}
        />
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-red-600 flex items-center gap-2 mb-4">
              <DeleteIcon /> Confirm Deletion
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => projectToDelete && handleDeleteProject(projectToDelete)}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl font-semibold transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}