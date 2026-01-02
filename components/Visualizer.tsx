
import React, { useRef, useEffect, useState, memo } from 'react';
import { VisualizerStyle, ThemeCustomizations, TextSettings, LogoSettings, BackgroundSettings, PostProcessingSettings, VisualizerTransformSettings, CustomParticleSettings, SmoothedAudioData } from '../types';

interface VisualizerProps {
  // Changed: Accepts a Ref instead of data directly to decouple render loops
  audioDataRef: React.MutableRefObject<SmoothedAudioData | null>;
  style: VisualizerStyle;
  theme: ThemeCustomizations;
  transform: VisualizerTransformSettings;
  text: TextSettings;
  logo: LogoSettings;
  background: BackgroundSettings;
  postProcessing: PostProcessingSettings;
  customParticleSettings: CustomParticleSettings;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
  width: number;
  height: number;
}

type DrawOptions = ThemeCustomizations & { 
    customParticleSettings: CustomParticleSettings;
};

type DrawState = {
  // Common state
  particles?: any[];
  // Style-specific state
  stars?: { x: number, y: number, z: number, pz: number, brightness: number }[];
  bands?: any[];
  peaks?: number[];
  splashes?: { x: number, y: number, radius: number, life: number, maxRadius: number }[];
  smoothedData?: number[];
};

