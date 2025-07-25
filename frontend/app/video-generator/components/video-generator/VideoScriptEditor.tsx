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
  const [chatMessage, setChatMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Tab management
  const [activeTab, setActiveTab] = useState<'slides' | 'visuals'>('slides');
  const [visualFunctions, setVisualFunctions] = useState<any[]>([]);
  const [aiModifyType, setAiModifyType] = useState<'content' | 'visual'>('content');

  // State for visual functions tab
  const [selectedVisualFunction, setSelectedVisualFunction] = useState<any>(null);
  const [editingVisualCode, setEditingVisualCode] = useState('');
  const [originalVisualCode, setOriginalVisualCode] = useState('');
  const visualCanvasRef = useRef<HTMLCanvasElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Initialize canvas for preview
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 1280;
      canvas.height = 720;
      setPreviewCanvas(canvas);
    }
    if (visualCanvasRef.current) {
        const canvas = visualCanvasRef.current;
        canvas.width = 1280;
        canvas.height = 720;
    }
  }, []);

  // Update preview when slide changes or canvas is ready
  useEffect(() => {
    if (previewCanvas && slides.length > 0 && slides[currentSlideIndex]) {
      updateSlidePreview(slides[currentSlideIndex]);
    }
  }, [currentSlideIndex, slides, previewCanvas, project.visualFunctions]);
  
  // Update visual preview when selected function changes
  useEffect(() => {
    if (visualCanvasRef.current && selectedVisualFunction) {
      updateVisualPreview(selectedVisualFunction.function_code);
    }
  }, [selectedVisualFunction, visualCanvasRef]);

  const updateSlidePreview = (slide: any) => {
    if (!previewCanvas) return;
    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1280, 720);

    // Draw visual if available
    if (slide.visual && slide.visual.type && project.visualFunctions) {
      try {
        const visualFunctionCode = project.visualFunctions[slide.visual.type];
        if (visualFunctionCode) {
           const funcBody = visualFunctionCode.match(/function\s*\w*\s*\([^)]*\)\s*\{([\s\S]*)\}/)?.[1] || visualFunctionCode;
           const func = new Function('ctx', 'param1', 'param2', 'param3', funcBody);
           ctx.save();
           func(ctx, ...(slide.visual.params || []));
           ctx.restore();
        }
      } catch (error) {
        console.error('Error executing visual function:', error);
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Error in visual function', 1280 / 2, 720 / 2);
      }
    }
  };

  const updateVisualPreview = (code: string) => {
      if (!visualCanvasRef.current) return;
      const ctx = visualCanvasRef.current.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 1280, 720);

      try {
          const funcBody = code.match(/function\s*\w*\s*\([^)]*\)\s*\{([\s\S]*)\}/)?.[1] || code;
          const func = new Function('ctx', 'param1', 'param2', 'param3', funcBody);
          ctx.save();
          func(ctx, 'sample1', 'sample2', 'sample3');
          ctx.restore();
      } catch (error) {
          console.error('Error executing visual function preview:', error);
          ctx.fillStyle = '#ff6b6b';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Error in visual function code', 1280 / 2, 720 / 2);
      }
  };

  const selectSlide = (index: number) => {
    setCurrentSlideIndex(index);
    const slideData = JSON.stringify(slides[index], null, 2);
    setEditingSlide(slideData);
    setOriginalSlide(JSON.parse(JSON.stringify(slides[index])));
    setUpdateStatus(null);
  };

  const handleVisualFunctionSelect = (vf: any) => {
    setSelectedVisualFunction(vf);
    setEditingVisualCode(vf.function_code);
    setOriginalVisualCode(vf.function_code);
    setUpdateStatus(null);
  };

  const hasSlideChanged = () => {
    if (!originalSlide) return false;
    try {
      return JSON.stringify(originalSlide) !== JSON.stringify(JSON.parse(editingSlide));
    } catch {
      return false;
    }
  };
  
  const hasVisualCodeChanged = () => {
      return originalVisualCode !== editingVisualCode;
  };

  const saveSlideEdit = async () => {
    if (!hasSlideChanged()) {
      setUpdateStatus({ type: 'info', message: 'No changes to save.' });
      return;
    }
    try {
      const updatedSlide = JSON.parse(editingSlide);
      setIsUpdating(true);
      setUpdateStatus({ type: 'info', message: 'Updating slide...' });

      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) throw new Error('Authentication required');
      
      const needsAudioRegeneration = originalSlide.narration !== updatedSlide.narration || originalSlide.speaker !== updatedSlide.speaker;

      const response = await fetch(`${API_URL}/api/video-generator/project/${project.id}/step/${currentSlideIndex + 1}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ stepData: updatedSlide, regenerateAudio: needsAudioRegeneration })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update slide');

      const updatedSlides = [...slides];
      updatedSlides[currentSlideIndex] = result.updatedStep;
      onSlidesUpdate(updatedSlides);
      setOriginalSlide(JSON.parse(JSON.stringify(result.updatedStep)));
      setUpdateStatus({ type: 'success', message: 'Slide updated successfully!' });
    } catch (error) {
      setUpdateStatus({ type: 'error', message: `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsUpdating(false);
    }
  };

  const saveVisualFunction = async () => {
      if (!selectedVisualFunction || !hasVisualCodeChanged()) {
          setUpdateStatus({ type: 'info', message: 'No changes to save.' });
          return;
      }
      try {
          setIsUpdating(true);
          setUpdateStatus({ type: 'info', message: 'Saving visual function...' });
          const { headers, isAuthorized } = await getAuthHeaders();
          if (!isAuthorized) throw new Error('Authentication required');

          const response = await fetch(`${API_URL}/api/video-generator/project/${project.id}/visual-function/${selectedVisualFunction.function_name}`, {
              method: 'PUT',
              headers,
              body: JSON.stringify({ functionCode: editingVisualCode })
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Failed to save function');
          
          setUpdateStatus({ type: 'success', message: 'Visual function saved!' });
          setOriginalVisualCode(editingVisualCode);
          // Also update the local list of functions
          setVisualFunctions(prev => prev.map(vf => vf.function_name === selectedVisualFunction.function_name ? {...vf, function_code: editingVisualCode} : vf));
          // Update the project-level functions for live preview
          project.visualFunctions[selectedVisualFunction.function_name] = editingVisualCode;

      } catch (error) {
          setUpdateStatus({ type: 'error', message: `Save failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
      } finally {
          setIsUpdating(false);
      }
  };


  const handleAiAssistantRequest = async () => {
    if (!chatMessage.trim()) return;
    
    try {
      setIsUpdating(true);
      setUpdateStatus({ type: 'info', message: `AI is processing your request...` });

      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) throw new Error('Authentication required');

      let endpoint = '';
      let body = {};

      if (aiModifyType === 'content') {
        endpoint = `${API_URL}/api/video-generator/project/${project.id}/step/${currentSlideIndex + 1}/ai-modify`;
        body = {
          currentSlide: JSON.parse(editingSlide),
          modification: chatMessage,
          modifyType: 'content'
        };
      } else { // 'visual'
        const functionName = activeTab === 'slides' ? slides[currentSlideIndex].visual?.type : selectedVisualFunction?.function_name;
        if (!functionName) {
            throw new Error("No visual function selected to modify.");
        }
        endpoint = `${API_URL}/api/video-generator/project/${project.id}/visual-function/${functionName}/ai-modify`;
        body = {
            currentCode: activeTab === 'slides' ? project.visualFunctions[functionName] : editingVisualCode,
            modification: chatMessage
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'AI modification failed');

      if (aiModifyType === 'content' && result.modifiedSlide) {
        setEditingSlide(JSON.stringify(result.modifiedSlide, null, 2));
        setUpdateStatus({ type: 'success', message: 'AI applied content changes. Review and save.' });
      } else if (aiModifyType === 'visual' && result.updatedCode) {
         if(activeTab === 'slides') {
            // If we are on the slides tab, the AI modified a function used by the current slide
            project.visualFunctions[result.functionName] = result.updatedCode;
            updateSlidePreview(slides[currentSlideIndex]); // Refresh preview
            setUpdateStatus({ type: 'success', message: `AI updated visual function '${result.functionName}'.` });
         } else {
            // If we are on the visuals tab, update the editor directly
            setEditingVisualCode(result.updatedCode);
            updateVisualPreview(result.updatedCode);
            setUpdateStatus({ type: 'success', message: 'AI applied visual changes. Review and save.' });
         }
      }
      setChatMessage('');
    } catch (error) {
      setUpdateStatus({ type: 'error', message: `AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsUpdating(false);
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
        if (result.visualFunctions.length > 0) {
            handleVisualFunctionSelect(result.visualFunctions[0]);
        }
      }
    } catch (error) {
      console.error('Error loading visual functions:', error);
    }
  };

  useEffect(() => {
    if (slides.length > 0 && editingSlide === '') {
      selectSlide(0);
    }
    loadVisualFunctions();
  }, [slides, project.id]);
  
  useEffect(() => {
    if (activeTab === 'slides' && slides.length > 0) {
        updateSlidePreview(slides[currentSlideIndex]);
    } else if (activeTab === 'visuals' && selectedVisualFunction) {
        updateVisualPreview(editingVisualCode);
    }
  }, [activeTab, editingVisualCode]);


  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-8xl mx-auto">
        <header className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Review & Edit Script</h1>
            <p className="text-gray-500 mt-1">Fine-tune your lesson content and visual functions with AI assistance</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-8">
            {/* TABS & LISTS */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('slides')}
                  className={`flex-1 px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'slides'
                      ? 'text-indigo-600 border-b-2 border-indigo-500'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📋 Lesson Steps
                </button>
                <button
                  onClick={() => setActiveTab('visuals')}
                  className={`flex-1 px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'visuals'
                      ? 'text-indigo-600 border-b-2 border-indigo-500'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🎨 Visual Functions
                </button>
              </div>
              <div className="p-4 space-y-3 max-h-[40vh] overflow-y-auto">
                {activeTab === 'slides' ? (
                  slides.map((slide, index) => (
                    <div
                      key={index}
                      onClick={() => selectSlide(index)}
                      className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                        currentSlideIndex === index
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-sm text-gray-800">
                          Slide {index + 1}: {slide.title || 'Untitled'}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{project.speakers?.[slide.speaker]?.name || slide.speaker}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                        {slide.narration}
                      </p>
                    </div>
                  ))
                ) : (
                  visualFunctions.map((vf) => (
                    <div
                      key={vf.function_name}
                      onClick={() => handleVisualFunctionSelect(vf)}
                      className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                        selectedVisualFunction?.function_name === vf.function_name
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                       <h5 className="font-semibold text-sm text-gray-800">{vf.function_name}</h5>
                       <p className="text-xs text-gray-500 mt-1">Used in {slides.filter(s => s.visual?.type === vf.function_name).length} slides</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* EDITOR */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              {activeTab === 'slides' ? (
                <>
                  <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">📝 Edit Content</h3>
                  <textarea
                    value={editingSlide}
                    onChange={(e) => setEditingSlide(e.target.value)}
                    className="w-full h-48 p-3 border border-gray-300 rounded-md text-xs font-mono bg-gray-50 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button
                    onClick={saveSlideEdit}
                    disabled={isUpdating || !hasSlideChanged()}
                    className="mt-3 px-4 py-2 rounded-md text-sm font-semibold transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Saving...' : '💾 Save'}
                  </button>
                </>
              ) : (
                selectedVisualFunction && (
                <>
                  <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">🎨 Edit Function: <span className="text-indigo-600">{selectedVisualFunction.function_name}</span></h3>
                  <textarea
                    value={editingVisualCode}
                    onChange={(e) => {
                        setEditingVisualCode(e.target.value);
                        updateVisualPreview(e.target.value);
                    }}
                    className="w-full h-48 p-3 border border-gray-300 rounded-md text-xs font-mono bg-gray-50 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button
                    onClick={saveVisualFunction}
                    disabled={isUpdating || !hasVisualCodeChanged()}
                    className="mt-3 px-4 py-2 rounded-md text-sm font-semibold transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Saving...' : '💾 Save'}
                  </button>
                </>
                )
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-8">
            {/* PREVIEW */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                        {activeTab === 'slides' ? '🖼️ Slide Preview' : '🎨 Visual Preview'}
                    </h3>
                    {activeTab === 'slides' && (
                        <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                            Slide {currentSlideIndex + 1} of {slides.length}
                        </span>
                    )}
                </div>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <canvas
                        ref={activeTab === 'slides' ? canvasRef : visualCanvasRef}
                        className="w-full h-full"
                    />
                </div>
            </div>

            {/* AI ASSISTANT */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">🤖 AI Assistant</h3>
                <div className="flex gap-2 mb-3 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setAiModifyType('content')}
                      className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        aiModifyType === 'content' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Content
                    </button>
                    <button
                      onClick={() => setAiModifyType('visual')}
                      className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        aiModifyType === 'visual' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Visual
                    </button>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                    {aiModifyType === 'content' ? 'e.g., Make the explanation simpler, change speaker to teacher...' : 'e.g., Add more colors, make the chart bigger, add animation...'}
                </p>
                <div className="flex flex-col gap-3">
                    <textarea
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAiAssistantRequest())}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Your request..."
                      rows={2}
                    />
                    <button
                      onClick={handleAiAssistantRequest}
                      disabled={isUpdating || !chatMessage.trim()}
                      className="w-full px-4 py-2.5 rounded-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? 'Thinking...' : '✨ Modify Content'}
                    </button>
                </div>
            </div>
          </div>
        </div>
        
        {updateStatus && (
            <div className={`mt-6 p-3 rounded-lg text-sm max-w-4xl mx-auto text-center ${
              updateStatus.type === 'success' ? 'bg-green-100 text-green-800' :
              updateStatus.type === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {updateStatus.message}
            </div>
        )}

        {/* NAVIGATION */}
        <footer className="flex justify-center items-center gap-4 mt-10">
            <button
              onClick={onBackToInput}
              className="px-6 py-2.5 rounded-lg font-semibold transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              ← Back
            </button>
            <button
              onClick={() => { /* Placeholder for PDF download */ }}
              className="px-6 py-2.5 rounded-lg font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700"
            >
              📄 Download PDF
            </button>
            <button
              onClick={onProceedToVideo}
              className="px-6 py-2.5 rounded-lg font-semibold transition-colors bg-green-600 text-white hover:bg-green-700"
            >
              Generate Video →
            </button>
        </footer>
      </div>
    </div>
  );
}
