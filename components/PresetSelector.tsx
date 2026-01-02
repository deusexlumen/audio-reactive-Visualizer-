import React from 'react';
import { VISUALIZER_STYLES } from '../constants';
import { VisualizerStyle } from '../types';
import { useAppState, useAppDispatch } from '../contexts/AppContext';

export const StyleSelector: React.FC = () => {
  const { selectedStyle } = useAppState();
  const dispatch = useAppDispatch();

  const onSelectStyle = (style: VisualizerStyle) => {
    dispatch({ type: 'SET_STYLE', payload: style });
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4">
      <h2 className="text-xl font-bold text-white mb-4">1. Choose Visualizer Style</h2>
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-4">
        {VISUALIZER_STYLES.map(styleInfo => {
          const isSelected = selectedStyle === styleInfo.id;
          const Icon = styleInfo.icon;
          return (
            <button
              key={styleInfo.id}
              onClick={() => onSelectStyle(styleInfo.id)}
              className={`flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-1 ${
                isSelected ? 'ring-2 ring-cyan-400 bg-gray-700' : 'hover:bg-gray-700'
              }`}
              aria-pressed={isSelected}
            >
              <Icon className="h-10 w-10 mb-2 text-gray-300" />
              <span className={`font-semibold text-sm ${isSelected ? 'text-cyan-400' : 'text-gray-400'}`}>{styleInfo.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};