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
    // this queue holds processes return from cpus
    const returnedQueue = [];
    
    // Timeline snapshots: each snapshot records CPU states and the ready queue
    const timeline = [];
    
    while (completedProcesses < totalProcesses) {
      // 1) Add newly arrived processes to the globalQueue.
      // Only add processes that have just arrived (arrivalTime === currentTime),
      // are not finished, and are not already in the queue or running.
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
      // add processes that have been returned from cpus
      returnedQueue.forEach(p => {
        if (
          p.remainingTime > 0 &&
          !globalQueue.some(qp => qp.id === p.id) &&
          !cpus.some(cpu => cpu.process && cpu.process.id === p.id)
        ) {
          globalQueue.push(p);
        }
      });
        // Clear the returnedQueue for the next tick
        returnedQueue.length = 0;
      
      // Record the current queue snapshot for the timeline.
      const timelineQueue = globalQueue.map(p => ({ id: p.id, remainingTime: p.remainingTime }));
      
      // 2) Assign idle CPUs from the globalQueue (FIFO order).
      for (const cpu of cpus) {
        if (!cpu.process && globalQueue.length > 0) {
          cpu.process = globalQueue.shift();
          cpu.timeSlice = Math.min(cpu.process.remainingTime, quantum);
          if (cpu.process.startTime === null) {
            cpu.process.startTime = currentTime;
          }
        }
      }
      
      // 3) If no CPU is busy and the globalQueue is empty, record snapshot and advance time.
      if (!cpus.some(cpu => cpu.process) && globalQueue.length === 0) {
        timeline.push({
          time: currentTime,
          cpus: cpus.map((cpu, idx) => ({ cpuIndex: idx, processID: null })),
          queue: timelineQueue,
        });
        currentTime++;
        continue;
      }
      
      // 4) Record a timeline snapshot at the beginning of this time unit.
      timeline.push({
        time: currentTime,
        cpus: cpus.map((cpu, idx) => ({
          cpuIndex: idx,
          processID: cpu.process ? cpu.process.id : null,
        })),
        queue: timelineQueue,
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
          // If the quantum expires (and the process is not finished), preempt it.
          else if (cpu.timeSlice <= 0) {
            // Append the process to the tail of the globalQueue (after processes already waiting)
            returnedQueue.push(cpu.process);
            cpu.process = null;
            cpu.timeSlice = 0;
          }
        }
      }
      
      currentTime++;
    }
    
    // Record a final timeline snapshot at the final time stamp with an empty queue.
    timeline.push({
      time: currentTime,
      cpus: cpus.map((cpu, idx) => ({ cpuIndex: idx, processID: null })),
      queue: []
    });
    
    return {
      processes,
      totalTime: currentTime,
      timeline,
    };
  }
  