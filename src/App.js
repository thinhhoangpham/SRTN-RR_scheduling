import React, { useState } from 'react';
import './App.css';
import { simulateSRTN } from './simulateSRTN';
import { simulateRR } from './simulateRR';  // New import for RR simulation
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
  const [quantum, setQuantum] = useState('');
  const [processes, setProcesses] = useState([]);
  const [timeline, setTimeline] = useState([]); // Timeline state

  // When the dropdown value changes, update the fields and processes.
  const handleExampleChange = (e) => {
    const value = e.target.value;
    setSelectedExample(value);
    if (value === "example1") {
      // Example 1: 2 CPUs, 4 jobs, quantum = 1
      setNumCpus("2");
      setQuantum("1");
      setNumProcesses("4");
      const ex1 = [
        new Process(1, 0, 5),   // P1: arrival 0, burst 5
        new Process(2, 1, 10),  // P2: arrival 1, burst 10
        new Process(3, 2, 4),   // P3: arrival 2, burst 4
        new Process(4, 4, 8),   // P4: arrival 2, burst 8
      ];
      setProcesses(ex1);
    } else if (value === "example2") {
      // Example 2: same processes, quantum = 2
      setNumCpus("2");
      setQuantum("2");
      setNumProcesses("4");
      const ex2 = [
        new Process(1, 0, 5),
        new Process(2, 1, 10),
        new Process(3, 2, 4),
        new Process(4, 4, 8),
      ];
      setProcesses(ex2);
    } else {
      // Custom: allow manual entry.
      setNumCpus('');
      setQuantum('');
      setNumProcesses('');
      setProcesses([]);
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

  const generateProcessesHandler = () => {
    const procCount = parseInt(numProcesses, 10);
    const cpuCount = parseInt(numCpus, 10);
    if (isNaN(procCount) || procCount <= 0 || isNaN(cpuCount) || cpuCount <= 0) {
      alert('Enter valid numbers for processes and CPUs.');
      return;
    }
    const procs = createProcesses(procCount);
    setProcesses(procs);
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

  // Existing SRTN simulation handler
  const runSimulationHandler = () => {
    const cpuCount = parseInt(numCpus, 10);
    const q = parseInt(quantum, 10);
    if (isNaN(cpuCount) || isNaN(q) || cpuCount <= 0 || q <= 0) {
      alert('Enter valid CPU count and quantum time.');
      return;
    }
    const cloned = processes.map(p => ({ ...p }));
    const result = simulateSRTN(cloned, cpuCount, q);
    setProcesses(result.processes);
    setTimeline(result.timeline); // Store timeline from simulation
    alert(`SRTN Simulation finished in ${result.totalTime} seconds.`);
  };

  // New RR simulation handler button
  const runRRSimulationHandler = () => {
    const cpuCount = parseInt(numCpus, 10);
    const q = parseInt(quantum, 10);
    if (isNaN(cpuCount) || isNaN(q) || cpuCount <= 0 || q <= 0) {
      alert('Enter valid CPU count and quantum time.');
      return;
    }
    const cloned = processes.map(p => ({ ...p }));
    const result = simulateRR(cloned, cpuCount, q);
    setProcesses(result.processes);
    setTimeline(result.timeline);
    alert(`RR Simulation finished in ${result.totalTime} seconds.`);
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
            </select>
          </div>
        </div>

        {/* Input fields for custom mode */}
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
              <label className="label">Quantum Time:</label>
              <input type="number" value={quantum} onChange={handleQuantumChange} className="input" />
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
              <button onClick={runSimulationHandler} className="button run-button">Run SRTN Simulation</button>
              <button onClick={runRRSimulationHandler} className="button run-button">Run RR Simulation</button>
            </div>

            {/* Visual Timeline Chart */}
            {timeline.length > 0 && (
              <GanttChartLikeImage timeline={timeline} numCpus={parseInt(numCpus, 10)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
