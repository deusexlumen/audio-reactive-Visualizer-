
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioSourceSelector } from './components/AudioSourceSelector';
import { Visualizer } from './components/Visualizer';
import { useAudioAnalyser } from './hooks/useAudioAnalyser';
import { useVideoRecorder } from './hooks/useVideoRecorder';
import { ThemeSelector } from './components/PresetCard';
import { StyleSelector } from './components/PresetSelector';
import { TextSettings, LogoSettings, BackgroundSettings, ExportSettings, GeminiSuggestedSettings, PostProcessingSettings, AudioSource, SettingsAction, VisualizerTransformSettings, VisualizerStyle } from './types';
import { PlayIcon, PauseIcon, MicIcon, SparkleIcon, TrashIcon, GearIcon, ImageIcon, MaximizeIcon, MinimizeIcon } from './components/icons';
import { VISUALIZER_STYLES } from './constants';
import { GeminiControls } from './components/GeminiControls';
import { ImageGenerationControls } from './components/ImageGenerationControls';
import { TuningControls } from './components/TuningControls';
import { useAppState, useAppDispatch } from './contexts/AppContext';
import { CustomParticleControls } from './components/CustomParticleControls';
import { useSmoothedAudioData } from './hooks/useSmoothedAudioData';
import { CollapsibleSection, HeaderButton } from './components/UIComponents';

// --- Re-usable Control Components ---

