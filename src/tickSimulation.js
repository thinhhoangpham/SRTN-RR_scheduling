// tickSimulation.js
// This function simulates one CPU tick (1 second)
// It accepts the current list of processes, the current global time, and the number of CPUs.
// It returns an object with the updated processes array and the new global time.
export function simulateTick(processes, currentTime, numCpus) {
    // Create a new copy of the processes to avoid mutating state directly.
    const newProcs = processes.map(proc => ({ ...proc }));
    
    // Get processes that have arrived and still have remaining time.
    const ready = newProcs.filter(
      proc => proc.arrivalTime <= currentTime && proc.remainingTime > 0
    );
    
    // Determine how many processes can run concurrently (limited by number of CPUs).
    const availableCpus = Math.min(ready.length, numCpus);
    
    // Run up to 'availableCpus' processes for 1 second.
    for (let i = 0; i < availableCpus; i++) {
      const proc = ready[i];
      // Record the start time if this is the first tick for the process.
      if (proc.startTime === null) {
        proc.startTime = currentTime;
      }
      // Simulate 1 second of CPU time.
      proc.remainingTime -= 1;
      // If the process finishes during this tick, record its end time.
      if (proc.remainingTime <= 0) {
        proc.endTime = currentTime + 1;
      }
    }
    
    // Advance global time by 1 second.
    const newTime = currentTime + 1;
    return { newProcesses: newProcs, newTime };
  }