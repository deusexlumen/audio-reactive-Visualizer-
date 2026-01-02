import React from 'react';
import { THEMES } from '../constants';
import { Theme } from '../types';
import { useAppState, useAppDispatch } from '../contexts/AppContext';

export const ThemeSelector: React.FC = () => {
  const { selectedTheme } = useAppState();
  const dispatch = useAppDispatch();

  const onSelectTheme = (theme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4">
      <h2 className="text-xl font-bold text-white mb-4">2. Choose a Theme</h2>
      <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4">
        {THEMES.map(theme => {
          const isSelected = selectedTheme.id === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => onSelectTheme(theme)}
              className={`flex-shrink-0 w-40 p-4 bg-gray-800 rounded-lg shadow-md transition-all duration-200 text-left transform hover:-translate-y-1 ${
                isSelected ? 'ring-2 ring-purple-400' : 'hover:bg-gray-700'
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex space-x-2 mb-2">
                <div className="w-1/2 h-8 rounded" style={{ backgroundColor: theme.primaryColor }}></div>
                <div className="w-1/2 h-8 rounded" style={{ backgroundColor: theme.secondaryColor }}></div>
              </div>
              <span className={`font-semibold text-sm ${isSelected ? 'text-purple-400' : 'text-gray-300'}`}>{theme.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};