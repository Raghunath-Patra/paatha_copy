'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [aiModifyType, setAiModifyType] = useState<'content' | 'visual'>('content');
  // State to hold AI-suggested visual code that hasn't been saved yet
  const [stagedVisual, setStagedVisual] = useState<{ functionName: string; code: string } | null>(null);


  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const currentSlideHasVisual = useMemo(() => {
    try {
      return !!JSON.parse(editingSlide).visual?.type;
    } catch {
      return false;
    }
  }, [editingSlide]);

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
      const slideData = JSON.parse(editingSlide || JSON.stringify(slides[currentSlideIndex]));
      updateSlidePreview(slideData);
    }
  }, [currentSlideIndex, slides, previewCanvas, editingSlide, stagedVisual]);


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
    ctx.fillStyle = '#1a5276';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(slide.title || 'Untitled Slide', 500, 75);
    ctx.fillStyle = '#2c3e50';
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    if (slide.content) ctx.fillText(slide.content, 500, 120);
    if (slide.content2) ctx.fillText(slide.content2, 500, 150);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.strokeRect(200, 200, 600, 400);

    // Determine which visual code to execute (staged or original)
    let visualCodeToExecute: string | Function | null = null;
    if (slide.visual?.type) {
        if (stagedVisual && slide.visual.type === stagedVisual.functionName) {
            visualCodeToExecute = stagedVisual.code;
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
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Error in visual function', 500, 400);
      }
    }

    drawAvatars(ctx, slide.speaker);
  };

  const getBackgroundColor = (speaker: string) => {
    const colors = {
      teacher: '#f8fafe',
      student1: '#f3e8ff',
      student2: '#fefaf8'
    };
    return colors[speaker as keyof typeof colors] || '#e9f0f4';
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
      ctx.fillStyle = isActive ? '#fdbcb4' : '#e0e0e0';
      ctx.fill();
      ctx.strokeStyle = isActive ? config.color : '#ccc';
      ctx.lineWidth = isActive ? 3 : 1;
      ctx.stroke();
      ctx.fillStyle = isActive ? '#2c3e50' : '#666';
      ctx.font = `${isActive ? 'bold ' : ''}12px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(config.name, x, y + 25);
    });
  };

  const selectSlide = (index: number) => {
    setCurrentSlideIndex(index);
    const slideData = JSON.stringify(slides[index], null, 2);
    setEditingSlide(slideData);
    setOriginalSlide(JSON.parse(JSON.stringify(slides[index]))); // Deep copy
    setUpdateStatus(null);
    setStagedVisual(null); // Discard staged changes when switching slides
  };

  const hasSlideChanged = () => {
    if (!originalSlide) return false;
    try {
      const currentSlideData = JSON.parse(editingSlide);
      return JSON.stringify(originalSlide) !== JSON.stringify(currentSlideData) || stagedVisual !== null;
    } catch {
      return false;
    }
  };

  const saveSlideEdit = async () => {
    try {
      const updatedSlide = JSON.parse(editingSlide);

      if (!hasSlideChanged()) {
        setUpdateStatus({ type: 'info', message: 'No changes detected' });
        return;
      }

      setIsUpdating(true);
      setUpdateStatus({ type: 'info', message: 'Saving changes...' });

      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) throw new Error('Authentication required');

      const needsAudioRegeneration =
        originalSlide.narration !== updatedSlide.narration ||
        originalSlide.speaker !== updatedSlide.speaker;

      // Consolidate payload for the backend
      const payload = {
          stepData: updatedSlide,
          regenerateAudio: needsAudioRegeneration,
          // Include staged visual if it exists
          updatedVisual: stagedVisual || undefined
      };

      const response = await fetch(`${API_URL}/api/video-generator/project/${project.id}/step/${currentSlideIndex + 1}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update slide');

      // Update local project state with the now-saved visual
      if (stagedVisual) {
          project.visualFunctions[stagedVisual.functionName] = eval(`(${stagedVisual.code})`);
      }

      // Update local slides state
      const updatedSlides = [...slides];
      updatedSlides[currentSlideIndex] = updatedSlide;
      onSlidesUpdate(updatedSlides);
      
      setOriginalSlide(JSON.parse(JSON.stringify(updatedSlide))); // Update original reference
      setStagedVisual(null); // Clear staged changes

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
    if (!chatMessage.trim()) return;

    const isAddingVisual = !currentSlideHasVisual && aiModifyType === 'visual';
    const endpoint = isAddingVisual
        ? `${API_URL}/api/video-generator/project/${project.id}/step/${currentSlideIndex + 1}/add-visual`
        : `${API_URL}/api/video-generator/project/${project.id}/step/${currentSlideIndex + 1}/ai-modify`;

    const body = isAddingVisual
        ? { description: chatMessage }
        : {
            currentSlide: JSON.parse(editingSlide),
            modification: chatMessage,
            availableVisualFunctions: Object.keys(project.visualFunctions || {}),
            modifyType: aiModifyType
          };

    try {
        setUpdateStatus({ type: 'info', message: `AI is processing your request...` });

        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) throw new Error('Authentication required');

        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'AI request failed');

        // Handle adding a new visual
        if (isAddingVisual && result.updatedSlide && result.newVisualFunction) {
            setEditingSlide(JSON.stringify(result.updatedSlide, null, 2));
            setStagedVisual({
                functionName: result.newVisualFunction.name,
                code: result.newVisualFunction.code
            });
            setUpdateStatus({ type: 'success', message: 'New visual generated! Review and save to confirm.' });
        }
        // Handle modifying content
        else if (aiModifyType === 'content' && result.modifiedSlide) {
            setEditingSlide(JSON.stringify(result.modifiedSlide, null, 2));
            setUpdateStatus({ type: 'success', message: 'AI content modifications applied! Review and save.' });
        }
        // Handle modifying an existing visual
        else if (aiModifyType === 'visual' && result.updatedVisual) {
            setStagedVisual(result.updatedVisual);
            setUpdateStatus({ type: 'success', message: 'AI visual modifications applied! Review and save.' });
        }
        
        setChatMessage('');
    } catch (error) {
        console.error('Error with AI request:', error);
        setUpdateStatus({ type: 'error', message: `AI failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  const downloadPDF = async () => {
    // ... (This function remains unchanged)
  };

  // Initialize first slide
  useEffect(() => {
    if (slides.length > 0 && editingSlide === '') {
      selectSlide(0);
    }
  }, [slides]);

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        ✏️ Review & Edit Script
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Lesson Steps */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-600">📋 Lesson Steps</h3>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {slides.map((slide, index) => (
              <div
                key={index}
                onClick={() => selectSlide(index)}
                className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                  currentSlideIndex === index
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm">
                    {slide.visual?.type ? '🎨' : '📝'} Slide {index + 1}
                    {hasSlideChanged() && currentSlideIndex === index && (
                      <span className="ml-2 text-orange-500">●</span>
                    )}
                  </span>
                  <span className="text-xs text-gray-500">{slide.speaker}</span>
                </div>
                <div className="text-sm font-semibold text-gray-800 mb-1">
                  {slide.title || 'Untitled Slide'}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  Speaker: {project.speakers?.[slide.speaker]?.name || slide.speaker}
                </div>
                <div className="text-xs text-gray-600 line-clamp-2">
                  {(slide.content || '') + ' ' + (slide.content2 || '')}
                </div>
                {slide.visual?.type && (
                  <div className="text-xs text-red-600 mt-1">
                    Visual: {slide.visual.type}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Preview & Editor */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">🖼️ Slide Preview</h3>
            <span className="text-sm text-gray-600">
              Slide {currentSlideIndex + 1} of {slides.length}
            </span>
          </div>

          <div className="mb-4 border-2 border-gray-200 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: 'auto', maxHeight: '350px' }}
              className="block"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-3">✏️ Edit Content</h4>
            <textarea
              value={editingSlide}
              onChange={(e) => setEditingSlide(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-md text-sm font-mono resize-none focus:border-red-500 focus:outline-none"
              placeholder="Edit the content for this slide..."
            />
            <div className="flex gap-2 mt-3 flex-wrap">
              <button
                onClick={saveSlideEdit}
                disabled={isUpdating || !hasSlideChanged()}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  hasSlideChanged() && !isUpdating
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isUpdating ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
              <button
                onClick={() => setShowChat(!showChat)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                🤖 AI Assistant
              </button>
              {hasSlideChanged() && (
                <button
                  onClick={() => selectSlide(currentSlideIndex)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ↶ Discard Changes
                </button>
              )}
            </div>

            {/* AI Assistant Chat */}
            {showChat && (
              <div className="mt-4 border border-gray-300 rounded-lg p-3 bg-white">
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setAiModifyType('content')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      aiModifyType === 'content'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📝 Content
                  </button>
                  <button
                    onClick={() => setAiModifyType('visual')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      aiModifyType === 'visual'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {currentSlideHasVisual ? '🎨 Visual' : '✨ Add Visual'}
                  </button>
                </div>
                
                <div className="text-xs text-gray-500 mb-2">
                  {aiModifyType === 'content'
                    ? 'Modify slide title, content, narration, or speaker...'
                    : currentSlideHasVisual
                      ? `Modify the "${JSON.parse(editingSlide).visual.type}" visual function...`
                      : 'Describe the visual you want the AI to create.'
                  }
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAiRequest()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-red-500 focus:outline-none"
                    placeholder={
                      aiModifyType === 'content'
                        ? "e.g., Make the explanation simpler..."
                        : currentSlideHasVisual
                          ? "e.g., Use a blue color scheme..."
                          : "e.g., a bar chart showing values 30, 70, 40"
                    }
                  />
                  <button
                    onClick={handleAiRequest}
                    disabled={!chatMessage.trim()}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {aiModifyType === 'visual' && !currentSlideHasVisual ? '✨ Generate' : '🤖 Submit'}
                  </button>
                </div>
              </div>
            )}

            {updateStatus && (
              <div className={`mt-4 p-3 rounded-lg ${
                updateStatus.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
                updateStatus.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
                'bg-blue-100 text-blue-800 border border-blue-300'
              }`}>
                {updateStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={onBackToInput}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          ← Back to Input
        </button>
        <button
          onClick={downloadPDF}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          📄 Download PDF
        </button>
        <button
          onClick={onProceedToVideo}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          🎬 Generate Video →
        </button>
      </div>
    </div>
  );
}