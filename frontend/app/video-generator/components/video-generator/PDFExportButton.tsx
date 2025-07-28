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

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = 1000;
      canvasRef.current.height = 700;
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

  const renderSlideToCanvas = (slide: any, canvas: HTMLCanvasElement): string | null => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Clear canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 1000, 700);

    // Draw background
    const backgroundColor = getBackgroundColor(slide.speaker);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, 1000, 700);
    
    // Draw title
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(slide.title || 'Untitled Slide', 500, 75);
    
    // Draw content
    ctx.fillStyle = '#374151';
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    if (slide.content) ctx.fillText(slide.content, 500, 120);
    if (slide.content2) ctx.fillText(slide.content2, 500, 150);
    
    // Draw visual area border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(200, 200, 600, 400);

    // Draw visual if available
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

        // Save context and clip to visual area
        ctx.save();
        ctx.translate(200, 200);
        ctx.beginPath();
        ctx.rect(0, 0, 600, 400);
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
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Error in visual function', 500, 400);
      }
    }

    drawAvatars(ctx, slide.speaker);
    
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

        // Add new page (except for first slide)
        if (i > 0) {
          pdf.addPage();
        }

        // Render slide to canvas
        const slideImage = renderSlideToCanvas(slide, canvas);
        
        if (slideImage) {
          // Add slide image to PDF (landscape A4: 297x210mm)
          pdf.addImage(slideImage, 'JPEG', 10, 10, 277, 190);
          
          // Add slide number
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Slide ${i + 1} of ${slides.length}`, 15, 205);
          
          // Add speaker info
          const speakerName = project.speakers?.[slide.speaker]?.name || slide.speaker;
          pdf.text(`Speaker: ${speakerName}`, 200, 205);
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
              Generate a PDF with all slides and visuals
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-orange-600">
              {slides?.length || 0} slides
            </div>
            <div className="text-xs text-orange-500">
              {filename}
            </div>
          </div>
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
          <strong>Note:</strong> Make sure to install jsPDF: <code className="bg-white px-1 rounded">npm install jspdf</code>
        </div>
      </div>
    </div>
  );
};

export default PDFExportButton;