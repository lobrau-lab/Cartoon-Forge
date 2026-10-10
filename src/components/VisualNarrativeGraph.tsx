import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { ScriptScene, EpisodeProject } from '../types';
import { 
  GitCommit, 
  Clock, 
  Activity, 
  Sparkles, 
  Film, 
  Play, 
  Pause, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  Sliders, 
  Layers, 
  Zap, 
  Maximize2,
  Info,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Plus,
  Minus,
  Shuffle
} from 'lucide-react';

interface VisualNarrativeGraphProps {
  project: EpisodeProject;
  onUpdateProject: (updated: Partial<EpisodeProject>) => void;
  onNavigateToScriptScene?: (sceneNumber: number) => void;
}

export interface EnrichedSceneNode {
  sceneNumber: number;
  heading: string;
  location: string;
  timeOfDay: string;
  action: string;
  timingEstMin: number;
  startTimeMin: number;
  endTimeMin: number;
  midTimeMin: number;
  transition: string;
  plotPoint: string;
  tensionScore: number;
  characters: string[];
  dialogueCount: number;
  color: string;
  act: 'Act I' | 'Act II' | 'Act III';
}

interface TransitionLinkData {
  id: string;
  fromSceneNumber: number;
  toSceneNumber: number;
  fromMid: number;
  fromTension: number;
  toMid: number;
  toTension: number;
  transition: string;
}

const PLOT_POINT_PRESETS = [
  { id: 'hook', label: 'Opening Hook', icon: '🎯', defaultTension: 60, act: 'Act I' },
  { id: 'inciting', label: 'Inciting Incident', icon: '⚡', defaultTension: 75, act: 'Act I' },
  { id: 'pp1', label: 'Plot Point 1 (Point of No Return)', icon: '🚪', defaultTension: 80, act: 'Act I' },
  { id: 'rising', label: 'Rising Action & Trials', icon: '📈', defaultTension: 65, act: 'Act II' },
  { id: 'midpoint', label: 'Midpoint Shift & Reversal', icon: '🔮', defaultTension: 85, act: 'Act II' },
  { id: 'crisis', label: 'Crisis / Dark Night', icon: '🌑', defaultTension: 70, act: 'Act II' },
  { id: 'climax', label: 'Climax / Sakuga Clashes', icon: '⚔️', defaultTension: 98, act: 'Act III' },
  { id: 'resolution', label: 'Resolution & Aftermath', icon: '🏁', defaultTension: 40, act: 'Act III' }
];

const TRANSITION_COLORS: Record<string, string> = {
  'Cut': '#06b6d4',       // Cyan
  'Fade In': '#10b981',   // Emerald
  'Dissolve': '#a855f7',  // Purple
  'Fade Out': '#f43f5e',  // Rose
  'Wipe': '#f59e0b'       // Amber
};

