import {
  AlgorithmType,
  Process,
  CPUCore,
  GanttSegment,
  SystemLog,
  SimulationKPIs,
  SimulationState,
  AlgorithmComparisonResult,
  PriorityOrder,
  PresetScenario,
} from '../types/scheduler';
import { createCores } from '../data/presets';

// Helper to check priority comparison
export function isHigherPriority(
  p1Priority: number,
  p2Priority: number,
  order: PriorityOrder
): boolean {
  if (order === 'LOWER_IS_HIGHER') {
    return p1Priority < p2Priority;
  }
  return p1Priority > p2Priority;
}

// Select the next best process from the ready queue based on algorithm
export function selectNextProcess(
  readyList: Process[],
  algorithm: AlgorithmType,
  priorityOrder: PriorityOrder,
  alreadyClaimedIds: Set<string>
): Process | null {
  const candidates = readyList.filter((p) => !alreadyClaimedIds.has(p.id));
  if (candidates.length === 0) return null;

  switch (algorithm) {
    case 'FCFS':
      // Earliest arrival time, tie-break by process ID
      return [...candidates].sort((a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id))[0];

    case 'SJF':
      // Shortest total burst time, then arrival time, then ID
      return [...candidates].sort(
        (a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id)
      )[0];

    case 'SRTF':
      // Shortest remaining time, then arrival time, then ID
      return [...candidates].sort(
        (a, b) => a.remainingTime - b.remainingTime || a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id)
      )[0];

    case 'PRIORITY_NP':
    case 'PRIORITY_P':
      // Priority first (using dynamic priority if aged), then arrival time
      return [...candidates].sort((a, b) => {
        if (a.currentPriority !== b.currentPriority) {
          return priorityOrder === 'LOWER_IS_HIGHER'
            ? a.currentPriority - b.currentPriority
            : b.currentPriority - a.currentPriority;
        }
        return a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id);
      })[0];

    case 'RR':
      // Strict FIFO queue for Round Robin: Order by enqueue time, then arrival time, then ID
      return [...candidates].sort((a, b) => {
        const aEnqueue = a.readyEnqueueTick !== undefined ? a.readyEnqueueTick : a.arrivalTime;
        const bEnqueue = b.readyEnqueueTick !== undefined ? b.readyEnqueueTick : b.arrivalTime;
        if (aEnqueue !== bEnqueue) return aEnqueue - bEnqueue;
        return a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id);
      })[0];

    default:
      return candidates[0];
  }
}

// Calculate KPIs (Key Performance Indicators)
export function calculateKPIs(
  processes: Process[],
  cores: CPUCore[],
  ganttHistoryOrTick: GanttSegment[] | number,
  currentTickOrCS?: number
): SimulationKPIs {
  const completed = processes.filter((p) => p.state === 'COMPLETED');
  
  let currentTick: number;
  let totalContextSwitches = 0;

  if (Array.isArray(ganttHistoryOrTick)) {
    currentTick = currentTickOrCS !== undefined ? currentTickOrCS : 0;
    totalContextSwitches = ganttHistoryOrTick.filter((s) => s.isContextSwitch).length;
  } else {
    currentTick = ganttHistoryOrTick;
    totalContextSwitches = currentTickOrCS !== undefined ? currentTickOrCS : 0;
  }

  const makespan = Math.max(1, currentTick);

  let totalWT = 0;
  let totalTAT = 0;
  let totalRT = 0;
  let rtCount = 0;

  processes.forEach((p) => {
    if (p.state === 'COMPLETED') {
      totalWT += p.waitingTime;
      totalTAT += p.turnaroundTime;
    } else if (p.state !== 'UNARRIVED') {
      const effectiveTAT = currentTick - p.arrivalTime;
      const executed = p.burstTime - p.remainingTime;
      totalWT += Math.max(0, effectiveTAT - executed);
      totalTAT += Math.max(0, effectiveTAT);
    }

    if (p.responseTime !== null) {
      totalRT += p.responseTime;
      rtCount++;
    }
  });

  const divisor = completed.length > 0 ? completed.length : Math.max(1, processes.filter(p => p.state !== 'UNARRIVED').length);
  const avgWaitingTime = Number((totalWT / divisor).toFixed(2));
  const avgTurnaroundTime = Number((totalTAT / divisor).toFixed(2));
  const avgResponseTime = rtCount > 0 ? Number((totalRT / rtCount).toFixed(2)) : 0;

  const totalExecutionTime = cores.reduce((acc, c) => acc + c.busyTicks, 0);
  const totalIdleTime = cores.reduce((acc, c) => acc + c.idleTicks, 0);
  const totalCapacity = cores.length * makespan;
  const cpuUtilization = totalCapacity > 0 ? Number(((totalExecutionTime / totalCapacity) * 100).toFixed(1)) : 0;

  const throughput = Number(((completed.length / makespan) * 100).toFixed(2));

  const coreUtilization: Record<string, number> = {};
  cores.forEach((c) => {
    coreUtilization[c.id] = makespan > 0 ? Number(((c.busyTicks / makespan) * 100).toFixed(1)) : 0;
  });

  return {
    avgWaitingTime,
    avgTurnaroundTime,
    avgResponseTime,
    cpuUtilization: Math.min(100, cpuUtilization),
    throughput,
    completedCount: completed.length,
    totalCount: processes.length,
    totalContextSwitches,
    totalIdleTime,
    totalExecutionTime,
    makespan,
    coreUtilization,
  };
}

