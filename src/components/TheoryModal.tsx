import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  Check, 
  AlertTriangle, 
  Code2, 
  Calculator, 
  Compass, 
  Info,
  ExternalLink,
  Layers,
  Clock,
  Activity,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { AlgorithmType, Process } from '../types/scheduler';
import { ALGORITHM_THEORY_DATA, AlgorithmTheory } from '../data/theoryData';
import { useTheme } from '../context/ThemeContext';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAlgorithm?: AlgorithmType;
  onSelectAlgorithmInWorkspace?: (algorithm: AlgorithmType, processes?: Process[], quantum?: number) => void;
}

const ALGORITHM_LIST: AlgorithmType[] = [
  'FCFS',
  'SJF',
  'SRTF',
  'RR',
  'PRIORITY_NP',
  'PRIORITY_P',
];

export const TheoryModal: React.FC<TheoryModalProps> = ({
  isOpen,
  onClose,
  initialAlgorithm = 'RR',
  onSelectAlgorithmInWorkspace,
}) => {
  const { colors, theme } = useTheme();
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmType>(
    ALGORITHM_LIST.includes(initialAlgorithm as AlgorithmType) ? initialAlgorithm : 'RR'
  );
  const [viewMode, setViewMode] = useState<'algorithm' | 'factors'>('algorithm');
  const [algoSection, setAlgoSection] = useState<'worked-example' | 'pseudocode' | 'pros-cons'>('worked-example');

  if (!isOpen) return null;

  const currentTheory: AlgorithmTheory = ALGORITHM_THEORY_DATA[selectedAlgo] || ALGORITHM_THEORY_DATA['RR'];

  const handleApplyToWorkspace = (algo: AlgorithmType) => {
    if (onSelectAlgorithmInWorkspace) {
      onSelectAlgorithmInWorkspace(algo);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className={`w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border ${colors.border} ${colors.bgCard} shadow-2xl overflow-hidden transition-colors`}>
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-inherit flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-xs">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-extrabold ${colors.textPrimary}`}>
                CPU Scheduling Guide & Factor Definitions
              </h2>
              <p className={`text-xs ${colors.textMuted}`}>
                Pseudocode, step-by-step problem solutions, and core OS scheduling factors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('factors')}
              className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl border ${
                viewMode === 'factors'
                  ? 'bg-cyan-500 text-slate-950 font-extrabold border-cyan-500 shadow-md'
                  : `${colors.border} ${colors.textSecondary} hover:${colors.textPrimary} bg-white/5`
              } transition-all`}
            >
              <Calculator className="w-4 h-4" />
              <span>Scheduling Factors Guide</span>
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl border ${colors.border} ${colors.textMuted} hover:${colors.textPrimary} transition-colors`}
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Algorithm Horizontal Pill Selector */}
        <div className="px-4 py-2.5 border-b border-inherit overflow-x-auto flex items-center gap-2 scrollbar-thin bg-black/10 dark:bg-black/30">
          <span className={`text-xs font-bold ${colors.textMuted} uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1`}>
            <Compass className="w-4 h-4 text-cyan-400" /> Algorithms:
          </span>
          {ALGORITHM_LIST.map((algoKey) => {
            const item = ALGORITHM_THEORY_DATA[algoKey];
            const isSelected = selectedAlgo === algoKey && viewMode === 'algorithm';
            return (
              <button
                key={algoKey}
                onClick={() => {
                  setSelectedAlgo(algoKey);
                  setViewMode('algorithm');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md'
                    : `border ${colors.border} ${colors.textSecondary} hover:${colors.textPrimary} hover:bg-black/5 dark:hover:bg-white/5`
                }`}
              >
                <span>{item.shortName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  item.type === 'Preemptive' 
                    ? 'bg-amber-500/20 text-amber-300' 
                    : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {item.type === 'Preemptive' ? 'Preemptive' : 'Non-Pre'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Container */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm font-sans">
          
          {/* VIEW 1: All CPU Scheduling Factors & Definitions */}
          {viewMode === 'factors' ? (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div className="flex items-center justify-between pb-3 border-b border-inherit">
                <div>
                  <h3 className={`text-base sm:text-lg font-bold ${colors.textPrimary} flex items-center gap-2`}>
                    <Info className="w-5 h-5 text-cyan-400" /> CPU Scheduling Factors & Criteria Definitions
                  </h3>
                  <p className={`text-xs ${colors.textMuted}`}>
                    Mathematical definitions, formulas, and fundamental operating system scheduling concepts
                  </p>
                </div>
                <button
                  onClick={() => setViewMode('algorithm')}
                  className="text-xs px-3.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-extrabold"
                >
                  Back to {currentTheory.shortName}
                </button>
              </div>

              {/* 2-Column Grid of CPU Scheduling Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Turnaround Time (TAT) */}
                <div className="p-4 rounded-2xl border border-blue-500/40 bg-blue-500/10 dark:bg-blue-950/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300">1. Turnaround Time (TAT)</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-800 dark:text-blue-200 font-bold border border-blue-400/40">Total Lifespan</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/60 font-mono font-extrabold text-xs text-blue-900 dark:text-blue-300 border border-blue-500/30">
                    Turnaround Time = Completion Time (CT) − Arrival Time (AT)
                  </div>
                  <p className={`text-xs ${colors.textPrimary} font-medium leading-relaxed`}>
                    The total elapsed time interval from the exact moment a process is submitted to the system until it finishes its execution completely.
                  </p>
                </div>

                {/* 2. Waiting Time (WT) */}
                <div className="p-4 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 dark:bg-cyan-950/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-cyan-700 dark:text-cyan-300">2. Waiting Time (WT)</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 font-bold border border-cyan-400/40">Queue Waiting</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/60 font-mono font-extrabold text-xs text-cyan-900 dark:text-cyan-300 border border-cyan-500/30">
                    Waiting Time = Turnaround Time (TAT) − Burst Time (BT)
                  </div>
                  <p className={`text-xs ${colors.textPrimary} font-medium leading-relaxed`}>
                    The total duration a process spends sitting in the Ready Queue waiting to be allocated the CPU.
                  </p>
                </div>

                {/* 3. Response Time (RT) */}
                <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">3. Response Time (RT)</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-bold border border-emerald-400/40">First CPU Start</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/60 font-mono font-extrabold text-xs text-emerald-900 dark:text-emerald-300 border border-emerald-500/30">
                    Response Time = First CPU Start Time (ST) − Arrival Time (AT)
                  </div>
                  <p className={`text-xs ${colors.textPrimary} font-medium leading-relaxed`}>
                    The time elapsed from submission until the process gets the CPU for the very first time. In non-preemptive scheduling, Response Time is always identical to Waiting Time.
                  </p>
                </div>

                {/* 4. Completion Time (CT) */}
                <div className="p-4 rounded-2xl border border-purple-500/40 bg-purple-500/10 dark:bg-purple-950/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-purple-700 dark:text-purple-300">4. Completion Time (CT)</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-800 dark:text-purple-200 font-bold border border-purple-400/40">Finish Timestamp</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/60 font-mono font-extrabold text-xs text-purple-900 dark:text-purple-300 border border-purple-500/30">
                    Completion Time = Exact point in time when process finishes its last CPU burst
                  </div>
                  <p className={`text-xs ${colors.textPrimary} font-medium leading-relaxed`}>
                    The global timeline clock value at the moment the process terminates and transitions to the Completed/Terminated state.
                  </p>
                </div>

                {/* 5. Arrival Time (AT) */}
                <div className="p-4 rounded-2xl border border-slate-500/40 bg-slate-500/10 dark:bg-slate-950/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300">5. Arrival Time (AT)</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-800 dark:text-slate-200 font-bold border border-slate-400/40">Entry Time</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/60 font-mono font-extrabold text-xs text-slate-900 dark:text-slate-300 border border-slate-500/30">
                    Arrival Time = The time tick at which the process enters the Ready Queue
                  </div>
                  <p className={`text-xs ${colors.textPrimary} font-medium leading-relaxed`}>
                    A process cannot be scheduled or executed before its Arrival Time.
                  </p>
                </div>

                {/* 6. Burst Time (BT) */}
                <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-amber-700 dark:text-amber-300">6. Burst Time (BT)</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold border border-amber-400/40">CPU Duration</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/60 font-mono font-extrabold text-xs text-amber-900 dark:text-amber-300 border border-amber-500/30">
                    Burst Time = Total CPU execution units required by the process
                  </div>
                  <p className={`text-xs ${colors.textPrimary} font-medium leading-relaxed`}>
                    The amount of active processor time needed by the process to complete its operations.
                  </p>
                </div>

                {/* 7. CPU Utilization (%) */}
                <div className="p-4 rounded-2xl border border-teal-500/40 bg-teal-500/10 dark:bg-teal-950/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-teal-700 dark:text-teal-300">7. CPU Utilization (%)</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-800 dark:text-teal-200 font-bold border border-teal-400/40">Efficiency</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/60 font-mono font-extrabold text-xs text-teal-900 dark:text-teal-300 border border-teal-500/30">
                    CPU Utilization (%) = (Total Busy Execution Time / Total Elapsed Time) × 100
                  </div>
                  <p className={`text-xs ${colors.textPrimary} font-medium leading-relaxed`}>
                    The fraction of total time that the CPU was actively executing user or system processes rather than sitting idle.
                  </p>
                </div>

                {/* 8. Throughput */}
                <div className="p-4 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 dark:bg-indigo-950/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-indigo-700 dark:text-indigo-300">8. Throughput</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 font-bold border border-indigo-400/40">Productivity</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/60 font-mono font-extrabold text-xs text-indigo-900 dark:text-indigo-300 border border-indigo-500/30">
                    Throughput = Total Number of Completed Processes / Total Time Taken
                  </div>
                  <p className={`text-xs ${colors.textPrimary} font-medium leading-relaxed`}>
                    The rate at which processes are completely executed per unit time.
                  </p>
                </div>

                {/* 9. Context Switching */}
                <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 dark:bg-rose-950/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-rose-700 dark:text-rose-300">9. Context Switching</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-800 dark:text-rose-200 font-bold border border-rose-400/40">CPU Overhead</span>
                  </div>
                  <p className={`text-xs ${colors.textPrimary} font-medium leading-relaxed`}>
                    The procedure of saving the state (PCB, registers, program counter) of a currently running process and restoring the state of another process so CPU execution can resume seamlessly.
                  </p>
                </div>

                {/* 10. Preemption vs Non-Preemption */}
                <div className="p-4 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 dark:bg-yellow-950/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-yellow-700 dark:text-yellow-300">10. Preemption Mechanism</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-800 dark:text-yellow-200 font-bold border border-yellow-400/40">Interrupt</span>
                  </div>
                  <p className={`text-xs ${colors.textPrimary} font-medium leading-relaxed`}>
                    <strong>Non-Preemptive:</strong> Once a process gets the CPU, it holds it until termination or I/O.<br />
                    <strong>Preemptive:</strong> The OS scheduler can forcibly interrupt and suspend a running process when its time slice expires (RR) or a higher priority task arrives (SRTF, Priority P).
                  </p>
                </div>

                {/* 11. Starvation (Indefinite Blocking) */}
                <div className="p-4 rounded-2xl border border-orange-500/40 bg-orange-500/10 dark:bg-orange-950/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-orange-700 dark:text-orange-300">11. Starvation</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-800 dark:text-orange-200 font-bold border border-orange-400/40">Indefinite Wait</span>
                  </div>
                  <p className={`text-xs ${colors.textPrimary} font-medium leading-relaxed`}>
                    A condition where low-priority or long-burst processes wait indefinitely in the Ready Queue because higher-priority or shorter jobs continuously arrive and monopolize the CPU.
                  </p>
                </div>

                {/* 12. Aging Technique */}
                <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">12. Aging</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-bold border border-emerald-400/40">Anti-Starvation</span>
                  </div>
                  <p className={`text-xs ${colors.textPrimary} font-medium leading-relaxed`}>
                    A solution to starvation where the operating system gradually increases the priority of waiting processes as their wait time increases, guaranteeing they will eventually execute.
                  </p>
                </div>

              </div>
            </div>
          ) : (
            /* VIEW 2: Individual Algorithm (Pseudocode, Step-by-step problem solving, Advantages/Disadvantages) */
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Algorithm Title & Sub-tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-inherit">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-base sm:text-lg font-bold ${colors.textPrimary}`}>
                      {currentTheory.name}
                    </h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      currentTheory.type === 'Preemptive'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    }`}>
                      {currentTheory.type}
                    </span>
                  </div>
                  <p className={`text-xs ${colors.textMuted} mt-0.5`}>
                    {currentTheory.howItWorks}
                  </p>
                </div>

                <button
                  onClick={() => handleApplyToWorkspace(currentTheory.id)}
                  className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md transition-all active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  Load in Simulator
                </button>
              </div>

              {/* Algorithm Sub-navigation: Problem Solving, Pseudocode, Pros & Cons */}
              <div className="flex flex-wrap items-center gap-2 border-b border-inherit pb-2">
                <button
                  onClick={() => setAlgoSection('worked-example')}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    algoSection === 'worked-example'
                      ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm'
                      : `${colors.border} border ${colors.textSecondary} hover:${colors.textPrimary}`
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  Step-by-Step Problem Solution
                </button>

                <button
                  onClick={() => setAlgoSection('pseudocode')}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    algoSection === 'pseudocode'
                      ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm'
                      : `${colors.border} border ${colors.textSecondary} hover:${colors.textPrimary}`
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  Pseudocode
                </button>

                <button
                  onClick={() => setAlgoSection('pros-cons')}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    algoSection === 'pros-cons'
                      ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm'
                      : `${colors.border} border ${colors.textSecondary} hover:${colors.textPrimary}`
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Advantages & Disadvantages
                </button>
              </div>

              {/* 1. Step-by-Step Problem Solving & Calculations */}
              {algoSection === 'worked-example' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className={`p-4 sm:p-5 rounded-2xl border ${colors.border} ${colors.bgCardElevated} space-y-4`}>
                    
                    {/* Problem Statement */}
                    <div>
                      <h4 className={`text-sm sm:text-base font-extrabold ${colors.textPrimary}`}>
                        {currentTheory.workedExample.title}
                      </h4>
                      <p className="text-xs text-cyan-400 font-semibold mt-1">
                        {currentTheory.workedExample.problem}
                      </p>
                    </div>

                    {/* Step-by-Step Execution Trace */}
                    <div className="space-y-2">
                      <span className={`text-xs font-bold uppercase ${colors.textMuted} tracking-wider block`}>
                        Step-by-Step Decision Trace:
                      </span>
                      <div className="space-y-1.5">
                        {currentTheory.workedExample.steps.map((step, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border ${colors.border} ${colors.bgCard} flex flex-wrap items-center justify-between gap-2 text-xs`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30">
                                Time {step.tickRange}
                              </span>
                              <span className="font-bold text-emerald-400">{step.processId}</span>
                              <span className={colors.textPrimary}>— {step.action}</span>
                            </div>
                            <span className={`text-xs ${colors.textMuted} italic`}>
                              ({step.reason})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Numerical Solution Results Table */}
                    <div>
                      <span className={`text-xs font-bold uppercase ${colors.textMuted} tracking-wider block mb-2`}>
                        Calculated Process Schedule Results:
                      </span>
                      <div className="overflow-x-auto rounded-xl border border-inherit">
                        <table className="w-full text-left text-xs border-collapse font-sans">
                          <thead>
                            <tr className={`border-b ${colors.border} bg-white/5 ${colors.textMuted} uppercase text-xs font-bold font-mono`}>
                              <th className="py-2.5 px-3">Process</th>
                              <th className="py-2.5 px-3">Arrival (AT)</th>
                              <th className="py-2.5 px-3">Burst (BT)</th>
                              <th className="py-2.5 px-3 text-purple-400">Completion (CT)</th>
                              <th className="py-2.5 px-3 text-blue-400">Turnaround (TAT)</th>
                              <th className="py-2.5 px-3 text-cyan-400">Waiting (WT)</th>
                              <th className="py-2.5 px-3 text-emerald-400">Response (RT)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-inherit font-mono">
                            {currentTheory.workedExample.table.map((row) => (
                              <tr key={row.id} className="hover:bg-white/5">
                                <td className="py-2.5 px-3 font-bold text-cyan-400">{row.id}</td>
                                <td className="py-2.5 px-3">{row.at}</td>
                                <td className="py-2.5 px-3">{row.bt}</td>
                                <td className="py-2.5 px-3 font-bold text-purple-400">{row.ct}</td>
                                <td className="py-2.5 px-3 font-bold text-blue-400">{row.tat}</td>
                                <td className="py-2.5 px-3 font-bold text-cyan-400">{row.wt}</td>
                                <td className="py-2.5 px-3 font-bold text-emerald-400">{row.rt}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Step-by-Step Average Formula Calculations */}
                    <div className="p-3.5 rounded-xl bg-black/40 border border-inherit space-y-1.5 text-xs font-mono">
                      <div className="font-bold text-blue-400">
                        {currentTheory.workedExample.avgTATFormula}
                      </div>
                      <div className="font-bold text-cyan-400">
                        {currentTheory.workedExample.avgWTFormula}
                      </div>
                      <div className="font-bold text-emerald-400">
                        {currentTheory.workedExample.avgRTFormula}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* 2. Pseudocode */}
              {algoSection === 'pseudocode' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className={`p-4 sm:p-5 rounded-2xl border ${colors.border} bg-black/50 space-y-3 font-mono`}>
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                      <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                        <Code2 className="w-4 h-4" /> {currentTheory.name} Algorithm Logic
                      </span>
                      <span className="text-slate-400 text-xs">Pseudocode</span>
                    </div>

                    <pre className="text-xs text-slate-200 overflow-x-auto p-3.5 bg-black/60 rounded-xl leading-relaxed border border-white/10">
                      {currentTheory.pseudocode}
                    </pre>
                  </div>
                </div>
              )}

              {/* 3. Advantages and Disadvantages */}
              {algoSection === 'pros-cons' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150">
                  {/* Advantages */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Key Advantages
                    </h4>
                    <ul className="space-y-2 text-xs">
                      {currentTheory.advantages.map((adv, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <span className={`${colors.textPrimary} leading-relaxed`}>{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Disadvantages */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-rose-500/40 bg-rose-500/10 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Disadvantages & Limitations
                    </h4>
                    <ul className="space-y-2 text-xs">
                      {currentTheory.disadvantages.map((dis, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                          <span className={`${colors.textPrimary} leading-relaxed`}>{dis}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-inherit flex items-center justify-end">
          <button
            onClick={onClose}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-extrabold hover:bg-cyan-400 transition-colors"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
