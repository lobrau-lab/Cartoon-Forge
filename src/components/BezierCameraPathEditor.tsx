import React, { useState, useEffect, useRef } from 'react';
import { ShotItem, CameraPathConfig, CameraKeyframe } from '../types';
import { D3CameraTrajectoryGraph } from './D3CameraTrajectoryGraph';
import { 
  Camera, 
  Sliders, 
  Sparkles, 
  Plus, 
  Trash2, 
  Settings, 
  Activity, 
  TrendingUp, 
  Play, 
  Pause, 
  RefreshCw, 
  HelpCircle,
  Video,
  Eye,
  SlidersHorizontal,
  Compass
} from 'lucide-react';

interface BezierCameraPathEditorProps {
  selectedShot: ShotItem | undefined;
  onUpdateShot: (shotId: string, updates: Partial<ShotItem>) => void;
}

type ChannelType = 'pan' | 'tilt' | 'dolly' | 'roll';

const PRESETS: { name: string; description: string; keyframes: CameraKeyframe[] }[] = [
  {
    name: "Cinematic Slow Pan",
    description: "Elegant landscape pan from left to right with high-tension smoothing.",
    keyframes: [
      { id: 'p1-1', timePct: 0, pan: -30, tilt: 0, dolly: 3, roll: 0, easeOut: { x: 0.4, y: 0.1 }, easeIn: { x: 0.6, y: 0.9 } },
      { id: 'p1-2', timePct: 50, pan: 0, tilt: 2, dolly: 3.5, roll: 0, easeOut: { x: 0.4, y: 0.1 }, easeIn: { x: 0.6, y: 0.9 } },
      { id: 'p1-3', timePct: 100, pan: 30, tilt: 5, dolly: 4, roll: 0, easeOut: { x: 0.4, y: 0.1 }, easeIn: { x: 0.6, y: 0.9 } }
    ]
  },
  {
    name: "Vertigo Dolly Zoom",
    description: "Counter-acting camera dolly and zoom movement creates a dramatic psychological warp.",
    keyframes: [
      { id: 'p2-1', timePct: 0, pan: 0, tilt: 0, dolly: 2, roll: 0, easeOut: { x: 0.6, y: 0 }, easeIn: { x: 0.4, y: 1 } },
      { id: 'p2-2', timePct: 50, pan: 0, tilt: -2, dolly: 5, roll: 3, easeOut: { x: 0.6, y: 0 }, easeIn: { x: 0.4, y: 1 } },
      { id: 'p2-3', timePct: 100, pan: 0, tilt: 0, dolly: 9, roll: 0, easeOut: { x: 0.6, y: 0 }, easeIn: { x: 0.4, y: 1 } }
    ]
  },
  {
    name: "Dutch Roll Whip-Pan",
    description: "Action-packed camera roll combined with a rapid, whipping horizontal pan.",
    keyframes: [
      { id: 'p3-1', timePct: 0, pan: -45, tilt: -10, dolly: 4, roll: -15, easeOut: { x: 0.2, y: 0.8 }, easeIn: { x: 0.2, y: 0.8 } },
      { id: 'p3-2', timePct: 40, pan: -20, tilt: 5, dolly: 3.5, roll: 10, easeOut: { x: 0.1, y: 0.9 }, easeIn: { x: 0.1, y: 0.9 } },
      { id: 'p3-3', timePct: 60, pan: 20, tilt: -5, dolly: 3, roll: -10, easeOut: { x: 0.1, y: 0.9 }, easeIn: { x: 0.1, y: 0.9 } },
      { id: 'p3-4', timePct: 100, pan: 45, tilt: 10, dolly: 2.5, roll: 15, easeOut: { x: 0.2, y: 0.8 }, easeIn: { x: 0.2, y: 0.8 } }
    ]
  },
  {
    name: "Dramatic Crane Tilt-Up",
    description: "Vertical jib-arm sweep starting low and tilting up to reveal scale.",
    keyframes: [
      { id: 'p4-1', timePct: 0, pan: 5, tilt: -20, dolly: 5, roll: 2, easeOut: { x: 0.5, y: 0 }, easeIn: { x: 0.5, y: 1 } },
      { id: 'p4-2', timePct: 100, pan: -5, tilt: 25, dolly: 3, roll: -2, easeOut: { x: 0.5, y: 0 }, easeIn: { x: 0.5, y: 1 } }
    ]
  },
  {
    name: "Dynamic Drift / Hover",
    description: "Handheld micro-jitters mimicking active human operator presence.",
    keyframes: [
      { id: 'p5-1', timePct: 0, pan: 0, tilt: 0, dolly: 3, roll: 0, easeOut: { x: 0.3, y: 0.3 }, easeIn: { x: 0.7, y: 0.7 } },
      { id: 'p5-2', timePct: 25, pan: -2, tilt: 1.5, dolly: 3.1, roll: -1, easeOut: { x: 0.3, y: 0.3 }, easeIn: { x: 0.7, y: 0.7 } },
      { id: 'p5-3', timePct: 50, pan: 3, tilt: -2, dolly: 2.9, roll: 1.5, easeOut: { x: 0.3, y: 0.3 }, easeIn: { x: 0.7, y: 0.7 } },
      { id: 'p5-4', timePct: 75, pan: -1, tilt: 0.5, dolly: 3.05, roll: -0.5, easeOut: { x: 0.3, y: 0.3 }, easeIn: { x: 0.7, y: 0.7 } },
      { id: 'p5-5', timePct: 100, pan: 0, tilt: 0, dolly: 3, roll: 0, easeOut: { x: 0.3, y: 0.3 }, easeIn: { x: 0.7, y: 0.7 } }
    ]
  }
];

