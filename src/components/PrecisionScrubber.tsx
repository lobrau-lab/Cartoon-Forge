import React, { useEffect, useRef, useState } from 'react';
import { ShotItem } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Keyboard, 
  Clock, 
  Film,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Cpu,
  Monitor,
  Video,
  Layers,
  Sparkles
} from 'lucide-react';

interface PrecisionScrubberProps {
  shots: ShotItem[];
  selectedShotId: string | null;
  onSelectShot: (id: string) => void;
}

export const PrecisionScrubber: React.FC<PrecisionScrubberProps> = ({
  shots,
  selectedShotId,
  onSelectShot
}) => {
  const [scrubTime, setScrubTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 1.5x, 2x, 0.5x
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState<boolean>(true);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Calculate cumulative times for each shot
  let cumulativeTime = 0;
  const shotTimeRanges = shots.map((shot, idx) => {
    const start = cumulativeTime;
    const duration = shot.durationSec || 3;
    const end = cumulativeTime + duration;
    cumulativeTime = end;
    return {
      id: shot.id,
      index: idx,
      start,
      end,
      duration,
      shot
    };
  });

  const totalDuration = cumulativeTime;

  // 2. Active Shot and Range based on current selectedShotId
  const activeRangeIndex = shotTimeRanges.findIndex(r => r.id === selectedShotId);
  const activeRange = activeRangeIndex !== -1 ? shotTimeRanges[activeRangeIndex] : null;

  // 3. Sync scrubTime when selectedShotId changes externally (e.g. when clicking a grid card)
  useEffect(() => {
    if (activeRange) {
      // If the current scrubTime is outside the newly selected shot's range, snap to the start of it
      if (scrubTime < activeRange.start || scrubTime >= activeRange.end) {
        setScrubTime(activeRange.start);
      }
    } else if (shotTimeRanges.length > 0 && selectedShotId === null) {
      // Default to first shot
      onSelectShot(shotTimeRanges[0].id);
      setScrubTime(0);
    }
  }, [selectedShotId]);

  // 4. Update the selected shot when scrubTime is adjusted manually
  const handleTimeScrub = (newTime: number) => {
    const clampedTime = Math.max(0, Math.min(totalDuration, newTime));
    setScrubTime(clampedTime);

    // Find which shot corresponds to this time
    const matchingRange = shotTimeRanges.find(
      r => clampedTime >= r.start && clampedTime < r.end
    ) || shotTimeRanges[shotTimeRanges.length - 1]; // Fallback to last shot if right at the end

    if (matchingRange && matchingRange.id !== selectedShotId) {
      onSelectShot(matchingRange.id);
    }
  };

  // 5. Playback Engine
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = 100; // 10 ticks per second
      playbackIntervalRef.current = setInterval(() => {
        setScrubTime((prevTime) => {
          const nextTime = prevTime + (intervalMs / 1000) * playbackSpeed;
          if (nextTime >= totalDuration) {
            setIsPlaying(false);
            if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
            return 0; // Reset to start
          }
          
          // Sync active shot during play
          const matchingRange = shotTimeRanges.find(
            r => nextTime >= r.start && nextTime < r.end
          ) || shotTimeRanges[shotTimeRanges.length - 1];

          if (matchingRange && matchingRange.id !== selectedShotId) {
            onSelectShot(matchingRange.id);
          }

          return nextTime;
        });
      }, intervalMs);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, totalDuration, selectedShotId, shots]);

  // 6. Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (shotTimeRanges.length === 0) return;

      const currentIndex = shotTimeRanges.findIndex(r => r.id === selectedShotId);

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            // Jump to the next shot boundary
            const nextIndex = currentIndex === -1 ? 0 : Math.min(shotTimeRanges.length - 1, currentIndex + 1);
            onSelectShot(shotTimeRanges[nextIndex].id);
            setScrubTime(shotTimeRanges[nextIndex].start);
          } else {
            // Precision scrub forward by 0.25 seconds
            handleTimeScrub(scrubTime + 0.25);
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            // Jump to the previous shot boundary
            const prevIndex = currentIndex === -1 ? 0 : Math.max(0, currentIndex - 1);
            onSelectShot(shotTimeRanges[prevIndex].id);
            setScrubTime(shotTimeRanges[prevIndex].start);
          } else {
            // Precision scrub backward by 0.25 seconds
            handleTimeScrub(scrubTime - 0.25);
          }
          break;

        case ' ':
          // Toggle Playback with Spacebar
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scrubTime, selectedShotId, shotTimeRanges]);

  // Helper to format time into Timecode: MM:SS.CC (Minutes, Seconds, Centiseconds)
  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const centis = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  if (shots.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
        <Film className="w-8 h-8 text-slate-600 mx-auto" />
        <h4 className="text-sm font-bold text-slate-400">Scrubber Offline</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Please add shots to the current scene to activate precision timeline scrubbing.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 border border-amber-500/25 rounded-2xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
      {/* Visual Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/10 via-amber-500 to-rose-500/10" />

      {/* Header Info Block */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/80">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-200">
                Precision Frame Scrubber
              </h4>
              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                Keyframe {activeRange ? activeRange.index + 1 : 0} of {shots.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive timeline for manual sequence verification and micro-timing adjustments
            </p>
          </div>
        </div>

        {/* Keyboard Shortcut Map Helper */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsKeyboardHelpOpen(!isKeyboardHelpOpen)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded border text-[11px] font-medium transition-all ${
              isKeyboardHelpOpen
                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{isKeyboardHelpOpen ? 'Hide Hotkeys' : 'Show Hotkeys'}</span>
          </button>
        </div>
      </div>

      {/* Interactive HUD Details & Preview */}
      {activeRange && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
          {/* active shot image preview with high tech overlay */}
          <div className="lg:col-span-5 relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
            <img
              src={activeRange.shot.keyframeUrl || 'https://picsum.photos/seed/keyframe/600/338'}
              alt={activeRange.shot.actionPrompt}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-all duration-300"
            />
            
            {/* High tech camera frame bounds */}
            <div className="absolute inset-2 border border-slate-400/10 pointer-events-none rounded" />
            <div className="absolute top-2 left-2 flex items-center space-x-1 bg-slate-950/80 backdrop-blur px-1.5 py-0.5 rounded text-[9px] font-mono text-rose-500 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>REC</span>
            </div>

            <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 font-bold">
              SHOT {activeRange.index + 1} / {shots.length}
            </div>

            <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 font-bold">
              {activeRange.shot.shotType}
            </div>
          </div>

          {/* metadata layout */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">
                  Active Frame Prompt Details
                </span>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Time Slice: {activeRange.start.toFixed(1)}s - {activeRange.end.toFixed(1)}s
                </span>
              </div>
              <p className="text-xs text-slate-100 font-sans leading-relaxed line-clamp-3 bg-slate-950 p-2.5 rounded-lg border border-slate-900 italic">
                "{activeRange.shot.actionPrompt}"
              </p>
            </div>

            {/* active technical telemetry */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono">
              <div className="bg-slate-950/80 p-2 rounded border border-slate-900">
                <div className="text-slate-500 font-bold text-[9px]">CAMERA MOVEMENT</div>
                <div className="text-amber-400 font-extrabold mt-0.5 flex items-center gap-1">
                  <Video className="w-3 h-3 flex-shrink-0 text-slate-500" />
                  <span>{activeRange.shot.cameraMovement}</span>
                </div>
              </div>
              <div className="bg-slate-950/80 p-2 rounded border border-slate-900">
                <div className="text-slate-500 font-bold text-[9px]">SHOT DURATION</div>
                <div className="text-cyan-400 font-extrabold mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 flex-shrink-0 text-slate-500" />
                  <span>{activeRange.duration.toFixed(1)}s</span>
                </div>
              </div>
              <div className="bg-slate-950/80 p-2 rounded border border-slate-900 col-span-2">
                <div className="text-slate-500 font-bold text-[9px]">TRANSITION STATE</div>
                <div className="text-slate-300 font-extrabold mt-0.5 flex items-center gap-1">
                  <Layers className="w-3 h-3 flex-shrink-0 text-slate-500" />
                  <span>{activeRange.shot.transition || 'Cut (Standard)'}</span>
                </div>
              </div>
            </div>

            {/* dialogue segment if exists */}
            {activeRange.shot.dialogueLine && (
              <div className="text-xs bg-cyan-950/30 border border-cyan-900/60 text-cyan-400 px-3 py-1.5 rounded-lg font-serif italic">
                Dialogue: "{activeRange.shot.dialogueLine}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keyboard Shortcut HUD Drawer */}
      {isKeyboardHelpOpen && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono text-slate-300 animate-slideDown">
          <div className="flex items-center space-x-2.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400 font-bold shadow-sm">
              Spacebar
            </span>
            <span className="text-slate-400">Play / Pause simulation</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400 font-bold shadow-sm">
              ← / →
            </span>
            <span className="text-slate-400">Micro-scrub frames (0.25s)</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400 font-bold shadow-sm">
              Shift + ← / →
            </span>
            <span className="text-slate-400">Jump previous/next keyframe</span>
          </div>
        </div>
      )}

      {/* Playback Controls & Timecode HUD */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 border border-slate-800/80 rounded-xl p-3">
        {/* Playback controls */}
        <div className="flex items-center space-x-2">
          {/* Go to start */}
          <button
            type="button"
            onClick={() => handleTimeScrub(0)}
            className="p-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all"
            title="Snap to timeline start"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Toggle playback */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2.5 rounded-lg border text-slate-950 font-bold transition-all shadow-md ${
              isPlaying 
                ? 'bg-rose-500 border-rose-400 hover:bg-rose-400 text-slate-950'
                : 'bg-amber-500 border-amber-400 hover:bg-amber-400 text-slate-950'
            }`}
            title={isPlaying ? "Pause sequence simulation" : "Play sequence simulation"}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          {/* Go to end */}
          <button
            type="button"
            onClick={() => handleTimeScrub(totalDuration)}
            className="p-2 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all"
            title="Snap to timeline end"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed selectors */}
          <div className="flex items-center bg-slate-950 border border-slate-900 rounded-lg p-0.5 ml-2 font-mono text-[10px]">
            {([0.5, 1, 1.5, 2] as const).map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-1 rounded transition-all ${
                  playbackSpeed === speed
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Live timecode and progress */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
              CURRENT TIMECODE
            </div>
            <div className="text-base font-mono font-bold text-amber-400 leading-none mt-1">
              {formatTimecode(scrubTime)}
            </div>
          </div>
          
          <div className="h-8 w-px bg-slate-800" />

          <div>
            <div className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
              TOTAL RUNTIME
            </div>
            <div className="text-base font-mono font-bold text-slate-300 leading-none mt-1">
              {formatTimecode(totalDuration)}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive scrubbing rail & timeline ticker */}
      <div className="space-y-2">
        {/* Timeline Slider Rail */}
        <div className="relative pt-4">
          {/* Custom slider inputs with tick overlays */}
          <input
            type="range"
            min="0"
            max={totalDuration}
            step="0.05"
            value={scrubTime}
            onChange={(e) => handleTimeScrub(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-ew-resize h-2 bg-slate-900 rounded-lg border border-slate-800/80"
          />

          {/* Segment marks representing shot boundaries */}
          <div className="absolute top-4 left-0 w-full h-2 pointer-events-none flex">
            {shotTimeRanges.map((range, idx) => {
              const widthPct = (range.duration / totalDuration) * 100;
              return (
                <div 
                  key={range.id} 
                  className={`h-full border-r border-slate-950 relative flex items-center justify-center`}
                  style={{ width: `${widthPct}%` }}
                >
                  {/* Subtle tick at transition */}
                  {idx < shotTimeRanges.length - 1 && (
                    <div className="absolute right-0 top-0 h-4 w-px bg-amber-500/50" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Time code strip tick overlay */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1 px-1">
          <span>00:00.0s</span>
          {shotTimeRanges.map((range, idx) => {
            if (idx === 0) return null;
            return (
              <span key={range.id} className="hidden md:inline text-slate-600">
                {range.start.toFixed(1)}s (S{idx + 1})
              </span>
            );
          })}
          <span>{totalDuration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Visual Filmstrip thumbnails below the scrubbing timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-amber-500" />
            <span>Interactive Visual Filmstrip Track</span>
          </span>
          <span className="text-[9px] text-slate-500 font-mono">
            Click thumbnail to jump playhead directly to shot start
          </span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar bg-slate-950 p-2 rounded-xl border border-slate-905">
          {shotTimeRanges.map((range) => {
            const isSelected = selectedShotId === range.id;
            return (
              <div
                key={range.id}
                onClick={() => {
                  onSelectShot(range.id);
                  setScrubTime(range.start);
                }}
                className={`relative flex-shrink-0 w-24 aspect-video rounded-md overflow-hidden cursor-pointer transition-all border ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-500/30 scale-[1.03] opacity-100 z-10 shadow-lg'
                    : 'border-slate-800 opacity-60 hover:opacity-100 hover:scale-[1.01]'
                }`}
              >
                <img
                  src={range.shot.keyframeUrl || 'https://picsum.photos/seed/keyframe/100/56'}
                  alt={range.shot.actionPrompt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                
                {/* Visual indicator for current time overlay on strip */}
                {isSelected && (
                  <div className="absolute inset-0 bg-amber-500/10 pointer-events-none" />
                )}

                {/* Shot tag */}
                <div className="absolute bottom-0.5 left-1 bg-slate-950/80 px-1 py-0.2 rounded text-[8px] font-mono text-slate-300">
                  #{range.index + 1}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
