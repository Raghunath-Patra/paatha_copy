// components/quiz/ImageTextExtractor.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import { 
  Camera,
  Upload,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  SwitchCamera,
  RefreshCw,
  X,
  CheckCircle
} from 'lucide-react';

interface ImageTextExtractorProps {
  onTextExtracted: (text: string, source: 'camera' | 'upload') => void;
  disabled?: boolean;
  className?: string;
  buttonText?: string;
  showTips?: boolean;
}

export default function ImageTextExtractor({ 
  onTextExtracted, 
  disabled = false, 
  className = "",
  buttonText = "Add Image",
  showTips = true 
}: ImageTextExtractorProps) {
  // States
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccess, setImageSuccess] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isDesktop, setIsDesktop] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // SSR-safe client detection
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Device detection - only run on client
  useEffect(() => {
    if (!isClient) return;

    const checkDevice = () => {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const isDesktopSize = window.innerWidth >= 1024;
      
      const desktopDetected = isDesktopSize && (!isMobile || !hasTouch);
      setIsDesktop(desktopDetected);
      setFacingMode(desktopDetected ? 'user' : 'environment');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, [isClient]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Clear success/error messages after delay
  useEffect(() => {
    if (imageSuccess) {
      const timer = setTimeout(() => setImageSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [imageSuccess]);

  useEffect(() => {
    if (imageError) {
      const timer = setTimeout(() => setImageError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [imageError]);

  const processImageFile = async (file: File) => {
    setProcessingImage(true);
    setImageError(null);
    setImageSuccess(null);

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image too large (maximum 10MB)');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please log in again');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/student/process-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || `Server error: ${response.status}`);
      }

      if (result.success && result.extracted_text) {
        setImageSuccess(`Successfully extracted text from image! ${result.extracted_text.length} characters extracted.`);
        onTextExtracted(result.extracted_text, 'upload');
      } else {
        setImageError('No text could be extracted from this image. Please try a clearer image.');
      }
    } catch (err) {
      console.error('Error processing image:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      setImageError(errorMessage);
    } finally {
      setProcessingImage(false);
      setShowImageOptions(false);
    }
  };

  const processImageFromCamera = async (imageDataUrl: string) => {
    setProcessingImage(true);
    setImageError(null);
    setImageSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please log in again');

      if (!imageDataUrl || !imageDataUrl.includes(',')) {
        throw new Error('Invalid image capture');
      }

      const base64Data = imageDataUrl.split(',')[1];
      
      if (!base64Data) {
        throw new Error('Failed to capture image data');
      }

      const response = await fetch(`${API_URL}/api/student/process-image-base64`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Data })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || `Server error: ${response.status}`);
      }

      if (result.success && result.extracted_text) {
        setImageSuccess(`Successfully extracted text from camera! ${result.extracted_text.length} characters extracted.`);
        onTextExtracted(result.extracted_text, 'camera');
      } else {
        setImageError('No text could be extracted from the captured image. Please try again with better lighting.');
      }
    } catch (err) {
      console.error('Error processing camera image:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process captured image';
      setImageError(errorMessage);
    } finally {
      setProcessingImage(false);
      setShowImageOptions(false);
      stopCamera();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const startCamera = async () => {
    if (!isClient || typeof navigator === 'undefined') {
      setCameraError('Camera not available');
      return;
    }

    try {
      setCameraError(null);
      
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setCameraStream(stream);
      setCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      let errorMessage = 'Failed to access camera. ';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage += 'Please allow camera access and try again.';
        } else if (err.name === 'NotFoundError') {
          errorMessage += 'No camera found on this device.';
        } else if (err.name === 'NotReadableError') {
          errorMessage += 'Camera is already in use by another application.';
        } else {
          errorMessage += 'Please check your camera permissions.';
        }
      }
      
      setCameraError(errorMessage);
      setImageError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
    setCameraError(null);
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (cameraActive) {
      stopCamera();
      setTimeout(() => {
        setFacingMode(newFacingMode);
        startCamera();
      }, 100);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context || video.videoWidth === 0 || video.videoHeight === 0) {
        setImageError('Camera not ready. Please wait for the camera to load.');
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0);
      
      try {
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        processImageFromCamera(imageDataUrl);
      } catch (err) {
        console.error('Error capturing image:', err);
        setImageError('Failed to capture image. Please try again.');
      }
    }
  };

  const handleClose = () => {
    setShowImageOptions(false);
    stopCamera();
    setImageError(null);
    setImageSuccess(null);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className={className}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setShowImageOptions(!showImageOptions)}
        className="inline-flex items-center px-3 py-1 border border-blue-300 text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 text-sm disabled:opacity-50"
        disabled={disabled || processingImage}
      >
        <ImageIcon className="h-4 w-4 mr-1" />
        {buttonText}
      </button>

      {/* Success Message */}
      {imageSuccess && (
        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center text-green-700">
            <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="text-sm">{imageSuccess}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {imageError && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start text-red-700">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Error processing image:</p>
              <p>{imageError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Image Upload Options */}
      {showImageOptions && (
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-blue-900">Extract Text from Image</h4>
            <button
              type="button"
              onClick={handleClose}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={processingImage}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-700 bg-white rounded-md hover:bg-blue-50 disabled:opacity-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </button>
            
            <button
              type="button"
              onClick={cameraActive ? stopCamera : startCamera}
              disabled={processingImage}
              className={`flex-1 inline-flex items-center justify-center px-4 py-2 border rounded-md disabled:opacity-50 ${
                cameraActive 
                  ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                  : 'border-blue-300 text-blue-700 bg-white hover:bg-blue-50'
              }`}
            >
              <Camera className="h-4 w-4 mr-2" />
              {cameraActive ? 'Stop Camera' : `Use Camera${isDesktop ? ' (Front)' : ' (Back)'}`}
            </button>
          </div>

          {/* Camera switching button */}
          {cameraActive && (
            <div className="flex justify-center mb-3">
              <button
                type="button"
                onClick={switchCamera}
                disabled={processingImage}
                className="inline-flex items-center px-3 py-2 text-sm border border-blue-300 text-blue-700 bg-white rounded-md hover:bg-blue-50 disabled:opacity-50"
              >
                <SwitchCamera className="h-4 w-4 mr-2" />
                Switch to {facingMode === 'user' ? 'Back' : 'Front'} Camera
              </button>
            </div>
          )}

          {/* Camera preview */}
          {cameraActive && (
            <div className="mt-4">
              {cameraError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-700 text-sm">{cameraError}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="mt-2 inline-flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-w-sm mx-auto rounded-lg bg-black"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />
                  <div className="mt-3 text-center space-y-2">
                    <p className="text-xs text-blue-700">
                      {facingMode === 'user' ? 'Front camera active' : 'Back camera active'}
                    </p>
                    <button
                      type="button"
                      onClick={captureImage}
                      disabled={processingImage}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capture & Extract Text
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Processing indicator */}
          {processingImage && (
            <div className="mt-4 flex items-center justify-center text-blue-700 bg-blue-100 rounded-lg p-3">
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              <div className="text-sm">
                <p className="font-medium">Processing image...</p>
                <p>Extracting text and visual content...</p>
              </div>
            </div>
          )}

          {/* Tips */}
          {showTips && (
            <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <p className="font-medium mb-1">💡 Image Upload Tips:</p>
              <ul className="space-y-1">
                <li>• Upload clear photos of handwritten text, diagrams, or printed material</li>
                <li>• Ensure good lighting and avoid shadows</li>
                <li>• For best results, hold the camera steady and focus clearly</li>
                <li>• Mathematical equations and diagrams are supported</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Hidden elements */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}