import React, { useState, useEffect } from 'react';
import { useImageGenerator } from '../hooks/useImageGenerator';
import { ImageIcon, SparkleIcon } from './icons';
import { useAppDispatch } from '../contexts/AppContext';

interface ImageGenerationControlsProps {
    suggestedPrompt: string;
}

export const ImageGenerationControls: React.FC<ImageGenerationControlsProps> = ({ suggestedPrompt }) => {
    const [prompt, setPrompt] = useState(suggestedPrompt);
    const { generateImage, isLoading, error, imageData } = useImageGenerator();
    const dispatch = useAppDispatch();
    
    useEffect(() => {
        // Update prompt when a new suggestion comes in from the auto-tuner
        if (suggestedPrompt) {
            setPrompt(suggestedPrompt);
        }
    }, [suggestedPrompt]);

    const handleGenerateClick = () => {
        generateImage(prompt);
    };

    const handleApplyBackground = (imageUrl: string) => {
        dispatch({ type: 'UPDATE_BACKGROUND_SETTINGS', payload: { url: imageUrl } });
    };

    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-pink-400 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Generate Background
            </h4>
            <div>
                <label htmlFor="imagePrompt" className="block text-sm font-medium mb-1">
                    AI-Suggested Prompt
                </label>
                <textarea
                    id="imagePrompt"
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-pink-500 focus:border-pink-500"
                    placeholder="Describe the background you want to create..."
                />
            </div>
            {error && <p className="text-sm text-red-400 font-medium">Error: {error}</p>}
            <button
                onClick={handleGenerateClick}
                disabled={isLoading || !prompt}
                className="w-full font-bold py-2 px-4 rounded-lg transition-colors text-white bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w-3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Generating...
                    </>
                ) : (
                    <>
                        <SparkleIcon className="w-5 h-5" />
                        Generate with Imagen
                    </>
                )}
            </button>
            {imageData && (
                <div className="mt-4 p-2 border-2 border-dashed border-gray-600 rounded-lg">
                    <img src={imageData} alt="AI generated background" className="w-full rounded" />
                    <button
                        onClick={() => handleApplyBackground(imageData)}
                        className="w-full mt-2 font-bold py-2 px-4 rounded-lg transition-colors text-white bg-green-600 hover:bg-green-700"
                    >
                        Apply as Background
                    </button>
                </div>
            )}
        </div>
    );
};