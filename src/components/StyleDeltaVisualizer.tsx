import React, { useState, useMemo } from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts';
import { 
  Palette, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  ShieldCheck, 
  Wand2, 
  RotateCcw, 
  Eye, 
  Layers, 
  ArrowRight, 
  Zap, 
  Sun, 
  Users, 
  Terminal, 
  Check, 
  Copy, 
  Filter, 
  SlidersHorizontal,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { EpisodeProject, ProjectStyle, CharacterAnchor, ShotItem } from '../types';
import { 
  calculateShotStyleDelta, 
  calculateSceneStyleDeltaSummary, 
  calculateProjectStyleDeltaSummary,
  autoAdjustShot,
  batchAutoAdjustShots,
  ShotStyleDelta,
  SceneStyleDeltaSummary
} from '../utils/styleDeltaEngine';
import { registerRealTimeHeal } from '../utils/selfHealingEngine';

interface StyleDeltaVisualizerProps {
  project: EpisodeProject;
  selectedSceneNumber?: number;
  selectedShotId?: string;
  onSelectShot?: (shotId: string) => void;
  onSelectScene?: (sceneNumber: number) => void;
  onUpdateProject: (updated: Partial<EpisodeProject>) => void;
  compactMode?: boolean;
}

export const StyleDeltaVisualizer: React.FC<StyleDeltaVisualizerProps> = ({
  project,
  selectedSceneNumber,
  selectedShotId,
  onSelectShot,
  onSelectScene,
  onUpdateProject,
  compactMode = false
}) => {
  const [activeSceneNum, setActiveSceneNum] = useState<number>(selectedSceneNumber || project.scenes[0]?.sceneNumber || 1);
  const [activeSelectedShotId, setActiveSelectedShotId] = useState<string | null>(selectedShotId || null);
  const [sensitivityThreshold, setSensitivityThreshold] = useState<number>(20); // 20% delta threshold
  const [filterOnlyFlagged, setFilterOnlyFlagged] = useState<boolean>(false);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Sync props if parent changes selected scene or shot
  React.useEffect(() => {
    if (selectedSceneNumber && selectedSceneNumber !== activeSceneNum) {
      setActiveSceneNum(selectedSceneNumber);
    }
  }, [selectedSceneNumber]);

  React.useEffect(() => {
    if (selectedShotId) {
      setActiveSelectedShotId(selectedShotId);
    }
  }, [selectedShotId]);

  const currentStyle = project.style;
  const cast = project.cast || [];
  const shots = project.shots || [];

  // Project-wide calculation
  const projectSummary = useMemo(() => {
    return calculateProjectStyleDeltaSummary(project);
  }, [project]);

  // Active scene summary
  const sceneSummary = useMemo(() => {
    return calculateSceneStyleDeltaSummary(activeSceneNum, shots, currentStyle, cast);
  }, [activeSceneNum, shots, currentStyle, cast]);

  // Shots in active scene with delta analysis
  const sceneShotsWithDelta = useMemo(() => {
    const sceneShots = shots.filter(s => s.sceneNumber === activeSceneNum).sort((a, b) => a.shotNumber - b.shotNumber);
    return sceneShots.map(shot => calculateShotStyleDelta(shot, currentStyle, cast));
  }, [shots, activeSceneNum, currentStyle, cast]);

  // Filtered shot list based on flagged toggle
  const displayedShotDeltas = useMemo(() => {
    if (!filterOnlyFlagged) return sceneShotsWithDelta;
    return sceneShotsWithDelta.filter(d => d.overallDelta >= sensitivityThreshold);
  }, [sceneShotsWithDelta, filterOnlyFlagged, sensitivityThreshold]);

  // Set default selected shot if none
  const activeShotDelta = useMemo(() => {
    if (activeSelectedShotId) {
      const found = sceneShotsWithDelta.find(d => d.shotId === activeSelectedShotId);
      if (found) return found;
    }
    return sceneShotsWithDelta[0] || null;
  }, [sceneShotsWithDelta, activeSelectedShotId]);

  // Radar chart data mapping
  const radarChartData = useMemo(() => {
    const dimensionsList = [
      { key: 'lora', label: 'Style LoRA' },
      { key: 'lighting', label: 'Lighting' },
      { key: 'palette', label: 'Color Palette' },
      { key: 'characters', label: 'Cast Continuity' },
      { key: 'quality', label: 'Render Quality' },
      { key: 'guardrails', label: 'Preset Lock' }
    ];

    return dimensionsList.map(dim => {
      const sceneAvg = sceneSummary.dimensionAverages[dim.key as keyof typeof sceneSummary.dimensionAverages] || 100;
      const shotScore = activeShotDelta?.dimensions.find(d => d.key === dim.key)?.score ?? sceneAvg;

      return {
        subject: dim.label,
        SceneAverage: sceneAvg,
        SelectedShot: shotScore,
        TargetBaseline: 100
      };
    });
  }, [sceneSummary, activeShotDelta]);

  // Handle single shot auto-adjustment
  const handleApplyAutoAdjustment = (shotId: string, customPrompt?: string) => {
    const targetShot = shots.find(s => s.id === shotId);
    if (!targetShot) return;

    let updatedShot: ShotItem;
    if (customPrompt) {
      updatedShot = {
        ...targetShot,
        actionPrompt: customPrompt,
        renderingPreset: currentStyle.name
      };
    } else {
      updatedShot = autoAdjustShot(targetShot, currentStyle, cast);
    }

    const updatedShots = shots.map(s => s.id === shotId ? updatedShot : s);
    onUpdateProject({ shots: updatedShots });

    registerRealTimeHeal(
      'Styles',
      `Style Delta Auto-Adjustment applied to Shot #${targetShot.shotNumber}`,
      `Aligned prompt to "${currentStyle.name}" Master LoRA and lighting parameters.`
    );

    setActionSuccessMsg(`Aligned Shot #${targetShot.shotNumber} to Style Matrix!`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Handle granular patch adjustment
  const handleApplyGranularPatch = (shotId: string, patch: Partial<ShotItem>, adjustmentLabel: string) => {
    const targetShot = shots.find(s => s.id === shotId);
    if (!targetShot) return;

    const updatedShot: ShotItem = {
      ...targetShot,
      ...patch
    };

    const updatedShots = shots.map(s => s.id === shotId ? updatedShot : s);
    onUpdateProject({ shots: updatedShots });

    registerRealTimeHeal(
      'Styles',
      `Style Adjustment (${adjustmentLabel}) on Shot #${targetShot.shotNumber}`,
      `Updated parameters to harmonize with ${currentStyle.name}.`
    );

    setActionSuccessMsg(`Applied: ${adjustmentLabel}`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Handle batch scene auto-adjust
  const handleBatchAdjustScene = () => {
    const { updatedShots, adjustedCount } = batchAutoAdjustShots(
      shots,
      currentStyle,
      cast,
      sensitivityThreshold,
      activeSceneNum
    );

    onUpdateProject({ shots: updatedShots });

    registerRealTimeHeal(
      'Styles',
      `Batch Style Harmonization (Scene ${activeSceneNum})`,
      `Auto-adjusted ${adjustedCount} deviating shots to "${currentStyle.name}" Style Matrix.`
    );

    setActionSuccessMsg(`Successfully auto-aligned ${adjustedCount} shots in Scene ${activeSceneNum}!`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Handle batch project auto-adjust
  const handleBatchAdjustEntireProject = () => {
    const { updatedShots, adjustedCount } = batchAutoAdjustShots(
      shots,
      currentStyle,
      cast,
      sensitivityThreshold
    );

    onUpdateProject({ shots: updatedShots });

    registerRealTimeHeal(
      'Styles',
      `Project-Wide Style Harmonization`,
      `Auto-adjusted ${adjustedCount} shots across entire episode production to "${currentStyle.name}".`
    );

    setActionSuccessMsg(`Successfully auto-aligned all ${adjustedCount} deviating shots across entire episode!`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Copy prompt helper
  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  return (
    <div className={`space-y-6 ${compactMode ? 'p-1' : 'pb-6'}`}>
      {/* Top Banner & Telemetry Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Real-Time Aesthetic Drift Engine
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Active Anchor: <strong className="text-slate-200">{currentStyle.name}</strong>
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
              <Palette className="w-6 h-6 text-cyan-400" />
              Style Delta &amp; Visual Conformity Analyzer
            </h3>
            <p className="text-xs text-slate-400 max-w-xl font-sans">
              Real-time multi-vector diagnostic scanning storyboard prompts against Master LoRA weights, lighting matrices, character anchors, and color palettes.
            </p>
          </div>

          {/* Quick Telemetry Cards */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Project Conformity Gauge */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 flex items-center space-x-3">
              <Gauge className={`w-6 h-6 ${
                projectSummary.averageConformity >= 80 
                  ? 'text-emerald-400' 
                  : projectSummary.averageConformity >= 60 
                  ? 'text-amber-400' 
                  : 'text-rose-400'
              }`} />
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Project Conformity</span>
                <span className="text-sm font-mono font-bold text-slate-100">
                  {projectSummary.averageConformity}% <span className="text-[10px] font-normal text-slate-400">(Δ {projectSummary.averageDelta}%)</span>
                </span>
              </div>
            </div>

            {/* Flagged Shots Count Badge */}
            <div className={`border rounded-xl px-3.5 py-2 flex items-center space-x-3 ${
              projectSummary.flaggedShotsCount === 0
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}>
              {projectSummary.flaggedShotsCount === 0 ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <span className="text-[10px] font-mono uppercase block text-slate-400">Drift Status</span>
                <span className="text-xs font-mono font-bold">
                  {projectSummary.flaggedShotsCount === 0 ? 'Fully Synchronized' : `${projectSummary.flaggedShotsCount} Flagged Frames`}
                </span>
              </div>
            </div>

            {/* Batch Project Harmonize Button */}
            {projectSummary.flaggedShotsCount > 0 && (
              <button
                onClick={handleBatchAdjustEntireProject}
                className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Batch auto-adjust all deviating shots in the entire project to match the style matrix"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Auto-Align All ({projectSummary.flaggedShotsCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Scene Selector Sub-Bar & Sensitivity Slider */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-3.5 mt-4 text-xs">
          {/* Scene Switcher Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold mr-1">Scene:</span>
            {project.scenes.map(sc => {
              const scSummary = projectSummary.sceneSummaries.find(s => s.sceneNumber === sc.sceneNumber);
              const isSelected = activeSceneNum === sc.sceneNumber;
              const hasFlags = (scSummary?.moderateDriftCount || 0) + (scSummary?.criticalDeviationCount || 0) > 0;

              return (
                <button
                  key={sc.sceneNumber}
                  onClick={() => {
                    setActiveSceneNum(sc.sceneNumber);
                    if (onSelectScene) onSelectScene(sc.sceneNumber);
                  }}
                  className={`px-3 py-1 rounded-lg font-mono text-xs flex items-center space-x-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>Scene {sc.sceneNumber}</span>
                  {hasFlags && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-amber-400'}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Controls: Filter & Sensitivity */}
          <div className="flex items-center space-x-4">
            {/* Filter Flagged Only Toggle */}
            <button
              onClick={() => setFilterOnlyFlagged(!filterOnlyFlagged)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                filterOnlyFlagged
                  ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>{filterOnlyFlagged ? 'Showing Flagged Only' : 'Show All Frames'}</span>
            </button>

            {/* Sensitivity Threshold */}
            <div className="flex items-center space-x-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] font-mono text-slate-400">Drift Threshold:</span>
              <span className="font-mono text-xs font-bold text-cyan-300">Δ {sensitivityThreshold}%</span>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={sensitivityThreshold}
                onChange={(e) => setSensitivityThreshold(parseInt(e.target.value))}
                className="w-16 accent-cyan-400 cursor-pointer"
                title={`Sensitivity threshold: Flag frames with delta greater than ${sensitivityThreshold}%`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Success Toast Feedback */}
      {actionSuccessMsg && (
        <div className="bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 px-4 py-2.5 rounded-xl flex items-center space-x-2 font-mono text-xs shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* MAIN TWO-COLUMN DASHBOARD: Radar & Sequential Frame Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Multi-Vector Radar & Scene Telemetry */}
        <div className="lg:col-span-5 space-y-4">
          {/* Radar Chart Container */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-200 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span>6-Axis Style Consistency Radar</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                Scene #{activeSceneNum} Diagnostic
              </span>
            </div>

            {/* Radar Chart Component */}
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarChartData}>
                  <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} 
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fill: '#64748b', fontSize: 9 }} 
                  />
                  <Radar
                    name="Target Baseline (100%)"
                    dataKey="TargetBaseline"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.05}
                    strokeDasharray="4 4"
                  />
                  <Radar
                    name={`Scene #${activeSceneNum} Avg`}
                    dataKey="SceneAverage"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.25}
                  />
                  {activeShotDelta && (
                    <Radar
                      name={`Shot #${activeShotDelta.shotNumber}`}
                      dataKey="SelectedShot"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.35}
                    />
                  )}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: '#f8fafc'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Dimension Breakdown Micro-Bars */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
              {radarChartData.map(d => (
                <div key={d.subject} className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400 truncate mr-1">{d.subject}:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className={`font-bold ${
                      d.SelectedShot >= 80 ? 'text-emerald-400' : d.SelectedShot >= 55 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {d.SelectedShot}%
                    </span>
                    <span className="text-[9px] text-slate-500">(avg: {d.SceneAverage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scene Batch Action Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
            <div>
              <span className="text-xs font-bold text-slate-200 font-mono block">
                Scene #{activeSceneNum} Health: {sceneSummary.alignedShotsCount}/{sceneSummary.totalShots} Aligned
              </span>
              <span className="text-[10px] text-slate-400">
                Average Drift: Δ {sceneSummary.averageDelta}%
              </span>
            </div>

            <button
              onClick={handleBatchAdjustScene}
              disabled={sceneSummary.moderateDriftCount + sceneSummary.criticalDeviationCount === 0}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-100 font-bold font-mono text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Harmonize Scene #{activeSceneNum}</span>
            </button>
          </div>
        </div>

        {/* Right Column (7 cols): Sequential Shot Strip & Detailed Shot Delta Inspector */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sequential Shot Heatmap Strip */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Scene #{activeSceneNum} Storyboard Timeline ({sceneShotsWithDelta.length} Frames)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Click any frame to inspect style delta
              </span>
            </div>

            {/* Shot Grid / Horizontal Scroller */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
              {displayedShotDeltas.map(shotDelta => {
                const isSelected = activeShotDelta?.shotId === shotDelta.shotId;
                const isCritical = shotDelta.status === 'critical-deviation';
                const isModerate = shotDelta.status === 'moderate-drift';

                return (
                  <div
                    key={shotDelta.shotId}
                    onClick={() => {
                      setActiveSelectedShotId(shotDelta.shotId);
                      if (onSelectShot) onSelectShot(shotDelta.shotId);
                    }}
                    className={`p-2 rounded-xl border text-xs font-mono transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg'
                        : isCritical
                        ? 'bg-rose-950/30 border-rose-800/80 hover:border-rose-600'
                        : isModerate
                        ? 'bg-amber-950/30 border-amber-800/80 hover:border-amber-600'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-200">
                        #{shotDelta.shotNumber}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        isCritical
                          ? 'bg-rose-900/80 text-rose-300'
                          : isModerate
                          ? 'bg-amber-900/80 text-amber-300'
                          : 'bg-emerald-950 text-emerald-400'
                      }`}>
                        Δ {shotDelta.overallDelta}%
                      </span>
                    </div>

                    <p className="text-[10px] font-sans text-slate-400 line-clamp-2 my-1 leading-tight">
                      {shotDelta.actionPrompt || 'No action prompt'}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[9px]">
                      <span className="text-slate-500">{shotDelta.overallConformity}% match</span>
                      {shotDelta.deviationReasons.length > 0 ? (
                        <span className="text-amber-400 flex items-center gap-0.5" title={shotDelta.deviationReasons[0]}>
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>{shotDelta.deviationReasons.length} flags</span>
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" />
                          <span>OK</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Shot Detailed Delta Inspector */}
          {activeShotDelta ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              {/* Header for Selected Shot */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-amber-400">
                    Shot #{activeShotDelta.shotNumber} (Scene #{activeShotDelta.sceneNumber})
                  </span>
                  <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${
                    activeShotDelta.status === 'aligned'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : activeShotDelta.status === 'moderate-drift'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}>
                    Overall Conformity: <strong>{activeShotDelta.overallConformity}%</strong> (Drift: Δ {activeShotDelta.overallDelta}%)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleApplyAutoAdjustment(activeShotDelta.shotId)}
                    className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs font-mono px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Apply Master Harmonization</span>
                  </button>
                </div>
              </div>

              {/* Deviation Flags & Reasons */}
              {activeShotDelta.deviationReasons.length > 0 && (
                <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 space-y-1.5 text-xs">
                  <span className="font-mono font-bold text-amber-300 uppercase flex items-center gap-1.5 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Identified Aesthetic Deviations ({activeShotDelta.deviationReasons.length}):
                  </span>
                  <ul className="space-y-1 pl-4 list-disc text-amber-200/90 text-xs font-sans">
                    {activeShotDelta.deviationReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Side-by-Side Prompt Diff: Current vs Suggested */}
              <div className="space-y-3">
                {/* Current Prompt */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400 font-bold">CURRENT STORYBOARD PROMPT:</span>
                    <button
                      onClick={() => handleCopyPrompt(activeShotDelta.actionPrompt, 'current')}
                      className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-[10px]"
                    >
                      {copiedPromptId === 'current' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPromptId === 'current' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
                    {activeShotDelta.actionPrompt}
                  </div>
                </div>

                {/* Suggested Auto-Adjusted Prompt */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      SUGGESTED AUTO-ADJUSTED PROMPT (CONFORMITY: 100%):
                    </span>
                    <button
                      onClick={() => handleCopyPrompt(activeShotDelta.suggestedPrompt, 'suggested')}
                      className="text-cyan-400/80 hover:text-cyan-300 flex items-center gap-1 text-[10px]"
                    >
                      {copiedPromptId === 'suggested' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPromptId === 'suggested' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-cyan-500/40 font-mono text-xs text-cyan-200/90 leading-relaxed shadow-inner">
                    {activeShotDelta.suggestedPrompt}
                  </div>
                </div>
              </div>

              {/* Granular Adjustment Toggles */}
              {activeShotDelta.applicableAdjustments.length > 1 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-mono font-bold text-slate-300 block">
                    Selective Micro-Harmonizations:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeShotDelta.applicableAdjustments.slice(1).map((adj) => (
                      <div
                        key={adj.id}
                        className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2"
                      >
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold text-slate-200 font-sans block truncate">
                            {adj.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans block line-clamp-1">
                            {adj.description}
                          </span>
                        </div>
                        <button
                          onClick={() => handleApplyGranularPatch(activeShotDelta.shotId, adj.patch, adj.label)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono font-bold shrink-0 transition-all cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 font-mono text-xs">
              No shot selected. Click a frame from the storyboard timeline above to view its style delta breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
