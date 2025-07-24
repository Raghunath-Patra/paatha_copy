'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getAuthHeaders } from '../../../utils/auth';

interface VideoScriptEditorProps {
  project: {
    id: string;
    title: string;
    lessonSteps: any[];
    speakers: any;
    visualFunctions: any;
  };
  slides: any[];
  onSlidesUpdate: (slides: any[]) => void;
  onProceedToVideo: () => void;
  onBackToInput: () => void;
}

// Skeleton Components
const SlideSkeleton = () => (
  <div className="animate-pulse p-4 rounded-xl border border-slate-200 bg-white">
    <div className="flex justify-between items-start mb-3">
      <div className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 rounded w-20"></div>
      <div className="h-3 bg-slate-200 rounded w-16"></div>
    </div>
    <div className="h-5 bg-gradient-to-r from-blue-300 to-purple-300 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
    <div className="space-y-2">
      <div className="h-3 bg-slate-200 rounded w-full"></div>
      <div className="h-3 bg-slate-200 rounded w-4/5"></div>
    </div>
  </div>
);

const VisualFunctionSkeleton = () => (
  <div className="animate-pulse border rounded-xl p-4 bg-white">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <div className="h-5 bg-gradient-to-r from-purple-200 to-blue-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-24"></div>
      </div>
      <div className="h-8 bg-blue-200 rounded w-16"></div>
    </div>
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 rounded w-full"></div>
        <div className="h-3 bg-slate-200 rounded w-3/4"></div>
        <div className="h-3 bg-slate-200 rounded w-5/6"></div>
      </div>
    </div>
  </div>
);

const CanvasSkeleton = () => (
  <div className="animate-pulse border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-50">
    <div className="aspect-[10/7] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full mx-auto mb-4 animate-spin"></div>
        <div className="h-4 bg-slate-200 rounded w-32 mx-auto mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-24 mx-auto"></div>
      </div>
    </div>
  </div>
);

