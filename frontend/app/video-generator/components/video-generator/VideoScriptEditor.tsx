'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getAuthHeaders } from '../../../utils/auth';
import PDFExportButton from './PDFExportButton';
import VideoScriptPDFExport from './VideoScriptPDFExport';
import { useCreditRefresh } from '../../hooks/useCreditRefresh';

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

// Shimmer component for loading states
const Shimmer = ({ children, isActive }: { children: React.ReactNode; isActive: boolean }) => (
  <div className={`relative ${isActive ? 'overflow-hidden' : ''}`}>
    {children}
    {isActive && (
      <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    )}
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
  
  // Form fields for editing
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    content2: '',
    narration: '',
    speaker: ''
  });
  
  const [originalSlide, setOriginalSlide] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAiWorking, setIsAiWorking] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State to hold AI-suggested changes that haven't been saved yet
  const [stagedChanges, setStagedChanges] = useState<{
    slideData?: any;
    visualFunction?: { functionName: string; code: string };
  } | null>(null);

  const [showPdfExport, setShowPdfExport] = useState(false);
  const {refreshCredits} = useCreditRefresh();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Get current slide data (either from form or staged changes)
  const getCurrentSlideData = () => {
    if (stagedChanges?.slideData) {
      return stagedChanges.slideData;
    }
    
    const baseSlide = slides[currentSlideIndex];
    return {
      ...baseSlide,
      title: formData.title || baseSlide?.title || '',
      content: formData.content || baseSlide?.content || '',
      content2: formData.content2 || baseSlide?.content2 || '',
      narration: formData.narration || baseSlide?.narration || '',
      speaker: formData.speaker || baseSlide?.speaker || ''
    };
  };
  
  const currentSlideHasVisual = useMemo(() => {
    return !!getCurrentSlideData().visual?.type;
  }, [formData, currentSlideIndex, slides, stagedChanges]);

  // Initialize canvas for preview
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 1000;
      canvas.height = 700;
      setPreviewCanvas(canvas);
    }
  }, []);

  // Update preview when slide changes or canvas is ready
  useEffect(() => {
    if (previewCanvas && slides[currentSlideIndex]) {
      const slideData = getCurrentSlideData();
      updateSlidePreview(slideData);
    }
  }, [currentSlideIndex, slides, previewCanvas, formData, stagedChanges]);

  const updateSlidePreview = (slide: any) => {
    if (!previewCanvas) return;

    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 1000, 700);

    // Draw background and base content...
    const backgroundColor = getBackgroundColor(slide.speaker);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, 1000, 700);
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(slide.title || 'Untitled Slide', 500, 75);
    ctx.fillStyle = '#374151';
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    if (slide.content) ctx.fillText(slide.content, 500, 120);
    if (slide.content2) ctx.fillText(slide.content2, 500, 150);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(200, 200, 600, 400);

    // Determine which visual code to execute (staged or original)
    let visualCodeToExecute: string | Function | null = null;
    if (slide.visual?.type) {
        if (stagedChanges?.visualFunction && slide.visual.type === stagedChanges.visualFunction.functionName) {
            visualCodeToExecute = stagedChanges.visualFunction.code;
        } else if (project.visualFunctions && project.visualFunctions[slide.visual.type]) {
            visualCodeToExecute = project.visualFunctions[slide.visual.type];
        }
    }

    // Draw visual if available
    if (visualCodeToExecute) {
      try {
        let func: Function;
        if (typeof visualCodeToExecute === 'string') {
          const functionBody = visualCodeToExecute.replace(/^function\s+\w+\s*\([^)]*\)\s*\{/, '').replace(/\}$/, '');
          func = new Function('ctx', 'param1', 'param2', 'param3', functionBody);
        } else {
          func = visualCodeToExecute;
        }

        if (slide.visual.params && slide.visual.params.length > 0) {
          func(ctx, ...slide.visual.params);
        } else {
          func(ctx);
        }
      } catch (error) {
        console.error('Error executing visual function:', error);
        ctx.fillStyle = '#ef4444';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Error in visual function', 500, 400);
      }
    }

    drawAvatars(ctx, slide.speaker);
  };

  const getBackgroundColor = (speaker: string) => {
    const colors = {
      teacher: '#f0f9ff',
      student1: '#faf5ff',
      student2: '#fefbff'
    };
    return colors[speaker as keyof typeof colors] || '#f8fafc';
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
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#a78bfa' : '#e5e7eb';
      ctx.fill();
      ctx.strokeStyle = isActive ? config.color : '#d1d5db';
      ctx.lineWidth = isActive ? 3 : 1;
      ctx.stroke();
      ctx.fillStyle = isActive ? '#374151' : '#6b7280';
      ctx.font = `${isActive ? 'bold ' : ''}12px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(config.name, x, y + 25);
    });
  };

  const selectSlide = (index: number) => {
    setCurrentSlideIndex(index);
    const slide = slides[index];
    
    // Populate form with slide data
    setFormData({
      title: slide.title || '',
      content: slide.content || '',
      content2: slide.content2 || '',
      narration: slide.narration || '',
      speaker: slide.speaker || ''
    });
    
    setOriginalSlide(JSON.parse(JSON.stringify(slide))); // Deep copy
    setUpdateStatus(null);
    setStagedChanges(null); // Discard staged changes when switching slides
  };

  const hasSlideChanged = () => {
    if (!originalSlide) return false;
    
    const currentData = getCurrentSlideData();
    const hasFormChanges = 
      originalSlide.title !== formData.title ||
      originalSlide.content !== formData.content ||
      originalSlide.content2 !== formData.content2 ||
      originalSlide.narration !== formData.narration ||
      originalSlide.speaker !== formData.speaker;
    
    return hasFormChanges || stagedChanges !== null;
  };

  const saveSlideEdit = async () => {
    try {
      if (!hasSlideChanged()) {
        setUpdateStatus({ type: 'info', message: 'No changes detected' });
        return;
      }

      setIsUpdating(true);
      setUpdateStatus({ type: 'info', message: 'Saving changes...' });

      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) throw new Error('Authentication required');

      const updatedSlide = getCurrentSlideData();
      
      const needsAudioRegeneration =
        originalSlide.narration !== updatedSlide.narration ||
        originalSlide.speaker !== updatedSlide.speaker;

      // Consolidate payload for the backend
      const payload = {
          stepData: updatedSlide,
          regenerateAudio: needsAudioRegeneration,
          // Include staged visual if it exists
          updatedVisual: stagedChanges?.visualFunction || undefined
      };

      const response = await fetch(`${API_URL}/api/video-generator/project/${project.id}/step/${currentSlideIndex + 1}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update slide');

      // Update local project state with the now-saved visual
      if (stagedChanges?.visualFunction) {
          project.visualFunctions[stagedChanges.visualFunction.functionName] = eval(`(${stagedChanges.visualFunction.code})`);
      }

      // Update local slides state
      const updatedSlides = [...slides];
      updatedSlides[currentSlideIndex] = updatedSlide;
      onSlidesUpdate(updatedSlides);
      
      setOriginalSlide(JSON.parse(JSON.stringify(updatedSlide))); // Update original reference
      setStagedChanges(null); // Clear staged changes

      setUpdateStatus({
        type: 'success',
        message: 'Changes saved successfully!'
      });

    } catch (error) {
      console.error('Error saving slide:', error);
      setUpdateStatus({
        type: 'error',
        message: `Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAiRequest = async () => {
    if (!chatMessage.trim() || isAiWorking) return;

    try {
        setIsAiWorking(true);
        setUpdateStatus({ type: 'info', message: `AI is processing your request...` });

        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) throw new Error('Authentication required');

        const currentSlideData = getCurrentSlideData();

        // Single unified endpoint for all AI modifications
        const response = await fetch(`${API_URL}/api/video-generator/project/${project.id}/step/${currentSlideIndex + 1}/ai-modify`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                currentSlide: currentSlideData,
                modification: chatMessage,
                availableVisualFunctions: Object.keys(project.visualFunctions || {}),
                hasExistingVisual: currentSlideHasVisual
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'AI request failed');

        // Handle different types of AI responses based on backend response structure
        await refreshCredits();
        // Case 1: New visual was added (has both updatedSlide and newVisualFunction)
        if (result.newVisualAdded && result.newVisualFunction && result.updatedSlide) {
            const updatedSlide = result.updatedSlide;
            setFormData({
                title: updatedSlide.title || '',
                content: updatedSlide.content || '',
                content2: updatedSlide.content2 || '',
                narration: updatedSlide.narration || '',
                speaker: updatedSlide.speaker || ''
            });
            setStagedChanges({
                slideData: updatedSlide,
                visualFunction: {
                    functionName: result.newVisualFunction.name,
                    code: result.newVisualFunction.code
                }
            });
        }
        // Case 2: Existing visual was modified (has updatedVisual)
        else if (result.updatedVisual) {
            setStagedChanges(prev => ({
                slideData: prev?.slideData,
                visualFunction: {
                    functionName: result.updatedVisual.functionName,
                    code: result.updatedVisual.code
                }
            }));
            
            // Also update slide content if provided (combined case)
            if (result.updatedSlide) {
                const updatedSlide = result.updatedSlide;
                setFormData({
                    title: updatedSlide.title || '',
                    content: updatedSlide.content || '',
                    content2: updatedSlide.content2 || '',
                    narration: updatedSlide.narration || '',
                    speaker: updatedSlide.speaker || ''
                });
                setStagedChanges(prev => ({
                    slideData: updatedSlide,
                    visualFunction: prev?.visualFunction
                }));
            }
        }
        // Case 3: Only content was modified (has updatedSlide but no visual changes)
        else if (result.updatedSlide) {
            const updatedSlide = result.updatedSlide;
            setFormData({
                title: updatedSlide.title || '',
                content: updatedSlide.content || '',
                content2: updatedSlide.content2 || '',
                narration: updatedSlide.narration || '',
                speaker: updatedSlide.speaker || ''
            });
        }

        setUpdateStatus({ 
            type: 'success', 
            message: result.message || 'AI modifications applied! Review and save to confirm.' 
        });
        
        setChatMessage('');
        
    } catch (error) {
        console.error('Error with AI request:', error);
        setUpdateStatus({ 
            type: 'error', 
            message: `AI failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
    } finally {
        setIsAiWorking(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) throw new Error('Authentication required');

      const response = await fetch(`${API_URL}/api/video-generator/project/${project.id}/export-pdf`, {
        headers
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title}_script.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setUpdateStatus({
        type: 'error',
        message: 'Failed to download PDF'
      });
    }
  };

  // Initialize first slide
  useEffect(() => {
    if (slides.length > 0 && currentSlideIndex === 0) {
      selectSlide(0);
    }
  }, [slides]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
          50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.5); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }
        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-text-shimmer {
          background: linear-gradient(
            90deg,
            #2563eb 0%,
            #7c3aed 25%,
            #c084fc 50%,
            #7c3aed 75%,
            #2563eb 100%
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-shimmer 3s linear infinite;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold animate-text-shimmer mb-2">
            ✏️ Review & Edit Script
          </h2>
          <p className="text-gray-600">Fine-tune your educational video content with AI assistance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Lesson Steps */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100 p-6">
            <h3 className="text-xl font-semibold mb-6 text-purple-700 flex items-center">
              📋 Lesson Steps
              <span className="ml-2 text-sm font-normal text-gray-500">({slides.length} slides)</span>
            </h3>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {slides.map((slide, index) => (
                <Shimmer key={index} isActive={isAiWorking && currentSlideIndex === index}>
                  <div
                    onClick={() => selectSlide(index)}
                    className={`cursor-pointer p-5 rounded-xl border-2 transition-all duration-300 ${
                      currentSlideIndex === index
                        ? 'border-purple-400 bg-gradient-to-r from-purple-50 to-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-purple-300 bg-white/50 hover:bg-white/80'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-semibold text-sm flex items-center">
                        {slide.visual?.type ? '🎨' : '📝'} Slide {index + 1}
                        {hasSlideChanged() && currentSlideIndex === index && (
                          <span className="ml-2 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                        )}
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {slide.speaker}
                      </span>
                    </div>
                    <div className="text-base font-semibold text-gray-800 mb-2">
                      {slide.title || 'Untitled Slide'}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Speaker: {project.speakers?.[slide.speaker]?.name || slide.speaker}
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-2">
                      {(slide.content || '') + ' ' + (slide.content2 || '')}
                    </div>
                    {slide.visual?.type && (
                      <div className="text-sm text-purple-600 mt-2 flex items-center">
                        <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                        Visual: {slide.visual.type}
                      </div>
                    )}
                  </div>
                </Shimmer>
              ))}
            </div>
          </div>

          {/* Right Panel - Preview & Editor */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-blue-700">🖼️ Slide Preview</h3>
              <span className="text-sm px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full">
                Slide {currentSlideIndex + 1} of {slides.length}
              </span>
            </div>

            <Shimmer isActive={isAiWorking}>
              <div className="mb-6 border-2 border-gray-200 rounded-xl overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  style={{ width: '100%', height: 'auto', maxHeight: '350px' }}
                  className="block"
                />
              </div>
            </Shimmer>

            {/* Form-based Editor */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
              <h4 className="font-semibold mb-4 text-gray-800 flex items-center">
                ✏️ Edit Content
                {stagedChanges && (
                  <span className="ml-2 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                    AI changes pending
                  </span>
                )}
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    placeholder="Enter slide title..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content Line 1</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                      rows={3}
                      placeholder="First content line..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Content Line 2</label>
                    <textarea
                      value={formData.content2}
                      onChange={(e) => setFormData(prev => ({ ...prev, content2: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                      rows={3}
                      placeholder="Second content line..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Narration Script</label>
                  <textarea
                    value={formData.narration}
                    onChange={(e) => setFormData(prev => ({ ...prev, narration: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                    rows={4}
                    placeholder="What the speaker will say..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Speaker Name
                    <span className="text-xs text-gray-500 ml-1">({formData.speaker})</span>
                  </label>
                  <input
                    type="text"
                    value={project.speakers?.[formData.speaker]?.name || formData.speaker}
                    onChange={(e) => {
                      // Update the speaker name in the project speakers object
                      if (project.speakers && project.speakers[formData.speaker]) {
                        project.speakers[formData.speaker].name = e.target.value;
                      }
                      // Trigger a re-render by updating formData (even though speaker key doesn't change)
                      setFormData(prev => ({ ...prev, speaker: prev.speaker }));
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                    placeholder="Enter speaker name..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 flex-wrap">
                <Shimmer isActive={isUpdating}>
                  <button
                    onClick={saveSlideEdit}
                    disabled={isUpdating || !hasSlideChanged()}
                    className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      hasSlideChanged() && !isUpdating
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg transform hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isUpdating ? '⏳ Saving...' : '💾 Save Changes'}
                  </button>
                </Shimmer>

                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    isAiWorking 
                      ? 'bg-purple-400 animate-pulse-glow' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg transform hover:scale-105'
                  } text-white`}
                >
                  🤖 AI Assistant {isAiWorking && '(Working...)'}
                </button>

                {hasSlideChanged() && (
                  <button
                    onClick={() => selectSlide(currentSlideIndex)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    ↶ Discard Changes
                  </button>
                )}
              </div>

              {/* AI Assistant Chat */}
              {showChat && (
                <Shimmer isActive={isAiWorking}>
                  <div className="mt-6 border border-purple-200 rounded-xl p-4 bg-gradient-to-br from-white to-purple-50">
                    <div className="text-sm text-gray-700 mb-4">
                      <strong className="text-purple-700">🤖 AI Assistant</strong>
                      <p className="text-xs text-gray-500 mt-1">
                        Tell me what you'd like to change about this slide. I can modify content, narration, speaker, or create/edit visuals.
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isAiWorking && handleAiRequest()}
                        disabled={isAiWorking}
                        className="flex-1 px-4 py-3 border border-purple-200 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all disabled:bg-gray-100"
                        placeholder="e.g., 'Make this simpler', 'Add a bar chart', 'Change speaker to teacher'"
                      />
                      <button
                        onClick={handleAiRequest}
                        disabled={!chatMessage.trim() || isAiWorking}
                        className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                          isAiWorking
                            ? 'bg-purple-400 animate-pulse cursor-not-allowed'
                            : chatMessage.trim()
                              ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transform hover:scale-105'
                              : 'bg-gray-300 cursor-not-allowed'
                        } text-white`}
                      >
                        {isAiWorking ? '🔄 Working...' : '🤖 Send'}
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-3">
                      <strong>Examples:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>"Make the explanation simpler for beginners"</li>
                        <li>"Add a pie chart showing the data"</li>
                        <li>"Change the speaker to student1"</li>
                        <li>"Make the visual more colorful"</li>
                        <li>"Add more detail to the narration"</li>
                      </ul>
                    </div>
                  </div>
                </Shimmer>
              )}

              {updateStatus && (
                <div className={`mt-6 p-4 rounded-xl border ${
                  updateStatus.type === 'success' 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200' :
                  updateStatus.type === 'error' 
                    ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border-red-200' :
                    'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border-blue-200'
                } shadow-sm`}>
                  <div className="flex items-center">
                    {updateStatus.type === 'success' && <span className="mr-2">✅</span>}
                    {updateStatus.type === 'error' && <span className="mr-2">❌</span>}
                    {updateStatus.type === 'info' && <span className="mr-2">ℹ️</span>}
                    {updateStatus.message}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex justify-center gap-6 mt-12">
          <button
            onClick={onBackToInput}
            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg transform hover:scale-105"
          >
            ← Back to Input
          </button>
          
          <button
            onClick={() => setShowPdfExport(true)}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg transform hover:scale-105"
          >
            📄 Download PDF
          </button>
          
          <button
            onClick={onProceedToVideo}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg transform hover:scale-105"
          >
            🎬 Generate Video →
          </button>
        </div>
      </div>

      {/* PDF Export Modal */}
      {showPdfExport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">📄 Export PDF</h3>
              <button
                onClick={() => setShowPdfExport(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            
            <PDFExportButton
              project={project}
              slides={slides}
              filename={`${project.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-script.pdf`}
            />
            {/* <VideoScriptPDFExport 
              project={project} 
              slides={slides}
              filename={`${project.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-script.pdf`}
              buttonText="Downloadt PDF"
            /> */}

            <button
              onClick={() => setShowPdfExport(false)}
              className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}