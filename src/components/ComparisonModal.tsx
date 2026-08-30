import React, { useMemo } from 'react';
import { 
  BarChart3, 
  X, 
  Trophy, 
  ArrowRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { 
  Process, 
  AlgorithmType, 
  AlgorithmComparisonResult, 
  PriorityOrder 
} from '../types/scheduler';
import { runAlgorithmHeadless } from '../services/schedulerEngine';
import { useTheme } from '../context/ThemeContext';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  processes: Process[];
  numCores: number;
  quantum: number;
  contextSwitchTime: number;
  enableAging: boolean;
  agingThreshold: number;
  priorityBoost: number;
  priorityOrder: PriorityOrder;
  onSelectAlgorithm: (algorithm: AlgorithmType) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  processes,
  numCores,
  quantum,
  contextSwitchTime,
  enableAging,
  agingThreshold,
  priorityBoost,
  priorityOrder,
  onSelectAlgorithm,
}) => {
  const { colors, theme } = useTheme();

  // Run all 6 core algorithms headlessly
  const comparisonResults = useMemo<AlgorithmComparisonResult[]>(() => {
    if (!isOpen || processes.length === 0) return [];

    const algos: AlgorithmType[] = [
      'FCFS',
      'SJF',
      'SRTF',
      'RR',
      'PRIORITY_NP',
      'PRIORITY_P',
    ];

    return algos.map((algo) =>
      runAlgorithmHeadless(processes, algo, {
        numCores,
        quantum,
        contextSwitchTime,
        enableAging,
        agingThreshold,
        priorityBoost,
        priorityOrder,
      })
    );
  }, [
    isOpen,
    processes,
    numCores,
    quantum,
    contextSwitchTime,
    enableAging,
    agingThreshold,
    priorityBoost,
    priorityOrder,
  ]);

  if (!isOpen) return null;

  // Chart data
  const chartData = comparisonResults.map((r) => ({
    name: r.algorithm,
    'Avg Waiting Time (WT)': r.kpis.avgWaitingTime,
    'Avg Turnaround Time (TAT)': r.kpis.avgTurnaroundTime,
    'Avg Response Time (RT)': r.kpis.avgResponseTime,
  }));

  // Find lowest waiting time
  const bestWT = Math.min(...comparisonResults.map((r) => r.kpis.avgWaitingTime));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className={`w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border ${colors.border} ${colors.bgCard} shadow-2xl overflow-hidden transition-colors`}>
        
        {/* Modal Header */}
        <div className={`p-5 sm:p-6 border-b border-inherit flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-lg sm:text-xl font-extrabold font-mono uppercase tracking-wider ${colors.textPrimary}`}>
                6-Algorithm Benchmark Comparison
              </h2>
              <p className={`text-xs ${colors.textMuted}`}>
                Side-by-side performance evaluation on your current {processes.length} processes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border ${colors.border} ${colors.textMuted} hover:${colors.textPrimary} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Comparison Bar Chart */}
          <div className={`p-5 rounded-xl border ${colors.border} ${colors.bgCardElevated}`}>
            <h3 className={`text-sm font-bold font-mono uppercase mb-3 ${colors.textPrimary}`}>
              Waiting Time vs. Turnaround Time Comparison (Lower is Better)
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme === 'light' ? '#111' : '#eee', fontWeight: 'bold' }} />
                  <YAxis tick={{ fontSize: 12, fill: theme === 'light' ? '#111' : '#eee' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'light' ? '#fff' : '#0f172a',
                      borderColor: theme === 'light' ? '#ccc' : '#334155',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Avg Waiting Time (WT)" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Avg Turnaround Time (TAT)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Comparison Table */}
          <div className={`rounded-xl border ${colors.border} overflow-hidden shadow-sm`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-mono border-collapse">
                <thead>
                  <tr className={`border-b ${colors.border} ${colors.bgCardElevated} ${colors.textMuted} uppercase text-xs font-bold`}>
                    <th className="py-3.5 px-4">Algorithm</th>
                    <th className="py-3.5 px-4">Avg Waiting Time</th>
                    <th className="py-3.5 px-4">Avg Turnaround Time</th>
                    <th className="py-3.5 px-4">Avg Response Time</th>
                    <th className="py-3.5 px-4">CPU Utilization</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-inherit">
                  {comparisonResults.map((result) => {
                    const isOptimal = result.kpis.avgWaitingTime === bestWT;

                    return (
                      <tr key={result.algorithm} className="transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                        <td className="py-3.5 px-4 font-bold">
                          <div className="flex items-center gap-2">
                            {isOptimal && (
                              <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
                            )}
                            <span className={isOptimal ? 'text-cyan-400 font-extrabold text-base' : colors.textPrimary}>
                              {result.algorithm}
                            </span>
                            {isOptimal && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-extrabold border border-yellow-500/40">
                                BEST
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-extrabold text-cyan-400 text-base">
                          {result.kpis.avgWaitingTime} units
                        </td>

                        <td className="py-3.5 px-4 font-extrabold text-blue-400 text-base">
                          {result.kpis.avgTurnaroundTime} units
                        </td>

                        <td className="py-3.5 px-4 font-bold text-emerald-400">
                          {result.kpis.avgResponseTime} units
                        </td>

                        <td className={`py-3.5 px-4 font-semibold ${colors.textSecondary}`}>
                          {result.kpis.cpuUtilization}%
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              onSelectAlgorithm(result.algorithm);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold ml-auto transition-colors shadow-xs active:scale-95"
                          >
                            <span>Select</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
