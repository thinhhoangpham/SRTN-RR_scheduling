import React from 'react';

function buildCpuIntervals(timeline, numCpus, quantum) {
  if (quantum < 1) quantum = 1;

  const intervals = Array.from({ length: numCpus }, () => []);
  const current = Array.from({ length: numCpus }, () => ({ processID: null, start: 0 }));

  // Build initial intervals
  for (let i = 0; i < timeline.length; i++) {
    const snap = timeline[i];
    const time = snap.time;

    snap.cpus.forEach(cpuInfo => {
      const { cpuIndex, processID } = cpuInfo;
      const oldPID = current[cpuIndex].processID;
      const oldStart = current[cpuIndex].start;
      if (processID !== oldPID) {
        if (oldPID !== null) {
          intervals[cpuIndex].push({ processID: oldPID, start: oldStart, end: time });
        }
        current[cpuIndex] = { processID, start: time };
      }
    });
  }

  // Final interval after last snapshot
  const lastSnapshot = timeline[timeline.length - 1];
  const finalTime = lastSnapshot ? lastSnapshot.time + 1 : 0;

  for (let cpuIndex = 0; cpuIndex < numCpus; cpuIndex++) {
    const { processID, start } = current[cpuIndex];
    if (processID !== null) {
      intervals[cpuIndex].push({ processID, start, end: finalTime });
    }
  }

  // Split intervals by quantum
  const splitIntervals = intervals.map(cpuIntervals => {
    const result = [];
    for (const { processID, start, end } of cpuIntervals) {
      let currStart = start;
      while (currStart + quantum < end) {
        result.push({ processID, start: currStart, end: currStart + quantum });
        currStart += quantum;
      }
      if (currStart < end) {
        result.push({ processID, start: currStart, end: end });
      }
    }
    return result;
  });

  return splitIntervals;
}


export default function GanttChartLikeImage({ timeline, numCpus, quantum}) {
  if (!timeline || timeline.length === 0) return null;

  const intervals = buildCpuIntervals(timeline, numCpus, quantum);
  // The final time coordinate is timeline's last snapshot time + 1
  const finalTime = timeline[timeline.length - 1].time + 1;
  const scale = 40; // 1 time unit = 40px

  // A small helper to pick a color for each process ID (just for variety).
  const colors = ['#ffcc80','#80d8ff','#ffd180','#b9f6ca','#ffcdd2','#d1c4e9'];
  function colorForProcess(pid) {
    // pick from array based on pid, or default
    if (!pid) return '#e0e0e0';
    return colors[(pid - 1) % colors.length];
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ marginBottom: '10px' }}>Timeline (Visual, Like the Example)</h3>

      {/* Container with enough width for finalTime units */}
      <div style={{ position: 'relative', border: '1px solid #ccc', padding: '10px' }}>
        
        {/* 1) CPU Tracks */}
        {intervals.map((cpuIntervals, cpuIndex) => (
          <div key={cpuIndex} style={{ position: 'relative', height: '30px', marginBottom: '10px' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: '60px', fontWeight: 'bold' }}>
              CPU {cpuIndex}
            </div>
            {/* Bars for each interval */}
            <div style={{ marginLeft: '60px', position: 'relative', height: '100%' }}>
              {cpuIntervals.map((iv, idx) => {
                const leftPx = iv.start * scale;
                const widthPx = (iv.end - iv.start) * scale;
                return (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: leftPx,
                      top: 0,
                      width: widthPx,
                      height: '100%',
                      backgroundColor: colorForProcess(iv.processID),
                      border: '1px solid #555',
                      boxSizing: 'border-box',
                      textAlign: 'center',
                      lineHeight: '30px',
                      color: '#333',
                      fontWeight: 'bold',
                    }}
                  >
                    P{iv.processID}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 2) Queue Row */}
        <div style={{ position: 'relative', height: '40px', marginBottom: '10px' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: '60px', fontWeight: 'bold' }}>
            Queue
          </div>
          <div style={{ marginLeft: '60px', position: 'relative', height: '100%' }}>
            {timeline.map((snap, idx) => {
              const leftPx = snap.time * scale;
              return (
                <div
                  key={snap.time}
                  style={{
                    position: 'absolute',
                    left: leftPx,
                    top: 0,
                    width: scale,
                    height: '100%',
                    boxSizing: 'border-box',
                    borderRight: '1px dashed #aaa',
                    padding: '2px',
                    fontSize: '12px',
                    color: '#555',
                  }}
                >
                  {snap.queue.length === 0 ? (
                    <span style={{ color: "#888",}}>[]</span>
                    ) : (
                    snap.queue.map((item, index) => (
                        <React.Fragment key={item.id}>
                        {`P${item.id}: ${item.remainingTime}`}
                        {index !== snap.queue.length - 1 && <br />}
                        </React.Fragment>
                    ))
                    )}

                </div>
              );
            })}
          </div>
        </div>

        {/* 3) Time Axis */}
        <div style={{ marginLeft: '60px', position: 'relative', height: '20px', borderTop: '1px solid #999' }}>
          {[...Array(finalTime).keys()].map(t => {
            const leftPx = t * scale;
            return (
              <div
                key={t}
                style={{
                  position: 'absolute',
                  left: leftPx,
                  top: 0,
                  width: '1px',
                  height: '20px',
                  backgroundColor: '#999',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '-10px',
                    width: '20px',
                    textAlign: 'center',
                    fontSize: '12px',
                  }}
                >
                  {t}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}