const drawFunctions: { [key in VisualizerStyle]: (ctx: CanvasRenderingContext2D, audio: SmoothedAudioData, width: number, height: number, frame: number, options: DrawOptions, state: DrawState) => void } = {
  [VisualizerStyle.CUSTOM]: (ctx, audio, width, height, frame, options, state) => {
    const settings = options.customParticleSettings;
    const { primaryColor, secondaryColor, sensitivity } = options;
    const { bass } = audio;

    if (!state.particles) {
        state.particles = [];
    }
    const particles = state.particles;

    const bassNormalized = bass;

    const particlesToAdd = (bassNormalized > 0.5 ? bassNormalized * settings.particleCount : settings.particleCount / 5) * sensitivity;

    for (let i = 0; i < particlesToAdd; i++) {
        if (particles.length < 500) {
            
            const reactSpeed = settings.audioReactiveProperty === 'speed' ? 1 + bassNormalized * 2 : 1;
            const reactSize = settings.audioReactiveProperty === 'size' ? bassNormalized * 10 : 0;

            let p: any = {
                life: 1.0,
                initialLife: settings.lifespan / 2 + Math.random() * (settings.lifespan / 2),
                size: Math.max(1, settings.size + reactSize),
                wavyPhase: Math.random() * Math.PI * 2,
            };

            switch (settings.emissionStyle) {
                case 'burst':
                    const angle = Math.random() * Math.PI * 2;
                    p.x = width / 2;
                    p.y = height / 2;
                    p.vx = Math.cos(angle) * (Math.random() * settings.particleSpeed * reactSpeed);
                    p.vy = Math.sin(angle) * (Math.random() * settings.particleSpeed * reactSpeed);
                    break;
                case 'fountain':
                    p.x = width / 2 + (Math.random() - 0.5) * 50;
                    p.y = height;
                    p.vx = (Math.random() - 0.5) * 4;
                    p.vy = -Math.random() * settings.particleSpeed * 2 * reactSpeed;
                    break;
                case 'rain':
                    p.x = Math.random() * width;
                    p.y = 0;
                    p.vx = (Math.random() - 0.5);
                    p.vy = Math.random() * settings.particleSpeed * reactSpeed;
                    break;
            }
            particles.push(p);
        }
    }

    ctx.lineWidth = 2;

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Apply physics
        p.vy += settings.gravity * 0.05;
        p.vx += settings.wind * 0.05;
        
        if (settings.wavyMovement) {
            p.vx += Math.sin(frame * 0.1 + p.wavyPhase) * 0.1;
        }
        
        p.x += p.vx;
        p.y += p.vy;

        p.life -= 1 / (p.initialLife * 30);

        if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
            particles.splice(i, 1);
            continue;
        }

        ctx.globalAlpha = p.life;
        
        switch (settings.coloring) {
            case 'primary': ctx.fillStyle = primaryColor; ctx.strokeStyle = primaryColor; break;
            case 'secondary': ctx.fillStyle = secondaryColor; ctx.strokeStyle = secondaryColor; break;
            case 'mixed':
                const t = (1 - p.life);
                const r1 = parseInt(primaryColor.slice(1,3), 16), g1 = parseInt(primaryColor.slice(3,5), 16), b1 = parseInt(primaryColor.slice(5,7), 16);
                const r2 = parseInt(secondaryColor.slice(1,3), 16), g2 = parseInt(secondaryColor.slice(3,5), 16), b2 = parseInt(secondaryColor.slice(5,7), 16);
                const r = Math.round(r1 + (r2 - r1) * t);
                const g = Math.round(g1 + (g2 - g1) * t);
                const b = Math.round(b1 + (b2 - b1) * t);
                const color = `rgb(${r},${g},${b})`;
                ctx.fillStyle = color;
                ctx.strokeStyle = color;
                break;
        }

        switch (settings.particleShape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'square':
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
                break;
            case 'line':
                const angle = Math.atan2(p.vy, p.vx);
                ctx.beginPath();
                ctx.moveTo(p.x - Math.cos(angle) * p.size, p.y - Math.sin(angle) * p.size);
                ctx.lineTo(p.x + Math.cos(angle) * p.size, p.y + Math.sin(angle) * p.size);
                ctx.stroke();
                break;
            case 'star':
                const spikes = 5;
                const outerRadius = p.size;
                const innerRadius = p.size / 2;
                let rot = Math.PI / 2 * 3;
                let x = p.x;
                let y = p.y;
                let step = Math.PI / spikes;

                ctx.beginPath();
                ctx.moveTo(p.x, p.y - outerRadius)
                for (let j = 0; j < spikes; j++) {
                    x = p.x + Math.cos(rot) * outerRadius;
                    y = p.y + Math.sin(rot) * outerRadius;
                    ctx.lineTo(x, y)
                    rot += step

                    x = p.x + Math.cos(rot) * innerRadius;
                    y = p.y + Math.sin(rot) * innerRadius;
                    ctx.lineTo(x, y)
                    rot += step
                }
                ctx.lineTo(p.x, p.y - outerRadius);
                ctx.closePath();
                ctx.fill();
                break;
        }
    }
    ctx.globalAlpha = 1.0;
  },
  [VisualizerStyle.BARS]: (ctx, audio, width, height, frame, options, state) => {
    const { primaryColor, secondaryColor, sensitivity, lineWidth } = options;
    const { smoothedData, bass, treble } = audio;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, secondaryColor);

    ctx.strokeStyle = gradient;
    ctx.lineCap = 'round';
    
    // Reactivity: Treble makes bars width fluctuate
    const widthMod = 1 + (treble * 0.5 * sensitivity);
    const barDrawingWidth = Math.max(1, (width / smoothedData.length) - 2);
    ctx.lineWidth = barDrawingWidth * widthMod;
    
    for (let i = 0; i < smoothedData.length; i++) {
        const value = smoothedData[i] / 255;
        // Reactivity: Bass boosts height of low frequency bars (left side)
        const isLowFreq = i < smoothedData.length * 0.15;
        const bassBoost = isLowFreq ? (1 + bass * 1.5 * sensitivity) : 1;
        
        const barHeightValue = Math.pow(value, 2) * height * sensitivity * bassBoost;
        const barHeight = Math.max(barDrawingWidth, barHeightValue); 
        if (barHeight <= barDrawingWidth) continue;

        const x = (width / smoothedData.length) * i + (width / smoothedData.length) / 2;
        
        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.lineTo(x, height - barHeight);
        ctx.stroke();
    }
  },
  [VisualizerStyle.CIRCLE]: (ctx, audio, width, height, frame, options) => {
    const { primaryColor, secondaryColor, sensitivity, lineWidth } = options;
    const { smoothedData } = audio;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    const len = smoothedData.length;
    for (let i = 0; i < len; i++) {
      const v = (smoothedData[i] * sensitivity) / 255.0;
      const angle = (i / len) * Math.PI * 2 - Math.PI / 2;
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + v * 100);
      const y2 = centerY + Math.sin(angle) * (radius + v * 100);

      const lineGradient = ctx.createLinearGradient(x1, y1, x2, y2);
      lineGradient.addColorStop(0, primaryColor);
      lineGradient.addColorStop(1, secondaryColor);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  },
  [VisualizerStyle.WAVE]: (ctx, audio, width, height, frame, options) => {
    const { primaryColor, secondaryColor, sensitivity, lineWidth } = options;
    const { smoothedData, bass, mid, treble } = audio;
    const centerY = height / 2;
    const sliceWidth = width / (smoothedData.length - 1);

    // Reactivity: Mid frequency floats the wave up and down
    const floatOffset = Math.sin(frame * 0.02) * 20 + (mid * 50 * sensitivity);
    // Reactivity: Bass thickens the line
    const dynamicLineWidth = lineWidth + (bass * lineWidth * 2.0 * sensitivity);

    const drawWave = (color: string | CanvasGradient, reflected: boolean) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = dynamicLineWidth;
        ctx.beginPath();
        
        let firstX = 0, firstY = centerY + floatOffset;
        ctx.moveTo(firstX, firstY);

        for (let i = 0; i < smoothedData.length; i++) {
            const v = Math.pow(smoothedData[i] / 255, 1.5) * sensitivity;
            
            // Reactivity: Treble adds jitter/noise to the wave points
            const jitter = (Math.random() - 0.5) * treble * 15 * sensitivity;
            
            let y = v * (centerY * 0.9) + jitter;
            if (reflected) y = -y;

            const x = i * sliceWidth;
            const prevX = i === 0 ? 0 : (i - 1) * sliceWidth;
            const controlX = (prevX + x) / 2;
            const targetY = centerY + floatOffset - y;
            
            ctx.quadraticCurveTo(prevX, firstY, controlX, (firstY + targetY)/2);
            firstY = targetY;
        }
        ctx.lineTo(width, firstY);
        ctx.stroke();
    }
    drawWave(primaryColor, false);
    const reflectionGradient = ctx.createLinearGradient(0, centerY, 0, height);
    reflectionGradient.addColorStop(0, `${secondaryColor}80`);
    reflectionGradient.addColorStop(0.8, `${secondaryColor}00`);
    drawWave(reflectionGradient, true);
  },
  [VisualizerStyle.NEON_TUNNEL]: (ctx, audio, width, height, frame, options) => {
    const { primaryColor, secondaryColor, sensitivity, lineWidth } = options;
    const centerX = width / 2;
    const centerY = height / 2;
    const pulse = 1 + (audio.bass * sensitivity) * 0.5;

    for (let i = 0; i < 20; i++) {
        const radius = i * 20 * pulse + (frame % (20 * pulse));
        const alpha = Math.max(0, 1 - radius / Math.max(width, height)).toFixed(2);
        
        const color = i % 2 === 0 ? primaryColor : secondaryColor;
        const alphaHex = Math.round(parseFloat(alpha) * 255).toString(16).padStart(2, '0');
        
        if (alphaHex === '00') continue;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = `${color}${alphaHex}`;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
  },
   [VisualizerStyle.PARTICLES]: (ctx, audio, width, height, frame, options) => {
    const { primaryColor, secondaryColor, sensitivity } = options;
    const { smoothedData, energy, bass, treble, mid } = audio;
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Reactivity: Count depends on Energy
    const particleCount = 100 + Math.floor(energy * sensitivity * 150);
    
    // Reactivity: Mid frequencies shift the gradient spread
    const gradientRadius = (width/2) * (0.8 + mid * 0.4);
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, gradientRadius);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, secondaryColor);

    // Reactivity: Bass creates a strong pulse/shockwave effect on position
    const bassPulse = bass * 120 * sensitivity;
    
    // Reactivity: Treble affects rotation speed
    const rotationSpeed = 0.005 + (treble * 0.03);

    for (let i = 0; i < particleCount; i++) {
        // Orbit calculation with dynamic speed
        const angle = (Math.random() * Math.PI * 2) + (frame * rotationSpeed * (i%2 === 0 ? 1 : -1));
        const baseRadius = Math.random() * (width / 2.2);
        const radius = baseRadius + bassPulse;
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        // Reactivity: Size boosted by Bass
        const dataIndex = i % smoothedData.length;
        const value = smoothedData[dataIndex] / 255;
        const size = (2 + value * 5) * (1 + bass * sensitivity);
        
        // Reactivity: Alpha flickers with Treble
        const alpha = 0.3 + (treble * 0.7 * Math.random());
        ctx.globalAlpha = Math.min(1, alpha);

        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  },
  [VisualizerStyle.GRID]: (ctx, audio, width, height, frame, options) => {
    const { primaryColor, secondaryColor, sensitivity } = options;
    const { smoothedData } = audio;
    const gridSize = 20;
    const stepX = width / gridSize;
    const stepY = height / gridSize;
    const dataStep = Math.floor(smoothedData.length / (gridSize * gridSize));

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const dataIndex = (i * gridSize + j) * dataStep;
        const value = (smoothedData[dataIndex] * sensitivity) / 255;
        const size = value * Math.min(stepX, stepY) * 0.8;
        
        const colorLerp = (value > 0.5) ? secondaryColor : primaryColor;
        ctx.fillStyle = `${colorLerp}${Math.round(value*255).toString(16).padStart(2,'0')}`;
        ctx.fillRect(i * stepX + (stepX - size) / 2, j * stepY + (stepY - size) / 2, size, size);
      }
    }
  },
  [VisualizerStyle.RADIAL_BARS]: (ctx, audio, width, height, frame, options) => {
    const { primaryColor, secondaryColor, sensitivity, lineWidth } = options;
    const { smoothedData } = audio;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 5;
    const bars = smoothedData.length;
    
    for (let i = 0; i < bars; i+=2) {
      const value = (smoothedData[i] * sensitivity) / 255;
      const barHeight = value * (radius * 1.5);
      const angle = (i / bars) * Math.PI * 2;

      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);

      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, primaryColor);
      gradient.addColorStop(1, secondaryColor);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  },
  [VisualizerStyle.FLOWER]: (ctx, audio, width, height, frame, options) => {
    const { primaryColor, secondaryColor, sensitivity, lineWidth } = options;
    const { bass, treble } = audio;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const petals = 8;
    const radius = Math.min(width, height) / 4 + bass * 50 * sensitivity;

    const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, secondaryColor);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    for (let i = 0; i < 360; i++) {
        const angle = i * Math.PI / 180;
        const petalShape = Math.sin(angle * petals) * (treble * 50 * sensitivity);
        const r = radius + petalShape;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.stroke();
  },
  [VisualizerStyle.SPIRAL]: (ctx, audio, width, height, frame, options) => {
    const { primaryColor, secondaryColor, sensitivity, lineWidth } = options;
    const { energy } = audio;
    const centerX = width / 2;
    const centerY = height / 2;
    const spin = frame * 0.01;
    const tightness = 0.5 + (energy * sensitivity) * 2;
    
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, secondaryColor);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    for (let i = 0; i < 500; i++) {
      const angle = 0.1 * i;
      const radius = tightness * angle;
      const x = centerX + radius * Math.cos(angle + spin);
      const y = centerY + radius * Math.sin(angle + spin);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  },
  [VisualizerStyle.SUNBURST]: (ctx, audio, width, height, frame, options) => {
    const { primaryColor, secondaryColor, sensitivity, lineWidth } = options;
    const { smoothedData, bass } = audio;
    const centerX = width / 2;
    const centerY = height / 2;
    const numRays = 72;

    const pulse = 1 + bass * 0.2;

    for (let i = 0; i < numRays; i++) {
        const dataIndex = Math.floor(i / numRays * (smoothedData.length * 0.8));
        const value = Math.pow(smoothedData[dataIndex] / 255, 2) * sensitivity;
        const angle = (i / numRays) * Math.PI * 2 + frame * 0.005;

        const rayLength = value * Math.min(width, height) * 0.4 * pulse;
        if (rayLength < 5) continue;

        const x1 = centerX + Math.cos(angle) * 20;
        const y1 = centerY + Math.sin(angle) * 20;
        const x2 = centerX + Math.cos(angle) * (20 + rayLength);
        const y2 = centerY + Math.sin(angle) * (20 + rayLength);

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        const color = i % 2 === 0 ? primaryColor : secondaryColor;
        gradient.addColorStop(0, `${color}FF`);
        gradient.addColorStop(0.8, `${color}80`);
        gradient.addColorStop(1, `${color}00`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth * (1 + value * 1.5);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
  },
  [VisualizerStyle.COSMIC_PULSE]: (ctx, audio, width, height, frame, options) => {
    const { primaryColor, secondaryColor, sensitivity } = options;
    const { bass, treble } = audio;
    const centerX = width / 2;
    const centerY = height / 2;

    const pulseRadius = 50 + (bass * 255 * sensitivity * 0.5);

    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
    coreGradient.addColorStop(0, `${primaryColor}FF`);
    coreGradient.addColorStop(0.5, `${primaryColor}80`);
    coreGradient.addColorStop(1, `${primaryColor}00`);
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
    ctx.fill();

    const particleCount = Math.floor(treble * 255 * sensitivity * 1.5);

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = pulseRadius + Math.random() * (Math.min(width, height) / 2 - pulseRadius);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const size = 1 + Math.random() * 2;
        
        ctx.fillStyle = secondaryColor;
        ctx.globalAlpha = Math.random() * 0.5 + 0.5;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  },
  [VisualizerStyle.METROPOLIS]: (ctx, audio, width, height, frame, options, state) => {
    const { primaryColor, secondaryColor, sensitivity } = options;
    const { rawData } = audio;
    const horizon = height * 0.4;
    const vanishingPointX = width / 2;

    if (!state.smoothedData || state.smoothedData.length !== rawData.length) {
      state.smoothedData = new Array(rawData.length).fill(0);
    }
    const internalSmooth = state.smoothedData;
    const smoothingFactor = 0.2;

    const buildingWidth = width / (rawData.length / 2);

    for (let i = 0; i < rawData.length / 2; i++) {
        const targetHeight = Math.pow(rawData[i] / 255, 3) * (height - horizon) * sensitivity;
        internalSmooth[i] += (targetHeight - internalSmooth[i]) * smoothingFactor;
        const h = internalSmooth[i];
        if (h < 1) continue;

        const x1_left = vanishingPointX - (i * buildingWidth) / 2;
        const x2_left = vanishingPointX - ((i + 1) * buildingWidth) / 2;
        const perspective_h_left = h * (1 - (i / (rawData.length / 2)) * 0.8);
        
        ctx.fillStyle = secondaryColor;
        ctx.beginPath();
        ctx.moveTo(x2_left, horizon);
        ctx.lineTo(x2_left, horizon - perspective_h_left);
        ctx.lineTo(x1_left, horizon - perspective_h_left * 0.9);
        ctx.lineTo(x1_left, horizon);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = primaryColor;
        ctx.fillRect(x1_left, horizon - perspective_h_left * 0.9, x2_left - x1_left, perspective_h_left * 0.9);

        const x1_right = vanishingPointX + (i * buildingWidth) / 2;
        const x2_right = vanishingPointX + ((i + 1) * buildingWidth) / 2;
        const perspective_h_right = h * (1 - (i / (rawData.length / 2)) * 0.8);

        ctx.fillStyle = secondaryColor;
        ctx.beginPath();
        ctx.moveTo(x1_right, horizon);
        ctx.lineTo(x1_right, horizon - perspective_h_right * 0.9);
        ctx.lineTo(x2_right, horizon - perspective_h_right);
        ctx.lineTo(x2_right, horizon);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = primaryColor;
        ctx.fillRect(x1_right, horizon - perspective_h_right * 0.9, x2_right - x1_right, perspective_h_right * 0.9);
    }
  },
  [VisualizerStyle.RETRO_SUN]: (ctx, audio, width, height, frame, options) => {
    const { primaryColor, secondaryColor, sensitivity, lineWidth } = options;
    const { smoothedData, bass } = audio;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.strokeStyle = `${secondaryColor}40`;
    ctx.lineWidth = 1;
    const horizon = centerY + 50;
    const lineSpacing = 10;
    for (let i = 0; i < 20; i++) {
        const y = horizon + (i * lineSpacing) + (frame * 2 % lineSpacing);
        if (y > height) break;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    const bars = 64;
    const radius = Math.min(width, height) / 8;
    for (let i = 0; i < bars; i++) {
        const value = (smoothedData[i * 2] * sensitivity) / 255;
        const barHeight = value * (radius * 1.2);
        const angle = (i / bars) * Math.PI * 2;

        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(1, secondaryColor);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    const pulseRadius = radius * (0.8 + (bass * sensitivity) * 0.4);
    
    const sunGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
    sunGradient.addColorStop(0, `${primaryColor}FF`);
    sunGradient.addColorStop(1, `${primaryColor}80`);

    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
    ctx.fill();
  },
  [VisualizerStyle.EQUALIZER]: (ctx, audio, width, height, frame, options, state) => {
    const { primaryColor, secondaryColor, sensitivity } = options;
    const { smoothedData } = audio;
    if (!state.peaks) state.peaks = new Array(smoothedData.length).fill(0);
    const peaks = state.peaks;
    const fallSpeed = 2;

    const gradient = ctx.createLinearGradient(0, height / 2, 0, height);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, secondaryColor);
    ctx.fillStyle = gradient;

    const barWidth = width / smoothedData.length;
    const centerY = height / 2;
    for (let i = 0; i < smoothedData.length; i++) {
      const barHeight = Math.min(((smoothedData[i] * sensitivity) / 255) * centerY, centerY);
      
      if (barHeight > peaks[i]) {
        peaks[i] = barHeight;
      } else {
        peaks[i] = Math.max(0, peaks[i] - fallSpeed);
      }
      
      ctx.fillRect(i * barWidth, centerY - barHeight, barWidth - 1, barHeight);
      ctx.fillRect(i * barWidth, centerY, barWidth - 1, barHeight);
      
      if (peaks[i] > 0) {
        ctx.fillStyle = '#FFFFFF80';
        ctx.fillRect(i * barWidth, centerY - peaks[i] - 2, barWidth - 1, 2);
        ctx.fillRect(i * barWidth, centerY + peaks[i], barWidth - 1, 2);
      }
    }
  },
  [VisualizerStyle.DNA_HELIX]: (ctx, audio, width, height, frame, options) => {
    const { primaryColor, secondaryColor, sensitivity, lineWidth } = options;
    const { smoothedData, bass } = audio;
    const centerX = width / 2;
    const centerY = height / 2;
    const rotation = frame * 0.01;
    const numPoints = 128;
    const amplitude = width * 0.15;
    const stretch = height * 0.8;

    const currentAmplitude = amplitude * (1 + bass * sensitivity * 0.5);

    ctx.lineWidth = lineWidth;

    let points1 = [];
    let points2 = [];
    
    for (let i = 0; i < numPoints; i++) {
        const t = (i / (numPoints - 1)) * 2 - 1; 
        const y = centerY + t * stretch / 2;
        const angle = t * 5 * Math.PI + rotation;
        const x = centerX + Math.cos(angle) * currentAmplitude;
        const z = Math.sin(angle);
        points1.push({ x, y, z });

        const x2 = centerX + Math.cos(angle + Math.PI) * currentAmplitude;
        points2.push({ x: x2, y, z });
    }

    const drawStrand = (points: {x:number, y:number, z:number}[], color: string) => {
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i+1];
            if (p1.z > -0.2 || p2.z > -0.2) {
                const alpha = Math.max(0, p1.z * 0.8 + 0.2).toFixed(2);
                const alphaHex = Math.round(parseFloat(alpha) * 255).toString(16).padStart(2, '0');
                ctx.strokeStyle = `${color}${alphaHex}`;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    };
    
    drawStrand(points1, primaryColor);
    drawStrand(points2, secondaryColor);

    for (let i = 0; i < numPoints; i+=4) {
        const p1 = points1[i];
        const p2 = points2[i];
        if (p1.z > 0) {
            const dataIndex = Math.floor(i / numPoints * smoothedData.length);
            const value = smoothedData[dataIndex] / 255;
            const alpha = (p1.z * 0.8 + 0.2) * value;
            const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
            ctx.strokeStyle = `#FFFFFF${alphaHex}`;
            ctx.lineWidth = Math.max(1, lineWidth * 0.5);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }
  },
  [VisualizerStyle.SPIRO]: (ctx, audio, width, height, frame, options) => {
    const { primaryColor, secondaryColor, sensitivity, lineWidth } = options;
    const { bass, mid } = audio;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const R = Math.min(width, height) * 0.3;
    const r = R * (0.4 + bass * sensitivity * 0.3);
    const O = r * (0.5 + mid * sensitivity * 0.4);

    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    for(let t=0; t < Math.PI * 10; t+= 0.01) {
        const x = centerX + (R - r) * Math.cos(t) + O * Math.cos(((R-r)/r)*t + frame * 0.01);
        const y = centerY + (R - r) * Math.sin(t) - O * Math.sin(((R-r)/r)*t + frame * 0.01);
        if(t === 0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
    }
    ctx.stroke();
  },
  [VisualizerStyle.RAIN]: (ctx, audio, width, height, frame, options, state) => {
    const { primaryColor, secondaryColor, sensitivity } = options;
    const { smoothedData, bass, energy } = audio;
    if (!state.particles) state.particles = [];
    if (!state.splashes) state.splashes = [];
    const particles = state.particles;
    const splashes = state.splashes;

    const particleCount = 50 + Math.floor(energy * 255 * sensitivity * 1.5);
    
    while (particles.length < particleCount && Math.random() > 0.5) {
        particles.push({
            x: Math.random() * width,
            y: -20,
            speed: 3 + Math.random() * 4,
            length: 15 + Math.random() * 10
        });
    }
    
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    for(let i=particles.length-1; i >= 0; i--) {
        const p = particles[i];
        p.y += p.speed;
        const value = smoothedData[i % smoothedData.length] / 255;
        const currentLength = p.length + value * 20;
        
        ctx.globalAlpha = 0.5 + value * 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y - currentLength);
        ctx.stroke();
        
        if (p.y > height) {
            splashes.push({ x: p.x, y: height, radius: 0, life: 1, maxRadius: 20 + bass * 255 });
            particles.splice(i, 1);
        }
    }
    
    ctx.lineWidth = 2;
    for(let i=splashes.length-1; i >= 0; i--) {
        const s = splashes[i];
        s.radius += 2;
        s.life -= 0.05;
        
        if(s.life <= 0) {
            splashes.splice(i, 1);
        } else {
            ctx.globalAlpha = s.life;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.strokeStyle = primaryColor;
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1;
  },
  [VisualizerStyle.AURORA]: (ctx, audio, width, height, frame, options, state) => {
    const { primaryColor, secondaryColor, sensitivity } = options;
    const { bass, treble } = audio;
    if(!state.bands) {
        state.bands = Array.from({length: 5}, (_, i) => ({
            y: height * 0.3 + (i * height * 0.12),
            color: i % 2 === 0 ? primaryColor : secondaryColor,
            amp: 20 + Math.random() * 30,
            freq: 0.01 + Math.random() * 0.02,
            offset: Math.random() * 100
        }));
    }
    const bands = state.bands;

    bands.forEach(band => {
        const gradient = ctx.createLinearGradient(0, band.y - band.amp * 2, 0, band.y + band.amp * 2);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, `${band.color}80`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(0, height);
        
        for (let x = 0; x < width; x++) {
            const wave = Math.sin(x * band.freq + frame * 0.01 + band.offset) * band.amp * (1 + bass * sensitivity);
            const shimmer = Math.sin(x * 0.1 + frame * 0.05) * 10 * treble;
            ctx.lineTo(x, band.y + wave + shimmer);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
    });
    ctx.globalAlpha = 1;
  },
  [VisualizerStyle.STARFIELD]: (ctx, audio, width, height, frame, options, state) => {
    const { primaryColor } = options;
    const { energy, treble } = audio;
    if(!state.stars) {
      state.stars = Array.from({length: 500}, () => ({
          x: Math.random() * width - width/2,
          y: Math.random() * height - height/2,
          z: Math.random() * width,
          pz: 0,
          brightness: 1
      }));
    }
    const stars = state.stars;
    const speed = 0.5 + energy * 3;

    const centerX = width / 2, centerY = height / 2;
    
    stars.forEach(star => {
      star.pz = star.z;
      star.z -= speed;
      star.brightness = 0.5 + treble * 0.5;

      if (star.z <= 0) {
        star.z = width;
        star.pz = width;
        star.x = Math.random() * width - width/2;
        star.y = Math.random() * height - height/2;
      }

      const sx = (star.x / star.z) * width/2 + centerX;
      const sy = (star.y / star.z) * height/2 + centerY;
      const r = Math.max(0, (1 - star.z / width) * 3);

      if(sx > 0 && sx < width && sy > 0 && sy < height) {
        ctx.fillStyle = `rgba(255,255,255,${star.brightness})`;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, 2 * Math.PI);
        ctx.fill();

        if (speed > 2) {
          const px = (star.x / star.pz) * width/2 + centerX;
          const py = (star.y / star.pz) * height/2 + centerY;
          ctx.strokeStyle = `rgba(255,255,255,${star.brightness * 0.5})`;
          ctx.lineWidth = r;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        }
      }
    });
  },
  [VisualizerStyle.KALEIDOSCOPE]: (ctx, audio, width, height, frame, options) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const slices = 8;
    const angle = Math.PI * 2 / slices;

    for (let i = 0; i < slices; i++) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(i * angle);
        ctx.scale(i % 2 ? 1 : -1, 1);
        
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.arc(0, 0, width, -angle/2, angle/2, false);
        ctx.closePath();
        ctx.clip();
        
        (drawFunctions[VisualizerStyle.RADIAL_BARS] as any)(ctx, audio, width, height, frame, options, {});
        
        ctx.restore();
    }
  },
  [VisualizerStyle.BLOB]: (ctx, audio, width, height, frame, options) => {
    const { primaryColor, secondaryColor, sensitivity } = options;
    const { smoothedData } = audio;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const drawBlob = (color: string, radiusMultiplier: number, timeOffset: number) => {
      const baseRadius = Math.min(width, height) * 0.2 * radiusMultiplier;
      const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.1, centerX, centerY, baseRadius * 1.5);
      const alphaColor = color + 'B0';
      gradient.addColorStop(0, alphaColor);
      gradient.addColorStop(1, color + '00');
      ctx.fillStyle = gradient;

      ctx.beginPath();
      const points = 16;
      let angle, value, radius, x, y;
      let allPoints = [];

      for (let i = 0; i <= points; i++) {
          angle = i * (Math.PI * 2 / points);
          const dataIndex = Math.floor(i * (smoothedData.length / points)) % smoothedData.length;
          value = smoothedData[dataIndex] * sensitivity / 255;
          radius = baseRadius + value * 60 + Math.sin(frame * 0.05 + i * 0.5 + timeOffset) * 15;
          x = centerX + Math.cos(angle) * radius;
          y = centerY + Math.sin(angle) * radius;
          allPoints.push({x, y});
      }

      ctx.moveTo((allPoints[0].x + allPoints[points].x)/2, (allPoints[0].y + allPoints[points].y)/2);
      for(let i=0; i < points; i++) {
        const p1 = allPoints[i];
        const p2 = allPoints[i+1];
        const xc = (p1.x + p2.x) / 2;
        const yc = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);
      }
      ctx.closePath();
      ctx.fill();
    };

    drawBlob(secondaryColor, 1.1, Math.PI);
    drawBlob(primaryColor, 1.0, 0);
  },
  [VisualizerStyle.CUBIC]: (ctx, audio, width, height, frame, options) => {
    const { primaryColor, secondaryColor, sensitivity } = options;
    const { smoothedData } = audio;
    const size = 30;
    const cols = Math.floor(width / size);
    const rows = Math.floor(height / size);
    
    function drawCube(x: number, y: number, z: number, s: number, color1: string, color2: string) {
        const top = color1;
        const left = color2;
        const right = secondaryColor;

        ctx.fillStyle = top;
        ctx.beginPath();
        ctx.moveTo(x, y-z);
        ctx.lineTo(x + s/2, y - s/4 - z);
        ctx.lineTo(x, y - s/2 - z);
        ctx.lineTo(x - s/2, y - s/4 - z);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = left;
        ctx.beginPath();
        ctx.moveTo(x - s/2, y - s/4 - z);
        ctx.lineTo(x, y - s/2 - z);
        ctx.lineTo(x, y - z);
        ctx.lineTo(x - s/2, y + s/4 - z);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = right;
        ctx.beginPath();
        ctx.moveTo(x, y - s/2 - z);
        ctx.lineTo(x + s/2, y - s/4 - z);
        ctx.lineTo(x + s/2, y + s/4 - z);
        ctx.lineTo(x, y - z);
        ctx.closePath();
        ctx.fill();
    }

    for(let i=0; i<cols; i++) {
        for(let j=0; j<rows; j++) {
            const dataIndex = (i * j) % smoothedData.length;
            const value = smoothedData[dataIndex] * sensitivity / 255;
            const heightOffset = value * 100;
            drawCube(i * size + size/2, j * size + size/2, heightOffset, size * 0.8, primaryColor, secondaryColor);
        }
    }
  },
  [VisualizerStyle.VORTEX]: (ctx, audio, width, height, frame, options, state) => {
    const { primaryColor, sensitivity } = options;
    const { energy } = audio;
    if(!state.particles) state.particles = [];
    const particles = state.particles;

    while(particles.length < 300) {
        particles.push({
          angle: Math.random() * Math.PI * 2,
          radius: Math.random() * width / 2,
          speed: 0.01 + Math.random() * 0.02
        });
    }

    ctx.fillStyle = primaryColor;
    const centerX = width/2, centerY=height/2;
    particles.forEach((p:any) => {
        p.angle += p.speed * (1 + energy * sensitivity);
        p.radius -= 0.5;
        
        const x = centerX + Math.cos(p.angle) * p.radius;
        const y = centerY + Math.sin(p.angle) * p.radius;
        
        ctx.beginPath();
        ctx.arc(x,y, Math.max(0.1, p.radius / 100), 0, Math.PI * 2);
        ctx.fill();

        if (p.radius <= 0) {
            p.radius = width/2;
            p.angle = Math.random() * Math.PI * 2;
        }
    });
  },
  [VisualizerStyle.GLITCH]: (ctx, audio, width, height, frame, options, state) => {
    const { primaryColor, secondaryColor, sensitivity } = options;
    const { energy, bass } = audio;
    
    (drawFunctions[VisualizerStyle.BARS] as any)(ctx, audio, width, height, frame, {...options, lineWidth: 8}, state);

    if (energy * sensitivity > 0.4 && Math.random() > 0.7) {
      const numSlices = 10 + Math.floor(Math.random() * 20);
      for (let i = 0; i < numSlices; i++) {
        const sliceY = Math.random() * height;
        const sliceHeight = 1 + Math.random() * (height / 20);
        const sliceData = ctx.getImageData(0, sliceY, width, sliceHeight);
        const shiftX = (Math.random() - 0.5) * width * 0.2 * (bass * sensitivity);
        ctx.putImageData(sliceData, shiftX, sliceY);
      }
    }
    
    if (bass * sensitivity > 0.6 && Math.random() > 0.5) {
        ctx.globalCompositeOperation = 'lighter';
        const offset = (Math.random() * 10 - 5) * (bass * sensitivity);
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(ctx.canvas, offset, 0);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(ctx.canvas, -offset, 0);
        ctx.restore();
        
        ctx.globalCompositeOperation = 'source-over';
    }

    if (energy > 0.5 && Math.random() > 0.9) {
      const numBlocks = Math.floor(Math.random() * 5);
      for(let i=0; i<numBlocks; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? primaryColor : secondaryColor;
        ctx.globalAlpha = Math.random() * 0.5;
        const x = Math.random() * width;
        const y = Math.random() * height;
        const w = Math.random() * width * 0.3;
        const h = Math.random() * height * 0.1;
        ctx.fillRect(x,y,w,h);
      }
      ctx.globalAlpha = 1.0;
    }
  },
  [VisualizerStyle.STRING_THEORY]: (ctx, audio, width, height, frame, options) => {
    const { primaryColor, secondaryColor, sensitivity, lineWidth } = options;
    const { smoothedData } = audio;
    const strings = 5;
    
    for (let i = 0; i < strings; i++) {
        const yOffset = height / (strings + 1) * (i + 1);
        const color = i % 2 ? primaryColor : secondaryColor;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        
        for (let x = 0; x <= width; x++) {
            const dataIndex = Math.floor(x / width * smoothedData.length);
            const value = smoothedData[dataIndex] * sensitivity / 255;
            const y = yOffset + Math.sin(x * 0.02 + frame * 0.05 + i) * 20 * value;
            if(x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
  },
  [VisualizerStyle.GALAXY]: (ctx, audio, width, height, frame, options, state) => {
    const { primaryColor, secondaryColor, sensitivity } = options;
    const { energy, bass } = audio;
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    const maxRadius = Math.min(width, height) / 1.5;

    if (!state.particles) {
        state.particles = Array.from({ length: 600 }, () => ({
            angle: Math.random() * Math.PI * 2,
            radius: Math.random() * maxRadius,
            speed: 0.05 + Math.random() * 0.2,
            size: 0.5 + Math.random() * 1.5,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.005
        }));
    }

    const particles = state.particles;

    particles.forEach((p: any) => {
        p.radius -= p.speed * (0.5 + energy * sensitivity);
        p.rotation += p.rotationSpeed * (1 + bass * sensitivity * 2);

        if (p.radius <= 0) {
            p.radius = maxRadius;
            p.angle = Math.random() * Math.PI * 2;
        }

        const x = centerX + Math.cos(p.angle) * (p.radius + Math.sin(p.rotation) * p.radius * 0.2);
        const y = centerY + Math.sin(p.angle) * (p.radius + Math.sin(p.rotation) * p.radius * 0.2);
        
        const alpha = Math.pow(1 - p.radius / maxRadius, 2);
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = Math.random() > 0.1 ? primaryColor : secondaryColor;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.globalAlpha = 1;

    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius * 0.15);
    const alphaHex = Math.round((bass * 128)).toString(16).padStart(2, '0');
    coreGradient.addColorStop(0, `${secondaryColor}${alphaHex}`);
    coreGradient.addColorStop(1, `${secondaryColor}00`);
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius * 0.15, 0, Math.PI * 2);
    ctx.fill();
  },
  [VisualizerStyle.PLASMA]: (ctx, audio, width, height, frame, options, state) => {
    const { primaryColor, secondaryColor, sensitivity } = options;
    const { smoothedData } = audio;
    const numBlobs = 6;

    if (!state.particles) {
        state.particles = Array.from({ length: numBlobs }, (_, i) => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            baseRadius: Math.min(width, height) * 0.1 + Math.random() * Math.min(width, height) * 0.15,
            dataIndex: Math.floor(i * (smoothedData.length / numBlobs)),
        }));
    }
    const blobs = state.particles;

    ctx.globalCompositeOperation = 'lighter';

    blobs.forEach((b: any) => {
        b.x += b.vx;
        b.y += b.vy;

        if (b.x < 0 || b.x > width) b.vx *= -1;
        if (b.y < 0 || b.y > height) b.vy *= -1;
        
        const value = smoothedData[b.dataIndex] * sensitivity / 255;
        const radius = b.baseRadius * (0.6 + value * 1.2);
        
        const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, radius);
        const color = b.dataIndex % 2 === 0 ? primaryColor : secondaryColor;
        gradient.addColorStop(0, `${color}80`);
        gradient.addColorStop(1, `${color}00`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.globalCompositeOperation = 'source-over';
  },
};

const useImage = (src: string | null) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
  }, [src]);
  return image;
};

const VisualizerComponent: React.FC<VisualizerProps> = (props) => {
  const { audioDataRef, style, theme, transform, text, logo, background, postProcessing, customParticleSettings, onCanvasReady, width, height } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const animationFrameIdRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const [isInView, setIsInView] = useState(true);

  // Refs for all interactive props to allow the loop to read latest values without restart
  const propsRef = useRef(props);
  // Update the propsRef whenever props change. 
  // This allows the animation loop (which depends on empty array) to see fresh values.
  useEffect(() => {
      propsRef.current = props;
  }, [props]);

  const drawStateRef = useRef<DrawState>({});
  
  // Reset state when style changes
  useEffect(() => {
    drawStateRef.current = {};
  }, [style]);

  const logoImage = useImage(logo.url);
  const backgroundImage = useImage(background.url);
  const logoImageRef = useRef(logoImage);
  const backgroundImageRef = useRef(backgroundImage);

  useEffect(() => { logoImageRef.current = logoImage; }, [logoImage]);
  useEffect(() => { backgroundImageRef.current = backgroundImage; }, [backgroundImage]);

  useEffect(() => {
     if (canvasRef.current) {
      onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady]);

  // Intersection Observer to pause rendering when out of view
  useEffect(() => {
      const observer = new IntersectionObserver(
          ([entry]) => {
              setIsInView(entry.isIntersecting);
          },
          { threshold: 0.1 } // Pause if less than 10% is visible
      );
      
      if (wrapperRef.current) {
          observer.observe(wrapperRef.current);
      }
      
      return () => observer.disconnect();
  }, []);

  // THE MAIN RENDER LOOP
  // This effect starts once and runs continuously.
  // It reads from refs to get the latest data.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
        // If not in view, don't draw, but loop again on next frame to check state
        if (!isInView) {
            animationFrameIdRef.current = requestAnimationFrame(render);
            return;
        }

        const currentProps = propsRef.current;
        const { width, height, style, theme, transform, text, logo, background, postProcessing, customParticleSettings } = currentProps;
        
        // Check audio data
        const audioData = currentProps.audioDataRef.current;
        if (!audioData) {
            animationFrameIdRef.current = requestAnimationFrame(render);
            return;
        }

        if (!offscreenCanvasRef.current) {
            offscreenCanvasRef.current = document.createElement('canvas');
        }
        const offscreenCanvas = offscreenCanvasRef.current;
        
        // Ensure canvas sizes match prop sizes
        if (offscreenCanvas.width !== width || offscreenCanvas.height !== height) {
            offscreenCanvas.width = width;
            offscreenCanvas.height = height;
        }
        // Note: we don't resize the main canvas in the loop to avoid layout thrashing, 
        // assumes React handles the DOM attribute updates via props.

        const mainCtx = canvas.getContext('2d');
        const offscreenCtx = offscreenCanvas.getContext('2d');

        if (mainCtx && offscreenCtx) {
            frameCountRef.current++;
            const frame = frameCountRef.current;

            // --- Step 1: Draw to offscreen ---
            offscreenCtx.save();
            offscreenCtx.fillStyle = `rgba(0, 0, 0, ${theme.backgroundFade})`;
            offscreenCtx.fillRect(0, 0, width, height);

            offscreenCtx.save();
            // Increased range for translation: now uses width/2 and height/2 to allow full edge-to-edge movement
            const translateX = (transform.positionX - 50) / 50 * (width / 2);
            const translateY = (transform.positionY - 50) / 50 * (height / 2);

            offscreenCtx.translate(width / 2, height / 2);
            offscreenCtx.translate(translateX, translateY);
            offscreenCtx.scale(transform.scale, transform.scale);
            offscreenCtx.rotate(transform.rotation * Math.PI / 180);
            offscreenCtx.translate(-width / 2, -height / 2);

            if (theme.glowIntensity > 0) {
                offscreenCtx.shadowBlur = theme.glowIntensity;
                offscreenCtx.shadowColor = theme.primaryColor;
            }

            const draw = drawFunctions[style];
            if (draw) {
                draw(offscreenCtx, audioData, width, height, frame, { ...theme, customParticleSettings }, drawStateRef.current);
            }

            offscreenCtx.shadowBlur = 0;
            offscreenCtx.restore();

            // Logo Overlay
            if (logoImageRef.current) {
                offscreenCtx.globalAlpha = logo.opacity;
                const logoHeight = logo.size;
                const logoWidth = (logoImageRef.current.width / logoImageRef.current.height) * logoHeight;
                offscreenCtx.drawImage(logoImageRef.current, width - logoWidth - 20, 20, logoWidth, logoHeight);
                offscreenCtx.globalAlpha = 1.0;
            }

            // Text Overlay
            if (text.content) {
                 let currentFontSize = text.fontSize;
                 if (text.pulseOnBeat) {
                     currentFontSize = text.fontSize * (1 + audioData.bass * 0.3);
                 }
                offscreenCtx.font = `bold ${currentFontSize}px sans-serif`;
                offscreenCtx.textAlign = 'center';
                offscreenCtx.fillStyle = text.color;
                offscreenCtx.shadowColor = 'black';
                offscreenCtx.shadowBlur = text.shadowBlur;
                const x = width * (text.positionX / 100);
                const y = height * (text.positionY / 100);
                offscreenCtx.fillText(text.content, x, y);
                offscreenCtx.shadowColor = 'transparent';
                offscreenCtx.shadowBlur = 0; 
            }
            offscreenCtx.restore();

            // --- Step 2: Draw to main canvas ---
            mainCtx.save();
            mainCtx.clearRect(0, 0, width, height);

            if (backgroundImageRef.current) {
                mainCtx.globalAlpha = background.opacity;
                if (background.blur > 0) mainCtx.filter = `blur(${background.blur}px)`;
                mainCtx.drawImage(backgroundImageRef.current, 0, 0, width, height);
                mainCtx.filter = 'none';
                mainCtx.globalAlpha = 1.0;
            }

            if (postProcessing.bloom.enabled && postProcessing.bloom.intensity > 0) {
                mainCtx.filter = `blur(${postProcessing.bloom.intensity}px) brightness(120%)`;
                mainCtx.globalCompositeOperation = 'lighter';
                mainCtx.globalAlpha = 0.8;
                mainCtx.drawImage(offscreenCanvas, 0, 0);
            }

            mainCtx.filter = 'none';
            mainCtx.globalCompositeOperation = backgroundImageRef.current ? 'lighter' : 'source-over';
            mainCtx.globalAlpha = 1.0;
            mainCtx.drawImage(offscreenCanvas, 0, 0);

            if (postProcessing.chromaticAberration.enabled && postProcessing.chromaticAberration.intensity > 0) {
                const offset = postProcessing.chromaticAberration.intensity;
                mainCtx.globalCompositeOperation = 'lighter';
                mainCtx.globalAlpha = 0.5;
                mainCtx.drawImage(canvas, -offset, 0);
                mainCtx.drawImage(canvas, offset, 0);
            }

            mainCtx.restore();
        }

        animationFrameIdRef.current = requestAnimationFrame(render);
    };

    // Start the loop
    render();

    return () => {
        cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [isInView]); // Re-trigger if visibility changes to restart loop logic

  return (
    <div 
        ref={wrapperRef}
        className="relative w-full h-auto rounded-lg overflow-hidden shadow-2xl group"
    >
        <canvas ref={canvasRef} width={width} height={height} className="w-full h-full bg-black" />
    </div>
  );
};

export const Visualizer = memo(VisualizerComponent);
