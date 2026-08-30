import React, { useState } from 'react';
import { 
  Workflow, 
  RotateCw, 
  Cpu, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { Process, CPUCore, AlgorithmType } from '../types/scheduler';
import { useTheme } from '../context/ThemeContext';

interface ProcessLifecyclePipelineProps {
  processes: Process[];
  cores: CPUCore[];
  algorithm: AlgorithmType;
  currentTick: number;
  onSelectProcess?: (p: Process) => void;
}

export const ProcessLifecyclePipeline: React.FC<ProcessLifecyclePipelineProps> = ({
  processes,
  cores,
  algorithm,
  onSelectProcess,
}) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Group processes by state
  const unarrived = processes.filter((p) => p.state === 'UNARRIVED');
  const ready = processes.filter((p) => p.state === 'READY');
  const running = processes.filter((p) => p.state === 'RUNNING');
  const blocked = processes.filter((p) => p.state === 'BLOCKED');
  const completed = processes.filter((p) => p.state === 'COMPLETED');

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bgCard} p-4 sm:p-5 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.15)]`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <Workflow className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-xs sm:text-sm font-bold ${colors.textPrimary} flex items-center gap-2 font-mono`}>
              OS Process State Flow
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 backdrop-blur-md">
                5 Standard States
              </span>
            </h3>
            <p className={`text-[10px] sm:text-[11px] ${colors.textMuted}`}>
              Watch processes move through: New → Ready → Running → Terminated
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl border ${colors.border} ${colors.borderHover} ${colors.textSecondary} bg-white/5 backdrop-blur-md transition-all active:scale-95`}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Collapse Flow
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> Expand Flow
            </>
          )}
        </button>
      </div>

      {/* Expanded Pipeline Diagram */}
      {isExpanded && (
        <div className="mt-4 pt-3.5 border-t border-inherit space-y-4 animate-in fade-in duration-150">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 font-mono">
            
            {/* 1. NEW / UNARRIVED */}
            <div className={`p-3.5 rounded-2xl border ${unarrived.length > 0 ? 'border-blue-500/30 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.15)]' : `${colors.border} ${colors.bgCardElevated}`} flex flex-col justify-between backdrop-blur-md`}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  1. New
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold backdrop-blur-md">
                  {unarrived.length}
                </span>
              </div>

              <div className="space-y-1.5 min-h-[60px]">
                {unarrived.length === 0 ? (
                  <span className={`text-[10px] ${colors.textMuted} italic flex items-center justify-center h-full`}>
                    None
                  </span>
                ) : (
                  unarrived.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectProcess && onSelectProcess(p)}
                      className="w-full p-2 rounded-xl border border-white/10 bg-white/5 hover:border-blue-400/50 flex items-center justify-between text-[10px] transition-all backdrop-blur-md active:scale-95"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: p.color, color: p.color }} />
                        <span className="font-bold">{p.id}</span>
                      </div>
                      <span className={colors.textMuted}>at time {p.arrivalTime}</span>
                    </button>
                  ))
                )}
              </div>

              <div className="mt-2.5 text-[9px] text-blue-400/80 text-center font-sans">
                → Enters Ready Queue
              </div>
            </div>

            {/* 2. READY QUEUE */}
            <div className={`p-3.5 rounded-2xl border ${ready.length > 0 ? 'border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : `${colors.border} ${colors.bgCardElevated}`} flex flex-col justify-between backdrop-blur-md`}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  2. Ready Queue
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold backdrop-blur-md">
                  {ready.length}
                </span>
              </div>

              <div className="space-y-1.5 min-h-[60px]">
                {ready.length === 0 ? (
                  <span className={`text-[10px] ${colors.textMuted} italic flex items-center justify-center h-full`}>
                    Empty
                  </span>
                ) : (
                  ready.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectProcess && onSelectProcess(p)}
                      className="w-full p-2 rounded-xl border border-cyan-500/30 bg-cyan-500/15 flex items-center justify-between text-[10px] hover:border-cyan-400/80 transition-all backdrop-blur-md active:scale-95 shadow-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: p.color, color: p.color }} />
                        <span className="font-bold text-cyan-300">{p.id}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/20 font-mono">#{idx + 1}</span>
                      </div>
                      <span className="text-cyan-300 font-semibold">{p.remainingTime} units</span>
                    </button>
                  ))
                )}
              </div>

              <div className="mt-2.5 text-[9px] text-cyan-400 text-center font-sans font-semibold">
                → Dispatched by {algorithm}
              </div>
            </div>

            {/* 3. RUNNING (CPU) */}
            <div className={`p-3.5 rounded-2xl border ${running.length > 0 ? 'border-emerald-500/40 bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.25)]' : `${colors.border} ${colors.bgCardElevated}`} flex flex-col justify-between backdrop-blur-md`}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Cpu className="w-3 h-3 animate-pulse" /> 3. Running (CPU)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold backdrop-blur-md">
                  {running.length} Active
                </span>
              </div>

              <div className="space-y-1.5 min-h-[60px] flex flex-col justify-center">
                {running.length === 0 ? (
                  <span className={`text-[10px] ${colors.textMuted} italic flex items-center justify-center h-full`}>
                    CPU Idle
                  </span>
                ) : (
                  running.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectProcess && onSelectProcess(p)}
                      className="w-full p-2.5 rounded-xl border border-emerald-400/40 bg-emerald-500/25 flex items-center justify-between text-[10px] font-bold text-emerald-300 animate-in zoom-in-95 duration-100 backdrop-blur-md active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: p.color, color: p.color }} />
                        <span>{p.id}</span>
                      </div>
                      <span>{p.remainingTime} units left</span>
                    </button>
                  ))
                )}
              </div>

              <div className="mt-2.5 text-[9px] text-emerald-400 text-center font-sans font-semibold">
                ⇄ Preempt / Terminate
              </div>
            </div>

            {/* 4. WAITING / BLOCKED (I/O) */}
            <div className={`p-3.5 rounded-2xl border ${blocked.length > 0 ? 'border-amber-500/40 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : `${colors.border} ${colors.bgCardElevated}`} flex flex-col justify-between backdrop-blur-md`}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <RotateCw className="w-3 h-3" /> 4. Blocked (I/O)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold backdrop-blur-md">
                  {blocked.length}
                </span>
              </div>

              <div className="space-y-1.5 min-h-[60px]">
                {blocked.length === 0 ? (
                  <span className={`text-[10px] ${colors.textMuted} italic flex items-center justify-center h-full`}>
                    None waiting
                  </span>
                ) : (
                  blocked.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectProcess && onSelectProcess(p)}
                      className="w-full p-2 rounded-xl border border-amber-500/30 bg-amber-500/15 flex items-center justify-between text-[10px] transition-all backdrop-blur-md active:scale-95"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: p.color, color: p.color }} />
                        <span className="font-bold text-amber-300">{p.id}</span>
                      </div>
                      <span className="text-amber-300 font-semibold">{p.blockedRemaining} units</span>
                    </button>
                  ))
                )}
              </div>

              <div className="mt-2.5 text-[9px] text-amber-400 text-center font-sans">
                → I/O complete to Ready
              </div>
            </div>

            {/* 5. TERMINATED / COMPLETED */}
            <div className={`p-3.5 rounded-2xl border ${completed.length > 0 ? 'border-purple-500/30 bg-purple-500/10 shadow-[0_0_12px_rgba(168,85,247,0.15)]' : `${colors.border} ${colors.bgCardElevated}`} flex flex-col justify-between backdrop-blur-md`}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 5. Terminated
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold backdrop-blur-md">
                  {completed.length}/{processes.length}
                </span>
              </div>

              <div className="space-y-1.5 min-h-[60px]">
                {completed.length === 0 ? (
                  <span className={`text-[10px] ${colors.textMuted} italic flex items-center justify-center h-full`}>
                    None yet
                  </span>
                ) : (
                  completed.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectProcess && onSelectProcess(p)}
                      className="w-full p-2 rounded-xl border border-purple-500/30 bg-purple-500/15 flex items-center justify-between text-[10px] transition-all backdrop-blur-md active:scale-95"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: p.color, color: p.color }} />
                        <span className="font-bold text-purple-300">{p.id}</span>
                      </div>
                      <span className="text-[9px] text-purple-300">Done at {p.completionTime}</span>
                    </button>
                  ))
                )}
              </div>

              <div className="mt-2.5 text-[9px] text-purple-400 text-center font-sans">
                ✔ Finished Execution
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
