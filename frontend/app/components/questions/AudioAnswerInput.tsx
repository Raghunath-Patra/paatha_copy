// frontend/app/components/questions/AudioAnswerInput

import React, { useState, useRef } from 'react';
import { Camera, Mic, Square, Keyboard, Image } from 'lucide-react';


interface AudioAnswerInputProps {
    onAudioCaptured: (blob: Blob) => Promise<void>;
    disabled: boolean;
  }


export const AudioAnswerInput: React.FC<AudioAnswerInputProps> = ({ onAudioCaptured, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await onAudioCaptured(audioBlob);
        setLoading(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setLoading(true);
      
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Mic size={20} />
            Record Answer
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Square size={20} />
            Stop Recording
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      {isRecording && (
        <div className="flex items-center gap-2 text-red-600">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
          Recording...
        </div>
      )}
    </div>
  );
};
export default AudioAnswerInput;