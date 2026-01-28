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
  Pause
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
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-2 gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 shadow-xl backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-warning/20 border border-warning/30 rounded-lg flex items-center justify-center">
            <Key className="text-warning w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white leading-tight">Key Schedule</h2>
            <p className="text-[10px] text-slate-400 font-medium">16 Subkeys from 64-bit Key</p>
          </div>
        </div>

        <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
          <button 
            onClick={() => setViewStep(KeyViewStep.PC1)}
            className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${viewStep === KeyViewStep.PC1 ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Initialization
          </button>
          <button 
            onClick={() => setViewStep(KeyViewStep.GENERATE)}
            className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${viewStep === KeyViewStep.GENERATE ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Generation
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {viewStep === KeyViewStep.PC1 ? (
            <motion.div 
              key="pc1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid lg:grid-cols-[1fr_auto_1fr] gap-4 items-center h-full overflow-y-auto"
            >
              <div className="space-y-3 bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                <div className="flex items-center gap-2 mb-1">
                   <Zap className="w-4 h-4 text-warning" />
                   <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Input Key</h3>
                </div>
                <BitGrid data={desState.binaryKey} label="Original 64-bit Key" color="text-warning" interactive className="scale-95 origin-top-left" />
                <div className="text-[10px] text-slate-500 leading-relaxed">
                   Parity bits (8, 16, ..., 64) are dropped.
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-2">
                 <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-primary/50 flex items-center justify-center text-primary text-sm font-bold shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                   PC-1
                 </div>
                 <ArrowDown className="text-slate-700 w-4 h-4" />
              </div>

              <div className="space-y-3 bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                <div className="flex items-center gap-2 mb-1">
                   <RefreshCw className="w-4 h-4 text-emerald-400" />
                   <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">56-bit Key</h3>
                </div>
                <BitGrid data={desState.pc1Output} label="Permuted Choice 1" color="text-emerald-400" interactive className="scale-95 origin-top-left" />
                <div className="grid grid-cols-2 gap-2">
                   <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg">
                      <span className="text-[9px] font-bold text-blue-400 block uppercase text-center">C0 (28 bits)</span>
                   </div>
                   <div className="bg-purple-500/10 border border-purple-500/20 p-2 rounded-lg">
                      <span className="text-[9px] font-bold text-purple-400 block uppercase text-center">D0 (28 bits)</span>
                   </div>
                </div>
                <Button className="w-full text-xs py-2" onClick={() => setViewStep(KeyViewStep.GENERATE)}>
                   Go to Generation <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="gen"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full gap-3"
            >
              {/* Round Selector Bar */}
              <div className="flex items-center justify-between bg-slate-800/30 p-1.5 rounded-lg border border-slate-700/50 shrink-0">
                 <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={prevRound} disabled={currentRoundIdx === 0}>
                       <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <div className="flex gap-0.5 overflow-x-auto no-scrollbar max-w-[150px] sm:max-w-md">
                       {[...Array(16)].map((_, i) => (
                         <button 
                           key={i} 
                           onClick={() => { setCurrentRoundIdx(i); setIsAnimating(false); }}
                           className={`w-5 h-5 shrink-0 rounded text-[9px] font-bold transition-all ${currentRoundIdx === i ? 'bg-primary text-white shadow' : 'bg-slate-700/50 text-slate-500 hover:bg-slate-700'}`}
                         >
                           {i + 1}
                         </button>
                       ))}
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={nextRound} disabled={currentRoundIdx === 15}>
                       <ChevronRight className="w-3 h-3" />
                    </Button>
                 </div>
                 <Button 
                   size="sm" 
                   className="h-6 text-[10px] px-2"
                   variant={isAnimating ? 'secondary' : 'outline'} 
                   onClick={() => setIsAnimating(!isAnimating)}
                 >
                   {isAnimating ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                   {isAnimating ? 'Pause' : 'Auto'}
                 </Button>
              </div>

              {/* Step Detail Area */}
              <div className="grid lg:grid-cols-[1fr_240px] gap-3 flex-1 min-h-0 overflow-hidden">
                 <div className="bg-slate-950/30 rounded-2xl border border-slate-800/50 p-4 flex flex-col items-center justify-start overflow-y-auto no-scrollbar">
                    <div className="w-full max-w-xl space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <div className="text-[9px] font-bold text-blue-500 uppercase tracking-widest text-center">C (Round {currentRoundIdx})</div>
                             <BitGrid 
                               data={currentStep.cBefore} 
                               columns={7} 
                               color="text-blue-400" 
                               interactive 
                               className="scale-90 origin-top"
                               onBitHover={(idx) => idx !== null ? setHoveredBit({ name: 'C', index: idx, value: currentStep.cBefore[idx] }) : setHoveredBit(null)}
                             />
                          </div>
                          <div className="space-y-1">
                             <div className="text-[9px] font-bold text-purple-500 uppercase tracking-widest text-center">D (Round {currentRoundIdx})</div>
                             <BitGrid 
                               data={currentStep.dBefore} 
                               columns={7} 
                               color="text-purple-400" 
                               interactive 
                               className="scale-90 origin-top"
                               onBitHover={(idx) => idx !== null ? setHoveredBit({ name: 'D', index: idx, value: currentStep.dBefore[idx] }) : setHoveredBit(null)}
                             />
                          </div>
                       </div>

                       <div className="flex flex-col items-center gap-1">
                          <div className="h-4 w-px bg-slate-800 relative"></div>
                          <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-2">
                             <RefreshCw className="w-3 h-3 text-primary" />
                             <span className="text-[9px] font-bold text-primary uppercase">Rotate Left ({currentStep.shiftAmount})</span>
                          </div>
                          <div className="h-4 w-px bg-slate-800" />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <BitGrid 
                               data={currentStep.cAfter} 
                               columns={7} 
                               color="text-emerald-400" 
                               interactive 
                               className="scale-90 origin-top"
                               onBitHover={(idx) => idx !== null ? setHoveredBit({ name: "C'", index: idx, value: currentStep.cAfter[idx] }) : setHoveredBit(null)}
                             />
                             <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest text-center">C'</div>
                          </div>
                          <div className="space-y-1">
                             <BitGrid 
                               data={currentStep.dAfter} 
                               columns={7} 
                               color="text-pink-400" 
                               interactive 
                               className="scale-90 origin-top"
                               onBitHover={(idx) => idx !== null ? setHoveredBit({ name: "D'", index: idx, value: currentStep.dAfter[idx] }) : setHoveredBit(null)}
                             />
                             <div className="text-[9px] font-bold text-pink-500 uppercase tracking-widest text-center">D'</div>
                          </div>
                       </div>

                       <div className="pt-2 border-t border-slate-800 flex flex-col items-center">
                          <div className="flex items-center gap-2 mb-2">
                             <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[7px] font-bold">PC-2</div>
                             <ArrowRight className="text-slate-700 w-3 h-3" />
                             <div className="bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                                <span className="text-[9px] font-bold text-red-400 uppercase">Subkey K{currentRoundIdx + 1}</span>
                             </div>
                          </div>
                          <BitGrid data={currentStep.subKey} columns={12} color="text-red-400" interactive className="scale-90 origin-top" />
                       </div>
                    </div>
                 </div>

                 {/* Inspector / Sidebar */}
                 <div className="flex flex-col gap-3 overflow-hidden">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2 flex-shrink-0">
                       <div className="flex items-center gap-2">
                          <Microscope className="w-3 h-3 text-primary" />
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Logic Insight</h4>
                       </div>
                       
                       <AnimatePresence mode="wait">
                          {hoveredBit ? (
                            <motion.div 
                              key="bit-info"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="p-2 bg-indigo-500/10 rounded border border-indigo-500/20 text-[10px]"
                            >
                               <div className="flex justify-between border-b border-indigo-500/10 pb-1 mb-1">
                                 <span className="text-slate-400">Reg</span>
                                 <span className="text-white font-bold">{hoveredBit.name}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-slate-400">Idx: {hoveredBit.index}</span>
                                 <span className="text-white font-bold">{hoveredBit.value}</span>
                               </div>
                            </motion.div>
                          ) : (
                            <motion.div key="default-info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                              <div className="p-2 bg-slate-800/50 rounded border border-slate-700/50">
                                 <h5 className="text-[9px] font-bold text-slate-300 uppercase">Circular Shift</h5>
                                 <p className="text-[10px] text-slate-400">
                                    Left shift by {currentStep.shiftAmount}.
                                 </p>
                              </div>
                            </motion.div>
                          )}
                       </AnimatePresence>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 overflow-hidden flex-1 flex flex-col">
                       <div className="flex items-center gap-2 mb-2 shrink-0">
                          <BoxSelect className="w-3 h-3 text-warning" />
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Subkeys</h4>
                       </div>
                       <div className="space-y-0.5 overflow-y-auto pr-1 no-scrollbar flex-1">
                          {desState.subKeys.map((k, i) => (
                             <div 
                               key={i} 
                               className={`flex items-center justify-between p-1.5 rounded text-[9px] font-mono transition-colors ${currentRoundIdx === i ? 'bg-primary/20 text-white' : 'text-slate-600'}`}
                             >
                                <span className="opacity-50">K{i+1}</span>
                                <span className={currentRoundIdx === i ? 'text-blue-400 font-bold' : ''}>
                                   {parseInt(k, 2).toString(16).toUpperCase().padStart(12, '0').substring(0, 8)}...
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