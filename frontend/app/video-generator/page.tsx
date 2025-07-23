'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import Navigation from '../components/navigation/Navigation';
import EnhancedSpinner from '../components/common/EnhancedSpinner';
import { getAuthHeaders } from '../utils/auth';

// Import video generation components
import VideoWorkflowSelector from './components/video-generator/VideoWorkflowSelector';
import VideoContentInput from './components/video-generator/VideoContentInput';
import VideoScriptEditor from './components/video-generator/VideoScriptEditor';
import VideoGeneration from './components/video-generator/VideoGeneration';
import VideoProjectBrowser from './components/video-generator/VideoProjectBrowser';

// Type definitions
type WorkflowMode = 'simple' | 'advanced';
type TabType = 'projects' | 'create';

// Updated Project interface for project browser
interface Project {
  projectId: string;
  title: string;
  createdAt: string;
  status: string;
  lessonStepsCount?: number;
  speakers?: string[];
  visualFunctions?: string[];
  hasVideo?: boolean;
  videoFiles?: string[];
}

// Full project interface for script editor
interface FullProject {
  id: string;
  title: string;
  lessonSteps: any[];
  speakers: any;
  visualFunctions: any;
  status: string;
}

interface Slide {
  title: string;
  speaker: string;
  content: string;
  content2?: string;
  narration?: string;
  visualDuration?: number;
  isComplex?: boolean;
  visual?: {
    type: string;
    params: any[];
  };
}

export default function VideoGeneratorPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useSupabaseAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('projects');
  const [currentStep, setCurrentStep] = useState(1);
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>('simple');
  const [currentProject, setCurrentProject] = useState<FullProject | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Function to fetch full project details
  const fetchFullProject = async (projectId: string): Promise<FullProject | null> => {
    try {
      setLoading(true);
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        console.error('Not authenticated');
        return null;
      }

      const response = await fetch(`${API_URL}/api/video-generator/project/${projectId}`, {
        headers
      });
      
      const result = await response.json();
      
      if (result.success && result.project) {
        const { project, speakers, visualFunctions, lessonSteps } = result.project;
        
        // Transform the data to match VideoScriptEditor expectations
        const speakersObj: any = {};
        speakers.forEach((speaker: any) => {
          speakersObj[speaker.speaker_key] = {
            voice: speaker.voice,
            model: speaker.model,
            name: speaker.name,
            color: speaker.color,
            gender: speaker.gender
          };
        });
        
        const visualFunctionsObj: any = {};
        visualFunctions.forEach((vf: any) => {
          try {
            // Try to reconstruct the function from the stored string
            visualFunctionsObj[vf.function_name] = new Function('ctx', 'param1', 'param2', 'param3', 
              vf.function_code.replace(/^function\s+\w+\s*\([^)]*\)\s*\{/, '').replace(/\}$/, '')
            );
          } catch (error) {
            console.error(`Error reconstructing function ${vf.function_name}:`, error);
          }
        });
        
        const transformedLessonSteps = lessonSteps.map((step: any) => ({
          speaker: step.speaker,
          title: step.title,
          content: step.content,
          content2: step.content2,
          narration: step.narration,
          visualDuration: step.visual_duration,
          isComplex: step.is_complex,
          visual: step.visual_type ? {
            type: step.visual_type,
            params: step.visual_params || []
          } : null
        }));
        
        return {
          id: project.id,
          title: project.title,
          lessonSteps: transformedLessonSteps,
          speakers: speakersObj,
          visualFunctions: visualFunctionsObj,
          status: project.status
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching full project:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Handle project selection from browser
  const handleProjectSelect = async (project: Project) => {
    console.log('Selected project:', project);
    
    // Fetch full project details
    const fullProject = await fetchFullProject(project.projectId);
    
    if (fullProject) {
      setCurrentProject(fullProject);
      setSlides(fullProject.lessonSteps);
      setCurrentTab('create');
      
      // Determine which step to go to based on project status
      if (fullProject.status === 'input_only') {
        setCurrentStep(1);
      } else if (fullProject.status === 'script_ready' || fullProject.status === 'completed') {
        setCurrentStep(2);
      }
    } else {
      console.error('Failed to fetch full project details');
    }
  };

  // Handle script generation completion
  const handleScriptGenerated = (project: any, projectSlides: Slide[]) => {
    // Transform the generated project to match FullProject structure
    const fullProject: FullProject = {
      id: project.id,
      title: project.title,
      lessonSteps: projectSlides,
      speakers: project.speakers || {},
      visualFunctions: project.visualFunctions || {},
      status: 'script_ready'
    };
    
    setCurrentProject(fullProject);
    setSlides(projectSlides);
    setCurrentStep(2);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <EnhancedSpinner size="lg" message={loading ? "Loading project..." : "Loading video generator..."} />
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
            onClick={() => {
              setCurrentTab('create');
              setCurrentStep(1);
              setCurrentProject(null);
              setSlides([]);
            }}
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
              onProjectSelect={handleProjectSelect}
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
                  onScriptGenerated={handleScriptGenerated}
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