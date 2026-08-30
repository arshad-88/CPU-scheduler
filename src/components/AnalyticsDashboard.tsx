import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Clock, 
  Cpu, 
  TrendingUp, 
  Activity, 
  FileText, 
  Copy, 
  Check, 
  Calculator,
  Info,
  AlertTriangle,
  Scale,
  Sliders,
  Sparkles,
  Zap,
  HelpCircle
} from 'lucide-react';
import { Process, CPUCore, SimulationKPIs, GanttSegment, AlgorithmType, PriorityOrder } from '../types/scheduler';
import { calculateKPIs, runAlgorithmHeadless } from '../services/schedulerEngine';
import { useTheme } from '../context/ThemeContext';

interface AnalyticsDashboardProps {
  processes: Process[];
  cores: CPUCore[];
  currentTick: number;
  algorithm: AlgorithmType;
  quantum?: number;
  contextSwitchTime?: number;
  enableAging?: boolean;
  agingThreshold?: number;
  priorityBoost?: number;
  priorityOrder?: PriorityOrder;
  totalContextSwitches?: number;
  totalPreemptions?: number;
  ganttHistory?: GanttSegment[];
  isCompleted?: boolean;
  selectedProcessId?: string | null;
  onSelectProcess?: (p: Process) => void;
}

