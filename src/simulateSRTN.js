export function simulateSRTN(processes, numCpus, quantum) {
  let currentTime = 0;
  let completedProcesses = 0;
  const totalProcesses = processes.length;

  // Each CPU holds { process, timeSlice }
  const cpus = Array.from({ length: numCpus }, () => ({
    process: null,
    timeSlice: 0,
  }));

  // Timeline snapshots: each snapshot records the CPU states and the ready queue (with process id and remainingTime)
  const timeline = [];

  while (completedProcesses < totalProcesses) {
    // 1) Build the ready queue:
    // Only include processes that have arrived, are not finished, and are not already running.
    const runningIDs = cpus.filter(cpu => cpu.process !== null).map(cpu => cpu.process.id);
    let readyQueue = processes.filter(
      p => p.arrivalTime <= currentTime &&
           p.remainingTime > 0 &&
           !runningIDs.includes(p.id)
    );
    // Sort the ready queue by shortest remaining time (for idle assignment)
    readyQueue.sort((a, b) => a.remainingTime - b.remainingTime);
    const timelineQueue = readyQueue.map(p => ({ id: p.id, remainingTime: p.remainingTime }));

    // 2) (NO immediate preemption step here)
    // If a job is running and its quantum has not expired, do not preempt it even if a shorter job is waiting.

    // 3) Assign idle CPUs from the ready queue:
    for (const cpu of cpus) {
      if (!cpu.process) {
        if (readyQueue.length > 0) {
          cpu.process = readyQueue.shift();
          cpu.timeSlice = Math.min(cpu.process.remainingTime, quantum);
          if (cpu.process.startTime === null) {
            cpu.process.startTime = currentTime;
          }
        }
      }
    }

    // 4) If no CPU is busy and the ready queue is empty, advance time.
    const anyBusy = cpus.some(cpu => cpu.process !== null);
    if (!anyBusy && readyQueue.length === 0) {
      currentTime++;
      continue;
    }

    // 5) Record a timeline snapshot at the beginning of this time unit.
    timeline.push({
      time: currentTime,
      cpus: cpus.map((cpu, idx) => ({
        cpuIndex: idx,
        processID: cpu.process ? cpu.process.id : null,
      })),
      queue: timelineQueue,
    });

    // 6) Execute one time unit on each busy CPU.
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
          readyQueue.push(cpu.process);
          cpu.process = null;
          cpu.timeSlice = 0;
        }
      }
    }

    currentTime++;
  }
  // Record a final timeline snapshot at the final time stamp with an empty queue and idle CPUs.
  timeline.push({
    time: currentTime,
    cpus: cpus.map((cpu, idx) => ({
      cpuIndex: idx,
      processID: null,
    })),
    queue: []
  });

  return {
    processes,
    totalTime: currentTime,
    timeline,
  };
}