// Reset and initialize simulation
export function resetSimulation(
  preset: PresetScenario | null,
  customProcesses: Process[] | null,
  algorithm: AlgorithmType,
  config: {
    numCores: number;
    quantum: number;
    contextSwitchTime: number;
    enableAging: boolean;
    agingThreshold: number;
    priorityBoost: number;
    priorityOrder: PriorityOrder;
  }
): SimulationState {
  const sourceProcesses = customProcesses || (preset ? preset.processes : []);
  const initialProcesses: Process[] = sourceProcesses.map((p) => ({
    ...p,
    state: 'UNARRIVED',
    remainingTime: p.burstTime,
    currentPriority: p.priority,
    agedCount: 0,
    currentCoreId: null,
    blockedRemaining: 0,
    quantumRemaining: config.quantum,
    starvationTicks: 0,
    startTime: null,
    completionTime: null,
    waitingTime: 0,
    turnaroundTime: 0,
    responseTime: null,
    lastExecutedCoreId: null,
  }));

  return {
    currentTick: 0,
    isPlaying: false,
    speedMultiplier: 1,
    numCores: config.numCores,
    algorithm,
    quantum: config.quantum,
    contextSwitchTime: config.contextSwitchTime,
    enableAging: config.enableAging,
    agingThreshold: config.agingThreshold,
    priorityBoost: config.priorityBoost,
    priorityOrder: config.priorityOrder,
    cores: createCores(config.numCores),
    processes: initialProcesses,
    ganttHistory: [],
    logs: [
      {
        id: 'log-init-0',
        tick: 0,
        level: 'info',
        message: `Simulation initialized with ${initialProcesses.length} processes on ${config.numCores} CPU core(s) using ${algorithm}.`,
      },
    ],
    isCompleted: false,
    totalContextSwitches: 0,
  };
}

// Append or merge Gantt segment cleanly
function addGanttSegment(
  history: GanttSegment[],
  coreId: string,
  processId: string,
  processName: string,
  color: string,
  tick: number,
  isContextSwitch = false,
  isIdle = false
): GanttSegment[] {
  const newHistory = [...history];
  let lastSegIndex = -1;
  for (let i = newHistory.length - 1; i >= 0; i--) {
    if (newHistory[i].coreId === coreId) {
      lastSegIndex = i;
      break;
    }
  }

  if (lastSegIndex !== -1) {
    const lastSeg = newHistory[lastSegIndex];
    if (
      lastSeg.processId === processId &&
      lastSeg.isContextSwitch === isContextSwitch &&
      lastSeg.isIdle === isIdle &&
      lastSeg.endTick === tick
    ) {
      newHistory[lastSegIndex] = {
        ...lastSeg,
        endTick: tick + 1,
      };
      return newHistory;
    }
  }

  newHistory.push({
    id: `gantt-${coreId}-${processId}-${tick}-${Math.random().toString(36).substr(2, 4)}`,
    coreId,
    processId,
    processName,
    color,
    startTick: tick,
    endTick: tick + 1,
    isContextSwitch,
    isIdle,
  });

  return newHistory;
}

