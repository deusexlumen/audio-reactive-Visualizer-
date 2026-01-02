
import { useRef, useEffect } from 'react';
import { SmoothedAudioData } from '../types';

const SMOOTHING_FACTOR = 0.1; // Lower is smoother

export const useSmoothedAudioData = (analyser: AnalyserNode | null) => {
    // Use a ref instead of state to avoid triggering re-renders 60fps
    const audioDataRef = useRef<SmoothedAudioData | null>(null);
    const animationFrameId = useRef<number>(0);
    const smoothedDataRef = useRef<Float32Array | null>(null);
    
    // Persist smoothing values across frames
    const smoothedEnergyRef = useRef<number>(0);
    const smoothedBassRef = useRef<number>(0);
    const smoothedMidRef = useRef<number>(0);
    const smoothedTrebleRef = useRef<number>(0);

    useEffect(() => {
        if (!analyser) {
            cancelAnimationFrame(animationFrameId.current);
            audioDataRef.current = null;
            return;
        }

        const bufferLength = analyser.frequencyBinCount;
        const rawData = new Uint8Array(bufferLength);
        
        // Initialize the Float32Array only once or if buffer size changes
        if (!smoothedDataRef.current || smoothedDataRef.current.length !== bufferLength) {
            smoothedDataRef.current = new Float32Array(bufferLength);
        }
        const smoothedData = smoothedDataRef.current;

        const render = () => {
            if (!analyser) return; // Safety check

            analyser.getByteFrequencyData(rawData);

            let totalEnergy = 0;
            let bassEnergy = 0;
            let midEnergy = 0;
            let trebleEnergy = 0;

            const bassEnd = Math.floor(bufferLength * 0.15); // ~0-15% of frequencies
            const midEnd = Math.floor(bufferLength * 0.5); // ~15-50%
            
            for (let i = 0; i < bufferLength; i++) {
                const value = rawData[i];
                // Apply smoothing to each frequency bin
                smoothedData[i] += (value - smoothedData[i]) * SMOOTHING_FACTOR;
                
                totalEnergy += value;

                if (i <= bassEnd) {
                    bassEnergy += value;
                } else if (i <= midEnd) {
                    midEnergy += value;
                } else {
                    trebleEnergy += value;
                }
            }

            const BASS_SAMPLES = bassEnd + 1;
            const MID_SAMPLES = midEnd - bassEnd;
            const TREBLE_SAMPLES = bufferLength - midEnd;

            // Calculate current frame's normalized values
            const currentEnergy = totalEnergy / (bufferLength * 255);
            const currentBass = bassEnergy / (BASS_SAMPLES * 255);
            const currentMid = midEnergy / (MID_SAMPLES * 255);
            const currentTreble = trebleEnergy / (TREBLE_SAMPLES * 255);

            // Smooth the aggregate values
            smoothedEnergyRef.current += (currentEnergy - smoothedEnergyRef.current) * SMOOTHING_FACTOR;
            smoothedBassRef.current += (currentBass - smoothedBassRef.current) * SMOOTHING_FACTOR;
            smoothedMidRef.current += (currentMid - smoothedMidRef.current) * SMOOTHING_FACTOR;
            smoothedTrebleRef.current += (currentTreble - smoothedTrebleRef.current) * SMOOTHING_FACTOR;

            // Update the ref directly
            audioDataRef.current = {
                rawData: rawData, // Note: this reference points to the same array instance, which is fine for internal loop consumption
                smoothedData: smoothedData,
                bass: smoothedBassRef.current,
                mid: smoothedMidRef.current,
                treble: smoothedTrebleRef.current,
                energy: smoothedEnergyRef.current,
            };

            animationFrameId.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId.current);
        };
    }, [analyser]);

    return audioDataRef;
};
