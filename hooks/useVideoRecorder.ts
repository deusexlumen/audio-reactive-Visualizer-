import { useState, useRef, useCallback } from 'react';

export interface RecordingOptions {
  resolution: string;
  frameRate: number;
  codec: 'vp9' | 'vp8' | 'h264' | 'av1';
  format: 'webm' | 'mp4';
  bitrate: number; // in Mbps
  filename: string;
}

export const useVideoRecorder = (
  canvasElement: HTMLCanvasElement | null, 
  audioStream: MediaStream | null
) => {
  const [recorderState, setRecorderState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const filenameRef = useRef<string>('audio-visualizer.webm');
  const mimeTypeRef = useRef<string | null>(null);
  const canvasStreamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback((options: RecordingOptions) => {
    setError(null);
    if (!canvasElement) {
        setError("Canvas element not available for recording.");
        return;
    }
    if (recorderState !== 'idle') {
        setError("Recorder is not ready.");
        return;
    }

    const { frameRate, codec, format, bitrate, filename } = options;
    filenameRef.current = filename;

    const canvasStream = canvasElement.captureStream(frameRate);
    canvasStreamRef.current = canvasStream;
    
    const videoTracks = canvasStream.getVideoTracks();
    const audioTracks = audioStream ? audioStream.getAudioTracks() : [];

    if (videoTracks.length === 0) {
      console.error("Failed to capture video track from canvas. Recording aborted.");
      setError("Could not capture video from the visualizer.");
      return;
    }
     if (audioTracks.length === 0) {
      console.warn("Recording initiated without an audio track.");
    }
    
    const outputStream = canvasStream;
    audioTracks.forEach(track => {
        try {
            outputStream.addTrack(track);
        } catch (e) {
            console.error("Error adding audio track:", e);
        }
    });

    let mimeType: string | undefined;
    if (format === 'webm') {
        const codecString = codec === 'av1' ? 'av01.0.05M.08' : codec;
        mimeType = [`video/webm; codecs=${codecString},opus`, `video/webm; codecs=${codecString}`, 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
    } else if (format === 'mp4' && codec === 'h264') {
        mimeType = [`video/mp4; codecs=avc1.42E01E,mp4a.40.2`, `video/mp4`].find(type => MediaRecorder.isTypeSupported(type));
    }

    if (!mimeType) {
        setError(`Your browser doesn't support the selected format/codec combination (${format.toUpperCase()}/${codec.toUpperCase()}).`);
        console.error(`No supported MIME type found for ${format}/${codec}`);
        return;
    }

    mimeTypeRef.current = mimeType;
    const videoBitsPerSecond = bitrate * 1000 * 1000; // Convert Mbps to bps

    try {
        mediaRecorderRef.current = new MediaRecorder(outputStream, { 
            mimeType,
            videoBitsPerSecond 
        });
    } catch(e) {
        console.error("Failed to create MediaRecorder:", e);
        setError("Failed to initialize recorder. The selected settings may be unsupported.");
        return;
    }

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      setRecorderState('processing');
      const blob = new Blob(recordedChunksRef.current, { type: mimeTypeRef.current || 'video/webm' });
      
      if (blob.size === 0) {
        console.warn("Recording resulted in an empty file. Nothing to download.");
        setError("Recording resulted in an empty file. This can happen with very short or silent recordings.");
        setRecorderState('idle');
        recordedChunksRef.current = [];
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style.display = 'none';
      a.href = url;
      a.download = filenameRef.current;
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      if (canvasStreamRef.current) {
        canvasStreamRef.current.getTracks().forEach(track => track.stop());
        canvasStreamRef.current = null;
      }
      outputStream.getTracks().forEach(track => track.stop());

      recordedChunksRef.current = [];
      setRecorderState('idle');
    };

    recordedChunksRef.current = [];
    mediaRecorderRef.current.start();
    setRecorderState('recording');
  }, [canvasElement, audioStream, recorderState]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recorderState === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [recorderState]);

  return { 
    isRecording: recorderState === 'recording',
    isProcessing: recorderState === 'processing',
    error,
    startRecording, 
    stopRecording 
  };
};