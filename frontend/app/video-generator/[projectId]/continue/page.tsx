// File: frontend/app/video-generator/[projectId]/continue/page.tsx (Continue project with AI animation)
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import Navigation from '../../../components/navigation/Navigation';
import EnhancedSpinner from '../../../components/common/EnhancedSpinner';
import { getAuthHeaders } from '../../../utils/auth';

// Define TypeScript interfaces (reusing from edit page)
interface Slide {
  speaker: string;
  title: string;
  content: string;
  content2?: string;
  narration: string;
  visualDuration: number;
  isComplex: boolean;
  visual?: {
    type: string;
    params: any[];
  } | null;
}

interface Speaker {
  voice: string;
  model: string;
  name: string;
  color: string;
  gender: string;
}

interface Project {
  id: string;
  title: string;
  lessonSteps: Slide[];
  speakers: Record<string, Speaker>;
  visualFunctions: Record<string, Function>;
  status: string;
  inputData?: any;
}

const generationSteps = [
  { text: "🧠 Analyzing your input...", duration: 3000 },
  { text: "📝 Crafting lesson structure...", duration: 4000 },
  { text: "🎭 Designing speaker personalities...", duration: 3500 },
  { text: "🎨 Creating visual concepts...", duration: 4500 },
  { text: "🗣️ Writing engaging narration...", duration: 5000 },
  { text: "🎬 Finalizing script details...", duration: 3000 },
  { text: "✨ Polishing the experience...", duration: 2000 }
];

const encouragingMessages = [
  "Great things take time! ⏰",
  "Your video is going to be amazing! 🌟",
  "AI is working its magic... ✨",
  "Almost there! Hang tight! 🚀",
  "Quality content is being crafted! 🎯",
  "The wait will be worth it! 💎"
];

