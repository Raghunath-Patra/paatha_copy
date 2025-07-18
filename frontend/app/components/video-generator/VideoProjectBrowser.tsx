'use client';

import React, { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../utils/auth';

interface VideoProjectBrowserProps {
  projects: any[];
  setProjects: (projects: any[]) => void;
  onProjectSelect: (project: any) => void;
}

export default function VideoProjectBrowser({
  projects,
  setProjects,
  onProjectSelect
}: VideoProjectBrowserProps) {
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    loadProjects();
  }, []);

  // Update the project mapping to handle the database structure
  const transformProjectForFrontend = (project: any) => {
    return {
      projectId: project.id, // Map database 'id' to 'projectId'
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

// Update the loadProjects function to transform the data
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
        // Transform the projects to match frontend expectations
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

      // Updated endpoint
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

  const handlePlayVideo = async (projectId: string) => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        console.error('Not authenticated');
        alert('Please log in to play videos');
        return;
      }

      // Create a form to submit with headers (for authenticated requests)
      const response = await fetch(`${API_URL}/api/video-generator/stream/${projectId}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        // Get the video blob and create object URL
        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);
        
        // Open in new tab with video player
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Video Player - ${projectId}</title>
              <style>
                body { margin: 0; padding: 20px; background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                video { max-width: 100%; max-height: 100%; }
              </style>
            </head>
            <body>
              <video controls autoplay>
                <source src="${videoUrl}" type="video/mp4">
                Your browser does not support the video tag.
              </video>
            </body>
            </html>
          `);
        }
      } else {
        console.error('Failed to load video');
        alert('Failed to load video. Please try again.');
      }
    } catch (error) {
      console.error('Error playing video:', error);
      alert('Error playing video. Please try again.');
    }
  };

  const handleDownloadVideo = async (projectId: string) => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        console.error('Not authenticated');
        alert('Please log in to download videos');
        return;
      }

      // Use the download endpoint (assuming it exists)
      const response = await fetch(`${API_URL}/api/video-generator/download/${projectId}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        // Get the video blob
        const blob = await response.blob();
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `video-${projectId}.mp4`; // You can customize the filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up the object URL
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
      'completed': { text: 'Video Ready', emoji: '✅', color: 'bg-green-100 text-green-800' },
      'script_ready': { text: 'Script Ready', emoji: '📝', color: 'bg-yellow-100 text-yellow-800' },
      'input_only': { text: 'Input Only', emoji: '📄', color: 'bg-blue-100 text-blue-800' },
      'empty': { text: 'Empty', emoji: '❓', color: 'bg-gray-100 text-gray-800' }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.empty;
  };

  const handleProjectClick = (project: any) => {
    setSelectedProject(project);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading projects...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">📁</div>
        <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
        <p className="text-gray-600 mb-4">
          You haven't created any video projects yet. Click "Create New" to get started!
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          ➕ Create Your First Project
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">📁 My Video Projects</h2>
        <div className="flex gap-3">
          <button
            onClick={loadProjects}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            ➕ New Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const statusInfo = getStatusInfo(project.status);
          const createdDate = new Date(project.createdAt).toLocaleDateString();

          return (
            <div
              key={project.projectId}
              onClick={() => handleProjectClick(project)}
              className="bg-white rounded-lg p-4 shadow-md border-2 border-transparent hover:border-red-300 transition-all cursor-pointer hover:shadow-lg"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    ID: {project.projectId.substring(0, 8)}...
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.emoji} {statusInfo.text}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                <span>📅 {createdDate}</span>
                <span>📋 {project.lessonStepsCount || 0} steps</span>
                {project.hasVideo && (
                  <span>🎬 {project.videoFiles?.length || 1} video(s)</span>
                )}
              </div>

              <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                {project.status === 'completed' && (
                  <>
                    <button
                      onClick={() => handlePlayVideo(project.projectId)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                    >
                      ▶️ Play
                    </button>
                    <button
                      onClick={() => handleDownloadVideo(project.projectId)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                    >
                      ⬇️ Download
                    </button>
                  </>
                )}
                
                {(project.status === 'script_ready' || project.status === 'completed') && (
                  <button
                    onClick={() => onProjectSelect(project)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                  >
                    ✏️ Edit
                  </button>
                )}
                
                {project.status === 'input_only' && (
                  <button
                    onClick={() => onProjectSelect(project)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                  >
                    ▶️ Continue
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setProjectToDelete(project.projectId);
                    setShowDeleteModal(true);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">📁 Project Details</h3>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <strong className="text-gray-700">Title:</strong>
                <p className="text-gray-900">{selectedProject.title}</p>
              </div>
              <div>
                <strong className="text-gray-700">Status:</strong>
                <p className="text-gray-900">{getStatusInfo(selectedProject.status).text}</p>
              </div>
              <div>
                <strong className="text-gray-700">Created:</strong>
                <p className="text-gray-900">{new Date(selectedProject.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <strong className="text-gray-700">Lesson Steps:</strong>
                <p className="text-gray-900">{selectedProject.lessonStepsCount || 0}</p>
              </div>
              <div>
                <strong className="text-gray-700">Speakers:</strong>
                <p className="text-gray-900">{selectedProject.speakers?.join(', ') || 'None'}</p>
              </div>
              {selectedProject.visualFunctions?.length > 0 && (
                <div>
                  <strong className="text-gray-700">Visual Functions:</strong>
                  <p className="text-gray-900">{selectedProject.visualFunctions.join(', ')}</p>
                </div>
              )}
              {selectedProject.hasVideo && (
                <div>
                  <strong className="text-gray-700">Videos:</strong>
                  <p className="text-gray-900">{selectedProject.videoFiles?.join(', ') || 'Video available'}</p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3 mt-6">
              {selectedProject.status === 'completed' && (
                <button
                  onClick={() => handlePlayVideo(selectedProject.projectId)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  ▶️ Play Video
                </button>
              )}
              <button
                onClick={() => {
                  onProjectSelect(selectedProject);
                  setSelectedProject(null);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ✏️ Edit Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">🗑️ Confirm Delete</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete this project?
            </p>
            <p className="text-red-600 font-medium mb-6">
              This action cannot be undone.
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => projectToDelete && handleDeleteProject(projectToDelete)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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