const INITIAL_CONFIG: CameraPathConfig = {
  keyframes: [
    { id: 'k1', timePct: 0, pan: -15, tilt: -5, dolly: 3, roll: -5, easeOut: { x: 0.33, y: 0.2 }, easeIn: { x: 0.67, y: 0.8 } },
    { id: 'k2', timePct: 50, pan: 10, tilt: 10, dolly: 5, roll: 5, easeOut: { x: 0.33, y: 0.2 }, easeIn: { x: 0.67, y: 0.8 } },
    { id: 'k3', timePct: 100, pan: 25, tilt: -2, dolly: 7, roll: -10, easeOut: { x: 0.33, y: 0.2 }, easeIn: { x: 0.67, y: 0.8 } }
  ],
  motionBlur: true,
  shutterSpeed: '1/48s',
  focalLengthMm: 35
};

export const BezierCameraPathEditor: React.FC<BezierCameraPathEditorProps> = ({
  selectedShot,
  onUpdateShot
}) => {
  const [activeChannel, setActiveChannel] = useState<ChannelType>('pan');
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simTimePct, setSimTimePct] = useState<number>(0);
  const [showPresets, setShowPresets] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Initialize camera path if not exists
  const config: CameraPathConfig = selectedShot?.cameraPath || INITIAL_CONFIG;

  const keyframes = [...config.keyframes].sort((a, b) => a.timePct - b.timePct);

  // Update shot helper
  const updateConfig = (updates: Partial<CameraPathConfig>) => {
    if (!selectedShot) return;
    onUpdateShot(selectedShot.id, {
      cameraPath: {
        ...config,
        ...updates
      }
    });
  };

  // Safe keyframe selector fallback
  const selectedKeyframe = keyframes.find(k => k.id === selectedKeyframeId) || keyframes[0];

  useEffect(() => {
    if (selectedKeyframe && selectedKeyframeId === null) {
      setSelectedKeyframeId(selectedKeyframe.id);
    }
  }, [selectedShot, selectedKeyframeId]);

  // 3D camera path simulation loop
  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current !== null) {
        const delta = time - lastTimeRef.current;
        if (isPlaying) {
          setSimTimePct(prev => {
            const next = prev + (delta / 40); // 4 seconds full loop cycle approx
            return next > 100 ? 0 : next;
          });
        }
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  if (!selectedShot) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <Camera className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
        <h4 className="text-sm font-bold text-slate-400">Camera Path Editor Offline</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Please select a shot card in the storyboard panel above to initialize and configure custom bezier camera movements.
        </p>
      </div>
    );
  }

  // Range and scaling helpers based on active channel
  const getChannelConfig = (channel: ChannelType) => {
    switch (channel) {
      case 'pan':
        return { min: -90, max: 90, unit: '°', label: 'Pan Angle', color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
      case 'tilt':
        return { min: -45, max: 45, unit: '°', label: 'Tilt Angle', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
      case 'dolly':
        return { min: 0, max: 10, unit: 'm', label: 'Dolly / Zoom', color: '#8b5cf6', bg: 'bg-violet-500/10', border: 'border-violet-500/30' };
      case 'roll':
        return { min: -180, max: 180, unit: '°', label: 'Camera Roll', color: '#ec4899', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
    }
  };

  const channelMeta = getChannelConfig(activeChannel);

  // Bezier curve interpolation algorithm for simulation preview
  const getInterpolatedValue = (timePct: number, channel: ChannelType): number => {
    if (keyframes.length === 0) return 0;
    if (keyframes.length === 1) return keyframes[0][channel];

    // Find bounding keyframes
    let left = keyframes[0];
    let right = keyframes[keyframes.length - 1];

    if (timePct <= left.timePct) return left[channel];
    if (timePct >= right.timePct) return right[channel];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (timePct >= keyframes[i].timePct && timePct <= keyframes[i+1].timePct) {
        left = keyframes[i];
        right = keyframes[i+1];
        break;
      }
    }

    // Normalized time fraction within segment
    const segmentDuration = right.timePct - left.timePct;
    if (segmentDuration === 0) return left[channel];
    const t = (timePct - left.timePct) / segmentDuration;

    // Cubic bezier ease interpolation
    // Using simple cubic-bezier calculation based on left's easeOut and right's easeIn
    const p0 = left[channel];
    const p3 = right[channel];
    
    // Control Points relative to values
    const cp1 = p0 + (p3 - p0) * left.easeOut.y;
    const cp2 = p0 + (p3 - p0) * right.easeIn.y;

    // Standard cubic bezier equation
    const oneMinusT = 1 - t;
    const value = 
      Math.pow(oneMinusT, 3) * p0 + 
      3 * Math.pow(oneMinusT, 2) * t * cp1 + 
      3 * oneMinusT * Math.pow(t, 2) * cp2 + 
      Math.pow(t, 3) * p3;

    return value;
  };

  // Convert coordinate to SVG grid spaces
  const width = 600;
  const height = 240;
  const paddingX = 40;
  const paddingY = 20;

  const toSvgCoords = (timePct: number, val: number, channel: ChannelType) => {
    const meta = getChannelConfig(channel);
    const x = paddingX + (timePct / 100) * (width - 2 * paddingX);
    const yRatio = (val - meta.min) / (meta.max - meta.min);
    const y = height - paddingY - yRatio * (height - 2 * paddingY);
    return { x, y };
  };

  const fromSvgCoords = (x: number, y: number, channel: ChannelType) => {
    const meta = getChannelConfig(channel);
    const tRatio = (x - paddingX) / (width - 2 * paddingX);
    const timePct = Math.max(0, Math.min(100, Math.round(tRatio * 100)));

    const yRatio = (height - paddingY - y) / (height - 2 * paddingY);
    const val = meta.min + yRatio * (meta.max - meta.min);
    const value = Math.max(meta.min, Math.min(meta.max, Math.round(val * 10) / 10));

    return { timePct, value };
  };

  // Handle keyframe property modification
  const handleUpdateKeyframe = (id: string, updates: Partial<CameraKeyframe>) => {
    const updated = keyframes.map(k => {
      if (k.id === id) {
        return { ...k, ...updates };
      }
      return k;
    });
    updateConfig({ keyframes: updated });
  };

  // Add new keyframe at specific time & value
  const handleAddKeyframe = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Scale coords
    const svgWidth = rect.width;
    const svgHeight = rect.height;
    const scaleX = (clickX / svgWidth) * width;
    const scaleY = (clickY / svgHeight) * height;

    const { timePct, value } = fromSvgCoords(scaleX, scaleY, activeChannel);

    // Prevent duplicate times
    if (keyframes.some(k => Math.abs(k.timePct - timePct) < 3)) return;

    const newKf: CameraKeyframe = {
      id: `kf-${Date.now()}`,
      timePct,
      pan: activeChannel === 'pan' ? value : getInterpolatedValue(timePct, 'pan'),
      tilt: activeChannel === 'tilt' ? value : getInterpolatedValue(timePct, 'tilt'),
      dolly: activeChannel === 'dolly' ? value : getInterpolatedValue(timePct, 'dolly'),
      roll: activeChannel === 'roll' ? value : getInterpolatedValue(timePct, 'roll'),
      easeOut: { x: 0.33, y: 0.2 },
      easeIn: { x: 0.67, y: 0.8 }
    };

    const newKeyframes = [...keyframes, newKf].sort((a, b) => a.timePct - b.timePct);
    updateConfig({ keyframes: newKeyframes });
    setSelectedKeyframeId(newKf.id);
  };

  // Remove selected keyframe (prevent deleting start/end if locked)
  const handleDeleteKeyframe = (id: string) => {
    if (keyframes.length <= 1) return;
    const updated = keyframes.filter(k => k.id !== id);
    updateConfig({ keyframes: updated });
    setSelectedKeyframeId(updated[0]?.id || null);
  };

  // Presets load helper
  const handleLoadPreset = (preset: typeof PRESETS[0]) => {
    updateConfig({ keyframes: preset.keyframes });
    setSelectedKeyframeId(preset.keyframes[0].id);
    setShowPresets(false);
  };

  // Render SVG Bezier curve line paths
  const generatePathD = (channel: ChannelType) => {
    if (keyframes.length === 0) return '';
    let d = '';

    keyframes.forEach((kf, idx) => {
      const { x, y } = toSvgCoords(kf.timePct, kf[channel], channel);
      if (idx === 0) {
        d += `M ${x} ${y}`;
      } else {
        const prev = keyframes[idx - 1];
        const prevCoords = toSvgCoords(prev.timePct, prev[channel], channel);
        
        // Control points
        const cp1x = prevCoords.x + (x - prevCoords.x) * prev.easeOut.x;
        const cp1y = prevCoords.y + (y - prevCoords.y) * prev.easeOut.y;
        const cp2x = prevCoords.x + (x - prevCoords.x) * kf.easeIn.x;
        const cp2y = prevCoords.y + (y - prevCoords.y) * kf.easeIn.y;

        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
      }
    });

    return d;
  };

  // Live simulation variables
  const simPan = getInterpolatedValue(simTimePct, 'pan');
  const simTilt = getInterpolatedValue(simTimePct, 'tilt');
  const simDolly = getInterpolatedValue(simTimePct, 'dolly');
  const simRoll = getInterpolatedValue(simTimePct, 'roll');

  return (
    <div className="bg-slate-950 border border-amber-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
      {/* High-Tech Grid Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500/20 via-amber-500 to-rose-500/20" />

      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-violet-950/80 text-violet-400 border border-violet-800">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-200 flex items-center gap-2">
              <span>Bezier Camera trajectory</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 font-mono font-bold border border-violet-900 animate-pulse">
                Active Optics
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Interpolate custom Pan, Tilt, Dolly, and Roll vectors over precise keyframe points.
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-bold text-slate-300 hover:text-slate-100 hover:bg-slate-850 transition-all shadow"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Path Presets</span>
          </button>
          
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition-all"
            title="Help & Info"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Presets Panel Overlay */}
      {showPresets && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3 animate-slideDown">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleLoadPreset(preset)}
              className="p-3 text-left bg-slate-950 border border-slate-850 hover:border-amber-500/50 rounded-xl hover:scale-[1.02] transition-all space-y-1"
            >
              <div className="text-xs font-bold text-slate-200">{preset.name}</div>
              <div className="text-[10px] text-slate-400 leading-tight line-clamp-2">{preset.description}</div>
            </button>
          ))}
        </div>
      )}

      {/* Help Panel */}
      {showHelp && (
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-xs text-slate-300 space-y-2 leading-relaxed">
          <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">How to use the Graph Editor:</h4>
          <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[10px]">
            <li>Click on tabs (Pan, Tilt, Dolly, Roll) to select the channel you want to edit.</li>
            <li>Double-click or single-click inside the blank grid canvas to add a new keyframe node.</li>
            <li>Select a keyframe circle to highlight it and adjust its values via sliders.</li>
            <li>Use Easing sliders to control incoming & outgoing bezier curve tension.</li>
            <li>The 3D preview on the right shows active real-time simulation behavior.</li>
          </ul>
        </div>
      )}

      {/* Main Core Editor: SVG Graph & Live 3D Simulation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Bezier Graph Editor (8/12 wide) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Channel Selector Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-850">
            {(['pan', 'tilt', 'dolly', 'roll'] as const).map((channel) => {
              const isActive = activeChannel === channel;
              const meta = getChannelConfig(channel);
              return (
                <button
                  key={channel}
                  type="button"
                  onClick={() => {
                    setActiveChannel(channel);
                    // Reset selected keyframe search boundary
                  }}
                  className={`flex-1 py-2 text-center rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    isActive 
                      ? `bg-slate-950 text-slate-100 ${meta.border} shadow-lg scale-[1.01]`
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                  style={{ borderLeftColor: isActive ? meta.color : undefined }}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span>{channel}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Canvas Wrapper */}
          <div className="relative bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-inner">
            {/* SVG Visual Canvas */}
            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto cursor-crosshair select-none"
              onClick={handleAddKeyframe}
            >
              {/* Background gridlines */}
              {Array.from({ length: 11 }).map((_, i) => {
                const xPct = i * 10;
                const { x } = toSvgCoords(xPct, 0, activeChannel);
                return (
                  <g key={`grid-v-${i}`}>
                    <line
                      x1={x}
                      y1={paddingY}
                      x2={x}
                      y2={height - paddingY}
                      stroke="#1e293b"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                    <text
                      x={x}
                      y={height - 4}
                      fill="#475569"
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {xPct}%
                    </text>
                  </g>
                );
              })}

              {/* Horizontal center gridline */}
              <line
                x1={paddingX}
                y1={height / 2}
                x2={width - paddingX}
                y2={height / 2}
                stroke="#334155"
                strokeWidth="1.2"
                strokeDasharray="4,4"
              />

              {/* Range labels */}
              <text
                x={4}
                y={paddingY + 8}
                fill="#475569"
                fontSize="8"
                fontFamily="monospace"
              >
                Max: {channelMeta.max}{channelMeta.unit}
              </text>
              <text
                x={4}
                y={height - paddingY - 4}
                fill="#475569"
                fontSize="8"
                fontFamily="monospace"
              >
                Min: {channelMeta.min}{channelMeta.unit}
              </text>

              {/* Render background/inactive curves as faded dashed lines */}
              {(['pan', 'tilt', 'dolly', 'roll'] as const).map((channel) => {
                if (channel === activeChannel) return null;
                const meta = getChannelConfig(channel);
                return (
                  <path
                    key={`bg-curve-${channel}`}
                    d={generatePathD(channel)}
                    fill="none"
                    stroke={meta.color}
                    strokeWidth="1.2"
                    strokeDasharray="3,4"
                    opacity="0.25"
                  />
                );
              })}

              {/* Render active channel bezier curve */}
              <path
                d={generatePathD(activeChannel)}
                fill="none"
                stroke={channelMeta.color}
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.9"
              />

              {/* Render simulation playhead line */}
              <line
                x1={toSvgCoords(simTimePct, 0, activeChannel).x}
                y1={paddingY}
                x2={toSvgCoords(simTimePct, 0, activeChannel).x}
                y2={height - paddingY}
                stroke="#e11d48"
                strokeWidth="1.5"
                opacity="0.8"
              />

              {/* Render keyframe clickable handles for active channel */}
              {keyframes.map((kf) => {
                const { x, y } = toSvgCoords(kf.timePct, kf[activeChannel], activeChannel);
                const isSelected = kf.id === selectedKeyframeId;
                return (
                  <g key={`handle-${kf.id}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 8 : 5}
                      fill={isSelected ? '#f59e0b' : channelMeta.color}
                      stroke="#020617"
                      strokeWidth="2"
                      className="cursor-pointer hover:scale-125 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent adding a duplicate keyframe
                        setSelectedKeyframeId(kf.id);
                      }}
                    />
                    <text
                      x={x}
                      y={y - 12}
                      fill={isSelected ? '#f59e0b' : '#94a3b8'}
                      fontSize="8"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {kf[activeChannel].toFixed(1)}{channelMeta.unit}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Click/Add Guide Overlay */}
            <div className="absolute top-2 right-3 pointer-events-none text-[8px] font-mono text-slate-500 uppercase tracking-widest bg-slate-950/80 px-2 py-0.5 rounded border border-slate-900">
              Double-Click Grid to Add Keyframe
            </div>
          </div>
        </div>

        {/* Live View Camera Perspective Simulator (4/12 wide) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col items-center justify-between h-full space-y-3 relative overflow-hidden min-h-[220px]">
            {/* Visual Simulator Background Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />

            {/* Simulated 3D Camera Bounds */}
            <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-[9px] font-black font-mono tracking-widest text-rose-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                <span>ACTIVE SIMULATOR</span>
              </span>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                Playhead: {simTimePct.toFixed(0)}%
              </span>
            </div>

            {/* Perspective Eye Grid simulation frame */}
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              {/* Virtual landscape box that shifts based on pan/tilt/dolly/roll */}
              <div 
                className="w-48 h-28 border-2 border-dashed border-cyan-500/20 rounded-md flex items-center justify-center flex-col transition-all duration-75 relative"
                style={{
                  transform: `
                    perspective(200px)
                    translate3d(${-simPan * 0.8}px, ${simTilt * 0.8}px, ${(simDolly - 5) * 12}px)
                    rotateZ(${-simRoll}deg)
                  `
                }}
              >
                {/* Simulated Character Silhouette */}
                <div className="w-12 h-16 bg-gradient-to-t from-violet-600/30 to-amber-500/30 border border-amber-500/40 rounded flex items-center justify-center">
                  <Eye className="w-5 h-5 text-amber-400" />
                </div>
                
                {/* Mini reticle bounds */}
                <div className="absolute inset-0 border border-rose-500/20 pointer-events-none rounded" />
                <div className="absolute top-1/2 left-0 w-full h-px bg-rose-500/10 pointer-events-none" />
                <div className="absolute top-0 left-1/2 w-px h-full bg-rose-500/10 pointer-events-none" />
              </div>

              {/* Outer Static Reticle HUD */}
              <div className="absolute inset-2 border border-slate-400/10 pointer-events-none rounded flex items-center justify-center">
                <div className="w-6 h-6 border border-slate-400/20 rounded-full" />
                <div className="absolute top-2 left-2 text-[8px] font-mono text-slate-500">f = {config.focalLengthMm}mm</div>
                <div className="absolute bottom-2 right-2 text-[8px] font-mono text-slate-500">{config.shutterSpeed}</div>
              </div>
            </div>

            {/* Simulated Live Values HUD bar */}
            <div className="w-full grid grid-cols-4 gap-1 text-[9px] font-mono font-bold text-center">
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-850/60">
                <div className="text-slate-500 text-[8px]">PAN</div>
                <div className="text-emerald-400 mt-0.5">{simPan.toFixed(0)}°</div>
              </div>
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-850/60">
                <div className="text-slate-500 text-[8px]">TILT</div>
                <div className="text-amber-400 mt-0.5">{simTilt.toFixed(0)}°</div>
              </div>
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-850/60">
                <div className="text-slate-500 text-[8px]">DOLLY</div>
                <div className="text-violet-400 mt-0.5">{simDolly.toFixed(1)}m</div>
              </div>
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-850/60">
                <div className="text-slate-500 text-[8px]">ROLL</div>
                <div className="text-rose-400 mt-0.5">{simRoll.toFixed(0)}°</div>
              </div>
            </div>

            {/* Playback simulation trigger */}
            <div className="w-full flex justify-center pt-1">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase transition-all border ${
                  isPlaying 
                    ? 'bg-rose-950/80 border-rose-800 text-rose-400 hover:text-rose-300'
                    : 'bg-emerald-950/80 border-emerald-800 text-emerald-400 hover:text-emerald-300'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3 h-3 fill-current" />
                    <span>Pause Sim</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play Sim</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Keyframe Precision Value Adjusters */}
      {selectedKeyframe && (
        <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">
                Configure keyframe point
              </span>
              <span className="text-[9px] font-mono text-slate-500 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded">
                Node ID: {selectedKeyframe.id}
              </span>
            </div>

            {/* Delete current keyframe */}
            <button
              type="button"
              onClick={() => handleDeleteKeyframe(selectedKeyframe.id)}
              disabled={keyframes.length <= 1}
              className="flex items-center space-x-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 px-2 py-1 rounded-md transition-all text-[10px] disabled:opacity-50 disabled:pointer-events-none"
              title="Delete this keyframe"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Point</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Timeline percent coordinate */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Time Coordinates</span>
                <span className="text-amber-400 font-extrabold">{selectedKeyframe.timePct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={selectedKeyframe.timePct}
                onChange={(e) => handleUpdateKeyframe(selectedKeyframe.id, { timePct: parseInt(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-slate-950 rounded-md border border-slate-850"
              />
            </div>

            {/* Active editing channel value */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Target Value ({activeChannel.toUpperCase()})</span>
                <span className="font-extrabold text-slate-100" style={{ color: channelMeta.color }}>
                  {selectedKeyframe[activeChannel].toFixed(1)}{channelMeta.unit}
                </span>
              </div>
              <input
                type="range"
                min={channelMeta.min}
                max={channelMeta.max}
                step={activeChannel === 'dolly' ? '0.1' : '1'}
                value={selectedKeyframe[activeChannel]}
                onChange={(e) => handleUpdateKeyframe(selectedKeyframe.id, { [activeChannel]: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-950 rounded-md border border-slate-850"
                style={{ accentColor: channelMeta.color }}
              />
            </div>

            {/* Bezier interpolation smoothing: Ease-Out */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Bezier Ease-Out (CP1)</span>
                <span className="text-cyan-400 font-extrabold">{selectedKeyframe.easeOut.y.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-1"
                max="2"
                step="0.05"
                value={selectedKeyframe.easeOut.y}
                onChange={(e) => handleUpdateKeyframe(selectedKeyframe.id, { 
                  easeOut: { ...selectedKeyframe.easeOut, y: parseFloat(e.target.value) } 
                })}
                className="w-full accent-cyan-500 h-1.5 bg-slate-950 rounded-md border border-slate-850"
              />
            </div>

            {/* Bezier interpolation smoothing: Ease-In */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Bezier Ease-In (CP2)</span>
                <span className="text-rose-400 font-extrabold">{selectedKeyframe.easeIn.y.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-1"
                max="2"
                step="0.05"
                value={selectedKeyframe.easeIn.y}
                onChange={(e) => handleUpdateKeyframe(selectedKeyframe.id, { 
                  easeIn: { ...selectedKeyframe.easeIn, y: parseFloat(e.target.value) } 
                })}
                className="w-full accent-rose-500 h-1.5 bg-slate-950 rounded-md border border-slate-850"
              />
            </div>
          </div>
        </div>
      )}

      {/* D3 Interactive Spatial Trajectory Mapping panel */}
      <D3CameraTrajectoryGraph
        keyframes={keyframes}
        selectedKeyframeId={selectedKeyframeId}
        onSelectKeyframe={(id) => setSelectedKeyframeId(id)}
        onUpdateKeyframe={handleUpdateKeyframe}
        simTimePct={simTimePct}
      />

      {/* Global Optics & Camera settings segment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-900 pt-5 text-xs font-mono text-slate-400">
        {/* Focal Length slider */}
        <div className="space-y-2 bg-slate-900/40 p-3 rounded-xl border border-slate-850">
          <div className="flex justify-between text-[10px] font-bold">
            <span className="uppercase tracking-wider">FOCAL LENGTH</span>
            <span className="text-amber-400">{config.focalLengthMm}mm</span>
          </div>
          <input
            type="range"
            min="12"
            max="135"
            step="1"
            value={config.focalLengthMm}
            onChange={(e) => updateConfig({ focalLengthMm: parseInt(e.target.value) })}
            className="w-full accent-amber-500 h-1 bg-slate-950 rounded-full"
          />
          <div className="flex justify-between text-[8px] text-slate-500">
            <span>12mm (Ultra-Wide)</span>
            <span>135mm (Telephoto)</span>
          </div>
        </div>

        {/* Shutter Speed Selector */}
        <div className="space-y-2 bg-slate-900/40 p-3 rounded-xl border border-slate-850 flex flex-col justify-between">
          <div className="flex justify-between text-[10px] font-bold">
            <span className="uppercase tracking-wider">SHUTTER ANGLE</span>
            <span className="text-slate-300">{config.shutterSpeed}</span>
          </div>
          <select
            value={config.shutterSpeed}
            onChange={(e) => updateConfig({ shutterSpeed: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-amber-500/50"
          >
            <option value="1/24s">1/24s (Extreme Blur)</option>
            <option value="1/48s">1/48s (Cinematic 180°)</option>
            <option value="1/96s">1/96s (Semi-crisp)</option>
            <option value="1/120s">1/120s (Action Crisp)</option>
            <option value="1/180s">1/180s (Shutter Sweep)</option>
          </select>
        </div>

        {/* Motion Blur latch toggler */}
        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">MOTION BLUR VECTORS</div>
            <div className="text-[9px] text-slate-500">Enable spatial vector sub-sampling</div>
          </div>
          <button
            type="button"
            onClick={() => updateConfig({ motionBlur: !config.motionBlur })}
            className={`w-10 h-5 rounded-full p-0.5 transition-colors relative flex items-center ${
              config.motionBlur ? 'bg-emerald-500' : 'bg-slate-850'
            }`}
          >
            <div 
              className={`w-4 h-4 bg-slate-950 rounded-full shadow-md transition-transform transform ${
                config.motionBlur ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