export default function ContinueProjectPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useSupabaseAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [scriptReady, setScriptReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState('');
  
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const stepTimeoutRef = useRef<NodeJS.Timeout>();
  const messageIntervalRef = useRef<NodeJS.Timeout>();
  const dotIntervalRef = useRef<NodeJS.Timeout>();

  const projectId = params.projectId as string;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    fetchProject();
  }, [user, projectId]);

  useEffect(() => {
    // Animate dots
    if (isGenerating) {
      dotIntervalRef.current = setInterval(() => {
        setDots(prev => {
          if (prev.length >= 3) return '';
          return prev + '.';
        });
      }, 500);
    }

    return () => {
      if (dotIntervalRef.current) clearInterval(dotIntervalRef.current);
    };
  }, [isGenerating]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/video-generator/project/${projectId}`, {
        headers
      });
      
      const result = await response.json();
      
      if (result.success && result.project) {
        const { project, speakers, visualFunctions, lessonSteps } = result.project;
        
        // Transform data similar to edit page
        const transformedProject: Project = {
          id: project.id,
          title: project.title,
          lessonSteps: lessonSteps?.map((step: any): Slide => ({
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
          })) || [],
          speakers: speakers?.reduce((acc: Record<string, Speaker>, speaker: any) => {
            acc[speaker.speaker_key] = {
              voice: speaker.voice,
              model: speaker.model,
              name: speaker.name,
              color: speaker.color,
              gender: speaker.gender
            };
            return acc;
          }, {}) || {},
          visualFunctions: visualFunctions?.reduce((acc: Record<string, Function>, vf: any) => {
            try {
              acc[vf.function_name] = new Function('ctx', 'param1', 'param2', 'param3', 
                vf.function_code.replace(/^function\s+\w+\s*\([^)]*\)\s*\{/, '').replace(/\}$/, '')
              );
            } catch (error) {
              console.error(`Error reconstructing function ${vf.function_name}:`, error);
            }
            return acc;
          }, {}) || {},
          status: project.status,
          inputData: project.input_data
        };
        
        setProject(transformedProject);
        
        // Check if script is already ready
        if (project.status === 'script_ready' || lessonSteps?.length > 0) {
          setScriptReady(true);
          setProgress(100);
        }
      } else {
        throw new Error(result.error || 'Failed to load project');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const startScriptGeneration = async () => {
    if (!project || isGenerating) return;

    try {
      setIsGenerating(true);
      setCurrentStep(0);
      setProgress(0);
      
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        throw new Error('Not authenticated');
      }

      // Start the generation process
      const response = await fetch(`${API_URL}/api/video-generator/continue/${projectId}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Start animation sequence
        startAnimationSequence();
        
        // Start polling for completion
        startPolling();
        
        // Start encouraging messages rotation
        startMessageRotation();
      } else {
        throw new Error(result.error || 'Failed to start script generation');
      }
    } catch (error) {
      console.error('Error starting script generation:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setIsGenerating(false);
    }
  };

  const startAnimationSequence = () => {
    let stepIndex = 0;
    let totalDuration = 0;
    
    const nextStep = () => {
      if (stepIndex < generationSteps.length && isGenerating) {
        setCurrentStep(stepIndex);
        
        const stepDuration = generationSteps[stepIndex].duration;
        totalDuration += stepDuration;
        
        // Update progress
        const progressPercent = ((stepIndex + 1) / generationSteps.length) * 90; // Leave 10% for completion
        setProgress(progressPercent);
        
        stepIndex++;
        stepTimeoutRef.current = setTimeout(nextStep, stepDuration);
      }
    };
    
    nextStep();
  };

  const startMessageRotation = () => {
    messageIntervalRef.current = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % encouragingMessages.length);
    }, 4000);
  };

  const startPolling = () => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const { headers, isAuthorized } = await getAuthHeaders();
        
        if (!isAuthorized) return;

        const response = await fetch(`${API_URL}/api/video-generator/project/${projectId}`, {
          headers
        });
        
        const result = await response.json();
        
        if (result.success && result.project) {
          const { project, lessonSteps } = result.project;
          
          if (project.status === 'script_ready' || lessonSteps?.length > 0) {
            setScriptReady(true);
            setProgress(100);
            setIsGenerating(false);
            
            // Clear all intervals and timeouts
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
            if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
          }
        }
      } catch (error) {
        console.error('Error polling project status:', error);
      }
    }, 3000); // Poll every 3 seconds
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
      if (dotIntervalRef.current) clearInterval(dotIntervalRef.current);
    };
  }, []);

  const handleProceedToEdit = () => {
    router.push(`/video-generator/${projectId}/edit`);
  };

  const handleBackToProjects = () => {
    router.push('/video-generator');
  };

  // const handleEditInput = () => {
  //   router.push(`/video-generator/create?edit=${projectId}`);
  // };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <EnhancedSpinner size="lg" message="Loading your project..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="bg-white rounded-lg p-8 shadow-lg text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Project</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBackToProjects}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToProjects}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Projects
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Continue: {project.title}</h1>
          </div>
          <Navigation />
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {!isGenerating && !scriptReady && (
            // Initial state - ready to start
            <div className="p-8 text-center">
              <div className="mb-8">
                <div className="text-6xl mb-4 animate-bounce">🎬</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to Generate Your Script</h2>
                <p className="text-gray-600 mb-4">
                  Your input is ready! Let's create an amazing script for your video.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-2xl mx-auto">
                  <h3 className="font-semibold text-gray-800 mb-2">Project Details:</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div><strong>Title:</strong> {project.title}</div>
                    <div><strong>Status:</strong> {project.status}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isGenerating && !scriptReady && (
            // Generation in progress
            <div className="p-8 text-center">
              <div className="mb-8">
                {/* Animated Robot/AI Icon */}
                <div className="text-6xl mb-6 animate-pulse">🤖</div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  AI is Creating Your Script{dots}
                </h2>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-6 max-w-md mx-auto">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                {/* Current Step */}
                <div className="mb-6">
                  <div className="text-lg font-semibold text-gray-700 mb-2 animate-fade-in">
                    {generationSteps[currentStep]?.text || "Processing..."}
                  </div>
                  <div className="text-sm text-gray-500">
                    Step {currentStep + 1} of {generationSteps.length}
                  </div>
                </div>
                
                {/* Encouraging Message */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                  <div className="text-blue-600 font-medium animate-fade-in">
                    {encouragingMessages[currentMessage]}
                  </div>
                </div>
                
                {/* Floating Animation Elements */}
                <div className="relative h-16 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center space-x-4">
                    <div className="text-2xl animate-bounce" style={{ animationDelay: '0s' }}>💡</div>
                    <div className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</div>
                    <div className="text-2xl animate-bounce" style={{ animationDelay: '0.4s' }}>🎨</div>
                    <div className="text-2xl animate-bounce" style={{ animationDelay: '0.6s' }}>📝</div>
                    <div className="text-2xl animate-bounce" style={{ animationDelay: '0.8s' }}>🎭</div>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 max-w-2xl mx-auto">
                <p>This usually takes 1-3 minutes. Feel free to grab a coffee! ☕</p>
                <p className="mt-2">We'll notify you when your script is ready.</p>
              </div>
            </div>
          )}

          {scriptReady && (
            // Script ready state
            <div className="p-8 text-center">
              <div className="mb-8">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Script Ready!</h2>
                <p className="text-gray-600 mb-4">
                  Your AI-generated script is complete and ready for editing.
                </p>
                
                {/* Success Animation */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-6 max-w-md mx-auto">
                  <div className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full w-full animate-pulse"></div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                  <div className="text-green-600 font-medium">
                    ✅ Script generated successfully!
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={handleProceedToEdit}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
                >
                  <span>✏️</span>
                  <span>Edit Script</span>
                </button>

                <button
                  onClick={handleBackToProjects}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:-translate-y-0.5 flex items-center space-x-2"
                >
                  <span>📁</span>
                  <span>Back to Projects</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Background Animation */}
        {isGenerating && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 text-4xl opacity-20 animate-float">🎬</div>
            <div className="absolute top-3/4 right-1/4 text-3xl opacity-15 animate-float-delayed">📝</div>
            <div className="absolute top-1/2 left-1/6 text-2xl opacity-10 animate-float">🎨</div>
            <div className="absolute top-1/3 right-1/3 text-3xl opacity-20 animate-float-delayed">✨</div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-3deg); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 5s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}