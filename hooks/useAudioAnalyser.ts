
import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioSource } from '../types';

export const useAudioAnalyser = (audioSource: AudioSource | null, onEnded?: () => void) => {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [rawAudioData, setRawAudioData] = useState<ArrayBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  // This ref can hold different types of source nodes
  const sourceNodeRef = useRef<AudioNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const mediaStreamDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const userMediaStreamRef = useRef<MediaStream | null>(null);
  
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  const stopCurrentSource = useCallback(() => {
     if (sourceNodeRef.current) {
      // For BufferSourceNode, we need to call stop()
      if (sourceNodeRef.current instanceof AudioBufferSourceNode) {
        // Remove onended handler to prevent it from firing on manual stop
        sourceNodeRef.current.onended = null;
        try {
          sourceNodeRef.current.stop();
        } catch (e) {
          // It might have already been stopped
        }
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // General cleanup function
  const cleanup = useCallback(() => {
    stopCurrentSource();
    if (userMediaStreamRef.current) {
      userMediaStreamRef.current.getTracks().forEach(track => track.stop());
      userMediaStreamRef.current = null;
    }
    setAudioStream(null);
    setRawAudioData(null);
  }, [stopCurrentSource]);
  
  const playAudioFile = useCallback(() => {
    if (!audioContextRef.current || !audioBufferRef.current || !analyser) return;

    const audioContext = audioContextRef.current;

    // Ensure the AudioContext is active. Browsers may suspend it until user interaction.
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(e => console.warn("Failed to resume audio context:", e));
    }

    stopCurrentSource(); // Stop any currently playing audio

    const bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = audioBufferRef.current;
    sourceNodeRef.current = bufferSource;

    // Create a destination for the recording stream if it doesn't exist.
    if (!mediaStreamDestinationRef.current) {
        mediaStreamDestinationRef.current = audioContext.createMediaStreamDestination();
        setAudioStream(mediaStreamDestinationRef.current.stream);
    }

    // Connect the single source to all necessary destinations
    bufferSource.connect(analyser); // For visualization
    bufferSource.connect(audioContext.destination); // For user to hear
    bufferSource.connect(mediaStreamDestinationRef.current); // For recording

    bufferSource.onended = () => {
        setIsPlaying(false);
        // Only call the onEnded prop if playback finished naturally
        if (audioContext.currentTime >= (bufferSource.buffer?.duration ?? 0)) {
            onEndedRef.current?.();
        }
    };

    bufferSource.start(0);
    setIsPlaying(true);
  }, [analyser, stopCurrentSource]);

  useEffect(() => {
    let isCancelled = false;

    if (!audioSource) {
      cleanup();
      if (analyser) {
        analyser.disconnect();
        setAnalyser(null);
      }
      return;
    }

    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("Web Audio API is not supported in this browser", e);
        setError("This browser does not support the Web Audio API, which is required for this application.");
        return;
      }
    }
    const audioContext = audioContextRef.current;
    
    // CRITICAL STABILITY FIX: Force resume whenever we setup a new source
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(console.error);
    }

    const newAnalyser = audioContext.createAnalyser();
    newAnalyser.fftSize = 256;
    setAnalyser(newAnalyser);

    const setupSource = async () => {
      cleanup();
      setError(null);

      if (audioSource === 'mic') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (isCancelled) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          userMediaStreamRef.current = stream;
          setAudioStream(stream); // Pass mic stream directly to recorder
          const micSource = audioContext.createMediaStreamSource(stream);
          sourceNodeRef.current = micSource;
          micSource.connect(newAnalyser);
          
          // Ensure context is running for mic input too
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }
          setIsPlaying(true);
        } catch (err) {
          console.error('Error accessing microphone:', err);
          setError("Microphone access was denied. Please allow microphone access in your browser settings and refresh the page.");
        }
      } else if (audioSource instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (isCancelled) return;
            const arrayBuffer = e.target?.result as ArrayBuffer;
            if (arrayBuffer) {
                setRawAudioData(arrayBuffer);
                // Use slice(0) to create a copy, as decodeAudioData can detach the buffer
                audioContext.decodeAudioData(arrayBuffer.slice(0), (buffer) => {
                    if (isCancelled) return;
                    audioBufferRef.current = buffer;
                    playAudioFile();
                }, (err) => {
                    console.error('Error decoding audio data:', err);
                    setError("Failed to decode the audio file. It may be corrupted or in an unsupported format.");
                });
            }
        };
        reader.onerror = (e) => {
          console.error("Error reading file:", e);
          if (isCancelled) return;
          setError("An error occurred while reading the audio file.");
        };
        reader.readAsArrayBuffer(audioSource);
      }
    };
    
    setupSource();

    return () => {
      isCancelled = true;
      cleanup();
      if (newAnalyser) {
        newAnalyser.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSource]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => {
    if (audioSource instanceof File) {
      if (isPlaying) {
        stopCurrentSource();
      } else {
        playAudioFile();
      }
    }
  };

  const restart = useCallback(() => {
    if (audioSource instanceof File) {
        playAudioFile();
    }
  }, [audioSource, playAudioFile]);

  const isFile = audioSource instanceof File;

  return { analyser, isPlaying, togglePlay, isFile, audioStream, restart, rawAudioData, error };
};
