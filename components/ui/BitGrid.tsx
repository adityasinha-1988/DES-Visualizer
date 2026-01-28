import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BitGridProps {
  data: string; // binary string
  label?: string;
  columns?: number;
  highlightIndices?: number[];
  color?: string;
  className?: string;
  hexPreview?: boolean;
  onBitHover?: (index: number | null) => void;
  activeBitIndex?: number | null;
  interactive?: boolean;
  highlightColor?: string; // Optional custom text color for highlighted bits
}

export const BitGrid: React.FC<BitGridProps> = ({ 
  data, 
  label, 
  columns = 8, 
  highlightIndices = [], 
  color = "text-primary",
  className = "",
  hexPreview = false,
  onBitHover,
  activeBitIndex,
  interactive = false,
  highlightColor = "text-pink-400"
}) => {
  const [internalHoverIdx, setInternalHoverIdx] = useState<number | null>(null);

  // Convert binary to hex for preview if needed
  const hexVal = hexPreview ? parseInt(data, 2).toString(16).toUpperCase() : '';

  const handleMouseEnter = (idx: number) => {
    if (interactive) {
      setInternalHoverIdx(idx);
      onBitHover?.(idx);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setInternalHoverIdx(null);
      onBitHover?.(null);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <div className="flex justify-between items-end px-1">
           <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors ${highlightIndices.length > 0 ? highlightColor : 'text-slate-400'}`}>{label}</span>
           {hexPreview && <span className="text-[10px] sm:text-xs font-mono text-emerald-400 opacity-70">0x{hexVal}</span>}
        </div>
      )}
      <div 
        className="grid gap-1.5 p-3 bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-inner relative"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        onMouseLeave={handleMouseLeave}
      >
        {data.split('').map((bit, idx) => {
          const isHighlighted = highlightIndices.includes(idx);
          const isActive = activeBitIndex === idx || internalHoverIdx === idx;
          
          return (
            <div key={idx} className="relative group/bit">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: isActive ? 1.25 : isHighlighted ? 1.1 : 1,
                  backgroundColor: isActive 
                    ? 'rgba(59, 130, 246, 0.6)' 
                    : isHighlighted 
                      ? 'rgba(236, 72, 153, 0.25)' // Pink tint for highlighted
                      : 'rgba(30, 41, 59, 0.3)',
                  borderColor: isActive 
                    ? '#60a5fa' 
                    : isHighlighted 
                      ? '#ec4899' // Pink border
                      : 'transparent',
                  zIndex: isActive ? 10 : isHighlighted ? 5 : 1
                }}
                whileHover={interactive ? { scale: 1.25, backgroundColor: 'rgba(59, 130, 246, 0.5)' } : {}}
                transition={{ duration: 0.15 }}
                onMouseEnter={() => handleMouseEnter(idx)}
                className={`
                  flex items-center justify-center aspect-square text-[10px] sm:text-xs font-mono rounded cursor-default border
                  ${bit === '1' ? 'font-bold' : 'opacity-40'}
                  ${isActive ? 'text-white' : isHighlighted ? highlightColor : color}
                  ${interactive ? 'cursor-pointer' : ''}
                `}
              >
                {bit}
              </motion.div>

              {/* Subtle Bit Tooltip */}
              <AnimatePresence>
                {interactive && internalHoverIdx === idx && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.8 }}
                    animate={{ opacity: 1, y: -25, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.8 }}
                    className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-[100] bg-slate-950 border border-blue-500/50 px-2 py-0.5 rounded shadow-2xl whitespace-nowrap"
                  >
                    <span className="text-[9px] font-mono text-blue-400">Idx:{idx}</span>
                    <span className="mx-1 text-slate-700">|</span>
                    <span className="text-[9px] font-mono text-white">Val:{bit}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};