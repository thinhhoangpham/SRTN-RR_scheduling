import React, { useState } from 'react';
import './App.css';
import { simulateSRTN } from './simulateSRTN';
import { simulateRR } from './simulateRR';
import GanttChartLikeImage from './GanttChartLikeImage';

class Process {
  constructor(id, arrivalTime, burstTime) {
    this.id = id;
    this.arrivalTime = arrivalTime;
    this.burstTime = burstTime;
    this.startTime = null;
    this.endTime = null;
    this.remainingTime = burstTime;
  }
}

function createProcesses(numProcesses) {
  const processes = [];
  for (let i = 1; i <= numProcesses; i++) {
    processes.push(new Process(i, 0, 10));
  }
  return processes;
}

function App() {
  const [selectedExample, setSelectedExample] = useState("custom");
  const [numProcesses, setNumProcesses] = useState('');
  const [numCpus, setNumCpus] = useState('');
  const [quantum, setQuantum] = useState('1'); // default value
  const [useCustomQuantum, setUseCustomQuantum] = useState(false);
  const [processes, setProcesses] = useState([]);
  const [initialProcesses, setInitialProcesses] = useState([]); // to restore later
  const [timeline, setTimeline] = useState([]); // Timeline state

  // When the dropdown value changes, update the fields and processes.
  const handleExampleChange = (e) => {
    const value = e.target.value;
    setSelectedExample(value);
    if (value === "example1") {
      // Example 1: 2 CPUs, 4 jobs, quantum = 1
      setNumCpus("2");
      setUseCustomQuantum(false); // disable custom quantum: force quantum = 1
      setQuantum("1");
      setNumProcesses("4");
      const ex1 = [
        new Process(1, 0, 5),   // P1: arrival 0, burst 5
        new Process(2, 1, 10),  // P2: arrival 1, burst 10
        new Process(3, 2, 4),   // P3: arrival 2, burst 4
        new Process(4, 2, 8),   // P4: arrival 2, burst 8
      ];
      setProcesses(ex1);
      setInitialProcesses(ex1);
    } else if (value === "example2") {
      // Example 2: same processes, quantum = 2
      setNumCpus("2");
      setUseCustomQuantum(true); // allow custom quantum input
      setQuantum("2");
      setNumProcesses("4");
      const ex2 = [
        new Process(1, 0, 5),
        new Process(2, 1, 10),
        new Process(3, 2, 4),
        new Process(4, 2, 8),
      ];
      setProcesses(ex2);
      setInitialProcesses(ex2);
    } else if (value === "example3") {
      // Example 3: 3 CPUs, 7 processes, quantum = 2
      setNumCpus("3");
      setUseCustomQuantum(true); // allow custom quantum input
      setQuantum("2");
      setNumProcesses("7");
      const ex3 = [
        new Process(1, 0, 4),  // Process 1: arrival at 0, burst time 4
        new Process(2, 1, 6),  // Process 2: arrival at 1, burst time 6
        new Process(3, 2, 5),  // Process 3: arrival at 2, burst time 5
        new Process(4, 3, 7),  // Process 4: arrival at 3, burst time 7
        new Process(5, 4, 3),  // Process 5: arrival at 4, burst time 3
        new Process(6, 5, 8),  // Process 6: arrival at 5, burst time 8
        new Process(7, 6, 4),  // Process 7: arrival at 6, burst time 4
      ];
      setProcesses(ex3);
      setInitialProcesses(ex3);
    } else {
      // Custom: allow manual entry.
      setNumCpus('');
      setQuantum("1");
      setUseCustomQuantum(false);
      setNumProcesses('');
      setProcesses([]);
      setInitialProcesses([]);
    }
  };

  const handleProcessChange = (e) => {
    setNumProcesses(e.target.value);
  };

  const handleCpuChange = (e) => {
    setNumCpus(e.target.value);
  };

  const handleQuantumChange = (e) => {
    setQuantum(e.target.value);
  };

  const toggleQuantumCheckbox = (e) => {
    setUseCustomQuantum(e.target.checked);
    if (!e.target.checked) {
      // If unchecked, force quantum to 1.
      setQuantum("1");
    }
  };

  const generateProcessesHandler = () => {
    const procCount = parseInt(numProcesses, 10);
    const cpuCount = parseInt(numCpus, 10);
    if (isNaN(procCount) || procCount <= 0 || isNaN(cpuCount) || cpuCount <= 0) {
      alert('Enter valid numbers for processes and CPUs.');
      return;
    }
    const procs = createProcesses(procCount);
    setProcesses(procs);
    setInitialProcesses(procs);
  };

  const handleProcessFieldChange = (id, field, value) => {
    setProcesses(prev =>
      prev.map(proc =>
        proc.id === id ? {
          ...proc,
          [field]: parseInt(value, 10) || 0,
          remainingTime:
            field === 'burstTime' && proc.startTime === null
              ? parseInt(value, 10) || 0
              : proc.remainingTime
        } : proc
      )
    );
  };

  // Use effectiveQuantum: if not using custom quantum, force quantum to 1.
  const effectiveQuantum = useCustomQuantum ? parseInt(quantum, 10) || 1 : 1;

  // SRTN simulation handler
  const runSimulationHandler = () => {
    const cpuCount = parseInt(numCpus, 10);
    if (isNaN(cpuCount) || cpuCount <= 0) {
      alert('Enter a valid CPU count.');
      return;
    }
    const cloned = processes.map(p => ({ ...p }));
    const result = simulateSRTN(cloned, cpuCount, effectiveQuantum);
    setProcesses(result.processes);
    setTimeline(result.timeline);
    alert(`SRTN Simulation finished in ${result.totalTime} seconds.`);
  };

  // RR simulation handler
  const runRRSimulationHandler = () => {
    const cpuCount = parseInt(numCpus, 10);
    if (isNaN(cpuCount) || cpuCount <= 0) {
      alert('Enter a valid CPU count.');
      return;
    }
    const cloned = processes.map(p => ({ ...p }));
    const result = simulateRR(cloned, cpuCount, effectiveQuantum);
    setProcesses(result.processes);
    setTimeline(result.timeline);
    alert(`RR Simulation finished in ${result.totalTime} seconds.`);
  };

  // Reset simulation to initial state
  const resetSimulation = () => {
    setTimeline([]);
    setProcesses(initialProcesses);
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="header">SRTN & RR Simulation</h2>

        {/* Example Dropdown */}
        <div className="input-container">
          <div className="input-group">
            <label className="label">Choose Example:</label>
            <select value={selectedExample} onChange={handleExampleChange} className="dropdown">
              <option value="custom">Custom</option>
              <option value="example1">Example 1 (2 CPUs, 4 Jobs, Quantum = 1)</option>
              <option value="example2">Example 2 (2 CPUs, 4 Jobs, Quantum = 2)</option>
              <option value="example3">Example 3 (3 CPUs, 7 Jobs, Quantum = 2)</option>
            </select>
          </div>
        </div>

        {/* Custom Input Fields */}
        {selectedExample === "custom" && (
          <div className="input-container">
            <div className="input-group">
              <label className="label">Number of Processes:</label>
              <input type="number" value={numProcesses} onChange={handleProcessChange} className="input" />
            </div>
            <div className="input-group">
              <label className="label">Number of CPUs:</label>
              <input type="number" value={numCpus} onChange={handleCpuChange} className="input" />
            </div>
            <div className="input-group">
              <label className="label">Use Custom Quantum?</label>
              <input type="checkbox" checked={useCustomQuantum} onChange={toggleQuantumCheckbox} />
            </div>
            <div className="input-group">
              <label className="label">Quantum Time:</label>
              <input 
                type="number" 
                value={quantum} 
                onChange={handleQuantumChange} 
                className="input" 
                disabled={!useCustomQuantum}
                step="1"
              />
              {!useCustomQuantum && <span className="note"> (Default = 1)</span>}
            </div>
            <button onClick={generateProcessesHandler} className="button">Generate Processes</button>
          </div>
        )}

        {processes.length > 0 && (
          <div>
            <h3 className="subheader">Processes Table</h3>
            <table className="process-table">
              <thead>
                <tr>
                  <th>Process ID</th>
                  <th>Arrival Time</th>
                  <th>Burst Time</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                </tr>
              </thead>
              <tbody>
                {processes.map(proc => (
                  <tr key={proc.id}>
                    <td>{proc.id}</td>
                    <td>
                      <input type="number" value={proc.arrivalTime} onChange={(e) => handleProcessFieldChange(proc.id, 'arrivalTime', e.target.value)} className="table-input" />
                    </td>
                    <td>
                      <input type="number" value={proc.burstTime} onChange={(e) => handleProcessFieldChange(proc.id, 'burstTime', e.target.value)} className="table-input" />
                    </td>
                    <td>{proc.startTime !== null ? proc.startTime : '-'}</td>
                    <td>{proc.endTime !== null ? proc.endTime : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="button-group">
              <button 
                onClick={runSimulationHandler} 
                className="button run-button" 
                style={{ marginRight: '10px' }}
              >
                Run SRTN Simulation
              </button>
              <button 
                onClick={runRRSimulationHandler} 
                className="button run-button" 
                style={{ marginRight: '10px' }}
              >
                Run RR Simulation
              </button>
              <button 
                onClick={resetSimulation} 
                className="button reset-button"
              >
                Reset Simulation
              </button>
            </div>

            {/* Visual Timeline Chart */}
            {timeline.length > 0 && (
              <GanttChartLikeImage timeline={timeline} numCpus={parseInt(numCpus, 10)} quantum={effectiveQuantum} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
