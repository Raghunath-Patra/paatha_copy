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

  // Tab management
  const [activeTab, setActiveTab] = useState<'slides' | 'visuals'>('slides');
  const [editingVisualFunction, setEditingVisualFunction] = useState<{name: string, code: string} | null>(null);
  const [visualFunctions, setVisualFunctions] = useState<any[]>([]);
  const [aiModifyType, setAiModifyType] = useState<'content' | 'visual'>('content');

  // Add these new state variables for visual functions tab
  const [selectedVisualFunction, setSelectedVisualFunction] = useState<any>(null);
  const [visualPreviewCanvas, setVisualPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const visualCanvasRef = useRef<HTMLCanvasElement>(null);

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
    if (visualCanvasRef.current) {
      const canvas = visualCanvasRef.current;
      canvas.width = 1000;
      canvas.height = 700;
      setVisualPreviewCanvas(canvas);
    }
  }, []);

  // Update visual preview when selected function changes
  useEffect(() => {
    if (visualPreviewCanvas && selectedVisualFunction && activeTab === 'visuals') {
      updateVisualPreview(selectedVisualFunction);
    }
  }, [selectedVisualFunction, visualPreviewCanvas, activeTab]);

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

  const updateVisualPreview = (visualFunction: any) => {
    if (!visualPreviewCanvas) return;

    const ctx = visualPreviewCanvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 1000, 700);

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1000, 700);

    // Draw title
    ctx.fillStyle = '#6b46c1';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Visual Function: ${visualFunction.function_name}`, 500, 40);

    // Draw function area border
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.strokeRect(200, 200, 600, 400);

    // Execute the visual function
    try {
      // Parse the function code properly
      let functionCode = visualFunction.function_code.trim();
      
      // If it's already a complete function, use it as is
      // If it's just the function body, wrap it in a function
      let func;
      
      if (functionCode.startsWith('function')) {
        // It's a complete function definition like "function myFunc(ctx, p1, p2, p3) { ... }"
        // Extract just the function body
        const match = functionCode.match(/function\s+\w*\s*\([^)]*\)\s*\{([\s\S]*)\}$/);
        if (match) {
          const functionBody = match[1];
          func = new Function('ctx', 'param1', 'param2', 'param3', functionBody);
        } else {
          throw new Error('Invalid function format');
        }
      } else {
        // It's just the function body, wrap it in a function
        func = new Function('ctx', 'param1', 'param2', 'param3', functionCode);
      }
      
      // Execute with default test parameters
      func(ctx, 'param1', 'param2', 'param3');
      
    } catch (error) {
      console.error('Error executing visual function:', error);
      ctx.fillStyle = '#ef4444';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Error in visual function', 500, 400);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      ctx.fillText(errorMessage, 500, 420);
      
      // Show more detailed error info for debugging
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.fillText('Check the console for more details', 500, 450);
    }
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

      // Update project visual functions locally
      if (project.visualFunctions) {
        try {
          project.visualFunctions[functionName] = eval(`(${functionCode})`);
          // Refresh preview if current slide uses this visual
          const currentSlide = slides[currentSlideIndex];
          if (currentSlide?.visual?.type === functionName) {
            updateSlidePreview(currentSlide, currentSlideIndex);
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
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        ✏️ Review & Edit Script
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel with Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('slides')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'slides'
                  ? 'bg-red-50 text-red-600 border-b-2 border-red-500'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              📋 Lesson Steps
            </button>
            <button
              onClick={() => setActiveTab('visuals')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'visuals'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-500'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              🎨 Visual Functions
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'slides' ? (
              /* Slides Tab Content */
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
            ) : (
              /* Visual Functions Tab Content */
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-800">Manage Visual Functions</h4>
                </div>
                
                {/* Visual Functions List */}
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {visualFunctions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🎨</div>
                      <p>No visual functions yet</p>
                      <p className="text-sm">Create your first visual function to get started!</p>
                    </div>
                  ) : (
                    visualFunctions.map((vf) => (
                      <div 
                        key={vf.function_name} 
                        onClick={() => setSelectedVisualFunction(vf)}
                        className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                          selectedVisualFunction?.function_name === vf.function_name
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-800">{vf.function_name}</h5>
                            <p className="text-xs text-gray-500">
                              Updated: {new Date(vf.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingVisualFunction({name: vf.function_name, code: vf.function_code});
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            ✏️ Edit
                          </button>
                        </div>
                        
                        {/* Function Preview */}
                        <div className="bg-gray-50 rounded p-2 mt-2">
                          <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap line-clamp-3">
                            {vf.function_code.substring(0, 150)}
                            {vf.function_code.length > 150 && '...'}
                          </pre>
                        </div>
                        
                        {/* Usage Info */}
                        <div className="mt-2 text-xs text-purple-600">
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
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {activeTab === 'slides' ? '🖼️ Slide Preview' : '🎨 Visual Function Preview'}
            </h3>
            {activeTab === 'slides' && (
              <span className="text-sm text-gray-600">
                Slide {currentSlideIndex + 1} of {slides.length}
              </span>
            )}
            {activeTab === 'visuals' && selectedVisualFunction && (
              <span className="text-sm text-purple-600">
                {selectedVisualFunction.function_name}
              </span>
            )}
          </div>
          
          {/* Canvas Preview */}
          <div className="mb-4 border-2 border-gray-200 rounded-lg overflow-hidden">
            {activeTab === 'slides' ? (
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: 'auto', maxHeight: '350px' }}
                className="block"
              />
            ) : (
              <canvas
                ref={visualCanvasRef}
                style={{ width: '100%', height: 'auto', maxHeight: '350px' }}
                className="block"
              />
            )}
          </div>

          {/* Content Editor - For slides tab */}
          {activeTab === 'slides' && (
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

              {/* Enhanced AI Chat for Slides */}
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
          )}

          {/* Visual Function Editor - For visuals tab */}
          {activeTab === 'visuals' && (
            <div className="bg-purple-50 rounded-lg p-4">
              {selectedVisualFunction ? (
                <>
                  <h4 className="font-medium mb-3">🎨 Edit Visual Function</h4>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Function Name</label>
                    <input
                      type="text"
                      value={selectedVisualFunction.function_name}
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md text-sm bg-gray-100"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Function Code</label>
                    <textarea
                      value={selectedVisualFunction.function_code}
                      onChange={(e) => setSelectedVisualFunction({
                        ...selectedVisualFunction,
                        function_code: e.target.value
                      })}
                      className="w-full h-32 p-3 border border-gray-300 rounded-md text-sm font-mono resize-none focus:border-purple-500 focus:outline-none"
                      placeholder="Edit the visual function code..."
                    />
                  </div>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => saveVisualFunction(selectedVisualFunction.function_name, selectedVisualFunction.function_code)}
                      disabled={isUpdating}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:bg-gray-300"
                    >
                      {isUpdating ? '⏳ Saving...' : '💾 Save Function'}
                    </button>
                    <button
                      onClick={() => setShowChat(!showChat)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      🤖 AI Chat
                    </button>
                    <button
                      onClick={() => updateVisualPreview(selectedVisualFunction)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      🔄 Refresh Preview
                    </button>
                  </div>

                  {/* AI Chat for Visual Functions */}
                  {showChat && (
                    <div className="mt-4 border border-purple-300 rounded-lg p-3 bg-white">
                      <div className="text-sm text-purple-600 mb-3">
                        Ask AI to modify the visual function code...
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        e.g., "Add more colors", "Make it bigger", "Add animation", "Draw a bar chart instead"
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleVisualAIChat()}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-purple-500 focus:outline-none"
                          placeholder="Describe how you want to modify this visual function..."
                        />
                        <button
                          onClick={handleVisualAIChat}
                          disabled={!chatMessage.trim()}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          🎨 Modify
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎨</div>
                  <h4 className="font-medium mb-2">Select a Visual Function</h4>
                  <p className="text-sm">Choose a function from the left panel to preview and edit it here.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Visual Function Editor Modal */}
      {editingVisualFunction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingVisualFunction.name ? (
                  <>🎨 Edit Function: <span className="text-purple-600">{editingVisualFunction.name}</span></>
                ) : (
                  '🎨 Create New Visual Function'
                )}
              </h3>
              <button
                onClick={() => setEditingVisualFunction(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            
            {/* Function Name Input - Only for new functions */}
            {!editingVisualFunction.name && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Function Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., drawChart, createGraph, animateShape"
                  value={editingVisualFunction.name}
                  onChange={(e) => setEditingVisualFunction({...editingVisualFunction, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose a descriptive name for your visual function (letters, numbers, and underscores only)
                </p>
              </div>
            )}
            
            {/* Function Code Editor */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Function Code
              </label>
              <textarea
                value={editingVisualFunction.code}
                onChange={(e) => setEditingVisualFunction({...editingVisualFunction, code: e.target.value})}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:border-purple-500 focus:outline-none bg-gray-50"
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
              <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                <strong>💡 Tips:</strong>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li>Use <code>ctx</code> for canvas drawing operations</li>
                  <li>Parameters <code>param1, param2, param3</code> can be passed from slides</li>
                  <li>Canvas size is 1000x700 pixels, drawing area is 200x200 to 800x600</li>
                  <li>Use <code>ctx.fillStyle</code>, <code>ctx.strokeStyle</code> for colors</li>
                </ul>
              </div>
            </div>

            {/* Usage Information */}
            {editingVisualFunction.name && (
              <div className="mb-6 bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-2">📊 Function Usage</h4>
                <p className="text-sm text-purple-700">
                  This function is currently used in{' '}
                  <span className="font-semibold">
                    {slides.filter(slide => slide.visual?.type === editingVisualFunction.name).length}
                  </span>{' '}
                  slide(s)
                </p>
                {slides.filter(slide => slide.visual?.type === editingVisualFunction.name).length > 0 && (
                  <p className="text-xs text-purple-600 mt-1">
                    Changes will affect all slides using this function
                  </p>
                )}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingVisualFunction(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => editingVisualFunction.name && saveVisualFunction(editingVisualFunction.name, editingVisualFunction.code)}
                disabled={!editingVisualFunction.name || !editingVisualFunction.code.trim() || isUpdating}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isUpdating ? '⏳ Saving...' : '💾 Save Function'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Message - Global */}
      {updateStatus && (
        <div className={`mt-6 p-4 rounded-lg max-w-2xl mx-auto ${
          updateStatus.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
          updateStatus.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
          'bg-blue-100 text-blue-800 border border-blue-300'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {updateStatus.type === 'success' ? '✅' : 
               updateStatus.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            {updateStatus.message}
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