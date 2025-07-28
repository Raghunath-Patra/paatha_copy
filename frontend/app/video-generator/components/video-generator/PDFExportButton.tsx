import React, { useState, useRef, useEffect } from 'react';

interface PDFExportButtonProps {
  project: {
    id: string;
    title: string;
    speakers: any;
    visualFunctions: any;
  };
  slides: any[];
  filename: string;
}

const PDFExportButton: React.FC<PDFExportButtonProps> = ({ project, slides, filename }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // PDF dimensions (A4 landscape in mm)
  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2); // 257mm
  const contentHeight = pageHeight - (margin * 2); // 170mm

  useEffect(() => {
    if (canvasRef.current) {
      // Set canvas size to match PDF content area (convert mm to pixels at 72 DPI)
      const dpi = 72;
      const mmToPx = dpi / 25.4;
      canvasRef.current.width = contentWidth * mmToPx;
      canvasRef.current.height = contentHeight * mmToPx;
    }
  }, []);

  const getBackgroundColor = (speaker: string) => {
    const colors: Record<string, string> = {
      teacher: '#f0f9ff',
      student1: '#faf5ff',
      student2: '#fefbff'
    };
    return colors[speaker] || '#f8fafc';
  };

  const drawAvatars = (ctx: CanvasRenderingContext2D, activeSpeaker: string, canvasWidth: number, canvasHeight: number) => {
    if (!project.speakers) return;
    
    const speakerKeys = Object.keys(project.speakers);
    const avatarSize = canvasWidth * 0.03; // 3% of canvas width
    const startX = canvasWidth * 0.05; // 5% from left
    const startY = canvasHeight * 0.4; // 40% from top
    const spacing = canvasHeight * 0.12; // 12% spacing
    
    speakerKeys.forEach((speaker, index) => {
      const config = project.speakers[speaker];
      const isActive = speaker === activeSpeaker;
      const x = startX;
      const y = startY + (index * spacing);
      
      // Draw avatar circle
      ctx.beginPath();
      ctx.arc(x, y, avatarSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#a78bfa' : '#e5e7eb';
      ctx.fill();
      ctx.strokeStyle = isActive ? (config.color || '#7c3aed') : '#d1d5db';
      ctx.lineWidth = isActive ? 3 : 1;
      ctx.stroke();
      
      // Draw speaker name
      ctx.fillStyle = isActive ? '#374151' : '#6b7280';
      ctx.font = `${isActive ? 'bold ' : ''}${Math.floor(canvasWidth * 0.015)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(config.name || speaker, x, y + avatarSize);
    });
  };

  const renderSlideToCanvas = (slide: any, canvas: HTMLCanvasElement): string | null => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas with background
    ctx.fillStyle = getBackgroundColor(slide.speaker);
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Main title - always "Introduction to Agentic AI" (outside content area)
    ctx.fillStyle = '#1e40af';
    ctx.font = `bold ${Math.floor(canvasWidth * 0.04)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('Introduction to Agentic AI', canvasWidth / 2, canvasHeight * 0.12);

    // Subtitle (outside content area)
    ctx.fillStyle = '#6b7280';
    ctx.font = `${Math.floor(canvasWidth * 0.025)}px Arial`;
    ctx.fillText('Autonomous Intelligence Systems', canvasWidth / 2, canvasHeight * 0.18);
    ctx.fillText('Beyond Traditional AI Automation', canvasWidth / 2, canvasHeight * 0.23);

    // Content area - positioned in the right side
    const contentAreaX = canvasWidth * 0.25;
    const contentAreaY = canvasHeight * 0.35;
    const contentAreaWidth = canvasWidth * 0.65;
    const contentAreaHeight = canvasHeight * 0.5;

    // Draw content area border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(contentAreaX, contentAreaY, contentAreaWidth, contentAreaHeight);

    // Slide title (always show if present)
    if (slide.title?.trim()) {
      ctx.fillStyle = '#1e40af';
      ctx.font = `bold ${Math.floor(canvasWidth * 0.035)}px Arial`;
      ctx.textAlign = 'center';
      
      // Handle long titles by wrapping text
      const maxWidth = contentAreaWidth * 0.9;
      const words = slide.title.trim().split(' ');
      let line = '';
      let y = contentAreaY + contentAreaHeight * 0.15;
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, contentAreaX + contentAreaWidth / 2, y);
          line = words[n] + ' ';
          y += Math.floor(canvasWidth * 0.04);
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, contentAreaX + contentAreaWidth / 2, y);
    }

    // Content lines
    ctx.fillStyle = '#6b7280';
    ctx.font = `${Math.floor(canvasWidth * 0.022)}px Arial`;
    ctx.textAlign = 'center';
    
    const contentStartY = contentAreaY + contentAreaHeight * 0.35;
    
    if (slide.content?.trim()) {
      ctx.fillText(slide.content.trim(), contentAreaX + contentAreaWidth / 2, contentStartY);
    }
    if (slide.content2?.trim()) {
      ctx.fillText(slide.content2.trim(), contentAreaX + contentAreaWidth / 2, contentStartY + canvasHeight * 0.08);
    }

    // Draw visual if available - in the lower portion of content area
    if (slide.visual?.type && project.visualFunctions && project.visualFunctions[slide.visual.type]) {
      try {
        let visualFunc = project.visualFunctions[slide.visual.type];
        let func: Function;
        
        if (typeof visualFunc === 'string') {
          const functionBody = visualFunc.replace(/^function\s+\w+\s*\([^)]*\)\s*\{/, '').replace(/\}$/, '');
          func = new Function('ctx', 'param1', 'param2', 'param3', functionBody);
        } else {
          func = visualFunc;
        }

        // Save context and clip to visual area (lower portion of content area)
        ctx.save();
        const visualY = contentAreaY + contentAreaHeight * 0.55;
        const visualHeight = contentAreaHeight * 0.4;
        
        ctx.translate(contentAreaX, visualY);
        ctx.beginPath();
        ctx.rect(0, 0, contentAreaWidth, visualHeight);
        ctx.clip();

        if (slide.visual.params && slide.visual.params.length > 0) {
          func(ctx, ...slide.visual.params);
        } else {
          func(ctx);
        }
        
        ctx.restore();
      } catch (error) {
        console.error('Error executing visual function:', error);
        ctx.fillStyle = '#ef4444';
        ctx.font = `${Math.floor(canvasWidth * 0.02)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('Error in visual function', contentAreaX + contentAreaWidth / 2, contentAreaY + contentAreaHeight * 0.7);
      }
    }

    // Draw speaker avatars on the left side
    drawAvatars(ctx, slide.speaker, canvasWidth, canvasHeight);
    
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const generatePDF = async () => {
    if (!slides || slides.length === 0) {
      alert('No slides to export');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      // Dynamic import of jsPDF
      const { default: jsPDF } = await import('jspdf');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not available');
      }

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        
        // Update progress
        setProgress(Math.round(((i + 1) / slides.length) * 100));

        // Add new page for each slide except the first
        if (i > 0) {
          pdf.addPage();
        }

        // Clear canvas completely before rendering
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Render slide to canvas
        const slideImage = renderSlideToCanvas(slide, canvas);
        
        if (slideImage) {
          // Add slide image to PDF (fits within margins)
          pdf.addImage(slideImage, 'JPEG', margin, margin, contentWidth, contentHeight);
          
          // Add slide number (bottom left)
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Slide ${i + 1} of ${slides.length}`, margin, pageHeight - 10);
          
          // Add speaker info (bottom right)
          const speakerName = project.speakers?.[slide.speaker]?.name || slide.speaker;
          pdf.text(`Speaker: ${speakerName}`, pageWidth - margin - 50, pageHeight - 10);
        }

        // Small delay to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Save PDF
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please make sure jsPDF is installed.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden canvas for slide rendering */}
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
        className="hidden"
      />

      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-orange-800 flex items-center">
              📄 Export to PDF
            </h3>
            <p className="text-sm text-orange-600 mt-1">
              Generate a PDF matching your slide layout exactly
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-orange-600">
              {slides?.length || 0} slides
            </div>
            <div className="text-xs text-orange-500">
              A4 Landscape • {filename}
            </div>
          </div>
        </div>

        {/* Preview Info */}
        <div className="bg-orange-100 rounded-lg p-3 mb-4 text-xs text-orange-700">
          <strong>Layout:</strong> A4 landscape (297×210mm) with 20mm margins<br/>
          <strong>Content:</strong> Main title, slide title, content lines, visuals, and speaker avatars<br/>
          <strong>Position:</strong> Avatars on left, content area on right with proper spacing
        </div>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-orange-600 mb-2">
              <span>Generating PDF...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={generatePDF}
          disabled={isGenerating || !slides || slides.length === 0}
          className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
            isGenerating
              ? 'bg-orange-400 cursor-not-allowed animate-pulse'
              : slides && slides.length > 0
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transform hover:scale-105 shadow-lg'
                : 'bg-gray-300 cursor-not-allowed'
          } text-white`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating PDF... ({progress}%)
            </span>
          ) : (
            '📄 Download PDF'
          )}
        </button>

        <div className="mt-3 text-xs text-orange-600">
          <strong>Installation required:</strong> <code className="bg-white px-1 rounded">npm install jspdf</code>
        </div>
      </div>
    </div>
  );
};

export default PDFExportButton;