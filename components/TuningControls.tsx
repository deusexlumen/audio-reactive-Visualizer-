
import React, { useState } from 'react';
import { ThemeCustomizations, PostProcessingSettings, VisualizerStyle, AudioSource, VisualizerTransformSettings } from '../types';
import { SparkleIcon } from './icons';
import { useGeminiRefine } from '../hooks/useGeminiRefine';
import { useAppState, useAppDispatch } from '../contexts/AppContext';

const PostProcessingControls: React.FC = () => {
  const { postProcessingSettings: settings } = useAppState();
  const dispatch = useAppDispatch();

  const handleToggle = (effect: keyof PostProcessingSettings) => {
    dispatch({
      type: 'UPDATE_POST_PROCESSING_SETTINGS',
      payload: { [effect]: { ...settings[effect], enabled: !settings[effect].enabled } }
    });
  };

  const handleIntensityChange = (effect: keyof PostProcessingSettings, value: number) => {
    dispatch({
      type: 'UPDATE_POST_PROCESSING_SETTINGS',
      payload: { [effect]: { ...settings[effect], intensity: value } }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t border-gray-700">
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label htmlFor="bloomEnabled" className="text-sm font-medium">Bloom Effect</label>
                <button
                    id="bloomEnabled"
                    onClick={() => handleToggle('bloom')}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${settings.bloom.enabled ? 'bg-purple-600' : 'bg-gray-600'}`}
                    aria-pressed={settings.bloom.enabled}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.bloom.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
            <div className={`flex items-center gap-3 ${!settings.bloom.enabled && 'opacity-50'}`}>
                <label htmlFor="bloomIntensity" className="text-sm font-medium w-20">Intensity</label>
                <input id="bloomIntensity" type="range" min="0" max="20" step="1" value={settings.bloom.intensity} 
                       onChange={(e) => handleIntensityChange('bloom', parseInt(e.target.value, 10))} 
                       className="w-full" disabled={!settings.bloom.enabled} />
                <span className="text-xs w-8 text-right">{settings.bloom.intensity}</span>
            </div>
        </div>
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label htmlFor="caEnabled" className="text-sm font-medium">Chromatic Aberration</label>
                <button
                    id="caEnabled"
                    onClick={() => handleToggle('chromaticAberration')}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${settings.chromaticAberration.enabled ? 'bg-purple-600' : 'bg-gray-600'}`}
                    aria-pressed={settings.chromaticAberration.enabled}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.chromaticAberration.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
            <div className={`flex items-center gap-3 ${!settings.chromaticAberration.enabled && 'opacity-50'}`}>
                <label htmlFor="caIntensity" className="text-sm font-medium w-20">Intensity</label>
                <input id="caIntensity" type="range" min="0" max="10" step="0.5" value={settings.chromaticAberration.intensity} 
                       onChange={(e) => handleIntensityChange('chromaticAberration', parseFloat(e.target.value))} 
                       className="w-full" disabled={!settings.chromaticAberration.enabled}/>
                <span className="text-xs w-8 text-right">{settings.chromaticAberration.intensity.toFixed(1)}</span>
            </div>
        </div>
    </div>
  );
};

const VisualizerTransformControls: React.FC = () => {
    const { visualizerTransformSettings: settings } = useAppState();
    const dispatch = useAppDispatch();

    const handleValueChange = (key: keyof VisualizerTransformSettings, value: number) => {
        dispatch({ type: 'UPDATE_VISUALIZER_TRANSFORM_SETTINGS', payload: { [key]: value } });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 pt-4 border-t border-gray-700">
            <div className="flex items-center gap-3">
                <label htmlFor="positionX" className="text-sm font-medium w-20">Position X</label>
                <input id="positionX" type="range" min="0" max="100" step="0.5" value={settings.positionX} onChange={(e) => handleValueChange('positionX', parseFloat(e.target.value))} className="w-full" aria-label="Position X slider" />
                <span className="text-xs w-8 text-right">{settings.positionX.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-3">
                <label htmlFor="positionY" className="text-sm font-medium w-20">Position Y</label>
                <input id="positionY" type="range" min="0" max="100" step="0.5" value={settings.positionY} onChange={(e) => handleValueChange('positionY', parseFloat(e.target.value))} className="w-full" aria-label="Position Y slider" />
                <span className="text-xs w-8 text-right">{settings.positionY.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-3">
                <label htmlFor="scale" className="text-sm font-medium w-20">Scale</label>
                <input id="scale" type="range" min="0.1" max="2.0" step="0.05" value={settings.scale} onChange={(e) => handleValueChange('scale', parseFloat(e.target.value))} className="w-full" aria-label="Scale slider" />
                <span className="text-xs w-8 text-right">{settings.scale.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-3">
                <label htmlFor="rotation" className="text-sm font-medium w-20">Rotation</label>
                <input id="rotation" type="range" min="-180" max="180" step="5" value={settings.rotation} onChange={(e) => handleValueChange('rotation', parseInt(e.target.value, 10))} className="w-full" aria-label="Rotation slider" />
                <span className="text-xs w-8 text-right">{settings.rotation}°</span>
            </div>
        </div>
    );
};

interface TuningControlsProps {
    isFile: boolean;
    audioData: ArrayBuffer | null;
    audioSource: AudioSource | null;
}

export const TuningControls: React.FC<TuningControlsProps> = ({ isFile, audioData, audioSource }) => {
    const { themeCustomizations, selectedStyle } = useAppState();
    const dispatch = useAppDispatch();
    const [refinePrompt, setRefinePrompt] = useState('');
    const { refineSettings, isLoading, error } = useGeminiRefine();

    const handleRefineClick = async () => {
        if (isFile && audioData && audioSource instanceof File) {
            const refined = await refineSettings(audioData, audioSource.type, themeCustomizations, selectedStyle, refinePrompt);
            if (refined) {
                dispatch({ type: 'UPDATE_THEME_CUSTOMIZATIONS', payload: refined });
            }
        }
    };

    const handleSliderChange = (key: keyof ThemeCustomizations, value: number) => {
         dispatch({ type: 'UPDATE_THEME_CUSTOMIZATIONS', payload: { [key]: value } });
    };

    return (
        <div className="p-6 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">3. Tune Parameters</h3>
            
            {isFile && (
                <div className="mb-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-grow w-full">
                             <label htmlFor="refinePrompt" className="block text-sm font-medium mb-1 text-gray-300 flex items-center gap-2">
                                <SparkleIcon className="w-4 h-4 text-purple-400" />
                                Refine with AI
                            </label>
                            <input
                                type="text"
                                id="refinePrompt"
                                value={refinePrompt}
                                onChange={(e) => setRefinePrompt(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:ring-purple-500 focus:border-purple-500"
                                placeholder="e.g., 'Make it more reactive', 'Less glow'"
                            />
                        </div>
                        <button
                            onClick={handleRefineClick}
                            disabled={isLoading || !audioData}
                            className="w-full md:w-auto font-bold py-2 px-4 rounded-lg transition-colors text-white text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap h-[38px]"
                        >
                            {isLoading ? 'Refining...' : 'Auto-Tune'}
                        </button>
                    </div>
                    {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="sensitivity" className="block text-sm font-medium mb-1">Sensitivity: {themeCustomizations.sensitivity.toFixed(1)}</label>
                        <input id="sensitivity" type="range" min="0.1" max="3.0" step="0.1" value={themeCustomizations.sensitivity} onChange={(e) => handleSliderChange('sensitivity', parseFloat(e.target.value))} className="w-full" />
                    </div>
                     <div>
                        <label htmlFor="lineWidth" className="block text-sm font-medium mb-1">Line Width: {themeCustomizations.lineWidth.toFixed(1)}</label>
                        <input id="lineWidth" type="range" min="0.5" max="10.0" step="0.5" value={themeCustomizations.lineWidth} onChange={(e) => handleSliderChange('lineWidth', parseFloat(e.target.value))} className="w-full" />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="backgroundFade" className="block text-sm font-medium mb-1">Trail Effect: {themeCustomizations.backgroundFade.toFixed(2)}</label>
                        <input id="backgroundFade" type="range" min="0.01" max="0.5" step="0.01" value={themeCustomizations.backgroundFade} onChange={(e) => handleSliderChange('backgroundFade', parseFloat(e.target.value))} className="w-full" />
                        <p className="text-xs text-gray-500 mt-1">Lower values create longer trails.</p>
                    </div>
                     <div>
                        <label htmlFor="glowIntensity" className="block text-sm font-medium mb-1">Glow Intensity: {themeCustomizations.glowIntensity}</label>
                        <input id="glowIntensity" type="range" min="0" max="50" step="1" value={themeCustomizations.glowIntensity} onChange={(e) => handleSliderChange('glowIntensity', parseFloat(e.target.value))} className="w-full" />
                    </div>
                 </div>
            </div>
            
            <VisualizerTransformControls />
            <PostProcessingControls />
        </div>
    );
};
