
import React, { createContext, useReducer, useContext, Dispatch, useEffect } from 'react';
import { 
    Theme, VisualizerStyle, GeminiSuggestedSettings, SettingsAction, AppState, CustomParticleSettings
} from '../types';
import { THEMES, VISUALIZER_STYLES } from '../constants';

// Define Initial State
const initialTheme = THEMES[0];
const initialStyle = VISUALIZER_STYLES[0].id;

const initialCustomParticleSettings: CustomParticleSettings = {
  emissionStyle: 'burst',
  particleShape: 'circle',
  particleCount: 5,
  particleSpeed: 3,
  gravity: 0,
  wind: 0,
  size: 4,
  lifespan: 5,
  audioReactiveProperty: 'size',
  wavyMovement: false,
  coloring: 'mixed',
};

export const initialState: AppState = {
    selectedStyle: initialStyle,
    selectedTheme: initialTheme,
    themeCustomizations: {
        primaryColor: initialTheme.primaryColor,
        secondaryColor: initialTheme.secondaryColor,
        sensitivity: initialTheme.sensitivity,
        lineWidth: initialTheme.lineWidth,
        backgroundFade: initialTheme.backgroundFade,
        glowIntensity: initialTheme.glowIntensity,
    },
    visualizerTransformSettings: {
        positionX: 50,
        positionY: 50,
        scale: 1.0,
        rotation: 0,
    },
    textSettings: {
        content: 'Artist Name', color: '#FFFFFF', fontSize: 48, shadowBlur: 10, positionX: 50, positionY: 90, pulseOnBeat: false,
    },
    logoSettings: { url: null, size: 80, opacity: 1.0 },
    backgroundSettings: { url: null, opacity: 1.0, blur: 0 },
    exportSettings: { 
        resolution: '1920x1080', frameRate: 30, codec: 'vp9', format: 'webm', bitrate: 8 
    },
    postProcessingSettings: {
        bloom: { enabled: true, intensity: 5 },
        chromaticAberration: { enabled: false, intensity: 1 },
    },
    customParticleSettings: initialCustomParticleSettings,
};

// Create Reducer
function appReducer(state: AppState, action: SettingsAction): AppState {
    switch (action.type) {
        case 'SET_STYLE':
            return { ...state, selectedStyle: action.payload };
        case 'SET_THEME':
            return {
                ...state,
                selectedTheme: action.payload,
                themeCustomizations: {
                    primaryColor: action.payload.primaryColor,
                    secondaryColor: action.payload.secondaryColor,
                    sensitivity: action.payload.sensitivity,
                    lineWidth: action.payload.lineWidth,
                    backgroundFade: action.payload.backgroundFade,
                    glowIntensity: action.payload.glowIntensity,
                },
            };
        case 'UPDATE_THEME_CUSTOMIZATIONS':
            return { ...state, themeCustomizations: { ...state.themeCustomizations, ...action.payload } };
        case 'UPDATE_VISUALIZER_TRANSFORM_SETTINGS':
            return { ...state, visualizerTransformSettings: { ...state.visualizerTransformSettings, ...action.payload } };
        case 'UPDATE_TEXT_SETTINGS':
            return { ...state, textSettings: { ...state.textSettings, ...action.payload } };
        case 'UPDATE_LOGO_SETTINGS':
            return { ...state, logoSettings: { ...state.logoSettings, ...action.payload } };
        case 'UPDATE_BACKGROUND_SETTINGS':
            return { ...state, backgroundSettings: { ...state.backgroundSettings, ...action.payload } };
        case 'UPDATE_EXPORT_SETTINGS':
            return { ...state, exportSettings: { ...state.exportSettings, ...action.payload } };
        case 'UPDATE_POST_PROCESSING_SETTINGS':
            return { ...state, postProcessingSettings: { ...state.postProcessingSettings, ...action.payload } };
        case 'APPLY_AI_SETTINGS':
            const styleExists = VISUALIZER_STYLES.some(s => s.id === action.payload.visualizerStyle);
            return {
                ...state,
                selectedStyle: styleExists ? action.payload.visualizerStyle : state.selectedStyle,
                themeCustomizations: {
                    primaryColor: action.payload.primaryColor,
                    secondaryColor: action.payload.secondaryColor,
                    sensitivity: Number(action.payload.sensitivity),
                    lineWidth: Number(action.payload.lineWidth),
                    backgroundFade: Number(action.payload.backgroundFade),
                    glowIntensity: Number(action.payload.glowIntensity),
                },
                textSettings: {
                    ...state.textSettings,
                    content: action.payload.textContent,
                }
            };
        case 'UPDATE_CUSTOM_PARTICLE_SETTINGS':
            return { ...state, customParticleSettings: { ...state.customParticleSettings, ...action.payload }};
        case 'RESET_STATE':
            return initialState;
        default:
            return state;
    }
}

// Persistence Logic
const STORAGE_KEY = 'audio_visualizer_settings_v1';

const loadState = (): AppState => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Deep merge with initial state to ensure new fields (like pulseOnBeat) are present if missing from storage
            return { 
                ...initialState, 
                ...parsed,
                textSettings: { ...initialState.textSettings, ...parsed.textSettings },
                postProcessingSettings: { ...initialState.postProcessingSettings, ...parsed.postProcessingSettings }
            };
        }
    } catch (e) {
        console.warn("Failed to load settings", e);
    }
    return initialState;
};

// Create Contexts
const AppStateContext = createContext<AppState>(initialState);
const AppDispatchContext = createContext<Dispatch<SettingsAction>>(() => null);

// Create Provider Component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, loadState());

    useEffect(() => {
        try {
            // Don't save raw audio data if it were in state, but state here is mostly settings.
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error("Failed to save settings", e);
        }
    }, [state]);

    return (
        <AppStateContext.Provider value={state}>
            <AppDispatchContext.Provider value={dispatch}>
                {children}
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    );
};

// Create custom hooks for easy access
export const useAppState = () => useContext(AppStateContext);
export const useAppDispatch = () => useContext(AppDispatchContext);
