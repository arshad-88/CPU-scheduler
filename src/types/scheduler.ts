export type AlgorithmType = 
  | 'FCFS'          // First-Come, First-Served
  | 'SJF'           // Shortest Job First (Non-Preemptive)
  | 'SRTF'          // Shortest Remaining Time First (Preemptive)
  | 'RR'            // Round Robin
  | 'PRIORITY_NP'   // Priority Scheduling (Non-Preemptive)
  | 'PRIORITY_P';   // Priority Scheduling (Preemptive)

export type ProcessState = 'UNARRIVED' | 'READY' | 'RUNNING' | 'BLOCKED' | 'COMPLETED';

export type PriorityOrder = 'LOWER_IS_HIGHER' | 'HIGHER_IS_HIGHER';

export interface IOSegment {
  atRemaining: number; // Trigger I/O burst when remainingTime drops to this value
  duration: number;    // How many ticks the I/O block lasts
}

export interface Process {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  remainingTime: number;
  priority: number;            // Baseline configured priority (1-10)
  currentPriority: number;     // Dynamically adjusted with Aging
  agedCount: number;           // Times priority was boosted by anti-starvation aging
  color: string;
  ioSchedule: IOSegment[];

  // Runtime State
  state: ProcessState;
  currentCoreId: string | null;
  blockedRemaining: number;
  quantumRemaining: number;    // For standard Round Robin
  readyEnqueueTick?: number;   // Timestamp when entering READY queue for strict FIFO Round Robin
  starvationTicks: number;     // Consecutive ticks in READY queue without CPU service
  lastExecutedCoreId: string | null;

  // Analytical Metrics
  startTime: number | null;
  completionTime: number | null;
  waitingTime: number;
  turnaroundTime: number;
  responseTime: number | null;
}

export interface CPUCore {
  id: string;
  name: string;
  coreIndex: number;
  assignedProcessId: string | null;
  busyTicks: number;           // Productive compute execution ticks
  contextSwitchTicks: number;  // Ticks spent switching
  idleTicks: number;           // Ticks spent idle
  isSwitching: boolean;
  contextSwitchRemaining: number;
  switchingToProcessId: string | null;
  previousProcessId: string | null;
  color: string;
}

export interface GanttSegment {
  id: string;
  coreId: string;
  processId: string;           // Process ID ('P1', 'P2'), or 'IDLE', or 'CS'
  processName: string;
  color: string;
  startTick: number;
  endTick: number;
  isContextSwitch?: boolean;
  isIdle?: boolean;
}

export interface SystemLog {
  id: string;
  tick: number;
  level: 'info' | 'warn' | 'success' | 'cs' | 'aging';
  message: string;
  coreId?: string;
  processId?: string;
}

export interface SimulationKPIs {
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  cpuUtilization: number;      // Productive burst / (numCores * makespan) * 100
  throughput: number;          // Completed tasks per 100 ticks
  completedCount: number;
  totalCount: number;
  totalContextSwitches: number;
  totalIdleTime: number;
  totalExecutionTime: number;
  makespan: number;            // Total clock ticks to finish
  coreUtilization: Record<string, number>;
}

export interface SimulationState {
  currentTick: number;
  isPlaying: boolean;
  speedMultiplier: number;     // 0.5x to 4x
  numCores: number;            // 1, 2, or 4
  algorithm: AlgorithmType;
  quantum: number;             // Round Robin Time Quantum
  contextSwitchTime: number;   // Context Switch duration (CS overhead, default: 0)
  enableAging: boolean;        // Starvation & Aging Toggle (On/Off)
  agingThreshold: number;      // Aging Threshold T ticks
  priorityBoost: number;       // Priority Boost Amount B
  priorityOrder: PriorityOrder;// Standard: Lower number = Higher priority
  cores: CPUCore[];
  processes: Process[];
  ganttHistory: GanttSegment[];
  logs: SystemLog[];
  isCompleted: boolean;
  totalContextSwitches: number;
}

export interface SimulationConfig {
  numCores: number;
  quantum: number;
  contextSwitchTime: number;
  enableAging: boolean;
  agingThreshold: number;
  priorityBoost: number;
  priorityOrder: PriorityOrder;
}

export interface PresetScenario {
  id: string;
  name: string;
  tagline: string;
  description: string;
  analogy?: string;
  recommendedAlgorithm: AlgorithmType;
  quantum?: number;
  contextSwitchTime?: number;
  numCores?: number;
  processes: Omit<
    Process,
    | 'state'
    | 'currentCoreId'
    | 'blockedRemaining'
    | 'quantumRemaining'
    | 'starvationTicks'
    | 'startTime'
    | 'completionTime'
    | 'waitingTime'
    | 'turnaroundTime'
    | 'responseTime'
    | 'currentPriority'
    | 'agedCount'
    | 'lastExecutedCoreId'
  >[];
}

export interface AlgorithmComparisonResult {
  algorithm: AlgorithmType;
  name: string;
  kpis: SimulationKPIs;
  ganttHistory: GanttSegment[];
  processes: Process[];
  finalTick: number;
}
