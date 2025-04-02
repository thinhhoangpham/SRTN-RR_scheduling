export function simulateRR(processes, numCpus, quantum) {
  let currentTime = 0;
  let completedProcesses = 0;
  const totalProcesses = processes.length;

  // Each CPU holds { process, timeSlice }
  const cpus = Array.from({ length: numCpus }, () => ({
    process: null,
    timeSlice: 0,
  }));

  // Global ready queue for Round Robin scheduling (FIFO order)
  const globalQueue = [];
  // Temporary queue to hold processes returned from CPUs in the current tick.
  const returnedQueue = [];

  // Timeline snapshots: we record two snapshots per tick (before and after execution)
  const timeline = [];

  while (completedProcesses < totalProcesses) {
    // 1) Add newly arrived processes (that haven't been queued or are running).
    processes.forEach(p => {
      if (
        p.arrivalTime === currentTime &&
        p.remainingTime > 0 &&
        !globalQueue.some(qp => qp.id === p.id) &&
        !cpus.some(cpu => cpu.process && cpu.process.id === p.id)
      ) {
        globalQueue.push(p);
      }
    });

    // 2) Add processes that have been returned from CPUs in the previous tick.
    if (returnedQueue.length > 0) {
      returnedQueue.forEach(p => {
        if (
          p.remainingTime > 0 &&
          !globalQueue.some(qp => qp.id === p.id) &&
          !cpus.some(cpu => cpu.process && cpu.process.id === p.id)
        ) {
          globalQueue.push(p);
        }
      });
      returnedQueue.length = 0; // Clear the returnedQueue.
    }

    // Build snapshot for the ready queue (before CPU assignment).
    const timelineQueueBefore = globalQueue.map(p => ({
      id: p.id,
      remainingTime: p.remainingTime,
    }));

    // 3) Assign idle CPUs from the globalQueue (FIFO).
    for (const cpu of cpus) {
      if (!cpu.process && globalQueue.length > 0) {
        cpu.process = globalQueue.shift();
        cpu.timeSlice = Math.min(cpu.process.remainingTime, quantum);
        if (cpu.process.startTime === null) {
          cpu.process.startTime = currentTime;
        }
      }
    }

    // 4) Record a snapshot at the beginning of this tick.
    //    (This snapshot shows what’s scheduled at time = currentTime.)
    timeline.push({
      time: currentTime,
      cpus: cpus.map((cpu, idx) => ({
        cpuIndex: idx,
        processID: cpu.process ? cpu.process.id : null,
      })),
      queue: timelineQueueBefore,
    });

    // 5) Execute one time unit on each busy CPU.
    for (const cpu of cpus) {
      if (cpu.process) {
        cpu.process.remainingTime--;
        cpu.timeSlice--;

        // If the process finishes during this tick:
        if (cpu.process.remainingTime <= 0) {
          cpu.process.endTime = currentTime + 1;
          completedProcesses++;
          cpu.process = null;
          cpu.timeSlice = 0;
        }
        // If the quantum expires (and process is not finished), preempt it.
        else if (cpu.timeSlice <= 0) {
          returnedQueue.push(cpu.process);
          cpu.process = null;
          cpu.timeSlice = 0;
        }
      }
    }

    currentTime++;
  }

  // 7) Record a final snapshot at currentTime (all CPUs idle, empty queue).
  timeline.push({
    time: currentTime,
    cpus: cpus.map((cpu, idx) => ({ cpuIndex: idx, processID: null })),
    queue: [],
  });

  return {
    processes,
    totalTime: currentTime,
    timeline,
  };
}
