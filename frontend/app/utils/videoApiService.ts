// utils/videoGenerationService.ts - Video Generation Service with Caching
import { getAuthHeaders } from './auth';

export interface VideoProject {
  projectId: string;
  title: string;
  createdAt: string;
  status: 'input_only' | 'script_ready' | 'generating' | 'completed' | 'error';
  lessonStepsCount: number;
  speakers: string[];
  visualFunctions: string[];
  hasVideo: boolean;
  videoFiles: string[];
  lessonSteps?: LessonStep[];
  visualFunctionCode?: Record<string, string>;
}

export interface LessonStep {
  title: string;
  speaker: string;
  content: string;
  content2?: string;
  narration: string;
  visualDuration: number;
  isComplex: boolean;
  visual: {
    type: string;
    params: string[];
  };
}

export interface GenerateScriptRequest {
  content: string;
}

export interface GenerateVideoRequest {
  projectId: string;
  slides: LessonStep[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  projects?: T;
  error?: string;
  message?: string;
  projectId?: string;
  videoUrl?: string;
}

// Cache configuration
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for projects list
const PROJECT_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for individual projects

interface CachedData<T> {
  data: T;
  timestamp: number;
}

class VideoGenerationService {
  private apiUrl: string;
  private cachePrefix = 'video_gen_';

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  // Cache utilities
  private getCacheKey(key: string): string {
    return `${this.cachePrefix}${key}`;
  }

  private getCachedData<T>(key: string, maxAge: number): T | null {
    try {
      const cacheKey = this.getCacheKey(key);
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        const parsedCache: CachedData<T> = JSON.parse(cached);
        const now = Date.now();
        
        if (now - parsedCache.timestamp < maxAge) {
          console.log('✅ Using cached video data for:', key);
          return parsedCache.data;
        } else {
          sessionStorage.removeItem(cacheKey);
          console.log('⏰ Video cache expired for:', key);
        }
      }
    } catch (error) {
      console.warn('❌ Error reading video cache:', error);
      this.clearCacheKey(key);
    }
    
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    try {
      const cacheKey = this.getCacheKey(key);
      const cacheData: CachedData<T> = {
        data,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('💾 Video data cached for:', key);
    } catch (error) {
      console.warn('❌ Error caching video data:', error);
    }
  }

  private clearCacheKey(key: string): void {
    try {
      const cacheKey = this.getCacheKey(key);
      sessionStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn('Error clearing cache key:', error);
    }
  }

  public clearAllCache(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.cachePrefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      console.log('🧹 Video generation cache cleared');
    } catch (error) {
      console.warn('Error clearing video cache:', error);
    }
  }

  // API Methods
  async generateScript(request: GenerateScriptRequest): Promise<ApiResponse<VideoProject>> {
    try {
      console.log('🎬 Generating script for content:', request.content.substring(0, 100) + '...');
      
      const authHeaders = await getAuthHeaders();
      if (!authHeaders.isAuthorized) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.apiUrl}/api/video/generate-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders.headers
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Script generation failed: ${response.status} - ${errorData}`);
      }

      const data: ApiResponse<VideoProject> = await response.json();
      
      if (data.success && data.data) {
        // Cache the generated project
        this.setCachedData(`project_${data.data.projectId}`, data.data);
        // Invalidate projects list cache
        this.clearCacheKey('projects');
        
        console.log('✅ Script generated successfully:', {
          projectId: data.data.projectId,
          title: data.data.title,
          steps: data.data.lessonStepsCount
        });
      }

      return data;
    } catch (error) {
      console.error('❌ Script generation error:', error);
      throw error;
    }
  }

  async generateVideo(request: GenerateVideoRequest): Promise<ApiResponse<string>> {
    try {
      console.log('🎥 Generating video for project:', request.projectId);
      
      const authHeaders = await getAuthHeaders();
      if (!authHeaders.isAuthorized) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.apiUrl}/api/video/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders.headers
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Video generation failed: ${response.status} - ${errorData}`);
      }

      const data: ApiResponse<string> = await response.json();
      
      if (data.success) {
        // Update project cache status
        const cachedProject = this.getCachedData<VideoProject>(`project_${request.projectId}`, PROJECT_CACHE_DURATION);
        if (cachedProject) {
          cachedProject.status = 'completed';
          cachedProject.hasVideo = true;
          if (data.videoUrl) {
            cachedProject.videoFiles = [data.videoUrl];
          }
          this.setCachedData(`project_${request.projectId}`, cachedProject);
        }
        
        // Invalidate projects list cache
        this.clearCacheKey('projects');
        
        console.log('✅ Video generated successfully:', {
          projectId: request.projectId,
          videoUrl: data.videoUrl
        });
      }

      return data;
    } catch (error) {
      console.error('❌ Video generation error:', error);
      throw error;
    }
  }

  async getProjects(useCache: boolean = true): Promise<ApiResponse<VideoProject[]>> {
    try {
      // Check cache first if enabled
      if (useCache) {
        const cachedProjects = this.getCachedData<VideoProject[]>('projects', CACHE_DURATION);
        if (cachedProjects) {
          return {
            success: true,
            projects: cachedProjects
          };
        }
      }

      console.log('🌐 Fetching video projects from API');
      
      const authHeaders = await getAuthHeaders();
      if (!authHeaders.isAuthorized) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${this.apiUrl}/api/video/projects`, {
        method: 'GET',
        headers: authHeaders.headers
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch projects: ${response.status} - ${errorData}`);
      }

      const data: ApiResponse<VideoProject[]> = await response.json();
      
      if (data.success && data.projects) {
        // Cache the projects list
        this.setCachedData('projects', data.projects);
        
        // Cache individual projects
        data.projects.forEach(project => {
          this.setCachedData(`project_${project.projectId}`, project);
        });
        
        console.log('✅ Projects fetched successfully:', {
          count: data.projects.length,
          projects: data.projects.map(p => ({
            id: p.projectId,
            title: p.title,
            status: p.status
          }))
        });
      }

      return data;
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      throw error;
    }
  }

  async getProject(projectId: string, useCache: boolean = true): Promise<VideoProject | null> {
    try {
      // Check cache first if enabled
      if (useCache) {
        const cachedProject = this.getCachedData<VideoProject>(`project_${projectId}`, PROJECT_CACHE_DURATION);
        if (cachedProject) {
          return cachedProject;
        }
      }

      // If not cached, fetch from projects list
      const projectsResponse = await this.getProjects(useCache);
      if (projectsResponse.success && projectsResponse.projects) {
        const project = projectsResponse.projects.find(p => p.projectId === projectId);
        return project || null;
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching project:', error);
      return null;
    }
  }

  getVideoUrl(projectId: string): string {
    return `${this.apiUrl}/api/video/video/${projectId}`;
  }

  // Utility method to check if project has video
  async hasVideo(projectId: string): Promise<boolean> {
    const project = await this.getProject(projectId);
    return project?.hasVideo || false;
  }

  // Utility method to get project status
  async getProjectStatus(projectId: string): Promise<VideoProject['status'] | null> {
    const project = await this.getProject(projectId);
    return project?.status || null;
  }
}

// Export singleton instance
export const videoGenerationService = new VideoGenerationService();