// Execute a single simulation tick
export function tickSimulation(prevState: SimulationState): SimulationState {
  if (prevState.isCompleted) return prevState;

  const currentTick = prevState.currentTick;
  let processes = prevState.processes.map((p) => ({ ...p }));
  let cores = prevState.cores.map((c) => ({ ...c }));
  let ganttHistory = [...prevState.ganttHistory];
  let logs: SystemLog[] = [...prevState.logs];

  // 1. Process Arrivals
  processes = processes.map((p) => {
    if (p.state === 'UNARRIVED' && p.arrivalTime <= currentTick) {
      logs.unshift({
        id: `log-arr-${p.id}-${currentTick}`,
        tick: currentTick,
        level: 'info',
        message: `Process ${p.id} arrived in Ready Queue (Burst: ${p.burstTime}t, Pri: ${p.priority})`,
        processId: p.id,
      });
      return {
        ...p,
        state: 'READY',
        starvationTicks: 0,
        currentPriority: p.priority,
        quantumRemaining: prevState.quantum,
        readyEnqueueTick: currentTick,
      };
    }
    return p;
  });

  // 2. Process I/O Unblocking
  processes = processes.map((p) => {
    if (p.state === 'BLOCKED') {
      const nextBlocked = p.blockedRemaining - 1;
      if (nextBlocked <= 0) {
        logs.unshift({
          id: `log-unblock-${p.id}-${currentTick}`,
          tick: currentTick,
          level: 'success',
          message: `Process ${p.id} finished I/O and returned to READY queue`,
          processId: p.id,
        });
        return {
          ...p,
          state: 'READY',
          blockedRemaining: 0,
          currentCoreId: null,
          starvationTicks: 0,
          quantumRemaining: prevState.quantum,
          readyEnqueueTick: currentTick,
        };
      }
      return { ...p, blockedRemaining: nextBlocked };
    }
    return p;
  });

  // 3. Starvation & Aging Boost
  if (prevState.enableAging) {
    processes = processes.map((p) => {
      if (p.state === 'READY') {
        const nextStarv = p.starvationTicks + 1;
        if (nextStarv >= prevState.agingThreshold) {
          const oldPri = p.currentPriority;
          const newPri =
            prevState.priorityOrder === 'LOWER_IS_HIGHER'
              ? Math.max(1, p.currentPriority - prevState.priorityBoost)
              : Math.min(10, p.currentPriority + prevState.priorityBoost);

          if (newPri !== oldPri) {
            logs.unshift({
              id: `log-age-${p.id}-${currentTick}`,
              tick: currentTick,
              level: 'aging',
              message: `[Aging] Process ${p.id} waited ${nextStarv}t in Ready Queue -> Boosted Priority: ${oldPri} -> ${newPri}`,
              processId: p.id,
            });
          }

          return {
            ...p,
            currentPriority: newPri,
            agedCount: p.agedCount + 1,
            starvationTicks: 0,
          };
        }
        return { ...p, starvationTicks: nextStarv };
      }
      return p;
    });
  }

  // 4. Preemption Checks on Actively Running Cores
  const readyPool = processes.filter((p) => p.state === 'READY');

  cores.forEach((core) => {
    if (core.assignedProcessId && !core.isSwitching) {
      const runningProc = processes.find((p) => p.id === core.assignedProcessId);
      if (runningProc) {
        let shouldPreempt = false;
        let preemptionReason = '';

        // Round Robin Quantum Expiration
        if (prevState.algorithm === 'RR') {
          if (runningProc.quantumRemaining <= 0 && readyPool.length > 0) {
            shouldPreempt = true;
            preemptionReason = `Quantum (${prevState.quantum}t) reached, yields to next process`;
          }
        }

        // SRTF Preemption
        if (prevState.algorithm === 'SRTF') {
          const shorterProcess = readyPool.find((p) => p.remainingTime < runningProc.remainingTime);
          if (shorterProcess) {
            shouldPreempt = true;
            preemptionReason = `Preempted by shorter remaining job ${shorterProcess.id} (${shorterProcess.remainingTime}t < ${runningProc.remainingTime}t)`;
          }
        }

        // Preemptive Priority Preemption
        if (prevState.algorithm === 'PRIORITY_P') {
          const higherPri = readyPool.find((p) =>
            isHigherPriority(p.currentPriority, runningProc.currentPriority, prevState.priorityOrder)
          );
          if (higherPri) {
            shouldPreempt = true;
            preemptionReason = `Preempted by higher priority process ${higherPri.id} (Pri: ${higherPri.currentPriority} vs ${runningProc.currentPriority})`;
          }
        }

        if (shouldPreempt) {
          logs.unshift({
            id: `log-preempt-${runningProc.id}-${currentTick}`,
            tick: currentTick,
            level: 'warn',
            message: `[${core.id}] ${runningProc.id}: ${preemptionReason}`,
            coreId: core.id,
            processId: runningProc.id,
          });

          runningProc.state = 'READY';
          runningProc.currentCoreId = null;
          runningProc.quantumRemaining = prevState.quantum;
          runningProc.readyEnqueueTick = currentTick;
          core.assignedProcessId = null;
        }
      }
    }
  });

  // 5. Core Scheduling & Execution Phase
  const claimedProcessIds = new Set<string>(
    cores.map((c) => c.assignedProcessId || c.switchingToProcessId).filter(Boolean) as string[]
  );

  let totalCS = prevState.totalContextSwitches;

  cores.forEach((core) => {
    // A. If core is in Context Switch
    if (core.isSwitching) {
      core.contextSwitchRemaining -= 1;
      core.contextSwitchTicks += 1;

      ganttHistory = addGanttSegment(
        ganttHistory,
        core.id,
        'CS',
        'Context Switch',
        '#ef4444',
        currentTick,
        true,
        false
      );

      if (core.contextSwitchRemaining <= 0) {
        core.isSwitching = false;
        core.assignedProcessId = core.switchingToProcessId;
        const assignedProc = processes.find((p) => p.id === core.switchingToProcessId);
        if (assignedProc) {
          assignedProc.state = 'RUNNING';
          assignedProc.currentCoreId = core.id;
          if (assignedProc.startTime === null) {
            assignedProc.startTime = currentTick + 1;
            assignedProc.responseTime = assignedProc.startTime - assignedProc.arrivalTime;
          }
        }
        core.switchingToProcessId = null;
      }
      return;
    }

    // B. If core has an actively running process
    if (core.assignedProcessId) {
      const proc = processes.find((p) => p.id === core.assignedProcessId);
      if (proc) {
        if (proc.startTime === null) {
          proc.startTime = currentTick;
          proc.responseTime = proc.startTime - proc.arrivalTime;
        }

        proc.remainingTime = Math.max(0, proc.remainingTime - 1);
        proc.quantumRemaining -= 1;
        core.busyTicks += 1;

        ganttHistory = addGanttSegment(
          ganttHistory,
          core.id,
          proc.id,
          proc.name,
          proc.color,
          currentTick,
          false,
          false
        );

        // Check for I/O burst trigger
        const ioTrigger = proc.ioSchedule.find((io) => io.atRemaining === proc.remainingTime);
        if (ioTrigger && proc.remainingTime > 0) {
          proc.state = 'BLOCKED';
          proc.blockedRemaining = ioTrigger.duration;
          proc.currentCoreId = null;
          core.assignedProcessId = null;

          logs.unshift({
            id: `log-io-${proc.id}-${currentTick}`,
            tick: currentTick,
            level: 'warn',
            message: `[${core.id}] Process ${proc.id} entered I/O wait (${ioTrigger.duration}t duration)`,
            coreId: core.id,
            processId: proc.id,
          });
          return;
        }

        // Check for Process Completion
        if (proc.remainingTime <= 0) {
          proc.state = 'COMPLETED';
          proc.completionTime = currentTick + 1;
          proc.turnaroundTime = proc.completionTime - proc.arrivalTime;
          proc.waitingTime = Math.max(0, proc.turnaroundTime - proc.burstTime);
          proc.currentCoreId = null;
          core.assignedProcessId = null;

          logs.unshift({
            id: `log-comp-${proc.id}-${currentTick}`,
            tick: currentTick,
            level: 'success',
            message: `[${core.id}] Process ${proc.id} COMPLETED (CT: ${proc.completionTime}t, TAT: ${proc.turnaroundTime}t, WT: ${proc.waitingTime}t)`,
            coreId: core.id,
            processId: proc.id,
          });
          return;
        }

        return;
      }
    }

    // C. If Core is IDLE -> Dispatch next ready process
    const availableReady = processes.filter((p) => p.state === 'READY' && !claimedProcessIds.has(p.id));
    const nextProc = selectNextProcess(
      availableReady,
      prevState.algorithm,
      prevState.priorityOrder,
      claimedProcessIds
    );

    if (nextProc) {
      claimedProcessIds.add(nextProc.id);

      const isDifferentProcess = core.previousProcessId !== null && core.previousProcessId !== nextProc.id;
      const csOverhead = isDifferentProcess ? prevState.contextSwitchTime : 0;

      if (csOverhead > 0) {
        core.isSwitching = true;
        core.contextSwitchRemaining = csOverhead;
        core.switchingToProcessId = nextProc.id;
        core.previousProcessId = nextProc.id;
        totalCS += 1;

        logs.unshift({
          id: `log-cs-${core.id}-${nextProc.id}-${currentTick}`,
          tick: currentTick,
          level: 'cs',
          message: `[${core.id}] Context switch overhead (${csOverhead}t) -> switching to ${nextProc.id}`,
          coreId: core.id,
          processId: nextProc.id,
        });

        core.contextSwitchRemaining -= 1;
        core.contextSwitchTicks += 1;

        ganttHistory = addGanttSegment(
          ganttHistory,
          core.id,
          'CS',
          'Context Switch',
          '#ef4444',
          currentTick,
          true,
          false
        );

        if (core.contextSwitchRemaining <= 0) {
          core.isSwitching = false;
          core.assignedProcessId = nextProc.id;
          nextProc.state = 'RUNNING';
          nextProc.currentCoreId = core.id;
          if (nextProc.startTime === null) {
            nextProc.startTime = currentTick + 1;
            nextProc.responseTime = nextProc.startTime - nextProc.arrivalTime;
          }
          core.switchingToProcessId = null;
        }
      } else {
        core.assignedProcessId = nextProc.id;
        core.previousProcessId = nextProc.id;
        nextProc.state = 'RUNNING';
        nextProc.currentCoreId = core.id;
        nextProc.quantumRemaining = prevState.quantum;

        if (nextProc.startTime === null) {
          nextProc.startTime = currentTick;
          nextProc.responseTime = nextProc.startTime - nextProc.arrivalTime;
        }

        nextProc.remainingTime = Math.max(0, nextProc.remainingTime - 1);
        nextProc.quantumRemaining -= 1;
        core.busyTicks += 1;

        ganttHistory = addGanttSegment(
          ganttHistory,
          core.id,
          nextProc.id,
          nextProc.name,
          nextProc.color,
          currentTick,
          false,
          false
        );

        if (nextProc.remainingTime <= 0) {
          nextProc.state = 'COMPLETED';
          nextProc.completionTime = currentTick + 1;
          nextProc.turnaroundTime = nextProc.completionTime - nextProc.arrivalTime;
          nextProc.waitingTime = Math.max(0, nextProc.turnaroundTime - nextProc.burstTime);
          nextProc.currentCoreId = null;
          core.assignedProcessId = null;

          logs.unshift({
            id: `log-comp-${nextProc.id}-${currentTick}`,
            tick: currentTick,
            level: 'success',
            message: `[${core.id}] Process ${nextProc.id} COMPLETED (CT: ${nextProc.completionTime}t, TAT: ${nextProc.turnaroundTime}t, WT: ${nextProc.waitingTime}t)`,
            coreId: core.id,
            processId: nextProc.id,
          });
        }
      }
    } else {
      core.idleTicks += 1;
      ganttHistory = addGanttSegment(
        ganttHistory,
        core.id,
        'IDLE',
        'CPU Idle',
        '#1e293b',
        currentTick,
        false,
        true
      );
    }
  });

  const allFinished = processes.every((p) => p.state === 'COMPLETED');
  if (allFinished && !prevState.isCompleted) {
    logs.unshift({
      id: `log-all-comp-${currentTick}`,
      tick: currentTick + 1,
      level: 'success',
      message: `🎉 All ${processes.length} processes completed execution successfully at Tick ${currentTick + 1}!`,
    });
  }

  return {
    ...prevState,
    currentTick: currentTick + 1,
    processes,
    cores,
    ganttHistory,
    logs: logs.slice(0, 100),
    isCompleted: allFinished,
    totalContextSwitches: totalCS,
  };
}

