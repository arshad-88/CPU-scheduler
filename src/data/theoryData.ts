import { AlgorithmType } from '../types/scheduler';

export interface WorkedStep {
  tickRange: string;
  processId: string;
  action: string;
  reason: string;
}

export interface WorkedResultRow {
  id: string;
  at: number;
  bt: number;
  priority?: number;
  ct: number;
  tat: number;
  wt: number;
  rt: number;
}

export interface AlgorithmTheory {
  id: AlgorithmType;
  name: string;
  shortName: string;
  badge: string;
  type: 'Non-Preemptive' | 'Preemptive';
  analogy: string;
  howItWorks: string;
  advantages: string[];
  disadvantages: string[];
  pseudocode: string;
  workedExample: {
    title: string;
    problem: string;
    steps: WorkedStep[];
    table: WorkedResultRow[];
    avgTATFormula: string;
    avgWTFormula: string;
    avgRTFormula: string;
  };
  miniSimProcesses: Array<{
    id: string;
    name: string;
    arrivalTime: number;
    burstTime: number;
    priority: number;
    color: string;
  }>;
  recommendedQuantum?: number;
}

export const ALGORITHM_THEORY_DATA: Record<AlgorithmType, AlgorithmTheory> = {
  FCFS: {
    id: 'FCFS',
    name: 'First-Come, First-Served (FCFS)',
    shortName: 'FCFS',
    badge: 'Non-Preemptive',
    type: 'Non-Preemptive',
    analogy:
      '🛒 Supermarket Checkout: Customers are served strictly in the exact order they arrive at the counter, regardless of whether they have 1 item or 100 items.',
    howItWorks:
      'The CPU executes processes in the exact chronological order of their arrival time. Once a process gains the CPU, it runs uninterrupted until it completely finishes.',
    advantages: [
      'Simple to understand and implement using a straightforward FIFO queue.',
      'Completely starvation-free: every process will eventually get its turn.',
      'Zero preemption overhead and minimal scheduling cost.',
    ],
    disadvantages: [
      'Suffers from the Convoy Effect: short tasks wait a long time behind massive tasks.',
      'Higher Average Waiting Time compared to SJF or Round Robin.',
      'Poor response time for interactive user applications.',
    ],
    pseudocode: `// FCFS: First-Come, First-Served
Queue readyQueue = new FIFOQueue();

while (hasProcesses()) {
  readyQueue.addAll(newArrivalsAt(currentTime));
  
  if (cpu.isIdle() && !readyQueue.isEmpty()) {
    Process p = readyQueue.dequeue();
    // Run to completion
    while (p.remainingTime > 0) {
      cpu.execute(p);
      currentTime++;
    }
    p.completionTime = currentTime;
  }
}`,
    workedExample: {
      title: 'FCFS Step-by-Step Numerical Example',
      problem: 'Given 3 processes: P1 (AT=0, BT=6), P2 (AT=1, BT=2), P3 (AT=2, BT=3)',
      steps: [
        { tickRange: '0 → 6', processId: 'P1', action: 'Runs to completion', reason: 'Arrived first at t=0; executes full 6 ticks' },
        { tickRange: '6 → 8', processId: 'P2', action: 'Runs to completion', reason: 'Arrived at t=1; waited 5 ticks in queue' },
        { tickRange: '8 → 11', processId: 'P3', action: 'Runs to completion', reason: 'Arrived at t=2; waited 6 ticks in queue' },
      ],
      table: [
        { id: 'P1', at: 0, bt: 6, ct: 6, tat: 6, wt: 0, rt: 0 },
        { id: 'P2', at: 1, bt: 2, ct: 8, tat: 7, wt: 5, rt: 5 },
        { id: 'P3', at: 2, bt: 3, ct: 11, tat: 9, wt: 6, rt: 6 },
      ],
      avgTATFormula: 'Avg Turnaround Time = (6 + 7 + 9) / 3 = 7.33 ticks',
      avgWTFormula: 'Avg Waiting Time = (0 + 5 + 6) / 3 = 3.67 ticks',
      avgRTFormula: 'Avg Response Time = (0 + 5 + 6) / 3 = 3.67 ticks',
    },
    miniSimProcesses: [
      { id: 'P1', name: 'Heavy Task', arrivalTime: 0, burstTime: 6, priority: 3, color: '#3b82f6' },
      { id: 'P2', name: 'Quick Task', arrivalTime: 1, burstTime: 2, priority: 1, color: '#10b981' },
      { id: 'P3', name: 'Web Request', arrivalTime: 2, burstTime: 3, priority: 2, color: '#f59e0b' },
    ],
  },

  SJF: {
    id: 'SJF',
    name: 'Shortest Job First (SJF - Non-Preemptive)',
    shortName: 'SJF (NP)',
    badge: 'Non-Preemptive',
    type: 'Non-Preemptive',
    analogy:
      '📧 Inbox Quick Replies: You scan your unread inbox and answer the shortest 1-sentence emails first before opening a lengthy report, clearing items quickly.',
    howItWorks:
      'When the CPU becomes available, it picks the waiting process with the smallest total burst time. Once started, the process runs to completion without interruption.',
    advantages: [
      'Mathematically minimizes the Average Waiting Time among all non-preemptive algorithms.',
      'High throughput because quick jobs complete and free up system resources rapidly.',
      'Eliminates the Convoy Effect seen in FCFS.',
    ],
    disadvantages: [
      'Impossible to know exact future CPU burst lengths in advance in general systems.',
      'Starvation risk: long tasks may wait indefinitely if short tasks keep arriving.',
      'Not preemptive: a 1-tick job arriving at t=1 still waits if a 20-tick job started at t=0.',
    ],
    pseudocode: `// SJF: Shortest Job First (Non-Preemptive)
while (hasProcesses()) {
  readyList.addAll(newArrivalsAt(currentTime));
  
  if (cpu.isIdle() && !readyList.isEmpty()) {
    // Pick process with minimum total burst time
    Process shortest = readyList.extractMinBurst();
    while (shortest.remainingTime > 0) {
      cpu.execute(shortest);
      currentTime++;
    }
    shortest.completionTime = currentTime;
  }
}`,
    workedExample: {
      title: 'SJF Step-by-Step Numerical Example',
      problem: 'Given 4 processes: P1 (AT=0, BT=7), P2 (AT=2, BT=4), P3 (AT=4, BT=1), P4 (AT=5, BT=4)',
      steps: [
        { tickRange: '0 → 7', processId: 'P1', action: 'Runs to completion', reason: 'Only process available at t=0' },
        { tickRange: '7 → 8', processId: 'P3', action: 'Selected (BT=1)', reason: 'At t=7, waiting jobs are P2 (4), P3 (1), P4 (4). P3 is shortest!' },
        { tickRange: '8 → 12', processId: 'P2', action: 'Selected (BT=4)', reason: 'Tied with P4, but P2 arrived earlier at t=2' },
        { tickRange: '12 → 16', processId: 'P4', action: 'Runs to completion', reason: 'Last remaining process' },
      ],
      table: [
        { id: 'P1', at: 0, bt: 7, ct: 7, tat: 7, wt: 0, rt: 0 },
        { id: 'P2', at: 2, bt: 4, ct: 12, tat: 10, wt: 6, rt: 5 },
        { id: 'P3', at: 4, bt: 1, ct: 8, tat: 4, wt: 3, rt: 3 },
        { id: 'P4', at: 5, bt: 4, ct: 16, tat: 11, wt: 7, rt: 7 },
      ],
      avgTATFormula: 'Avg Turnaround Time = (7 + 10 + 4 + 11) / 4 = 8.00 ticks',
      avgWTFormula: 'Avg Waiting Time = (0 + 6 + 3 + 7) / 4 = 4.00 ticks',
      avgRTFormula: 'Avg Response Time = (0 + 5 + 3 + 7) / 4 = 3.75 ticks',
    },
    miniSimProcesses: [
      { id: 'P1', name: 'Large Job', arrivalTime: 0, burstTime: 6, priority: 2, color: '#3b82f6' },
      { id: 'P2', name: 'Small Job', arrivalTime: 1, burstTime: 2, priority: 1, color: '#10b981' },
      { id: 'P3', name: 'Tiny Job', arrivalTime: 2, burstTime: 1, priority: 3, color: '#ec4899' },
      { id: 'P4', name: 'Medium Job', arrivalTime: 3, burstTime: 3, priority: 2, color: '#f59e0b' },
    ],
  },

  SRTF: {
    id: 'SRTF',
    name: 'Shortest Remaining Time First (SRTF - Preemptive SJF)',
    shortName: 'SRTF (Preemptive)',
    badge: 'Preemptive',
    type: 'Preemptive',
    analogy:
      '🏥 Emergency Room Triage: A doctor is stitching a minor wound (5 min remaining). A patient arrives needing a 30-second adrenaline shot. The doctor immediately pauses the stitching to give the quick life-saving shot.',
    howItWorks:
      'At every clock tick or arrival, the scheduler compares remaining times. If a newly arrived process needs less time than what is left on the running process, the CPU immediately pauses the current job and switches.',
    advantages: [
      'Provides the absolute lowest average turnaround and waiting time of any algorithm.',
      'Immediate responsiveness for lightweight, short tasks.',
      'Frees up memory and compute slots as fast as mathematically possible.',
    ],
    disadvantages: [
      'Higher context switching overhead due to frequent mid-cycle preemptions.',
      'Long tasks can suffer severe starvation without an anti-starvation aging mechanism.',
      'Requires constant tracking of remaining CPU burst time.',
    ],
    pseudocode: `// SRTF: Shortest Remaining Time First (Preemptive)
while (hasProcesses()) {
  readyList.addAll(newArrivalsAt(currentTime));
  Process shortest = readyList.findMinRemainingTime();
  
  if (cpu.hasRunningProcess()) {
    Process current = cpu.getRunning();
    if (shortest.remainingTime < current.remainingTime) {
      cpu.preempt(current);      // Save state & pause
      readyList.add(current);
      cpu.dispatch(shortest);     // Switch to shorter job
    }
  } else if (shortest != null) {
    cpu.dispatch(shortest);
  }
  
  cpu.executeOneTick();
  currentTime++;
}`,
    workedExample: {
      title: 'SRTF Step-by-Step Numerical Example',
      problem: 'Given 4 processes: P1 (AT=0, BT=8), P2 (AT=1, BT=4), P3 (AT=2, BT=2), P4 (AT=3, BT=1)',
      steps: [
        { tickRange: '0 → 1', processId: 'P1', action: 'Runs 1t (Rem: 7)', reason: 'P1 starts alone at t=0' },
        { tickRange: '1 → 2', processId: 'P2', action: 'Preempts P1! Runs 1t (Rem: 3)', reason: 'At t=1, P2 arrives (BT=4 < P1 rem=7)' },
        { tickRange: '2 → 3', processId: 'P3', action: 'Preempts P2! Runs 1t (Rem: 1)', reason: 'At t=2, P3 arrives (BT=2 < P2 rem=3)' },
        { tickRange: '3 → 4', processId: 'P4', action: 'Preempts P3! Runs 1t & Completes', reason: 'At t=3, P4 arrives (BT=1 == P3 rem=1, finishes)' },
        { tickRange: '4 → 5', processId: 'P3', action: 'Resumes & Completes', reason: 'P3 has 1t left' },
        { tickRange: '5 → 8', processId: 'P2', action: 'Resumes & Completes', reason: 'P2 has 3t left' },
        { tickRange: '8 → 15', processId: 'P1', action: 'Resumes & Completes', reason: 'P1 finishes remaining 7t' },
      ],
      table: [
        { id: 'P1', at: 0, bt: 8, ct: 15, tat: 15, wt: 7, rt: 0 },
        { id: 'P2', at: 1, bt: 4, ct: 8, tat: 7, wt: 3, rt: 0 },
        { id: 'P3', at: 2, bt: 2, ct: 5, tat: 3, wt: 1, rt: 0 },
        { id: 'P4', at: 3, bt: 1, ct: 4, tat: 1, wt: 0, rt: 0 },
      ],
      avgTATFormula: 'Avg Turnaround Time = (15 + 7 + 3 + 1) / 4 = 6.50 ticks',
      avgWTFormula: 'Avg Waiting Time = (7 + 3 + 1 + 0) / 4 = 2.75 ticks',
      avgRTFormula: 'Avg Response Time = (0 + 0 + 0 + 0) / 4 = 0.00 ticks',
    },
    miniSimProcesses: [
      { id: 'P1', name: 'Long Task', arrivalTime: 0, burstTime: 7, priority: 3, color: '#3b82f6' },
      { id: 'P2', name: 'Medium Task', arrivalTime: 2, burstTime: 3, priority: 2, color: '#10b981' },
      { id: 'P3', name: 'Flash Task', arrivalTime: 4, burstTime: 1, priority: 1, color: '#ec4899' },
    ],
  },

  RR: {
    id: 'RR',
    name: 'Round Robin (RR)',
    shortName: 'Round Robin',
    badge: 'Time-Sharing / Preemptive',
    type: 'Preemptive',
    analogy:
      '🎙️ Microphone Round in a Meeting: Everyone in the circle gets a strict 2-minute timer to speak. If you have more to say when the timer rings, you pass the mic and wait for your next turn.',
    howItWorks:
      'The CPU allocates each process a fixed slice of time called a Time Quantum (q). If the process is still running when its quantum expires, it is paused and moved to the back of the line.',
    advantages: [
      'Fair and starvation-free: every ready process receives regular, guaranteed CPU time.',
      'Outstanding Response Time: no interactive application sits waiting for a long period.',
      'Standard choice for modern interactive multitasking operating systems.',
    ],
    disadvantages: [
      'Performance heavily depends on picking the right Time Quantum (q).',
      'Small quantum causes excessive context-switch overhead.',
      'Large quantum degrades behavior back into simple FCFS.',
    ],
    pseudocode: `// Round Robin (RR)
Queue readyQueue = new FIFOQueue();
int quantum = 3;

while (hasProcesses()) {
  readyQueue.addAll(newArrivalsAt(currentTime));
  
  if (!readyQueue.isEmpty()) {
    Process p = readyQueue.dequeue();
    int slice = Math.min(quantum, p.remainingTime);
    
    for (int t = 0; t < slice; t++) {
      cpu.execute(p);
      currentTime++;
      readyQueue.addAll(newArrivalsAt(currentTime));
    }
    
    if (p.remainingTime > 0) {
      readyQueue.enqueue(p); // Move to back of line
    } else {
      p.completionTime = currentTime;
    }
  }
}`,
    workedExample: {
      title: 'Round Robin Step-by-Step Numerical Example (Quantum = 2)',
      problem: 'Given 3 processes: P1 (AT=0, BT=5), P2 (AT=1, BT=3), P3 (AT=2, BT=1) with Quantum = 2',
      steps: [
        { tickRange: '0 → 2', processId: 'P1', action: 'Runs 2t (Rem: 3)', reason: 'P1 takes first quantum. P2 arrives at t=1, P3 arrives at t=2' },
        { tickRange: '2 → 4', processId: 'P2', action: 'Runs 2t (Rem: 1)', reason: 'P2 takes quantum. Queue is now [P3, P1, P2]' },
        { tickRange: '4 → 5', processId: 'P3', action: 'Runs 1t & Completes!', reason: 'P3 burst is 1t (< quantum). Queue is now [P1, P2]' },
        { tickRange: '5 → 7', processId: 'P1', action: 'Runs 2t (Rem: 1)', reason: 'P1 takes second quantum. Queue is now [P2, P1]' },
        { tickRange: '7 → 8', processId: 'P2', action: 'Runs 1t & Completes!', reason: 'P2 finishes its last tick' },
        { tickRange: '8 → 9', processId: 'P1', action: 'Runs 1t & Completes!', reason: 'P1 finishes its last tick' },
      ],
      table: [
        { id: 'P1', at: 0, bt: 5, ct: 9, tat: 9, wt: 4, rt: 0 },
        { id: 'P2', at: 1, bt: 3, ct: 8, tat: 7, wt: 4, rt: 1 },
        { id: 'P3', at: 2, bt: 1, ct: 5, tat: 3, wt: 2, rt: 2 },
      ],
      avgTATFormula: 'Avg Turnaround Time = (9 + 7 + 3) / 3 = 6.33 ticks',
      avgWTFormula: 'Avg Waiting Time = (4 + 4 + 2) / 3 = 3.33 ticks',
      avgRTFormula: 'Avg Response Time = (0 + 1 + 2) / 3 = 1.00 ticks',
    },
    miniSimProcesses: [
      { id: 'P1', name: 'Task Alpha', arrivalTime: 0, burstTime: 5, priority: 2, color: '#3b82f6' },
      { id: 'P2', name: 'Task Beta', arrivalTime: 1, burstTime: 3, priority: 1, color: '#10b981' },
      { id: 'P3', name: 'Task Gamma', arrivalTime: 2, burstTime: 2, priority: 3, color: '#f59e0b' },
    ],
    recommendedQuantum: 2,
  },

  PRIORITY_NP: {
    id: 'PRIORITY_NP',
    name: 'Priority Scheduling (Non-Preemptive)',
    shortName: 'Priority (NP)',
    badge: 'Non-Preemptive',
    type: 'Non-Preemptive',
    analogy:
      '✈️ Airport Boarding Zones: First Class boards before Economy. However, once an economy passenger is walking down the boarding tunnel, they are not pulled back.',
    howItWorks:
      'Each process has a priority number (e.g. 1 is highest priority). When the CPU is free, the highest-priority waiting process is selected and runs to completion without interruption.',
    advantages: [
      'Allows explicit business importance or operating system criticality to govern execution order.',
      'Simple priority classification for batch workflows.',
      'Guarantees VIP tasks get dispatched first when the CPU becomes free.',
    ],
    disadvantages: [
      'Starvation (Indefinite Blocking): low-priority jobs may never run if high-priority tasks keep coming.',
      'Non-preemptive: an urgent emergency task must wait if a low-priority task is already on the CPU.',
    ],
    pseudocode: `// Priority Scheduling (Non-Preemptive)
while (hasProcesses()) {
  readyList.addAll(newArrivalsAt(currentTime));
  
  if (cpu.isIdle() && !readyList.isEmpty()) {
    Process highest = readyList.extractHighestPriority();
    while (highest.remainingTime > 0) {
      cpu.execute(highest);
      currentTime++;
    }
    highest.completionTime = currentTime;
  }
}`,
    workedExample: {
      title: 'Priority Non-Preemptive Numerical Example (1 is Highest Priority)',
      problem: 'Given: P1 (AT=0, BT=4, Pri=3), P2 (AT=1, BT=3, Pri=1), P3 (AT=2, BT=1, Pri=2)',
      steps: [
        { tickRange: '0 → 4', processId: 'P1', action: 'Runs to completion', reason: 'P1 starts at t=0 before P2/P3 arrive' },
        { tickRange: '4 → 7', processId: 'P2', action: 'Selected (Pri=1)', reason: 'Highest priority waiting process at t=4' },
        { tickRange: '7 → 8', processId: 'P3', action: 'Selected (Pri=2)', reason: 'Runs remaining task' },
      ],
      table: [
        { id: 'P1', at: 0, bt: 4, priority: 3, ct: 4, tat: 4, wt: 0, rt: 0 },
        { id: 'P2', at: 1, bt: 3, priority: 1, ct: 7, tat: 6, wt: 3, rt: 3 },
        { id: 'P3', at: 2, bt: 1, priority: 2, ct: 8, tat: 6, wt: 5, rt: 5 },
      ],
      avgTATFormula: 'Avg Turnaround Time = (4 + 6 + 6) / 3 = 5.33 ticks',
      avgWTFormula: 'Avg Waiting Time = (0 + 3 + 5) / 3 = 2.67 ticks',
      avgRTFormula: 'Avg Response Time = (0 + 3 + 5) / 3 = 2.67 ticks',
    },
    miniSimProcesses: [
      { id: 'P1', name: 'Background Sync', arrivalTime: 0, burstTime: 5, priority: 3, color: '#3b82f6' },
      { id: 'P2', name: 'User Click Event', arrivalTime: 1, burstTime: 2, priority: 1, color: '#ef4444' },
      { id: 'P3', name: 'Audio Buffer', arrivalTime: 2, burstTime: 3, priority: 2, color: '#10b981' },
    ],
  },

  PRIORITY_P: {
    id: 'PRIORITY_P',
    name: 'Priority Scheduling (Preemptive)',
    shortName: 'Priority (Preemptive)',
    badge: 'Preemptive',
    type: 'Preemptive',
    analogy:
      '🚨 Ambulance with Sirens: Regular cars on the road must immediately pull over to let an emergency vehicle pass ahead.',
    howItWorks:
      'When a new process arrives with a priority strictly higher than the currently executing process, the CPU immediately pauses the current process and switches to the higher-priority newcomer.',
    advantages: [
      'Guarantees immediate CPU execution for urgent, safety-critical tasks.',
      'Supports hard real-time deadlines and operating system interrupt handling.',
      'High-priority events never get trapped waiting behind long background tasks.',
    ],
    disadvantages: [
      'Low-priority processes can starve completely without an Aging mechanism.',
      'Higher context switching overhead when priorities fluctuate frequently.',
    ],
    pseudocode: `// Priority Scheduling (Preemptive)
while (hasProcesses()) {
  readyList.addAll(newArrivalsAt(currentTime));
  Process highest = readyList.findHighestPriority();
  
  if (cpu.hasRunningProcess()) {
    Process current = cpu.getRunning();
    if (highest.priority < current.priority) { // Higher priority
      cpu.preempt(current);
      readyList.add(current);
      cpu.dispatch(highest);
    }
  } else if (highest != null) {
    cpu.dispatch(highest);
  }
  
  cpu.executeOneTick();
  currentTime++;
}`,
    workedExample: {
      title: 'Priority Preemptive Numerical Example (1 is Highest Priority)',
      problem: 'Given: P1 (AT=0, BT=5, Pri=3), P2 (AT=1, BT=2, Pri=1), P3 (AT=2, BT=3, Pri=2)',
      steps: [
        { tickRange: '0 → 1', processId: 'P1', action: 'Runs 1t (Rem: 4)', reason: 'Starts alone at t=0 (Pri=3)' },
        { tickRange: '1 → 3', processId: 'P2', action: 'Preempts P1! Runs 2t & Completes', reason: 'P2 arrives with Pri=1 (Higher than P1 Pri=3)' },
        { tickRange: '3 → 6', processId: 'P3', action: 'Runs 3t & Completes', reason: 'At t=3, P3 (Pri=2) outranks P1 (Pri=3)' },
        { tickRange: '6 → 10', processId: 'P1', action: 'Resumes & Completes', reason: 'P1 finishes remaining 4 ticks' },
      ],
      table: [
        { id: 'P1', at: 0, bt: 5, priority: 3, ct: 10, tat: 10, wt: 5, rt: 0 },
        { id: 'P2', at: 1, bt: 2, priority: 1, ct: 3, tat: 2, wt: 0, rt: 0 },
        { id: 'P3', at: 2, bt: 3, priority: 2, ct: 6, tat: 4, wt: 1, rt: 1 },
      ],
      avgTATFormula: 'Avg Turnaround Time = (10 + 2 + 4) / 3 = 5.33 ticks',
      avgWTFormula: 'Avg Waiting Time = (5 + 0 + 1) / 3 = 2.00 ticks',
      avgRTFormula: 'Avg Response Time = (0 + 0 + 1) / 3 = 0.33 ticks',
    },
    miniSimProcesses: [
      { id: 'P1', name: 'Background Job', arrivalTime: 0, burstTime: 6, priority: 3, color: '#3b82f6' },
      { id: 'P2', name: 'Urgent Alarm', arrivalTime: 1, burstTime: 2, priority: 1, color: '#ef4444' },
      { id: 'P3', name: 'Sensor Polling', arrivalTime: 2, burstTime: 2, priority: 2, color: '#10b981' },
    ],
  },
};
