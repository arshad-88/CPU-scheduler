import React, { useState } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { Process, CPUCore, SimulationKPIs, GanttSegment } from '../types/scheduler';
import { calculateKPIs } from '../services/schedulerEngine';
import { useTheme } from '../context/ThemeContext';

interface AnalyticsDashboardProps {
  processes: Process[];
  cores: CPUCore[];
  currentTick: number;
  algorithm: string;
  contextSwitchTime?: number;
  enableAging?: boolean;
  totalContextSwitches?: number;
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
  totalContextSwitches = 0,
  ganttHistory = [],
  isCompleted = false,
  selectedProcessId,
  onSelectProcess,
}) => {
  const { colors, theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [showFormulaDetails, setShowFormulaDetails] = useState(true);

  const isAllCompleted = isCompleted || (processes.length > 0 && processes.every((p) => p.state === 'COMPLETED' || p.remainingTime === 0));

  const kpis: SimulationKPIs = calculateKPIs(processes, cores, currentTick, totalContextSwitches);
  const count = processes.length || 1;

  const tatSumStr = processes.map((p) => (p.turnaroundTime || 0)).join(' + ');
  const wtSumStr = processes.map((p) => (p.waitingTime || 0)).join(' + ');
  const rtSumStr = processes.map((p) => (p.responseTime !== null ? p.responseTime : 0)).join(' + ');

  const handleCopyMetrics = () => {
    const textSummary = `
--- CPU Scheduling Simulation Results ---
Algorithm: ${algorithm}
Elapsed Time: ${currentTick} time units
Completed Processes: ${kpis.completedCount} / ${kpis.totalCount}
Average Turnaround Time (TAT): ${kpis.avgTurnaroundTime} units
Average Waiting Time (WT): ${kpis.avgWaitingTime} units
Average Response Time (RT): ${kpis.avgResponseTime} units
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

      const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
      const textColor: [number, number, number] = [30, 41, 59]; // Slate 800
      const mutedColor: [number, number, number] = [100, 116, 139]; // Slate 500

      // 1. Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 595.28, 66, 'F');

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.setTextColor(255, 255, 255);
      doc.text('CPU Scheduling Simulation Report', 40, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 52);

      // 2. Metadata Overview
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

      // 3. KPI Metrics Summary Cards Box
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

      // 4. Gantt Chart Timeline Section
      yPos += kpiBoxHeight + 20;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...primaryColor);
      doc.text('Gantt Chart Execution Timeline', 40, yPos);

      yPos += 10;
      const cleanSegments = (ganttHistory || []).filter((s) => !s.isContextSwitch && s.processId !== 'CS');
      const maxGanttTick = Math.max(currentTick, ...cleanSegments.map((s) => s.endTick), 1);
      const ganttWidth = 515.28;
      const barHeight = 24;

      // Gantt background container
      doc.setFillColor(248, 250, 252);
      doc.rect(40, yPos, ganttWidth, barHeight, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(40, yPos, ganttWidth, barHeight, 'S');

      if (cleanSegments.length > 0) {
        cleanSegments.forEach((seg) => {
          const segX = 40 + (seg.startTick / maxGanttTick) * ganttWidth;
          const segW = Math.max(0.5, ((seg.endTick - seg.startTick) / maxGanttTick) * ganttWidth);

          if (seg.isIdle || seg.processId === 'IDLE') {
            doc.setFillColor(226, 232, 240);
            doc.rect(segX, yPos, segW, barHeight, 'F');
            doc.setDrawColor(203, 213, 225);
            doc.rect(segX, yPos, segW, barHeight, 'S');
            if (segW >= 18) {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(7.5);
              doc.setTextColor(100, 116, 139);
              doc.text('IDLE', segX + segW / 2, yPos + 15, { align: 'center' });
            }
          } else {
            const rgb = hexToRgb(seg.color || '#3b82f6');
            doc.setFillColor(rgb[0], rgb[1], rgb[2]);
            doc.rect(segX, yPos, segW, barHeight, 'F');
            doc.setDrawColor(255, 255, 255);
            doc.rect(segX, yPos, segW, barHeight, 'S');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(segW < 18 ? 7 : 8.5);
            doc.setTextColor(255, 255, 255);
            doc.text(seg.processId, segX + segW / 2, yPos + 15, { align: 'center' });
          }
        });

        // Time ticks below Gantt chart
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('0', 40, yPos + barHeight + 10, { align: 'center' });

        let lastDrawnX = 40;
        cleanSegments.forEach((seg) => {
          const segEndX = 40 + (seg.endTick / maxGanttTick) * ganttWidth;
          if (segEndX - lastDrawnX >= 14 || seg.endTick === maxGanttTick) {
            doc.text(seg.endTick.toString(), segEndX, yPos + barHeight + 10, { align: 'center' });
            lastDrawnX = segEndX;
          }
        });
      }

      // 5. Process Results Table
      yPos += barHeight + 26;
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

      // 6. Formulas Footer Note (Each formula on its own line using standard ASCII minus)
      const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 14 : yPos + 180;
      
      if (finalY < 770) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(40, finalY, 515.28, 56, 5, 5, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(40, finalY, 515.28, 56, 5, 5, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text('Standard OS Scheduling Metric Formulas Applied:', 50, finalY + 14);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('• Turnaround Time (TAT) = Completion Time - Arrival Time', 50, finalY + 27);
        doc.text('• Waiting Time (WT) = Turnaround Time - Burst Time', 50, finalY + 39);
        doc.text('• Response Time (RT) = First Start Time - Arrival Time', 50, finalY + 51);
      }

      // Save PDF file
      doc.save(`CPU_Scheduling_${algorithm.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  return (
    <div id="analytics-dashboard-section" className="space-y-4">
      
      {/* 3 Core Metric KPI Cards (CPU Utilization removed per user request) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* 1. Average Turnaround Time */}
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

        {/* 2. Average Waiting Time */}
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

        {/* 3. Average Response Time */}
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

      </div>

      {/* Process Results Table */}
      <div className={`rounded-2xl border ${colors.border} ${colors.bgCard} overflow-hidden shadow-md transition-all`}>
        
        {/* Table Header */}
        <div className={`p-4 sm:p-5 border-b border-inherit flex flex-wrap items-center justify-between gap-3`}>
          <div className="flex items-center gap-2.5">
            <div>
              <h3 className={`text-base font-bold uppercase tracking-wider ${colors.textPrimary}`}>
                Step-by-Step Results Table
              </h3>
              <p className={`text-xs ${colors.textMuted}`}>
                Individual completion, turnaround, waiting, and response times for each process under {algorithm}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFormulaDetails(!showFormulaDetails)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${colors.border} ${colors.textSecondary} hover:${colors.textPrimary} bg-white/5 backdrop-blur-md transition-all active:scale-95`}
              title="Toggle Formula Breakdown"
            >
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>{showFormulaDetails ? 'Hide Formulas' : 'Show Formulas'}</span>
            </button>

            <button
              onClick={handleCopyMetrics}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${colors.border} ${colors.bgInput} backdrop-blur-md hover:brightness-110 transition-all active:scale-95`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={!isAllCompleted}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isAllCompleted
                  ? `border-cyan-500/40 ${colors.bgInput} text-cyan-400 hover:brightness-110 active:scale-95 shadow-sm`
                  : `border-slate-700/50 bg-slate-800/30 text-slate-500 opacity-50 cursor-not-allowed`
              }`}
              title={
                isAllCompleted
                  ? "Download Complete Simulation & Gantt Report as PDF"
                  : "All processes must complete execution before exporting PDF"
              }
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF</span>
              {!isAllCompleted && (
                <span className="text-[10px] opacity-75 hidden sm:inline">(Requires Completion)</span>
              )}
            </button>
          </div>
        </div>

        {/* Formulas Banner */}
        {showFormulaDetails && (
          <div className={`px-4 py-3 border-b border-inherit ${colors.tagBg} text-xs font-sans grid grid-cols-1 md:grid-cols-3 gap-3 backdrop-blur-md`}>
            <div className="p-3 rounded-xl bg-white/10 border border-white/10 space-y-1">
              <strong className="text-blue-300 font-bold flex items-center gap-1.5 text-xs">
                <Info className="w-4 h-4" /> Turnaround Time (TAT)
              </strong>
              <div className="text-xs font-mono opacity-95">TAT = Completion Time − Arrival Time</div>
              <div className="text-[11px] opacity-80">Total elapsed time from process submission to finish</div>
            </div>
            <div className="p-3 rounded-xl bg-white/10 border border-white/10 space-y-1">
              <strong className="text-cyan-300 font-bold flex items-center gap-1.5 text-xs">
                <Info className="w-4 h-4" /> Waiting Time (WT)
              </strong>
              <div className="text-xs font-mono opacity-95">WT = Turnaround Time − Burst Time</div>
              <div className="text-[11px] opacity-80">Total time spent waiting in the ready queue</div>
            </div>
            <div className="p-3 rounded-xl bg-white/10 border border-white/10 space-y-1">
              <strong className="text-emerald-300 font-bold flex items-center gap-1.5 text-xs">
                <Info className="w-4 h-4" /> Response Time (RT)
              </strong>
              <div className="text-xs font-mono opacity-95">RT = First Start Time − Arrival Time</div>
              <div className="text-[11px] opacity-80">Time until the process first gets CPU execution</div>
            </div>
          </div>
        )}

        {/* Table View (Note: Priority column removed per user request) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans border-collapse">
            <thead>
              <tr className={`border-b border-inherit bg-white/5 ${colors.textMuted} uppercase text-xs font-bold font-mono`}>
                <th className="py-3.5 px-4 font-bold">Process</th>
                <th className="py-3.5 px-4 font-bold">Arrival Time</th>
                <th className="py-3.5 px-4 font-bold">Burst Time</th>
                <th className="py-3.5 px-4 font-bold">Completion Time</th>
                <th className="py-3.5 px-4 font-bold text-blue-400">
                  Turnaround Time
                </th>
                <th className="py-3.5 px-4 font-bold text-cyan-400">
                  Waiting Time
                </th>
                <th className="py-3.5 px-4 font-bold text-emerald-400">
                  Response Time
                </th>
                <th className="py-3.5 px-4 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit">
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
                    {/* Process name & badge */}
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

                    {/* Arrival Time */}
                    <td className={`py-3.5 px-4 font-mono font-semibold ${colors.textSecondary}`}>
                      {proc.arrivalTime}
                    </td>

                    {/* Burst Time */}
                    <td className={`py-3.5 px-4 font-mono font-semibold ${colors.textSecondary}`}>
                      {proc.burstTime}
                    </td>

                    {/* Completion Time */}
                    <td className={`py-3.5 px-4 font-mono font-bold ${proc.completionTime !== null ? colors.textPrimary : colors.textMuted}`}>
                      {proc.completionTime !== null ? proc.completionTime : '-'}
                    </td>

                    {/* Turnaround Time */}
                    <td className="py-3.5 px-4 font-mono font-extrabold text-blue-400 text-base">
                      {isFinished ? proc.turnaroundTime : '-'}
                    </td>

                    {/* Waiting Time */}
                    <td className="py-3.5 px-4 font-mono font-extrabold text-cyan-400 text-base">
                      {isFinished ? proc.waitingTime : '-'}
                    </td>

                    {/* Response Time */}
                    <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-400 text-base">
                      {proc.responseTime !== null ? proc.responseTime : '-'}
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 px-4 text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold backdrop-blur-md font-mono ${
                        proc.state === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                          : proc.state === 'RUNNING'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                          : proc.state === 'READY'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : proc.state === 'BLOCKED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : `${colors.tagBg}`
                      }`}>
                        {proc.state}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer with Average Calculations (colSpan=4 since Priority column was removed) */}
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

        {/* Step-by-Step Average Math Display */}
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
  );
};
