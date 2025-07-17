// hooks/useVideoGeneration.ts - React Hook for Video Generation
import { useState, useCallback, useEffect } from 'react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { videoGenerationService, VideoProject, GenerateScriptRequest, GenerateVideoRequest } from '../utils/videoApiService';

interface UseVideoGenerationReturn {
  // State
  projects: VideoProject[];
  currentProject: VideoProject | null;
  loading: boolean;
  generating: boolean;
  error: string | null;
  
  // Actions
  generateScript: (content: string) => Promise<VideoProject | null>;
  generateVideo: (projectId: string, slides?: any[]) => Promise<boolean>;
  loadProjects: (forceRefresh?: boolean) => Promise<void>;
  loadProject: (projectId: string, forceRefresh?: boolean) => Promise<VideoProject | null>;
  clearError: () => void;
  clearCache: () => void;
  
  // Utilities
  getVideoUrl: (projectId: string) => string;
  hasVideo: (projectId: string) => boolean;
  getProjectByStatus: (status: VideoProject['status']) => VideoProject[];
}

export const useVideoGeneration = (): UseVideoGenerationReturn => {
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [currentProject, setCurrentProject] = useState<VideoProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { profile, loading: authLoading } = useSupabaseAuth();

  // Clear cache when user changes or logs out
  useEffect(() => {
    if (!authLoading && !profile) {
      videoGenerationService.clearAllCache();
      setProjects([]);
      setCurrentProject(null);
    }
  }, [profile, authLoading]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearCache = useCallback(() => {
    videoGenerationService.clearAllCache();
    setProjects([]);
    setCurrentProject(null);
  }, []);

  const loadProjects = useCallback(async (forceRefresh: boolean = false) => {
    if (authLoading) return;
    if (!profile) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await videoGenerationService.getProjects(!forceRefresh);
      
      if (response.success && response.projects) {
        setProjects(response.projects);
        console.log('📚 Projects loaded:', {
          count: response.projects.length,
          statuses: response.projects.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        });
      } else {
        throw new Error(response.error || 'Failed to load projects');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
      setError(errorMessage);
      console.error('❌ Error loading projects:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [profile, authLoading]);

  const loadProject = useCallback(async (projectId: string, forceRefresh: boolean = false) => {
    if (authLoading) return null;
    if (!profile) {
      setError('Authentication required');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const project = await videoGenerationService.getProject(projectId, !forceRefresh);
      
      if (project) {
        setCurrentProject(project);
        console.log('📄 Project loaded:', {
          projectId: project.projectId,
          title: project.title,
          status: project.status
        });
        return project;
      } else {
        throw new Error('Project not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load project';
      setError(errorMessage);
      console.error('❌ Error loading project:', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [profile, authLoading]);

  const generateScript = useCallback(async (content: string): Promise<VideoProject | null> => {
    if (authLoading) return null;
    if (!profile) {
      setError('Authentication required');
      return null;
    }

    if (!content.trim()) {
      setError('Content is required');
      return null;
    }

    try {
      setGenerating(true);
      setError(null);
      
      console.log('🎬 Starting script generation...');
      
      const request: GenerateScriptRequest = { content };
      const response = await videoGenerationService.generateScript(request);
      
      if (response.success && response.data) {
        setCurrentProject(response.data);
        
        // Update projects list with new project
        setProjects(prev => {
          const existingIndex = prev.findIndex(p => p.projectId === response.data!.projectId);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = response.data!;
            return updated;
          } else {
            return [response.data!, ...prev];
          }
        });
        
        console.log('✅ Script generated successfully:', {
          projectId: response.data.projectId,
          title: response.data.title,
          steps: response.data.lessonStepsCount
        });
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to generate script');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate script';
      setError(errorMessage);
      console.error('❌ Script generation error:', errorMessage);
      return null;
    } finally {
      setGenerating(false);
    }
  }, [profile, authLoading]);

  const generateVideo = useCallback(async (projectId: string, slides?: any[]): Promise<boolean> => {
    if (authLoading) return false;
    if (!profile) {
      setError('Authentication required');
      return false;
    }

    try {
      setGenerating(true);
      setError(null);
      
      console.log('🎥 Starting video generation for project:', projectId);
      
      // Get project data if slides not provided
      let finalSlides = slides;
      if (!finalSlides) {
        const project = await videoGenerationService.getProject(projectId);
        if (project?.lessonSteps) {
          finalSlides = project.lessonSteps;
        } else {
          throw new Error('No slides data found for project');
        }
      }
      
      const request: GenerateVideoRequest = {
        projectId,
        slides: finalSlides
      };
      
      const response = await videoGenerationService.generateVideo(request);
      
      if (response.success) {
        // Update current project status
        if (currentProject?.projectId === projectId) {
          setCurrentProject(prev => prev ? {
            ...prev,
            status: 'completed',
            hasVideo: true,
            videoFiles: response.videoUrl ? [response.videoUrl] : prev.videoFiles
          } : prev);
        }
        
        // Update projects list
        setProjects(prev => prev.map(p => 
          p.projectId === projectId 
            ? {
                ...p,
                status: 'completed' as const,
                hasVideo: true,
                videoFiles: response.videoUrl ? [response.videoUrl] : p.videoFiles
              }
            : p
        ));
        
        console.log('✅ Video generated successfully:', {
          projectId,
          videoUrl: response.videoUrl
        });
        
        return true;
      } else {
        throw new Error(response.error || 'Failed to generate video');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate video';
      setError(errorMessage);
      console.error('❌ Video generation error:', errorMessage);
      return false;
    } finally {
      setGenerating(false);
    }
  }, [profile, authLoading, currentProject]);

  // Utility functions
  const getVideoUrl = useCallback((projectId: string): string => {
    return videoGenerationService.getVideoUrl(projectId);
  }, []);

  const hasVideo = useCallback((projectId: string): boolean => {
    const project = projects.find(p => p.projectId === projectId);
    return project?.hasVideo || false;
  }, [projects]);

  const getProjectByStatus = useCallback((status: VideoProject['status']): VideoProject[] => {
    return projects.filter(p => p.status === status);
  }, [projects]);

  // Auto-load projects on mount
  useEffect(() => {
    if (!authLoading && profile) {
      loadProjects();
    }
  }, [authLoading, profile, loadProjects]);

  return {
    // State
    projects,
    currentProject,
    loading,
    generating,
    error,
    
    // Actions
    generateScript,
    generateVideo,
    loadProjects,
    loadProject,
    clearError,
    clearCache,
    
    // Utilities
    getVideoUrl,
    hasVideo,
    getProjectByStatus
  };
};