export default function VideoScriptEditor({
  project,
  slides,
  onSlidesUpdate,
  onProceedToVideo,
  onBackToInput
}: VideoScriptEditorProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const [editingSlide, setEditingSlide] = useState<string>('');
  const [originalSlide, setOriginalSlide] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Tab management
  const [activeTab, setActiveTab] = useState<'slides' | 'visuals'>('slides');
  const [editingVisualFunction, setEditingVisualFunction] = useState<{name: string, code: string} | null>(null);
  const [visualFunctions, setVisualFunctions] = useState<any[]>([]);
  const [aiModifyType, setAiModifyType] = useState<'content' | 'visual'>('content');

  // Add these new state variables for visual functions tab
  const [selectedVisualFunction, setSelectedVisualFunction] = useState<any>(null);
  const [visualPreviewCanvas, setVisualPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const visualCanvasRef = useRef<HTMLCanvasElement>(null);

  const [originalVisualCode, setOriginalVisualCode] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Simulate loading states
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Initialize canvas for preview
  useEffect(() => {
    console.log('🔧 Initializing canvases...');
    
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 1000;
      canvas.height = 700;
      setPreviewCanvas(canvas);
      console.log('✅ Slide preview canvas initialized');
    }
    
    if (visualCanvasRef.current) {
      const canvas = visualCanvasRef.current;
      canvas.width = 1000;
      canvas.height = 700;
      setVisualPreviewCanvas(canvas);
      console.log('✅ Visual preview canvas initialized');
    }
  }, []);

  // Separate effect for initial slide preview (only after both canvas and slides are ready)
  useEffect(() => {
    if (activeTab === 'slides' && previewCanvas && slides[currentSlideIndex]) {
      console.log('🖼️ Initial slide preview update');
      updateSlidePreview(slides[currentSlideIndex], currentSlideIndex);
    }
  }, [previewCanvas, slides, currentSlideIndex, activeTab]);

  // Separate effect for when visual canvas becomes available
  useEffect(() => {
    if (visualPreviewCanvas && activeTab === 'visuals' && selectedVisualFunction) {
      console.log('🎨 Visual canvas became available, updating preview');
      updateVisualPreview(selectedVisualFunction);
    }
  }, [visualPreviewCanvas, activeTab, selectedVisualFunction]);

  // Handle canvas updates based on active tab and selection
  useEffect(() => {
    console.log(`🔄 Tab/selection change effect: activeTab=${activeTab}, hasPreviewCanvas=${!!previewCanvas}, hasVisualCanvas=${!!visualPreviewCanvas}`);
    
    if (activeTab === 'slides' && previewCanvas && slides[currentSlideIndex]) {
      console.log(`🖼️ Updating slide preview for slide ${currentSlideIndex}`);
      updateSlidePreview(slides[currentSlideIndex], currentSlideIndex);
    } else if (activeTab === 'visuals' && visualPreviewCanvas && selectedVisualFunction) {
      console.log(`🎨 Updating visual preview for function: ${selectedVisualFunction.function_name}`);
      updateVisualPreview(selectedVisualFunction);
    } else {
      console.log('⏸️ No update needed - missing requirements');
    }
  }, [activeTab, selectedVisualFunction, currentSlideIndex, visualPreviewCanvas, previewCanvas]);

  // Update preview when slide changes (only for slides tab)
  useEffect(() => {
    if (activeTab === 'slides' && previewCanvas && slides[currentSlideIndex]) {
      updateSlidePreview(slides[currentSlideIndex], currentSlideIndex);
    }
  }, [currentSlideIndex, slides, previewCanvas, activeTab]);

  // Update visual preview when visual function changes (only for visuals tab)
  useEffect(() => {
    if (activeTab === 'visuals' && visualPreviewCanvas && selectedVisualFunction) {
      updateVisualPreview(selectedVisualFunction);
    }
  }, [selectedVisualFunction, visualPreviewCanvas, activeTab]);

  const updateSlidePreview = (slide: any, index: number) => {
    if (!previewCanvas) return;

    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1000, 700);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1000, 700);

    // Draw background with modern styling
    const backgroundColor = getBackgroundColor(slide.speaker);
    const bgGradient = ctx.createLinearGradient(0, 0, 1000, 700);
    bgGradient.addColorStop(0, backgroundColor);
    bgGradient.addColorStop(1, adjustColor(backgroundColor, -10));
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1000, 700);

    // Draw modern title with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 32px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(slide.title || 'Untitled Slide', 500, 75);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Draw content with better typography
    ctx.fillStyle = '#475569';
    ctx.font = '22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    if (slide.content) {
      ctx.fillText(slide.content, 500, 120);
    }
    if (slide.content2) {
      ctx.fillText(slide.content2, 500, 150);
    }

    // Draw modern media area with rounded corners effect
    const mediaX = 200, mediaY = 200, mediaW = 600, mediaH = 400;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(mediaX, mediaY, mediaW, mediaH);
    
    // Add subtle inner shadow effect
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.strokeRect(mediaX + 1, mediaY + 1, mediaW - 2, mediaH - 2);

    // Draw visual if available
    if (slide.visual && slide.visual.type && project.visualFunctions) {
      try {
        const visualFunction = project.visualFunctions[slide.visual.type];
        if (visualFunction) {
          let func;
          if (typeof visualFunction === 'string') {
            func = new Function('ctx', 'param1', 'param2', 'param3', 
              visualFunction.replace(/^function\s+\w+\s*\([^)]*\)\s*\{/, '').replace(/\}$/, '')
            );
          } else {
            func = visualFunction;
          }
          
          if (slide.visual.params && slide.visual.params.length > 0) {
            func(ctx, ...slide.visual.params);
          } else {
            func(ctx);
          }
        }
      } catch (error) {
        console.error('Error executing visual function:', error);
        ctx.fillStyle = '#ef4444';
        ctx.font = '16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Error in visual function', 500, 400);
      }
    }

    // Draw modern avatars
    drawAvatars(ctx, slide.speaker);
  };

  const updateVisualPreview = (visualFunction: any) => {
    if (!visualPreviewCanvas) {
      console.log('❌ Visual preview canvas not available');
      return;
    }

    const ctx = visualPreviewCanvas.getContext('2d');
    if (!ctx) {
      console.log('❌ Could not get 2D context from visual preview canvas');
      return;
    }

    console.log('🎨 Starting visual function preview for:', visualFunction.function_name);

    // Modern gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1000, 700);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f8fafc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1000, 700);

    // Draw modern header with gradient text effect
    const headerGradient = ctx.createLinearGradient(0, 0, 1000, 0);
    headerGradient.addColorStop(0, '#3b82f6');
    headerGradient.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = headerGradient;
    ctx.font = 'bold 24px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Visual Function: ${visualFunction.function_name}`, 500, 40);

    // Create a working area with modern styling
    const workingArea = {
      x: 100,
      y: 80,
      width: 800,
      height: 500
    };

    // Draw working area with subtle gradient
    const areaGradient = ctx.createLinearGradient(0, workingArea.y, 0, workingArea.y + workingArea.height);
    areaGradient.addColorStop(0, '#f8fafc');
    areaGradient.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = areaGradient;
    ctx.fillRect(workingArea.x, workingArea.y, workingArea.width, workingArea.height);
    
    // Draw modern border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(workingArea.x, workingArea.y, workingArea.width, workingArea.height);

    // Add instruction text with better styling
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Visual function output will appear below:', 500, 70);

    try {
      console.log('🔧 Executing visual function code...');
      
      // Save context state before executing user code
      ctx.save();
      
      // Reset text alignment for user code
      ctx.textAlign = 'left';
      
      // Parse and execute the function code
      let functionCode = visualFunction.function_code.trim();
      let func;
      
      if (functionCode.startsWith('function')) {
        // Complete function definition - extract function body
        const match = functionCode.match(/function\s+\w*\s*\([^)]*\)\s*\{([\s\S]*)\}$/);
        if (match) {
          const functionBody = match[1];
          func = new Function('ctx', 'param1', 'param2', 'param3', functionBody);
        } else {
          throw new Error('Invalid function format - could not parse function definition');
        }
      } else {
        // Just function body
        func = new Function('ctx', 'param1', 'param2', 'param3', functionCode);
      }
      
      // Execute the function with sample parameters
      console.log('✅ Function compiled successfully, executing...');
      func(ctx, 'param1_sample', 'param2_sample', 'param3_sample');
      console.log('✅ Visual function executed successfully');
      
    } catch (error) {
      console.error('❌ Error executing visual function:', error);
      
      // Restore context for error display
      ctx.restore();
      
      // Clear the working area and show modern error styling
      const errorGradient = ctx.createLinearGradient(0, workingArea.y, 0, workingArea.y + workingArea.height);
      errorGradient.addColorStop(0, '#fef2f2');
      errorGradient.addColorStop(1, '#fee2e2');
      ctx.fillStyle = errorGradient;
      ctx.fillRect(workingArea.x, workingArea.y, workingArea.width, workingArea.height);
      
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.strokeRect(workingArea.x, workingArea.y, workingArea.width, workingArea.height);
      
      // Display error message with modern styling
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 18px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ Error in Visual Function', 500, 250);
      
      ctx.fillStyle = '#b91c1c';
      ctx.font = '14px Inter, system-ui, sans-serif';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Word wrap the error message
      const maxWidth = 600;
      const words = errorMessage.split(' ');
      let line = '';
      let y = 280;
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, 500, y);
          line = words[n] + ' ';
          y += 20;
        } else {
          line = testLine;
        }
      }
      if (line) {
        ctx.fillText(line, 500, y);
      }
      
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText('Check the browser console for detailed error information', 500, y + 30);
      
      return; // Exit early for error case
    }
    
    // Restore context state
    ctx.restore();
    
    console.log('✅ Visual function preview completed');
  };

  const getBackgroundColor = (speaker: string) => {
    const colors = {
      teacher: '#f0f9ff',
      student1: '#faf5ff',
      student2: '#fefce8'
    };
    return colors[speaker as keyof typeof colors] || '#f8fafc';
  };

  const adjustColor = (color: string, amount: number) => {
    // Simple color adjustment function - you might want to use a more robust solution
    return color;
  };

  const drawAvatars = (ctx: CanvasRenderingContext2D, activeSpeaker: string) => {
    if (!project.speakers) return;

    const speakerKeys = Object.keys(project.speakers);
    const avatarSize = 30;
    const startY = 250;
    const spacing = 70;

    speakerKeys.forEach((speaker, index) => {
      const config = project.speakers[speaker];
      const isActive = speaker === activeSpeaker;
      const x = 30 + avatarSize / 2;
      const y = startY + (index * spacing) + avatarSize / 2;

      // Draw modern avatar with gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
      if (isActive) {
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#1d4ed8');
      } else {
        gradient.addColorStop(0, '#e5e7eb');
        gradient.addColorStop(1, '#d1d5db');
      }

      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = isActive ? '#1e40af' : '#9ca3af';
      ctx.lineWidth = isActive ? 3 : 1;
      ctx.stroke();

      // Draw speaker name with modern typography
      ctx.fillStyle = isActive ? '#1e293b' : '#64748b';
      ctx.font = `${isActive ? 'bold ' : ''}12px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(config.name, x, y + 25);
    });
  };

  const handleVisualFunctionSelect = (visualFunction: any) => {
    console.log('🎨 Selecting visual function:', visualFunction.function_name);
    console.log('🎨 Canvas state:', { 
      hasVisualCanvas: !!visualPreviewCanvas,
      activeTab,
      canvasRef: !!visualCanvasRef.current 
    });
    
    setSelectedVisualFunction(visualFunction);
    setOriginalVisualCode(visualFunction.function_code);
    setUpdateStatus(null);
    
    // Immediately update the preview if canvas is ready
    if (visualPreviewCanvas && activeTab === 'visuals') {
      console.log('🖼️ Immediately updating visual preview');
      updateVisualPreview(visualFunction);
    } else if (visualCanvasRef.current && activeTab === 'visuals') {
      console.log('🔧 Canvas ref exists but state not set, forcing update...');
      // Force set the canvas state if ref exists but state doesn't
      const canvas = visualCanvasRef.current;
      setVisualPreviewCanvas(canvas);
      // The useEffect will handle the update once state is set
    } else {
      console.log('❌ Cannot update preview - canvas not ready');
    }
  };

  const handleTabSwitch = (newTab: 'slides' | 'visuals') => {
    console.log(`🔄 Switching to tab: ${newTab}`);
    setActiveTab(newTab);
    setShowChat(false); // Close any open chat
    setUpdateStatus(null); // Clear any status messages
    
    // Clear the inactive canvas to prevent confusion
    if (newTab === 'slides' && visualPreviewCanvas) {
      console.log('🧹 Clearing visual preview canvas');
      const ctx = visualPreviewCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 1000, 700);
        const gradient = ctx.createLinearGradient(0, 0, 1000, 700);
        gradient.addColorStop(0, '#f8fafc');
        gradient.addColorStop(1, '#f1f5f9');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1000, 700);
      }
    } else if (newTab === 'visuals' && previewCanvas) {
      console.log('🧹 Clearing slide preview canvas');
      const ctx = previewCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 1000, 700);
        const gradient = ctx.createLinearGradient(0, 0, 1000, 700);
        gradient.addColorStop(0, '#f8fafc');
        gradient.addColorStop(1, '#f1f5f9');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1000, 700);
      }
    }
  };

  const selectSlide = (index: number) => {
    setCurrentSlideIndex(index);
    const slideData = JSON.stringify(slides[index], null, 2);
    setEditingSlide(slideData);
    setOriginalSlide(JSON.parse(JSON.stringify(slides[index]))); // Deep copy
    setUpdateStatus(null);
  };

  const hasSlideChanged = () => {
    if (!originalSlide) return false;
    try {
      const currentSlideData = JSON.parse(editingSlide);
      return JSON.stringify(originalSlide) !== JSON.stringify(currentSlideData);
    } catch {
      return false;
    }
  };

  const hasVisualCodeChanged = () => {
    return selectedVisualFunction && originalVisualCode !== selectedVisualFunction.function_code;
  };

  const saveSlideEdit = async () => {
    try {
      const updatedSlide = JSON.parse(editingSlide);
      
      if (!hasSlideChanged()) {
        setUpdateStatus({ type: 'info', message: 'No changes detected' });
        return;
      }

      setIsUpdating(true);
      setUpdateStatus({ type: 'info', message: 'Updating slide...' });

      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        throw new Error('Authentication required');
      }

      // Check if narration or speaker changed (requires audio regeneration)
      const needsAudioRegeneration = 
        originalSlide.narration !== updatedSlide.narration || 
        originalSlide.speaker !== updatedSlide.speaker;

      const response = await fetch(`${API_URL}/api/video-generator/project/${project.id}/step/${currentSlideIndex + 1}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
          stepData: updatedSlide,
          regenerateAudio: needsAudioRegeneration
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update slide');
      }

      // Update local state
      const updatedSlides = [...slides];
      updatedSlides[currentSlideIndex] = updatedSlide;
      onSlidesUpdate(updatedSlides);
      
      // Update original slide reference
      setOriginalSlide(JSON.parse(JSON.stringify(updatedSlide)));

      if (needsAudioRegeneration) {
        setUpdateStatus({ 
          type: 'success', 
          message: 'Slide updated successfully! New audio is being generated...' 
        });
      } else {
        setUpdateStatus({ 
          type: 'success', 
          message: 'Slide updated successfully!' 
        });
      }

    } catch (error) {
      console.error('Error updating slide:', error);
      setUpdateStatus({ 
        type: 'error', 
        message: `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAIChat = async () => {
    if (!chatMessage.trim()) return;
    
    try {
      setUpdateStatus({ type: 'info', message: `AI is processing your ${aiModifyType} modification...` });

      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_URL}/api/video-generator/project/${project.id}/step/${currentSlideIndex + 1}/ai-modify`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          currentSlide: JSON.parse(editingSlide),
          modification: chatMessage,
          availableVisualFunctions: Object.keys(project.visualFunctions || {}),
          modifyType: aiModifyType
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'AI modification failed');
      }

      if (aiModifyType === 'visual' && result.updatedVisualFunction) {
        // Visual function was updated
        setUpdateStatus({ 
          type: 'success', 
          message: `AI updated the visual function "${result.updatedVisualFunction.name}"! The changes are saved and will appear in the preview.` 
        });
        
        // Update the visual functions in project (if you're tracking them locally)
        if (project.visualFunctions) {
          project.visualFunctions[result.updatedVisualFunction.name] = eval(`(${result.updatedVisualFunction.code})`);
        }
        
        // Refresh the preview to show the updated visual
        updateSlidePreview(JSON.parse(editingSlide), currentSlideIndex);
        
      } else if (result.modifiedSlide) {
        // Slide content was updated
        setEditingSlide(JSON.stringify(result.modifiedSlide, null, 2));
        setUpdateStatus({ 
          type: 'success', 
          message: 'AI modifications applied! Review and save to confirm changes.' 
        });
      }
      
      setChatMessage('');

    } catch (error) {
      console.error('Error in AI chat:', error);
      setUpdateStatus({ 
        type: 'error', 
        message: `AI modification failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const handleVisualAIChat = async () => {
    if (!chatMessage.trim() || !selectedVisualFunction) return;
    
    try {
      setUpdateStatus({ type: 'info', message: 'AI is modifying the visual function...' });

      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_URL}/api/video-generator/project/${project.id}/visual-function/${selectedVisualFunction.function_name}/ai-modify`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          currentCode: selectedVisualFunction.function_code,
          modification: chatMessage
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'AI modification failed');
      }

      if (result.updatedCode) {
        // Update the selected visual function
        const updatedFunction = {
          ...selectedVisualFunction,
          function_code: result.updatedCode
        };
        setSelectedVisualFunction(updatedFunction);
        
        // Update the visual functions list
        setVisualFunctions(prev => 
          prev.map(vf => 
            vf.function_name === selectedVisualFunction.function_name 
              ? { ...vf, function_code: result.updatedCode }
              : vf
          )
        );
        
        // Update preview
        updateVisualPreview(updatedFunction);
        
        setUpdateStatus({ 
          type: 'success', 
          message: 'AI modifications applied! Review and save to confirm changes.' 
        });
      }
      
      setChatMessage('');

    } catch (error) {
      console.error('Error in visual AI chat:', error);
      setUpdateStatus({ 
        type: 'error', 
        message: `AI modification failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const downloadPDF = async () => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      
      if (!isAuthorized) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_URL}/api/video-generator/project/${project.id}/export-pdf`, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        throw new Error('Script export failed');
      }

      // Get HTML content as text
      const htmlContent = await response.text();
      
      // Create a blob with HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new window for printing
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        // Optional: Auto-trigger print dialog after content loads
        newWindow.onload = () => {
          setTimeout(() => {
            // Show a helpful message
            newWindow.focus();
            
            // Optionally auto-open print dialog (some browsers block this)
            newWindow.print();
          }, 500);
        };
        
        // Clean up the blob URL after a delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 5000);
      } else {
        // Fallback: download as HTML file if popup blocked
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_script.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setUpdateStatus({ 
          type: 'success', 
          message: 'Script downloaded as HTML. Open the file and use your browser\'s print function to save as PDF.' 
        });
      }

    } catch (error) {
      console.error('Error exporting script:', error);
      setUpdateStatus({ 
        type: 'error', 
        message: `Script export failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const loadVisualFunctions = async () => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) return;

      const response = await fetch(`${API_URL}/api/video-generator/project/${project.id}/visual-functions`, {
        method: 'GET',
        headers: headers
      });

      const result = await response.json();
      if (result.success) {
        setVisualFunctions(result.visualFunctions);
      }
    } catch (error) {
      console.error('Error loading visual functions:', error);
    }
  };

  const saveVisualFunction = async (functionName: string, functionCode: string) => {
    try {
      setIsUpdating(true);
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) throw new Error('Authentication required');

      const response = await fetch(`${API_URL}/api/video-generator/project/${project.id}/visual-function/${functionName}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ functionCode })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setUpdateStatus({ type: 'success', message: 'Visual function updated successfully!' });
      await loadVisualFunctions(); // Reload functions
      setEditingVisualFunction(null);
      setOriginalVisualCode(functionCode);

      // Update project visual functions locally
      if (project.visualFunctions) {
        try {
          project.visualFunctions[functionName] = eval(`(${functionCode})`);
          // Refresh preview if current slide uses this visual (only for slides tab)
          if (activeTab === 'slides') {
            const currentSlide = slides[currentSlideIndex];
            if (currentSlide?.visual?.type === functionName) {
              updateSlidePreview(currentSlide, currentSlideIndex);
            }
          }
          // Refresh visual preview if this is the selected visual function (only for visuals tab)
          if (activeTab === 'visuals' && selectedVisualFunction?.function_name === functionName) {
            const updatedFunction = { ...selectedVisualFunction, function_code: functionCode };
            setSelectedVisualFunction(updatedFunction);
            updateVisualPreview(updatedFunction);
          }
        } catch (error) {
          console.error('Error updating local visual function:', error);
        }
      }

    } catch (error) {
      setUpdateStatus({ 
        type: 'error', 
        message: `Failed to save visual function: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    loadVisualFunctions();
  }, [project.id]);

  // Initialize first slide
  useEffect(() => {
    if (slides.length > 0 && editingSlide === '') {
      selectSlide(0);
    }
  }, [slides]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl">✏️</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Review & Edit Script
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Fine-tune your lesson content and visual functions with AI assistance
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Panel with Tabs */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200/60">
              <button
                onClick={() => handleTabSwitch('slides')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 relative ${
                  activeTab === 'slides'
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {activeTab === 'slides' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                )}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">📋</span>
                  <span className="hidden sm:inline">Lesson Steps</span>
                  <span className="sm:hidden">Steps</span>
                </div>
              </button>
              <button
                onClick={() => handleTabSwitch('visuals')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 relative ${
                  activeTab === 'visuals'
                    ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {activeTab === 'visuals' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500"></div>
                )}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🎨</span>
                  <span className="hidden sm:inline">Visual Functions</span>
                  <span className="sm:hidden">Visuals</span>
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'slides' ? (
                /* Slides Tab Content */
                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                  {isLoading ? (
                    // Skeleton loading for slides
                    Array.from({ length: 3 }).map((_, index) => (
                      <SlideSkeleton key={index} />
                    ))
                  ) : (
                    slides.map((slide, index) => (
                      <div
                        key={index}
                        onClick={() => selectSlide(index)}
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] ${
                          currentSlideIndex === index
                            ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg'
                            : 'border-slate-200 hover:border-blue-300 bg-white hover:shadow-md'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {slide.visual?.type ? '🎨' : '📝'}
                            </span>
                            <span className="font-semibold text-slate-800">
                              Slide {index + 1}
                            </span>
                            {hasSlideChanged() && currentSlideIndex === index && (
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                            {slide.speaker}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-800 mb-2 line-clamp-1">
                          {slide.title || 'Untitled Slide'}
                        </div>
                        <div className="text-xs text-slate-600 mb-2">
                          Speaker: {project.speakers?.[slide.speaker]?.name || slide.speaker}
                        </div>
                        <div className="text-xs text-slate-600 line-clamp-2 mb-2">
                          {(slide.content || '') + ' ' + (slide.content2 || '')}
                        </div>
                        {slide.visual?.type && (
                          <div className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700">
                            <span>🎨</span>
                            Visual: {slide.visual.type}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Visual Functions Tab Content */
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-semibold text-slate-800">Manage Visual Functions</h4>
                    <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      {visualFunctions.length} functions
                    </div>
                  </div>
                  
                  {/* Visual Functions List */}
                  <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                      // Skeleton loading for visual functions
                      Array.from({ length: 2 }).map((_, index) => (
                        <VisualFunctionSkeleton key={index} />
                      ))
                    ) : visualFunctions.length === 0 ? (
                      <div className="text-center py-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">🎨</span>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-2">No visual functions yet</h3>
                        <p className="text-sm text-slate-600">Create your first visual function to get started!</p>
                      </div>
                    ) : (
                      visualFunctions.map((vf) => (
                        <div 
                          key={vf.function_name} 
                          onClick={() => handleVisualFunctionSelect(vf)}
                          className={`border rounded-xl p-4 transition-all duration-200 cursor-pointer transform hover:scale-[1.02] ${
                            selectedVisualFunction?.function_name === vf.function_name
                              ? 'border-purple-400 bg-gradient-to-r from-purple-50 to-blue-50 shadow-lg'
                              : 'border-slate-200 hover:border-purple-300 bg-white hover:shadow-md'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h5 className="font-semibold text-slate-800 mb-1">{vf.function_name}</h5>
                              <p className="text-xs text-slate-500">
                                Updated: {new Date(vf.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingVisualFunction({name: vf.function_name, code: vf.function_code});
                              }}
                              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-md"
                            >
                              ✏️ Edit
                            </button>
                          </div>
                          
                          {/* Function Preview */}
                          <div className="bg-slate-50 rounded-lg p-3 mb-3">
                            <pre className="text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap line-clamp-3 font-mono">
                              {vf.function_code.substring(0, 150)}
                              {vf.function_code.length > 150 && '...'}
                            </pre>
                          </div>
                          
                          {/* Usage Info */}
                          <div className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700">
                            <span>📊</span>
                            Used in: {slides.filter(slide => slide.visual?.type === vf.function_name).length} slide(s)
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview & Editor */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                {activeTab === 'slides' ? (
                  <>
                    <span className="text-2xl">🖼️</span>
                    <span>Slide Preview</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">🎨</span>
                    <span>Visual Function Preview</span>
                  </>
                )}
              </h3>
              {activeTab === 'slides' && (
                <div className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700">
                  <span>📄</span>
                  Slide {currentSlideIndex + 1} of {slides.length}
                </div>
              )}
              {activeTab === 'visuals' && selectedVisualFunction && (
                <div className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700">
                  <span>⚙️</span>
                  {selectedVisualFunction.function_name}
                </div>
              )}
            </div>
            
            {/* Canvas Preview */}
            <div className="mb-6">
              {isLoading ? (
                <CanvasSkeleton />
              ) : (
                <div className="border-2 border-slate-200 rounded-xl overflow-hidden shadow-inner bg-white">
                  {activeTab === 'slides' ? (
                    <canvas
                      ref={canvasRef}
                      style={{ width: '100%', height: 'auto', maxHeight: '400px' }}
                      className="block"
                    />
                  ) : (
                    <canvas
                      ref={visualCanvasRef}
                      style={{ width: '100%', height: 'auto', maxHeight: '400px' }}
                      className="block"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Content Editor - For slides tab */}
            {activeTab === 'slides' && (
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200">
                <h4 className="font-semibold mb-4 text-slate-800 flex items-center gap-2">
                  <span className="text-lg">✏️</span>
                  Edit Content
                </h4>
                <textarea
                  value={editingSlide}
                  onChange={(e) => setEditingSlide(e.target.value)}
                  className="w-full h-32 p-4 border border-slate-300 rounded-xl text-sm font-mono resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="Edit the content for this slide..."
                />
                <div className="flex gap-3 mt-4 flex-wrap">
                  <button
                    onClick={saveSlideEdit}
                    disabled={isUpdating || !hasSlideChanged()}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
                      hasSlideChanged() && !isUpdating
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isUpdating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>💾</span>
                        Save Changes
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span>🤖</span>
                      AI Chat
                    </div>
                  </button>
                  {hasSlideChanged() && (
                    <button
                      onClick={() => {
                        selectSlide(currentSlideIndex);
                        setUpdateStatus({ type: 'info', message: 'Changes discarded' });
                      }}
                      className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span>↶</span>
                        Discard Changes
                      </div>
                    </button>
                  )}
                </div>

                {/* Enhanced AI Chat for Slides */}
                {showChat && (
                  <div className="mt-6 border border-slate-300 rounded-xl p-4 bg-white/80 backdrop-blur-sm shadow-inner">
                    <div className="text-sm text-slate-600 mb-4 flex items-center gap-2">
                      <span className="text-lg">💬</span>
                      Ask AI to modify the content or visual function...
                    </div>
                    
                    {/* AI Modification Type Selector */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setAiModifyType('content')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          aiModifyType === 'content'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span>📝</span>
                          Content
                        </div>
                      </button>
                      <button
                        onClick={() => setAiModifyType('visual')}
                        disabled={!JSON.parse(editingSlide).visual?.type}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          aiModifyType === 'visual' && JSON.parse(editingSlide).visual?.type
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg transform scale-105'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span>🎨</span>
                          Visual
                        </div>
                      </button>
                    </div>
                    
                    {/* Help Text */}
                    <div className="text-xs text-slate-500 mb-3 p-2 rounded-lg bg-slate-50">
                      {aiModifyType === 'content' 
                        ? '💡 Modify slide title, content, narration, or speaker...'
                        : JSON.parse(editingSlide).visual?.type
                          ? `💡 Modify the "${JSON.parse(editingSlide).visual.type}" visual function...`
                          : '⚠️ No visual function in this slide'
                      }
                    </div>
                    
                    {/* Chat Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAIChat()}
                        className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder={
                          aiModifyType === 'content' 
                            ? "e.g., Make the explanation simpler, change speaker to teacher..."
                            : "e.g., Add more colors, make the chart bigger, add animation..."
                        }
                      />
                      <button
                        onClick={handleAIChat}
                        disabled={!chatMessage.trim() || (aiModifyType === 'visual' && !JSON.parse(editingSlide).visual?.type)}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                      >
                        {aiModifyType === 'content' ? (
                          <div className="flex items-center gap-1">
                            <span>📝</span>
                            Modify
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span>🎨</span>
                            Edit Visual
                          </div>
                        )}
                      </button>
                    </div>
                    
                    {/* Visual Function Info */}
                    {aiModifyType === 'visual' && JSON.parse(editingSlide).visual?.type && (
                      <div className="mt-3 text-xs bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 font-semibold text-purple-700 mb-1">
                          <span>🎯</span>
                          Current visual: {JSON.parse(editingSlide).visual.type}
                        </div>
                        {JSON.parse(editingSlide).visual.params && (
                          <div className="text-purple-600">
                            Parameters: {JSON.stringify(JSON.parse(editingSlide).visual.params)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Visual Function Editor - For visuals tab */}
            {activeTab === 'visuals' && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                {selectedVisualFunction ? (
                  <>
                    <h4 className="font-semibold mb-4 text-slate-800 flex items-center gap-2">
                      <span className="text-lg">🎨</span>
                      Edit Visual Function
                    </h4>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Function Name</label>
                      <input
                        type="text"
                        value={selectedVisualFunction.function_name}
                        readOnly
                        className="w-full p-3 border border-slate-300 rounded-xl text-sm bg-slate-100 font-mono"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Function Code</label>
                      <textarea
                        value={selectedVisualFunction.function_code}
                        onChange={(e) => setSelectedVisualFunction({
                          ...selectedVisualFunction,
                          function_code: e.target.value
                        })}
                        className="w-full h-32 p-4 border border-slate-300 rounded-xl text-sm font-mono resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        placeholder="Edit the visual function code..."
                      />
                    </div>
                    <div className="flex gap-3 mb-4 flex-wrap">
                      <button
                        onClick={() => saveVisualFunction(selectedVisualFunction.function_name, selectedVisualFunction.function_code)}
                        disabled={isUpdating || !hasVisualCodeChanged()}
                        className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
                          hasVisualCodeChanged() && !isUpdating
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg'
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isUpdating ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>💾</span>
                            Save Function
                          </div>
                        )}
                      </button>
                      <button
                        onClick={() => setShowChat(!showChat)}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span>🤖</span>
                          AI Chat
                        </div>
                      </button>
                      <button
                        onClick={() => updateVisualPreview(selectedVisualFunction)}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span>🔄</span>
                          Refresh Preview
                        </div>
                      </button>
                    </div>

                    {/* AI Chat for Visual Functions */}
                    {showChat && (
                      <div className="mt-4 border border-purple-300 rounded-xl p-4 bg-white/80 backdrop-blur-sm shadow-inner">
                        <div className="text-sm text-purple-600 mb-4 flex items-center gap-2">
                          <span className="text-lg">💬</span>
                          Ask AI to modify the visual function code...
                        </div>
                        <div className="text-xs text-slate-500 mb-3 p-2 rounded-lg bg-purple-50">
                          💡 e.g., "Add more colors", "Make it bigger", "Add animation", "Draw a bar chart instead"
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleVisualAIChat()}
                            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-200 bg-white/80 backdrop-blur-sm"
                            placeholder="Describe how you want to modify this visual function..."
                          />
                          <button
                            onClick={handleVisualAIChat}
                            disabled={!chatMessage.trim()}
                            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                          >
                            <div className="flex items-center gap-2">
                              <span>🎨</span>
                              Modify
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🎨</span>
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-2">Select a Visual Function</h4>
                    <p className="text-sm text-slate-600">Choose a function from the left panel to preview and edit it here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Visual Function Editor Modal */}
        {editingVisualFunction && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800">
                  {editingVisualFunction.name ? (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎨</span>
                      Edit Function: <span className="text-purple-600">{editingVisualFunction.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎨</span>
                      Create New Visual Function
                    </div>
                  )}
                </h3>
                <button
                  onClick={() => setEditingVisualFunction(null)}
                  className="text-slate-500 hover:text-slate-700 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all duration-200"
                >
                  ✕
                </button>
              </div>
              
              {/* Function Name Input - Only for new functions */}
              {!editingVisualFunction.name && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Function Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., drawChart, createGraph, animateShape"
                    value={editingVisualFunction.name}
                    onChange={(e) => setEditingVisualFunction({...editingVisualFunction, name: e.target.value})}
                    className="w-full p-4 border border-slate-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none text-sm transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  />
                  <p className="text-xs text-slate-500 mt-2 bg-blue-50 p-2 rounded-lg">
                    💡 Choose a descriptive name for your visual function (letters, numbers, and underscores only)
                  </p>
                </div>
              )}
              
              {/* Function Code Editor */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Function Code
                </label>
                <textarea
                  value={editingVisualFunction.code}
                  onChange={(e) => setEditingVisualFunction({...editingVisualFunction, code: e.target.value})}
                  className="w-full h-96 p-4 border border-slate-300 rounded-xl text-sm font-mono resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none bg-slate-50/80 backdrop-blur-sm transition-all duration-200"
                  placeholder="function myVisual(ctx, param1, param2, param3) {
  // Your visual code here
  // ctx is the canvas 2D context
  // Use ctx.fillRect(), ctx.arc(), ctx.fillText(), etc.
  
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(250, 250, 200, 100);
  
  ctx.fillStyle = '#4ecdc4';
  ctx.font = '20px Arial';
  ctx.fillText('Hello World!', 300, 300);
}"
                />
                <div className="mt-3 text-xs text-slate-600 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border-l-4 border-blue-400">
                  <div className="flex items-center gap-2 font-semibold text-blue-700 mb-2">
                    <span>💡</span>
                    Development Tips:
                  </div>
                  <ul className="space-y-1 list-disc list-inside text-slate-600">
                    <li>Use <code className="bg-white px-1 rounded">ctx</code> for canvas drawing operations</li>
                    <li>Parameters <code className="bg-white px-1 rounded">param1, param2, param3</code> can be passed from slides</li>
                    <li>Canvas size is 1000x700 pixels, drawing area is 200x200 to 800x600</li>
                    <li>Use <code className="bg-white px-1 rounded">ctx.fillStyle</code>, <code className="bg-white px-1 rounded">ctx.strokeStyle</code> for colors</li>
                  </ul>
                </div>
              </div>

              {/* Usage Information */}
              {editingVisualFunction.name && (
                <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 font-semibold text-purple-800 mb-2">
                    <span>📊</span>
                    Function Usage
                  </div>
                  <p className="text-sm text-purple-700">
                    This function is currently used in{' '}
                    <span className="font-semibold bg-white px-2 py-1 rounded-lg">
                      {slides.filter(slide => slide.visual?.type === editingVisualFunction.name).length}
                    </span>{' '}
                    slide(s)
                  </p>
                  {slides.filter(slide => slide.visual?.type === editingVisualFunction.name).length > 0 && (
                    <p className="text-xs text-purple-600 mt-2 bg-purple-100 p-2 rounded-lg">
                      ⚠️ Changes will affect all slides using this function
                    </p>
                  )}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditingVisualFunction(null)}
                  className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => saveVisualFunction(selectedVisualFunction.function_name, selectedVisualFunction.function_code)}
                  disabled={isUpdating || !hasVisualCodeChanged()}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                    hasVisualCodeChanged() && !isUpdating
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed transform-none'
                  }`}
                >
                  {isUpdating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>💾</span>
                      Save Function
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Message - Global */}
        {updateStatus && (
          <div className={`mt-8 p-4 rounded-xl max-w-2xl mx-auto border-l-4 shadow-lg ${
            updateStatus.type === 'success' 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-400' :
            updateStatus.type === 'error' 
              ? 'bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-400' :
            'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-800 border-blue-400'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-xl flex-shrink-0">
                {updateStatus.type === 'success' ? '✅' : 
                 updateStatus.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span className="font-medium">{updateStatus.message}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12">
          <button
            onClick={onBackToInput}
            className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <span>←</span>
            Back to Input
          </button>

          <button
            onClick={downloadPDF}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <span>📄</span>
            Download PDF
          </button>
          
          <button
            onClick={onProceedToVideo}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            <span>🎬</span>
            Generate Video
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}