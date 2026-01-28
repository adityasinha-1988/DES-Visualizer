import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BitGrid } from '../ui/BitGrid';
import { Button } from '../ui/Button';
import { DESState } from '../../types';
import { 
  ChevronRight, 
  ChevronLeft, 
  Key, 
  ArrowDown, 
  RefreshCw, 
  ArrowRight,
  Zap,
  Microscope,
  BoxSelect,
  Play,
  Pause,
  Info
} from 'lucide-react';

interface KeyScheduleProps {
  desState: DESState;
}

enum KeyViewStep {
  PC1 = 0,
  GENERATE = 1
}

export const KeySchedule: React.FC<KeyScheduleProps> = ({ desState }) => {
  const [viewStep, setViewStep] = useState<KeyViewStep>(KeyViewStep.PC1);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredBit, setHoveredBit] = useState<{ name: string, index: number, value: string } | null>(null);

  const currentStep = desState.keyGenSteps[currentRoundIdx];

  const nextRound = () => setCurrentRoundIdx(prev => Math.min(prev + 1, 15));
  const prevRound = () => setCurrentRoundIdx(prev => Math.max(prev - 1, 0));

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAnimating) {
      interval = setInterval(() => {
        setCurrentRoundIdx(prev => {
          if (prev >= 15) {
            setIsAnimating(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isAnimating]);

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-4 gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 shadow-xl backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-warning/20 border border-warning/30 rounded-xl flex items-center justify-center">
            <Key className="text-warning w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white leading-tight">Key Schedule</h2>
            <p className="text-xs text-slate-400 font-medium">Generating 16 Subkeys from Original 64-bit Key</p>
          </div>
        </div>

        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
          <button 
            onClick={() => setViewStep(KeyViewStep.PC1)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewStep === KeyViewStep.PC1 ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            PC-1 Initialization
          </button>
          <button 
            onClick={() => setViewStep(KeyViewStep.GENERATE)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewStep === KeyViewStep.GENERATE ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Round Generation
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {viewStep === KeyViewStep.PC1 ? (
            <motion.div 
              key="pc1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 items-center h-full"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <Zap className="w-4 h-4 text-warning" />
                   <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Step 1: Input Key</h3>
                </div>
                <BitGrid data={desState.binaryKey} label="Original 64-bit Key" color="text-warning" interactive />
                <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700 text-xs text-slate-400 leading-relaxed">
                   The original key is 64 bits. Every 8th bit (8, 16, ..., 64) is a parity bit and is dropped during the PC-1 permutation step.
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-primary/50 flex items-center justify-center text-primary font-bold shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                   PC-1
                 </div>
                 <ArrowRight className="text-slate-700 hidden lg:block" />
                 <ArrowDown className="text-slate-700 lg:hidden" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <RefreshCw className="w-4 h-4 text-emerald-400" />
                   <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Step 2: 56-bit Key</h3>
                </div>
                <BitGrid data={desState.pc1Output} label="Permuted Choice 1 (56-bit)" color="text-emerald-400" interactive />
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-blue-400 block mb-1 uppercase text-center">Register C0</span>
                      <span className="text-[10px] text-slate-400 text-center block">First 28 bits</span>
                   </div>
                   <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl">
                      <span className="text-[10px] font-bold text-purple-400 block mb-1 uppercase text-center">Register D0</span>
                      <span className="text-[10px] text-slate-400 text-center block">Last 28 bits</span>
                   </div>
                </div>
                <Button className="w-full" onClick={() => setViewStep(KeyViewStep.GENERATE)}>
                   Start Generation <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="gen"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full gap-4"
            >
              {/* Round Selector Bar */}
              <div className="flex items-center justify-between bg-slate-800/30 p-2 rounded-xl border border-slate-700/50">
                 <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={prevRound} disabled={currentRoundIdx === 0}>
                       <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-md">
                       {[...Array(16)].map((_, i) => (
                         <button 
                           key={i} 
                           onClick={() => { setCurrentRoundIdx(i); setIsAnimating(false); }}
                           className={`w-6 h-6 shrink-0 rounded-md text-[10px] font-bold transition-all ${currentRoundIdx === i ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-slate-700/50 text-slate-500 hover:bg-slate-700'}`}
                         >
                           {i + 1}
                         </button>
                       ))}
                    </div>
                    <Button size="sm" variant="ghost" onClick={nextRound} disabled={currentRoundIdx === 15}>
                       <ChevronRight className="w-4 h-4" />
                    </Button>
                 </div>
                 <Button 
                   size="sm" 
                   variant={isAnimating ? 'secondary' : 'outline'} 
                   onClick={() => setIsAnimating(!isAnimating)}
                 >
                   {isAnimating ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                   {isAnimating ? 'Pause' : 'Auto Play'}
                 </Button>
              </div>

              {/* Step Detail Area */}
              <div className="grid lg:grid-cols-[1fr_300px] gap-6 flex-1 min-h-0 overflow-hidden">
                 <div className="bg-slate-950/30 rounded-3xl border border-slate-800/50 p-6 flex flex-col items-center justify-center relative overflow-y-auto no-scrollbar">
                    <div className="w-full max-w-2xl space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest text-center">C (Round {currentRoundIdx})</div>
                             <BitGrid 
                               data={currentStep.cBefore} 
                               columns={7} 
                               color="text-blue-400" 
                               interactive 
                               onBitHover={(idx) => idx !== null ? setHoveredBit({ name: 'C', index: idx, value: currentStep.cBefore[idx] }) : setHoveredBit(null)}
                             />
                          </div>
                          <div className="space-y-2">
                             <div className="text-[10px] font-bold text-purple-500 uppercase tracking-widest text-center">D (Round {currentRoundIdx})</div>
                             <BitGrid 
                               data={currentStep.dBefore} 
                               columns={7} 
                               color="text-purple-400" 
                               interactive 
                               onBitHover={(idx) => idx !== null ? setHoveredBit({ name: 'D', index: idx, value: currentStep.dBefore[idx] }) : setHoveredBit(null)}
                             />
                          </div>
                       </div>

                       <div className="flex flex-col items-center gap-2">
                          <div className="h-6 w-px bg-slate-800 relative">
                             <motion.div 
                               animate={{ y: [0, 24], opacity: [0, 1, 0] }}
                               transition={{ repeat: Infinity, duration: 1 }}
                               className="absolute -left-1 w-2 h-2 bg-primary rounded-full blur-[1px]"
                             />
                          </div>
                          <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-3">
                             <RefreshCw className="w-3 h-3 text-primary animate-spin-slow" />
                             <span className="text-[10px] font-bold text-primary uppercase">Rotate Left ({currentStep.shiftAmount})</span>
                          </div>
                          <div className="h-6 w-px bg-slate-800" />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <BitGrid 
                               data={currentStep.cAfter} 
                               columns={7} 
                               color="text-emerald-400" 
                               interactive 
                               onBitHover={(idx) => idx !== null ? setHoveredBit({ name: "C'", index: idx, value: currentStep.cAfter[idx] }) : setHoveredBit(null)}
                             />
                             <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest text-center">C'</div>
                          </div>
                          <div className="space-y-2">
                             <BitGrid 
                               data={currentStep.dAfter} 
                               columns={7} 
                               color="text-pink-400" 
                               interactive 
                               onBitHover={(idx) => idx !== null ? setHoveredBit({ name: "D'", index: idx, value: currentStep.dAfter[idx] }) : setHoveredBit(null)}
                             />
                             <div className="text-[10px] font-bold text-pink-500 uppercase tracking-widest text-center">D'</div>
                          </div>
                       </div>

                       <div className="pt-4 border-t border-slate-800 flex flex-col items-center">
                          <div className="flex items-center gap-3 mb-2">
                             <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[8px] font-bold">PC-2</div>
                             <ArrowRight className="text-slate-700 w-3 h-3" />
                             <div className="bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg">
                                <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Subkey K{currentRoundIdx + 1}</span>
                             </div>
                          </div>
                          <BitGrid data={currentStep.subKey} columns={12} color="text-red-400" interactive />
                       </div>
                    </div>
                 </div>

                 {/* Inspector / Sidebar */}
                 <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                       <div className="flex items-center gap-2 mb-2">
                          <Microscope className="w-4 h-4 text-primary" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-widest">Logic Insight</h4>
                       </div>
                       
                       <AnimatePresence mode="wait">
                          {hoveredBit ? (
                            <motion.div 
                              key="bit-info"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                            >
                               <div className="flex items-center gap-2 mb-2">
                                  <Info className="w-3 h-3 text-indigo-400" />
                                  <h5 className="text-[10px] font-bold text-indigo-400 uppercase">Selected Bit</h5>
                               </div>
                               <div className="space-y-2 font-mono text-xs">
                                  <div className="flex justify-between items-center border-b border-indigo-500/10 pb-1">
                                    <span className="text-slate-400">Register</span>
                                    <span className="text-white font-bold">{hoveredBit.name}</span>
                                  </div>
                                  <div className="flex justify-between items-center border-b border-indigo-500/10 pb-1">
                                    <span className="text-slate-400">Index</span>
                                    <span className="text-white font-bold">{hoveredBit.index}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Value</span>
                                    <span className={`font-bold ${hoveredBit.value === '1' ? 'text-white' : 'text-slate-500'}`}>{hoveredBit.value}</span>
                                  </div>
                               </div>
                            </motion.div>
                          ) : (
                            <motion.div key="default-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                 <h5 className="text-[10px] font-bold text-slate-300 uppercase mb-1">Circular Shift</h5>
                                 <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Registers C and D shift left by {currentStep.shiftAmount} bit(s). 
                                    1-bit shifts happen in rounds 1, 2, 9, 16.
                                 </p>
                              </div>

                              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                 <h5 className="text-[10px] font-bold text-slate-300 uppercase mb-1">PC-2 Permutation</h5>
                                 <p className="text-[11px] text-slate-400 leading-relaxed">
                                    C and D are combined into 56 bits, then compressed to 48 bits using the PC-2 table.
                                 </p>
                              </div>
                            </motion.div>
                          )}
                       </AnimatePresence>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-hidden">
                       <div className="flex items-center gap-2 mb-3">
                          <BoxSelect className="w-4 h-4 text-warning" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-widest">Subkeys (Hex)</h4>
                       </div>
                       <div className="space-y-1 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                          {desState.subKeys.map((k, i) => (
                             <div 
                               key={i} 
                               className={`flex items-center justify-between p-2 rounded-lg text-[10px] font-mono transition-colors ${currentRoundIdx === i ? 'bg-primary/20 text-white' : 'text-slate-500'}`}
                             >
                                <span className="opacity-50">K{i+1}</span>
                                <span className={currentRoundIdx === i ? 'text-blue-400 font-bold' : ''}>
                                   {parseInt(k, 2).toString(16).toUpperCase().padStart(12, '0')}
                                </span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};