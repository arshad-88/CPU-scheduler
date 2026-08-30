import React from 'react';
import { 
  HelpCircle, 
  Cpu, 
  Clock, 
  Zap, 
  ListOrdered, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { SchedulerDecision, AlgorithmType, Process, CPUCore } from '../types/scheduler';
import { useTheme } from '../context/ThemeContext';

interface SchedulerDecisionPanelProps {
  decision: SchedulerDecision | null;
  algorithm: AlgorithmType;
  currentTick: number;
  processes: Process[];
  cores: CPUCore[];
  totalPreemptions: number;
  totalContextSwitches: number;
  onSelectProcess?: (p: Process) => void;
}

export const SchedulerDecisionPanel: React.FC<SchedulerDecisionPanelProps> = ({
  decision,
  algorithm,
  currentTick,
  processes,
  cores,
  totalPreemptions,
  totalContextSwitches,
  onSelectProcess,
}) => {
  const { colors } = useTheme();

  const activeCore = cores[0];
  const runningProcess = processes.find((p) => p.id === activeCore?.assignedProcessId);
  const readyQueue = decision?.readyQueueSnapshot || processes.filter((p) => p.state === 'READY');

  return (
    <div id="scheduler-decision-section" className={`rounded-2xl border ${colors.border} ${colors.bgCard} p-4 sm:p-5 transition-all space-y-3.5 font-sans`}>
      
      {/* Section Heading (20-24px) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-inherit">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/40">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-lg sm:text-xl font-bold ${colors.textPrimary}`}>
              Scheduler Decision & Reason
            </h2>
            <p className={`text-xs ${colors.textMuted} mt-0.5`}>
              Educational insight explaining why the {algorithm} scheduler selected this process at Time = {currentTick}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{totalPreemptions} Preemptions</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>{totalContextSwitches} Context Switches</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Decision Reason & Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        
        {/* Left 2 Cols: Decision Explanation Box */}
        <div className={`lg:col-span-2 p-4 rounded-xl border ${colors.border} ${colors.bgCardElevated} flex flex-col justify-between space-y-3`}>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4" /> CPU State at Time = {currentTick}
              </span>
              
              {decision?.selectedProcessId && decision.selectedProcessId !== 'IDLE' && decision.selectedProcessId !== 'CS' ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-bold font-mono bg-emerald-600/25 text-emerald-300 border border-emerald-500/40">
                  Selected Process: {decision.selectedProcessId}
                </span>
              ) : activeCore?.isSwitching ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-bold font-mono bg-rose-600/25 text-rose-300 border border-rose-500/40">
                  Context Switch (CS)
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full font-bold font-mono bg-slate-600/25 text-slate-300 border border-slate-500/40">
                  CPU IDLE
                </span>
              )}
            </div>

            {/* Decision Reason Statement (15-16px body text) */}
            <div className={`p-3.5 rounded-xl border ${
              activeCore?.isSwitching
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                : runningProcess || decision?.selectedProcessId !== 'IDLE'
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-100'
                : 'border-slate-700 bg-slate-800/40 text-slate-300'
            }`}>
              <p className="text-sm sm:text-base font-medium leading-relaxed font-sans">
                "{decision?.reason || 'CPU ready to schedule processes. Click RUN SIMULATION or Step (+1 Tick) to start.'}"
              </p>
            </div>
          </div>

          {/* Event Notifications (Arrivals / Preemptions) */}
          {decision?.eventLog && (
            <div className="flex items-center gap-2 text-xs font-mono p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="truncate">{decision.eventLog}</span>
            </div>
          )}

        </div>

        {/* Right Col: Candidate Ready Queue Pool (14-15px text) */}
        <div className={`p-4 rounded-xl border ${colors.border} ${colors.bgCardElevated} flex flex-col space-y-2`}>
          <div className="flex items-center justify-between pb-2 border-b border-inherit">
            <span className={`text-xs font-bold uppercase tracking-wider font-mono ${colors.textMuted} flex items-center gap-1.5`}>
              <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
              Ready Queue Candidate Pool
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {readyQueue.length} Ready
            </span>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-40 pr-1">
            {readyQueue.length === 0 ? (
              <p className={`text-xs ${colors.textMuted} italic py-4 text-center font-sans`}>
                No processes currently waiting in Ready Queue
              </p>
            ) : (
              readyQueue.map((item) => {
                const isChosen = decision?.selectedProcessId === item.id;
                const fullProc = processes.find((p) => p.id === item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => fullProc && onSelectProcess && onSelectProcess(fullProc)}
                    className={`p-2 rounded-lg border text-xs font-mono flex items-center justify-between transition-all cursor-pointer ${
                      isChosen
                        ? 'border-cyan-400 bg-cyan-600/30 font-bold shadow-xs'
                        : `${colors.border} ${colors.bgInput} hover:border-amber-400/50`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fullProc?.color || '#3b82f6' }} />
                      <span className={colors.textPrimary}>{item.id}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-cyan-300">
                      <span>{item.remainingTime}u burst</span>
                      <span>Pri: {item.priority}</span>
                      {isChosen && <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
