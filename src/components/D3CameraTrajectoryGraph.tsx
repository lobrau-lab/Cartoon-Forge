import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CameraKeyframe } from '../types';
import { 
  Compass, 
  Activity, 
  Move, 
  Crosshair, 
  Sliders, 
  Tv, 
  Eye, 
  Sparkles,
  Info
} from 'lucide-react';

interface D3CameraTrajectoryGraphProps {
  keyframes: CameraKeyframe[];
  selectedKeyframeId: string | null;
  onSelectKeyframe: (id: string) => void;
  onUpdateKeyframe: (id: string, updates: Partial<CameraKeyframe>) => void;
  simTimePct: number;
}

export const D3CameraTrajectoryGraph: React.FC<D3CameraTrajectoryGraphProps> = ({
  keyframes,
  selectedKeyframeId,
  onSelectKeyframe,
  onUpdateKeyframe,
  simTimePct
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });

  // Handle resizing dynamically to support fluid layouts
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        // Maintain a widescreen aspect ratio
        const height = Math.max(280, Math.floor(width * 0.55));
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Sorted list of keyframes
  const sortedKeyframes = [...keyframes].sort((a, b) => a.timePct - b.timePct);

  // Trajectory interpolation for generating path lines
  const getInterpolatedValue = (timePct: number, channel: 'pan' | 'tilt' | 'dolly'): number => {
    if (sortedKeyframes.length === 0) return 0;
    if (sortedKeyframes.length === 1) return sortedKeyframes[0][channel];

    // Bounding keyframes search
    let left = sortedKeyframes[0];
    let right = sortedKeyframes[sortedKeyframes.length - 1];

    if (timePct <= left.timePct) return left[channel];
    if (timePct >= right.timePct) return right[channel];

    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
      if (timePct >= sortedKeyframes[i].timePct && timePct <= sortedKeyframes[i+1].timePct) {
        left = sortedKeyframes[i];
        right = sortedKeyframes[i+1];
        break;
      }
    }

    const segmentDuration = right.timePct - left.timePct;
    if (segmentDuration === 0) return left[channel];
    const t = (timePct - left.timePct) / segmentDuration;

    const p0 = left[channel];
    const p3 = right[channel];
    
    // Smooth cubic bezier calculation
    const cp1 = p0 + (p3 - p0) * left.easeOut.y;
    const cp2 = p0 + (p3 - p0) * right.easeIn.y;

    const oneMinusT = 1 - t;
    return (
      Math.pow(oneMinusT, 3) * p0 + 
      3 * Math.pow(oneMinusT, 2) * t * cp1 + 
      3 * oneMinusT * Math.pow(t, 2) * cp2 + 
      Math.pow(t, 3) * p3
    );
  };

  // Main D3 Drawing Engine
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const { width, height } = dimensions;
    const margin = { top: 30, right: 40, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous elements
    d3.select(svgElement).selectAll('*').remove();

    const svg = d3.select(svgElement)
      .attr('width', width)
      .attr('height', height);

    // Create a clipping path to prevent anything from flowing outside the grid bounds
    svg.append('defs')
      .append('clipPath')
      .attr('id', 'chart-clip')
      .append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight);

    // Main graph group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Define interactive scales
    // X scale is camera Pan Angle: -90 to +90 degrees
    const xScale = d3.scaleLinear()
      .domain([-90, 90])
      .range([0, chartWidth]);

    // Y scale is camera Tilt Angle: -45 to +45 degrees (flipped so higher positive values look UP)
    const yScale = d3.scaleLinear()
      .domain([-45, 45])
      .range([chartHeight, 0]);

    // Node size scale represents camera Dolly zoom: 0 to 10 meters maps to 5px to 20px radius
    const dollyScale = d3.scaleLinear()
      .domain([0, 10])
      .range([5, 18]);

    // Draw grid lines
    const xTicks = xScale.ticks(10);
    const yTicks = yScale.ticks(6);

    // Vertical grid
    g.selectAll('.v-grid')
      .data(xTicks)
      .enter()
      .append('line')
      .attr('class', 'v-grid')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,4');

    // Horizontal grid
    g.selectAll('.h-grid')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'h-grid')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,4');

    // Center crosshair lines
    g.append('line')
      .attr('x1', xScale(0))
      .attr('x2', xScale(0))
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,5');

    g.append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,5');

    // Draw beautiful styled axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => `${d}°`);
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d => `${d}°`);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .style('color', '#475569')
      .style('font-family', 'monospace')
      .style('font-size', '8px');

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .style('color', '#475569')
      .style('font-family', 'monospace')
      .style('font-size', '8px');

    // Generate 120 trajectory path samples from 0% to 100% time
    const samplePoints: { pan: number; tilt: number; dolly: number; timePct: number }[] = [];
    for (let t = 0; t <= 100; t += 0.8) {
      samplePoints.push({
        pan: getInterpolatedValue(t, 'pan'),
        tilt: getInterpolatedValue(t, 'tilt'),
        dolly: getInterpolatedValue(t, 'dolly'),
        timePct: t
      });
    }

    // Line generator for trajectory curve
    const lineGenerator = d3.line<{ pan: number; tilt: number }>()
      .x(d => xScale(d.pan))
      .y(d => yScale(d.tilt))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Glow filter definitions
    const defs = svg.select('defs');
    const glowFilter = defs.append('filter')
      .attr('id', 'trajectory-glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');
    glowFilter.append('feMerge')
      .selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .enter()
      .append('feMergeNode')
      .attr('in', d => d);

    // Glowing trajectory gradient path
    const trajectoryPathGroup = g.append('g')
      .attr('clip-path', 'url(#chart-clip)');

    trajectoryPathGroup.append('path')
      .datum(samplePoints)
      .attr('fill', 'none')
      .attr('stroke', 'url(#trajectory-grad)')
      .attr('stroke-width', '4')
      .attr('d', lineGenerator)
      .style('filter', 'url(#trajectory-glow)')
      .attr('opacity', 0.85);

    // Define linear gradient for trajectory
    const grad = defs.append('linearGradient')
      .attr('id', 'trajectory-grad')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', chartWidth)
      .attr('y2', chartHeight);

    grad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981'); // Emerald
    grad.append('stop').attr('offset', '50%').attr('stop-color', '#8b5cf6'); // Violet
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#ec4899'); // Rose

    // Render connecting direction vectors (arrows)
    const arrowMarker = defs.append('marker')
      .attr('id', 'trajectory-arrow')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', '6')
      .attr('refY', '5')
      .attr('markerWidth', '5')
      .attr('markerHeight', '5')
      .attr('orient', 'auto-start-reverse');

    arrowMarker.append('path')
      .attr('d', 'M 0 1 L 10 5 L 0 9 z')
      .attr('fill', '#64748b');

    // Add dashed sequence lines between raw keyframes to show time flow
    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
      const kf1 = sortedKeyframes[i];
      const kf2 = sortedKeyframes[i+1];
      trajectoryPathGroup.append('line')
        .attr('x1', xScale(kf1.pan))
        .attr('y1', yScale(kf1.tilt))
        .attr('x2', xScale(kf2.pan))
        .attr('y2', yScale(kf2.tilt))
        .attr('stroke', '#475569')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,4')
        .attr('marker-end', 'url(#trajectory-arrow)');
    }

    // Drag-and-drop mechanics using D3
    const dragBehavior = d3.drag<SVGGElement, CameraKeyframe>()
      .on('start', function (event, d) {
        d3.select(this).raise();
        onSelectKeyframe(d.id);
      })
      .on('drag', function (event, d) {
        // Invert X/Y pixels to actual degrees
        const containerX = event.x;
        const containerY = event.y;

        const newPan = Math.max(-90, Math.min(90, xScale.invert(containerX)));
        const newTilt = Math.max(-45, Math.min(45, yScale.invert(containerY)));

        onUpdateKeyframe(d.id, {
          pan: Math.round(newPan * 10) / 10,
          tilt: Math.round(newTilt * 10) / 10
        });
      });

    // Render node groups (Outer circle, inner core, labels)
    const nodesGroup = g.append('g')
      .attr('clip-path', 'url(#chart-clip)')
      .selectAll('.keyframe-node')
      .data(sortedKeyframes)
      .enter()
      .append('g')
      .attr('class', 'keyframe-node')
      .attr('transform', d => `translate(${xScale(d.pan)}, ${yScale(d.tilt)})`)
      .style('cursor', 'move')
      .call(dragBehavior as any);

    // Glow ring for selected node
    nodesGroup.append('circle')
      .attr('r', d => dollyScale(d.dolly) + 7)
      .attr('fill', 'none')
      .attr('stroke', d => d.id === selectedKeyframeId ? '#f59e0b' : 'transparent')
      .attr('stroke-width', 2.5)
      .attr('class', 'selected-glow')
      .style('stroke-dasharray', d => d.id === selectedKeyframeId ? '3,3' : 'none');

    // Outer circle
    nodesGroup.append('circle')
      .attr('r', d => dollyScale(d.dolly) + 2)
      .attr('fill', '#0f172a')
      .attr('stroke', d => d.id === selectedKeyframeId ? '#f59e0b' : '#38bdf8')
      .attr('stroke-width', 2);

    // Inner glowing core representation
    nodesGroup.append('circle')
      .attr('r', d => Math.max(3, dollyScale(d.dolly) - 3))
      .attr('fill', d => {
        if (d.id === selectedKeyframeId) return '#f59e0b';
        return d.timePct === 0 ? '#10b981' : d.timePct === 100 ? '#ec4899' : '#8b5cf6';
      });

    // Keyframe identifier labels (Time % and ID number)
    nodesGroup.append('text')
      .attr('y', d => -(dollyScale(d.dolly) + 11))
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.id === selectedKeyframeId ? '#f59e0b' : '#94a3b8')
      .style('font-family', 'monospace')
      .style('font-weight', 'bold')
      .style('font-size', '9px')
      .text(d => `${d.timePct}%`);

    // Coordinate telemetry text below node
    nodesGroup.append('text')
      .attr('y', d => dollyScale(d.dolly) + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#475569')
      .style('font-family', 'monospace')
      .style('font-size', '8px')
      .text(d => `[P:${d.pan.toFixed(0)}°,T:${d.tilt.toFixed(0)}°]`);

    // Draw active real-time simulation playhead tracking node
    const currentSimPan = getInterpolatedValue(simTimePct, 'pan');
    const currentSimTilt = getInterpolatedValue(simTimePct, 'tilt');
    const currentSimDolly = getInterpolatedValue(simTimePct, 'dolly');

    const playheadGroup = g.append('g')
      .attr('clip-path', 'url(#chart-clip)')
      .attr('transform', `translate(${xScale(currentSimPan)}, ${yScale(currentSimTilt)})`);

    // Pulsing outward wave
    playheadGroup.append('circle')
      .attr('r', dollyScale(currentSimDolly) + 14)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6)
      .attr('class', 'animate-pulse');

    // Solid tracking core
    playheadGroup.append('circle')
      .attr('r', 7)
      .attr('fill', '#ef4444')
      .attr('stroke', '#fca5a5')
      .attr('stroke-width', 2);

    playheadGroup.append('text')
      .attr('x', 11)
      .attr('y', 3)
      .attr('fill', '#ef4444')
      .style('font-family', 'monospace')
      .style('font-weight', 'extrabold')
      .style('font-size', '8px')
      .text('PLAYHEAD');

  }, [sortedKeyframes, selectedKeyframeId, simTimePct, dimensions]);

  // Safe selected keyframe stats fallback
  const activeKf = keyframes.find(k => k.id === selectedKeyframeId) || sortedKeyframes[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-200">
              D3 Spatial Trajectory Plane
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">
              Maps Pan Angle (X) vs. Tilt Angle (Y) • Node Radius = Dolly Distance
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1.5">
          <span className="text-[8px] font-mono font-extrabold bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>REAL-TIME FEED</span>
          </span>
        </div>
      </div>

      {/* Main Interactive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Graph Element */}
        <div ref={containerRef} className="lg:col-span-3 bg-slate-950 border border-slate-850 rounded-xl relative overflow-hidden flex items-center justify-center">
          <svg 
            ref={svgRef}
            className="w-full h-auto select-none"
          />
          {/* Legend Overlay */}
          <div className="absolute bottom-2 left-2 pointer-events-none flex items-center space-x-3 bg-slate-950/90 border border-slate-850 rounded-md px-2.5 py-1 text-[8px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Start (0%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" /> Mid
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> End (100%)
            </span>
          </div>
        </div>

        {/* Dynamic Node Telemetry Panel */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex flex-col justify-between space-y-3 font-mono">
          <div className="space-y-2">
            <div className="flex items-center space-x-1 border-b border-slate-900 pb-1.5 text-[9px] uppercase tracking-wider text-amber-500 font-bold">
              <Crosshair className="w-3 h-3" />
              <span>Interactive Telemetry</span>
            </div>

            {activeKf ? (
              <div className="space-y-2 text-[10px] leading-relaxed">
                <div className="flex justify-between border-b border-slate-900/50 pb-1">
                  <span className="text-slate-500">Node Ref:</span>
                  <span className="text-slate-300 font-bold">{activeKf.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/50 pb-1">
                  <span className="text-slate-500">Timeline Pt:</span>
                  <span className="text-amber-400 font-extrabold">{activeKf.timePct}%</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/50 pb-1">
                  <span className="text-slate-500">Pan Angle:</span>
                  <span className="text-emerald-400 font-extrabold">{activeKf.pan.toFixed(1)}°</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/50 pb-1">
                  <span className="text-slate-500">Tilt Angle:</span>
                  <span className="text-amber-500 font-extrabold">{activeKf.tilt.toFixed(1)}°</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/50 pb-1">
                  <span className="text-slate-500">Dolly Depth:</span>
                  <span className="text-violet-400 font-extrabold">{activeKf.dolly.toFixed(1)}m</span>
                </div>
              </div>
            ) : (
              <p className="text-[9px] text-slate-500 italic">No node selected</p>
            )}
          </div>

          {/* Interactive Guides & Tips */}
          <div className="p-2 bg-slate-900/50 border border-slate-850/80 rounded-lg text-[8px] leading-relaxed text-slate-400 space-y-1">
            <div className="flex items-center space-x-1 text-[9px] text-slate-300 font-semibold mb-1">
              <Info className="w-3 h-3 text-slate-400" />
              <span>Interactive HUD Tips</span>
            </div>
            <p>• Drag circles in the graph to change <strong className="text-emerald-400">Pan</strong> & <strong className="text-amber-500">Tilt</strong>.</p>
            <p>• Radial size responds to the <strong className="text-violet-400">Dolly</strong> depth slider.</p>
            <p>• Clicking a circle focuses all fine-tuning controls.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
