// frontend/app/components/questions/AnswerForm.tsx

import React, { useState, useEffect } from 'react';
import ImageAnswerInput from './ImageAnswerInput';
import { BookOpenCheck } from 'lucide-react';

interface AnswerFormProps {
  onSubmit: (answer: string, imageData?: string) => void;
  isSubmitting: boolean;
  questionType?: string;
  options?: string[];
  isDisabled?: boolean;
  stopTimer?: () => void; // New prop to directly stop the timer
  errorMessage?: string; // New prop
}

const AnswerForm: React.FC<AnswerFormProps> = ({
  onSubmit,
  isSubmitting,
  questionType,
  options = [],
  isDisabled = false,
  stopTimer,
  errorMessage
}) => {
  const [answer, setAnswer] = useState('');
  const [processing, setProcessing] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  
  // Track viewport width for responsive design
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    
    // Set initial width
    setViewportWidth(window.innerWidth);
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Immediately stop the timer before anything else
    if (stopTimer) {
      stopTimer();
    }
    
    // Disable form when submitting to prevent multiple submissions
    if (isSubmitting || isDisabled) return;
    
    // Now process the submission
    onSubmit(answer, imageData || undefined);
  };

  const handleImageCaptured = async (file: File) => {
    try {
      setProcessing(true);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const imageData = base64String.split(',')[1];
        setImageData(imageData);
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        alert('Failed to process image. Please try again.');
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Determine textarea height based on viewport width
  const getTextareaRows = () => {
    if (viewportWidth < 380) return 2; // Extra small mobile
    if (viewportWidth < 480) return 3; // Small mobile
    if (viewportWidth < 768) return 4; // Large mobile
    return 6; // Tablet and above
  };

  // Handle True/False questions by providing standard options
  const getOptions = () => {
    if (questionType === 'True/False') {
      return ['True', 'False'];
    }
    return options;
  };

  // Determine if we should show the options UI
  const showOptions = questionType === 'MCQ' || questionType === 'True/False';
  const displayOptions = showOptions ? getOptions() : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {showOptions ? (
        <div className="space-y-2">
          {displayOptions.map((option, index) => (
            <label
              key={index}
              className={`flex items-center space-x-2 p-2 hover:bg-neutral-50 rounded ${
                isDisabled || isSubmitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <input
                type="radio"
                name="answer"
                value={option}
                onChange={e => setAnswer(e.target.value)}
                disabled={isDisabled || isSubmitting}
                className="text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
              />
              <span className="text-neutral-700">{option}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isDisabled || isSubmitting}
            rows={getTextareaRows()}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              ${(isDisabled || isSubmitting) ? 'bg-gray-50 cursor-not-allowed' : ''}`}
            placeholder={isDisabled ? "Answer already submitted" : isSubmitting ? "Submitting answer..." : "Type your answer here..."}
          />

          <div className="border-t pt-3">
            <ImageAnswerInput
              onImageCaptured={handleImageCaptured}
              disabled={isDisabled || isSubmitting}
            />
            
            {imageData && (
              <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                Image uploaded successfully. You can type additional text above if needed.
              </div>
            )}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-2 bg-red-50 text-red-600 rounded-lg text-sm mb-3">
          {errorMessage}
        </div>
      )}

      <button
        id="answer-submit-button"
        type="submit"
        disabled={isSubmitting || (!answer && !imageData) || isDisabled || processing}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                disabled:opacity-50 disabled:cursor-not-allowed sticky bottom-2 flex items-center justify-center gap-2"
      >
        <BookOpenCheck size={20} />
        <span>
          {isSubmitting ? 'Submitting...' : 
           processing ? 'Processing...' :
           isDisabled ? 'Answer Submitted' : 'Submit Answer'}
        </span>
      </button>
    </form>
  );
};

export default AnswerForm;