// Complete simulation instantly
export function runSimulationToCompletion(state: SimulationState): SimulationState {
  let current = { ...state, isPlaying: false };
  let safety = 0;
  while (!current.isCompleted && safety < 1000) {
    current = tickSimulation(current);
    safety++;
  }
  return current;
}

// Headless simulation for comparing all 6 algorithms side-by-side
export function runAlgorithmHeadless(
  initialProcesses: Process[],
  algorithm: AlgorithmType,
  options: {
    numCores: number;
    quantum: number;
    contextSwitchTime: number;
    enableAging: boolean;
    agingThreshold: number;
    priorityBoost: number;
    priorityOrder: PriorityOrder;
    maxTicks?: number;
  }
): AlgorithmComparisonResult {
  const maxTicks = options.maxTicks || 1000;
  let state: SimulationState = {
    currentTick: 0,
    isPlaying: true,
    speedMultiplier: 1,
    numCores: options.numCores,
    algorithm,
    quantum: options.quantum,
    contextSwitchTime: options.contextSwitchTime,
    enableAging: options.enableAging,
    agingThreshold: options.agingThreshold,
    priorityBoost: options.priorityBoost,
    priorityOrder: options.priorityOrder,
    cores: createCores(options.numCores),
    processes: initialProcesses.map((p) => ({
      ...p,
      state: 'UNARRIVED',
      remainingTime: p.burstTime,
      currentPriority: p.priority,
      agedCount: 0,
      currentCoreId: null,
      blockedRemaining: 0,
      quantumRemaining: options.quantum,
      starvationTicks: 0,
      startTime: null,
      completionTime: null,
      waitingTime: 0,
      turnaroundTime: 0,
      responseTime: null,
      lastExecutedCoreId: null,
    })),
    ganttHistory: [],
    logs: [],
    isCompleted: false,
    totalContextSwitches: 0,
  };

  let ticks = 0;
  while (!state.isCompleted && ticks < maxTicks) {
    state = tickSimulation(state);
    ticks++;
  }

  const kpis = calculateKPIs(state.processes, state.cores, state.currentTick, state.totalContextSwitches);

  const ALGO_NAMES: Record<AlgorithmType, string> = {
    FCFS: 'First-Come, First-Served (FCFS)',
    SJF: 'Shortest Job First (SJF - Non-Preemptive)',
    SRTF: 'Shortest Remaining Time First (SRTF)',
    RR: `Round Robin (RR, Q=${options.quantum})`,
    PRIORITY_NP: 'Priority Scheduling (Non-Preemptive)',
    PRIORITY_P: 'Priority Scheduling (Preemptive)',
  };

  return {
    algorithm,
    name: ALGO_NAMES[algorithm] || algorithm,
    kpis,
    ganttHistory: state.ganttHistory,
    processes: state.processes,
    finalTick: state.currentTick,
  };
}
