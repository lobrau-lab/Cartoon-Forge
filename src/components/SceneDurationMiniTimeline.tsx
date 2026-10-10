import React, { useState } from 'react';
import { ShotItem, ScriptScene } from '../types';
import { 
  Clock, 
  Film, 
  Target, 
  Zap, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Maximize2, 
  Sparkles, 
  Play, 
  ChevronRight, 
  Scale, 
  Plus, 
  Minus, 
  RotateCcw, 
  Info, 
  Layers, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Gauge, 
  Edit3, 
  Check, 
  X,
  Volume2
} from 'lucide-react';

interface SceneDurationMiniTimelineProps {
  shots: ShotItem[];
  scene: ScriptScene | undefined;
  selectedShotId: string | null;
  onSelectShot: (shotId: string) => void;
  onUpdateShotDuration?: (shotId: string, durationSec: number) => void;
  onBatchScaleShots?: (targetTotalSec: number) => void;
  frameRate?: number;
}

export const SceneDurationMiniTimeline: React.FC<SceneDurationMiniTimelineProps> = ({
  shots,
  scene,
  selectedShotId,
  onSelectShot,
  onUpdateShotDuration,
  onBatchScaleShots,
  frameRate = 24
}) => {
  const [hoveredShotId, setHoveredShotId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'proportional' | 'compact' | 'segmented'>('proportional');
  const [showQuickAdjust, setShowQuickAdjust] = useState<boolean>(false);
  const [editingShotId, setEditingShotId] = useState<string | null>(null);
  const [editDurationValue, setEditDurationValue] = useState<string>('');

  // Sort shots sequentially
  const sortedShots = [...shots].sort((a, b) => a.shotNumber - b.shotNumber);

  // 1. Aggregated Duration of all shots in active scene (safe default: 3.0s if undefined)
  const aggregatedShotsDurationSec = sortedShots.reduce(
    (acc, s) => acc + (typeof s.durationSec === 'number' && !isNaN(s.durationSec) && s.durationSec > 0 ? s.durationSec : 3),
    0
  );

  // 2. Target Scene Duration calculated in Script Doctor (timingEstMin is in minutes)
  const scriptDoctorTargetMin = scene?.timingEstMin && !isNaN(scene.timingEstMin) && scene.timingEstMin > 0 
    ? scene.timingEstMin 
    : 3.0;
  const scriptDoctorTargetSec = scriptDoctorTargetMin * 60;

  // 3. Dialogue estimated duration sum from Script Doctor lines
  const dialogueLinesEstSec = (scene?.dialogue || []).reduce(
    (acc, d) => acc + (typeof d.durationEst === 'number' && !isNaN(d.durationEst) && d.durationEst > 0 ? d.durationEst : 3),
    0
  );

  // 4. Delta & Variance calculation
  const deltaSec = aggregatedShotsDurationSec - scriptDoctorTargetSec;
  const coveragePercent = scriptDoctorTargetSec > 0 
    ? Math.round((aggregatedShotsDurationSec / scriptDoctorTargetSec) * 100)
    : 0;

  // Pacing Classification
  let pacingStatus: 'rushed' | 'balanced' | 'extended' = 'balanced';
  let pacingColor = 'text-emerald-400';
  let pacingBg = 'bg-emerald-950/80 border-emerald-800 text-emerald-300';
  let pacingLabel = 'On-Target / Golden Ratio';

  if (coveragePercent < 75) {
    pacingStatus = 'rushed';
    pacingColor = 'text-amber-400';
    pacingBg = 'bg-amber-950/80 border-amber-800 text-amber-300';
    pacingLabel = 'Under Script Target (Rushed / Fast)';
  } else if (coveragePercent > 125) {
    pacingStatus = 'extended';
    pacingColor = 'text-indigo-400';
    pacingBg = 'bg-indigo-950/80 border-indigo-800 text-indigo-300';
    pacingLabel = 'Over Script Target (Extended / Slow)';
  }

  // Average Shot Length (ASL)
  const averageShotLengthSec = sortedShots.length > 0 
    ? (aggregatedShotsDurationSec / sortedShots.length) 
    : 0;

  // Helper formatters
  const formatTimecode = (totalSeconds: number) => {
    const safeSecs = Math.max(0, totalSeconds);
    const mins = Math.floor(safeSecs / 60);
    const secs = Math.floor(safeSecs % 60);
    const frames = Math.floor((safeSecs % 1) * frameRate);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  const formatMinSec = (totalSeconds: number) => {
    const safeSecs = Math.max(0, totalSeconds);
    const mins = Math.floor(safeSecs / 60);
    const secs = (safeSecs % 60).toFixed(1);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Readiness counters
  const readyShotsCount = sortedShots.filter(s => s.status === 'ready' && !!s.keyframeUrl).length;
  const totalFrames = Math.round(aggregatedShotsDurationSec * frameRate);
  const targetTotalFrames = Math.round(scriptDoctorTargetSec * frameRate);

  // Time Scale Maximum for the timeline bar (ensures both target and current shots fit gracefully)
  const timeScaleMaxSec = Math.max(scriptDoctorTargetSec * 1.15, aggregatedShotsDurationSec * 1.15, 10);

  // Target marker position on the scale bar (0% - 100%)
  const targetMarkerPercent = Math.min(100, Math.max(0, (scriptDoctorTargetSec / timeScaleMaxSec) * 100));

  // Quick Action: Scale all shots to match Script Doctor target exactly
  const handleScaleToTarget = () => {
    if (onBatchScaleShots) {
      onBatchScaleShots(scriptDoctorTargetSec);
    }
  };

  // Handler for committing single shot duration edit
  const handleCommitSingleShotDuration = (shotId: string) => {
    const parsed = parseFloat(editDurationValue);
    if (!isNaN(parsed) && parsed > 0 && onUpdateShotDuration) {
      const clamped = Math.min(120, Math.max(0.5, Math.round(parsed * 10) / 10));
      onUpdateShotDuration(shotId, clamped);
    }
    setEditingShotId(null);
    setEditDurationValue('');
  };

  // Cumulative positions for shots along time axis
  let currentCumulativeSec = 0;
  const shotsWithTiming = sortedShots.map(shot => {
    const duration = typeof shot.durationSec === 'number' && !isNaN(shot.durationSec) && shot.durationSec > 0 ? shot.durationSec : 3;
    const startSec = currentCumulativeSec;
    const endSec = startSec + duration;
    currentCumulativeSec = endSec;
    return {
      shot,
      duration,
      startSec,
      endSec,
      startPercent: (startSec / timeScaleMaxSec) * 100,
      widthPercent: (duration / timeScaleMaxSec) * 100
    };
  });

  const activeSelectedShot = sortedShots.find(s => s.id === selectedShotId);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3.5 relative overflow-hidden">
      {/* Top Header Row: Title, Script vs Storyboard Telemetry, Pacing Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-950/90 text-amber-400 border border-amber-800/80 shadow-inner flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Scene #{scene?.sceneNumber ?? 1} Mini-Timeline Visualizer</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800">
                  {sortedShots.length} Shots
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Aggregated storyboard cut duration vs. Script Doctor target scene pacing
            </p>
          </div>
        </div>

        {/* Telemetry Metrics Comparison Chips */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {/* Script Doctor Target Chip */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center space-x-2 shadow-sm">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            <div>
              <span className="text-[10px] text-slate-500 block leading-none">Script Doctor Target:</span>
              <span className="text-indigo-300 font-bold">
                {scriptDoctorTargetMin.toFixed(1)}m ({formatMinSec(scriptDoctorTargetSec)})
              </span>
            </div>
            <span className="text-[9px] text-slate-600 font-normal">
              ({targetTotalFrames}f)
            </span>
          </div>

          {/* Aggregated Storyboard Shots Chip */}
          <div className="bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center space-x-2 shadow-sm">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <div>
              <span className="text-[10px] text-slate-500 block leading-none">Storyboard Total:</span>
              <span className="text-amber-400 font-bold">
                {formatMinSec(aggregatedShotsDurationSec)}
              </span>
            </div>
            <span className="text-[9px] text-slate-500 font-normal">
              ({totalFrames}f @ {frameRate}fps)
            </span>
          </div>

          {/* Pacing Ratio & Delta Badge */}
          <div className={`border rounded-xl px-3 py-1.5 flex items-center space-x-2 shadow-sm ${pacingBg}`}>
            <Gauge className="w-3.5 h-3.5" />
            <div>
              <span className="text-[10px] opacity-75 block leading-none">Coverage:</span>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold">{coveragePercent}%</span>
                <span className="text-[10px] opacity-80">
                  ({deltaSec >= 0 ? `+${deltaSec.toFixed(1)}s` : `${deltaSec.toFixed(1)}s`})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Adjustments Toggle Button */}
          <button
            onClick={() => setShowQuickAdjust(!showQuickAdjust)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-sans font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              showQuickAdjust
                ? 'bg-amber-950 text-amber-300 border-amber-700'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Pacing & Scaling Tools"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Pacing Tools</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Mini-Timeline Track Bar */}
      <div className="space-y-1.5">
        {/* Timeline Header with Time Rulers & Markers */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-bold">00:00:00</span>
            <span className="text-slate-600">| START</span>
          </div>

          {/* Dialogue Estimated Baseline Marker */}
          {dialogueLinesEstSec > 0 && (
            <div className="flex items-center space-x-1 text-cyan-400/80">
              <Volume2 className="w-3 h-3 text-cyan-400" />
              <span>Dialogue Est: {formatMinSec(dialogueLinesEstSec)}</span>
            </div>
          )}

          {/* Average Shot Length (ASL) */}
          <div className="flex items-center space-x-1 text-slate-400">
            <span>ASL:</span>
            <span className="text-amber-400 font-bold">{averageShotLengthSec.toFixed(1)}s/shot</span>
          </div>

          {/* End Scale marker */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-600">SCALE MAX:</span>
            <span className="text-slate-400 font-bold">{formatMinSec(timeScaleMaxSec)}</span>
          </div>
        </div>

        {/* The Track Container */}
        <div className="relative w-full h-12 bg-slate-950 rounded-xl border border-slate-800 p-1 flex items-center overflow-visible select-none shadow-inner">
          {/* Subtle Background Timecode Grid Lines (10 intervals) */}
          <div className="absolute inset-0 pointer-events-none flex justify-between px-2 opacity-15">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="h-full w-px bg-slate-400" />
            ))}
          </div>

          {/* Script Doctor Target Goalpost Line (Vertical marker) */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] z-20 pointer-events-none flex flex-col items-center justify-between transition-all duration-300"
            style={{ left: `${targetMarkerPercent}%` }}
          >
            {/* Top Indicator Triangle / Flag */}
            <div className="absolute -top-3 bg-indigo-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap transform -translate-x-1/2 flex items-center space-x-1 border border-indigo-400">
              <Target className="w-2.5 h-2.5" />
              <span>Target: {formatMinSec(scriptDoctorTargetSec)}</span>
            </div>
            {/* Bottom Indicator */}
            <div className="w-2 h-2 rounded-full bg-indigo-400 transform translate-y-1 shadow-sm" />
          </div>

          {/* Shot Blocks Proportional Layout */}
          <div className="relative w-full h-full flex items-center space-x-1 overflow-hidden rounded-lg">
            {shotsWithTiming.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono italic">
                No shots recorded in active scene. Add shots to populate mini-timeline.
              </div>
            ) : (
              shotsWithTiming.map(({ shot, duration, startSec, endSec, widthPercent }) => {
                const isSelected = shot.id === selectedShotId;
                const isHovered = shot.id === hoveredShotId;
                const isReady = shot.status === 'ready' && !!shot.keyframeUrl;
                const isGenerating = shot.status === 'generating';

                // Status-based styling
                let blockBg = 'bg-slate-800/90 text-slate-300 border-slate-700';
                let blockAccent = 'bg-slate-700';
                if (isReady) {
                  blockBg = 'bg-gradient-to-r from-emerald-950/90 to-slate-900 text-emerald-300 border-emerald-600/70';
                  blockAccent = 'bg-emerald-500';
                } else if (isGenerating) {
                  blockBg = 'bg-gradient-to-r from-cyan-950/90 to-slate-900 text-cyan-300 border-cyan-500/80 animate-pulse';
                  blockAccent = 'bg-cyan-400';
                } else if (shot.status === 'pending') {
                  blockBg = 'bg-gradient-to-r from-amber-950/90 to-slate-900 text-amber-300 border-amber-600/60';
                  blockAccent = 'bg-amber-400';
                }

                if (isSelected) {
                  blockBg += ' ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)] z-10';
                }

                // Minimum width for visual legibility
                const dynamicStyle: React.CSSProperties = viewMode === 'proportional'
                  ? { width: `${Math.max(6, widthPercent)}%` }
                  : viewMode === 'segmented'
                  ? { flex: 1 }
                  : { width: `${Math.max(4, widthPercent)}%` };

                return (
                  <div
                    key={shot.id}
                    onClick={() => onSelectShot(shot.id)}
                    onMouseEnter={() => setHoveredShotId(shot.id)}
                    onMouseLeave={() => setHoveredShotId(null)}
                    style={dynamicStyle}
                    className={`relative h-full flex flex-col justify-between p-1.5 rounded-md border text-xs font-mono transition-all duration-150 cursor-pointer overflow-hidden group ${blockBg}`}
                    title={`Shot #${shot.shotNumber} (${duration.toFixed(1)}s): ${shot.actionPrompt || 'No prompt'}`}
                  >
                    {/* Top row: Shot number & Duration */}
                    <div className="flex items-center justify-between gap-1 w-full overflow-hidden">
                      <div className="flex items-center space-x-1">
                        <span className="font-bold text-[10px] text-slate-100">
                          #{shot.shotNumber}
                        </span>
                        {isReady && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 inline shrink-0" />}
                      </div>
                      <span className="text-[9px] font-semibold opacity-90 truncate">
                        {duration.toFixed(1)}s
                      </span>
                    </div>

                    {/* Bottom row: Shot type badge */}
                    <div className="flex items-center justify-between gap-1 w-full text-[8px] opacity-75">
                      <span className="truncate uppercase font-bold tracking-tight">
                        {shot.shotType?.replace('Angle', 'Ang').replace('Extreme', 'Ext') || 'SHOT'}
                      </span>
                      <span className="hidden sm:inline text-slate-500 font-sans truncate">
                        {shot.cameraMovement || 'Static'}
                      </span>
                    </div>

                    {/* Progress / Status Bottom Accent Line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${blockAccent}`} />
                  </div>
                );
              })
            )}

            {/* Remaining Deficit or Overflow Fill Visualization */}
            {deltaSec < 0 && (
              <div
                style={{ width: `${Math.min(100, Math.abs(deltaSec / timeScaleMaxSec) * 100)}%` }}
                className="h-full border border-dashed border-indigo-600/50 bg-indigo-950/30 rounded-md flex items-center justify-center p-1 font-mono text-[9px] text-indigo-400/90 whitespace-nowrap overflow-hidden"
                title={`Remaining Script Doctor Target Gap: ${Math.abs(deltaSec).toFixed(1)}s`}
              >
                <span className="truncate">
                  Deficit: -{Math.abs(deltaSec).toFixed(1)}s ({Math.abs(Math.round(deltaSec * frameRate))} frames needed)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Legend & Telemetry Status Breakdown */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Legend Indicators */}
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Ready ({readyShotsCount}/{sortedShots.length})</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Pending</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Script Target ({scriptDoctorTargetMin.toFixed(1)}m)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Dialogue Duration ({formatMinSec(dialogueLinesEstSec)})</span>
            </div>
          </div>

          {/* View Mode Pill Switcher */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 font-mono text-[10px]">
            <button
              onClick={() => setViewMode('proportional')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                viewMode === 'proportional'
                  ? 'bg-amber-950 text-amber-300 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Proportional to seconds duration"
            >
              Proportional
            </button>
            <button
              onClick={() => setViewMode('segmented')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                viewMode === 'segmented'
                  ? 'bg-amber-950 text-amber-300 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Equal segmented shot blocks"
            >
              Equal Segments
            </button>
          </div>
        </div>
      </div>

      {/* Selected Shot Live Duration Adjuster & Stepper */}
      {activeSelectedShot && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-amber-400">
              Selected: Shot #{activeSelectedShot.shotNumber}
            </span>
            <span className="text-slate-500 font-sans">
              ({activeSelectedShot.shotType || 'Medium Shot'}, {activeSelectedShot.cameraMovement || 'Static'})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400 text-[11px]">Duration:</span>
            {editingShotId === activeSelectedShot.id ? (
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="120"
                  value={editDurationValue}
                  onChange={(e) => setEditDurationValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCommitSingleShotDuration(activeSelectedShot.id);
                    if (e.key === 'Escape') setEditingShotId(null);
                  }}
                  className="w-16 px-1.5 py-0.5 bg-slate-900 border border-amber-500 text-amber-300 text-xs rounded font-mono focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => handleCommitSingleShotDuration(activeSelectedShot.id)}
                  className="p-1 text-emerald-400 hover:bg-emerald-950 rounded cursor-pointer"
                  title="Save duration"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEditingShotId(null)}
                  className="p-1 text-slate-500 hover:bg-slate-800 rounded cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 font-mono">
                <button
                  onClick={() => {
                    if (onUpdateShotDuration) {
                      onUpdateShotDuration(activeSelectedShot.id, Math.max(0.5, (activeSelectedShot.durationSec || 3) - 0.5));
                    }
                  }}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-700 cursor-pointer"
                  title="Decrease 0.5s"
                >
                  <Minus className="w-3 h-3" />
                </button>
                
                <span
                  onClick={() => {
                    setEditingShotId(activeSelectedShot.id);
                    setEditDurationValue(String(activeSelectedShot.durationSec || 3));
                  }}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-bold hover:border-amber-500 cursor-pointer flex items-center space-x-1"
                  title="Click to type exact duration"
                >
                  <span>{(activeSelectedShot.durationSec || 3).toFixed(1)}s</span>
                  <Edit3 className="w-2.5 h-2.5 text-slate-500" />
                </span>

                <button
                  onClick={() => {
                    if (onUpdateShotDuration) {
                      onUpdateShotDuration(activeSelectedShot.id, Math.min(120, (activeSelectedShot.durationSec || 3) + 0.5));
                    }
                  }}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 cursor-pointer"
                  title="Increase 0.5s"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expandable Pacing Tools & Micro-Adjustments Drawer */}
      {showQuickAdjust && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Script Doctor Alignment & Pacing Tools</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Target: {scriptDoctorTargetMin.toFixed(1)}m ({scriptDoctorTargetSec}s) | Current: {aggregatedShotsDurationSec.toFixed(1)}s
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {/* Action 1: Auto-Scale Shots to Target */}
            <button
              onClick={handleScaleToTarget}
              disabled={!onBatchScaleShots || sortedShots.length === 0}
              className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-950 to-slate-900 hover:from-indigo-900 hover:to-slate-800 text-indigo-200 border border-indigo-700/60 font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
              title="Proportionately scales all shots in this scene so their total duration matches the Script Doctor target"
            >
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              <span>Fit Shots to Script Doctor ({scriptDoctorTargetMin.toFixed(1)}m)</span>
            </button>

            {/* Action 2: Add +0.5s to all shots */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  if (onUpdateShotDuration) {
                    sortedShots.forEach(s => onUpdateShotDuration(s.id, Math.max(0.5, (s.durationSec || 3) - 0.5)));
                  }
                }}
                className="flex-1 flex items-center justify-center space-x-1 px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono transition-all cursor-pointer"
                title="Subtract 0.5s from each shot in scene"
              >
                <Minus className="w-3 h-3 text-rose-400" />
                <span>-0.5s All</span>
              </button>
              <button
                onClick={() => {
                  if (onUpdateShotDuration) {
                    sortedShots.forEach(s => onUpdateShotDuration(s.id, (s.durationSec || 3) + 0.5));
                  }
                }}
                className="flex-1 flex items-center justify-center space-x-1 px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono transition-all cursor-pointer"
                title="Add 0.5s to each shot in scene"
              >
                <Plus className="w-3 h-3 text-emerald-400" />
                <span>+0.5s All</span>
              </button>
            </div>

            {/* Action 3: Set standard 3.5s anime take duration */}
            <button
              onClick={() => {
                if (onUpdateShotDuration) {
                  sortedShots.forEach(s => onUpdateShotDuration(s.id, 3.5));
                }
              }}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-800/60 font-mono text-xs transition-all cursor-pointer"
              title="Reset all shots to 3.5 seconds standard anime keyframe take"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Standardize to 3.5s</span>
            </button>
          </div>

          {/* Explanatory Note */}
          <div className="flex items-start space-x-2 text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p>
              {pacingStatus === 'rushed' && (
                <span>
                  <strong>Pacing Notice:</strong> Current visual storyboard is shorter than Script Doctor target by {Math.abs(deltaSec).toFixed(1)}s. Consider expanding shot lengths or adding reaction cutaways for dialogue lines.
                </span>
              )}
              {pacingStatus === 'extended' && (
                <span>
                  <strong>Pacing Notice:</strong> Storyboard duration exceeds Script Doctor target by {deltaSec.toFixed(1)}s. This provides a slower, more deliberate cinematic pace.
                </span>
              )}
              {pacingStatus === 'balanced' && (
                <span>
                  <strong>Golden Ratio:</strong> Storyboard timing is balanced within the optimal tolerance window for Script Doctor scene pacing!
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

