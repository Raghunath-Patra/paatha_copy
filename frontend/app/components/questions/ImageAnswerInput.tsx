// frontend/app/components/questions/ImageAnswerInput.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Camera, X } from 'lucide-react';

interface ImageAnswerInputProps {
  onImageCaptured: (file: File) => Promise<void>;
  disabled: boolean;
}

const ImageAnswerInput: React.FC<ImageAnswerInputProps> = ({ 
  onImageCaptured, 
  disabled 
}) => {
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up when component unmounts
    return () => {
      stopCamera();
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Add custom event to notify other components when camera is active
  useEffect(() => {
    // When camera state changes, dispatch an event
    const event = new CustomEvent('cameraStateChanged', { 
      detail: { isActive: isFullscreen } 
    });
    document.dispatchEvent(event);
  }, [isFullscreen]);

  const startCamera = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Stop any existing stream first
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      streamRef.current = stream;
      setIsFullscreen(true);
      
      // Small delay to ensure DOM is ready before setting video source
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(err => {
              console.error('Error playing video:', err);
              setError('Could not start video preview. Please try again.');
            });
          };
        }
      }, 100);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please try uploading from gallery instead.');
      setIsFullscreen(false);
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsFullscreen(false);
  };

  // New reliable scroll function
  const scrollToSubmitButton = () => {
    setTimeout(() => {
      const submitBtn = document.getElementById('answer-submit-button');
      if (submitBtn) {
        submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add more force to the scroll
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 500); // Longer timeout to ensure image is processed
  };

  const capturePhoto = async () => {
    try {
      setLoading(true);
      setError('');

      if (!videoRef.current || !streamRef.current) {
        throw new Error('Camera not initialized');
      }

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.drawImage(videoRef.current, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          'image/jpeg',
          0.95
        );
      });

      const file = new File([blob], `photo_${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      const previewUrl = URL.createObjectURL(blob);
      setPreview(previewUrl);

      stopCamera();

      await onImageCaptured(file);
      
      // Call the improved scroll function after image capture
      scrollToSubmitButton();

    } catch (err) {
      console.error('Error capturing photo:', err);
      setError('Failed to capture photo. Please try again or upload from gallery.');
    } finally {
      setLoading(false);
    }
  };

  const processGalleryImage = async (file: File) => {
    if (!file) return;

    setLoading(true);
    setError('');
    
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      await onImageCaptured(file);
      
      // Call the improved scroll function after image upload
      scrollToSubmitButton();

    } catch (error) {
      console.error('Error processing image:', error);
      setError(error instanceof Error ? error.message : 'Failed to process image');
      setPreview('');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processGalleryImage(file);
    }
  };

  const clearImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview('');
    setError('');
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || loading}
          className="flex items-center gap-1 sm:gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="hidden xs:inline">Upload from</span> Gallery
        </button>

        <button
          type="button"
          onClick={preview ? clearImage : startCamera}
          disabled={disabled || loading}
          className="flex items-center gap-1 sm:gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Camera size={16} className="sm:w-5 sm:h-5" />
          {preview ? (
            <>
              <span className="hidden xs:inline">Take New</span> Photo
            </>
          ) : (
            <>
              <span className="hidden xs:inline">Take</span> Photo
            </>
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {isFullscreen && (
        <div 
          ref={fullscreenContainerRef}
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
        >
          <button
            onClick={stopCamera}
            className="absolute top-4 right-4 z-60 p-2 bg-black bg-opacity-50 text-white rounded-full"
            aria-label="Close camera"
          >
            <X size={24} />
          </button>
            
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            autoPlay
            muted
          />
            
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex items-center justify-center z-60">
            <div 
              onClick={capturePhoto}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white cursor-pointer flex items-center justify-center"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white"></div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-50 text-red-600 rounded-lg text-xs sm:text-sm">
          {error}
        </div>
      )}

      {preview && (
        <div className="relative">
          <img 
            src={preview} 
            alt="Answer preview" 
            className="w-full h-[80vh] max-h-[600px] object-contain rounded-lg mx-auto"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
            disabled={disabled || loading}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageAnswerInput;