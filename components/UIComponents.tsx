
import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  className?: string;
  badge?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
    title, children, defaultOpen = false, icon, className = '', badge 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-800 shadow-xl transition-all duration-300 ${isOpen ? 'ring-1 ring-gray-700' : ''} ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-800/80 hover:bg-gray-800 transition-colors group"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-gray-400 group-hover:text-cyan-400 transition-colors duration-300">{icon}</span>}
          <h3 className="text-lg font-bold text-gray-200 group-hover:text-white transition-colors">{title}</h3>
          {badge && (
            <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-cyan-900/50 text-cyan-300 rounded-full border border-cyan-800/50">
                {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-cyan-400' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div
        className={`transition-all duration-500 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="p-6 border-t border-gray-800">
          {children}
        </div>
      </div>
    </div>
  );
};

export const HeaderButton: React.FC<{ onClick: () => void; icon: React.ReactNode; text: string; variant?: 'primary' | 'danger' | 'ghost' }> = ({ onClick, icon, text, variant = 'ghost' }) => {
    const baseClass = "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
    
    const variants = {
        primary: "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20 focus:ring-cyan-500",
        danger: "bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/50 hover:border-red-500 focus:ring-red-500",
        ghost: "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 focus:ring-gray-500"
    };

    return (
        <button onClick={onClick} className={`${baseClass} ${variants[variant]}`}>
            <span className="w-4 h-4">{icon}</span>
            <span>{text}</span>
        </button>
    );
};
