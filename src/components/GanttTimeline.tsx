import React, { useRef, useEffect, useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Cpu,
  Info
} from 'lucide-react';
import { GanttSegment, CPUCore, Process } from '../types/scheduler';
import { useTheme } from '../context/ThemeContext';

interface GanttTimelineProps {
  cores: CPUCore[];
  processes: Process[];
  ganttHistory: GanttSegment[];
  currentTick: number;
  algorithm?: string;
  selectedProcessId?: string | null;
  onSelectProcessId?: (id: string | null) => void;
}

export const GanttTimeline: React.FC<GanttTimelineProps> = ({
  processes,
  ganttHistory,
  currentTick,
  algorithm,
  selectedProcessId,
  onSelectProcessId,
}) => {
  const { colors, theme } = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(38); // px per time unit
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [hoveredSegment, setHoveredSegment] = useState<GanttSegment | null>(null);

  // Filter out any CS (Context Switch) segments per user request
  const cleanSegments = ganttHistory.filter((s) => !s.isContextSwitch && s.processId !== 'CS');

  const maxTick = Math.max(currentTick, ...cleanSegments.map((s) => s.endTick), 16);
  const totalWidth = maxTick * zoomLevel + 100;

  // Auto scroll to current simulation clock
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      const scrollPos = currentTick * zoomLevel - scrollContainerRef.current.clientWidth / 2;
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: 'smooth',
      });
    }
  }, [currentTick, zoomLevel, autoScroll]);

  const ticksArray = Array.from({ length: maxTick + 1 }, (_, i) => i);

  return (
    <div id="gantt-chart-card" className={`w-full max-w-full overflow-hidden rounded-2xl p-4 sm:p-5 border ${colors.border} ${colors.bgCard} flex flex-col gap-3.5 transition-all shadow-md`}>
      
      {/* Header & Gantt Timeline Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-inherit">
        <div className="flex items-center gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-sm sm:text-base font-bold uppercase tracking-wider ${colors.textPrimary}`}>
                Gantt Chart Timeline
              </h2>
              {algorithm && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${colors.tagBg}`}>
                  {algorithm}
                </span>
              )}
            </div>
            <p className={`text-xs ${colors.textMuted} mt-0.5`}>
              Visual timeline showing which process gets the CPU at every time unit
            </p>
          </div>
        </div>

        {/* Action Controls: Zoom & Auto-scroll */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Zoom Buttons */}
          <div className={`flex items-center border ${colors.border} rounded-xl p-0.5 ${colors.bgInput} backdrop-blur-md`}>
            <button
              onClick={() => setZoomLevel((prev) => Math.max(20, prev - 6))}
              className={`p-1.5 rounded-lg ${colors.textMuted} hover:${colors.textPrimary} transition-all active:scale-95`}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className={`px-2 text-xs font-mono font-bold ${colors.textPrimary}`}>
              {zoomLevel}px
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(70, prev + 6))}
              className={`p-1.5 rounded-lg ${colors.textMuted} hover:${colors.textPrimary} transition-all active:scale-95`}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Canvas Viewport */}
      <div
        ref={scrollContainerRef}
        className={`relative w-full max-w-full overflow-x-auto overflow-y-hidden border ${colors.border} rounded-xl p-3 sm:p-4 min-h-[140px] select-none backdrop-blur-md touch-pan-x ${
          theme === 'light' 
            ? 'bg-slate-200/60' 
            : 'bg-slate-950/70'
        }`}
      >
        <div style={{ minWidth: `${totalWidth}px` }} className="relative">
          
          {/* Time Ruler (Top Axis) */}
          <div className="relative h-8 border-b border-inherit mb-2.5">
            {ticksArray.map((tick) => (
              <div
                key={tick}
                className="absolute top-0 flex flex-col items-center -translate-x-1/2"
                style={{ left: `${tick * zoomLevel + 65}px` }}
              >
                <span
                  className={`text-xs font-mono font-bold leading-none ${
                    tick === currentTick
                      ? 'text-cyan-400 font-extrabold scale-110 drop-shadow-[0_0_6px_rgba(6,182,212,0.9)]'
                      : tick % 5 === 0
                      ? colors.textPrimary
                      : colors.textMuted
                  }`}
                >
                  {tick}
                </span>
                <div
                  className={`w-px mt-1.5 ${
                    tick === currentTick
                      ? 'h-3.5 bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)]'
                      : tick % 5 === 0
                      ? 'h-3 bg-slate-400/60'
                      : 'h-1.5 bg-slate-500/30'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Current Time Playhead Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-20 pointer-events-none transition-all duration-150 shadow-[0_0_12px_rgba(6,182,212,0.95)]"
            style={{ left: `${currentTick * zoomLevel + 65}px` }}
          >
            <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)] ring-2 ring-slate-900" />
            <div className="absolute -bottom-1 -translate-x-1/2 px-2 py-0.5 rounded-md bg-cyan-500 text-slate-950 font-mono text-[10px] font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.6)] backdrop-blur-md whitespace-nowrap">
              Time = {currentTick}
            </div>
          </div>

          {/* Single Unified CPU Timeline Track */}
          <div className="flex items-center gap-2 sm:gap-3 pt-1">
            
            {/* CPU Label */}
            <div className="w-14 sm:w-16 shrink-0 flex flex-col justify-center">
              <span className={`font-mono text-xs sm:text-sm font-extrabold flex items-center gap-1 text-cyan-400`}>
                <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                CPU
              </span>
              <span className={`text-[10px] font-sans ${colors.textMuted}`}>
                Processor
              </span>
            </div>

            {/* Timeline Lane Container */}
            <div className={`relative h-14 flex-1 border ${colors.border} rounded-xl overflow-hidden backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] ${
              theme === 'light' 
                ? 'bg-white/80' 
                : 'bg-slate-900/60'
            }`}>
              
              {/* Background unit vertical grid lines */}
              {ticksArray.map((tick) => (
                <div
                  key={tick}
                  className={`absolute top-0 bottom-0 w-px pointer-events-none ${
                    tick % 5 === 0 ? 'bg-black/15 dark:bg-white/15' : 'bg-black/5 dark:bg-white/5'
                  }`}
                  style={{ left: `${tick * zoomLevel}px` }}
                />
              ))}

              {/* Render Process Execution Segments */}
              {cleanSegments.map((segment) => {
                const leftPos = segment.startTick * zoomLevel;
                const width = Math.max(4, (segment.endTick - segment.startTick) * zoomLevel);
                const isIdle = segment.isIdle || segment.processId === 'IDLE';
                const isSelected = selectedProcessId && segment.processId === selectedProcessId;

                if (isIdle) {
                  return (
                    <div
                      key={segment.id}
                      style={{ left: `${leftPos}px`, width: `${width}px` }}
                      className={`absolute top-1 bottom-1 rounded-lg border border-dashed ${colors.border} flex items-center justify-center text-xs font-mono ${colors.textMuted} overflow-hidden bg-white/5 backdrop-blur-xs`}
                      title={`CPU Idle (Time ${segment.startTick} to ${segment.endTick})`}
                    >
                      <span className="truncate px-1 opacity-70 font-semibold text-[11px]">IDLE</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={segment.id}
                    style={{
                      left: `${leftPos}px`,
                      width: `${width}px`,
                      backgroundColor: segment.color || '#0284c7',
                    }}
                    onClick={() => onSelectProcessId && onSelectProcessId(segment.processId)}
                    onMouseEnter={() => setHoveredSegment(segment)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    className={`absolute top-1 bottom-1 rounded-lg border text-white font-mono text-sm font-extrabold overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:brightness-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all cursor-pointer z-10 flex items-center justify-between px-2 backdrop-blur-xs ${
                      isSelected ? 'ring-2 ring-yellow-400 border-white shadow-[0_0_15px_rgba(250,204,21,0.7)]' : 'border-white/35'
                    }`}
                  >
                    <span className="font-extrabold drop-shadow-md truncate">
                      {segment.processId}
                    </span>

                    <span className="text-xs font-semibold text-white/95 shrink-0 ml-1">
                      {segment.endTick - segment.startTick}u
                    </span>
                  </div>
                );
              })}

            </div>

          </div>

        </div>
      </div>

      {/* Interactive Tooltip on Hover */}
      {hoveredSegment && (
        <div className={`p-3 rounded-xl border ${colors.border} ${colors.bgCardElevated} text-xs font-mono ${colors.textPrimary} shadow-md animate-in fade-in duration-150 flex flex-wrap items-center justify-between gap-2`}>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
              style={{
                backgroundColor: hoveredSegment.color || '#3b82f6',
                color: hoveredSegment.color || '#3b82f6'
              }}
            />
            <span className="font-extrabold text-sm text-cyan-300">
              {hoveredSegment.processId}
            </span>
          </div>

          <div className={`flex flex-wrap items-center gap-3 ${colors.textMuted}`}>
            <span>Start: <strong className={colors.textPrimary}>{hoveredSegment.startTick}</strong></span>
            <span>Finish: <strong className={colors.textPrimary}>{hoveredSegment.endTick}</strong></span>
            <span>Duration: <strong className="text-cyan-400 font-bold">{hoveredSegment.endTick - hoveredSegment.startTick} time units</strong></span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pt-1 text-xs font-mono ${colors.textMuted}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold">Legend:</span>
          {processes.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectProcessId && onSelectProcessId(selectedProcessId === p.id ? null : p.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md transition-all active:scale-95 ${
                selectedProcessId === p.id 
                  ? 'bg-cyan-500/30 border border-cyan-400 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                  : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full shadow-[0_0_6px_currentColor]"
                style={{ backgroundColor: p.color, color: p.color }}
              />
              <span className={`font-bold ${colors.textPrimary}`}>
                {p.id}
              </span>
            </button>
          ))}

          <span className="flex items-center gap-1.5 font-medium ml-1">
            <span className={`w-3.5 h-3 rounded border border-dashed ${colors.border}`} />
            CPU Idle
          </span>
        </div>

        <div className="text-[11px]">
          Axis ticks represent elapsed time units
        </div>
      </div>

    </div>
  );
};
