import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Save, 
  HardDrive, 
  Check,
  Layers,
  Sparkles
} from 'lucide-react';
import { Process, IOSegment } from '../types/scheduler';
import { DEFAULT_COLORS } from '../data/presets';

interface ProcessManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  processes: Process[];
  onSaveProcesses: (processes: Process[]) => void;
}

export const ProcessManagerModal: React.FC<ProcessManagerModalProps> = ({
  isOpen,
  onClose,
  processes,
  onSaveProcesses,
}) => {
  const [taskList, setTaskList] = useState<Process[]>(processes);
  const [editingTask, setEditingTask] = useState<Process | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setTaskList(JSON.parse(JSON.stringify(processes)));
      setEditingTask(null);
    }
  }, [isOpen, processes]);

  if (!isOpen) return null;

  const handleAddNewTask = () => {
    const nextIdNum = taskList.length + 1;
    const newTask: Process = {
      id: `P${nextIdNum}`,
      name: `Process ${nextIdNum}`,
      arrivalTime: 0,
      burstTime: 6,
      remainingTime: 6,
      priority: 3,
      currentPriority: 3,
      agedCount: 0,
      ioSchedule: [],
      color: DEFAULT_COLORS[(nextIdNum - 1) % DEFAULT_COLORS.length],
      state: 'UNARRIVED',
      currentCoreId: null,
      blockedRemaining: 0,
      quantumRemaining: 3,
      starvationTicks: 0,
      startTime: null,
      completionTime: null,
      waitingTime: 0,
      turnaroundTime: 0,
      responseTime: null,
      lastExecutedCoreId: null,
    };
    setTaskList([...taskList, newTask]);
    setEditingTask(newTask);
  };

  const handleDeleteTask = (id: string) => {
    setTaskList(taskList.filter((t) => t.id !== id));
    if (editingTask?.id === id) setEditingTask(null);
  };

  const handleSaveEdit = () => {
    if (!editingTask) return;
    setTaskList(taskList.map((t) => (t.id === editingTask.id ? editingTask : t)));
    setEditingTask(null);
  };

  const handleApplyChanges = () => {
    onSaveProcesses(taskList);
    onClose();
  };

  const handleAddIoBurst = () => {
    if (!editingTask) return;
    const newIo: IOSegment = { atRemaining: Math.max(1, Math.floor(editingTask.burstTime / 2)), duration: 3 };
    setEditingTask({
      ...editingTask,
      ioSchedule: [...editingTask.ioSchedule, newIo],
    });
  };

  const handleRemoveIoBurst = (index: number) => {
    if (!editingTask) return;
    setEditingTask({
      ...editingTask,
      ioSchedule: editingTask.ioSchedule.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel-elevated rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-700 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Process Configuration & Workload Manager
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Add, edit, or customize processes, arrival times, burst times, and priorities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddNewTask}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Process</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Active Process Editor */}
          {editingTask && (
            <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-2">
                  <Edit2 className="w-3.5 h-3.5" /> Editing Process: {editingTask.id}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold"
                  >
                    <Check className="w-3.5 h-3.5" /> Save Item
                  </button>
                  <button
                    onClick={() => setEditingTask(null)}
                    className="px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white text-xs font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1">Process ID</label>
                  <input
                    type="text"
                    value={editingTask.id}
                    onChange={(e) => setEditingTask({ ...editingTask, id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Process Name</label>
                  <input
                    type="text"
                    value={editingTask.name}
                    onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Arrival Time (AT)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingTask.arrivalTime}
                    onChange={(e) => setEditingTask({ ...editingTask, arrivalTime: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-cyan-300 font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Burst Time (BT)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingTask.burstTime}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      setEditingTask({ ...editingTask, burstTime: val, remainingTime: val });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-blue-300 font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Priority (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editingTask.priority}
                    onChange={(e) => {
                      const pri = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                      setEditingTask({ ...editingTask, priority: pri, currentPriority: pri });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-amber-300 font-bold"
                  />
                </div>
              </div>

              {/* Color & I/O Bursts */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-slate-400 text-xs font-mono">Color:</label>
                  <input
                    type="color"
                    value={editingTask.color}
                    onChange={(e) => setEditingTask({ ...editingTask, color: e.target.value })}
                    className="w-10 h-7 bg-slate-950 border border-slate-700 rounded cursor-pointer p-0.5"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                    I/O Bursts ({editingTask.ioSchedule.length})
                  </span>
                  <button
                    onClick={handleAddIoBurst}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30 hover:bg-slate-750"
                  >
                    + Add I/O Trigger
                  </button>
                </div>
              </div>

              {editingTask.ioSchedule.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {editingTask.ioSchedule.map((io, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono">
                      <span className="text-slate-400">At Rem:</span>
                      <input
                        type="number"
                        min={1}
                        max={editingTask.burstTime - 1}
                        value={io.atRemaining}
                        onChange={(e) => {
                          const newSched = [...editingTask.ioSchedule];
                          newSched[idx].atRemaining = parseInt(e.target.value) || 1;
                          setEditingTask({ ...editingTask, ioSchedule: newSched });
                        }}
                        className="w-10 bg-slate-900 border border-slate-700 rounded px-1 text-center text-cyan-300"
                      />
                      <span className="text-slate-400 ml-1">Dur:</span>
                      <input
                        type="number"
                        min={1}
                        max={15}
                        value={io.duration}
                        onChange={(e) => {
                          const newSched = [...editingTask.ioSchedule];
                          newSched[idx].duration = parseInt(e.target.value) || 1;
                          setEditingTask({ ...editingTask, ioSchedule: newSched });
                        }}
                        className="w-10 bg-slate-900 border border-slate-700 rounded px-1 text-center text-amber-300"
                      />
                      <button
                        onClick={() => handleRemoveIoBurst(idx)}
                        className="text-slate-500 hover:text-rose-400 ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Processes Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Process Name</th>
                  <th className="p-3">Arrival (AT)</th>
                  <th className="p-3">Burst (BT)</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">I/O Bursts</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {taskList.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3 font-bold text-white flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: task.color }} />
                      {task.id}
                    </td>
                    <td className="p-3 text-slate-200 font-sans">{task.name}</td>
                    <td className="p-3 text-cyan-300">{task.arrivalTime}t</td>
                    <td className="p-3 text-blue-300 font-semibold">{task.burstTime}t</td>
                    <td className="p-3 text-amber-300 font-bold">{task.priority}</td>
                    <td className="p-3 text-slate-400">
                      {task.ioSchedule.length > 0
                        ? `${task.ioSchedule.length} trigger(s)`
                        : 'None'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingTask(task)}
                          className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                          title="Edit Process"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 rounded bg-slate-800 text-slate-400 hover:text-rose-400"
                          title="Delete Process"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            {taskList.length} total processes configured
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyChanges}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold shadow-md shadow-cyan-500/20"
            >
              <Save className="w-3.5 h-3.5" />
              Apply & Reload Simulation
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
