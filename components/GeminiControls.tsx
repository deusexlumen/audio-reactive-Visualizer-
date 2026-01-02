import React, { useState } from 'react';
import { useGeminiAutoTune } from '../hooks/useGeminiAutoTune';
import { GeminiSuggestedSettings, VisualizerStyle } from '../types';
import { SparkleIcon } from './icons';

interface GeminiControlsProps {
    audioSource: File;
    audioData: ArrayBuffer | null;
    onSettingsGenerated: (settings: GeminiSuggestedSettings) => void;
    currentStyle: VisualizerStyle;
}

export const GeminiControls: React.FC<GeminiControlsProps> = ({ audioSource, audioData, onSettingsGenerated, currentStyle }) => {
    const [moodPrompt, setMoodPrompt] = useState('');
    const { generateSettings, isLoading, error } = useGeminiAutoTune();

    const handleGenerateClick = async () => {
        if (audioData) {
            const settings = await generateSettings(audioSource.name, audioData, audioSource.type, moodPrompt, currentStyle);
            if (settings) {
                onSettingsGenerated(settings);
            }
        } else {
            console.error("Audio data is not available for AI analysis.");
        }
    };
    
    const isReady = !!audioData;

    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-purple-400 flex items-center gap-2">
                <SparkleIcon className="w-5 h-5" />
                Auto-Setup with AI
            </h4>
            <p className="text-sm text-gray-400">
                Let our AI analyze the mood, genre, and energy of your audio. We'll suggest a complete visual setup—style, colors, and a background concept—to perfectly match your sound.
            </p>
            <div>
                 <label htmlFor="moodPrompt" className="block text-sm font-medium mb-1 text-gray-300">
                    Describe the Vibe (Optional)
                </label>
                <textarea
                    id="moodPrompt"
                    rows={2}
                    value={moodPrompt}
                    onChange={(e) => setMoodPrompt(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., '80s synthwave', 'calm and relaxing', 'energetic drum and bass'"
                />
            </div>
            {error && <p className="text-sm text-red-400 mb-2 font-medium">Error: {error}</p>}
            <button
                onClick={handleGenerateClick}
                disabled={isLoading || !isReady}
                className="w-full font-bold py-3 px-4 rounded-lg transition-colors text-white text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing & Creating...
                    </>
                ) : (
                    <>
                        <SparkleIcon className="w-6 h-6" />
                        {isReady ? 'Auto-Setup with AI' : 'Loading Audio...'}
                    </>
                )}
            </button>
        </div>
    );
};