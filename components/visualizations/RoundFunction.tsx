import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BitGrid } from '../ui/BitGrid';
import { Button } from '../ui/Button';
import { RoundData } from '../../types';
import { S_BOXES } from '../../constants';
import { 
  ArrowRight, 
  ArrowDown, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Zap, 
  Microscope, 
  Info,
  ChevronDown,
  Layers
} from 'lucide-react';

interface RoundFunctionProps {
  round: RoundData;
}

enum RoundStep {
  START = 0,
  EXPANSION = 1,
  XOR_KEY = 2,
  SBOX = 3,
  PBOX = 4,
  XOR_L = 5,
  RESULT = 6
}

export const RoundFunction: React.FC<RoundFunctionProps> = ({ round }) => {
  const [step, setStep] = useState<RoundStep>(RoundStep.START);
  const [autoPlay, setAutoPlay] = useState(false);
  const [selectedSBox, setSelectedSBox] = useState(0);
  const [hoveredSBox, setHoveredSBox] = useState<number | null>(null);
  const [hoveredInputBit, setHoveredInputBit] = useState<{ 
    label: string, 
    index: number, 
    value: string,
    hexChar?: string,
    hexIndex?: number
  } | null>(null);
  const [isSBoxDetailsOpen, setIsSBoxDetailsOpen] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (autoPlay) {
      interval = setInterval(() => {
        setStep(prev => {
          if (prev === RoundStep.RESULT) {
            setAutoPlay(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [autoPlay]);

  useEffect(() => {
    setStep(RoundStep.START);
    setAutoPlay(false);
    setSelectedSBox(0);
    setHoveredSBox(null);
    setHoveredInputBit(null);
    setIsSBoxDetailsOpen(false);
  }, [round]);

  // Auto-open detail view when reaching S-Box step
  useEffect(() => {
    if (step === RoundStep.SBOX) {
      setIsSBoxDetailsOpen(true);
    }
  }, [step]);

  const steps = [
    { title: "Input halves", desc: "L and R are received from the previous round." },
    { title: "Expansion (E)", desc: "R is expanded from 32 to 48 bits." },
    { title: "XOR with Key", desc: "Expanded R is mixed with the round subkey." },
    { title: "S-Box Lookup", desc: "48 bits are substituted back into 32 bits." },
    { title: "Permutation (P)", desc: "The 32-bit output is shuffled." },
    { title: "XOR with Left", desc: "f(R, K) is XORed with original Left half." },
    { title: "Round Final", desc: "Sides are swapped for the next round." }
  ];

  const getSBoxInfo = (idx: number) => {
    const chunk = round.xorResult.substring(idx * 6, (idx + 1) * 6);
    const rowBin = chunk[0] + chunk[5];
    const colBin = chunk.substring(1, 5);
    const row = parseInt(rowBin, 2);
    const col = parseInt(colBin, 2);
    const val = S_BOXES[idx][row][col];
    const outBin = val.toString(2).padStart(4, "0");
    return { chunk, row, col, val, outBin, rowBin, colBin };
  };

  const sInfo = getSBoxInfo(selectedSBox);
  const hoverSBoxInfo = hoveredSBox !== null ? getSBoxInfo(hoveredSBox) : null;
  const activeSBoxIdx = hoveredSBox !== null ? hoveredSBox : selectedSBox;
  const activeSBoxInfo = getSBoxInfo(activeSBoxIdx);

  const getXorHighlights = () => {
    if (hoveredSBox === null) return [];
    const start = hoveredSBox * 6;
    return [0, 1, 2, 3, 4, 5].map(i => start + i);
  };

  const handleInputHover = (label: string, data: string, idx: number | null) => {
    if (idx === null) {
      setHoveredInputBit(null);
      return;
    }
    const hexIndex = Math.floor(idx / 4);
    const chunkStart = hexIndex * 4;
    const chunk = data.substring(chunkStart, chunkStart + 4);
    const hexChar = parseInt(chunk, 2).toString(16).toUpperCase();

    setHoveredInputBit({ 
      label, 
      index: idx, 
      value: data[idx],
      hexChar,
      hexIndex
    });
  };

  return (
    <div className="flex flex-col h-full w-full gap-2 max-w-6xl mx-auto px-1 overflow-hidden">
      {/* Compact Header */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800 shadow-md backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-black text-blue-400 text-lg">
            {round.roundNumber}
          </div>
          <div>
            <h2 className="font-bold text-white text-sm">Feistel Round</h2>
            <div className="flex gap-0.5 mt-0.5">
              {steps.map((_, i) => (
                <div key={i} className={`h-1 w-4 rounded-full transition-colors ${i <= step ? 'bg-blue-500' : 'bg-slate-800'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <SkipBack className="w-3 h-3" />
          </Button>
          <Button 
            size="sm" 
            variant={autoPlay ? 'secondary' : 'primary'} 
            onClick={() => setAutoPlay(!autoPlay)}
            className="px-4 min-w-[80px] h-7 text-xs"
          >
            {autoPlay ? <><Pause className="w-3 h-3 mr-1" /> Pause</> : <><Play className="w-3 h-3 mr-1" /> Auto</>}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setStep(Math.min(6, step + 1))} disabled={step === 6}>
            <SkipForward className="w-3 h-3" />
          </Button>
        </div>

        <div className="hidden md:flex flex-col items-end leading-tight">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{steps[step].title}</span>
          <p className="text-[9px] text-slate-400 text-right truncate max-w-[150px]">{steps[step].desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-2 flex-1 min-h-0 overflow-hidden">
        {/* Main Visualization Area */}
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800/50 p-4 relative overflow-y-auto overflow-x-hidden flex flex-col items-center no-scrollbar">
          <div className="w-full flex justify-between gap-4 mb-2 relative z-10 shrink-0">
            {/* Left Column */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Left (L{round.roundNumber-1})</div>
              <BitGrid 
                data={round.L} 
                columns={8} 
                color="text-blue-500" 
                className="w-full max-w-[140px] scale-90 origin-top" 
                interactive 
                onBitHover={(idx) => handleInputHover('Left Half (L)', round.L, idx)}
              />
              <div className={`h-full w-px border-l border-dashed border-slate-800 transition-colors ${step >= RoundStep.XOR_L ? 'border-blue-500/50' : ''}`} style={{ minHeight: '50px' }} />
            </div>

            {/* Right Column (The Action) */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Right (R{round.roundNumber-1})</div>
              <BitGrid 
                data={round.R} 
                columns={8} 
                color="text-emerald-500" 
                className="w-full max-w-[140px] scale-90 origin-top" 
                interactive 
                onBitHover={(idx) => handleInputHover('Right Half (R)', round.R, idx)}
              />
              
              <div className="flex flex-col items-center w-full gap-2 mt-2 relative">
                <ArrowDown className="text-slate-700 w-3 h-3" />
                
                <div className="w-full bg-slate-800/30 rounded-xl border border-slate-700/50 p-2 space-y-3">
                  <AnimatePresence>
                    {step >= RoundStep.EXPANSION && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-bold text-emerald-400 uppercase">Expansion</span>
                          <span className="text-[8px] text-slate-500">32→48</span>
                        </div>
                        <BitGrid data={round.expandedR} columns={12} color="text-emerald-400" className="scale-[0.85] origin-top-left" interactive />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {step >= RoundStep.XOR_KEY && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1 pt-1 border-t border-slate-700/30">
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-bold text-red-400 uppercase">⊕ Subkey K{round.roundNumber}</span>
                        </div>
                        <BitGrid data={round.subKey} columns={12} color="text-red-400" className="scale-[0.85] origin-top-left" interactive />
                        <div className="h-1 w-px bg-slate-700 mx-auto" />
                        <BitGrid 
                          data={round.xorResult} 
                          columns={12} 
                          color="text-white" 
                          label="Result"
                          className="scale-[0.85] origin-top-left" 
                          interactive 
                          highlightIndices={getXorHighlights()}
                          highlightColor="text-pink-400"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {step >= RoundStep.SBOX && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1 pt-1 border-t border-slate-700/30">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-bold text-indigo-400 uppercase">S-Boxes (48→32)</span>
                        </div>
                        
                        <div className="relative">
                          <BitGrid 
                            data={round.sBoxOutput} 
                            columns={8} 
                            color="text-indigo-400" 
                            className="scale-90 origin-top"
                            interactive
                            onBitHover={(idx) => setHoveredSBox(idx !== null ? Math.floor(idx/4) : null)} 
                          />
                          
                          {/* S-Box Tooltip logic remains same, but CSS adjusted for size if needed */}
                          <AnimatePresence>
                             {hoveredSBox !== null && hoverSBoxInfo && (
                               <motion.div
                                 initial={{ opacity: 0, y: 5 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0 }}
                                 className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 z-[50] bg-slate-900 border border-indigo-500 rounded p-2 shadow-xl text-[10px]"
                               >
                                 <div className="font-bold text-indigo-300">S-Box {hoveredSBox+1}</div>
                                 <div className="text-slate-400">Row: {hoverSBoxInfo.row}, Col: {hoverSBoxInfo.col}</div>
                                 <div className="text-white font-mono">Out: {hoverSBoxInfo.outBin}</div>
                               </motion.div>
                             )}
                          </AnimatePresence>
                        </div>
                        
                        {/* Compact S-Box Details */}
                        <div className="mt-1 border border-indigo-500/20 rounded bg-slate-900/50 overflow-hidden shadow-sm">
                          <button 
                            onClick={() => setIsSBoxDetailsOpen(!isSBoxDetailsOpen)}
                            className="w-full flex items-center justify-between p-1 px-2 text-[9px] font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                               <Layers className="w-3 h-3" />
                               <span>Analysis: S-Box {activeSBoxIdx + 1}</span>
                            </div>
                            <ChevronDown className={`w-3 h-3 transition-transform ${isSBoxDetailsOpen ? 'rotate-180' : ''}`} />
                          </button>
                          
                          <AnimatePresence>
                            {isSBoxDetailsOpen && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-2 grid grid-cols-1 gap-2 border-t border-indigo-500/10">
                                   <div className="flex items-center justify-center gap-2 font-mono text-[10px]">
                                      <div className="flex flex-col items-center">
                                         <span className="text-[8px] text-pink-500 uppercase">Row</span>
                                         <div className="bg-pink-500/10 px-1 rounded border border-pink-500/20 text-pink-300">{activeSBoxInfo.chunk[0]}{activeSBoxInfo.chunk[5]}</div>
                                      </div>
                                      <div className="flex flex-col items-center">
                                         <span className="text-[8px] text-emerald-500 uppercase">Col</span>
                                         <div className="bg-emerald-500/10 px-1 rounded border border-emerald-500/20 text-emerald-300">{activeSBoxInfo.chunk.substring(1,5)}</div>
                                      </div>
                                      <div className="text-slate-500">→</div>
                                      <div className="flex flex-col items-center">
                                         <span className="text-[8px] text-indigo-500 uppercase">Out</span>
                                         <div className="bg-indigo-500/20 px-1 rounded border border-indigo-500/20 text-indigo-200 font-bold">{activeSBoxInfo.outBin}</div>
                                      </div>
                                   </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {step >= RoundStep.PBOX && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1 pt-1 border-t border-slate-700/30">
                        <div className="text-[8px] font-bold text-pink-500 uppercase">Permutation (P)</div>
                        <BitGrid data={round.pBoxOutput} columns={8} color="text-pink-500" className="scale-90 origin-top" interactive />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Result Area */}
          <AnimatePresence>
            {step >= RoundStep.XOR_L && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="w-full mt-2 p-3 bg-slate-900/80 rounded-xl border border-slate-700 flex flex-col items-center gap-2 relative z-20 shrink-0"
              >
                <div className="flex items-center justify-center gap-4 w-full max-w-lg">
                  <div className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[8px] font-bold text-slate-500 uppercase">New L</span>
                    <BitGrid data={round.R} columns={8} color="text-emerald-400" className="scale-75 origin-top" interactive />
                  </div>
                  <div className="flex flex-col items-center">
                    <ArrowRight className="text-slate-700 w-4 h-4" />
                    <Zap className="text-yellow-500 w-4 h-4 my-0.5" />
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[8px] font-bold text-slate-500 uppercase">New R</span>
                    <BitGrid data={round.newR} columns={8} color="text-yellow-400" className="scale-75 origin-top" interactive />
                    <span className="text-[7px] text-slate-600">(= L ⊕ f(R,K))</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Inspector */}
        <div className="flex flex-col gap-2 h-full overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col h-full overflow-hidden">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-2 shrink-0">
              <Microscope className="w-3 h-3 text-primary" />
              Inspector
            </h3>

            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-3">
              <AnimatePresence mode="wait">
                {hoveredInputBit ? (
                   <motion.div 
                     key="input-hover"
                     initial={{ opacity: 0, y: 5 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0 }}
                     className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 shadow-lg"
                   >
                      <div className="space-y-2 bg-slate-900/50 p-2 rounded border border-slate-700/50 text-[10px]">
                        <div className="flex justify-between border-b border-slate-700/50 pb-1">
                           <span className="text-slate-500 font-bold">Register</span>
                           <span className={`font-bold ${hoveredInputBit.label.includes('Left') ? 'text-blue-400' : 'text-emerald-400'}`}>{hoveredInputBit.label}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-700/50 pb-1">
                           <span className="text-slate-500 font-bold">Index</span>
                           <span className="text-white font-mono">{hoveredInputBit.index}</span>
                        </div>
                        <div className="flex justify-between">
                           <span className="text-slate-500 font-bold">Value</span>
                           <span className={`font-mono font-black ${hoveredInputBit.value === '1' ? 'text-white' : 'text-slate-500'}`}>{hoveredInputBit.value}</span>
                        </div>
                      </div>
                   </motion.div>
                ) : step === RoundStep.XOR_KEY ? (
                  <motion.div key="xor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    <div className="p-2 bg-blue-500/5 rounded-lg border border-blue-500/10">
                      <h4 className="text-[9px] font-bold text-blue-400 uppercase mb-1">Mixing</h4>
                      <p className="text-[10px] text-slate-400">48-bit Expansion XORs with 48-bit Subkey.</p>
                    </div>
                  </motion.div>
                ) : step === RoundStep.SBOX ? (
                  <motion.div key="sbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    <div className="p-2 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                      <h4 className="text-[9px] font-bold text-indigo-400 uppercase mb-1">Substitution</h4>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {[...Array(8)].map((_, i) => (
                          <button 
                            key={i} 
                            onClick={() => setSelectedSBox(i)}
                            className={`w-6 h-6 rounded text-[9px] font-bold transition-colors ${selectedSBox === i ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                          >
                            S{i+1}
                          </button>
                        ))}
                      </div>
                      <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-400">
                          <span>In: {sInfo.chunk}</span>
                          <span>Out: {sInfo.outBin}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="empty" className="flex flex-col items-center justify-center h-24 text-slate-600 opacity-50">
                    <Info className="w-6 h-6 mb-1" />
                    <p className="text-[10px]">Hover to inspect</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};