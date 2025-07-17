'use client';

import React, { useState, useRef } from 'react';

interface VideoContentInputProps {
  workflowMode: 'simple' | 'advanced';
  onScriptGenerated: (project: any, slides: any[]) => void;
  onCompleteVideoGenerated: () => void;
}

export default function VideoContentInput({ 
  workflowMode, 
  onScriptGenerated, 
  onCompleteVideoGenerated 
}: VideoContentInputProps) {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setContent(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const generateCompleteVideo = async () => {
    if (!content.trim()) {
      setStatus({ type: 'error', message: 'Please enter some content first.' });
      return;
    }

    setIsGenerating(true);
    setStatus({ type: 'info', message: 'Generating complete video... This may take 5-15 minutes.' });

    try {
      const response = await fetch(`${API_URL}/api/video-generator/generate-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus({ type: 'success', message: 'Complete video generated successfully!' });
        onCompleteVideoGenerated();
      } else {
        throw new Error(result.error || 'Failed to generate video');
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateScriptOnly = async () => {
    if (!content.trim()) {
      setStatus({ type: 'error', message: 'Please enter some content first.' });
      return;
    }

    setIsGenerating(true);
    setStatus({ type: 'info', message: 'Generating script and visuals...' });

    try {
      const response = await fetch(`${API_URL}/api/video-generator/generate-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus({ type: 'success', message: 'Script generated successfully!' });
        onScriptGenerated(result.data, result.data.lessonSteps);
      } else {
        throw new Error(result.error || 'Failed to generate script');
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        📝 Input Your Educational Content
      </h2>

      {/* Quick Actions for Simple Workflow */}
      {workflowMode === 'simple' && (
        <div className="flex gap-4 justify-center mb-6 flex-wrap">
          <button
            onClick={generateCompleteVideo}
            disabled={isGenerating}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎬 Generate Complete Video
          </button>
          <button
            onClick={generateScriptOnly}
            disabled={isGenerating}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📝 Generate Script Only
          </button>
        </div>
      )}

      {/* File Upload */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-red-300 rounded-lg p-8 text-center mb-6 cursor-pointer hover:bg-red-50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        <div className="text-4xl mb-4">📄</div>
        <h3 className="text-lg font-semibold mb-2">Upload Markdown File</h3>
        <p className="text-gray-600">Click here to upload a .md file or drag and drop</p>
      </div>

      <div className="text-center text-gray-500 font-semibold mb-6">OR</div>

      {/* Content Input */}
      <div className="mb-6">
        <label htmlFor="contentInput" className="block text-lg font-semibold mb-3 text-gray-800">
          ✏️ Enter your educational content in Markdown format:
        </label>
        <textarea
          id="contentInput"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-80 p-4 border-2 border-gray-300 rounded-lg font-mono text-sm resize-vertical focus:border-red-500 focus:outline-none transition-colors"
          placeholder="# Your Educational Content

## Activity 2.1: Understanding Chemical Reactions

* Collect the following solutions from the laboratory...
* Test each solution with indicators...

### Expected Observations:
- Acids turn blue litmus red
- Bases turn red litmus blue

**Learning Objectives:**
Students will understand the properties of acids and bases through hands-on experimentation."
        />
      </div>

      {/* Advanced Workflow Action */}
      {workflowMode === 'advanced' && (
        <div className="text-center mb-6">
          <button
            onClick={generateScriptOnly}
            disabled={isGenerating}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🚀 Generate Script & Visuals
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {isGenerating && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div className="bg-red-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
          <p className="text-center text-sm text-gray-600">
            {status?.message || 'Processing...'}
          </p>
        </div>
      )}

      {/* Status Message */}
      {status && !isGenerating && (
        <div className={`p-4 rounded-lg mb-6 ${
          status.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
          status.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
          'bg-blue-100 text-blue-800 border border-blue-300'
        }`}>
          {status.message}
        </div>
      )}
    </div>
  );
}