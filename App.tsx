import React, { useState, useEffect } from 'react';
import { runDES } from './utils/des';
import { AppStep, DESState } from './types';
import { InitialPermutation } from './components/visualizations/InitialPermutation';
import { KeySchedule } from './components/visualizations/KeySchedule';
import { RoundFunction } from './components/visualizations/RoundFunction';
import { BitGrid } from './components/ui/BitGrid';
import { Button } from './components/ui/Button';
import { Play, SkipForward, SkipBack, RotateCcw, Lock } from 'lucide-react';

const DEFAULT_PLAIN = "123456ABCD132536";
const DEFAULT_KEY = "AABB09182736CCDD";

const App = () => {
  const [plainInput, setPlainInput] = useState(DEFAULT_PLAIN);
  const [keyInput, setKeyInput] = useState(DEFAULT_KEY);
  const [desState, setDesState] = useState<DESState | null>(null);
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.INPUT);
  const [currentRound, setCurrentRound] = useState(1);

  useEffect(() => {
    try {
      const state = runDES(plainInput, keyInput);
      setDesState(state);
    } catch (e) {
      console.error("Invalid hex input");
    }
  }, [plainInput, keyInput]);

  const handleNext = () => {
    if (currentStep === AppStep.INPUT) setCurrentStep(AppStep.IP);
    else if (currentStep === AppStep.IP) setCurrentStep(AppStep.KEY_GEN);
    else if (currentStep === AppStep.KEY_GEN) {
      setCurrentStep(AppStep.ROUNDS);
      setCurrentRound(1);
    }
    else if (currentStep === AppStep.ROUNDS) {
      if (currentRound < 16) setCurrentRound(p => p + 1);
      else setCurrentStep(AppStep.FP);
    }
  };

  const handlePrev = () => {
    if (currentStep === AppStep.FP) {
      setCurrentStep(AppStep.ROUNDS);
      setCurrentRound(16);
    } else if (currentStep === AppStep.ROUNDS) {
      if (currentRound > 1) setCurrentRound(p => p - 1);
      else setCurrentStep(AppStep.KEY_GEN);
    } else if (currentStep === AppStep.KEY_GEN) setCurrentStep(AppStep.IP);
    else if (currentStep === AppStep.IP) setCurrentStep(AppStep.INPUT);
  };

  const handleReset = () => {
    setCurrentStep(AppStep.INPUT);
    setCurrentRound(1);
    setPlainInput(DEFAULT_PLAIN);
    setKeyInput(DEFAULT_KEY);
  };

  const renderContent = () => {
    if (!desState) return null;

    switch (currentStep) {
      case AppStep.INPUT:
        return (
          <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto space-y-6 animate-in fade-in zoom-in duration-300 px-4">
            <div className="text-center space-y-2">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-full inline-block mb-2 shadow-xl border border-slate-700">
                 <Lock className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 tracking-tight">
                DES Visualizer
              </h1>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Explore the inner workings of the Data Encryption Standard algorithm.
              </p>
            </div>

            <div className="w-full space-y-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 shadow-2xl backdrop-blur-sm">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Plaintext (Hex)</label>
                <div className="relative">
                  <input 
                    value={plainInput}
                    onChange={(e) => setPlainInput(e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 16))}
                    className="w-full bg-slate-800/80 border border-slate-600 rounded-lg px-3 py-2 font-mono text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-700"
                    placeholder="0123456789ABCDEF"
                  />
                  <div className="absolute right-3 top-2.5 text-[10px] text-slate-600 font-mono">{plainInput.length}/16</div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Key (Hex)</label>
                <div className="relative">
                  <input 
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 16))}
                    className="w-full bg-slate-800/80 border border-slate-600 rounded-lg px-3 py-2 font-mono text-yellow-400 focus:ring-2 focus:ring-yellow-500 outline-none transition-all placeholder:text-slate-700"
                    placeholder="133457799BBCDFF1"
                  />
                  <div className="absolute right-3 top-2.5 text-[10px] text-slate-600 font-mono">{keyInput.length}/16</div>
                </div>
              </div>
              <Button onClick={handleNext} className="w-full mt-2 py-3 shadow-blue-500/20 shadow-xl hover:shadow-blue-500/30 transition-shadow">
                Start Encryption <Play className="w-4 h-4 ml-2 fill-current" />
              </Button>
            </div>
          </div>
        );

      case AppStep.IP:
        return <InitialPermutation input={desState.binaryPlaintext} output={desState.ipOutput} />;

      case AppStep.KEY_GEN:
        return <KeySchedule desState={desState} />;

      case AppStep.ROUNDS:
        return <RoundFunction round={desState.rounds[currentRound - 1]} />;

      case AppStep.FP:
        return (
          <div className="flex flex-col items-center justify-center gap-6 h-full w-full max-w-4xl mx-auto p-4 animate-in slide-in-from-right duration-500">
             <div className="text-center space-y-1 shrink-0">
                <h2 className="text-3xl font-bold text-white">Encryption Complete</h2>
                <p className="text-slate-400 text-sm">Final Permutation (FP) applied.</p>
             </div>
             
             <div className="grid md:grid-cols-2 gap-4 items-stretch w-full flex-1 min-h-0">
                <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50 flex flex-col justify-center overflow-auto">
                   <div className="mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Pre-Output Block</div>
                   <BitGrid 
                      data={desState.rounds[15].newR + desState.rounds[15].R} 
                      columns={8} 
                      color="text-yellow-500" 
                      className="opacity-80 scale-90 origin-top"
                      interactive
                    />
                </div>
                
                <div className="bg-gradient-to-br from-emerald-950 to-slate-900 p-6 rounded-2xl border border-emerald-500/30 shadow-2xl flex flex-col justify-between group overflow-auto">
                    <div>
                      <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Final Ciphertext</h3>
                      <div className="text-2xl sm:text-3xl font-mono font-bold text-white break-all tracking-wider drop-shadow-lg group-hover:text-emerald-400 transition-colors">
                        {parseInt(desState.fpOutput, 2).toString(16).toUpperCase().padStart(16, '0')}
                      </div>
                    </div>
                    <div className="mt-4 border-t border-emerald-900/50 pt-4">
                      <BitGrid data={desState.fpOutput} color="text-emerald-400" interactive className="scale-90 origin-top" />
                    </div>
                </div>
             </div>
             
             <Button onClick={handleReset} variant="secondary" size="lg" className="shrink-0">
                <RotateCcw className="w-4 h-4 mr-2" /> Encrypt New Block
             </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getProgress = () => {
    switch (currentStep) {
      case AppStep.INPUT: return 0;
      case AppStep.IP: return 10;
      case AppStep.KEY_GEN: return 20;
      case AppStep.ROUNDS: return 20 + (currentRound / 16) * 70;
      case AppStep.FP: return 100;
      default: return 0;
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0f172a] text-slate-200 font-sans overflow-hidden">
      <header className="shrink-0 h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 z-50">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              <Lock className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">DES Explorer</span>
         </div>
         
         <div className="flex items-center gap-3">
           {currentStep !== AppStep.INPUT && (
             <>
                <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Round</span>
                   <div className="flex gap-0.5">
                      {[...Array(16)].map((_, i) => (
                         <div 
                           key={i} 
                           className={`w-1 h-2.5 rounded-[1px] transition-all duration-300 ${i + 1 <= (currentStep === AppStep.ROUNDS ? currentRound : (currentStep === AppStep.FP ? 16 : 0)) ? 'bg-blue-500' : 'bg-slate-700'}`} 
                         />
                      ))}
                   </div>
                   <span className="text-[10px] font-mono text-blue-400 w-10 text-right">
                     {currentStep === AppStep.ROUNDS ? currentRound : (currentStep === AppStep.FP ? 16 : 0)}/16
                   </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={handlePrev}>
                    <SkipBack className="w-3 h-3 md:mr-1" /> <span className="hidden md:inline">Back</span>
                  </Button>
                  <Button variant="primary" size="sm" className="h-8 text-xs" onClick={handleNext} disabled={currentStep === AppStep.FP}>
                    <span className="hidden md:inline">Next</span> <SkipForward className="w-3 h-3 md:ml-1" />
                  </Button>
                </div>
             </>
           )}
         </div>
      </header>

      <div className="shrink-0 h-0.5 w-full bg-slate-900">
         <div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500 ease-out" 
            style={{ width: `${getProgress()}%` }}
         ></div>
      </div>

      <main className="flex-1 overflow-hidden relative flex flex-col">
         <div className="w-full h-full max-w-7xl mx-auto p-2 sm:p-4 flex flex-col">
            {renderContent()}
         </div>
      </main>

      <footer className="shrink-0 h-6 border-t border-slate-800 bg-slate-900 flex items-center justify-between px-4 text-[9px] text-slate-600 uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${desState ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
            {currentStep.replace('_', ' ')}
          </div>
          <div className="font-mono opacity-50">
            Interactive Mode
          </div>
      </footer>
    </div>
  );
};

export default App;