import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, ChevronDown, Check, Wand2, AlignLeft, SpellCheck, Minimize2, Maximize2, RotateCcw } from 'lucide-react';
import { enhanceText, EnhancementOption } from '../services/geminiService';

interface AIWriterProps {
  value: string;
  onChange: (val: string) => void;
  type: 'summary' | 'experience';
  label?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export const AIWriter: React.FC<AIWriterProps> = ({ 
  value, 
  onChange, 
  type, 
  label, 
  placeholder, 
  rows = 4,
  className = "" 
}) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEnhance = async (option: EnhancementOption) => {
    if (!value.trim()) return;
    
    setPreviousValue(value); // Save for undo
    setIsOpen(false);
    setLoading(true);

    try {
      const enhancedText = await enhanceText(value, type, option);
      
      // Typewriter effect simulation
      let currentText = "";
      const totalDuration = 1000; // 1 second total typing time
      const chars = enhancedText.split("");
      const intervalTime = Math.max(10, totalDuration / chars.length);

      // Clear current text first to show it's rewriting
      onChange(""); 

      let i = 0;
      const interval = setInterval(() => {
        if (i >= chars.length) {
          clearInterval(interval);
          setLoading(false);
          onChange(enhancedText); // Ensure final state is exact
        } else {
          currentText += chars[i];
          onChange(currentText);
          i++;
        }
      }, intervalTime);

    } catch (error) {
      console.error(error);
      setLoading(false);
      // Restore if error
      onChange(value); 
      alert("AI Enhancement failed. Please try again.");
    }
  };

  const handleUndo = () => {
    if (previousValue !== null) {
      onChange(previousValue);
      setPreviousValue(null);
    }
  };

  const options: { id: EnhancementOption; label: string; icon: React.ElementType }[] = [
    { id: 'professional', label: 'Professional Polish', icon: Wand2 },
    { id: 'grammar', label: 'Fix Grammar', icon: SpellCheck },
    { id: 'concise', label: 'Make Concise', icon: Minimize2 },
    { id: 'expand', label: 'Expand & Elaborate', icon: Maximize2 },
  ];

  return (
    <div className={`relative group ${className}`}>
      <div className="flex justify-between items-end mb-1.5">
        {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
        
        {/* Undo Button (Visible after AI change) */}
        {previousValue && !loading && (
           <button 
             onClick={handleUndo}
             className="text-xs flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors mr-auto ml-3"
             title="Undo AI Change"
           >
             <RotateCcw className="w-3 h-3" /> Revert
           </button>
        )}

        {/* AI Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={loading || !value.trim()}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md transition-all ${
              isOpen ? 'bg-indigo-100 text-indigo-700' : 'text-indigo-600 hover:bg-indigo-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Enhance with AI</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 ring-1 ring-slate-900/5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Option
              </div>
              <div className="p-1">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleEnhance(opt.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors text-left"
                  >
                    <opt.icon className="w-4 h-4 opacity-70" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className={`w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base text-slate-900 placeholder:text-slate-400 transition-all ${
            loading ? 'opacity-50' : 'opacity-100'
          }`}
        />

        {/* Gray Shining Blur Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 rounded-lg overflow-hidden pointer-events-none">
            {/* Backdrop Blur */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]"></div>
            
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
            
            {/* Skeleton Lines to simulate text structure */}
            <div className="p-4 space-y-3 opacity-50">
               <div className="h-2 bg-slate-300 rounded w-3/4 animate-pulse"></div>
               <div className="h-2 bg-slate-300 rounded w-full animate-pulse delay-75"></div>
               <div className="h-2 bg-slate-300 rounded w-5/6 animate-pulse delay-150"></div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};