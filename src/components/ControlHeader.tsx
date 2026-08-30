import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  BarChart3, 
  BookOpen, 
  Clock, 
  Sparkles,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { AlgorithmType, PriorityOrder } from '../types/scheduler';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface ControlHeaderProps {
  algorithm: AlgorithmType;
  onSelectAlgorithm: (algo: AlgorithmType) => void;
  quantum: number;
  onChangeQuantum: (q: number) => void;
  enableAging: boolean;
  onToggleAging: () => void;
  agingThreshold: number;
  onChangeAgingThreshold: (t: number) => void;
  priorityBoost: number;
  onChangePriorityBoost: (b: number) => void;
  priorityOrder: PriorityOrder;
  onChangePriorityOrder: (order: PriorityOrder) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward?: () => void;
  onStepBackward?: () => void;
  onReset: () => void;
  onSolveInstantly: () => void;
  currentTick: number;
  speedMultiplier: number;
  onChangeSpeed: (speed: number) => void;
  onOpenTheory: () => void;
  onOpenCompare: () => void;
}

const ALGORITHMS: { id: AlgorithmType; name: string; short: string; badge: string; desc: string }[] = [
  { 
    id: 'FCFS', 
    name: 'First-Come, First-Served', 
    short: 'FCFS', 
    badge: 'Non-Preemptive',
    desc: 'Executes processes in the exact order they arrive'
  },
  { 
    id: 'SJF', 
    name: 'Shortest Job First', 
    short: 'SJF', 
    badge: 'Non-Preemptive',
    desc: 'Picks the arrived process with the shortest burst time'
  },
  { 
    id: 'SRTF', 
    name: 'Shortest Remaining Time First', 
    short: 'SRTF', 
    badge: 'Preemptive',
    desc: 'Preempts if a newly arrived process needs less time'
  },
  { 
    id: 'RR', 
    name: 'Round Robin', 
    short: 'Round Robin', 
    badge: 'Preemptive',
    desc: 'Shares CPU equally in cyclical time slices (quantum)'
  },
  { 
    id: 'PRIORITY_NP', 
    name: 'Priority Scheduling', 
    short: 'Priority (NP)', 
    badge: 'Non-Preemptive',
    desc: 'Runs highest priority job until it finishes'
  },
  { 
    id: 'PRIORITY_P', 
    name: 'Priority Preemptive', 
    short: 'Priority (P)', 
    badge: 'Preemptive',
    desc: 'Preempts CPU if a higher priority process arrives'
  },
];

