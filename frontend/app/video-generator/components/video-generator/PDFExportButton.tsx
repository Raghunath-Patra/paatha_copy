import React, { useState, useRef, useEffect } from 'react';

// Helper function to wrap text on a canvas
// It handles splitting text into multiple lines based on a max width.
const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    if (!text) return y;
    const words = text.trim().split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line.trim(), x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line.trim(), x, currentY);
    // Return the Y position for the next element, including line height for spacing
    return currentY + lineHeight;
};


const PDFExportButton = ({ project, slides, filename }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const canvasRef = useRef(null);

    // PDF dimensions (A4 landscape in mm)
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2); // 257mm
    const contentHeight = pageHeight - (margin * 2); // 170mm

    // Set up the canvas dimensions once.
    useEffect(() => {
        if (canvasRef.current) {
            // Set canvas size to match PDF content area (convert mm to pixels at 72 DPI)
            const dpi = 72;
            const mmToPx = dpi / 25.4;
            canvasRef.current.width = contentWidth * mmToPx;
            canvasRef.current.height = contentHeight * mmToPx;
        }
    }, []);

    const getBackgroundColor = (speaker) => {
        const colors = {
            teacher: '#f0f9ff',
            student1: '#faf5ff',
            student2: '#fefbff'
        };
        return colors[speaker] || '#f8fafc';
    };

    const drawAvatars = (ctx, activeSpeaker, canvasWidth, canvasHeight) => {
        if (!project.speakers) return;

        const speakerKeys = Object.keys(project.speakers);
        const avatarSize = canvasWidth * 0.03; // 3% of canvas width
        const startX = canvasWidth * 0.06; // Positioned on the left
        const startY = canvasHeight * 0.35; // Start avatars below the main title area
        const spacing = canvasHeight * 0.15; // Vertical spacing between avatars

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
            ctx.lineWidth = isActive ? 3 : 1.5;
            ctx.stroke();

            // Draw speaker name below the avatar
            ctx.fillStyle = isActive ? '#374151' : '#6b7280';
            ctx.font = `${isActive ? 'bold ' : ''}${Math.floor(canvasWidth * 0.015)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(config.name || speaker, x, y + avatarSize * 0.9);
        });
    };

    const renderSlideToCanvas = (slide, canvas) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // 1. Clear canvas with the slide's background color
        ctx.fillStyle = getBackgroundColor(slide.speaker);
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 2. Draw global elements: Main Title and Avatars
        // Main title - always "Introduction to Agentic AI"
        ctx.fillStyle = '#1e40af';
        ctx.font = `bold ${Math.floor(canvasWidth * 0.04)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('Introduction to Agentic AI', canvasWidth / 2, canvasHeight * 0.10);

        // Subtitle
        ctx.fillStyle = '#6b7280';
        ctx.font = `${Math.floor(canvasWidth * 0.025)}px Arial`;
        ctx.fillText('Autonomous Intelligence Systems', canvasWidth / 2, canvasHeight * 0.16);
        ctx.fillText('Beyond Traditional AI Automation', canvasWidth / 2, canvasHeight * 0.21);
        
        // Draw speaker avatars on the left side. This is done early to ensure it's in the background layer.
        drawAvatars(ctx, slide.speaker, canvasWidth, canvasHeight);

        // 3. Define and draw the main content area on the right
        const contentAreaX = canvasWidth * 0.22;
        const contentAreaY = canvasHeight * 0.30;
        const contentAreaWidth = canvasWidth * 0.75;
        const contentAreaHeight = canvasHeight * 0.65;
        
        const contentPadding = contentAreaWidth * 0.05;
        const contentInnerWidth = contentAreaWidth - (contentPadding * 2);
        
        // Let's use a variable to track the vertical position of content
        let currentY = contentAreaY + contentPadding * 1.5;

        // Draw content area border (optional, for visual separation)
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.strokeRect(contentAreaX, contentAreaY, contentAreaWidth, contentAreaHeight);

        // 4. Draw content within the content area, using the wrapText helper
        const contentCenterX = contentAreaX + contentAreaWidth / 2;

        // Slide title
        if (slide.title?.trim()) {
            ctx.fillStyle = '#1e40af';
            ctx.font = `bold ${Math.floor(canvasWidth * 0.03)}px Arial`;
            ctx.textAlign = 'center';
            currentY = wrapText(ctx, slide.title, contentCenterX, currentY, contentInnerWidth, canvasHeight * 0.05);
            currentY += canvasHeight * 0.03; // Add extra space after title
        }

        // Content lines
        ctx.fillStyle = '#374151'; // Darker text for better readability
        ctx.font = `${Math.floor(canvasWidth * 0.022)}px Arial`;
        ctx.textAlign = 'center';

        if (slide.content?.trim()) {
            currentY = wrapText(ctx, slide.content, contentCenterX, currentY, contentInnerWidth, canvasHeight * 0.04);
        }
        if (slide.content2?.trim()) {
            currentY += canvasHeight * 0.01; // Small space between content blocks
            currentY = wrapText(ctx, slide.content2, contentCenterX, currentY, contentInnerWidth, canvasHeight * 0.04);
        }
        
        // 5. Draw visual if available, in the remaining space
        if (slide.visual?.type && project.visualFunctions && project.visualFunctions[slide.visual.type]) {
            const visualAreaY = currentY + canvasHeight * 0.02;
            const visualAreaHeight = (contentAreaY + contentAreaHeight) - visualAreaY - contentPadding;

            if (visualAreaHeight > canvasHeight * 0.1) { // Only draw if there's enough space
                try {
                    let visualFunc = project.visualFunctions[slide.visual.type];
                    let func;

                    if (typeof visualFunc === 'string') {
                        const functionBody = visualFunc.replace(/^function\s+\w+\s*\([^)]*\)\s*\{/, '').replace(/\}$/, '');
                        func = new Function('ctx', 'params', functionBody);
                    } else {
                        func = visualFunc;
                    }

                    if (typeof func === 'function') {
                        ctx.save();
                        // Clip to the designated visual area
                        ctx.beginPath();
                        ctx.rect(contentAreaX + contentPadding, visualAreaY, contentInnerWidth, visualAreaHeight);
                        ctx.clip();
                        
                        // Center the visual drawing
                        ctx.translate(contentAreaX + contentPadding, visualAreaY);
                        
                        // Execute the drawing function
                        func(ctx, slide.visual.params || []);
                        
                        ctx.restore();
                    }
                } catch (error) {
                    console.error('Error executing visual function:', error);
                    ctx.fillStyle = '#ef4444';
                    ctx.font = `${Math.floor(canvasWidth * 0.02)}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.fillText('Error rendering visual', contentCenterX, visualAreaY + visualAreaHeight / 2);
                }
            }
        }

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

                // Add a new page for each slide except the first one
                if (i > 0) {
                    pdf.addPage();
                }

                // Render the current slide to the canvas
                const slideImage = renderSlideToCanvas(slide, canvas);

                if (slideImage) {
                    // Add the generated image to the PDF, fitting it within the margins
                    pdf.addImage(slideImage, 'JPEG', margin, margin, contentWidth, contentHeight);

                    // Add footer with slide number and speaker info
                    pdf.setFontSize(9);
                    pdf.setTextColor(150, 150, 150);
                    pdf.text(`Slide ${i + 1} of ${slides.length}`, margin, pageHeight - 10);
                    
                    const speakerName = project.speakers?.[slide.speaker]?.name || slide.speaker;
                    const speakerText = `Speaker: ${speakerName}`;
                    const textWidth = pdf.getStringUnitWidth(speakerText) * pdf.getFontSize() / pdf.internal.scaleFactor;
                    pdf.text(speakerText, pageWidth - margin - textWidth, pageHeight - 10);
                }
                
                // Update progress after each slide is processed
                setProgress(Math.round(((i + 1) / slides.length) * 100));

                // A small delay to keep the UI responsive during generation
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Save the final PDF
            pdf.save(filename);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please check the console for details.');
        } finally {
            setIsGenerating(false);
            setProgress(0);
        }
    };

    return (
        <div className="space-y-4">
            {/* Hidden canvas used for rendering each slide before adding to PDF */}
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
                    <strong>Layout:</strong> A4 landscape (297×210mm) with 20mm margins<br />
                    <strong>Content:</strong> Main title, slide title, content lines, visuals, and speaker avatars<br />
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
                    <strong>Note:</strong> This feature requires the <code className="bg-white px-1 rounded">jspdf</code> library.
                </div>
            </div>
        </div>
    );
};

export default PDFExportButton;
