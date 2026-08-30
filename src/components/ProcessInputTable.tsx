import React from 'react';
import { Plus, Trash2, Shuffle, RotateCcw } from 'lucide-react';
import { Process } from '../types/scheduler';
import { DEFAULT_COLORS } from '../data/presets';
import { useTheme } from '../context/ThemeContext';

interface ProcessInputTableProps {
  processes: Process[];
  onChangeProcesses: (newProcesses: Process[]) => void;
}

export const ProcessInputTable: React.FC<ProcessInputTableProps> = ({
  processes,
  onChangeProcesses,
}) => {
  const { colors, theme } = useTheme();

  // Add new process
  const handleAddProcess = () => {
    const nextIdx = processes.length + 1;
    const nextId = `P${nextIdx}`;
    const nextColor = DEFAULT_COLORS[(nextIdx - 1) % DEFAULT_COLORS.length];
    
    const maxArrival = processes.reduce((max, p) => Math.max(max, p.arrivalTime), 0);

    const newProc: Process = {
      id: nextId,
      name: `Process ${nextIdx}`,
      arrivalTime: maxArrival + 1,
      burstTime: Math.floor(Math.random() * 4) + 2,
      remainingTime: Math.floor(Math.random() * 4) + 2,
      priority: Math.min(10, nextIdx),
      currentPriority: Math.min(10, nextIdx),
      agedCount: 0,
      color: nextColor,
      ioSchedule: [],
      state: 'UNARRIVED',
      currentCoreId: null,
      blockedRemaining: 0,
      quantumRemaining: 0,
      starvationTicks: 0,
      lastExecutedCoreId: null,
      startTime: null,
      completionTime: null,
      waitingTime: 0,
      turnaroundTime: 0,
      responseTime: null,
    };

    onChangeProcesses([...processes, newProc]);
  };

  // Delete process
  const handleDeleteProcess = (id: string) => {
    if (processes.length <= 1) return;
    const updated = processes.filter((p) => p.id !== id);
    onChangeProcesses(updated);
  };

  // Update specific field
  const handleUpdateField = (
    id: string,
    field: 'arrivalTime' | 'burstTime' | 'priority',
    value: number
  ) => {
    const safeVal = Math.max(0, Math.min(99, isNaN(value) ? 0 : value));
    const updated = processes.map((p) => {
      if (p.id === id) {
        const isBurst = field === 'burstTime';
        const finalVal = isBurst ? Math.max(1, safeVal) : safeVal;
        return {
          ...p,
          [field]: finalVal,
          remainingTime: isBurst ? finalVal : p.remainingTime,
        };
      }
      return p;
    });
    onChangeProcesses(updated);
  };

  // Randomize values
  const handleRandomize = () => {
    const count = Math.max(3, processes.length || 4);
    const randomized: Process[] = Array.from({ length: count }, (_, i) => {
      const idx = i + 1;
      const bt = Math.floor(Math.random() * 7) + 2;
      return {
        id: `P${idx}`,
        name: `Process ${idx}`,
        arrivalTime: i === 0 ? 0 : Math.floor(Math.random() * 5),
        burstTime: bt,
        remainingTime: bt,
        priority: Math.floor(Math.random() * 5) + 1,
        currentPriority: Math.floor(Math.random() * 5) + 1,
        agedCount: 0,
        color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        ioSchedule: [],
        state: 'UNARRIVED',
        currentCoreId: null,
        blockedRemaining: 0,
        quantumRemaining: 0,
        starvationTicks: 0,
        lastExecutedCoreId: null,
        startTime: null,
        completionTime: null,
        waitingTime: 0,
        turnaroundTime: 0,
        responseTime: null,
      };
    });
    onChangeProcesses(randomized);
  };

  // Reset to clean 4-process starter workload
  const handleResetDefaults = () => {
    const defaultData: Process[] = [
      { id: 'P1', name: 'Process 1', arrivalTime: 0, burstTime: 6, remainingTime: 6, priority: 3, currentPriority: 3, agedCount: 0, color: '#3b82f6', ioSchedule: [], state: 'UNARRIVED', currentCoreId: null, blockedRemaining: 0, quantumRemaining: 0, starvationTicks: 0, lastExecutedCoreId: null, startTime: null, completionTime: null, waitingTime: 0, turnaroundTime: 0, responseTime: null },
      { id: 'P2', name: 'Process 2', arrivalTime: 1, burstTime: 4, remainingTime: 4, priority: 1, currentPriority: 1, agedCount: 0, color: '#06b6d4', ioSchedule: [], state: 'UNARRIVED', currentCoreId: null, blockedRemaining: 0, quantumRemaining: 0, starvationTicks: 0, lastExecutedCoreId: null, startTime: null, completionTime: null, waitingTime: 0, turnaroundTime: 0, responseTime: null },
      { id: 'P3', name: 'Process 3', arrivalTime: 2, burstTime: 8, remainingTime: 8, priority: 4, currentPriority: 4, agedCount: 0, color: '#10b981', ioSchedule: [], state: 'UNARRIVED', currentCoreId: null, blockedRemaining: 0, quantumRemaining: 0, starvationTicks: 0, lastExecutedCoreId: null, startTime: null, completionTime: null, waitingTime: 0, turnaroundTime: 0, responseTime: null },
      { id: 'P4', name: 'Process 4', arrivalTime: 3, burstTime: 3, remainingTime: 3, priority: 2, currentPriority: 2, agedCount: 0, color: '#f59e0b', ioSchedule: [], state: 'UNARRIVED', currentCoreId: null, blockedRemaining: 0, quantumRemaining: 0, starvationTicks: 0, lastExecutedCoreId: null, startTime: null, completionTime: null, waitingTime: 0, turnaroundTime: 0, responseTime: null },
    ];
    onChangeProcesses(defaultData);
  };

  return (
    <div id="process-input-section" className={`rounded-2xl border ${colors.border} ${colors.bgCard} p-4 sm:p-5 transition-all space-y-3.5 shadow-md`}>
      
      {/* Process Table Heading and Clean Top Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-inherit">
        <div className="flex items-center gap-2.5">
          <div>
            <h2 className={`text-sm sm:text-base font-bold uppercase tracking-wider ${colors.textPrimary}`}>
              Process Details & Input Workload
            </h2>
            <p className={`text-xs ${colors.textMuted}`}>
              Specify when each process arrives and how much CPU execution time it needs
            </p>
          </div>
        </div>

        {/* Clean action buttons: Add, Randomize, Reset */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAddProcess}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white backdrop-blur-md transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 border border-cyan-400/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Process</span>
          </button>

          <button
            onClick={handleRandomize}
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl border ${colors.border} ${colors.borderHover} ${colors.textSecondary} hover:${colors.textPrimary} bg-white/5 backdrop-blur-md transition-all active:scale-95`}
            title="Randomize numbers"
          >
            <Shuffle className="w-4 h-4 text-cyan-400" />
            <span>Randomize</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl border ${colors.border} ${colors.borderHover} ${colors.textSecondary} hover:${colors.textPrimary} bg-white/5 backdrop-blur-md transition-all active:scale-95`}
            title="Reset to default 4 processes"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Responsive Process Table */}
      <div className="w-full overflow-x-auto rounded-xl border border-inherit">
        <table className="w-full text-left text-sm border-collapse font-sans min-w-[500px]">
          <thead>
            <tr className={`border-b border-inherit bg-white/5 ${colors.textMuted} uppercase text-xs font-bold font-mono`}>
              <th className="py-3 px-4">Process</th>
              <th className="py-3 px-4">Arrival Time</th>
              <th className="py-3 px-4">Burst Time (CPU Duration)</th>
              <th className="py-3 px-4">Priority Value</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-inherit">
            {processes.map((proc) => (
              <tr 
                key={proc.id}
                className={`group transition-all ${
                  theme === 'light' 
                    ? 'hover:bg-black/5' 
                    : 'hover:bg-white/5'
                }`}
              >
                {/* Process ID / Name */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
                      style={{ backgroundColor: proc.color, color: proc.color }}
                    />
                    <span className={`font-extrabold text-base font-mono ${colors.textPrimary}`}>
                      {proc.id}
                    </span>
                  </div>
                </td>

                {/* Arrival Time input */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={proc.arrivalTime}
                      onChange={(e) =>
                        handleUpdateField(proc.id, 'arrivalTime', parseInt(e.target.value, 10))
                      }
                      className={`w-18 px-2.5 py-1.5 rounded-lg border text-center text-sm font-bold font-mono ${colors.bgInput} outline-none`}
                      aria-label={`${proc.id} Arrival Time`}
                    />
                    <span className={`text-xs ${colors.textMuted}`}>units</span>
                  </div>
                </td>

                {/* Burst Time input */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={proc.burstTime}
                      onChange={(e) =>
                        handleUpdateField(proc.id, 'burstTime', parseInt(e.target.value, 10))
                      }
                      className={`w-18 px-2.5 py-1.5 rounded-lg border text-center text-sm font-bold font-mono ${colors.bgInput} outline-none`}
                      aria-label={`${proc.id} Burst Time`}
                    />
                    <span className={`text-xs ${colors.textMuted}`}>units</span>
                  </div>
                </td>

                {/* Priority input */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={proc.priority}
                      onChange={(e) =>
                        handleUpdateField(proc.id, 'priority', parseInt(e.target.value, 10))
                      }
                      className={`w-18 px-2.5 py-1.5 rounded-lg border text-center text-sm font-bold font-mono ${colors.bgInput} outline-none`}
                      aria-label={`${proc.id} Priority`}
                    />
                    <span className={`text-xs ${colors.textMuted}`}>(1-10)</span>
                  </div>
                </td>

                {/* Delete button */}
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleDeleteProcess(proc.id)}
                    disabled={processes.length <= 1}
                    className={`p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/15 backdrop-blur-md transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed`}
                    title="Remove process"
                    aria-label={`Remove ${proc.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`pt-2 border-t border-inherit flex flex-wrap items-center justify-between gap-2 text-xs ${colors.textMuted}`}>
        <span>💡 <strong>Arrival Time:</strong> When the process enters the system. <strong>Burst Time:</strong> How much execution time it takes to finish.</span>
        <span>Calculations update in real-time.</span>
      </div>
    </div>
  );
};
