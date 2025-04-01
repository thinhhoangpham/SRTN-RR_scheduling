import React from 'react';

// Simple color generator for jobs.
const getColor = (jobId) => {
  const colors = ["#ff6666", "#66ff66", "#6666ff", "#ffcc66", "#66ffcc", "#cc66ff", "#ff66cc"];
  return colors[(jobId - 1) % colors.length];
};

const TimelineChart = ({ jobs, cpus, height = 400, timeScale = 100, margin = 50 }) => {
  // Determine the height for each CPU row.
  const cpuHeight = height / cpus.length;

  // Flatten the timeline events from each job.
  // Each event includes: jobId, cpuId, start (absolute), and end (absolute).
  const events = [];
  jobs.forEach(job => {
    if (job.timeline && job.timeline.length > 0) {
      job.timeline.forEach(segment => {
        events.push({
          jobId: job.id,
          cpuId: segment.cpuId,
          start: segment.startTime, // absolute start time
          end: segment.endTime,     // absolute end time
        });
      });
    }
  });

  // Compute final time (maximum end among all events)
  const maxTime = events.length > 0 ? Math.max(...events.map(e => e.end)) : 0;
  // Set width based on final time and scale plus some margin.
  const width = maxTime * timeScale + margin;

  return (
    <svg width={width} height={height + margin} style={{ border: "1px solid #ccc" }}>
      {/* Draw CPU rows */}
      {cpus.map((cpu, index) => (
        <line
          key={cpu.id}
          x1={margin}
          y1={index * cpuHeight + cpuHeight / 2}
          x2={width}
          y2={index * cpuHeight + cpuHeight / 2}
          stroke="#ddd"
        />
      ))}

      {/* Draw events as colored rectangles */}
      {events.map((event, index) => {
        // Calculate x position based on timeScale (pixels per time unit).
        const x = margin + event.start * timeScale;
        const rectWidth = (event.end - event.start) * timeScale;
        // The y position is based on the CPU row.
        const y = (event.cpuId - 1) * cpuHeight;
        return (
          <rect
            key={index}
            x={x}
            y={y + 5}
            width={rectWidth}
            height={cpuHeight - 10}
            fill={getColor(event.jobId)}
            stroke="#000"
          >
            <title>{`Job ${event.jobId} on CPU ${event.cpuId}: ${event.start} - ${event.end}`}</title>
          </rect>
        );
      })}

      {/* Draw x-axis line */}
      <line
        x1={margin}
        y1={height + 10}
        x2={width}
        y2={height + 10}
        stroke="#000"
      />

      {/* Draw x-axis labels using final time */}
      {Array.from({ length: Math.ceil(maxTime) + 1 }, (_, i) => (
        <text key={i} x={margin + i * timeScale} y={height + 30} fontSize="10" fill="#000">
          {i}
        </text>
      ))}
    </svg>
  );
};

export default TimelineChart;