export const VisualNarrativeGraph: React.FC<VisualNarrativeGraphProps> = ({
  project,
  onUpdateProject,
  onNavigateToScriptScene
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [dimensions, setDimensions] = useState({ width: 950, height: 440 });
  const [selectedSceneNum, setSelectedSceneNum] = useState<number>(project.scenes[0]?.sceneNumber || 1);
  const [hoveredSceneNum, setHoveredSceneNum] = useState<number | null>(null);

  // Visualization Feature Toggles
  const [showTensionCurve, setShowTensionCurve] = useState(true);
  const [showTransitionBadges, setShowTransitionBadges] = useState(true);
  const [showActBands, setShowActBands] = useState(true);
  const [showCumulativeFill, setShowCumulativeFill] = useState(true);

  // Interactive Playhead Scrubber State
  const [scrubberTimeMin, setScrubberTimeMin] = useState<number>(0);
  const [isPlayingScrubber, setIsPlayingScrubber] = useState<boolean>(false);

  // Animation status indicator
  const [isInterpolating, setIsInterpolating] = useState<boolean>(false);

  // Responsive ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setDimensions({
        width: Math.max(width, 700),
        height: 440
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute enriched timeline and plot point nodes from current script
  const enrichedScenes: EnrichedSceneNode[] = useMemo(() => {
    let currentStart = 0;
    const totalScenes = project.scenes.length || 1;
    const targetMin = project.targetDurationMin || 24;

    return project.scenes.map((sc, idx) => {
      const duration = sc.timingEstMin || 2.0;
      const startTime = currentStart;
      const endTime = currentStart + duration;
      const midTime = startTime + duration / 2;
      currentStart = endTime;

      const progressRatio = midTime / Math.max(targetMin, currentStart);

      // Determine default plot point if not set
      let assignedPlot = sc.plotPoint || '';
      let act: 'Act I' | 'Act II' | 'Act III' = 'Act I';

      if (progressRatio < 0.25) {
        act = 'Act I';
        if (!assignedPlot) assignedPlot = idx === 0 ? 'Opening Hook' : 'Inciting Incident';
      } else if (progressRatio < 0.75) {
        act = 'Act II';
        if (!assignedPlot) assignedPlot = progressRatio < 0.5 ? 'Rising Action & Trials' : 'Midpoint Shift & Reversal';
      } else {
        act = 'Act III';
        if (!assignedPlot) assignedPlot = idx === totalScenes - 1 ? 'Resolution & Aftermath' : 'Climax / Sakuga Clashes';
      }

      // Check keyword hints in heading or action
      const combinedText = (sc.heading + ' ' + sc.action).toLowerCase();
      if (combinedText.includes('climax') || combinedText.includes('final battle')) {
        assignedPlot = 'Climax / Sakuga Clashes';
        act = 'Act III';
      } else if (combinedText.includes('breach') || combinedText.includes('alarm')) {
        assignedPlot = 'Inciting Incident';
      }

      // Determine tension score
      let tension = 50;
      const matchedPreset = PLOT_POINT_PRESETS.find(p => p.label.toLowerCase() === assignedPlot.toLowerCase());
      if (matchedPreset) {
        tension = matchedPreset.defaultTension;
      } else if (act === 'Act III') {
        tension = 90;
      } else if (act === 'Act II') {
        tension = 75;
      }

      // Dialogue emotion adjustments
      if (sc.dialogue && sc.dialogue.some(d => /urgent|fierce|battle|rage|panic|desperate/i.test(d.emotion || ''))) {
        tension = Math.min(100, tension + 10);
      }

      const characters = Array.from(new Set(sc.dialogue?.map(d => d.character) || []));

      // Color mapping by Act
      let color = '#06b6d4'; // Act I Cyan
      if (act === 'Act II') color = '#a855f7'; // Act II Purple
      if (act === 'Act III') color = '#f43f5e'; // Act III Rose
      if (assignedPlot.includes('Climax')) color = '#ef4444'; // Red flare for Climax

      return {
        sceneNumber: sc.sceneNumber,
        heading: sc.heading,
        location: sc.location,
        timeOfDay: sc.timeOfDay,
        action: sc.action,
        timingEstMin: duration,
        startTimeMin: startTime,
        endTimeMin: endTime,
        midTimeMin: midTime,
        transition: sc.transition || 'Cut',
        plotPoint: assignedPlot,
        tensionScore: tension,
        characters,
        dialogueCount: sc.dialogue?.length || 0,
        color,
        act
      };
    });
  }, [project.scenes, project.targetDurationMin]);

  const totalCalculatedDuration = useMemo(() => {
    return enrichedScenes.length > 0 
      ? enrichedScenes[enrichedScenes.length - 1].endTimeMin 
      : 0;
  }, [enrichedScenes]);

  const targetDuration = project.targetDurationMin || 24;
  const maxTimeDomain = Math.max(targetDuration, totalCalculatedDuration, 12);

  // Playhead scrubber animation loop
  useEffect(() => {
    let animFrame: number;
    if (isPlayingScrubber) {
      const step = () => {
        setScrubberTimeMin((prev) => {
          const next = prev + 0.08;
          if (next >= maxTimeDomain) {
            setIsPlayingScrubber(false);
            return 0;
          }
          return next;
        });
        animFrame = requestAnimationFrame(step);
      };
      animFrame = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(animFrame);
  }, [isPlayingScrubber, maxTimeDomain]);

  // Keep selectedSceneNum in sync
  const activeScene = useMemo(() => {
    return project.scenes.find(s => s.sceneNumber === selectedSceneNum) || project.scenes[0];
  }, [project.scenes, selectedSceneNum]);

  const activeEnriched = useMemo(() => {
    return enrichedScenes.find(s => s.sceneNumber === selectedSceneNum) || enrichedScenes[0];
  }, [enrichedScenes, selectedSceneNum]);

  // Persistent SVG Layer Initialization (runs once on mount)
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    // If already initialized, don't recreate defs or root groups
    if (!svg.select('defs').empty()) return;

    const defs = svg.append('defs');

    // Tension Area Gradient
    const tensionGradient = defs.append('linearGradient')
      .attr('id', 'tension-area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');
    tensionGradient.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.25);
    tensionGradient.append('stop').attr('offset', '50%').attr('stop-color', '#a855f7').attr('stop-opacity', 0.35);
    tensionGradient.append('stop').attr('offset', '85%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.5);
    tensionGradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.2);

    // Tension Stroke Gradient
    const tensionStrokeGradient = defs.append('linearGradient')
      .attr('id', 'tension-stroke-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '0%');
    tensionStrokeGradient.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4');
    tensionStrokeGradient.append('stop').attr('offset', '50%').attr('stop-color', '#a855f7');
    tensionStrokeGradient.append('stop').attr('offset', '85%').attr('stop-color', '#ef4444');
    tensionStrokeGradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981');

    // Glow Filter
    const filter = defs.append('filter')
      .attr('id', 'neon-glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Root Container Group
    const rootG = svg.append('g').attr('class', 'root-container');

    // Child Layers in strict Z-Order
    rootG.append('g').attr('class', 'act-bands-layer');
    rootG.append('g').attr('class', 'grid-layer');
    
    // Target Line Layer
    const targetG = rootG.append('g').attr('class', 'target-rule-layer');
    targetG.append('line').attr('class', 'target-line');
    targetG.append('text').attr('class', 'target-label');

    // Timeline ribbon & axis
    rootG.append('g').attr('class', 'timeline-track-layer');

    // Tension Curve Layer (area & line)
    const tensionG = rootG.append('g').attr('class', 'tension-curve-layer');
    tensionG.append('path').attr('class', 'tension-area');
    tensionG.append('path').attr('class', 'tension-stroke');

    // Transitions Layer (links & badges)
    rootG.append('g').attr('class', 'transition-links-layer');
    rootG.append('g').attr('class', 'transition-badges-layer');

    // Scene Nodes Layer
    rootG.append('g').attr('class', 'scene-nodes-layer');

    // Playhead Scrubber Layer (top-most interactive)
    rootG.append('g').attr('class', 'scrubber-layer');

  }, []);

  // Main D3 Rendering Engine with d3-transition interpolation
  useEffect(() => {
    if (!svgRef.current || enrichedScenes.length === 0) return;
    const svg = d3.select(svgRef.current);

    const margin = { top: 45, right: 70, bottom: 65, left: 60 };
    const width = dimensions.width;
    const height = dimensions.height;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const rootG = svg.select<SVGGElement>('g.root-container')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // D3 Scales
    const xScale = d3.scaleLinear()
      .domain([0, maxTimeDomain])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 105])
      .range([innerHeight, 0]);

    // D3 Transition instance with smooth cubic interpolation
    const t = svg.transition().duration(750).ease(d3.easeCubicInOut);
    setIsInterpolating(true);
    const timer = setTimeout(() => setIsInterpolating(false), 760);

    // 1. ACT DEMARCATION BANDS
    const actBandsLayer = rootG.select<SVGGElement>('g.act-bands-layer');
    if (showActBands) {
      const act1End = maxTimeDomain * 0.25;
      const act2End = maxTimeDomain * 0.75;
      const actBandsData = [
        { id: 'act-1', label: 'ACT I: EXPOSITION & CATALYST', start: 0, end: act1End, color: 'rgba(6, 182, 212, 0.04)', borderColor: 'rgba(6, 182, 212, 0.15)' },
        { id: 'act-2', label: 'ACT II: RISING TENSION & MIDPOINT', start: act1End, end: act2End, color: 'rgba(168, 85, 247, 0.04)', borderColor: 'rgba(168, 85, 247, 0.15)' },
        { id: 'act-3', label: 'ACT III: CLIMAX & RESOLUTION', start: act2End, end: maxTimeDomain, color: 'rgba(244, 63, 94, 0.04)', borderColor: 'rgba(244, 63, 94, 0.15)' }
      ];

      const bandGroups = actBandsLayer.selectAll<SVGGElement, typeof actBandsData[0]>('g.act-band-group')
        .data(actBandsData, d => d.id);

      bandGroups.exit().remove();

      const bandEnter = bandGroups.enter().append('g').attr('class', 'act-band-group');
      bandEnter.append('rect').attr('class', 'band-rect').attr('y', 0).attr('height', innerHeight);
      bandEnter.append('line').attr('class', 'band-line').attr('y1', 0).attr('y2', innerHeight);
      bandEnter.append('text').attr('class', 'band-label').attr('y', 14);

      const bandMerge = bandEnter.merge(bandGroups);

      bandMerge.select('rect.band-rect')
        .attr('fill', d => d.color)
        .transition(t)
        .attr('x', d => xScale(d.start))
        .attr('width', d => Math.max(0, xScale(d.end) - xScale(d.start)));

      bandMerge.select('line.band-line')
        .attr('stroke', d => d.borderColor)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .transition(t)
        .attr('x1', d => xScale(d.end))
        .attr('x2', d => xScale(d.end));

      bandMerge.select('text.band-label')
        .attr('fill', '#64748b')
        .attr('font-size', '9px')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('font-weight', '700')
        .attr('letter-spacing', '0.05em')
        .text(d => d.label)
        .transition(t)
        .attr('x', d => xScale(d.start) + 10);
    } else {
      actBandsLayer.selectAll('*').remove();
    }

    // 2. GRID LINES & LABELS
    const gridLayer = rootG.select<SVGGElement>('g.grid-layer');
    const yTicks = [25, 50, 75, 100];
    const gridLines = gridLayer.selectAll<SVGGElement, number>('g.grid-row')
      .data(yTicks, d => d);

    gridLines.exit().remove();

    const gridEnter = gridLines.enter().append('g').attr('class', 'grid-row');
    gridEnter.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '2,4');
    gridEnter.append('text')
      .attr('x', -10)
      .attr('text-anchor', 'end')
      .attr('fill', '#475569')
      .attr('font-size', '9px')
      .attr('font-family', 'ui-monospace, monospace')
      .text(d => `${d}%`);

    const gridMerge = gridEnter.merge(gridLines);
    gridMerge.select('line')
      .attr('x2', innerWidth)
      .transition(t)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d));

    gridMerge.select('text')
      .transition(t)
      .attr('y', d => yScale(d) + 3);

    // 3. TARGET DURATION VERTICAL LINE
    const targetG = rootG.select<SVGGElement>('g.target-rule-layer');
    const targetX = xScale(targetDuration);

    targetG.select('line.target-line')
      .attr('y1', 0)
      .attr('y2', innerHeight + 15)
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,3')
      .attr('filter', 'url(#neon-glow)')
      .transition(t)
      .attr('x1', targetX)
      .attr('x2', targetX);

    targetG.select('text.target-label')
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#06b6d4')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-weight', 'bold')
      .text(`TARGET: ${targetDuration.toFixed(1)}m`)
      .transition(t)
      .attr('x', targetX);

    // 4. TIMELINE TRACK & DURATION RIBBONS
    const trackLayer = rootG.select<SVGGElement>('g.timeline-track-layer')
      .attr('transform', `translate(0, ${innerHeight})`);

    // Baseline
    if (trackLayer.select('line.track-base').empty()) {
      trackLayer.append('line').attr('class', 'track-base');
    }
    trackLayer.select('line.track-base')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#334155')
      .attr('stroke-width', 2);

    // Duration Ribbon Blocks
    const ribbonSelection = trackLayer.selectAll<SVGGElement, EnrichedSceneNode>('g.ribbon-block')
      .data(enrichedScenes, d => `ribbon-${d.sceneNumber}`);

    ribbonSelection.exit()
      .transition(t)
      .style('opacity', 0)
      .remove();

    const ribbonEnter = ribbonSelection.enter().append('g')
      .attr('class', 'ribbon-block')
      .style('cursor', 'pointer')
      .style('opacity', 0);

    ribbonEnter.append('rect').attr('class', 'ribbon-rect').attr('y', 4).attr('height', 14).attr('rx', 3);
    ribbonEnter.append('text').attr('class', 'ribbon-text').attr('y', 14).style('pointer-events', 'none');

    const ribbonMerge = ribbonEnter.merge(ribbonSelection);

    ribbonMerge
      .on('click', (_, d) => setSelectedSceneNum(d.sceneNumber))
      .on('mouseenter', (_, d) => setHoveredSceneNum(d.sceneNumber))
      .on('mouseleave', () => setHoveredSceneNum(null));

    ribbonMerge.select('rect.ribbon-rect')
      .transition(t)
      .attr('x', d => xScale(d.startTimeMin))
      .attr('width', d => Math.max(xScale(d.endTimeMin) - xScale(d.startTimeMin) - 1, 2))
      .attr('fill', d => d.sceneNumber === selectedSceneNum ? '#06b6d4' : d.sceneNumber === hoveredSceneNum ? '#38bdf8' : d.color)
      .attr('opacity', d => d.sceneNumber === selectedSceneNum ? 0.95 : 0.45);

    ribbonMerge.select('text.ribbon-text')
      .attr('text-anchor', 'middle')
      .attr('fill', '#f8fafc')
      .attr('font-size', '8px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('font-weight', 'bold')
      .text(d => `S#${d.sceneNumber} (${d.timingEstMin.toFixed(1)}m)`)
      .transition(t)
      .attr('x', d => (xScale(d.startTimeMin) + xScale(d.endTimeMin)) / 2)
      .style('opacity', d => (xScale(d.endTimeMin) - xScale(d.startTimeMin) > 34 ? 1 : 0));

    ribbonMerge.transition(t).style('opacity', 1);

    // Time ticks at bottom
    const timeStep = maxTimeDomain <= 15 ? 2.5 : 5;
    const ticksData: number[] = [];
    for (let cur = 0; cur <= maxTimeDomain; cur += timeStep) {
      ticksData.push(cur);
    }

    const tickGroups = trackLayer.selectAll<SVGGElement, number>('g.time-tick')
      .data(ticksData, d => d);

    tickGroups.exit().remove();

    const tickEnter = tickGroups.enter().append('g').attr('class', 'time-tick');
    tickEnter.append('line').attr('y1', 22).attr('y2', 28).attr('stroke', '#475569');
    tickEnter.append('text').attr('y', 40).attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'ui-monospace, monospace');

    const tickMerge = tickEnter.merge(tickGroups);
    tickMerge.select('line')
      .transition(t)
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d));

    tickMerge.select('text')
      .text(d => {
        const m = Math.floor(d);
        const s = Math.round((d - m) * 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      })
      .transition(t)
      .attr('x', d => xScale(d));

    // 5. DRAMATIC TENSION LINE & AREA CURVE (Smooth Interpolation)
    const tensionG = rootG.select<SVGGElement>('g.tension-curve-layer');
    if (showTensionCurve && enrichedScenes.length > 0) {
      const tensionPoints: [number, number][] = enrichedScenes.map(sc => [
        xScale(sc.midTimeMin),
        yScale(sc.tensionScore)
      ]);

      const startPoint: [number, number] = [xScale(0), yScale(Math.max(30, enrichedScenes[0].tensionScore - 15))];
      const lastScene = enrichedScenes[enrichedScenes.length - 1];
      const endPoint: [number, number] = [xScale(lastScene.endTimeMin), yScale(lastScene.tensionScore)];
      const fullCurvePoints: [number, number][] = [startPoint, ...tensionPoints, endPoint];

      const lineGenerator = d3.line<[number, number]>()
        .curve(d3.curveMonotoneX)
        .x(d => d[0])
        .y(d => d[1]);

      const areaGenerator = d3.area<[number, number]>()
        .curve(d3.curveMonotoneX)
        .x(d => d[0])
        .y0(innerHeight)
        .y1(d => d[1]);

      tensionG.select('path.tension-area')
        .datum(fullCurvePoints)
        .attr('fill', 'url(#tension-area-gradient)')
        .transition(t)
        .style('opacity', showCumulativeFill ? 1 : 0)
        .attr('d', areaGenerator);

      tensionG.select('path.tension-stroke')
        .datum(fullCurvePoints)
        .attr('fill', 'none')
        .attr('stroke', 'url(#tension-stroke-gradient)')
        .attr('stroke-width', 3)
        .attr('filter', 'url(#neon-glow)')
        .transition(t)
        .style('opacity', 1)
        .attr('d', lineGenerator);
    } else {
      tensionG.select('path.tension-area').transition(t).style('opacity', 0);
      tensionG.select('path.tension-stroke').transition(t).style('opacity', 0);
    }

    // 6. SCENE TRANSITION CONNECTORS (Animated Links & Badges)
    const transitionLinksData: TransitionLinkData[] = [];
    for (let i = 0; i < enrichedScenes.length - 1; i++) {
      const curr = enrichedScenes[i];
      const next = enrichedScenes[i + 1];
      transitionLinksData.push({
        id: `trans-${curr.sceneNumber}->${next.sceneNumber}`,
        fromSceneNumber: curr.sceneNumber,
        toSceneNumber: next.sceneNumber,
        fromMid: curr.midTimeMin,
        fromTension: curr.tensionScore,
        toMid: next.midTimeMin,
        toTension: next.tensionScore,
        transition: next.transition || 'Cut'
      });
    }

    // Connectors Layer
    const linksLayer = rootG.select<SVGGElement>('g.transition-links-layer');
    const linkSelection = linksLayer.selectAll<SVGLineElement, TransitionLinkData>('line.trans-line')
      .data(transitionLinksData, d => d.id);

    linkSelection.exit()
      .transition(t)
      .style('opacity', 0)
      .remove();

    const linkEnter = linkSelection.enter().append('line')
      .attr('class', 'trans-line')
      .attr('x1', d => xScale(d.fromMid))
      .attr('y1', d => yScale(d.fromTension))
      .attr('x2', d => xScale(d.toMid))
      .attr('y2', d => yScale(d.toTension))
      .style('opacity', 0);

    const linkMerge = linkEnter.merge(linkSelection);
    linkMerge
      .attr('stroke', d => TRANSITION_COLORS[d.transition] || '#06b6d4')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', d => {
        if (d.transition === 'Dissolve') return '5,4';
        if (d.transition === 'Fade In' || d.transition === 'Fade Out') return '2,3';
        return 'none';
      })
      .transition(t)
      .style('opacity', 0.65)
      .attr('x1', d => xScale(d.fromMid))
      .attr('y1', d => yScale(d.fromTension))
      .attr('x2', d => xScale(d.toMid))
      .attr('y2', d => yScale(d.toTension));

    // Badges Layer
    const badgesLayer = rootG.select<SVGGElement>('g.transition-badges-layer');
    const badgeSelection = badgesLayer.selectAll<SVGGElement, TransitionLinkData>('g.trans-badge')
      .data(showTransitionBadges ? transitionLinksData : [], d => d.id);

    badgeSelection.exit()
      .transition(t)
      .style('opacity', 0)
      .remove();

    const badgeEnter = badgeSelection.enter().append('g')
      .attr('class', 'trans-badge')
      .style('cursor', 'pointer')
      .style('opacity', 0)
      .attr('transform', d => {
        const mx = (xScale(d.fromMid) + xScale(d.toMid)) / 2;
        const my = (yScale(d.fromTension) + yScale(d.toTension)) / 2 - 14;
        return `translate(${mx}, ${my})`;
      });

    badgeEnter.append('rect').attr('class', 'badge-bg');
    badgeEnter.append('text').attr('class', 'badge-text');

    const badgeMerge = badgeEnter.merge(badgeSelection);

    badgeMerge.on('click', (_, d) => {
      // Cycle transition type on click
      const transCycle: Record<string, string> = {
        'Cut': 'Fade In',
        'Fade In': 'Dissolve',
        'Dissolve': 'Fade Out',
        'Fade Out': 'Wipe',
        'Wipe': 'Cut'
      };
      const updatedScenes = [...project.scenes];
      const targetIdx = project.scenes.findIndex(s => s.sceneNumber === d.toSceneNumber);
      if (targetIdx !== -1) {
        updatedScenes[targetIdx] = {
          ...updatedScenes[targetIdx],
          transition: transCycle[d.transition] || 'Cut'
        };
        onUpdateProject({ scenes: updatedScenes });
      }
    });

    badgeMerge
      .transition(t)
      .style('opacity', 1)
      .attr('transform', d => {
        const mx = (xScale(d.fromMid) + xScale(d.toMid)) / 2;
        const my = (yScale(d.fromTension) + yScale(d.toTension)) / 2 - 14;
        return `translate(${mx}, ${my})`;
      });

    badgeMerge.each(function(d) {
      const bG = d3.select(this);
      const color = TRANSITION_COLORS[d.transition] || '#06b6d4';

      bG.select('rect.badge-bg')
        .attr('x', -26)
        .attr('y', -8)
        .attr('width', 52)
        .attr('height', 16)
        .attr('rx', 8)
        .attr('fill', '#090e1d')
        .attr('stroke', color)
        .attr('stroke-width', 1.2);

      bG.select('text.badge-text')
        .attr('dy', 3)
        .attr('text-anchor', 'middle')
        .attr('fill', color)
        .attr('font-size', '8px')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('font-weight', 'bold')
        .text(d.transition.toUpperCase());
    });

    // 7. SCENE PLOT POINT NODES WITH D3-TRANSITION INTERPOLATION
    const nodesLayer = rootG.select<SVGGElement>('g.scene-nodes-layer');
    const nodeSelection = nodesLayer.selectAll<SVGGElement, EnrichedSceneNode>('g.scene-node')
      .data(enrichedScenes, d => `scene-${d.sceneNumber}`);

    // EXIT: smooth fade & shrink exit
    nodeSelection.exit()
      .transition(t)
      .style('opacity', 0)
      .attr('transform', function(this: SVGGElement) {
        const cur = d3.select(this).attr('transform');
        return `${cur} scale(0.2)`;
      })
      .remove();

    // ENTER: create node groups with circles, icons, and floating labels
    const nodeEnter = nodeSelection.enter().append('g')
      .attr('class', 'scene-node')
      .style('cursor', 'pointer')
      .style('opacity', 0)
      .attr('transform', d => `translate(${xScale(d.midTimeMin)}, ${yScale(d.tensionScore)})`);

    // Selection Halo
    nodeEnter.append('circle').attr('class', 'halo-circle');

    // Main Node Circle
    nodeEnter.append('circle').attr('class', 'main-circle');

    // Icon Emoji
    nodeEnter.append('text').attr('class', 'icon-text');

    // Floating Pill Group
    const pillG = nodeEnter.append('g').attr('class', 'pill-group').attr('transform', 'translate(0, -24)');
    pillG.append('rect').attr('class', 'pill-bg');
    pillG.append('text').attr('class', 'pill-label');

    // MERGE: Interpolate old positions to new positions smoothly
    const nodeMerge = nodeEnter.merge(nodeSelection);

    nodeMerge
      .on('click', (_, d) => setSelectedSceneNum(d.sceneNumber))
      .on('mouseenter', (_, d) => setHoveredSceneNum(d.sceneNumber))
      .on('mouseleave', () => setHoveredSceneNum(null));

    // KEY INTERPOLATION TRANSITION!
    nodeMerge
      .transition(t)
      .style('opacity', 1)
      .attr('transform', d => `translate(${xScale(d.midTimeMin)}, ${yScale(d.tensionScore)})`);

    // Render node styling & child elements
    nodeMerge.each(function(d) {
      const nG = d3.select(this);
      const isSelected = d.sceneNumber === selectedSceneNum;
      const isHovered = d.sceneNumber === hoveredSceneNum;

      // Halo
      nG.select('circle.halo-circle')
        .transition(t)
        .attr('r', isSelected ? 22 : 18)
        .attr('fill', 'none')
        .attr('stroke', d.color)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', isSelected ? '4,3' : 'none')
        .attr('filter', 'url(#neon-glow)')
        .style('opacity', isSelected || isHovered ? 1 : 0);

      // Main Circle
      nG.select('circle.main-circle')
        .transition(t)
        .attr('r', 13)
        .attr('fill', '#0b1329')
        .attr('stroke', d.color)
        .attr('stroke-width', isSelected ? 3 : 2);

      // Icon Text
      nG.select('text.icon-text')
        .attr('dy', 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .text(
          d.plotPoint.includes('Climax') ? '⚔️' :
          d.plotPoint.includes('Inciting') ? '⚡' :
          d.plotPoint.includes('Midpoint') ? '🔮' :
          d.plotPoint.includes('Resolution') ? '🏁' : '🎬'
        );

      // Pill Label
      const labelText = `S#${d.sceneNumber}: ${d.plotPoint}`;
      const approxWidth = Math.min(Math.max(labelText.length * 6 + 14, 60), 160);

      nG.select('g.pill-group rect.pill-bg')
        .transition(t)
        .attr('x', -approxWidth / 2)
        .attr('y', -9)
        .attr('width', approxWidth)
        .attr('height', 18)
        .attr('rx', 9)
        .attr('fill', isSelected ? '#1e293b' : '#0b1329')
        .attr('stroke', isSelected ? '#38bdf8' : '#334155')
        .attr('stroke-width', isSelected ? 1.5 : 1);

      nG.select('g.pill-group text.pill-label')
        .attr('dy', 3.5)
        .attr('text-anchor', 'middle')
        .attr('fill', isSelected ? '#f8fafc' : '#cbd5e1')
        .attr('font-size', '9px')
        .attr('font-family', 'ui-sans-serif, system-ui, sans-serif')
        .attr('font-weight', isSelected ? 'bold' : '600')
        .text(labelText.length > 24 ? labelText.substring(0, 22) + '...' : labelText);
    });

    // 8. PLAYHEAD SCRUBBER
    const scrubberLayer = rootG.select<SVGGElement>('g.scrubber-layer');
    if (scrubberTimeMin > 0) {
      const scrubberX = xScale(scrubberTimeMin);
      let scrubG = scrubberLayer.select<SVGGElement>('g.scrub-indicator');

      if (scrubG.empty()) {
        scrubG = scrubberLayer.append('g').attr('class', 'scrub-indicator');
        scrubG.append('line').attr('class', 'scrub-line');
        scrubG.append('polygon').attr('class', 'scrub-pointer');
        scrubG.append('rect').attr('class', 'scrub-badge-bg');
        scrubG.append('text').attr('class', 'scrub-badge-text');
      }

      scrubG.attr('transform', `translate(${scrubberX}, 0)`);

      scrubG.select('line.scrub-line')
        .attr('x1', 0).attr('y1', -15)
        .attr('x2', 0).attr('y2', innerHeight + 25)
        .attr('stroke', '#e11d48')
        .attr('stroke-width', 2)
        .attr('filter', 'url(#neon-glow)');

      scrubG.select('polygon.scrub-pointer')
        .attr('points', '-6,-15 6,-15 0,-6')
        .attr('fill', '#e11d48');

      const m = Math.floor(scrubberTimeMin);
      const s = Math.round((scrubberTimeMin - m) * 60);
      const stamp = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

      scrubG.select('rect.scrub-badge-bg')
        .attr('x', -24).attr('y', -32)
        .attr('width', 48).attr('height', 16)
        .attr('rx', 4)
        .attr('fill', '#e11d48');

      scrubG.select('text.scrub-badge-text')
        .attr('x', 0).attr('y', -21)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '9px')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('font-weight', 'bold')
        .text(stamp);
    } else {
      scrubberLayer.selectAll('*').remove();
    }

    // Click/Drag on SVG to scrub time
    svg.on('click', (event) => {
      const [mx] = d3.pointer(event, rootG.node());
      if (mx >= 0 && mx <= innerWidth) {
        const time = xScale.invert(mx);
        setScrubberTimeMin(Math.max(0, Math.min(time, maxTimeDomain)));
      }
    });

    return () => clearTimeout(timer);

  }, [
    dimensions,
    enrichedScenes,
    maxTimeDomain,
    targetDuration,
    selectedSceneNum,
    hoveredSceneNum,
    showTensionCurve,
    showTransitionBadges,
    showActBands,
    showCumulativeFill,
    scrubberTimeMin
  ]);

  // Handle changing plot point preset
  const handleUpdatePlotPoint = (newPlotPoint: string) => {
    if (!activeScene) return;
    const updatedScenes = project.scenes.map(s => {
      if (s.sceneNumber === activeScene.sceneNumber) {
        return { ...s, plotPoint: newPlotPoint };
      }
      return s;
    });
    onUpdateProject({ scenes: updatedScenes });
  };

  // Handle changing transition type
  const handleUpdateTransition = (newTransition: string) => {
    if (!activeScene) return;
    const updatedScenes = project.scenes.map(s => {
      if (s.sceneNumber === activeScene.sceneNumber) {
        return { ...s, transition: newTransition };
      }
      return s;
    });
    onUpdateProject({ scenes: updatedScenes });
  };

  // Adjust duration by delta (+/- min) with immediate d3-transition interpolation
  const handleAdjustDuration = (delta: number) => {
    if (!activeScene) return;
    const currentDur = activeScene.timingEstMin || 2.0;
    const newDur = Math.max(0.5, Math.round((currentDur + delta) * 10) / 10);
    const updatedScenes = project.scenes.map(s => {
      if (s.sceneNumber === activeScene.sceneNumber) {
        return { ...s, timingEstMin: newDur };
      }
      return s;
    });
    onUpdateProject({ scenes: updatedScenes });
  };

  const handleSetExactDuration = (exactMin: number) => {
    if (!activeScene) return;
    const updatedScenes = project.scenes.map(s => {
      if (s.sceneNumber === activeScene.sceneNumber) {
        return { ...s, timingEstMin: exactMin };
      }
      return s;
    });
    onUpdateProject({ scenes: updatedScenes });
  };

  // Quick Pacing Shift Simulator (demonstrates d3-transition interpolation on all scenes)
  const handleSimulatePacingShift = () => {
    const isCurrentlyExtended = project.scenes.some(s => (s.timingEstMin || 2.0) > 4.5);
    const updatedScenes = project.scenes.map((s, idx) => {
      // Toggle between compressed sakuga rapid-cut and dramatic extended dialogue pacing
      if (isCurrentlyExtended) {
        // Compress to fast pacing
        return { ...s, timingEstMin: idx === 0 ? 2.0 : idx === 1 ? 3.0 : 4.0 };
      } else {
        // Extend to epic cinematic pacing
        return { ...s, timingEstMin: idx === 0 ? 4.5 : idx === 1 ? 7.0 : 8.5 };
      }
    });
    onUpdateProject({ scenes: updatedScenes });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950 to-cyan-950 text-cyan-400 border border-cyan-800/80 shadow-md relative">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            {isInterpolating && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>D3.js Animated Narrative Engine</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase">
                {enrichedScenes.length} Scenes Mapped
              </span>
              {isInterpolating && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 uppercase animate-pulse">
                  d3-transition interpolating
                </span>
              )}
            </div>
            <h3 className="text-lg font-extrabold text-slate-100 mt-0.5">
              Visual Narrative Graph: Episode Duration & Scene Transitions
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Smoothly interpolates scene coordinates, tension splines, and transition choreography as script timings evolve
            </p>
          </div>
        </div>

        {/* Action Controls & Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Test D3 Interpolation Animation */}
          <button
            onClick={handleSimulatePacingShift}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700/80 hover:bg-cyan-900 transition shadow-sm group"
            title="Toggle between fast-cut and cinematic pacing to demonstrate smooth d3-transition node interpolation"
          >
            <Shuffle className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
            <span>Simulate Pacing Shift</span>
          </button>

          {/* Playhead Animation Play/Pause */}
          <button
            onClick={() => setIsPlayingScrubber(!isPlayingScrubber)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
              isPlayingScrubber
                ? 'bg-rose-950 text-rose-300 border-rose-800 shadow-lg animate-pulse'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            {isPlayingScrubber ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlayingScrubber ? 'Pause Scrubber' : 'Simulate Playhead'}</span>
          </button>

          {/* Reset Scrubber */}
          <button
            onClick={() => setScrubberTimeMin(0)}
            className="p-1.5 rounded-lg bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 transition"
            title="Reset Scrubber"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Feature Toggles */}
          <button
            onClick={() => setShowTensionCurve(!showTensionCurve)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition ${
              showTensionCurve ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-slate-950 text-slate-500 border-slate-850'
            }`}
          >
            Tension Curve
          </button>

          <button
            onClick={() => setShowTransitionBadges(!showTransitionBadges)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition ${
              showTransitionBadges ? 'bg-purple-950 text-purple-300 border-purple-800' : 'bg-slate-950 text-slate-500 border-slate-850'
            }`}
          >
            Transitions
          </button>

          <button
            onClick={() => setShowActBands(!showActBands)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition ${
              showActBands ? 'bg-indigo-950 text-indigo-300 border-indigo-800' : 'bg-slate-950 text-slate-500 border-slate-850'
            }`}
          >
            Act Bands
          </button>
        </div>
      </div>

      {/* Main D3 Canvas Container */}
      <div 
        ref={containerRef} 
        className="w-full bg-slate-950/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-inner relative"
      >
        <svg 
          ref={svgRef} 
          width={dimensions.width} 
          height={dimensions.height}
          className="select-none"
        />

        {/* Floating Quick Legend */}
        <div className="absolute top-3 left-4 flex flex-wrap items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300">
          <span className="text-slate-500 uppercase tracking-wider">Transitions:</span>
          {Object.entries(TRANSITION_COLORS).map(([name, col]) => (
            <span key={name} className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col }} />
              <span>{name}</span>
            </span>
          ))}
          <span className="text-slate-600">|</span>
          <span className="flex items-center space-x-1">
            <span className="text-cyan-400 font-bold">Act I (Setup)</span>
            <span className="text-slate-500">→</span>
            <span className="text-purple-400 font-bold">Act II (Trials)</span>
            <span className="text-slate-500">→</span>
            <span className="text-rose-400 font-bold">Act III (Climax)</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 italic">
            Click nodes to inspect or badges to cycle transitions
          </span>
        </div>
      </div>

      {/* Narrative Metrics & Active Scene Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 4 Cols: Runtime & Episode Progression Stats */}
        <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold font-mono">
              <Clock className="w-4 h-4" />
              <span>Episode Duration Progression</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {((totalCalculatedDuration / targetDuration) * 100).toFixed(0)}% of Target
            </span>
          </div>

          {/* Progress Bar vs Target */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300 font-bold">Script Runtime: {totalCalculatedDuration.toFixed(1)}m</span>
              <span className="text-cyan-400 font-bold">Target: {targetDuration.toFixed(1)}m</span>
            </div>
            <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
              <div 
                className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalCalculatedDuration / targetDuration) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0:00 Intro</span>
              <span>
                {totalCalculatedDuration < targetDuration * 0.8 && 'Pacing: Fast (Consider adding beats)'}
                {totalCalculatedDuration >= targetDuration * 0.8 && totalCalculatedDuration <= targetDuration * 1.2 && 'Pacing: Golden Zone'}
                {totalCalculatedDuration > targetDuration * 1.2 && 'Pacing: Extended (Trim scenes)'}
              </span>
              <span>{targetDuration.toFixed(1)}m Finish</span>
            </div>
          </div>

          {/* Transition Breakdown */}
          <div className="space-y-1.5 pt-2 border-t border-slate-850">
            <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider">
              Transition Choreography:
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-cyan-400 font-bold block text-sm">
                  {enrichedScenes.filter(s => s.transition === 'Cut').length}
                </span>
                <span className="text-slate-400">Hard Cuts</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-purple-400 font-bold block text-sm">
                  {enrichedScenes.filter(s => s.transition === 'Dissolve').length}
                </span>
                <span className="text-slate-400">Dissolves</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold block text-sm">
                  {enrichedScenes.filter(s => s.transition?.includes('Fade')).length}
                </span>
                <span className="text-slate-400">Fades</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 8 Cols: Selected Scene Plot Point & Timing Editor */}
        <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
          {activeEnriched ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-850 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                      SCENE #{activeEnriched.sceneNumber} OF {enrichedScenes.length}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                      {activeEnriched.act}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                      Timeline: {activeEnriched.startTimeMin.toFixed(1)}m → {activeEnriched.endTimeMin.toFixed(1)}m (~{activeEnriched.timingEstMin.toFixed(1)}m)
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 font-mono mt-1">
                    {activeEnriched.heading}
                  </h4>
                </div>

                {onNavigateToScriptScene && (
                  <button
                    onClick={() => onNavigateToScriptScene(activeEnriched.sceneNumber)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-semibold hover:bg-cyan-900 transition"
                  >
                    <span>Open in Script Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Interactive Duration Adjuster with D3-Transition Interpolation */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Scene Duration & Timeline Placement (d3-transition reactive):</span>
                  </span>
                  <span className="text-xs font-mono font-extrabold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {activeEnriched.timingEstMin.toFixed(1)} min (~{Math.round(activeEnriched.timingEstMin * 60)}s)
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleAdjustDuration(-0.5)}
                    disabled={activeEnriched.timingEstMin <= 0.5}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 flex items-center gap-1 transition"
                    title="Shorten Scene by 0.5 min"
                  >
                    <Minus className="w-3 h-3" />
                    <span>0.5m</span>
                  </button>

                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={activeEnriched.timingEstMin}
                    onChange={(e) => handleSetExactDuration(parseFloat(e.target.value))}
                    className="flex-1 accent-cyan-400 cursor-pointer h-2 bg-slate-950 rounded-lg border border-slate-800"
                  />

                  <button
                    onClick={() => handleAdjustDuration(0.5)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-1 transition"
                    title="Extend Scene by 0.5 min"
                  >
                    <Plus className="w-3 h-3" />
                    <span>0.5m</span>
                  </button>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Fast Cut (0.5m)</span>
                  <span className="text-cyan-400/80">Changing duration smoothly interpolates all timeline nodes via d3.transition()</span>
                  <span>Extended (10.0m)</span>
                </div>
              </div>

              {/* Plot Point & Transition Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-slate-300 block">
                    Narrative Plot Point Classification:
                  </label>
                  <select
                    value={activeEnriched.plotPoint}
                    onChange={(e) => handleUpdatePlotPoint(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
                  >
                    {PLOT_POINT_PRESETS.map(preset => (
                      <option key={preset.id} value={preset.label} className="bg-slate-900 text-slate-200">
                        {preset.icon} {preset.label} ({preset.act})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold font-mono text-slate-300 block">
                    Outgoing Scene Transition:
                  </label>
                  <select
                    value={activeEnriched.transition}
                    onChange={(e) => handleUpdateTransition(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Cut">Cut (Instant Dramatic Cut)</option>
                    <option value="Fade In">Fade In (Gradual Exposure Reveal)</option>
                    <option value="Dissolve">Dissolve (Emotional Cross-Fade)</option>
                    <option value="Fade Out">Fade Out (Dramatic Black/White Out)</option>
                    <option value="Wipe">Wipe (Directional Cel Wipe)</option>
                  </select>
                </div>
              </div>

              {/* Action Beat & Characters */}
              <div className="space-y-2">
                <p className="text-xs text-slate-300 italic font-serif bg-slate-900 p-2.5 rounded-lg border border-slate-850 leading-relaxed">
                  "{activeEnriched.action}"
                </p>

                <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-500">Characters in Scene:</span>
                    <span className="text-slate-200 font-bold">
                      {activeEnriched.characters.join(', ') || 'No spoken dialogue'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Dramatic Tension: </span>
                    <span className="text-amber-400 font-bold">{activeEnriched.tensionScore}%</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-slate-500">
              <Film className="w-8 h-8 mx-auto opacity-50 mb-1" />
              <p className="text-xs font-mono">Select a scene node to inspect plot points and transition choreography.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
