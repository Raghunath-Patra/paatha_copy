'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getAuthHeaders } from '../../utils/auth';

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

  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [editingVisualFunction, setEditingVisualFunction] = useState<{name: string, code: string} | null>(null);
  const [showSpeakerEditor, setShowSpeakerEditor] = useState(false);
  const [visualFunctions, setVisualFunctions] = useState<any[]>([]);
  const [aiModifyType, setAiModifyType] = useState<'content' | 'visual'>('content');


  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Initialize canvas for preview
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 1000;
      canvas.height = 700;
      setPreviewCanvas(canvas);
      updateSlidePreview(slides[currentSlideIndex], currentSlideIndex);
    }
  }, []);

  // Update preview when slide changes
  useEffect(() => {
    if (previewCanvas && slides[currentSlideIndex]) {
      updateSlidePreview(slides[currentSlideIndex], currentSlideIndex);
    }
  }, [currentSlideIndex, slides, previewCanvas]);

  const updateSlidePreview = (slide: any, index: number) => {
    if (!previewCanvas) return;

    const ctx = previewCanvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 1000, 700);

    // Draw background
    const backgroundColor = getBackgroundColor(slide.speaker);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, 1000, 700);

    // Draw title
    ctx.fillStyle = '#1a5276';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(slide.title || 'Untitled Slide', 500, 75);

    // Draw content
    ctx.fillStyle = '#2c3e50';
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    if (slide.content) {
      ctx.fillText(slide.content, 500, 120);
    }
    if (slide.content2) {
      ctx.fillText(slide.content2, 500, 150);
    }

    // Draw media area border
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.strokeRect(200, 200, 600, 400);

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
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Error in visual function', 500, 400);
      }
    }

    // Draw avatars
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

      // Draw avatar circle
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#fdbcb4' : '#e0e0e0';
      ctx.fill();
      ctx.strokeStyle = isActive ? config.color : '#ccc';
      ctx.lineWidth = isActive ? 3 : 1;
      ctx.stroke();

      // Draw speaker name
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

  // Replace the existing handleAIChat method with this enhanced version:
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
        throw new Error('PDF generation failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_script.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error downloading PDF:', error);
      setUpdateStatus({ 
        type: 'error', 
        message: `PDF download failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
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

    } catch (error) {
      setUpdateStatus({ 
        type: 'error', 
        message: `Failed to save visual function: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteVisualFunction = async (functionName: string) => {
    if (!confirm(`Are you sure you want to delete the visual function "${functionName}"?`)) return;

    try {
      setIsUpdating(true);
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) throw new Error('Authentication required');

      const response = await fetch(`${API_URL}/api/video-generator/project/${project.id}/visual-function/${functionName}`, {
        method: 'DELETE',
        headers: headers
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setUpdateStatus({ type: 'success', message: 'Visual function deleted successfully!' });
      await loadVisualFunctions();

    } catch (error) {
      setUpdateStatus({ 
        type: 'error', 
        message: `Failed to delete visual function: ${error instanceof Error ? error.message : 'Unknown error'}` 
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
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        ✏️ Review & Edit Script
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slides Panel */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4">📋 Lesson Steps</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
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

        {/* Preview Panel */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">🖼️ Slide Preview</h3>
            <button
              onClick={() => setShowVisualEditor(!showVisualEditor)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              🎨 Manage Visuals
            </button>
          </div>
          
          {/* Canvas Preview */}
          <div className="mb-4 border-2 border-gray-200 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: 'auto', maxHeight: '350px' }}
              className="block"
            />
          </div>

          {/* Visual Functions Manager */}
          {showVisualEditor && (
            <div className="mb-4 border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">🎨 Visual Functions Manager</h4>
                <button
                  onClick={() => setShowVisualEditor(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {/* Visual Functions List */}
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {visualFunctions.map((vf) => (
                  <div key={vf.function_name} className="flex justify-between items-center p-3 bg-white rounded-lg border">
                    <div>
                      <span className="font-medium">{vf.function_name}</span>
                      <p className="text-xs text-gray-600">
                        Updated: {new Date(vf.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingVisualFunction({name: vf.function_name, code: vf.function_code})}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteVisualFunction(vf.function_name)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add New Function Button */}
              <button
                onClick={() => setEditingVisualFunction({name: '', code: 'function newVisual(ctx, param1, param2, param3) {\n  // Your visual code here\n  ctx.fillStyle = "#ff6b6b";\n  ctx.fillRect(250, 250, 200, 100);\n}'})}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                ➕ Add New Function
              </button>
            </div>
          )}

          {/* Edit Controls */}
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
                {isUpdating ? '⏳ Updating...' : '💾 Save Changes'}
              </button>
              <button
                onClick={() => setShowChat(!showChat)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                🤖 AI Chat
              </button>
              {hasSlideChanged() && (
                <button
                  onClick={() => {
                    selectSlide(currentSlideIndex);
                    setUpdateStatus({ type: 'info', message: 'Changes discarded' });
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ↶ Discard Changes
                </button>
              )}
            </div>

            {/* Enhanced AI Chat */}
            {showChat && (
              <div className="mt-4 border border-gray-300 rounded-lg p-3 bg-white">
                <div className="text-sm text-gray-600 mb-3">
                  Ask AI to modify the content or visual function...
                </div>
                
                {/* AI Modification Type Selector */}
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
                    disabled={!JSON.parse(editingSlide).visual?.type}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      aiModifyType === 'visual' && JSON.parse(editingSlide).visual?.type
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    🎨 Visual
                  </button>
                </div>
                
                {/* Help Text */}
                <div className="text-xs text-gray-500 mb-2">
                  {aiModifyType === 'content' 
                    ? 'Modify slide title, content, narration, or speaker...'
                    : JSON.parse(editingSlide).visual?.type
                      ? `Modify the "${JSON.parse(editingSlide).visual.type}" visual function...`
                      : 'No visual function in this slide'
                  }
                </div>
                
                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAIChat()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-red-500 focus:outline-none"
                    placeholder={
                      aiModifyType === 'content' 
                        ? "e.g., Make the explanation simpler, change speaker to teacher..."
                        : "e.g., Add more colors, make the chart bigger, add animation..."
                    }
                  />
                  <button
                    onClick={handleAIChat}
                    disabled={!chatMessage.trim() || (aiModifyType === 'visual' && !JSON.parse(editingSlide).visual?.type)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {aiModifyType === 'content' ? '📝 Modify' : '🎨 Edit Visual'}
                  </button>
                </div>
                
                {/* Visual Function Info */}
                {aiModifyType === 'visual' && JSON.parse(editingSlide).visual?.type && (
                  <div className="mt-2 text-xs text-purple-600 bg-purple-50 p-2 rounded">
                    <strong>Current visual:</strong> {JSON.parse(editingSlide).visual.type}
                    {JSON.parse(editingSlide).visual.params && (
                      <span> (params: {JSON.stringify(JSON.parse(editingSlide).visual.params)})</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Status Message */}
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

      {/* Visual Function Editor Modal */}
      {editingVisualFunction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-4/5 max-w-4xl max-h-4/5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingVisualFunction.name ? `Edit Function: ${editingVisualFunction.name}` : 'Create New Function'}
              </h3>
              <button
                onClick={() => setEditingVisualFunction(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            {!editingVisualFunction.name && (
              <input
                type="text"
                placeholder="Function name (e.g., drawChart)"
                value={editingVisualFunction.name}
                onChange={(e) => setEditingVisualFunction({...editingVisualFunction, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:border-red-500 focus:outline-none"
              />
            )}
            
            <textarea
              value={editingVisualFunction.code}
              onChange={(e) => setEditingVisualFunction({...editingVisualFunction, code: e.target.value})}
              className="w-full h-80 p-3 border border-gray-300 rounded-md text-sm font-mono resize-none focus:border-red-500 focus:outline-none"
              placeholder="Enter your visual function code..."
            />
            
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setEditingVisualFunction(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => editingVisualFunction.name && saveVisualFunction(editingVisualFunction.name, editingVisualFunction.code)}
                disabled={!editingVisualFunction.name || !editingVisualFunction.code || isUpdating}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Saving...' : 'Save Function'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
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