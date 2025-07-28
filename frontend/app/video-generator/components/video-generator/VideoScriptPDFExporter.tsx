import React, { useState } from 'react';
import { Download, FileText, Loader2, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { jsPDF } from 'jspdf';

// Define interfaces first
interface Speaker {
  name?: string;
  voice?: string;
  gender?: string;
  color?: string;
}

interface VisualFunction {
  type: string;
  params?: any[];
}

interface Slide {
  title?: string;
  content?: string;
  content2?: string;
  narration?: string;
  speaker: string;
  visualDuration?: number;
  isComplex?: boolean;
  visual?: VisualFunction;
  [key: string]: any; // Allow dynamic string indexing
}

interface Project {
  id?: string;
  title?: string;
  description?: string;
  speakers?: Record<string, Speaker>;
  visualFunctions?: Record<string, string | Function>;
}

// Updated class implementing the simpler export logic from pdf-export.js
class VideoScriptPDFExporter {
  private pdf: jsPDF | null;
  private currentProject: Project | null;
  private slides: Slide[];
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private contentWidth: number;

  constructor() {
    this.pdf = null;
    this.currentProject = null;
    this.slides = [];
    this.pageWidth = 210;
    this.pageHeight = 297;
    this.margin = 20;
    this.contentWidth = 170; // pageWidth - (margin * 2)
  }

  async generatePDF(project: Project, slides: Slide[]): Promise<jsPDF> {
    this.currentProject = project;
    this.slides = slides;

    try {
      this.pdf = new jsPDF('p', 'mm', 'a4');
      console.log('📄 Starting PDF generation...');

      // Generate PDF content following the simpler structure
      this.addTitlePage();

      // Add a new page for each slide
      this.slides.forEach((slide, index) => {
        this.pdf!.addPage();
        this.addSlidePage(slide, index + 1);
      });

      this.addSummaryPage();

      console.log('✅ PDF generation complete');
      return this.pdf;

    } catch (error) {
      console.error('❌ PDF Generation Error:', error);
      throw error;
    }
  }

  // Page Generation Methods
  addTitlePage() {
    if (!this.pdf) return;
    const centerX = this.pageWidth / 2;
    let yPos = 60;

    // Main title
    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    const title = this.getProjectTitle();
    this.pdf.text(title, centerX, yPos, { align: 'center' });

    yPos += 20;

    // Subtitle
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Educational Video Script', centerX, yPos, { align: 'center' });

    yPos += 40;

    // Project information box
    this.drawInfoBox(yPos);
    yPos += 80;

    // Speakers section
    this.addSpeakersSection(yPos);
  }

  addSlidePage(slide: Slide, slideNumber: number) {
    if (!this.pdf) return;
    let yPos = this.margin;

    // Header with slide number and speaker
    this.addSlideHeader(slide, slideNumber, yPos);
    yPos += 20;

    // Title
    yPos = this.addSlideTitle(slide, yPos);

    // Content sections
    yPos = this.addSlideContent(slide, yPos);

    // Narration
    yPos = this.addSlideNarration(slide, yPos);

    // Technical details
    yPos = this.addSlideTechnicalDetails(slide, yPos);

    // Visual information
    if (slide.visual?.type) {
      yPos = this.addSlideVisualInfo(slide, yPos);
    }

    // Footer separator
    this.addSlideFooter(yPos);
  }

  addSummaryPage() {
    if (!this.pdf) return;
    this.pdf.addPage();
    let yPos = this.margin;

    // Summary title
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Script Summary & Statistics', this.pageWidth / 2, yPos, { align: 'center' });

    yPos += 25;

    // Statistics
    yPos = this.addStatistics(yPos);
    yPos += 15;

    // Visual functions used
    yPos = this.addVisualFunctionsList(yPos);
    yPos += 15;

    // Speaker breakdown
    yPos = this.addSpeakerBreakdown(yPos);

    // Footer
    this.addPDFFooter();
  }

  // Helper Methods for PDF Content
  drawInfoBox(yPos: number) {
    if (!this.pdf) return;
    const boxHeight = 40;

    // Draw border and background
    this.pdf.setLineWidth(0.5);
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setFillColor(245, 245, 245);
    this.pdf.rect(this.margin, yPos, this.contentWidth, boxHeight, 'FD');

    // Add content
    yPos += 15;
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(0, 0, 0);

    const projectInfo = [
      `Project ID: ${this.currentProject?.id?.substring(0, 12) || 'Unknown'}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      `Total Slides: ${this.slides.length}`,
      `Est. Duration: ${this.calculateTotalDuration()}s`
    ];

    projectInfo.forEach((info, index) => {
      const x = this.margin + 10 + (index % 2) * (this.contentWidth / 2);
      const y = yPos + Math.floor(index / 2) * 10;
      this.pdf!.text(info, x, y);
    });
  }

  addSpeakersSection(yPos: number) {
    if (!this.pdf) return; // This guard clause is effective for a for...of loop.
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Speakers', this.margin, yPos);

    yPos += 12;
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');

    if (this.currentProject?.speakers && Object.keys(this.currentProject.speakers).length > 0) {
      // Replaced forEach with a for...of loop to resolve the type error.
      for (const [key, speaker] of Object.entries(this.currentProject.speakers)) {
        this.pdf.text(
          `• ${speaker.name || key} (Voice: ${speaker.voice || 'default'}, Gender: ${speaker.gender || 'unknown'})`,
          this.margin + 5,
          yPos
        );
        yPos += 7;
      }
    } else {
      this.pdf.text('• No speaker information available', this.margin + 5, yPos);
    }
  }

  addSlideHeader(slide: Slide, slideNumber: number, yPos: number) {
    if (!this.pdf) return;
    // Slide number
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(26, 82, 118); // Blue color
    this.pdf.text(`Slide ${slideNumber}`, this.margin, yPos);

    // Speaker info
    const speakerName = this.currentProject?.speakers?.[slide.speaker]?.name || slide.speaker;
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text(`Speaker: ${speakerName}`, this.pageWidth - this.margin, yPos, { align: 'right' });

    this.pdf.setTextColor(0, 0, 0); // Reset to black
  }

  addSlideTitle(slide: Slide, yPos: number): number {
    if (!this.pdf) return yPos;
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    const titleLines = this.pdf.splitTextToSize(slide.title || 'Untitled', this.contentWidth);
    this.pdf.text(titleLines, this.margin, yPos);
    return yPos + (Array.isArray(titleLines) ? titleLines.length : 1) * 7 + 10;
  }

  addSlideContent(slide: Slide, yPos: number): number {
    if (!this.pdf) return yPos;
    this.pdf.setFontSize(11);

    if (slide.content) {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Content:', this.margin, yPos);
      yPos += 7;

      this.pdf.setFont('helvetica', 'normal');
      const contentLines = this.pdf.splitTextToSize(slide.content, this.contentWidth - 10);
      this.pdf.text(contentLines, this.margin + 5, yPos);
      yPos += (Array.isArray(contentLines) ? contentLines.length : 1) * 5 + 8;
    }

    if (slide.content2) {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Additional Content:', this.margin, yPos);
      yPos += 7;

      this.pdf.setFont('helvetica', 'normal');
      const content2Lines = this.pdf.splitTextToSize(slide.content2, this.contentWidth - 10);
      this.pdf.text(content2Lines, this.margin + 5, yPos);
      yPos += (Array.isArray(content2Lines) ? content2Lines.length : 1) * 5 + 8;
    }

    return yPos;
  }

  addSlideNarration(slide: Slide, yPos: number): number {
    if (!this.pdf) return yPos;
    if (slide.narration) {
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Narration:', this.margin, yPos);
      yPos += 7;

      this.pdf.setFont('helvetica', 'italic');
      this.pdf.setTextColor(60, 60, 60);
      const narrationLines = this.pdf.splitTextToSize(slide.narration, this.contentWidth - 10);
      this.pdf.text(narrationLines, this.margin + 5, yPos);
      yPos += (Array.isArray(narrationLines) ? narrationLines.length : 1) * 5 + 8;

      this.pdf.setTextColor(0, 0, 0); // Reset color
      this.pdf.setFont('helvetica', 'normal'); // Reset font
    }
    return yPos;
  }

  addSlideTechnicalDetails(slide: Slide, yPos: number): number {
    if (!this.pdf) return yPos;
    yPos += 5;
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(100, 100, 100);

    const techDetails = [
      `Duration: ${slide.visualDuration || 'N/A'}s`,
      `Complex: ${slide.isComplex ? 'Yes' : 'No'}`,
      `Speaker Key: ${slide.speaker}`
    ].join(' | ');

    this.pdf.text(techDetails, this.margin, yPos);
    this.pdf.setTextColor(0, 0, 0); // Reset color
    return yPos + 10;
  }

  addSlideVisualInfo(slide: Slide, yPos: number): number {
    if (!this.pdf) return yPos;
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(231, 76, 60); // Red-orange color
    this.pdf.text('🎨 Visual Function:', this.margin, yPos);
    yPos += 7;

    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(0, 0, 0);
    const visualInfo = `${slide.visual!.type}(${slide.visual!.params ? slide.visual!.params.join(', ') : ''})`;
    const visualLines = this.pdf.splitTextToSize(visualInfo, this.contentWidth - 10);
    this.pdf.text(visualLines, this.margin + 5, yPos);

    return yPos + (Array.isArray(visualLines) ? visualLines.length : 1) * 5 + 8;
  }

  addSlideFooter(yPos: number) {
    if (!this.pdf || yPos > this.pageHeight - this.margin) return;
    this.pdf.setLineWidth(0.3);
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margin, this.pageHeight - this.margin, this.pageWidth - this.margin, this.pageHeight - this.margin);
  }

  addStatistics(yPos: number): number {
    if (!this.pdf) return yPos;
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('📊 Project Statistics', this.margin, yPos);
    yPos += 12;

    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');

    const stats = [
      `Total Slides: ${this.slides.length}`,
      `Total Speakers: ${Object.keys(this.currentProject?.speakers || {}).length}`,
      `Visual Functions Used: ${this.getUniqueVisualFunctions().length}`,
      `Estimated Total Duration: ${this.calculateTotalDuration()}s`,
      `Complex Slides: ${this.slides.filter(s => s.isComplex).length}`,
      `Average Slide Duration: ${(this.calculateTotalDuration() / (this.slides.length || 1)).toFixed(1)}s`
    ];

    stats.forEach(stat => {
      this.pdf!.text(`• ${stat}`, this.margin + 5, yPos);
      yPos += 7;
    });

    return yPos;
  }

  addVisualFunctionsList(yPos: number): number {
    if (!this.pdf) return yPos;
    const visualFunctions = this.getUniqueVisualFunctions();

    if (visualFunctions.length > 0) {
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('🎨 Visual Functions Used', this.margin, yPos);
      yPos += 12;

      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');

      visualFunctions.forEach(func => {
        this.pdf!.text(`• ${func}`, this.margin + 5, yPos);
        yPos += 7;
      });
    }

    return yPos;
  }

  addSpeakerBreakdown(yPos: number): number {
    if (!this.pdf) return yPos;
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('👥 Speaker Breakdown', this.margin, yPos);
    yPos += 12;

    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');

    const speakerCounts: Record<string, number> = {};
    this.slides.forEach(slide => {
      speakerCounts[slide.speaker] = (speakerCounts[slide.speaker] || 0) + 1;
    });

    Object.entries(speakerCounts).forEach(([speakerKey, count]) => {
      const speakerName = this.currentProject?.speakers?.[speakerKey]?.name || speakerKey;
      const percentage = ((count / this.slides.length) * 100).toFixed(1);
      this.pdf!.text(`• ${speakerName}: ${count} slides (${percentage}%)`, this.margin + 5, yPos);
      yPos += 7;
    });

    return yPos;
  }
  
  addPDFFooter() {
    if (!this.pdf) return;
    const pageCount = this.pdf.getNumberOfPages();
    const footerY = this.pageHeight - 15;
    
    for (let i = 1; i <= pageCount; i++) {
        this.pdf.setPage(i);
        this.pdf.setFontSize(8);
        this.pdf.setTextColor(100, 100, 100);
        this.pdf.text(
            `Page ${i} of ${pageCount} | Generated by Educational Video Generator`,
            this.pageWidth / 2,
            footerY,
            { align: 'center' }
        );
        this.pdf.text(
            `Export Date: ${new Date().toLocaleString()}`,
            this.pageWidth / 2,
            footerY + 5,
            { align: 'center' }
        );
    }
  }


  // Utility Methods
  getProjectTitle(): string {
    return this.currentProject?.title || this.slides[0]?.title || 'Educational Video Script';
  }

  calculateTotalDuration(): number {
    return this.slides.reduce((sum, slide) => sum + (slide.visualDuration || 4), 0);
  }

  getUniqueVisualFunctions(): string[] {
    const visualTypes = this.slides
      .map(s => s.visual?.type)
      .filter((type): type is string => !!type);
    return [...new Set(visualTypes)];
  }

  downloadPDF(filename: string) {
    if (this.pdf) {
      this.pdf.save(filename);
      console.log(`✅ PDF downloaded: ${filename}`);
    } else {
      throw new Error('PDF has not been generated yet.');
    }
  }
}

// --- React Component ---
// The React component part remains largely the same, but the preview section is simplified.
interface VideoScriptPDFExportProps {
  project?: Project | null;
  slides?: Slide[];
  filename?: string;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
  onExportStart?: () => void;
  onExportComplete?: (filename: string) => void;
  onExportError?: (error: Error) => void;
}

const VideoScriptPDFExport: React.FC<VideoScriptPDFExportProps> = ({
  project = null,
  slides = [],
  filename = '',
  buttonText = 'Download PDF',
  className = '',
  disabled = false,
  onExportStart = () => {},
  onExportComplete = (filename: string) => {},
  onExportError = (error: Error) => {}
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState < { type: 'success' | 'error' | 'info'; message: string } | null > (null);

  const getFilename = (): string => {
    if (filename) return filename;
    const projectTitle = project?.title || 'video-script';
    const timestamp = new Date().toISOString().split('T')[0];
    return `${projectTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.pdf`;
  };
  
  // Using a simplified default project and slides for the preview info
  const defaultProject: Project = { id: 'demo-id', title: 'Sample Project' };
  const defaultSlides: Slide[] = [{ title: 'Slide 1', speaker: 'teacher' }];

  const handleExport = async () => {
    if (isExporting || !project || slides.length === 0) return;

    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportStatus({ type: 'info', message: 'Preparing PDF export...' });
      onExportStart();

      // Simulate a quick progress for better UX
      await new Promise(resolve => setTimeout(resolve, 250));
      setExportProgress(50);
      setExportStatus({ type: 'info', message: 'Generating document...' });
      await new Promise(resolve => setTimeout(resolve, 500));

      const exporter = new VideoScriptPDFExporter();
      await exporter.generatePDF(project, slides);

      const finalFilename = getFilename();
      exporter.downloadPDF(finalFilename);

      setExportProgress(100);
      setExportStatus({ type: 'success', message: `PDF exported as "${finalFilename}"!` });
      onExportComplete(finalFilename);

    } catch (error) {
      console.error('PDF Export Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setExportStatus({ type: 'error', message: `Export failed: ${errorMessage}` });
      onExportError(error as Error);
    } finally {
      // Reset state after a delay
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setTimeout(() => setExportStatus(null), 5000);
      }, 2000);
    }
  };

  const displaySlides = slides.length > 0 ? slides : defaultSlides;
  const displayProject = project || defaultProject;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={disabled || isExporting}
        className={`inline-flex items-center px-6 py-3 rounded-lg font-semibold text-sm
          transition-all duration-300 transform hover:scale-105
          ${isExporting 
            ? 'bg-blue-400 cursor-not-allowed' 
            : disabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
          }`}
      >
        {isExporting ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...</>
        ) : (
          <><FileText className="w-4 h-4 mr-2" /> {buttonText}</>
        )}
      </button>

      {isExporting && (
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${exportProgress}%` }}
          />
        </div>
      )}

      {exportStatus && (
        <div className={`flex items-center p-4 rounded-lg border
          ${exportStatus.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
            exportStatus.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
            'bg-blue-50 text-blue-800 border-blue-200'}`}
        >
          {exportStatus.type === 'success' && <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
          {exportStatus.type === 'error' && <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
          {exportStatus.type === 'info' && <Loader2 className="w-5 h-5 mr-2 flex-shrink-0 animate-spin" />}
          <span className="text-sm font-medium">{exportStatus.message}</span>
        </div>
      )}

      {/* Simplified Export Information */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <BarChart3 className="w-4 h-4 mr-2" />
          Export Details
        </h4>
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>📊 Total Slides:</span>
              <span className="font-medium">{displaySlides.length}</span>
            </div>
            <div className="flex justify-between">
              <span>👥 Speakers:</span>
              <span className="font-medium">{Object.keys(displayProject.speakers || {}).length}</span>
            </div>
            <div className="flex justify-between">
              <span>📄 Estimated Pages:</span>
              <span className="font-medium">{displaySlides.length + 2}</span>
            </div>
            <div className="flex justify-between">
              <span>📋 Format:</span>
              <span className="font-medium">PDF</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export { VideoScriptPDFExporter };
export default VideoScriptPDFExport;