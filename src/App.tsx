import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  SimulationState, 
  AlgorithmType, 
  Process, 
  PresetScenario,
  PriorityOrder,
  SimulationConfig 
} from './types/scheduler';
import { PRESET_SCENARIOS } from './data/presets';
import { 
  resetSimulation, 
  tickSimulation, 
  runSimulationToCompletion 
} from './services/schedulerEngine';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ControlHeader } from './components/ControlHeader';
import { ProcessInputTable } from './components/ProcessInputTable';
import { GanttTimeline } from './components/GanttTimeline';
import { StateQueues } from './components/StateQueues';
import { ProcessLifecyclePipeline } from './components/ProcessLifecyclePipeline';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ComparisonModal } from './components/ComparisonModal';
import { TheoryModal } from './components/TheoryModal';

function SchedulerApp() {
  const { colors } = useTheme();

  // Configuration Settings State
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('RR');
  const [quantum, setQuantum] = useState<number>(3);
  const [enableAging, setEnableAging] = useState<boolean>(true);
  const [agingThreshold, setAgingThreshold] = useState<number>(6);
  const [priorityBoost, setPriorityBoost] = useState<number>(1);
  const [priorityOrder, setPriorityOrder] = useState<PriorityOrder>('LOWER_IS_HIGHER');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);

  // Active Workload Scenario
  const [activePreset] = useState<PresetScenario>(PRESET_SCENARIOS[0]);
  const [customProcesses, setCustomProcesses] = useState<Process[] | null>(null);

  // Selected Process for Timeline/Queue Highlight
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);

  // Modals Visibility
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);

  // History stack for stepping backwards
  const [historyStack, setHistoryStack] = useState<SimulationState[]>([]);

  // Helper to construct current simulation config
  const getSimulationConfig = useCallback((): SimulationConfig => ({
    numCores: 1,
    quantum,
    contextSwitchTime: 0,
    enableAging,
    agingThreshold,
    priorityBoost,
    priorityOrder,
  }), [
    quantum,
    enableAging,
    agingThreshold,
    priorityBoost,
    priorityOrder,
  ]);

  // Simulation State Engine
  const [simState, setSimState] = useState<SimulationState>(() =>
    resetSimulation(PRESET_SCENARIOS[0], null, 'RR', {
      numCores: 1,
      quantum: 3,
      contextSwitchTime: 0,
      enableAging: true,
      agingThreshold: 6,
      priorityBoost: 1,
      priorityOrder: 'LOWER_IS_HIGHER',
    })
  );

  // Playhead interval timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Step Forward (+1 Unit)
  const handleStepForward = useCallback(() => {
    setSimState((prev) => {
      if (prev.isCompleted) return prev;
      setHistoryStack((stack) => [...stack, prev]);
      return tickSimulation(prev);
    });
  }, []);

  // Step Backward (-1 Unit)
  const handleStepBackward = useCallback(() => {
    setHistoryStack((stack) => {
      if (stack.length === 0) return stack;
      const previousState = stack[stack.length - 1];
      setSimState(previousState);
      return stack.slice(0, stack.length - 1);
    });
  }, []);

  // Reset Simulation
  const handleReset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const config = getSimulationConfig();
    const fresh = resetSimulation(
      customProcesses ? null : activePreset,
      customProcesses,
      algorithm,
      config
    );
    setSimState(fresh);
    setHistoryStack([]);
    setSelectedProcessId(null);
  }, [getSimulationConfig, customProcesses, activePreset, algorithm]);

  // Solve Instantly / Run Full Simulation
  const handleSolveInstantly = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSimState((prev) => {
      setHistoryStack((stack) => [...stack, prev]);
      return runSimulationToCompletion(prev);
    });
  }, []);

  // Toggle Play / Pause
  const handleTogglePlay = useCallback(() => {
    setSimState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  // Simulation Playback Timer Effect
  useEffect(() => {
    if (simState.isPlaying && !simState.isCompleted) {
      const intervalMs = Math.max(80, Math.floor(550 / speedMultiplier));
      timerRef.current = setInterval(() => {
        handleStepForward();
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [simState.isPlaying, simState.isCompleted, speedMultiplier, handleStepForward]);

  // Handle Algorithm Change
  const handleChangeAlgorithm = (newAlgo: AlgorithmType) => {
    setAlgorithm(newAlgo);
    const config = { ...getSimulationConfig() };
    const fresh = resetSimulation(
      customProcesses ? null : activePreset,
      customProcesses,
      newAlgo,
      config
    );
    setSimState(fresh);
    setHistoryStack([]);
  };

  // Handle Quantum Change
  const handleChangeQuantum = (q: number) => {
    setQuantum(q);
    const config = { ...getSimulationConfig(), quantum: q };
    const fresh = resetSimulation(
      customProcesses ? null : activePreset,
      customProcesses,
      algorithm,
      config
    );
    setSimState(fresh);
    setHistoryStack([]);
  };

  // Handle Aging Toggle
  const handleToggleAging = () => {
    const nextAging = !enableAging;
    setEnableAging(nextAging);
    const config = { ...getSimulationConfig(), enableAging: nextAging };
    const fresh = resetSimulation(
      customProcesses ? null : activePreset,
      customProcesses,
      algorithm,
      config
    );
    setSimState(fresh);
    setHistoryStack([]);
  };

  // Handle Aging Threshold Change
  const handleChangeAgingThreshold = (threshold: number) => {
    setAgingThreshold(threshold);
    const config = { ...getSimulationConfig(), agingThreshold: threshold };
    const fresh = resetSimulation(
      customProcesses ? null : activePreset,
      customProcesses,
      algorithm,
      config
    );
    setSimState(fresh);
    setHistoryStack([]);
  };

  // Handle Priority Order Change
  const handleChangePriorityOrder = (order: PriorityOrder) => {
    setPriorityOrder(order);
    const config = { ...getSimulationConfig(), priorityOrder: order };
    const fresh = resetSimulation(
      customProcesses ? null : activePreset,
      customProcesses,
      algorithm,
      config
    );
    setSimState(fresh);
    setHistoryStack([]);
  };

  // Handle Processes Change from table
  const handleProcessesChange = (newProcesses: Process[]) => {
    setCustomProcesses(newProcesses);
    const config = getSimulationConfig();
    const fresh = resetSimulation(null, newProcesses, algorithm, config);
    setSimState(fresh);
    setHistoryStack([]);
  };

  return (
    <div className={`min-h-screen relative overflow-x-hidden ${colors.bgMain} ${colors.textPrimary} transition-colors font-sans selection:bg-cyan-500/30 selection:text-cyan-600 dark:selection:text-cyan-200`}>
      
      {/* Ambient Mesh Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-35 dark:opacity-25 bg-gradient-to-br ${colors.glassGlow || 'from-cyan-500/20 to-blue-500/20'} animate-float-slow`} />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full blur-3xl opacity-30 dark:opacity-20 bg-gradient-to-bl from-indigo-500/20 to-purple-500/20 animate-float-slow-reverse" />
        <div className="absolute -bottom-32 left-1/3 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-25 dark:opacity-15 bg-gradient-to-tr from-cyan-500/15 via-teal-500/10 to-indigo-500/20 animate-float-slow" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto p-3 sm:p-5 lg:p-6 space-y-4">
        
        {/* 1. Control Header & Settings */}
        <ControlHeader
          algorithm={algorithm}
          onSelectAlgorithm={handleChangeAlgorithm}
          quantum={quantum}
          onChangeQuantum={handleChangeQuantum}
          enableAging={enableAging}
          onToggleAging={handleToggleAging}
          agingThreshold={agingThreshold}
          onChangeAgingThreshold={handleChangeAgingThreshold}
          priorityBoost={priorityBoost}
          onChangePriorityBoost={setPriorityBoost}
          priorityOrder={priorityOrder}
          onChangePriorityOrder={handleChangePriorityOrder}
          isPlaying={simState.isPlaying}
          onTogglePlay={handleTogglePlay}
          onStepForward={handleStepForward}
          onStepBackward={handleStepBackward}
          onReset={handleReset}
          onSolveInstantly={handleSolveInstantly}
          currentTick={simState.currentTick}
          speedMultiplier={speedMultiplier}
          onChangeSpeed={setSpeedMultiplier}
          onOpenTheory={() => setIsTheoryOpen(true)}
          onOpenCompare={() => setIsComparisonOpen(true)}
        />

        {/* 2. Process Input Table */}
        <ProcessInputTable
          processes={simState.processes}
          onChangeProcesses={handleProcessesChange}
        />

        {/* Gantt Timeline */}
        <GanttTimeline
          cores={simState.cores}
          processes={simState.processes}
          ganttHistory={simState.ganttHistory}
          currentTick={simState.currentTick}
          algorithm={algorithm}
          selectedProcessId={selectedProcessId}
          onSelectProcessId={(id) => setSelectedProcessId(id)}
        />

        {/* Process Lifecycle State Flow */}
        <ProcessLifecyclePipeline
          processes={simState.processes}
          cores={simState.cores}
          algorithm={algorithm}
          currentTick={simState.currentTick}
          onSelectProcess={(p) => setSelectedProcessId(p.id)}
        />

        {/* State Transition Queues (Ready Queue & Completed Processes) */}
        <StateQueues
          processes={simState.processes}
          algorithm={algorithm}
          currentTick={simState.currentTick}
          enableAging={enableAging}
          agingThreshold={agingThreshold}
          onSelectProcess={(p) => setSelectedProcessId(p.id)}
        />

        {/* Performance Analytics & Calculation Results */}
        <div className="w-full">
          <AnalyticsDashboard
            processes={simState.processes}
            cores={simState.cores}
            currentTick={simState.currentTick}
            algorithm={algorithm}
            contextSwitchTime={0}
            enableAging={enableAging}
            totalContextSwitches={simState.totalContextSwitches}
            ganttHistory={simState.ganttHistory}
            isCompleted={simState.isCompleted}
            selectedProcessId={selectedProcessId}
            onSelectProcess={(p) => setSelectedProcessId(p.id)}
          />
        </div>

      </div>

      {/* Comparison Modal */}
      <ComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        processes={simState.processes}
        numCores={1}
        quantum={quantum}
        contextSwitchTime={0}
        enableAging={enableAging}
        agingThreshold={agingThreshold}
        priorityBoost={priorityBoost}
        priorityOrder={priorityOrder}
        onSelectAlgorithm={handleChangeAlgorithm}
      />

      {/* Theory & Scheduling Factors Guide Modal */}
      <TheoryModal
        isOpen={isTheoryOpen}
        onClose={() => setIsTheoryOpen(false)}
        initialAlgorithm={algorithm}
        onSelectAlgorithmInWorkspace={(algo, procs, q) => {
          if (q) setQuantum(q);
          setAlgorithm(algo);
          if (procs && procs.length > 0) {
            setCustomProcesses(procs);
            const fresh = resetSimulation(null, procs, algo, {
              ...getSimulationConfig(),
              quantum: q || quantum,
            });
            setSimState(fresh);
          } else {
            handleChangeAlgorithm(algo);
          }
        }}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SchedulerApp />
    </ThemeProvider>
  );
}