const TextOverlayControls: React.FC<{
    settings: TextSettings;
    dispatch: React.Dispatch<SettingsAction>;
}> = ({ settings, dispatch }) => (
    <div className="space-y-4">
        <h4 className="font-semibold text-cyan-400 text-sm uppercase tracking-wider">Text Overlay</h4>
        <div>
            <label htmlFor="textOverlay" className="block text-sm font-medium mb-1 text-gray-400">Content</label>
            <input type="text" id="textOverlay" value={settings.content} onChange={(e) => dispatch({ type: 'UPDATE_TEXT_SETTINGS', payload: { content: e.target.value } })} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"/>
        </div>
        <div className="flex items-center gap-4">
            <label htmlFor="textColor" className="text-sm font-medium text-gray-400">Color</label>
            <input id="textColor" type="color" value={settings.color} onChange={(e) => dispatch({ type: 'UPDATE_TEXT_SETTINGS', payload: { color: e.target.value } })} className="w-10 h-10 p-0 border-none bg-transparent rounded cursor-pointer" aria-label="Text color picker" />
        </div>
        <div>
            <label htmlFor="fontSize" className="block text-sm font-medium text-gray-400 mb-1">Size: <span className="text-cyan-400">{settings.fontSize}px</span></label>
            <input id="fontSize" type="range" min="12" max="128" step="1" value={settings.fontSize} onChange={(e) => dispatch({ type: 'UPDATE_TEXT_SETTINGS', payload: { fontSize: parseInt(e.target.value, 10) } })} className="w-full" />
        </div>
        <div className="flex items-center justify-between">
            <label htmlFor="pulseOnBeat" className="text-sm font-medium text-gray-400">Pulse on Beat</label>
            <button
                id="pulseOnBeat"
                onClick={() => dispatch({ type: 'UPDATE_TEXT_SETTINGS', payload: { pulseOnBeat: !settings.pulseOnBeat } })}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${settings.pulseOnBeat ? 'bg-cyan-600' : 'bg-gray-700'}`}
                aria-pressed={settings.pulseOnBeat}
            >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.pulseOnBeat ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
        <div>
            <label htmlFor="textShadowBlur" className="block text-sm font-medium text-gray-400 mb-1">Shadow: <span className="text-cyan-400">{settings.shadowBlur}px</span></label>
            <input id="textShadowBlur" type="range" min="0" max="20" step="1" value={settings.shadowBlur} onChange={(e) => dispatch({ type: 'UPDATE_TEXT_SETTINGS', payload: { shadowBlur: parseInt(e.target.value, 10) } })} className="w-full" />
        </div>
        <div>
            <label htmlFor="textPositionX" className="block text-sm font-medium text-gray-400 mb-1">Position X: <span className="text-cyan-400">{settings.positionX}%</span></label>
            <input id="textPositionX" type="range" min="0" max="100" step="1" value={settings.positionX} onChange={(e) => dispatch({ type: 'UPDATE_TEXT_SETTINGS', payload: { positionX: parseInt(e.target.value, 10) } })} className="w-full" />
        </div>
        <div>
            <label htmlFor="textPositionY" className="block text-sm font-medium text-gray-400 mb-1">Position Y: <span className="text-cyan-400">{settings.positionY}%</span></label>
            <input id="textPositionY" type="range" min="0" max="100" step="1" value={settings.positionY} onChange={(e) => dispatch({ type: 'UPDATE_TEXT_SETTINGS', payload: { positionY: parseInt(e.target.value, 10) } })} className="w-full" />
        </div>
    </div>
);

const MediaOverlayControls: React.FC<{
    logoSettings: LogoSettings;
    backgroundSettings: BackgroundSettings;
    dispatch: React.Dispatch<SettingsAction>;
}> = ({ logoSettings, backgroundSettings, dispatch }) => {
    const handleFileChange = (callback: (url: string | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target && typeof event.target.result === 'string') {
                    callback(event.target.result);
                } else {
                    callback(null);
                }
            };
            reader.onerror = () => {
                console.error("Failed to read file.");
                callback(null);
            };
            reader.readAsDataURL(file);
        } else {
            callback(null);
        }
    };
    
    const handleInputClick = (event: React.MouseEvent<HTMLInputElement>) => {
        event.currentTarget.value = '';
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h4 className="font-semibold text-purple-400 text-sm uppercase tracking-wider">Logo</h4>
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-400">Upload Image</label>
                    <input type="file" accept="image/*" onChange={handleFileChange(url => dispatch({ type: 'UPDATE_LOGO_SETTINGS', payload: { url } }))} onClick={handleInputClick} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-900/30 file:text-purple-300 hover:file:bg-purple-900/50 cursor-pointer"/>
                    {logoSettings.url && (
                        <button onClick={() => dispatch({ type: 'UPDATE_LOGO_SETTINGS', payload: { url: null } })} className="text-red-400 text-xs hover:text-red-300 flex items-center gap-1 mt-2 transition-colors">
                            <TrashIcon className="w-3 h-3" /> Remove Logo
                        </button>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Size</label>
                    <input type="range" min="20" max="200" step="1" value={logoSettings.size} onChange={(e) => dispatch({ type: 'UPDATE_LOGO_SETTINGS', payload: { size: parseInt(e.target.value, 10) } })} className="w-full" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Opacity</label>
                    <input type="range" min="0" max="1" step="0.05" value={logoSettings.opacity} onChange={(e) => dispatch({ type: 'UPDATE_LOGO_SETTINGS', payload: { opacity: parseFloat(e.target.value) } })} className="w-full" />
                </div>
            </div>

            <div className="space-y-4 border-t border-gray-700 pt-4">
                <h4 className="font-semibold text-pink-400 text-sm uppercase tracking-wider">Background</h4>
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-400">Upload Image</label>
                    <input type="file" accept="image/*" onChange={handleFileChange(url => dispatch({ type: 'UPDATE_BACKGROUND_SETTINGS', payload: { url } }))} onClick={handleInputClick} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pink-900/30 file:text-pink-300 hover:file:bg-pink-900/50 cursor-pointer"/>
                    {backgroundSettings.url && (
                        <button onClick={() => dispatch({ type: 'UPDATE_BACKGROUND_SETTINGS', payload: { url: null } })} className="text-red-400 text-xs hover:text-red-300 flex items-center gap-1 mt-2 transition-colors">
                            <TrashIcon className="w-3 h-3" /> Remove Background
                        </button>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Opacity</label>
                    <input type="range" min="0" max="1" step="0.05" value={backgroundSettings.opacity} onChange={(e) => dispatch({ type: 'UPDATE_BACKGROUND_SETTINGS', payload: { opacity: parseFloat(e.target.value) } })} className="w-full" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Blur</label>
                    <input type="range" min="0" max="20" step="1" value={backgroundSettings.blur} onChange={(e) => dispatch({ type: 'UPDATE_BACKGROUND_SETTINGS', payload: { blur: parseInt(e.target.value, 10) } })} className="w-full" />
                </div>
            </div>
        </div>
    );
};

const ExportPanel: React.FC<{
    settings: ExportSettings;
    isRecording: boolean;
    isProcessing: boolean;
    isReady: boolean;
    dispatch: React.Dispatch<SettingsAction>;
    onStartRecording: () => void;
    onStopRecording: () => void;
    error?: string | null;
    recordingDuration?: string;
}> = ({ settings, isRecording, isProcessing, isReady, error, recordingDuration, dispatch, onStartRecording, onStopRecording }) => {
    
    type Codec = ExportSettings['codec'];
    type Format = ExportSettings['format'];
    type CodecSupport = Record<Codec, boolean>;

    const SUPPORTED_FORMATS = useMemo((): Record<Format, CodecSupport> => ({
        webm: {
            vp9: typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm; codecs=vp9,opus'),
            vp8: typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm; codecs=vp8,opus'),
            av1: typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm; codecs=av01.0.05M.08,opus'),
            h264: false,
        },
        mp4: {
            h264: typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/mp4; codecs=avc1.42E01E,mp4a.40.2'),
            vp9: false,
            vp8: false,
            av1: false,
        }
    }), []);
    
    const onSettingsChange = useCallback((payload: Partial<ExportSettings>) => {
        dispatch({ type: 'UPDATE_EXPORT_SETTINGS', payload });
    }, [dispatch]);

    useEffect(() => {
        const supportedCodecs = SUPPORTED_FORMATS[settings.format];
        if (!supportedCodecs[settings.codec]) {
            const firstAvailable = (Object.keys(supportedCodecs) as Codec[]).find(c => supportedCodecs[c]);
            if (firstAvailable) {
                onSettingsChange({ codec: firstAvailable });
            }
        }
    }, [settings.format, settings.codec, SUPPORTED_FORMATS, onSettingsChange]);

    const formatHasAnySupportedCodec = (format: 'webm' | 'mp4') => {
        return Object.values(SUPPORTED_FORMATS[format]).some(supported => supported);
    };

    return (
     <div className="space-y-6">
         <h4 className="font-semibold text-green-400 text-sm uppercase tracking-wider">Video Export</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Resolution</label>
                <select id="resolution" value={settings.resolution} onChange={(e) => onSettingsChange({ resolution: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-green-500 focus:border-green-500">
                <option value="854x480">480p (SD)</option>
                <option value="1280x720">720p (HD)</option>
                <option value="1920x1080">1080p (Full HD)</option>
                <option value="2560x1440">1440p (2K)</option>
                <option value="3840x2160">2160p (4K)</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Frame Rate</label>
                <select id="framerate" value={settings.frameRate} onChange={(e) => onSettingsChange({ frameRate: Number(e.target.value) })} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-green-500 focus:border-green-500">
                <option value={24}>24 FPS (Cinematic)</option>
                <option value={30}>30 FPS (Standard)</option>
                <option value={60}>60 FPS (Smooth)</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Format</label>
                <select id="format" value={settings.format} onChange={(e) => onSettingsChange({ format: e.target.value as 'webm' | 'mp4' })} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-green-500 focus:border-green-500 disabled:opacity-50">
                <option value="webm" disabled={!formatHasAnySupportedCodec('webm')}>WEBM</option>
                <option value="mp4" disabled={!formatHasAnySupportedCodec('mp4')}>MP4</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Codec</label>
                <select id="codec" value={settings.codec} onChange={(e) => onSettingsChange({ codec: e.target.value as ExportSettings['codec'] })} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-green-500 focus:border-green-500 disabled:opacity-50">
                {settings.format === 'webm' && (
                    <>
                    <option value="vp9" disabled={!SUPPORTED_FORMATS.webm.vp9}>VP9 (Recommended)</option>
                    <option value="vp8" disabled={!SUPPORTED_FORMATS.webm.vp8}>VP8</option>
                    <option value="av1" disabled={!SUPPORTED_FORMATS.webm.av1}>AV1 (Next-Gen)</option>
                    </>
                )}
                {settings.format === 'mp4' && (
                    <option value="h264" disabled={!SUPPORTED_FORMATS.mp4.h264}>H.264 (Compatibility)</option>
                )}
                </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Bitrate: <span className="text-green-400">{settings.bitrate} Mbps</span></label>
            <input id="bitrate" type="range" min="1" max="50" step="1" value={settings.bitrate} onChange={(e) => onSettingsChange({ bitrate: parseInt(e.target.value, 10) })} className="w-full" />
          </div>

         <div className="pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500 mb-4">Note: Audio is included in the recording.</p>
            {error && <p className="text-sm text-red-400 mb-2 font-medium bg-red-900/20 p-2 rounded">Error: {error}</p>}
            <div className="flex items-center gap-3">
                <button
                    onClick={isRecording ? onStopRecording : onStartRecording}
                    disabled={!isReady || isProcessing}
                    className={`flex-1 font-bold py-3 px-4 rounded-lg transition-all duration-300 text-white text-lg shadow-lg flex items-center justify-center gap-2
                        ${isRecording 
                            ? 'bg-red-600 hover:bg-red-700 shadow-red-900/30' 
                            : 'bg-green-600 hover:bg-green-700 shadow-green-900/30'} 
                        disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed`}
                >
                    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-red-200'}`}></div>
                    {isProcessing ? 'Processing Video...' : isRecording ? 'Stop & Save' : 'Start Recording'}
                </button>
                {isRecording && (
                    <div className="bg-gray-900 text-red-500 font-mono text-lg py-3 px-4 rounded-lg border border-red-900/30 shadow-inner min-w-[90px] text-center">
                        {recordingDuration}
                    </div>
                )}
            </div>
        </div>
     </div>
    );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const [suggestedImagePrompt, setSuggestedImagePrompt] = useState('');
  const [recordingDuration, setRecordingDuration] = useState<string>('00:00');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const visualizerContainerRef = useRef<HTMLDivElement>(null);
  
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { 
    selectedStyle, selectedTheme, themeCustomizations, textSettings, logoSettings,
    backgroundSettings, exportSettings, postProcessingSettings, visualizerTransformSettings,
    customParticleSettings
  } = state;

  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const isFile = audioSource instanceof File;

  const recorderStateRef = useRef({ isRecording: false, stopRecording: () => {} });
  
  // Timer Logic
  useEffect(() => {
      return () => {
          if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      };
  }, []);

  const startTimer = () => {
      recordingStartTimeRef.current = Date.now();
      setRecordingDuration('00:00');
      recordingTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - recordingStartTimeRef.current;
          const seconds = Math.floor((elapsed / 1000) % 60);
          const minutes = Math.floor((elapsed / 1000 / 60));
          setRecordingDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
  };

  const stopTimer = () => {
      if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
      }
      setRecordingDuration('00:00');
  };

  const onAudioEnded = useCallback(() => {
    if (recorderStateRef.current.isRecording && isFile) {
      recorderStateRef.current.stopRecording();
      stopTimer();
    }
  }, [isFile]);

  const { analyser, isPlaying, togglePlay, audioStream, restart: restartAudio, rawAudioData, error: audioError } = useAudioAnalyser(audioSource, onAudioEnded);
  // Returns a ref, not state
  const audioDataRef = useSmoothedAudioData(analyser);
  const { isRecording, isProcessing, error: recorderError, startRecording, stopRecording } = useVideoRecorder(canvasElement, audioStream);

  useEffect(() => {
    recorderStateRef.current = { isRecording, stopRecording };
  }, [isRecording, stopRecording]);

  const toggleFullscreen = useCallback(() => {
    if (!visualizerContainerRef.current) return;
    if (!document.fullscreenElement) {
        visualizerContainerRef.current.requestFullscreen().catch(console.error);
    } else {
        document.exitFullscreen().catch(console.error);
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        
        if (e.code === 'Space' && isFile) {
            e.preventDefault();
            togglePlay();
        } else if (e.code === 'KeyF') {
            toggleFullscreen();
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFile, togglePlay, toggleFullscreen]);

  const { width, height } = useMemo(() => {
      const [w, h] = exportSettings.resolution.split('x').map(Number);
      
      // For performance stability during preview (scrolling, tweaking), cap the canvas resolution to 1080p max.
      // Unless we are actively recording, in which case we need the full resolution.
      if (!isRecording) {
          const MAX_WIDTH = 1920;
          if (w > MAX_WIDTH) {
              const ratio = h / w;
              return { width: MAX_WIDTH, height: Math.round(MAX_WIDTH * ratio) };
          }
      }
      return { width: w, height: h };
  }, [exportSettings.resolution, isRecording]);

  const generateFilename = () => {
    const styleName = VISUALIZER_STYLES.find(s => s.id === selectedStyle)?.name.toLowerCase().replace(/\s+/g, '-') || 'style';
    const themeName = selectedTheme.name.toLowerCase().replace(/\s+/g, '-');
    const date = new Date();
    const dateString = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    return `visualizer-${styleName}-${themeName}-${dateString}.${exportSettings.format}`;
  };
  
  const handleStartRecording = () => {
    if (isFile) restartAudio();
    const filename = generateFilename();
    startRecording({ ...exportSettings, filename });
    startTimer();
  };

  const handleStopRecording = () => {
      stopRecording();
      stopTimer();
  };
  
  const handleSettingsGenerated = (settings: GeminiSuggestedSettings) => {
    dispatch({ type: 'APPLY_AI_SETTINGS', payload: settings });
    setSuggestedImagePrompt(settings.suggestedImagePrompt);
  };

  const resetApp = () => {
    setAudioSource(null);
    dispatch({ type: 'RESET_STATE' });
    setSuggestedImagePrompt('');
  };

  if (!audioSource) {
    return <AudioSourceSelector onSourceSelect={setAudioSource} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col items-center pb-20">
      
      {/* Header */}
      <div className="w-full bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
             <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center">
                     <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                 </div>
                 <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 hidden sm:block">Audio Visualizer</h1>
             </div>
             
             <HeaderButton 
                onClick={resetApp} 
                icon={<TrashIcon />} 
                text="Reset" 
                variant="danger"
             />
          </div>
      </div>
      
      <main className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Main Visualizer Area */}
        <div 
            ref={visualizerContainerRef}
            className="relative w-full mx-auto shadow-2xl shadow-black/50 rounded-xl overflow-hidden ring-1 ring-white/10 bg-black group"
            onDoubleClick={toggleFullscreen}
        >
          {audioError ? (
             <div className="w-full aspect-video flex flex-col items-center justify-center text-center p-8 bg-gray-900">
              <h3 className="text-2xl font-bold text-red-400 mb-2">Audio Stream Error</h3>
              <p className="text-gray-400 max-w-md">{audioError}</p>
            </div>
          ) : analyser ? (
            <Visualizer 
              audioDataRef={audioDataRef}
              style={selectedStyle} width={width} height={height}
              theme={themeCustomizations} text={textSettings} logo={logoSettings} 
              background={backgroundSettings} postProcessing={postProcessingSettings}
              transform={visualizerTransformSettings}
              customParticleSettings={customParticleSettings}
              onCanvasReady={setCanvasElement}
            />
          ) : (
            <div className="w-full aspect-video flex flex-col items-center justify-center bg-gray-900 animate-pulse">
               <span className="text-cyan-500 font-medium">Initializing Audio Engine...</span>
            </div>
          )}
          
          {/* Controls Overlay */}
          {!audioError && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between transition-opacity duration-300 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                <div className="flex items-center gap-3">
                     {isFile && (
                        <button onClick={togglePlay} className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-transform shadow-lg">
                          {isPlaying ? <PauseIcon className="h-6 w-6 fill-current" /> : <PlayIcon className="h-6 w-6 fill-current ml-1" />}
                        </button>
                      )}
                      <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                          {!isFile && <MicIcon className="h-4 w-4 text-red-500 animate-pulse" />}
                          <span className="text-sm font-medium text-gray-200 truncate max-w-[200px]">{isFile ? (audioSource as File).name : "Live Microphone Input"}</span>
                      </div>
                </div>

                <button 
                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                    className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-colors"
                    title="Toggle Fullscreen"
                >
                    {isFullscreen ? <MinimizeIcon className="w-5 h-5" /> : <MaximizeIcon className="w-5 h-5" />}
                </button>
            </div>
          )}
        </div>

        {/* --- Controls Section --- */}
        
        {/* 1. AI & Core Style (Always Visible or Collapsible based on preference, here Collapsible for cleanliness) */}
        {isFile && (
             <CollapsibleSection 
                title="AI Assistant" 
                icon={<SparkleIcon className="w-5 h-5"/>} 
                defaultOpen={true}
                badge="Gemini Powered"
             >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <GeminiControls 
                      audioSource={audioSource as File}
                      audioData={rawAudioData}
                      onSettingsGenerated={handleSettingsGenerated}
                      currentStyle={selectedStyle}
                    />
                    <ImageGenerationControls 
                      suggestedPrompt={suggestedImagePrompt}
                    />
                </div>
             </CollapsibleSection>
        )}

        <div className="space-y-6">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-900/50 text-cyan-400 text-sm border border-cyan-800/50">1</span>
                    Style & Theme
                </h2>
                <div className="space-y-8">
                    <StyleSelector />
                    <ThemeSelector />
                </div>
            </div>

            {selectedStyle === VisualizerStyle.CUSTOM && (
                 <CollapsibleSection title="Particle System Designer" icon={<GearIcon className="w-5 h-5"/>} defaultOpen={true}>
                    <CustomParticleControls />
                 </CollapsibleSection>
            )}

            <CollapsibleSection title="Fine Tuning" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>}>
                <TuningControls 
                    isFile={isFile}
                    audioData={rawAudioData}
                    audioSource={audioSource}
                />
            </CollapsibleSection>
            
            <CollapsibleSection title="Overlays & Export" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}>
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <TextOverlayControls settings={textSettings} dispatch={dispatch} />
                    <div className="lg:border-l lg:border-r border-gray-700 lg:px-8">
                        <MediaOverlayControls 
                            logoSettings={logoSettings}
                            backgroundSettings={backgroundSettings}
                            dispatch={dispatch}
                        />
                    </div>
                    <ExportPanel
                        settings={exportSettings}
                        isRecording={isRecording}
                        isProcessing={isProcessing}
                        isReady={!!analyser && !audioError}
                        error={recorderError}
                        dispatch={dispatch}
                        onStartRecording={handleStartRecording}
                        onStopRecording={handleStopRecording}
                        recordingDuration={recordingDuration}
                    />
                 </div>
            </CollapsibleSection>
        </div>

      </main>
    </div>
  );
};

export default App;