export const ControlHeader: React.FC<ControlHeaderProps> = ({
  algorithm,
  onSelectAlgorithm,
  quantum,
  onChangeQuantum,
  enableAging,
  onToggleAging,
  agingThreshold,
  onChangeAgingThreshold,
  priorityBoost,
  onChangePriorityBoost,
  priorityOrder,
  onChangePriorityOrder,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onReset,
  onSolveInstantly,
  currentTick,
  speedMultiplier,
  onChangeSpeed,
  onOpenTheory,
  onOpenCompare,
}) => {
  const { theme, setTheme, colors } = useTheme();

  const isPriorityAlgo = algorithm === 'PRIORITY_NP' || algorithm === 'PRIORITY_P';
  const isRoundRobin = algorithm === 'RR';
  const currentAlgoObj = ALGORITHMS.find((a) => a.id === algorithm) || ALGORITHMS[0];

  return (
    <header className="space-y-4">
      
      {/* Top Navbar */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${colors.border} ${colors.bgCard} shadow-lg transition-all`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-cyan-600/20 border border-cyan-500/50 text-cyan-400 flex items-center justify-center font-extrabold text-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">
              ⚡
            </div>
            <div>
              <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight font-sans ${colors.textPrimary}`}>
                CPU Scheduler
              </h1>
              <p className={`text-xs ${colors.textMuted} mt-0.5 font-medium`}>
                Interactive operating system scheduling simulator with step-by-step calculations
              </p>
            </div>
          </div>

          {/* Action Buttons: Compare, Guide, Theme */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            
            {/* Compare 6 Algorithms Button */}
            <button
              onClick={onOpenCompare}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${colors.border} ${colors.textPrimary} hover:border-cyan-400 bg-white/5 backdrop-blur-md transition-all active:scale-95`}
              title="Compare all 6 algorithms side by side on this workload"
            >
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Compare All 6</span>
            </button>

            {/* OS Formulas & Guide Button */}
            <button
              onClick={onOpenTheory}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-cyan-500/50 bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 backdrop-blur-md transition-all active:scale-95 shadow-[0_0_10px_rgba(6,182,212,0.2)]`}
              title="Formulas, Step-by-Step Math Guide & OS Concepts"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>OS Formulas & Guide</span>
            </button>

            {/* Theme Selector */}
            <div className="relative">
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as ThemeMode)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${colors.border} ${colors.bgInput} backdrop-blur-md cursor-pointer outline-none appearance-none pr-7 transition-all`}
                title="Select Theme"
                aria-label="Theme selector"
              >
                <option value="dark">🌙 Dark Slate</option>
                <option value="light">☀️ Clean Light</option>
                <option value="midnight">🌌 Midnight</option>
                <option value="matrix">🟢 Matrix</option>
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] opacity-70">
                ▼
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Algorithm Selection (Dropdown Menu) */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${colors.border} ${colors.bgCard} shadow-md transition-all`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2">
            <h2 className={`text-sm font-bold uppercase tracking-wider ${colors.textPrimary}`}>
              Choose Scheduling Algorithm
            </h2>
          </div>
          <span className={`text-xs ${colors.textMuted}`}>
            Select an algorithm from the dropdown to recalculate the schedule instantly
          </span>
        </div>

        {/* Dropdown & Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          
          {/* Dropdown Selector */}
          <div className="relative md:col-span-1">
            <label htmlFor="algorithm-select" className="sr-only">
              Scheduling Algorithm
            </label>
            <select
              id="algorithm-select"
              value={algorithm}
              onChange={(e) => onSelectAlgorithm(e.target.value as AlgorithmType)}
              className={`w-full p-3 rounded-xl border ${colors.border} ${colors.bgInput} text-sm font-extrabold cursor-pointer outline-none appearance-none pr-8 transition-all hover:border-cyan-400`}
            >
              {ALGORITHMS.map((algo) => (
                <option key={algo.id} value={algo.id} className="py-1">
                  {algo.name} ({algo.short}) — [{algo.badge}]
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs opacity-70">
              ▼
            </div>
          </div>

          {/* Selected Algorithm Details Card with Solid High-Contrast Badge */}
          <div className={`md:col-span-2 p-3 px-4 rounded-xl border ${colors.border} ${colors.bgCardElevated} flex flex-wrap items-center justify-between gap-2.5`}>
            <div className="flex items-center gap-2.5">
              <span className={`text-xs px-2.5 py-1 rounded-md font-extrabold text-white shadow-xs ${
                currentAlgoObj.badge === 'Preemptive'
                  ? 'bg-amber-600'
                  : 'bg-blue-700'
              }`}>
                {currentAlgoObj.badge}
              </span>
              <div>
                <span className={`font-extrabold text-sm ${colors.textPrimary}`}>
                  {currentAlgoObj.name}
                </span>
                <p className={`text-xs ${colors.textMuted} mt-0.5`}>
                  {currentAlgoObj.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <span className={`text-xs font-mono px-2 py-0.5 rounded border ${colors.tagBg}`}>
                ID: {currentAlgoObj.short}
              </span>
            </div>
          </div>

        </div>

        {/* Conditional Algorithm Parameters (Only shown for relevant algorithms) */}
        {(isRoundRobin || isPriorityAlgo) && (
          <div className="mt-3.5 pt-3.5 border-t border-inherit flex flex-wrap items-center gap-4 text-xs font-medium">
            
            {/* Round Robin Time Quantum Slider/Input */}
            {isRoundRobin && (
              <div className="flex items-center gap-2.5 p-2 px-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30">
                <span className="font-bold text-cyan-300 dark:text-cyan-200">
                  Time Quantum (q):
                </span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={quantum}
                  onChange={(e) => onChangeQuantum(Number(e.target.value))}
                  className="w-24 accent-cyan-400 cursor-pointer"
                  aria-label="Time Quantum"
                />
                <span className="font-extrabold text-sm text-cyan-300 dark:text-cyan-200 min-w-[32px]">
                  {quantum} {quantum === 1 ? 'unit' : 'units'}
                </span>
                <span className={`text-[11px] ${colors.textMuted}`}>
                  (Each process runs at most {quantum} units before switching)
                </span>
              </div>
            )}

            {/* Priority Algorithm: Priority Rule & Anti-Starvation Aging */}
            {isPriorityAlgo && (
              <>
                {/* Priority Rule */}
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${colors.textPrimary}`}>Priority Rule:</span>
                  <select
                    value={priorityOrder}
                    onChange={(e) => onChangePriorityOrder(e.target.value as PriorityOrder)}
                    className={`p-1.5 px-2.5 rounded-xl border ${colors.border} ${colors.bgInput} text-xs font-semibold`}
                    aria-label="Priority Rule"
                  >
                    <option value="LOWER_IS_HIGHER">Lower number = Higher priority (1 is highest)</option>
                    <option value="HIGHER_IS_HIGHER">Higher number = Higher priority (10 is highest)</option>
                  </select>
                </div>

                {/* Anti-Starvation Aging Toggle */}
                <div className="flex items-center gap-2.5 p-2 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enableAging}
                      onChange={onToggleAging}
                      className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                    />
                    <span className="font-bold text-amber-300">
                      Anti-Starvation Aging
                    </span>
                  </label>

                  {enableAging && (
                    <div className="flex items-center gap-2 pl-2 border-l border-amber-500/30">
                      <span className={colors.textSecondary}>Boost by +{priorityBoost} every</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={agingThreshold}
                        onChange={(e) => onChangeAgingThreshold(Math.max(1, Number(e.target.value)))}
                        className={`w-14 p-1 rounded-lg border ${colors.border} ${colors.bgInput} text-center font-bold text-amber-300`}
                        aria-label="Aging Threshold"
                      />
                      <span className={colors.textSecondary}>waiting units</span>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        )}

      </div>

      {/* Playback Controls & Time Banner */}
      <div className={`p-4 rounded-2xl border ${colors.border} ${colors.bgCard} shadow-md flex flex-wrap items-center justify-between gap-3`}>
        
        {/* Left: Playback Controls */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Play / Pause */}
          <button
            onClick={onTogglePlay}
            className={`p-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md ${
              isPlaying 
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play Simulation</span>
              </>
            )}
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className={`p-2.5 px-3 rounded-xl border ${colors.border} ${colors.bgInput} font-bold text-xs flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all ${colors.textSecondary}`}
            title="Reset Simulation Clock to 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Complete Full Simulation */}
          <button
            onClick={onSolveInstantly}
            className="p-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.35)] active:scale-95 transition-all"
            title="Calculate and display the complete schedule instantly"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>⚡ Run Full Simulation</span>
          </button>

        </div>

        {/* Right: Simulation Speed & Current Time Display */}
        <div className="flex items-center gap-3">
          
          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 p-1.5 px-2 rounded-xl bg-white/5 border border-inherit text-xs">
            <span className={`text-xs font-bold ${colors.textMuted}`}>Speed:</span>
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                  speedMultiplier === spd
                    ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-xs'
                    : `${colors.textSecondary} hover:bg-white/10`
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Clock Time Display */}
          <div className="flex items-center gap-2 p-2 px-3.5 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold">Time:</span>
            <span className="font-extrabold text-base font-mono text-white dark:text-white">
              {currentTick}
            </span>
            <span className="text-xs font-medium text-cyan-400">units</span>
          </div>

        </div>

      </div>

    </header>
  );
};

