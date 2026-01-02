import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

export const useImageGenerator = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageData, setImageData] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const generateImage = useCallback(async (prompt: string): Promise<string | null> => {
        setIsLoading(true);
        setError(null);
        setImageData(null);

        if (!prompt) {
            setError("Prompt cannot be empty.");
            setIsLoading(false);
            return null;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/png', // Use PNG for better quality and transparency support
                    aspectRatio: '16:9', // Match the visualizer aspect ratio
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                if (isMounted.current) {
                    setImageData(imageUrl);
                }
                return imageUrl;
            } else {
                throw new Error("The API did not return any images.");
            }

        } catch (e: any) {
            console.error("Error generating image with Imagen:", e);
            if (isMounted.current) {
                setError(e.message || "Failed to generate image. Please check your prompt and try again.");
            }
            return null;
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, []);

    return { generateImage, isLoading, error, imageData };
};