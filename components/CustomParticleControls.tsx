
import React, { useState } from 'react';
import { useAppState, useAppDispatch } from '../contexts/AppContext';
import { CustomParticleSettings } from '../types';

// --- Reusable Control Components ---

const Tooltip: React.FC<{ text: string }> = ({ text }) => {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative flex items-center" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
            <span className="cursor-help text-gray-500 hover:text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </span>
            {visible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded py-1 px-2 z-10 border border-gray-700 shadow-lg">
                    {text}
                </div>
            )}
        </div>
    );
};

const ControlRow: React.FC<{ label: string; children: React.ReactNode; tooltip?: string }> = ({ label, children, tooltip }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <label className="text-sm font-medium text-gray-300 w-full sm:w-1/3 flex items-center gap-2">
            {label}
            {tooltip && <Tooltip text={tooltip} />}
        </label>
        <div className="w-full sm:w-2/3">{children}</div>
    </div>
);

const SliderControl: React.FC<{
    id: keyof CustomParticleSettings;
    value: number;
    min: number;
    max: number;
    step: number;
    displayValue?: string;
}> = ({ id, value, min, max, step, displayValue }) => {
    const dispatch = useAppDispatch();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({ type: 'UPDATE_CUSTOM_PARTICLE_SETTINGS', payload: { [id]: parseFloat(e.target.value) } });
    };
    return (
        <div className="flex items-center gap-3">
            <input type="range" id={id} min={min} max={max} step={step} value={value} onChange={handleChange} className="w-full" />
            <span className="text-xs text-gray-400 w-10 text-right">{displayValue || value}</span>
        </div>
    );
};

const SelectControl: React.FC<{
    id: keyof CustomParticleSettings;
    value: string;
    options: { value: string; label: string }[];
}> = ({ id, value, options }) => {
    const dispatch = useAppDispatch();
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch({ type: 'UPDATE_CUSTOM_PARTICLE_SETTINGS', payload: { [id]: e.target.value } as any });
    };
    return (
        <select id={id} value={value} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-cyan-500 focus:border-cyan-500">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    );
};

