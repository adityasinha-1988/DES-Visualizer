import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BitGrid } from '../ui/BitGrid';
import { IP_TABLE } from '../../constants';
import { ArrowDown, Shuffle } from 'lucide-react';

interface IPProps {
  input: string; // 64 bits
  output: string; // 64 bits
}

export const InitialPermutation: React.FC<IPProps> = ({ input, output }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  // Update SVG dimensions on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSvgDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Mapping logic
  // IP_TABLE[i] = p means Output[i] comes from Input[p-1]
  // Inverse: If I hover Input[k], where does it go?
  // We need to find index j such that IP_TABLE[j] == k + 1
  const getTargetIndex = (sourceIdx: number) => {
    return IP_TABLE.findIndex(val => val === sourceIdx + 1);
  };

  const getSourceIndex = (targetIdx: number) => {
    return IP_TABLE[targetIdx] - 1;
  };

  const activeSource = hoveredIndex !== null ? (hoveredIndex < 64 ? hoveredIndex : getSourceIndex(hoveredIndex - 64)) : null;
  const activeTarget = hoveredIndex !== null ? (hoveredIndex >= 64 ? hoveredIndex - 64 : getTargetIndex(hoveredIndex)) : null;

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto p-2 sm:p-4 gap-4" ref={containerRef}>
      <div className="text-center space-y-1 shrink-0">
        <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
          <Shuffle className="w-5 h-5 text-accent" />
          Initial Permutation
        </h3>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          Hover over the bits to trace their movement. 
          The 58th bit of input becomes the 1st bit of output, and so on.
        </p>
      </div>

      <div className="relative flex-1 grid grid-rows-[1fr_auto_1fr] md:grid-rows-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-12 items-center justify-center min-h-0">
        
        {/* SVG Overlay for lines */}
        <div className="absolute inset-0 pointer-events-none z-10 hidden md:block">
           {activeSource !== null && activeTarget !== null && (
             <svg width="100%" height="100%" className="opacity-80">
               <defs>
                 <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                   <stop offset="0%" stopColor="#34d399" />
                   <stop offset="100%" stopColor="#60a5fa" />
                 </linearGradient>
               </defs>
               {/* 
                  Drawing logical lines is tricky without exact coordinates of the bits. 
                  Approximation: Source is Left/Top, Target is Right/Bottom.
                  We'll draw a generic connection curve.
               */}
               <path 
                 d={`M ${20} ${50 + (activeSource/64)*80}% C ${40} ${50 + (activeSource/64)*80}%, ${60} ${50 + (activeTarget/64)*80}%, ${90} ${50 + (activeTarget/64)*80}%`} 
                 // This is a rough approximation for visualization effect
                 stroke="url(#lineGradient)" 
                 strokeWidth="2" 
                 fill="none" 
                 className="hidden" // Hiding logic-based drawing for now as exact coordinates require complex ref forwarding
               />
               {/* Use a simpler centered visualizer for the active bit mapping */}
             </svg>
           )}
        </div>

        {/* Input */}
        <div className="bg-slate-800/40 p-4 rounded-xl border border-emerald-500/20 shadow-lg backdrop-blur hover:border-emerald-500/50 transition-colors w-full max-w-sm mx-auto md:mx-0">
           <BitGrid 
             data={input} 
             label="Plaintext (Input)" 
             color="text-emerald-400" 
             interactive
             onBitHover={(idx) => setHoveredIndex(idx)}
             activeBitIndex={activeSource}
           />
        </div>

        {/* Center Animation/Info */}
        <div className="flex flex-col items-center justify-center gap-4 text-center z-20">
            {activeSource !== null && activeTarget !== null ? (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-slate-900/90 border border-accent/50 p-4 rounded-lg shadow-xl"
               >
                 <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Mapping</div>
                 <div className="flex items-center gap-3 text-lg font-mono font-bold">
                    <span className="text-emerald-400">Bit {activeSource + 1}</span>
                    <ArrowDown className="rotate-0 md:-rotate-90 text-slate-500" />
                    <span className="text-blue-400">Bit {activeTarget + 1}</span>
                 </div>
                 <div className="text-xs text-slate-500 mt-2">
                    Value: <span className="text-white">{input[activeSource]}</span>
                 </div>
               </motion.div>
            ) : (
                <div className="opacity-50 flex flex-col items-center">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-2 border-dashed border-slate-600 rounded-full flex items-center justify-center"
                    >
                       <span className="text-[10px] font-bold text-slate-500">IP</span>
                    </motion.div>
                    <ArrowDown className="text-slate-500 animate-bounce mt-2" />
                </div>
            )}
        </div>

        {/* Output */}
        <div className="bg-slate-800/40 p-4 rounded-xl border border-blue-500/20 shadow-lg backdrop-blur hover:border-blue-500/50 transition-colors w-full max-w-sm mx-auto md:mx-0">
            <BitGrid 
              data={output} 
              label="Permuted Output" 
              color="text-blue-400" 
              interactive
              onBitHover={(idx) => idx !== null && setHoveredIndex(idx + 64)}
              activeBitIndex={activeTarget}
            />
        </div>
      </div>
    </div>
  );
};