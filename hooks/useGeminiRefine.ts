
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiRefinedSettings, ThemeCustomizations, VisualizerStyle } from '../types';

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export const useGeminiRefine = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refineSettings = useCallback(async (
    audioData: ArrayBuffer,
    audioMimeType: string,
    currentSettings: ThemeCustomizations,
    currentStyle: VisualizerStyle,
    userPrompt: string
  ): Promise<GeminiRefinedSettings | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const audioPart = {
        inlineData: {
          mimeType: audioMimeType,
          data: arrayBufferToBase64(audioData),
        },
      };

      const userHint = userPrompt 
        ? `The user has provided a hint for the refinement: "${userPrompt}".`
        : '';

      const prompt = `You are an expert audio-visual artist. Your task is to refine the settings of an existing audio visualizer based on the provided audio clip.
Analyze the audio's dynamics (bass, treble, rhythm, energy).
The current visualizer style is "${currentStyle}".
The current settings are:
- Sensitivity: ${currentSettings.sensitivity}
- Line Width: ${currentSettings.lineWidth}
- Trail Effect (backgroundFade): ${currentSettings.backgroundFade}
- Glow Intensity: ${currentSettings.glowIntensity}

${userHint}

Based on your analysis, make small, subtle adjustments to these four parameters to better match the audio. For example, for a high-energy track, you might slightly increase sensitivity. For a soft, ambient track, you might increase the trail effect. The changes should be incremental, not drastic. Do NOT change the colors.
Provide your answer as a JSON object that strictly follows the provided schema. Ensure all numeric values are within their specified ranges.`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          sensitivity: { type: Type.NUMBER, description: "A value between 0.1 and 3.0." },
          lineWidth: { type: Type.NUMBER, description: "A value between 1.0 and 10.0." },
          backgroundFade: { type: Type.NUMBER, description: "A value between 0.05 and 0.5." },
          glowIntensity: { type: Type.NUMBER, description: "A value between 0 and 20." },
        },
        required: ["sensitivity", "lineWidth", "backgroundFade", "glowIntensity"]
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, audioPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const jsonString = response.text.trim();
      const parsedSettings = JSON.parse(jsonString);
      
      return parsedSettings as GeminiRefinedSettings;

    } catch (e: any) {
      console.error("Error refining settings with Gemini:", e);
      if (isMounted.current) {
        setError(e.message || "Failed to refine AI settings. Please try again.");
      }
      return null;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  return { refineSettings, isLoading, error };
};