const ToggleControl: React.FC<{
    id: keyof CustomParticleSettings;
    checked: boolean;
}> = ({ id, checked }) => {
    const dispatch = useAppDispatch();
    const handleChange = () => {
        dispatch({ type: 'UPDATE_CUSTOM_PARTICLE_SETTINGS', payload: { [id]: !checked } });
    };
    return (
         <button
            id={id}
            onClick={handleChange}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-cyan-600' : 'bg-gray-600'}`}
            aria-pressed={checked}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
};

const ShapeSelector: React.FC<{
    value: CustomParticleSettings['particleShape'];
}> = ({ value }) => {
    const dispatch = useAppDispatch();
    const shapes: CustomParticleSettings['particleShape'][] = ['circle', 'square', 'line', 'star'];
    const icons = {
        circle: <div className="w-5 h-5 bg-white rounded-full"></div>,
        square: <div className="w-5 h-5 bg-white"></div>,
        line: <div className="w-5 h-1 bg-white my-2"></div>,
        star: <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>,
    };

    return (
        <div className="grid grid-cols-4 gap-2">
            {shapes.map(shape => (
                <button
                    key={shape}
                    onClick={() => dispatch({ type: 'UPDATE_CUSTOM_PARTICLE_SETTINGS', payload: { particleShape: shape } })}
                    className={`flex items-center justify-center p-2 rounded-md transition-colors ${value === shape ? 'bg-cyan-600 ring-2 ring-cyan-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                    aria-label={`Select ${shape} shape`}
                    aria-pressed={value === shape}
                >
                    {icons[shape]}
                </button>
            ))}
        </div>
    );
};

const ColoringSelector: React.FC<{
    value: CustomParticleSettings['coloring'];
}> = ({ value }) => {
    const dispatch = useAppDispatch();
    const { themeCustomizations } = useAppState();
    const options: CustomParticleSettings['coloring'][] = ['primary', 'secondary', 'mixed'];
    
    const swatches = {
        primary: <div className="w-full h-5 rounded" style={{ backgroundColor: themeCustomizations.primaryColor }}></div>,
        secondary: <div className="w-full h-5 rounded" style={{ backgroundColor: themeCustomizations.secondaryColor }}></div>,
        mixed: <div className="w-full h-5 rounded" style={{ background: `linear-gradient(90deg, ${themeCustomizations.primaryColor}, ${themeCustomizations.secondaryColor})` }}></div>,
    };

    return (
        <div className="grid grid-cols-3 gap-2">
            {options.map(option => (
                <button
                    key={option}
                    onClick={() => dispatch({ type: 'UPDATE_CUSTOM_PARTICLE_SETTINGS', payload: { coloring: option } })}
                    className={`p-2 rounded-md transition-colors capitalize text-xs font-semibold flex flex-col items-center gap-1 ${value === option ? 'bg-gray-900 ring-2 ring-cyan-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                    aria-label={`Select ${option} coloring`}
                    aria-pressed={value === option}
                >
                    {swatches[option]}
                    <span className={value === option ? 'text-cyan-400' : 'text-gray-300'}>{option}</span>
                </button>
            ))}
        </div>
    );
};

const ControlCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
        <h4 className="font-semibold text-cyan-400 mb-4">{title}</h4>
        <div className="space-y-4">{children}</div>
    </div>
);

// --- Main Component ---

export const CustomParticleControls: React.FC = () => {
    const { customParticleSettings } = useAppState();

    return (
        <div className="p-6 bg-gray-900 border border-white/10 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">
                Custom Particle System Designer
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                
                <ControlCard title="Emission">
                    <ControlRow label="Style">
                        <SelectControl id="emissionStyle" value={customParticleSettings.emissionStyle} options={[
                            { value: 'burst', label: 'Center Burst' },
                            { value: 'fountain', label: 'Fountain Up' },
                            { value: 'rain', label: 'Rain Down' },
                        ]} />
                    </ControlRow>
                     <ControlRow label="Rate">
                        <SliderControl id="particleCount" value={customParticleSettings.particleCount} min={1} max={10} step={1} />
                    </ControlRow>
                    <ControlRow label="Initial Speed">
                        <SliderControl id="particleSpeed" value={customParticleSettings.particleSpeed} min={1} max={10} step={1} />
                    </ControlRow>
                </ControlCard>
                
                <ControlCard title="Particle">
                    <ControlRow label="Shape">
                        <ShapeSelector value={customParticleSettings.particleShape} />
                    </ControlRow>
                    <ControlRow label="Coloring">
                        <ColoringSelector value={customParticleSettings.coloring} />
                    </ControlRow>
                    <ControlRow label="Base Size">
                        <SliderControl id="size" value={customParticleSettings.size} min={1} max={10} step={1} />
                    </ControlRow>
                    <ControlRow label="Lifespan" tooltip="Controls how long particles stay on screen. Higher values mean longer life.">
                        <SliderControl id="lifespan" value={customParticleSettings.lifespan} min={1} max={10} step={1} />
                    </ControlRow>
                </ControlCard>

                <ControlCard title="Physics">
                    <ControlRow label="Gravity" tooltip="Positive values pull particles down, negative values pull them up.">
                        <SliderControl id="gravity" value={customParticleSettings.gravity} min={-5} max={5} step={0.5} displayValue={customParticleSettings.gravity.toFixed(1)} />
                    </ControlRow>
                    <ControlRow label="Wind" tooltip="Applies a constant horizontal force. Positive values push right, negative values push left.">
                        <SliderControl id="wind" value={customParticleSettings.wind} min={-5} max={5} step={0.5} displayValue={customParticleSettings.wind.toFixed(1)} />
                    </ControlRow>
                    <ControlRow label="Wavy Movement">
                        <ToggleControl id="wavyMovement" checked={customParticleSettings.wavyMovement} />
                    </ControlRow>
                </ControlCard>

                <ControlCard title="Audio Reactivity">
                    <ControlRow label="React Property" tooltip="Choose which particle property should react to the music's bass.">
                        <SelectControl id="audioReactiveProperty" value={customParticleSettings.audioReactiveProperty} options={[
                           { value: 'none', label: 'None' },
                           { value: 'size', label: 'Size' },
                           { value: 'speed', label: 'Speed' },
                        ]} />
                    </ControlRow>
                </ControlCard>
                
            </div>
        </div>
    );
};
