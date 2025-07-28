import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

// --- INTERFACES ---
interface Speaker {
  name?: string;
}

interface Slide {
  title?: string;
  content?: string;
  content2?: string;
  narration?: string;
  speaker: string;
}

interface Project {
  speakers?: Record<string, Speaker>;
}

// --- PDF EXPORTER CLASS ---
// A clean, rewritten class focused solely on exporting slide data,
// mimicking the directness of pdf-export.js.
class VideoScriptPDFExporter {
  private pdf: jsPDF | null = null;
  private project: Project | null = null;
  private slides: Slide[] = [];
  private readonly pageWidth: number = 210;
  private readonly margin: number = 20;
  private readonly contentWidth: number = 170; // pageWidth - (margin * 2)

  /**
   * Generates a PDF document with one slide per page.
   * @param project The project data, used for speaker names.
   * @param slides The array of slides to export.
   * @returns A jsPDF instance.
   */
  public generatePDF(project: Project, slides: Slide[]): jsPDF {
    this.project = project;
    this.slides = slides;
    this.pdf = new jsPDF('p', 'mm', 'a4');

    // Loop through each slide and create a dedicated page for it.
    this.slides.forEach((slide, index) => {
      // Add a new page for every slide after the first one.
      if (index > 0) {
        this.pdf!.addPage();
      }
      this.renderSlidePage(slide, index + 1);
    });

    return this.pdf;
  }

  /**
   * Renders the content of a single slide onto the current PDF page.
   * This method formats the text to be clear and readable, like a script.
   * @param slide The slide data to render.
   * @param slideNumber The slide's number in the sequence.
   */
  private renderSlidePage(slide: Slide, slideNumber: number) {
    if (!this.pdf) return;

    let yPos = this.margin;

    // 1. Page Header: Slide number and Speaker
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(12);
    this.pdf.setTextColor('#4A5568'); // Gray-700
    const speakerName = this.project?.speakers?.[slide.speaker]?.name || slide.speaker;
    this.pdf.text(`Slide ${slideNumber} | Speaker: ${speakerName}`, this.margin, yPos);
    yPos += 15;
    
    // Draw a separator line
    this.pdf.setDrawColor('#E2E8F0'); // Gray-300
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, yPos, this.pageWidth - this.margin, yPos);
    yPos += 15;

    // 2. Slide Title
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(18);
    this.pdf.setTextColor('#1A202C'); // Gray-900
    const titleLines = this.pdf.splitTextToSize(slide.title || 'Untitled Slide', this.contentWidth);
    this.pdf.text(titleLines, this.margin, yPos);
    yPos += (Array.isArray(titleLines) ? titleLines.length : 1) * 9 + 10;

    // 3. On-Screen Content
    yPos = this.renderSection(
      yPos,
      'On-Screen Content',
      (slide.content || '') + (slide.content2 ? `\n${slide.content2}` : '')
    );

    // 4. Narration Script
    yPos = this.renderSection(
      yPos,
      'Narration Script',
      slide.narration || '(No narration provided)',
      true // Italicize narration
    );
    
    // 5. Page Footer
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8);
    this.pdf.setTextColor('#A0AEC0'); // Gray-500
    this.pdf.text(`Page ${slideNumber}`, this.pageWidth / 2, 287, { align: 'center' });
  }

  /**
   * A helper to render a standard section with a title and content.
   * @param y The current vertical position on the PDF.
   * @param title The title of the section (e.g., "Narration Script").
   * @param content The text content for the section.
   * @param isItalic Whether the content should be italicized.
   * @returns The new vertical position after rendering.
   */
  private renderSection(y: number, title: string, content: string, isItalic = false): number {
    if (!this.pdf || !content) return y;

    let yPos = y;

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(11);
    this.pdf.setTextColor('#2D3748'); // Gray-800
    this.pdf.text(title, this.margin, yPos);
    yPos += 8;

    this.pdf.setFont('helvetica', isItalic ? 'italic' : 'normal');
    this.pdf.setFontSize(12);
    this.pdf.setTextColor('#4A5568'); // Gray-700
    const contentLines = this.pdf.splitTextToSize(content, this.contentWidth);
    this.pdf.text(contentLines, this.margin, yPos);
    yPos += (Array.isArray(contentLines) ? contentLines.length : 1) * 6 + 15;

    return yPos;
  }
}

// --- REACT COMPONENT ---
interface VideoScriptPDFExportProps {
  project: Project | null;
  slides: Slide[];
  filename?: string;
}

const VideoScriptPDFExport: React.FC<VideoScriptPDFExportProps> = (
  { project, slides, filename: providedFilename }
) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (isExporting || !project || slides.length === 0) {
      return;
    }

    setIsExporting(true);

    try {
      const exporter = new VideoScriptPDFExporter();
      const pdf = exporter.generatePDF(project, slides);
      
      const filename = providedFilename || `video-script-${Date.now()}.pdf`;
      pdf.save(filename);

    } catch (error) {
      console.error("Failed to generate PDF:", error);
      // Here you could add a user-facing error message
    } finally {
      // Allow the user to see the state before resetting
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  const isDisabled = isExporting || !project || slides.length === 0;

  return (
    <button
      onClick={handleExport}
      disabled={isDisabled}
      className={`inline-flex items-center px-6 py-3 rounded-lg font-semibold text-sm
        transition-all duration-300 transform
        ${isDisabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:scale-105'
        }`}
    >
      {isExporting ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating PDF...</>
      ) : (
        <><FileText className="w-4 h-4 mr-2" /> Download Script PDF</>
      )}
    </button>
  );
};

export default VideoScriptPDFExport;