import React, { useState } from 'react';
import { ShotItem, ScriptScene } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sparkles, 
  Play, 
  Camera, 
  ArrowRight, 
  Layers, 
  Clock, 
  Wand2, 
  Film, 
  Maximize2,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  Zap,
  Activity,
  Sliders
} from 'lucide-react';

interface SceneShotFlowVisualizerProps {
  shots: ShotItem[];
  scene: ScriptScene | undefined;
  selectedShotId: string | null;
  onSelectShot: (shotId: string) => void;
  onGenerateShotKeyframe: (shot: ShotItem) => Promise<void> | void;
  onRegenerateSingleShot?: (shot: ShotItem) => Promise<void> | void;
  isGenerating?: boolean;
}

export const SceneShotFlowVisualizer: React.FC<SceneShotFlowVisualizerProps> = ({
  shots,
  scene,
  selectedShotId,
  onSelectShot,
  onGenerateShotKeyframe,
  onRegenerateSingleShot,
  isGenerating = false
}) => {
  const [isRegeneratingFailed, setIsRegeneratingFailed] = useState<boolean>(false);
  const [regenerateProgress, setRegenerateProgress] = useState<{ current: number; total: number; activeShotId?: string } | null>(null);
  const [viewMode, setViewMode] = useState<'pipeline' | 'compact' | 'flowchart'>('pipeline');
  const [hoveredShotId, setHoveredShotId] = useState<string | null>(null);

  // Sort shots sequentially by shotNumber
  const sortedShots = [...shots].sort((a, b) => a.shotNumber - b.shotNumber);

  // Identify failed or unready shots
  const isShotReady = (shot: ShotItem) => {
    return shot.status === 'ready' && !!shot.keyframeUrl && shot.keyframeUrl.trim() !== '';
  };

  const isShotGenerating = (shot: ShotItem) => {
    return shot.status === 'generating';
  };

  const failedOrUnreadyShots = sortedShots.filter(s => !isShotReady(s));
  const readyShotsCount = sortedShots.filter(s => isShotReady(s)).length;
  const totalShotsCount = sortedShots.length;
  const readinessPercentage = totalShotsCount > 0 ? Math.round((readyShotsCount / totalShotsCount) * 100) : 0;
  const totalSceneDuration = sortedShots.reduce((acc, s) => acc + (s.durationSec || 3), 0);

  // Handler: Regenerate Failed Shots automatically triggers onGenerateShotKeyframe only for non-ready shots
  const handleRegenerateFailedShots = async () => {
    if (failedOrUnreadyShots.length === 0 || isRegeneratingFailed || isGenerating) return;

    setIsRegeneratingFailed(true);
    setRegenerateProgress({ current: 0, total: failedOrUnreadyShots.length });

    let completed = 0;
    for (const shot of failedOrUnreadyShots) {
      setRegenerateProgress({
        current: completed + 1,
        total: failedOrUnreadyShots.length,
        activeShotId: shot.id
      });
      onSelectShot(shot.id);
      
      try {
        if (onRegenerateSingleShot) {
          await onRegenerateSingleShot(shot);
        } else {
          await onGenerateShotKeyframe(shot);
        }
      } catch (err) {
        console.error(`Failed to regenerate keyframe for Shot #${shot.shotNumber}:`, err);
      }
      completed++;
    }

    setRegenerateProgress(null);
    setIsRegeneratingFailed(false);
  };

  const getStatusBadge = (shot: ShotItem) => {
    if (isShotReady(shot)) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950/90 text-emerald-400 border border-emerald-600/70 shadow-sm">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>READY</span>
        </span>
      );
    }
    if (isShotGenerating(shot) || regenerateProgress?.activeShotId === shot.id) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-950/90 text-amber-300 border border-amber-500/80 animate-pulse shadow-sm">
          <RefreshCw className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
          <span>DIFFUSING</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-950/90 text-rose-300 border border-rose-600/80 shadow-sm">
        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
        <span>UNREADY</span>
      </span>
    );
  };

  const getShotTypePillColor = (shotType: string) => {
    switch (shotType?.toLowerCase()) {
      case 'sakuga impact':
        return 'bg-purple-950/80 text-purple-300 border-purple-800';
      case 'extreme wide':
      case 'wide':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'close-up':
      case 'extreme close-up':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'dutch angle':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      default:
        return 'bg-slate-950/80 text-slate-300 border-slate-800';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 relative overflow-hidden backdrop-blur-md">
      {/* Top Header & Readiness Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-950 to-slate-900 text-indigo-400 border border-indigo-700/60 shadow-inner">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <span>Scene #{scene?.sceneNumber || 1} Sequential Shot Flow & Status Pipeline</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 font-mono border border-slate-800">
                {totalShotsCount} SHOTS · {totalSceneDuration.toFixed(1)}s TOTAL
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Visualizes chronological camera flow, transitions, and keyframe readiness states across this scene
            </p>
          </div>
        </div>

        {/* Controls & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'pipeline'
                  ? 'bg-amber-950 text-amber-300 font-bold border border-amber-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Horizontal sequential pipeline layout"
            >
              Pipeline
            </button>
            <button
              onClick={() => setViewMode('flowchart')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'flowchart'
                  ? 'bg-amber-950 text-amber-300 font-bold border border-amber-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Expanded flowchart graph with transition badges"
            >
              Flowchart
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-amber-950 text-amber-300 font-bold border border-amber-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dense matrix view"
            >
              Compact
            </button>
          </div>

          {/* Regenerate Failed Shots Button */}
          <button
            onClick={handleRegenerateFailedShots}
            disabled={failedOrUnreadyShots.length === 0 || isRegeneratingFailed || isGenerating}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-mono text-xs font-bold shadow-lg transition-all cursor-pointer ${
              failedOrUnreadyShots.length > 0
                ? 'bg-gradient-to-r from-rose-600 via-amber-600 to-orange-500 hover:opacity-90 text-white border border-rose-400/50 ring-2 ring-rose-500/20 active:scale-95'
                : 'bg-slate-950 text-slate-500 border border-slate-800 opacity-60 cursor-not-allowed'
            }`}
            title={
              failedOrUnreadyShots.length > 0
                ? `Automatically generate keyframes for ${failedOrUnreadyShots.length} unready shot(s)`
                : 'All shots in this scene are marked ready!'
            }
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRegeneratingFailed ? 'animate-spin text-white' : failedOrUnreadyShots.length > 0 ? 'text-amber-200' : 'text-slate-500'
              }`}
            />
            <span>
              {isRegeneratingFailed && regenerateProgress
                ? `Regenerating (${regenerateProgress.current}/${regenerateProgress.total})...`
                : failedOrUnreadyShots.length > 0
                ? `Regenerate Failed Shots (${failedOrUnreadyShots.length} Unready)`
                : 'All Scene Shots Ready (100%)'}
            </span>
          </button>
        </div>
      </div>

      {/* Progress & Metrics Health Bar */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2">
        <div className="flex flex-wrap items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-3">
            <span className="text-slate-400">Scene Readiness Health:</span>
            <span
              className={`font-bold ${
                readinessPercentage === 100
                  ? 'text-emerald-400'
                  : readinessPercentage > 50
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {readinessPercentage}% ({readyShotsCount}/{totalShotsCount} Shots Ready)
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
              <span>{readyShotsCount} Ready</span>
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
              <span>{failedOrUnreadyShots.length} Unready / Failed</span>
            </span>
          </div>
        </div>

        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 relative">
          <div
            className={`h-full transition-all duration-500 ${
              readinessPercentage === 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500'
            }`}
            style={{ width: `${readinessPercentage}%` }}
          />
        </div>
      </div>

      {/* Empty State */}
      {sortedShots.length === 0 && (
        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
          <Film className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-mono">No shots found for Scene #{scene?.sceneNumber || 1}.</p>
          <p className="text-[11px] text-slate-500 mt-1">Use "Generate Storyboard Shots" from Script tab or add custom shots.</p>
        </div>
      )}

      {/* PIPELINE VIEW */}
      {viewMode === 'pipeline' && sortedShots.length > 0 && (
        <div className="relative overflow-x-auto pb-4 pt-2 no-scrollbar">
          <div className="flex items-center min-w-max space-x-0 py-2">
            {sortedShots.map((shot, idx) => {
              const isSelected = selectedShotId === shot.id;
              const isReady = isShotReady(shot);
              const isGen = isShotGenerating(shot) || regenerateProgress?.activeShotId === shot.id;
              const isNext = idx < sortedShots.length - 1;
              const nextShot = isNext ? sortedShots[idx + 1] : null;
              const transitionType = shot.transition || (idx % 2 === 0 ? 'Cut' : 'Dissolve');

              return (
                <React.Fragment key={shot.id}>
                  {/* Shot Node Card */}
                  <div
                    onClick={() => onSelectShot(shot.id)}
                    onMouseEnter={() => setHoveredShotId(shot.id)}
                    onMouseLeave={() => setHoveredShotId(null)}
                    className={`w-64 rounded-xl border p-3 cursor-pointer transition-all duration-200 relative group shrink-0 ${
                      isSelected
                        ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/40 shadow-2xl scale-[1.02] z-20'
                        : isReady
                        ? 'bg-slate-950/90 border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900/90'
                        : 'bg-slate-950/90 border-rose-900/60 hover:border-rose-500 hover:bg-rose-950/20'
                    }`}
                  >
                    {/* Top Node Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[11px] font-bold font-mono text-amber-400">
                          #{shot.shotNumber}
                        </span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${getShotTypePillColor(shot.shotType)}`}>
                          {shot.shotType}
                        </span>
                      </div>
                      {getStatusBadge(shot)}
                    </div>

                    {/* Thumbnail Image Box */}
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-800 relative mb-2 group/img">
                      {shot.keyframeUrl ? (
                        <img
                          src={shot.keyframeUrl}
                          alt={`Shot #${shot.shotNumber}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-500 space-y-1">
                          <AlertTriangle className="w-5 h-5 text-rose-500/80" />
                          <span className="text-[9px] font-mono text-rose-400">No Keyframe Render</span>
                        </div>
                      )}

                      {/* Hover Overlay Button to trigger individual generation */}
                      <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center p-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onRegenerateSingleShot) {
                              onRegenerateSingleShot(shot);
                            } else {
                              onGenerateShotKeyframe(shot);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-[10px] flex items-center space-x-1 shadow-lg cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{isReady ? 'Re-Diffuse' : 'Generate Keyframe'}</span>
                        </button>
                      </div>

                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] font-mono text-slate-300 backdrop-blur">
                        {shot.durationSec}s
                      </div>
                    </div>

                    {/* Meta Specs & Camera */}
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-slate-500">Camera:</span>
                        <span className="text-slate-300 font-medium">{shot.cameraMovement}</span>
                      </div>
                      <div className="text-slate-300 line-clamp-2 text-[10px] leading-tight font-sans italic bg-slate-950/60 p-1.5 rounded border border-slate-900">
                        "{shot.actionPrompt}"
                      </div>
                    </div>
                  </div>

                  {/* Connecting Vector Arrow & Transition Node */}
                  {isNext && (
                    <div className="flex flex-col items-center justify-center px-2 shrink-0 z-10">
                      <div className="flex items-center space-x-1">
                        <div className="w-4 h-0.5 bg-gradient-to-r from-slate-700 to-amber-500/80" />
                        <div className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-400 shadow-sm flex items-center gap-1">
                          <span className="text-amber-400">➔</span>
                          <span>{transitionType}</span>
                        </div>
                        <div className="w-4 h-0.5 bg-gradient-to-r from-amber-500/80 to-slate-700" />
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 mt-1">
                        {shot.durationSec}s ➔ {nextShot?.durationSec}s
                      </span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* FLOWCHART VIEW */}
      {viewMode === 'flowchart' && sortedShots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
          {sortedShots.map((shot, idx) => {
            const isSelected = selectedShotId === shot.id;
            const isReady = isShotReady(shot);
            const isNext = idx < sortedShots.length - 1;
            const nextShot = isNext ? sortedShots[idx + 1] : null;

            return (
              <div
                key={shot.id}
                onClick={() => onSelectShot(shot.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400/40 shadow-xl'
                    : isReady
                    ? 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                    : 'bg-rose-950/20 border-rose-900/60 hover:border-rose-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-amber-950 border border-amber-800 text-amber-400 font-mono font-bold text-xs flex items-center justify-center">
                      {shot.shotNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      Shot #{shot.shotNumber}
                    </span>
                  </div>
                  {getStatusBadge(shot)}
                </div>

                <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-800 mb-2 relative">
                  {shot.keyframeUrl ? (
                    <img
                      src={shot.keyframeUrl}
                      alt={shot.actionPrompt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-rose-400 p-2 text-center">
                      <AlertTriangle className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-mono">Unready / Missing Frame</span>
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[9px] font-mono text-slate-300">
                    {shot.durationSec}s
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Type: <strong className="text-slate-200">{shot.shotType}</strong></span>
                    <span>Camera: <strong className="text-slate-200">{shot.cameraMovement}</strong></span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans line-clamp-2 italic bg-slate-950 p-2 rounded border border-slate-900">
                    "{shot.actionPrompt}"
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                    <span className="text-[10px] text-slate-500">
                      {isNext ? `Transition: ${shot.transition || 'Cut'} ➔ #${nextShot?.shotNumber}` : 'Final Scene Shot'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onRegenerateSingleShot) {
                          onRegenerateSingleShot(shot);
                        } else {
                          onGenerateShotKeyframe(shot);
                        }
                      }}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{isReady ? 'Re-render' : 'Render'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* COMPACT VIEW */}
      {viewMode === 'compact' && sortedShots.length > 0 && (
        <div className="divide-y divide-slate-800/80 bg-slate-950/90 rounded-xl border border-slate-800 overflow-hidden">
          {sortedShots.map((shot, idx) => {
            const isSelected = selectedShotId === shot.id;
            const isReady = isShotReady(shot);
            const isNext = idx < sortedShots.length - 1;

            return (
              <div
                key={shot.id}
                onClick={() => onSelectShot(shot.id)}
                className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-amber-950/40 border-l-4 border-amber-400'
                    : isReady
                    ? 'hover:bg-slate-900/60'
                    : 'bg-rose-950/10 hover:bg-rose-950/20'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="text-xs font-mono font-bold text-amber-400 w-8">
                    #{shot.shotNumber}
                  </span>

                  <div className="w-12 h-8 rounded bg-slate-900 overflow-hidden shrink-0 border border-slate-800">
                    {shot.keyframeUrl ? (
                      <img
                        src={shot.keyframeUrl}
                        alt={`Shot ${shot.shotNumber}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-rose-950/40 text-rose-400">
                        <AlertTriangle className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{shot.shotType}</span>
                      <span className="text-[10px] font-mono text-slate-500">· {shot.cameraMovement} · {shot.durationSec}s</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-md">
                      {shot.actionPrompt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {getStatusBadge(shot)}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRegenerateSingleShot) {
                        onRegenerateSingleShot(shot);
                      } else {
                        onGenerateShotKeyframe(shot);
                      }
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-mono font-bold flex items-center gap-1 border border-slate-800 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{isReady ? 'Regen' : 'Render'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
