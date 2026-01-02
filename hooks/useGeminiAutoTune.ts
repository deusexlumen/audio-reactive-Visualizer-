import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiSuggestedSettings, VisualizerStyle } from '../types';
import { VISUALIZER_STYLES } from '../constants';

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

export const useGeminiAutoTune = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const generateSettings = useCallback(async (
    filename: string,
    audioData: ArrayBuffer,
    audioMimeType: string,
    userPrompt: string,
    currentStyle: VisualizerStyle | null
  ): Promise<GeminiSuggestedSettings | null> => {
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

      const styleNames = VISUALIZER_STYLES.map(s => s.id).join(', ');
      
      const userHint = userPrompt
        ? `The user has provided an additional hint for the desired vibe: "${userPrompt}". Please take this into high consideration.`
        : `The user has not provided any specific hints, so please rely on your analysis of the audio and filename.`;
        
      const avoidStyleHint = currentStyle
        ? `IMPORTANT: The user is currently using the "${currentStyle}" visualizer style. To provide variety, you MUST suggest a DIFFERENT style.`
        : '';

      const prompt = `You are an expert audio-visual artist and DJ creating a visualizer for a piece of audio. Based on THIS AUDIO CLIP, determine its genre, mood, and energy. The filename is "${filename}", which might also contain useful clues.
${userHint}
${avoidStyleHint}
Then, suggest the best visualizer settings to match it. Also, create a detailed, artistic prompt for an image generation model (like Imagen) to create a background that fits the audio's theme.

The available visualizer styles are: ${styleNames}.

Choose one style, two complementary hex colors (primary and secondary), and tune the other parameters to create a stunning visual experience. Also, suggest a creative title for the track, perhaps extracting artist/title from the filename or creating a mood-based one. Provide your answer in a JSON object that strictly follows the provided schema. Ensure all numeric values are within their specified ranges.`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          visualizerStyle: { type: Type.STRING, enum: Object.values(VisualizerStyle), description: "The ID of the visualizer style." },
          primaryColor: { type: Type.STRING, description: "A hex color code for the primary color, e.g., #FF00FF" },
          secondaryColor: { type: Type.STRING, description: "A hex color code for the secondary color, e.g., #00FFFF" },
          sensitivity: { type: Type.NUMBER, description: "A value between 0.1 and 3.0 for audio sensitivity." },
          lineWidth: { type: Type.NUMBER, description: "A value between 1.0 and 10.0 for line thickness." },
          backgroundFade: { type: Type.NUMBER, description: "A value between 0.05 and 0.5 for the trail effect strength." },
          glowIntensity: { type: Type.NUMBER, description: "A value between 0 and 20 for the glow effect." },
          textContent: { type: Type.STRING, description: "A creative title for the visual, like 'Artist - Song Title' or a mood descriptor." },
          suggestedImagePrompt: { type: Type.STRING, description: "A creative and descriptive prompt for an image generation model, based on the audio's mood. e.g. 'A tranquil synthwave landscape at dusk, with a retro sun setting over a digital ocean. digital art, vibrant colors, 80s aesthetic.'" }
        },
        required: ["visualizerStyle", "primaryColor", "secondaryColor", "sensitivity", "lineWidth", "backgroundFade", "glowIntensity", "textContent", "suggestedImagePrompt"]
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: prompt }, audioPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const jsonString = response.text.trim();
      const parsedSettings = JSON.parse(jsonString);
      
      return parsedSettings as GeminiSuggestedSettings;

    } catch (e: any) {
      console.error("Error generating settings with Gemini:", e);
      if (isMounted.current) {
        setError(e.message || "Failed to generate AI settings. Please try again.");
      }
      return null;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  return { generateSettings, isLoading, error };
};