function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return [59, 130, 246];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  processes,
  cores,
  currentTick,
  algorithm,
  quantum = 3,
  contextSwitchTime = 0,
  enableAging = true,
  agingThreshold = 6,
  priorityBoost = 1,
  priorityOrder = 'LOWER_IS_HIGHER' as PriorityOrder,
  totalContextSwitches = 0,
  totalPreemptions = 0,
  ganttHistory = [],
  isCompleted = false,
  selectedProcessId,
  onSelectProcess,
}) => {
  const { colors, theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [showFormulaDetails, setShowFormulaDetails] = useState(true);
  const [activeTab, setActiveTab] = useState<'metrics' | 'fairness' | 'rr_quantum' | 'what_if'>('metrics');

  // What-If Sandbox State
  const [whatIfQuantum, setWhatIfQuantum] = useState<number>(quantum);
  const [whatIfCS, setWhatIfCS] = useState<number>(contextSwitchTime);

  const isAllCompleted = isCompleted || (processes.length > 0 && processes.every((p) => p.state === 'COMPLETED' || p.remainingTime === 0));

  const kpis: SimulationKPIs = useMemo(() => {
    const calculated = calculateKPIs(processes, cores, currentTick, totalContextSwitches);
    calculated.totalPreemptions = totalPreemptions;
    return calculated;
  }, [processes, cores, currentTick, totalContextSwitches, totalPreemptions]);

  const count = processes.length || 1;
  const maxWait = Math.max(...processes.map((p) => p.waitingTime), 1);

  const tatSumStr = processes.map((p) => (p.turnaroundTime || 0)).join(' + ');
  const wtSumStr = processes.map((p) => (p.waitingTime || 0)).join(' + ');
  const rtSumStr = processes.map((p) => (p.responseTime !== null ? p.responseTime : 0)).join(' + ');

  // Round Robin Quantum sensitivity calculation
  const rrQuantumAnalysis = useMemo(() => {
    if (algorithm !== 'RR') return [];
    const quantums = [1, 2, 4, 8];
    return quantums.map((q) => {
      const res = runAlgorithmHeadless(processes, 'RR', {
        numCores: 1,
        quantum: q,
        contextSwitchTime,
        enableAging,
        agingThreshold,
        priorityBoost,
        priorityOrder: priorityOrder || 'LOWER_IS_HIGHER',
      });
      return {
        quantum: q,
        avgWT: res.kpis.avgWaitingTime,
        avgRT: res.kpis.avgResponseTime,
        contextSwitches: res.kpis.totalContextSwitches,
        throughput: res.kpis.throughput,
      };
    });
  }, [processes, algorithm, contextSwitchTime, enableAging, agingThreshold, priorityBoost, priorityOrder]);

  // What-If Comparison calculation
  const whatIfResult = useMemo(() => {
    return runAlgorithmHeadless(processes, algorithm, {
      numCores: 1,
      quantum: whatIfQuantum,
      contextSwitchTime: whatIfCS,
      enableAging,
      agingThreshold,
      priorityBoost,
      priorityOrder: priorityOrder || 'LOWER_IS_HIGHER',
    });
  }, [processes, algorithm, whatIfQuantum, whatIfCS, enableAging, agingThreshold, priorityBoost, priorityOrder]);

  const handleCopyMetrics = () => {
    const textSummary = `
--- CPU Scheduling Simulation Results ---
Algorithm: ${algorithm}
Elapsed Time: ${currentTick} time units
Completed Processes: ${kpis.completedCount} / ${kpis.totalCount}
Average Turnaround Time (TAT): ${kpis.avgTurnaroundTime} units
Average Waiting Time (WT): ${kpis.avgWaitingTime} units
Average Response Time (RT): ${kpis.avgResponseTime} units
CPU Utilization: ${kpis.cpuUtilization}%
Context Switches: ${kpis.totalContextSwitches}
Preemptions: ${totalPreemptions}
Jain's Fairness Index: ${kpis.fairnessIndex}
------------------------------------------
Process Details:
${processes.map((p) => `${p.id} | Arrival: ${p.arrivalTime} | Burst: ${p.burstTime} | Completion: ${p.completionTime ?? '-'} | Turnaround: ${p.turnaroundTime} | Waiting: ${p.waitingTime} | Response: ${p.responseTime ?? '-'}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(textSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    if (!isAllCompleted) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const primaryColor: [number, number, number] = [15, 23, 42];
      const textColor: [number, number, number] = [30, 41, 59];
      const mutedColor: [number, number, number] = [100, 116, 139];

      // Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 595.28, 66, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.setTextColor(255, 255, 255);
      doc.text('CPU Scheduling Simulation Report', 40, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 52);

      // Metadata Overview
      let yPos = 88;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...primaryColor);
      doc.text('Simulation & Algorithm Summary', 40, yPos);

      yPos += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...textColor);
      doc.text(`• Algorithm Selected: ${algorithm}`, 45, yPos);
      doc.text(`• Total Elapsed Time: ${currentTick} time units`, 310, yPos);

      yPos += 13;
      doc.text(`• Total Workload: ${processes.length} Processes (All Completed)`, 45, yPos);
      doc.text(`• CPU Utilization: ${kpis.cpuUtilization}% | Fairness Index: ${kpis.fairnessIndex}`, 310, yPos);

      // KPI Metrics Cards Box
      yPos += 16;
      const kpiBoxHeight = 44;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(40, yPos, 515.28, kpiBoxHeight, 5, 5, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(40, yPos, 515.28, kpiBoxHeight, 5, 5, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...mutedColor);
      doc.text('AVERAGE TURNAROUND TIME', 55, yPos + 15);
      doc.text('AVERAGE WAITING TIME', 230, yPos + 15);
      doc.text('AVERAGE RESPONSE TIME', 395, yPos + 15);

      doc.setFontSize(12);
      doc.setTextColor(14, 116, 144);
      doc.text(`${kpis.avgTurnaroundTime} units`, 55, yPos + 32);
      doc.setTextColor(2, 132, 199);
      doc.text(`${kpis.avgWaitingTime} units`, 230, yPos + 32);
      doc.setTextColor(16, 149, 193);
      doc.text(`${kpis.avgResponseTime} units`, 395, yPos + 32);

      // Process Table
      yPos += kpiBoxHeight + 26;
      const tableHeaders = [
        ['ID', 'Arrival', 'Burst', 'Priority', 'Completion', 'Turnaround (TAT)', 'Waiting (WT)', 'Response (RT)', 'State']
      ];

      const tableRows = processes.map((p) => [
        p.id,
        p.arrivalTime.toString(),
        p.burstTime.toString(),
        p.priority !== undefined ? p.priority.toString() : '-',
        p.completionTime !== null ? p.completionTime.toString() : '-',
        p.turnaroundTime.toString(),
        p.waitingTime.toString(),
        p.responseTime !== null ? p.responseTime.toString() : '-',
        p.state === 'COMPLETED' || p.remainingTime === 0 ? 'COMPLETED' : p.state
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: yPos,
        margin: { left: 40, right: 40 },
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8.5,
          cellPadding: 4,
        },
        bodyStyles: {
          textColor: [30, 41, 59],
          halign: 'center',
          fontSize: 8.5,
          cellPadding: 3.5,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { fontStyle: 'bold', halign: 'center', textColor: [2, 132, 199] },
        },
      });

      doc.save(`CPU_Scheduling_${algorithm.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  return (
    <div id="analytics-dashboard-section" className="space-y-4">
      
      {/* Starvation Warning Alert Banner */}
      {kpis.starvationWarnings.length > 0 && (
        <div className="p-3.5 rounded-2xl border border-amber-500/40 bg-amber-500/15 text-amber-200 text-xs font-sans space-y-1 shadow-md animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Starvation Alert Warning</span>
          </div>
          {kpis.starvationWarnings.map((warn, i) => (
            <p key={i} className="pl-6 text-[11px] font-mono text-amber-200/90">
              • {warn}
            </p>
          ))}
          <p className="pl-6 text-[10px] text-amber-300/80 font-sans">
            Note: Non-preemptive SJF or Priority algorithms can cause lower-priority or longer jobs to wait indefinitely if short/high-priority jobs arrive continuously.
          </p>
        </div>
      )}

      {/* Analytics Sub-Tab Navigation Header */}
      <div className={`p-2 rounded-2xl border ${colors.border} ${colors.bgCard} flex flex-wrap items-center justify-between gap-2 shadow-sm`}>
        <div className="flex flex-wrap items-center gap-1.5 font-sans text-xs">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'metrics'
                ? 'bg-cyan-600 text-white shadow-xs'
                : `${colors.textSecondary} hover:${colors.textPrimary} bg-white/5`
            }`}
          >
            📊 Performance Dashboard
          </button>

          <button
            onClick={() => setActiveTab('fairness')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'fairness'
                ? 'bg-cyan-600 text-white shadow-xs'
                : `${colors.textSecondary} hover:${colors.textPrimary} bg-white/5`
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Fairness Analysis (Index: {kpis.fairnessIndex})</span>
          </button>

          {algorithm === 'RR' && (
            <button
              onClick={() => setActiveTab('rr_quantum')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'rr_quantum'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : `${colors.textSecondary} hover:${colors.textPrimary} bg-white/5`
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Round Robin Quantum Sensitivity</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('what_if')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'what_if'
                ? 'bg-cyan-600 text-white shadow-xs'
                : `${colors.textSecondary} hover:${colors.textPrimary} bg-white/5`
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>What-If Sandbox</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMetrics}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${colors.border} ${colors.bgInput} backdrop-blur-md hover:brightness-110 transition-all active:scale-95 flex items-center gap-1.5`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={!isAllCompleted}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              isAllCompleted
                ? `border-cyan-500/40 ${colors.bgInput} text-cyan-400 hover:brightness-110 active:scale-95 shadow-xs`
                : `border-slate-700/50 bg-slate-800/30 text-slate-500 opacity-50 cursor-not-allowed`
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Performance Dashboard */}
      {activeTab === 'metrics' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* 4 Key KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* Avg Turnaround Time */}
            <div className={`rounded-2xl p-4 sm:p-5 border ${colors.border} ${colors.bgCard} shadow-md transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-extrabold uppercase tracking-wider ${colors.textMuted}`}>
                  Avg Turnaround Time
                </span>
                <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl sm:text-4xl font-extrabold font-mono ${colors.textPrimary}`}>
                  {kpis.avgTurnaroundTime}
                </span>
                <span className="text-xs font-semibold text-blue-400">time units</span>
              </div>
              <p className={`text-xs ${colors.textMuted} font-sans mt-2`}>
                TAT = Completion Time − Arrival Time
              </p>
            </div>

            {/* Avg Waiting Time */}
            <div className={`rounded-2xl p-4 sm:p-5 border ${colors.border} ${colors.bgCard} shadow-md transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-extrabold uppercase tracking-wider ${colors.textMuted}`}>
                  Avg Waiting Time
                </span>
                <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl sm:text-4xl font-extrabold font-mono ${colors.textPrimary}`}>
                  {kpis.avgWaitingTime}
                </span>
                <span className="text-xs font-semibold text-cyan-400">time units</span>
              </div>
              <p className={`text-xs ${colors.textMuted} font-sans mt-2`}>
                WT = Turnaround Time − Burst Time
              </p>
            </div>

            {/* Avg Response Time */}
            <div className={`rounded-2xl p-4 sm:p-5 border ${colors.border} ${colors.bgCard} shadow-md transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-extrabold uppercase tracking-wider ${colors.textMuted}`}>
                  Avg Response Time
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl sm:text-4xl font-extrabold font-mono ${colors.textPrimary}`}>
                  {kpis.avgResponseTime}
                </span>
                <span className="text-xs font-semibold text-emerald-400">time units</span>
              </div>
              <p className={`text-xs ${colors.textMuted} font-sans mt-2`}>
                RT = First Start Time − Arrival Time
              </p>
            </div>

            {/* CPU Utilization & System Stats */}
            <div className={`rounded-2xl p-4 sm:p-5 border ${colors.border} ${colors.bgCard} shadow-md transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-extrabold uppercase tracking-wider ${colors.textMuted}`}>
                  CPU Utilization
                </span>
                <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400">
                  <Cpu className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl sm:text-4xl font-extrabold font-mono ${colors.textPrimary}`}>
                  {kpis.cpuUtilization}%
                </span>
                <span className="text-xs font-semibold text-purple-400">Busy</span>
              </div>
              <p className={`text-xs ${colors.textMuted} font-sans mt-2`}>
                Busy: {kpis.totalExecutionTime}u | CS: {kpis.totalContextSwitches} | Preempt: {totalPreemptions}
              </p>
            </div>

          </div>

          {/* Process Results Table */}
          <div className={`rounded-2xl border ${colors.border} ${colors.bgCard} overflow-hidden shadow-md transition-all`}>
            
            {/* Table Header */}
            <div className={`p-4 sm:p-5 border-b border-inherit flex flex-wrap items-center justify-between gap-3`}>
              <div>
                <h3 className={`text-base font-bold uppercase tracking-wider ${colors.textPrimary} font-sans`}>
                  Step-by-Step Process Metric Results Table
                </h3>
                <p className={`text-xs ${colors.textMuted}`}>
                  Individual completion, turnaround, waiting, and response times for each process under {algorithm}
                </p>
              </div>

              <button
                onClick={() => setShowFormulaDetails(!showFormulaDetails)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${colors.border} ${colors.textSecondary} hover:${colors.textPrimary} bg-white/5 backdrop-blur-md transition-all active:scale-95`}
              >
                <Calculator className="w-4 h-4 text-cyan-400" />
                <span>{showFormulaDetails ? 'Hide Formulas' : 'Show Formulas'}</span>
              </button>
            </div>

            {/* Formulas Banner */}
            {showFormulaDetails && (
              <div className={`px-4 py-3 border-b border-inherit ${colors.tagBg} text-xs font-sans grid grid-cols-1 md:grid-cols-3 gap-3 backdrop-blur-md`}>
                <div className="p-3 rounded-xl bg-white/10 border border-white/10 space-y-1">
                  <strong className="text-blue-300 font-bold flex items-center gap-1.5 text-xs font-sans">
                    <Info className="w-4 h-4" /> Turnaround Time (TAT)
                  </strong>
                  <div className="text-xs font-mono opacity-95">TAT = Completion Time − Arrival Time</div>
                  <div className="text-[11px] opacity-80 font-sans">Total elapsed time from process submission to finish</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 border border-white/10 space-y-1">
                  <strong className="text-cyan-300 font-bold flex items-center gap-1.5 text-xs font-sans">
                    <Info className="w-4 h-4" /> Waiting Time (WT)
                  </strong>
                  <div className="text-xs font-mono opacity-95">WT = Turnaround Time − Burst Time</div>
                  <div className="text-[11px] opacity-80 font-sans">Total time spent waiting in the ready queue</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 border border-white/10 space-y-1">
                  <strong className="text-emerald-300 font-bold flex items-center gap-1.5 text-xs font-sans">
                    <Info className="w-4 h-4" /> Response Time (RT)
                  </strong>
                  <div className="text-xs font-mono opacity-95">RT = First Start Time − Arrival Time</div>
                  <div className="text-[11px] opacity-80 font-sans">Time until the process first gets CPU execution</div>
                </div>
              </div>
            )}

            {/* Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-sans border-collapse">
                <thead>
                  <tr className={`border-b border-inherit bg-white/5 ${colors.textMuted} uppercase text-xs font-bold font-mono`}>
                    <th className="py-3.5 px-4 font-bold">Process</th>
                    <th className="py-3.5 px-4 font-bold">Arrival Time</th>
                    <th className="py-3.5 px-4 font-bold">Burst Time</th>
                    <th className="py-3.5 px-4 font-bold">Completion Time</th>
                    <th className="py-3.5 px-4 font-bold text-blue-400">Turnaround Time</th>
                    <th className="py-3.5 px-4 font-bold text-cyan-400">Waiting Time</th>
                    <th className="py-3.5 px-4 font-bold text-emerald-400">Response Time</th>
                    <th className="py-3.5 px-4 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-inherit font-mono">
                  {processes.map((proc) => {
                    const isSelected = selectedProcessId === proc.id;
                    const isFinished = proc.state === 'COMPLETED';

                    return (
                      <tr
                        key={proc.id}
                        onClick={() => onSelectProcess && onSelectProcess(proc)}
                        className={`transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/25 font-bold'
                            : theme === 'light'
                            ? 'hover:bg-black/5'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_6px_currentColor]"
                              style={{ backgroundColor: proc.color, color: proc.color }}
                            />
                            <span className={`font-extrabold text-base font-mono ${colors.textPrimary}`}>
                              {proc.id}
                            </span>
                          </div>
                        </td>

                        <td className={`py-3.5 px-4 font-mono font-semibold ${colors.textSecondary}`}>
                          {proc.arrivalTime}
                        </td>

                        <td className={`py-3.5 px-4 font-mono font-semibold ${colors.textSecondary}`}>
                          {proc.burstTime}
                        </td>

                        <td className={`py-3.5 px-4 font-mono font-bold ${proc.completionTime !== null ? colors.textPrimary : colors.textMuted}`}>
                          {proc.completionTime !== null ? proc.completionTime : '-'}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-extrabold text-blue-400 text-base">
                          {isFinished ? proc.turnaroundTime : '-'}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-extrabold text-cyan-400 text-base">
                          {isFinished ? proc.waitingTime : '-'}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-400 text-base">
                          {proc.responseTime !== null ? proc.responseTime : '-'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold backdrop-blur-md font-mono ${
                            proc.state === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : proc.state === 'RUNNING'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                              : proc.state === 'READY'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : `${colors.tagBg}`
                          }`}>
                            {proc.state}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className={`border-t-2 border-inherit ${colors.bgCardElevated} font-extrabold text-sm backdrop-blur-md font-mono`}>
                    <td className={`py-4 px-4 ${colors.textPrimary}`} colSpan={4}>
                      AVERAGE RESULTS
                    </td>
                    <td className="py-4 px-4 text-blue-400 text-base">
                      {kpis.avgTurnaroundTime}
                    </td>
                    <td className="py-4 px-4 text-cyan-400 text-base">
                      {kpis.avgWaitingTime}
                    </td>
                    <td className="py-4 px-4 text-emerald-400 text-base">
                      {kpis.avgResponseTime}
                    </td>
                    <td className={`py-4 px-4 text-right ${colors.textMuted}`}>
                      {kpis.completedCount}/{kpis.totalCount} Finished
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Calculation Proof */}
            <div className={`p-4 sm:p-5 border-t border-inherit ${theme === 'light' ? 'bg-gray-50' : 'bg-slate-900/50'} text-xs font-sans space-y-3 backdrop-blur-md`}>
              <div className={`font-bold text-sm ${colors.textPrimary}`}>
                Step-by-Step Calculation Proof:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className={`p-3.5 rounded-xl border ${colors.border} ${colors.bgCard} shadow-xs backdrop-blur-md`}>
                  <div className="text-blue-400 font-bold mb-1">
                    Average Turnaround Time Calculation:
                  </div>
                  <div className={colors.textSecondary}>
                    Avg TAT = Sum of TATs / Total Processes = ({tatSumStr}) / {count} = <strong className="text-blue-400 font-extrabold text-sm font-mono">{kpis.avgTurnaroundTime} time units</strong>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${colors.border} ${colors.bgCard} shadow-xs backdrop-blur-md`}>
                  <div className="text-cyan-400 font-bold mb-1">
                    Average Waiting Time Calculation:
                  </div>
                  <div className={colors.textSecondary}>
                    Avg WT = Sum of WTs / Total Processes = ({wtSumStr}) / {count} = <strong className="text-cyan-400 font-extrabold text-sm font-mono">{kpis.avgWaitingTime} time units</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: Fairness Analysis & Per-Process Waiting Bars */}
      {activeTab === 'fairness' && (
        <div className={`p-4 sm:p-5 rounded-2xl border ${colors.border} ${colors.bgCard} space-y-4 animate-in fade-in duration-150`}>
          <div className="flex items-center justify-between pb-3 border-b border-inherit">
            <div>
              <h3 className={`text-base font-bold uppercase tracking-wider ${colors.textPrimary} flex items-center gap-2 font-sans`}>
                <Scale className="w-5 h-5 text-amber-400" />
                Fairness Analysis & Waiting Time Distribution
              </h3>
              <p className={`text-xs ${colors.textMuted} mt-0.5`}>
                Visually inspect whether one process is waiting disproportionately longer than others
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-extrabold">
              <span>Jain's Fairness Index:</span>
              <span className="text-base font-extrabold text-white">{kpis.fairnessIndex} / 1.0</span>
            </div>
          </div>

          {/* Per-process Waiting Time Visual Bar Chart */}
          <div className="space-y-3 font-mono">
            {processes.map((p) => {
              const pct = Math.min(100, Math.round((p.waitingTime / maxWait) * 100));
              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className={colors.textPrimary}>{p.id} (Burst: {p.burstTime}u, Arrival: {p.arrivalTime}u)</span>
                    </div>
                    <span className="text-cyan-400 font-bold">{p.waitingTime} units waiting</span>
                  </div>

                  <div className="w-full h-4 rounded-lg bg-black/20 overflow-hidden border border-white/10 flex items-center p-0.5">
                    <div
                      style={{ width: `${pct}%`, backgroundColor: p.color }}
                      className="h-full rounded-md transition-all duration-300 shadow-[0_0_8px_currentColor]"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs font-sans space-y-1">
            <strong>What does Jain's Fairness Index mean?</strong>
            <p className="text-[11px] opacity-90">
              A score of 1.0 indicates perfect equal distribution of waiting time among all processes. Lower scores indicate high variance where certain processes suffer longer wait times.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: Round Robin Quantum Sensitivity */}
      {activeTab === 'rr_quantum' && algorithm === 'RR' && (
        <div className={`p-4 sm:p-5 rounded-2xl border ${colors.border} ${colors.bgCard} space-y-4 animate-in fade-in duration-150`}>
          <div className="pb-3 border-b border-inherit">
            <h3 className={`text-base font-bold uppercase tracking-wider ${colors.textPrimary} flex items-center gap-2 font-sans`}>
              <Zap className="w-5 h-5 text-cyan-400" />
              Round Robin Time Quantum Sensitivity Analysis
            </h3>
            <p className={`text-xs ${colors.textMuted} mt-0.5`}>
              Evaluate how changing the Time Quantum (Q) affects responsiveness, waiting times, and context switch overhead
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-inherit">
            <table className="w-full text-left text-sm border-collapse font-mono">
              <thead>
                <tr className={`border-b border-inherit bg-white/5 ${colors.textMuted} uppercase text-xs font-bold`}>
                  <th className="py-3 px-4">Time Quantum (Q)</th>
                  <th className="py-3 px-4">Avg Waiting Time (WT)</th>
                  <th className="py-3 px-4">Avg Response Time (RT)</th>
                  <th className="py-3 px-4">Context Switches</th>
                  <th className="py-3 px-4">Throughput (per 100u)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {rrQuantumAnalysis.map((item) => (
                  <tr
                    key={item.quantum}
                    className={`transition-colors ${
                      item.quantum === quantum ? 'bg-cyan-500/25 font-bold' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="py-3 px-4 text-cyan-300 font-extrabold">
                      Q = {item.quantum} {item.quantum === quantum && '(Active)'}
                    </td>
                    <td className="py-3 px-4 font-bold text-blue-400">{item.avgWT} u</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">{item.avgRT} u</td>
                    <td className="py-3 px-4 font-bold text-rose-400">{item.contextSwitches}</td>
                    <td className="py-3 px-4 font-bold text-purple-400">{item.throughput}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs font-sans space-y-1">
            <strong>Key Trade-Off Principle:</strong>
            <p className="text-[11px] opacity-90">
              Smaller quantum values increase responsiveness (lower response time) but generate higher context-switch overhead. Larger quantum values approach FCFS behavior with less switching overhead.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: What-If Sandbox */}
      {activeTab === 'what_if' && (
        <div className={`p-4 sm:p-5 rounded-2xl border ${colors.border} ${colors.bgCard} space-y-4 animate-in fade-in duration-150`}>
          <div className="pb-3 border-b border-inherit">
            <h3 className={`text-base font-bold uppercase tracking-wider ${colors.textPrimary} flex items-center gap-2 font-sans`}>
              <Sliders className="w-5 h-5 text-indigo-400" />
              What-If Experimentation Sandbox
            </h3>
            <p className={`text-xs ${colors.textMuted} mt-0.5`}>
              Modify parameters and compare predicted metrics against current simulation results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
            
            {/* Controls */}
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bgCardElevated} space-y-3`}>
              <span className="font-bold text-sm text-indigo-300">Tweak Test Parameters:</span>

              <div className="space-y-2">
                <label className="block text-xs font-medium">Time Quantum (for RR): {whatIfQuantum}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={whatIfQuantum}
                  onChange={(e) => setWhatIfQuantum(Number(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium">Context Switch Time (CS): {whatIfCS} units</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={whatIfCS}
                  onChange={(e) => setWhatIfCS(Number(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Before vs After Table */}
            <div className={`p-4 rounded-xl border ${colors.border} ${colors.bgCardElevated} space-y-3 font-mono`}>
              <span className="font-bold text-sm text-indigo-300 font-sans">BEFORE vs AFTER Comparison:</span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded bg-white/5">
                  <span>Avg Waiting Time:</span>
                  <span>Before: <strong>{kpis.avgWaitingTime}</strong> | After: <strong className="text-cyan-400">{whatIfResult.kpis.avgWaitingTime}</strong></span>
                </div>

                <div className="flex justify-between p-2 rounded bg-white/5">
                  <span>Avg Turnaround Time:</span>
                  <span>Before: <strong>{kpis.avgTurnaroundTime}</strong> | After: <strong className="text-blue-400">{whatIfResult.kpis.avgTurnaroundTime}</strong></span>
                </div>

                <div className="flex justify-between p-2 rounded bg-white/5">
                  <span>Context Switches:</span>
                  <span>Before: <strong>{kpis.totalContextSwitches}</strong> | After: <strong className="text-rose-400">{whatIfResult.kpis.totalContextSwitches}</strong></span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Real-World Educational Disclaimer */}
      <div className={`p-3.5 rounded-2xl border ${colors.border} ${colors.bgCardElevated} text-xs font-sans text-slate-400 space-y-1 shadow-sm`}>
        <div className="flex items-center gap-1.5 font-bold text-slate-300">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>Educational Simulation Disclaimer:</span>
        </div>
        <p className="text-[11px] leading-relaxed opacity-85">
          These scheduling algorithms are simplified theoretical models used to understand fundamental CPU scheduling concepts. Real operating-system schedulers (such as the Linux Completely Fair Scheduler - CFS, or Windows Multilevel Feedback Queues) utilize decay-based priority trees, cgroups, multi-core NUMA topologies, and dynamic quantum calculation.
        </p>
      </div>

    </div>
  );
};
