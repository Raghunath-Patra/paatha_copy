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
  const [editingSlide, setEditingSlide] = useState<string>('');
  const [originalSlide, setOriginalSlide] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updateStatus, setUpdateStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Tab management
  const [activeTab, setActiveTab] = useState<'slides' | 'visuals'>('slides');
  const [visualFunctions, setVisualFunctions] = useState<any[]>([]);
  const [aiModifyType, setAiModifyType] = useState<'content' | 'visual'>('content');

  // Visual functions tab state
  const [selectedVisualFunction, setSelectedVisualFunction] = useState<any>(null);
  const visualCanvasRef = useRef<HTMLCanvasElement>(null);
  const [originalVisualCode, setOriginalVisualCode] = useState<string>('');

  // Canvas initialization flag
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Simulate loading states and ensure proper initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Force a render after loading is complete
      if (slides.length > 0 && canvasRef.current) {
        setTimeout(() => {
          updateSlidePreview(slides[currentSlideIndex] || slides[0], currentSlideIndex);
        }, 100);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Initialize canvases with immediate rendering
  useEffect(() => {
    console.log('🔧 Initializing canvases...');
    
    const initCanvas = (canvas: HTMLCanvasElement) => {
      canvas.width = 800;
      canvas.height = 560;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear and set default background
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, 800, 560);
        
        // Add a simple "Loading..." message initially
        ctx.fillStyle = '#64748b';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Initializing preview...', 400, 280);
      }
      return ctx;
    };

    let slideCanvasReady = false;
    let visualCanvasReady = false;

    if (canvasRef.current) {
      initCanvas(canvasRef.current);
      slideCanvasReady = true;
      console.log('✅ Slide canvas initialized');
    }
    
    if (visualCanvasRef.current) {
      initCanvas(visualCanvasRef.current);
      visualCanvasReady = true;
      console.log('✅ Visual canvas initialized');
    }

    if (slideCanvasReady && visualCanvasReady) {
      setCanvasInitialized(true);
      console.log('✅ All canvases ready');
    }
  }, []);

  // Update preview when conditions are met - with automatic rendering
  useEffect(() => {
    if (!canvasInitialized) return;

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (activeTab === 'slides' && slides[currentSlideIndex] && canvasRef.current) {
        console.log('🖼️ Auto-updating slide preview for slide', currentSlideIndex);
        try {
          updateSlidePreview(slides[currentSlideIndex], currentSlideIndex);
        } catch (error) {
          console.error('Error updating slide preview:', error);
          drawErrorMessage(canvasRef.current, 'Failed to render slide preview');
        }
      } else if (activeTab === 'visuals' && selectedVisualFunction && visualCanvasRef.current) {
        console.log('🎨 Auto-updating visual preview for:', selectedVisualFunction.function_name);
        try {
          updateVisualPreview(selectedVisualFunction);
        } catch (error) {
          console.error('Error updating visual preview:', error);
          drawErrorMessage(visualCanvasRef.current, 'Failed to render visual function');
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [activeTab, currentSlideIndex, selectedVisualFunction, canvasInitialized, slides]);

  // Auto-render when slides data becomes available
  useEffect(() => {
    if (canvasInitialized && slides.length > 0 && activeTab === 'slides' && !isLoading) {
      console.log('🔄 Slides data available, auto-rendering...');
      const timer = setTimeout(() => {
        updateSlidePreview(slides[currentSlideIndex] || slides[0], currentSlideIndex);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [slides, canvasInitialized, isLoading]);

  // Auto-render when tab switches
  useEffect(() => {
    if (!canvasInitialized) return;
    
    const timer = setTimeout(() => {
      if (activeTab === 'slides' && slides[currentSlideIndex]) {
        updateSlidePreview(slides[currentSlideIndex], currentSlideIndex);
      } else if (activeTab === 'visuals' && selectedVisualFunction) {
        updateVisualPreview(selectedVisualFunction);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Helper function to draw error messages
  const drawErrorMessage = (canvas: HTMLCanvasElement, message: string) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 560);
    
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ ' + (message || 'Rendering error'), 400, 280);
  };

  const updateSlidePreview = (slide: any, index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('❌ Slide canvas not available');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ Could not get 2D context from slide canvas');
      return;
    }

    console.log('🖼️ Rendering slide preview for slide', index, slide);

    try {
      // Clear canvas with background
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, 800, 560);

      // Draw background gradient based on speaker
      const backgroundColor = getBackgroundColor(slide.speaker);
      const gradient = ctx.createLinearGradient(0, 0, 800, 560);
      gradient.addColorStop(0, backgroundColor);
      gradient.addColorStop(1, '#ffffff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 560);

      // Draw border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 798, 558);

      // Draw title
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(slide.title || 'Untitled Slide', 400, 35);

      // Draw slide number
      ctx.fillStyle = '#64748b';
      ctx.font = '11px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`Slide ${index + 1}`, 780, 20);

      // Draw speaker info
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'left';
      const speakerName = project.speakers?.[slide.speaker]?.name || slide.speaker;
      ctx.fillText(`Speaker: ${speakerName}`, 20, 20);

      // Draw content area (limited space)
      ctx.fillStyle = '#334155';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      
      let yPos = 55;
      if (slide.content) {
        wrapText(ctx, slide.content, 20, yPos, 760, 16);
        yPos += 20;
      }
      if (slide.content2) {
        wrapText(ctx, slide.content2, 20, yPos, 760, 16);
        yPos += 20;
      }

      // Calculate visual area - ensure it fits within canvas and is responsive
      const visualArea = {
        x: 30,
        y: Math.min(yPos + 10, 90),
        width: 740,
        height: Math.min(380, 480 - Math.min(yPos + 10, 90))
      };

      // Visual area background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(visualArea.x, visualArea.y, visualArea.width, visualArea.height);
      
      // Visual area border
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(visualArea.x, visualArea.y, visualArea.width, visualArea.height);

      // Draw visual if available
      if (slide.visual && slide.visual.type && project.visualFunctions) {
        console.log('🎨 Drawing visual function:', slide.visual.type);
        try {
          const visualFunction = project.visualFunctions[slide.visual.type];
          if (visualFunction) {
            ctx.save();
            
            // Create proper clipping area with padding - ensure visual fits within bounds
            const padding = 15;
            const drawingWidth = visualArea.width - (padding * 2);
            const drawingHeight = visualArea.height - (padding * 2);
            
            ctx.translate(visualArea.x + padding, visualArea.y + padding);
            ctx.beginPath();
            ctx.rect(0, 0, drawingWidth, drawingHeight);
            ctx.clip();

            // Scale context to ensure visual functions fit within the available space
            const scaleX = drawingWidth / 400; // Assume visual functions are designed for ~400px width
            const scaleY = drawingHeight / 300; // Assume visual functions are designed for ~300px height
            const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down if needed
            
            if (scale < 1) {
              ctx.scale(scale, scale);
            }

            let func;
            if (typeof visualFunction === 'string') {
              // If it's a string, try to evaluate it as a function
              try {
                func = eval(`(${visualFunction})`);
              } catch (evalError) {
                // If eval fails, try Function constructor
                func = new Function('ctx', 'param1', 'param2', 'param3', 
                  visualFunction.replace(/^function\s+\w+\s*\([^)]*\)\s*\{/, '').replace(/\}$/, '')
                );
              }
            } else if (typeof visualFunction === 'function') {
              func = visualFunction;
            } else {
              throw new Error('Invalid visual function type');
            }
            
            if (slide.visual.params && slide.visual.params.length > 0) {
              func(ctx, ...slide.visual.params);
            } else {
              func(ctx);
            }
            ctx.restore();
            console.log('✅ Visual function executed successfully');
          } else {
            throw new Error(`Visual function "${slide.visual.type}" not found`);
          }
        } catch (error) {
          console.error('Error executing visual function:', error);
          ctx.save();
          ctx.fillStyle = '#ef4444';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          const errorMsg = error instanceof Error ? error.message : 'Visual function error';
          ctx.fillText(`Error: ${errorMsg}`, visualArea.x + visualArea.width/2, visualArea.y + visualArea.height/2);
          ctx.restore();
        }
      } else {
        // No visual placeholder
        ctx.save();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No visual function assigned', visualArea.x + visualArea.width/2, visualArea.y + visualArea.height/2);
        ctx.restore();
      }

      // Draw narration area only if there's space
      const narrationY = visualArea.y + visualArea.height + 10;
      if (slide.narration && narrationY < 540) {
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Narration:', 30, narrationY);
        
        ctx.fillStyle = '#475569';
        ctx.font = '9px Arial';
        const remainingHeight = 560 - narrationY - 10;
        if (remainingHeight > 12) {
          wrapText(ctx, slide.narration, 30, narrationY + 12, 740, 12);
        }
      }

      console.log('✅ Slide preview rendered successfully');
    } catch (error) {
      console.error('Error in updateSlidePreview:', error);
      drawErrorMessage(canvas, 'Failed to render slide');
    }
  };

  const updateVisualPreview = (visualFunction: any) => {
    const canvas = visualCanvasRef.current;
    if (!canvas) {
      console.log('❌ Visual canvas not available');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('❌ Could not get 2D context from visual canvas');
      return;
    }

    console.log('🎨 Rendering visual function preview for:', visualFunction.function_name);

    // Working area - ensure it fits properly within canvas and is responsive
    const workingArea = {
      x: 30,
      y: 45,
      width: 740,
      height: 480
    };
    try {
      // Clear canvas with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 560);

      // Draw border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 798, 558);

      // Draw header
      ctx.fillStyle = '#7c3aed';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Visual Function: ${visualFunction.function_name}`, 400, 25);

      // Working area background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(workingArea.x, workingArea.y, workingArea.width, workingArea.height);
      
      // Working area border
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(workingArea.x, workingArea.y, workingArea.width, workingArea.height);

      console.log('🔧 Executing visual function code...');
      
      ctx.save();
      
      // Create proper clipping area with padding - ensure visual stays within bounds
      const padding = 20;
      const drawingWidth = workingArea.width - (padding * 2);
      const drawingHeight = workingArea.height - (padding * 2);
      
      ctx.translate(workingArea.x + padding, workingArea.y + padding);
      ctx.beginPath();
      ctx.rect(0, 0, drawingWidth, drawingHeight);
      ctx.clip();
      
      // Scale context to ensure visual functions fit within the available space
      const scaleX = drawingWidth / 600; // Assume visual functions are designed for ~600px width
      const scaleY = drawingHeight / 400; // Assume visual functions are designed for ~400px height
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down if needed
      
      if (scale < 1) {
        ctx.scale(scale, scale);
      }
      
      let functionCode = visualFunction.function_code.trim();
      let func;
      
      if (functionCode.startsWith('function')) {
        const match = functionCode.match(/function\s+\w*\s*\([^)]*\)\s*\{([\s\S]*)\}$/);
        if (match) {
          const functionBody = match[1];
          func = new Function('ctx', 'param1', 'param2', 'param3', functionBody);
        } else {
          throw new Error('Invalid function format');
        }
      } else {
        func = new Function('ctx', 'param1', 'param2', 'param3', functionCode);
      }
      
      func(ctx, 'sample1', 'sample2', 'sample3');
      ctx.restore();
      
      console.log('✅ Visual function executed successfully');
      
    } catch (error) {
      console.error('❌ Error executing visual function:', error);
      
      ctx.restore();
      
      // Show error - ensure error message fits
      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(workingArea.x, workingArea.y, workingArea.width, workingArea.height);
      
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.strokeRect(workingArea.x, workingArea.y, workingArea.width, workingArea.height);
      
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ Error in Visual Function', 400, 250);
      
      ctx.fillStyle = '#b91c1c';
      ctx.font = '11px Arial';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      wrapText(ctx, errorMessage, 50, 280, 700, 14);
    }

    console.log('✅ Visual function preview completed');
  };

  // Helper function for text wrapping
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, currentY);
    }
  };

  const getBackgroundColor = (speaker: string) => {
    const colors = {
      teacher: '#f0f9ff',
      student1: '#fdf4ff',
      student2: '#fffbeb'
    };
    return colors[speaker as keyof typeof colors] || '#f8fafc';
  };

  const handleVisualFunctionSelect = (visualFunction: any) => {
    console.log('🎨 Selecting visual function:', visualFunction.function_name);
    setSelectedVisualFunction(visualFunction);
    setOriginalVisualCode(visualFunction.function_code);
    setUpdateStatus(null);
    
    // Force render when selecting visual function
    if (activeTab === 'visuals') {
      setTimeout(() => {
        updateVisualPreview(visualFunction);
      }, 100);
    }
  };

  const handleTabSwitch = (newTab: 'slides' | 'visuals') => {
    console.log(`🔄 Switching to tab: ${newTab}`);
    setActiveTab(newTab);
    setUpdateStatus(null);
    
    // Force render when switching tabs
    setTimeout(() => {
      if (newTab === 'slides' && slides[currentSlideIndex]) {
        updateSlidePreview(slides[currentSlideIndex], currentSlideIndex);
      } else if (newTab === 'visuals' && selectedVisualFunction) {
        updateVisualPreview(selectedVisualFunction);
      }
    }, 100);
  };

  // Force render button for debugging
  const forceRender = () => {
    if (activeTab === 'slides' && slides[currentSlideIndex]) {
      updateSlidePreview(slides[currentSlideIndex], currentSlideIndex);
    } else if (activeTab === 'visuals' && selectedVisualFunction) {
      updateVisualPreview(selectedVisualFunction);
    }
  };

  const selectSlide = (index: number) => {
    setCurrentSlideIndex(index);
    const slideData = JSON.stringify(slides[index], null, 2);
    setEditingSlide(slideData);
    setOriginalSlide(JSON.parse(JSON.stringify(slides[index])));
    setUpdateStatus(null);
    
    // Force update the preview immediately
    setTimeout(() => {
      if (canvasRef.current && activeTab === 'slides') {
        updateSlidePreview(slides[index], index);
      }
    }, 50);
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

      const updatedSlides = [...slides];
      updatedSlides[currentSlideIndex] = updatedSlide;
      onSlidesUpdate(updatedSlides);
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
        setUpdateStatus({ 
          type: 'success', 
          message: `AI updated the visual function "${result.updatedVisualFunction.name}"!` 
        });
        
        if (project.visualFunctions) {
          project.visualFunctions[result.updatedVisualFunction.name] = eval(`(${result.updatedVisualFunction.code})`);
        }
        
        updateSlidePreview(JSON.parse(editingSlide), currentSlideIndex);
        
      } else if (result.modifiedSlide) {
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
        const updatedFunction = {
          ...selectedVisualFunction,
          function_code: result.updatedCode
        };
        setSelectedVisualFunction(updatedFunction);
        
        setVisualFunctions(prev => 
          prev.map(vf => 
            vf.function_name === selectedVisualFunction.function_name 
              ? { ...vf, function_code: result.updatedCode }
              : vf
          )
        );
        
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

      const htmlContent = await response.text();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        newWindow.onload = () => {
          setTimeout(() => {
            newWindow.focus();
            newWindow.print();
          }, 500);
        };
        
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 5000);
      } else {
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
      await loadVisualFunctions();
      setOriginalVisualCode(functionCode);

      if (project.visualFunctions) {
        try {
          project.visualFunctions[functionName] = eval(`(${functionCode})`);
          if (activeTab === 'slides') {
            const currentSlide = slides[currentSlideIndex];
            if (currentSlide?.visual?.type === functionName) {
              updateSlidePreview(currentSlide, currentSlideIndex);
            }
          }
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
      <div className="max-w-full mx-auto px-2 sm:px-4 py-8">
        {/* Header with shimmer effect */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl">✏️</span>
          </div>
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2 bg-[length:200%_100%] animate-shimmer">
              Review & Edit Script
            </h2>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer-slide opacity-30"></div>
          </div>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Fine-tune your lesson content and visual functions with AI assistance
          </p>
        </div>

        {/* Main Content Grid - Changed breakpoint from xl to lg */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Tabs (1/2 width) */}
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
                <div>
                  <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar mb-6">
                    {isLoading ? (
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

                  {/* Edit Content Section - Below slides list */}
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="font-semibold mb-3 text-slate-800 flex items-center gap-2">
                      <span className="text-lg">✏️</span>
                      Edit Content
                    </h4>
                    <textarea
                      value={editingSlide}
                      onChange={(e) => setEditingSlide(e.target.value)}
                      className="w-full h-32 p-3 border border-slate-300 rounded-xl text-sm font-mono resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      placeholder="Edit the content for this slide..."
                    />
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button
                        onClick={saveSlideEdit}
                        disabled={isUpdating || !hasSlideChanged()}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
                          hasSlideChanged() && !isUpdating
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg'
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
                            Save
                          </div>
                        )}
                      </button>
                      {hasSlideChanged() && (
                        <button
                          onClick={() => {
                            selectSlide(currentSlideIndex);
                            setUpdateStatus({ type: 'info', message: 'Changes discarded' });
                          }}
                          className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span>↶</span>
                            Discard
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
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
                  <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar mb-6">
                    {isLoading ? (
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

                  {/* Visual Function Editor - Below functions list */}
                  {selectedVisualFunction && (
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
                      <h4 className="font-semibold mb-3 text-slate-800 flex items-center gap-2">
                        <span className="text-lg">🎨</span>
                        Edit Function
                      </h4>
                      <div className="mb-3">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Function Name</label>
                        <input
                          type="text"
                          value={selectedVisualFunction.function_name}
                          readOnly
                          className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-100 font-mono"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Function Code</label>
                        <textarea
                          value={selectedVisualFunction.function_code}
                          onChange={(e) => setSelectedVisualFunction({
                            ...selectedVisualFunction,
                            function_code: e.target.value
                          })}
                          className="w-full h-32 p-3 border border-slate-300 rounded-lg text-sm font-mono resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-200 bg-white/80 backdrop-blur-sm"
                          placeholder="Edit the visual function code..."
                        />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => saveVisualFunction(selectedVisualFunction.function_name, selectedVisualFunction.function_code)}
                          disabled={isUpdating || !hasVisualCodeChanged()}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
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
                              Save
                            </div>
                          )}
                        </button>
                        <button
                          onClick={() => updateVisualPreview(selectedVisualFunction)}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                          <div className="flex items-center gap-2">
                            <span>🔄</span>
                            Refresh
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview & AI Chat (1/2 width) */}
          <div className="space-y-6">
            {/* Preview Section */}
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
                        className="block w-full h-auto max-w-full"
                        style={{ aspectRatio: '800/560', maxHeight: '400px' }}
                      />
                    ) : (
                      <canvas
                        ref={visualCanvasRef}
                        className="block w-full h-auto max-w-full"
                        style={{ aspectRatio: '800/560', maxHeight: '400px' }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* AI Chat Section */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
              <h4 className="font-semibold mb-4 text-slate-800 flex items-center gap-2">
                <span className="text-lg">🤖</span>
                AI Assistant
              </h4>
              
              {activeTab === 'slides' && (
                <>
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
                      disabled={!editingSlide || !JSON.parse(editingSlide || '{}').visual?.type}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        aiModifyType === 'visual' && editingSlide && JSON.parse(editingSlide || '{}').visual?.type
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
                  <div className="text-xs text-slate-500 mb-3 p-3 rounded-lg bg-white/50">
                    {aiModifyType === 'content' 
                      ? '💡 Modify slide title, content, narration, or speaker...'
                      : editingSlide && JSON.parse(editingSlide || '{}').visual?.type
                        ? `💡 Modify the "${JSON.parse(editingSlide || '{}').visual.type}" visual function...`
                        : '⚠️ No visual function in this slide'
                    }
                  </div>
                </>
              )}

              {activeTab === 'visuals' && (
                <div className="text-xs text-slate-500 mb-3 p-3 rounded-lg bg-white/50">
                  💡 e.g., "Add more colors", "Make it bigger", "Add animation", "Draw a bar chart instead"
                </div>
              )}
              
              {/* Chat Interface */}
              <div className="space-y-3">
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="w-full h-24 px-4 py-3 border border-slate-300 rounded-xl text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all duration-200 bg-white/80 backdrop-blur-sm resize-none"
                  placeholder={
                    activeTab === 'slides'
                      ? aiModifyType === 'content' 
                        ? "e.g., Make the explanation simpler, change speaker to teacher..."
                        : "e.g., Add more colors, make the chart bigger, add animation..."
                      : "Describe how you want to modify this visual function..."
                  }
                />
                <button
                  onClick={activeTab === 'slides' ? handleAIChat : handleVisualAIChat}
                  disabled={
                    !chatMessage.trim() || 
                    (activeTab === 'slides' && aiModifyType === 'visual' && (!editingSlide || !JSON.parse(editingSlide || '{}').visual?.type)) ||
                    (activeTab === 'visuals' && !selectedVisualFunction)
                  }
                  className={`w-full px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 transform shadow-lg ${
                    (!chatMessage.trim() || 
                     (activeTab === 'slides' && aiModifyType === 'visual' && (!editingSlide || !JSON.parse(editingSlide || '{}').visual?.type)) ||
                     (activeTab === 'visuals' && !selectedVisualFunction))
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed transform-none'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white hover:scale-105'
                  }`}
                >
                  {activeTab === 'slides' ? (
                    aiModifyType === 'content' ? (
                      <div className="flex items-center justify-center gap-2">
                        <span>📝</span>
                        Modify Content
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>🎨</span>
                        Edit Visual
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>🎨</span>
                      Modify Function
                    </div>
                  )}
                </button>
              </div>
              
              {/* Visual Function Info */}
              {activeTab === 'slides' && aiModifyType === 'visual' && editingSlide && JSON.parse(editingSlide || '{}').visual?.type && (
                <div className="mt-4 text-xs bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 font-semibold text-purple-700 mb-1">
                    <span>🎯</span>
                    Current visual: {JSON.parse(editingSlide || '{}').visual.type}
                  </div>
                  {JSON.parse(editingSlide || '{}').visual.params && (
                    <div className="text-purple-600">
                      Parameters: {JSON.stringify(JSON.parse(editingSlide || '{}').visual.params)}
                    </div>
                  )}
                </div>
              )}

              {/* No Visual Function Selected Message */}
              {activeTab === 'visuals' && !selectedVisualFunction && (
                <div className="text-center py-8 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">🎨</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-2">Select a Visual Function</h4>
                  <p className="text-sm text-slate-600">Choose a function from the left to edit it with AI assistance.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Message */}
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
            Back
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

      {/* Custom Animations and Scrollbar Styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes shimmer-slide {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        .animate-shimmer-slide {
          animation: shimmer-slide 2s ease-in-out infinite;
        }
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