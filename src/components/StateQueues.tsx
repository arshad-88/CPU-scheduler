import React from 'react';
import { 
  CheckCircle2, 
  ListOrdered
} from 'lucide-react';
import { Process, AlgorithmType } from '../types/scheduler';
import { useTheme } from '../context/ThemeContext';

interface StateQueuesProps {
  processes: Process[];
  algorithm: AlgorithmType;
  currentTick: number;
  enableAging?: boolean;
  agingThreshold?: number;
  onSelectProcess?: (process: Process) => void;
}

export const StateQueues: React.FC<StateQueuesProps> = ({
  processes,
  onSelectProcess,
}) => {
  const { colors } = useTheme();

  const ready = processes.filter((p) => p.state === 'READY');
  const completed = processes.filter((p) => p.state === 'COMPLETED');

  return (
    <div id="state-queues-section" className="space-y-3">
      
      {/* 2 Focused Queue Columns: Ready Queue & Completed Processes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        
        {/* 1. Ready Queue */}
        <div className={`rounded-2xl p-4 sm:p-5 border ${colors.border} ${colors.bgCard} flex flex-col transition-all shadow-md`}>
          <div className={`flex items-center justify-between pb-2.5 mb-2.5 border-b border-inherit`}>
            <span className={`text-xs font-bold font-mono uppercase tracking-wider ${colors.textMuted} flex items-center gap-1.5`}>
              <ListOrdered className="w-4 h-4 text-amber-400" />
              Ready Queue (Waiting for CPU)
            </span>
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40 backdrop-blur-md font-bold shadow-xs`}>
              {ready.length} Waiting
            </span>
          </div>

          <div className="flex-1 space-y-2 min-h-[60px]">
            {ready.length === 0 ? (
              <p className={`text-xs ${colors.textMuted} italic py-3 text-center`}>No processes currently in ready queue</p>
            ) : (
              ready.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectProcess && onSelectProcess(p)}
                  className={`p-2.5 rounded-xl border ${colors.border} ${colors.bgCardElevated} text-xs font-mono flex items-center justify-between cursor-pointer hover:border-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.2)] backdrop-blur-md transition-all active:scale-98`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: p.color, color: p.color }} />
                    <span className={`font-bold ${colors.textPrimary}`}>{p.id}</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-amber-400">
                    <span>{p.remainingTime} units remaining</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Completed Processes */}
        <div className={`rounded-2xl p-4 sm:p-5 border ${colors.border} ${colors.bgCard} flex flex-col transition-all shadow-md`}>
          <div className={`flex items-center justify-between pb-2.5 mb-2.5 border-b border-inherit`}>
            <span className={`text-xs font-bold font-mono uppercase tracking-wider ${colors.textMuted} flex items-center gap-1.5`}>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Completed Processes
            </span>
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/40 backdrop-blur-md font-bold shadow-xs`}>
              {completed.length} / {processes.length} Finished
            </span>
          </div>

          <div className="flex-1 space-y-2 min-h-[60px]">
            {completed.length === 0 ? (
              <p className={`text-xs ${colors.textMuted} italic py-3 text-center`}>No completed processes yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {completed.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 text-xs font-mono font-bold backdrop-blur-md shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{p.id}</span>
                    <span className="text-[11px] opacity-90 font-normal">Finish: {p.completionTime}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
