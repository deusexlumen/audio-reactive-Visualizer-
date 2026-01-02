
import React from 'react';

// FIX: Added AudioSource type to be shared across the application.
export type AudioSource = 'mic' | File;

export enum VisualizerStyle {
  BARS = 'BARS',
  CIRCLE = 'CIRCLE',
  WAVE = 'WAVE',
  NEON_TUNNEL = 'NEON_TUNNEL',
  PARTICLES = 'PARTICLES',
  GRID = 'GRID',
  RADIAL_BARS = 'RADIAL_BARS',
  FLOWER = 'FLOWER',
  SPIRAL = 'SPIRAL',
  COSMIC_PULSE = 'COSMIC_PULSE',
  RETRO_SUN = 'RETRO_SUN',
  EQUALIZER = 'EQUALIZER',
  SPIRO = 'SPIRO',
  RAIN = 'RAIN',
  AURORA = 'AURORA',
  STARFIELD = 'STARFIELD',
  KALEIDOSCOPE = 'KALEIDOSCOPE',
  BLOB = 'BLOB',
  CUBIC = 'CUBIC',
  VORTEX = 'VORTEX',
  STRING_THEORY = 'STRING_THEORY',
  GALAXY = 'GALAXY',
  PLASMA = 'PLASMA',
  METROPOLIS = 'METROPOLIS',
  DNA_HELIX = 'DNA_HELIX',
  SUNBURST = 'SUNBURST',
  GLITCH = 'GLITCH',
  CUSTOM = 'CUSTOM',
}

// Represents the aesthetic properties (color, effects) that can be applied to any style.
export interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  sensitivity: number;
  lineWidth: number;
  backgroundFade: number;
  glowIntensity: number;
}

// Represents the core visualizer structure/algorithm.
export interface VisualizerStyleInfo {
  id: VisualizerStyle;
  name: string;
  icon: React.FC<{ className?: string }>;
}

// Represents the customizable properties of a theme.
export type ThemeCustomizations = Omit<Theme, 'id' | 'name'>;

// Represents settings for the text overlay.
export interface TextSettings {
  content: string;
  color: string;
  fontSize: number;
  shadowBlur: number;
  positionX: number;
  positionY: number;
  pulseOnBeat: boolean;
}

// Represents settings for the logo overlay.
export interface LogoSettings {
  url: string | null;
  size: number;
  opacity: number;
}

// Represents settings for the background image.
export interface BackgroundSettings {
  url: string | null;
  opacity: number;
  blur: number;
}

// Represents settings for video export.
export interface ExportSettings {
  resolution: string;
  frameRate: number;
  codec: 'vp9' | 'vp8' | 'h264' | 'av1';
  format: 'webm' | 'mp4';
  bitrate: number; // in Mbps
}

// Represents the settings object returned by the Gemini AI for a full setup.
export interface GeminiSuggestedSettings {
  visualizerStyle: VisualizerStyle;
  primaryColor: string;
  secondaryColor: string;
  sensitivity: number;
  lineWidth: number;
  backgroundFade: number;
  glowIntensity: number;
  textContent: string;
  suggestedImagePrompt: string;
}

// Represents the refined settings object returned by the Gemini AI for parameter tuning.
export interface GeminiRefinedSettings {
  sensitivity: number;
  lineWidth: number;
  backgroundFade: number;
  glowIntensity: number;
}


// Represents settings for post-processing effects.
export interface PostProcessingSettings {
  bloom: {
    enabled: boolean;
    intensity: number; // 0-20
  };
  chromaticAberration: {
    enabled: boolean;
    intensity: number; // 0-10
  };
}

// Represents the settings for the visualizer's position, scale, and rotation.
export interface VisualizerTransformSettings {
  positionX: number; // 0-100, where 50 is center
  positionY: number; // 0-100, where 50 is center
  scale: number;     // 0.1-2.0, where 1 is default
  rotation: number;  // -180 to 180, where 0 is default
}

export interface CustomParticleSettings {
  emissionStyle: 'burst' | 'fountain' | 'rain';
  particleShape: 'circle' | 'square' | 'line' | 'star';
  particleCount: number; // 1-10
  particleSpeed: number; // 1-10
  gravity: number; // -5 to 5
  wind: number; // -5 to 5
  size: number; // 1-10
  lifespan: number; // 1-10 (represents relative duration)
  audioReactiveProperty: 'none' | 'size' | 'speed';
  wavyMovement: boolean;
  coloring: 'primary' | 'secondary' | 'mixed';
}

// Represents the processed and smoothed audio data for rendering.
export interface SmoothedAudioData {
    rawData: Uint8Array;
    smoothedData: Float32Array;
    bass: number; // 0-1 normalized
    mid: number; // 0-1 normalized
    treble: number; // 0-1 normalized
    energy: number; // 0-1 normalized
}


// New types for context and reducer
export type SettingsAction =
    | { type: 'SET_STYLE'; payload: VisualizerStyle }
    | { type: 'SET_THEME'; payload: Theme }
    | { type: 'UPDATE_THEME_CUSTOMIZATIONS'; payload: Partial<ThemeCustomizations> }
    | { type: 'UPDATE_VISUALIZER_TRANSFORM_SETTINGS'; payload: Partial<VisualizerTransformSettings> }
    | { type: 'UPDATE_TEXT_SETTINGS'; payload: Partial<TextSettings> }
    | { type: 'UPDATE_LOGO_SETTINGS'; payload: Partial<LogoSettings> }
    | { type: 'UPDATE_BACKGROUND_SETTINGS'; payload: Partial<BackgroundSettings> }
    | { type: 'UPDATE_EXPORT_SETTINGS'; payload: Partial<ExportSettings> }
    | { type: 'UPDATE_POST_PROCESSING_SETTINGS'; payload: Partial<PostProcessingSettings> }
    | { type: 'APPLY_AI_SETTINGS'; payload: GeminiSuggestedSettings }
    | { type: 'UPDATE_CUSTOM_PARTICLE_SETTINGS'; payload: Partial<CustomParticleSettings> }
    | { type: 'RESET_STATE' };

export interface AppState {
    selectedStyle: VisualizerStyle;
    selectedTheme: Theme;
    themeCustomizations: ThemeCustomizations;
    visualizerTransformSettings: VisualizerTransformSettings;
    textSettings: TextSettings;
    logoSettings: LogoSettings;
    backgroundSettings: BackgroundSettings;
    exportSettings: ExportSettings;
    postProcessingSettings: PostProcessingSettings;
    customParticleSettings: CustomParticleSettings;
}
