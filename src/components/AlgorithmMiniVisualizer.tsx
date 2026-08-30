import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  ExternalLink,
  Sparkles,
  Zap
} from 'lucide-react';
import { AlgorithmType, Process, SimulationState } from '../types/scheduler';
import { ALGORITHM_THEORY_DATA } from '../data/theoryData';
import { resetSimulation, tickSimulation } from '../services/schedulerEngine';
import { useTheme } from '../context/ThemeContext';

interface AlgorithmMiniVisualizerProps {
  algorithm: AlgorithmType;
  onLoadIntoWorkspace?: (algorithm: AlgorithmType, processes: Process[], quantum?: number) => void;
}

export const AlgorithmMiniVisualizer: React.FC<AlgorithmMiniVisualizerProps> = ({
  algorithm,
  onLoadIntoWorkspace,
}) => {
  const { colors, theme } = useTheme();
  const theory = ALGORITHM_THEORY_DATA[algorithm];
  const quantum = theory.recommendedQuantum || (algorithm === 'RR' ? 2 : 3);

  // Initialize mini simulation state
  const initMiniState = useCallback((): SimulationState => {
    const rawProcesses: Process[] = theory.miniSimProcesses.map((p) => ({
      ...p,
      remainingTime: p.burstTime,
      currentPriority: p.priority,
      agedCount: 0,
      ioSchedule: [],
      state: 'UNARRIVED',
      currentCoreId: null,
      blockedRemaining: 0,
      quantumRemaining: quantum,
      starvationTicks: 0,
      lastExecutedCoreId: null,
      startTime: null,
      completionTime: null,
      waitingTime: 0,
      turnaroundTime: 0,
      responseTime: null,
      readyEnqueueTick: undefined,
    }));

    return resetSimulation(null, rawProcesses, algorithm, {
      numCores: 1,
      quantum,
      contextSwitchTime: 0,
      enableAging: true,
      agingThreshold: 5,
      priorityBoost: 1,
      priorityOrder: 'LOWER_IS_HIGHER',
    });
  }, [theory, algorithm, quantum]);

  const [simState, setSimState] = useState<SimulationState>(initMiniState);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when algorithm changes
  useEffect(() => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setSimState(initMiniState());
  }, [algorithm, initMiniState]);

  // Step simulation forward
  const handleStep = useCallback(() => {
    setSimState((prev) => {
      if (prev.isCompleted) {
        setIsPlaying(false);
        return prev;
      }
      return tickSimulation(prev);
    });
  }, []);

  // Reset simulation
  const handleReset = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setSimState(initMiniState());
  };

  // Play / Pause toggle
  const handleTogglePlay = () => {
    if (simState.isCompleted) {
      handleReset();
      setIsPlaying(true);
      return;
    }
    setIsPlaying(!isPlaying);
  };

  // Playback timer effect
  useEffect(() => {
    if (isPlaying && !simState.isCompleted) {
      const intervalMs = Math.max(80, Math.floor(650 / speed));
      timerRef.current = setInterval(() => {
        handleStep();
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (simState.isCompleted) setIsPlaying(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, simState.isCompleted, speed, handleStep]);

  // Process buckets
  const unarrivedList = simState.processes.filter((p) => p.state === 'UNARRIVED');
  const readyList = simState.processes.filter((p) => p.state === 'READY');
  const runningProcess = simState.processes.find((p) => p.state === 'RUNNING');
  const completedList = simState.processes.filter((p) => p.state === 'COMPLETED');

  // Most recent log message
  const recentLog = simState.logs.length > 0 ? simState.logs[0] : null;

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bgCardElevated} p-4 space-y-4 transition-colors font-mono`}>
      {/* Header & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-inherit">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider ${colors.textPrimary} flex items-center gap-1.5`}>
              Interactive Mini-Visualizer
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/10 text-cyan-500 font-semibold border border-cyan-500/20">
                Tick: {simState.currentTick}
              </span>
            </h4>
            <p className={`text-[10px] ${colors.textMuted}`}>
              Step through visual CPU execution & queue transitions
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleTogglePlay}
            className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-colors shadow-sm ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500'
                : simState.isCompleted
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-cyan-600 hover:bg-cyan-500'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : simState.isCompleted ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" /> Replay
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Play
              </>
            )}
          </button>

          <button
            onClick={handleStep}
            disabled={simState.isCompleted || isPlaying}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${colors.border} ${colors.borderHover} ${colors.textPrimary} transition-colors disabled:opacity-30 disabled:cursor-not-allowed`}
            title="Advance 1 simulation tick"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Step
          </button>

          <button
            onClick={handleReset}
            className={`p-1.5 rounded-lg border ${colors.border} ${colors.textMuted} hover:${colors.textPrimary} transition-colors`}
            title="Reset to Tick 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-black/10 dark:bg-white/5 rounded-lg p-0.5 border border-inherit text-[10px]">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                  speed === s
                    ? 'bg-cyan-500 text-white shadow-xs'
                    : `${colors.textMuted} hover:${colors.textPrimary}`
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {onLoadIntoWorkspace && (
            <button
              onClick={() => onLoadIntoWorkspace(algorithm, simState.processes, quantum)}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-500 border border-indigo-500/30 transition-colors ml-1"
              title="Load this example into main workspace"
            >
              <ExternalLink className="w-3 h-3" />
              Apply in Main App
            </button>
          )}
        </div>
      </div>

      {/* Live Event Explanatory Banner */}
      <div className={`p-2.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-[11px] flex items-start gap-2`}>
        <Sparkles className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-bold text-cyan-600 dark:text-cyan-400 mr-1">
            Kernel Action at Tick {simState.currentTick}:
          </span>
          <span className={colors.textPrimary}>
            {simState.isCompleted
              ? `🎉 Simulation Completed! All processes finished successfully. Makespan: ${simState.currentTick} ticks.`
              : recentLog
              ? recentLog.message
              : 'Simulation initialized. Click Play or Step to start execution.'}
          </span>
        </div>
      </div>

      {/* Interactive Process Pipeline (Unarrived -> Ready -> CPU -> Completed) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        
        {/* 1. Unarrived Pool */}
        <div className={`p-3 rounded-xl border ${colors.border} ${colors.bgCard} flex flex-col justify-between`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${colors.textMuted}`}>
              1. Unarrived
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">
              {unarrivedList.length}
            </span>
          </div>

          <div className="space-y-1.5 min-h-[70px]">
            {unarrivedList.length === 0 ? (
              <span className={`text-[10px] ${colors.textMuted} italic flex items-center justify-center h-full`}>
                All arrived
              </span>
            ) : (
              unarrivedList.map((p) => (
                <div
                  key={p.id}
                  className="p-1.5 rounded-lg border border-inherit flex items-center justify-between text-[10px] bg-black/5 dark:bg-white/5"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="font-bold">{p.id}</span>
                  </div>
                  <span className={colors.textMuted}>Arrives @ t={p.arrivalTime}</span>
                </div>
              ))
            )}
          </div>
          <span className={`text-[9px] ${colors.textMuted} mt-2 text-center block`}>Waiting for arrival clock</span>
        </div>

        {/* 2. Ready Queue */}
        <div className={`p-3 rounded-xl border ${colors.border} ${colors.bgCard} flex flex-col justify-between relative`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> 2. Ready Queue
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-500 font-bold border border-cyan-500/20">
              {readyList.length}
            </span>
          </div>

          <div className="space-y-1.5 min-h-[70px]">
            {readyList.length === 0 ? (
              <span className={`text-[10px] ${colors.textMuted} italic flex items-center justify-center h-full`}>
                Queue empty
              </span>
            ) : (
              readyList.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-between text-[10px] animate-in fade-in duration-200 shadow-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="font-bold text-cyan-600 dark:text-cyan-300">{p.id}</span>
                    <span className="text-[9px] px-1 rounded bg-black/10 dark:bg-white/10">#{idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-semibold">
                    <span>Rem: {p.remainingTime}t</span>
                    {algorithm.includes('PRIORITY') && (
                      <span className="text-amber-500 font-bold">[Pri: {p.currentPriority}]</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <span className={`text-[9px] text-cyan-600 dark:text-cyan-400 mt-2 text-center block font-semibold`}>
            {algorithm === 'RR' ? 'FIFO Order' : algorithm === 'SRTF' ? 'Shortest Remaining First' : 'Scheduler Ordered'}
          </span>
        </div>

        {/* 3. Active CPU Core */}
        <div className={`p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col justify-between`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 animate-pulse" /> 3. CPU Core
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold">
              {runningProcess ? 'BUSY' : 'IDLE'}
            </span>
          </div>

          <div className="min-h-[70px] flex items-center justify-center">
            {runningProcess ? (
              <div className="w-full p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 text-center space-y-1 animate-in zoom-in-95 duration-150 shadow-sm">
                <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-emerald-700 dark:text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: runningProcess.color }} />
                  {runningProcess.id}
                </div>
                <div className="text-[10px] font-semibold flex items-center justify-center gap-2">
                  <span>Rem: <strong className="text-emerald-600 dark:text-emerald-300">{runningProcess.remainingTime}t</strong></span>
                  {algorithm === 'RR' && (
                    <span>Slice: <strong className="text-amber-500">{runningProcess.quantumRemaining}t left</strong></span>
                  )}
                </div>
                <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${((runningProcess.burstTime - runningProcess.remainingTime) / runningProcess.burstTime) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className={`text-[10px] ${colors.textMuted} italic text-center`}>
                CPU is currently IDLE
              </div>
            )}
          </div>
          <span className={`text-[9px] text-emerald-600 dark:text-emerald-400 mt-2 text-center block font-semibold`}>
            Executing active cycle
          </span>
        </div>

        {/* 4. Completed Bin */}
        <div className={`p-3 rounded-xl border ${colors.border} ${colors.bgCard} flex flex-col justify-between`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 4. Completed
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 font-bold border border-purple-500/20">
              {completedList.length}/{simState.processes.length}
            </span>
          </div>

          <div className="space-y-1.5 min-h-[70px]">
            {completedList.length === 0 ? (
              <span className={`text-[10px] ${colors.textMuted} italic flex items-center justify-center h-full`}>
                None finished yet
              </span>
            ) : (
              completedList.map((p) => (
                <div
                  key={p.id}
                  className="p-1 rounded-lg border border-purple-500/30 bg-purple-500/10 flex items-center justify-between text-[10px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="font-bold text-purple-600 dark:text-purple-300">{p.id}</span>
                  </div>
                  <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-300">
                    CT={p.completionTime} (TAT={p.turnaroundTime}t)
                  </span>
                </div>
              ))
            )}
          </div>
          <span className={`text-[9px] text-purple-600 dark:text-purple-400 mt-2 text-center block font-semibold`}>
            Finished processes
          </span>
        </div>

      </div>

      {/* Mini Gantt Chart Stream */}
      <div className={`p-3 rounded-xl border ${colors.border} ${colors.bgCard} space-y-1.5`}>
        <div className="flex items-center justify-between text-[10px]">
          <span className={`font-bold ${colors.textMuted} uppercase tracking-wider`}>
            Mini Gantt Timeline (0 → {simState.currentTick} ticks)
          </span>
          <span className="text-[10px] font-semibold text-cyan-500">
            {simState.ganttHistory.length} Execution Blocks
          </span>
        </div>

        {simState.ganttHistory.length === 0 ? (
          <div className={`h-8 rounded-lg border border-dashed ${colors.border} flex items-center justify-center text-[10px] ${colors.textMuted} italic`}>
            No cycles executed yet. Click "Play" or "Step" above.
          </div>
        ) : (
          <div className="flex items-center h-8 w-full rounded-lg overflow-x-auto border border-inherit bg-black/10 dark:bg-black/30 p-0.5 gap-0.5">
            {simState.ganttHistory.map((seg) => {
              const dur = seg.endTick - seg.startTick;
              return (
                <div
                  key={seg.id}
                  className="h-full rounded flex items-center justify-center text-[10px] font-bold text-white px-1 relative group cursor-default transition-transform hover:scale-105"
                  style={{
                    backgroundColor: seg.isIdle ? '#334155' : seg.color,
                    minWidth: `${Math.max(28, dur * 24)}px`,
                    flexGrow: dur,
                  }}
                  title={`${seg.processId}: Ticks ${seg.startTick} → ${seg.endTick} (${dur}t)`}
                >
                  <span>{seg.processId}</span>
                  <span className="text-[8px] opacity-80 ml-1">({dur}t)</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
