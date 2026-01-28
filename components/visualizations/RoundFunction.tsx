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
  BoxSelect,
  Binary,
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
  
  // Determine which S-Box info to show in the detail section (prefer hover, fallback to selected)
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
    
    // Calculate hex nibble context
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
    <div className="flex flex-col h-full w-full gap-4 max-w-6xl mx-auto px-2">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-black text-blue-400 text-xl">
            {round.roundNumber}
          </div>
          <div>
            <h2 className="font-bold text-white text-lg">Feistel Round</h2>
            <div className="flex gap-1 mt-1">
              {steps.map((_, i) => (
                <div key={i} className={`h-1 w-6 rounded-full transition-colors ${i <= step ? 'bg-blue-500' : 'bg-slate-800'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
          <Button size="sm" variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant={autoPlay ? 'secondary' : 'primary'} 
            onClick={() => setAutoPlay(!autoPlay)}
            className="px-6 min-w-[100px]"
          >
            {autoPlay ? <><Pause className="w-4 h-4 mr-2" /> Pause</> : <><Play className="w-4 h-4 mr-2" /> Auto Step</>}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setStep(Math.min(6, step + 1))} disabled={step === 6}>
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{steps[step].title}</span>
          <p className="text-[10px] text-slate-400 text-right">{steps[step].desc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-4 flex-1 min-h-0">
        <div className="bg-slate-900/40 rounded-3xl border border-slate-800/50 p-6 relative overflow-hidden flex flex-col items-center">
          <div className="w-full flex justify-between gap-12 mb-8 relative z-10">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Left half (L{round.roundNumber-1})</div>
              <BitGrid 
                data={round.L} 
                columns={8} 
                color="text-blue-500" 
                className="w-full max-w-[200px]" 
                interactive 
                onBitHover={(idx) => handleInputHover('Left Half (L)', round.L, idx)}
              />
              <div className={`h-full w-px border-l-2 border-dashed border-slate-800 transition-colors ${step >= RoundStep.XOR_L ? 'border-blue-500/50' : ''}`} />
            </div>

            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Right half (R{round.roundNumber-1})</div>
              <BitGrid 
                data={round.R} 
                columns={8} 
                color="text-emerald-500" 
                className="w-full max-w-[200px]" 
                interactive 
                onBitHover={(idx) => handleInputHover('Right Half (R)', round.R, idx)}
              />
              
              <div className="flex flex-col items-center w-full gap-6 mt-4 relative">
                <ArrowDown className="text-slate-700 w-4 h-4" />
                <div className="w-full bg-slate-800/30 rounded-2xl border border-slate-700/50 p-4 space-y-6">
                  <AnimatePresence>
                    {step >= RoundStep.EXPANSION && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-emerald-400 uppercase">Expansion (E)</span>
                          <span className="text-[9px] text-slate-500">32 → 48 bits</span>
                        </div>
                        <BitGrid data={round.expandedR} columns={12} color="text-emerald-400" className="scale-90" interactive />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {step >= RoundStep.XOR_KEY && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3 pt-2 border-t border-slate-700/30">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 text-xs">⊕</div>
                          <span className="text-[9px] font-bold text-red-400 uppercase">Mixing Subkey K{round.roundNumber}</span>
                        </div>
                        <BitGrid data={round.subKey} columns={12} color="text-red-400" className="scale-90" interactive />
                        <div className="h-2 w-px bg-slate-700 mx-auto" />
                        <BitGrid 
                          data={round.xorResult} 
                          columns={12} 
                          color="text-white" 
                          label={hoveredSBox !== null ? `XOR Result (Input for S${hoveredSBox + 1})` : "XOR Result (S-Box Input)"}
                          className="scale-90" 
                          interactive 
                          highlightIndices={getXorHighlights()}
                          highlightColor="text-pink-400"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {step >= RoundStep.SBOX && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pt-2 border-t border-slate-700/30 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-indigo-400 uppercase">Substitution (S-Boxes)</span>
                          <span className="text-[9px] text-slate-500">48 → 32 bits</span>
                        </div>
                        
                        <div className="relative">
                          <BitGrid 
                            data={round.sBoxOutput} 
                            columns={8} 
                            color="text-indigo-400" 
                            interactive
                            onBitHover={(idx) => setHoveredSBox(idx !== null ? Math.floor(idx/4) : null)} 
                          />
                          
                          <AnimatePresence>
                            {hoveredSBox !== null && hoverSBoxInfo && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 z-[100] bg-slate-900 border border-indigo-500/50 rounded-xl shadow-[0_0_30px_rgba(79,70,229,0.2)] overflow-hidden"
                              >
                                <div className="bg-indigo-600/10 p-2 border-b border-indigo-500/20 flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <BoxSelect className="w-3 h-3 text-indigo-400" />
                                    <span className="text-[10px] font-bold text-indigo-300 uppercase">S-Box {hoveredSBox + 1}</span>
                                  </div>
                                  <span className="text-[9px] text-slate-500 font-mono">Bits {hoveredSBox * 4 + 1}-{hoveredSBox * 4 + 4}</span>
                                </div>
                                <div className="p-3 space-y-3">
                                  <div className="flex justify-between items-center bg-slate-950/50 p-1.5 rounded">
                                    <span className="text-[9px] text-slate-500 uppercase">Input (6-bit)</span>
                                    <span className="text-xs font-mono text-white tracking-widest">
                                      <span className="text-pink-400">{hoverSBoxInfo.chunk[0]}</span>
                                      {hoverSBoxInfo.chunk.substring(1, 5)}
                                      <span className="text-pink-400">{hoverSBoxInfo.chunk[5]}</span>
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-pink-500/5 p-1.5 rounded border border-pink-500/10">
                                      <div className="text-[8px] text-pink-400 uppercase mb-0.5">Row</div>
                                      <div className="font-mono text-[10px] text-white flex justify-between">
                                        <span>{hoverSBoxInfo.rowBin}</span>
                                        <span className="font-bold">{hoverSBoxInfo.row}</span>
                                      </div>
                                    </div>
                                    <div className="bg-emerald-500/5 p-1.5 rounded border border-emerald-500/10">
                                      <div className="text-[8px] text-emerald-400 uppercase mb-0.5">Col</div>
                                      <div className="font-mono text-[10px] text-white flex justify-between">
                                        <span>{hoverSBoxInfo.colBin}</span>
                                        <span className="font-bold">{hoverSBoxInfo.col}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                                    <span className="text-[9px] text-indigo-400 uppercase font-bold">Output</span>
                                    <span className="text-xs font-mono font-black text-white bg-indigo-600 px-2 py-0.5 rounded shadow-lg shadow-indigo-500/20">
                                      {hoverSBoxInfo.outBin}
                                    </span>
                                  </div>
                                </div>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-indigo-500/50 rotate-45"></div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        {/* Expandable S-Box Details */}
                        <div className="mt-3 border border-indigo-500/20 rounded-xl bg-slate-900/50 overflow-hidden shadow-sm">
                          <button 
                            onClick={() => setIsSBoxDetailsOpen(!isSBoxDetailsOpen)}
                            className="w-full flex items-center justify-between p-2 px-3 text-[10px] font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                          >
                            <div className="flex items-center gap-2">
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
                                <div className="p-3 grid grid-cols-1 gap-3 border-t border-indigo-500/10">
                                   {/* Visualization of 6 bits splitting into Row/Col */}
                                   <div className="flex items-center justify-center gap-2 font-mono text-xs">
                                      {/* Bit 1 (Row) */}
                                      <div className="flex flex-col items-center gap-1">
                                         <span className="text-[8px] text-pink-500 uppercase font-bold">b1</span>
                                         <span className="w-6 h-6 flex items-center justify-center rounded bg-pink-500/10 border border-pink-500/30 text-pink-400 font-bold shadow-sm">{activeSBoxInfo.chunk[0]}</span>
                                      </div>
                                      {/* Bits 2-5 (Col) */}
                                      <div className="flex flex-col items-center gap-1">
                                         <span className="text-[8px] text-emerald-500 uppercase font-bold">b2..b5</span>
                                         <div className="flex gap-0.5 px-1 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold shadow-sm h-6 items-center">
                                            {activeSBoxInfo.chunk.slice(1, 5).split('').map((b, i) => <span key={i} className="w-4 text-center">{b}</span>)}
                                         </div>
                                      </div>
                                      {/* Bit 6 (Row) */}
                                      <div className="flex flex-col items-center gap-1">
                                         <span className="text-[8px] text-pink-500 uppercase font-bold">b6</span>
                                         <span className="w-6 h-6 flex items-center justify-center rounded bg-pink-500/10 border border-pink-500/30 text-pink-400 font-bold shadow-sm">{activeSBoxInfo.chunk[5]}</span>
                                      </div>
                                   </div>

                                   <div className="grid grid-cols-2 gap-2 text-[10px]">
                                      <div className="bg-slate-800/50 p-2 rounded text-center border border-pink-500/10">
                                         <div className="text-pink-500/70 mb-0.5 uppercase text-[8px] font-bold">Row Calc</div>
                                         <div className="font-mono font-bold text-pink-300">
                                            <span className="text-slate-500">{activeSBoxInfo.chunk[0]}</span>
                                            <span className="text-slate-500">{activeSBoxInfo.chunk[5]}</span>
                                            <span className="mx-1">=</span>
                                            {activeSBoxInfo.rowBin} ({activeSBoxInfo.row})
                                         </div>
                                      </div>
                                      <div className="bg-slate-800/50 p-2 rounded text-center border border-emerald-500/10">
                                         <div className="text-emerald-500/70 mb-0.5 uppercase text-[8px] font-bold">Col Calc</div>
                                         <div className="font-mono font-bold text-emerald-300">
                                            <span className="text-slate-500">{activeSBoxInfo.chunk.substring(1, 5)}</span>
                                            <span className="mx-1">=</span>
                                            {activeSBoxInfo.colBin} ({activeSBoxInfo.col})
                                         </div>
                                      </div>
                                   </div>

                                   <div className="flex items-center gap-2 pt-2 border-t border-indigo-500/20">
                                      <span className="text-[10px] text-indigo-400 font-bold whitespace-nowrap uppercase">Output (4-bit)</span>
                                      <div className="h-px bg-indigo-500/20 flex-1"></div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] text-indigo-300">Val: {activeSBoxInfo.val}</span>
                                        <span className="font-mono font-black text-white bg-indigo-600 px-2 py-0.5 rounded text-xs shadow-lg shadow-indigo-500/20">
                                           {activeSBoxInfo.outBin}
                                        </span>
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
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pt-2 border-t border-slate-700/30">
                        <div className="text-[9px] font-bold text-pink-500 uppercase">Permutation (P)</div>
                        <BitGrid data={round.pBoxOutput} columns={8} color="text-pink-500" interactive />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {step >= RoundStep.XOR_L && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }} 
                animate={{ opacity: 1, y: 0 }}
                className="w-full mt-4 p-6 bg-slate-900/80 rounded-2xl border border-slate-700 flex flex-col items-center gap-4 relative z-20"
              >
                <div className="flex items-center justify-center gap-8 w-full max-w-lg">
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">New L</span>
                    <BitGrid data={round.R} columns={8} color="text-emerald-400" interactive />
                    <span className="text-[8px] text-slate-600 mt-1">(= Previous R)</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <ArrowRight className="text-slate-700" />
                    <Zap className="text-yellow-500 w-5 h-5 my-1" />
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">New R</span>
                    <BitGrid data={round.newR} columns={8} color="text-yellow-400" interactive />
                    <span className="text-[8px] text-slate-600 mt-1">(= L ⊕ f(R,K))</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col h-full overflow-hidden">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
              <Microscope className="w-4 h-4 text-primary" />
              Live Inspector
            </h3>

            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-6">
              <AnimatePresence mode="wait">
                {hoveredInputBit ? (
                   <motion.div 
                     key="input-hover"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 shadow-lg"
                   >
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                        <Info className="w-3 h-3" /> Bit Inspector
                      </h4>
                      <div className="space-y-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                        <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                           <span className="text-[10px] text-slate-500 uppercase font-bold">Register</span>
                           <span className={`text-xs font-bold ${hoveredInputBit.label.includes('Left') ? 'text-blue-400' : 'text-emerald-400'}`}>{hoveredInputBit.label}</span>
                        </div>
                         <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                           <span className="text-[10px] text-slate-500 uppercase font-bold">Index (0-based)</span>
                           <span className="text-xs font-mono text-white">{hoveredInputBit.index}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
                           <span className="text-[10px] text-slate-500 uppercase font-bold">Hex Context</span>
                           <span className="text-xs font-mono text-white flex items-center gap-1">
                             Nibble {hoveredInputBit.hexIndex} 
                             <span className="text-slate-600">|</span> 
                             <span className="text-warning font-bold">0x{hoveredInputBit.hexChar}</span>
                           </span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] text-slate-500 uppercase font-bold">Value</span>
                           <div className={`flex items-center gap-2 text-sm font-mono font-black ${hoveredInputBit.value === '1' ? 'text-white' : 'text-slate-500'}`}>
                             {hoveredInputBit.value}
                             <Binary className="w-3 h-3 opacity-50" />
                           </div>
                        </div>
                      </div>
                   </motion.div>
                ) : step === RoundStep.XOR_KEY ? (
                  <motion.div key="xor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                      <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-2">Mixing Logic</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        The 48 bits from the expansion step are XORed with the round subkey. 
                        XOR returns 1 only if bits differ.
                      </p>
                    </div>
                    <div className="space-y-2 font-mono text-[10px] bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                      <div className="flex justify-between"><span className="text-slate-500">Exp R bit:</span> <span className="text-emerald-400 font-bold">{round.expandedR[0]}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Key bit:</span> <span className="text-red-400 font-bold">{round.subKey[0]}</span></div>
                      <div className="border-t border-slate-700 my-1 pt-1 flex justify-between"><span className="text-white">Result:</span> <span className="text-white font-black">{round.xorResult[0]}</span></div>
                    </div>
                  </motion.div>
                ) : step === RoundStep.SBOX ? (
                  <motion.div key="sbox" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase mb-2">S-Box Lookup</h4>
                      <div className="flex gap-1 mb-2">
                        {[...Array(8)].map((_, i) => (
                          <button 
                            key={i} 
                            onClick={() => setSelectedSBox(i)}
                            onMouseEnter={() => setHoveredSBox(i)}
                            onMouseLeave={() => setHoveredSBox(null)}
                            className={`flex-1 py-1 rounded text-[8px] font-bold transition-colors ${selectedSBox === i ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                          >
                            S{i+1}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        6 bits are compressed to 4 bits. Row is bits 1 & 6, Column is bits 2-5.
                      </p>
                      
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">Input:</span>
                          <span className="font-mono text-xs text-indigo-300 tracking-widest">
                            <span className="text-pink-500">{sInfo.chunk[0]}</span>
                            {sInfo.chunk.substring(1, 5)}
                            <span className="text-pink-500">{sInfo.chunk[5]}</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-pink-500/5 p-2 rounded border border-pink-500/20">
                            <div className="text-[8px] text-pink-400 uppercase mb-1">Row</div>
                            <div className="font-mono font-bold text-white">{sInfo.rowBin} → {sInfo.row}</div>
                          </div>
                          <div className="bg-emerald-500/5 p-2 rounded border border-emerald-500/20">
                            <div className="text-[8px] text-emerald-400 uppercase mb-1">Col</div>
                            <div className="font-mono font-bold text-white">{sInfo.colBin} → {sInfo.col}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                          <span className="text-[10px] text-indigo-400 font-bold">Value:</span>
                          <span className="font-mono font-black text-white bg-indigo-600 px-2 rounded">{sInfo.val} ({sInfo.outBin})</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="empty" className="flex flex-col items-center justify-center h-48 text-slate-600 opacity-50">
                    <Info className="w-8 h-8 mb-2" />
                    <p className="text-xs">Step through to see details</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span>Data Processed</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};