
import React, { useRef } from 'react';
import { MicIcon, UploadCloudIcon } from './icons';
import { AudioSource } from '../types';

interface AudioSourceSelectorProps {
  onSourceSelect: (source: AudioSource) => void;
}

export const AudioSourceSelector: React.FC<AudioSourceSelectorProps> = ({ onSourceSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onSourceSelect(event.target.files[0]);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-4xl z-10">
        <div className="text-center mb-12">
            <h1 className="text-6xl md:text-7xl font-black mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 drop-shadow-lg">
                Visualizer
            </h1>
            <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
                Transform sound into light. Select your input source to begin the immersive experience.
            </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Microphone Option */}
            <button
              onClick={() => onSourceSelect('mic')}
              className="group relative flex flex-col items-center justify-center p-8 bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 hover:border-purple-500/50 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-purple-600/0 group-hover:from-purple-600/10 group-hover:to-transparent transition-all duration-500"></div>
              
              <div className="relative p-6 bg-gray-800/50 rounded-full mb-6 border border-white/5 group-hover:scale-110 group-hover:bg-purple-500/20 group-hover:border-purple-500/50 transition-all duration-300 shadow-2xl">
                <MicIcon className="h-10 w-10 text-gray-400 group-hover:text-purple-300 transition-colors" />
              </div>
              
              <h3 className="relative text-2xl font-bold text-gray-200 group-hover:text-white mb-2 transition-colors">Microphone</h3>
              <p className="relative text-sm text-gray-500 group-hover:text-gray-400 transition-colors">Real-time reactive visuals from your environment.</p>
            </button>
            
            {/* File Option */}
            <button
              onClick={handleFileClick}
              className="group relative flex flex-col items-center justify-center p-8 bg-gray-900/40 backdrop-blur-md rounded-2xl border border-white/5 hover:border-cyan-500/50 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/0 to-cyan-600/0 group-hover:from-cyan-600/10 group-hover:to-transparent transition-all duration-500"></div>

              <div className="relative p-6 bg-gray-800/50 rounded-full mb-6 border border-white/5 group-hover:scale-110 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/50 transition-all duration-300 shadow-2xl">
                <UploadCloudIcon className="h-10 w-10 text-gray-400 group-hover:text-cyan-300 transition-colors" />
              </div>
              
              <h3 className="relative text-2xl font-bold text-gray-200 group-hover:text-white mb-2 transition-colors">Upload Audio</h3>
              <p className="relative text-sm text-gray-500 group-hover:text-gray-400 transition-colors">Visualize MP3, WAV, or OGG files from your device.</p>
            </button>

            <input
              type="file"
              accept="audio/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

           <div className="mt-12 text-center text-xs text-gray-600 font-medium">
             <span className="inline-block px-3 py-1 rounded-full bg-gray-900 border border-gray-800">Powered by Gemini & React</span>
          </div>
      </div>
    </div>
  );
};
