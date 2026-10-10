import React, { useState, useMemo } from 'react';
import { ScriptScene, EpisodeProject, ShotItem } from '../types';
import { 
  Palette, 
  Sparkles, 
  Copy, 
  Check, 
  Sun, 
  Moon, 
  Layers, 
  Flame, 
  Zap, 
  Eye, 
  Sliders, 
  RefreshCw, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  Film,
  ArrowRight,
  Split
} from 'lucide-react';
import { 
  analyzeSceneMood, 
  MoodPaletteProfile, 
  MOOD_PALETTE_DATABASE, 
  buildFormattedVisualThemeNote,
  normalizeEmotionToMood
} from '../utils/moodColorCorrelationEngine';

interface MoodColorPaletteSuggesterProps {
  scene: ScriptScene;
  project: EpisodeProject;
  onUpdateScene: (updatedScene: ScriptScene) => void;
  onUpdateProjectShots?: (updatedShots: ShotItem[]) => void;
}

export const MoodColorPaletteSuggester: React.FC<MoodColorPaletteSuggesterProps> = ({
  scene,
  project,
  onUpdateScene,
  onUpdateProjectShots
}) => {
  const [selectedInterpretation, setSelectedInterpretation] = useState<
    'resonant' | 'dramaticClash' | 'cinematicAtmosphere' | 'retroCelVhs'
  >('resonant');

  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [applyMode, setApplyMode] = useState<'append' | 'replace'>('append');
  const [isAppliedSuccess, setIsAppliedSuccess] = useState(false);
  const [isPropagatedSuccess, setIsPropagatedSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [overrideEmotion, setOverrideEmotion] = useState<string | null>(null);

  // Analyze the scene's dialogue emotions
  const analysis = useMemo(() => {
    let lines = scene.dialogue || [];
    if (overrideEmotion) {
      lines = [{ id: 'override', durationEst: 3, character: 'WRITER OVERRIDE', line: 'Manual mood override', emotion: overrideEmotion }];
    }
    return analyzeSceneMood(lines);
  }, [scene.dialogue, overrideEmotion]);

  // Active palette profile according to selected tab
  const activeProfile: MoodPaletteProfile = useMemo(() => {
    return analysis.suggestedProfiles[selectedInterpretation] || analysis.suggestedProfiles.resonant;
  }, [analysis, selectedInterpretation]);

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1800);
  };

  const handleApplyToSceneNotes = () => {
    const formattedNotes = buildFormattedVisualThemeNote(
      activeProfile,
      scene.styleNotes,
      applyMode
    );

    const updatedScene: ScriptScene = {
      ...scene,
      styleNotes: formattedNotes,
      visualThemeNotes: activeProfile.visualThemeNoteTemplate,
      colorPalette: activeProfile.swatches.map(s => s.hex),
      dominantEmotion: activeProfile.dominantMood
    };

    onUpdateScene(updatedScene);
    setIsAppliedSuccess(true);
    setTimeout(() => setIsAppliedSuccess(false), 2400);
  };

  const handlePropagateToShots = () => {
    if (!onUpdateProjectShots) return;

    const sceneShots = project.shots.filter(s => s.sceneNumber === scene.sceneNumber);
    if (sceneShots.length === 0) return;

    const updatedShots = project.shots.map(shot => {
      if (shot.sceneNumber !== scene.sceneNumber) return shot;

      const lightingDesc = `${activeProfile.lightingProfile.keyType} (${activeProfile.lightingProfile.contrastRatio}, ${activeProfile.lightingProfile.kelvin})`;
      const primaryColorName = activeProfile.swatches[0]?.name || 'Crimson';
      const secondaryColorName = activeProfile.swatches[1]?.name || 'Amber';
      
      // Inject color anchor into directorNotes and lightingCondition
      const existingNotes = shot.directorNotes ? `${shot.directorNotes} | ` : '';
      const newDirectorNotes = `${existingNotes}Palette: ${activeProfile.name} [${primaryColorName}, ${secondaryColorName}]`;

      return {
        ...shot,
        lightingCondition: lightingDesc,
        directorNotes: newDirectorNotes
      };
    });

    onUpdateProjectShots(updatedShots);
    setIsPropagatedSuccess(true);
    setTimeout(() => setIsPropagatedSuccess(false), 2400);
  };

  const quickEmotionList = [
    { label: 'Urgent', color: '#E11D48', key: 'urgent' },
    { label: 'Fierce', color: '#DC2626', key: 'fierce' },
    { label: 'Melancholic', color: '#1E40AF', key: 'melancholic' },
    { label: 'Cold', color: '#06B6D4', key: 'cold' },
    { label: 'Tender', color: '#F43F5E', key: 'tender' },
    { label: 'Whisper', color: '#581C87', key: 'whisper' },
    { label: 'Hopeful', color: '#FACC15', key: 'hopeful' },
    { label: 'Desperate', color: '#84CC16', key: 'desperate' },
    { label: 'Sinister', color: '#15803D', key: 'sinister' },
    { label: 'Solemn', color: '#6D28D9', key: 'solemn' }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-pink-500/20 border border-indigo-500/40 text-pink-400">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-1.5 font-mono">
                Dialogue Emotion → Mood Color Palette Suggester
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                SCENE #{scene.sceneNumber}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Correlating spoken character emotion fields into anime lighting, LUT palettes, and visual theme notes
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {overrideEmotion && (
            <button
              onClick={() => setOverrideEmotion(null)}
              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline"
            >
              Reset to Dialogue Stream
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-750 transition"
            title={isExpanded ? 'Collapse Palette Studio' : 'Expand Palette Studio'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-6">
          {/* Section 1: Detected Emotional Flow & Spectrum */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850 pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Dialogue Emotional Spectrum:
                </span>
                <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                  Dominant: {analysis.dominantEmotion}
                </span>
              </div>

              {analysis.isEmotionalClash && (
                <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800 text-[10px] font-bold font-mono animate-pulse">
                  <Split className="w-3 h-3 text-purple-400" />
                  <span>EMOTIONAL CLASH DETECTED</span>
                </div>
              )}
            </div>

            {/* Chronological Dialogue Color Gradient Ribbon */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Scene Start (Beat 1)</span>
                <span>Scene Progression Arc</span>
                <span>Scene Climax / Outro</span>
              </div>
              <div 
                className="h-3 w-full rounded-full border border-slate-800 shadow-inner overflow-hidden transition-all duration-700"
                style={{
                  background: analysis.gradientStops.length > 1
                    ? `linear-gradient(to right, ${analysis.gradientStops.join(', ')})`
                    : analysis.gradientStops[0] || '#E11D48'
                }}
              />
            </div>

            {/* Emotional Breakdown Distribution Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-500 font-mono">Dialogue Breakdown:</span>
              {analysis.emotionalBreakdown.map((item, idx) => (
                <div 
                  key={idx}
                  className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="font-bold text-slate-200">{item.emotion}:</span>
                  <span className="text-cyan-400 font-bold">{item.percentage}%</span>
                  <span className="text-slate-500 text-[9px]">({item.count} lines)</span>
                </div>
              ))}
            </div>

            {/* Quick Test / Manual Emotion Override Filter */}
            <div className="pt-2 border-t border-slate-850 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-mono mr-1">Quick Mood Pin:</span>
              {quickEmotionList.map(item => (
                <button
                  key={item.key}
                  onClick={() => setOverrideEmotion(item.key)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium flex items-center space-x-1 transition border ${
                    overrideEmotion === item.key || (!overrideEmotion && normalizeEmotionToMood(analysis.dominantEmotion) === item.key)
                      ? 'bg-slate-800 text-white border-cyan-400 shadow-sm'
                      : 'bg-slate-950/70 text-slate-400 border-slate-850 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: 4 Stylistic Interpretations Selector Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Select Cinematic Interpretation:
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Active Style: {project.style.name}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => setSelectedInterpretation('resonant')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  selectedInterpretation === 'resonant'
                    ? 'bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-500 text-slate-100 shadow-lg ring-1 ring-indigo-500/50'
                    : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-750 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-1.5 text-indigo-400 mb-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Primary Match</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 truncate">Resonant Harmony</h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    Exact psychological color harmonic matching dominant emotion.
                  </p>
                </div>
                <div className="flex space-x-1 mt-2.5">
                  {analysis.suggestedProfiles.resonant.swatches.slice(0, 4).map((s, i) => (
                    <span key={i} className="w-3.5 h-3.5 rounded-full border border-slate-800" style={{ backgroundColor: s.hex }} />
                  ))}
                </div>
              </button>

              <button
                onClick={() => setSelectedInterpretation('dramaticClash')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  selectedInterpretation === 'dramaticClash'
                    ? 'bg-gradient-to-br from-purple-950/80 to-slate-900 border-purple-500 text-slate-100 shadow-lg ring-1 ring-purple-500/50'
                    : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-750 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-1.5 text-purple-400 mb-1">
                    <Split className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Sakuga Contrast</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 truncate">Dramatic Clash</h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    Dual split lighting contrasting opposing dialogue tensions.
                  </p>
                </div>
                <div className="flex space-x-1 mt-2.5">
                  {analysis.suggestedProfiles.dramaticClash.swatches.slice(0, 4).map((s, i) => (
                    <span key={i} className="w-3.5 h-3.5 rounded-full border border-slate-800" style={{ backgroundColor: s.hex }} />
                  ))}
                </div>
              </button>

              <button
                onClick={() => setSelectedInterpretation('cinematicAtmosphere')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  selectedInterpretation === 'cinematicAtmosphere'
                    ? 'bg-gradient-to-br from-cyan-950/80 to-slate-900 border-cyan-500 text-slate-100 shadow-lg ring-1 ring-cyan-500/50'
                    : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-750 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-1.5 text-cyan-400 mb-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Painterly Film</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 truncate">Atmospheric Film</h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    Tone-mapped Shinkai / KyoAni soft cinematic volumetric fog.
                  </p>
                </div>
                <div className="flex space-x-1 mt-2.5">
                  {analysis.suggestedProfiles.cinematicAtmosphere.swatches.slice(0, 4).map((s, i) => (
                    <span key={i} className="w-3.5 h-3.5 rounded-full border border-slate-800" style={{ backgroundColor: s.hex }} />
                  ))}
                </div>
              </button>

              <button
                onClick={() => setSelectedInterpretation('retroCelVhs')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  selectedInterpretation === 'retroCelVhs'
                    ? 'bg-gradient-to-br from-amber-950/80 to-slate-900 border-amber-500 text-slate-100 shadow-lg ring-1 ring-amber-500/50'
                    : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-750 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-1.5 text-amber-400 mb-1">
                    <Film className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Vintage 90s</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 truncate">90s Golden Cel VHS</h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    Hand-painted cel warmth, authentic analog grain, deep indigo shadows.
                  </p>
                </div>
                <div className="flex space-x-1 mt-2.5">
                  {analysis.suggestedProfiles.retroCelVhs.swatches.slice(0, 4).map((s, i) => (
                    <span key={i} className="w-3.5 h-3.5 rounded-full border border-slate-800" style={{ backgroundColor: s.hex }} />
                  ))}
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Interactive Color Swatches Display */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850 pb-2">
              <div>
                <h4 className="text-xs font-bold font-mono text-slate-200 flex items-center gap-2">
                  <span>{activeProfile.name}</span>
                  <span className="text-[10px] px-2 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {activeProfile.lutProfile}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {activeProfile.description}
                </p>
              </div>

              <div className="flex items-center space-x-1 text-[10px] font-mono text-slate-400">
                <span>Click swatch to copy hex</span>
              </div>
            </div>

            {/* 5-Color Swatch Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {activeProfile.swatches.map((swatch, idx) => {
                const isCopied = copiedHex === swatch.hex;
                return (
                  <div
                    key={idx}
                    onClick={() => handleCopyHex(swatch.hex)}
                    className="group bg-slate-900 border border-slate-800 hover:border-cyan-500 rounded-xl p-3 cursor-pointer transition shadow-md flex flex-col justify-between"
                  >
                    <div>
                      {/* Swatch Color Box */}
                      <div 
                        className="h-12 w-full rounded-lg mb-2 shadow-inner border border-white/10 flex items-center justify-center relative group-hover:scale-[1.02] transition"
                        style={{ backgroundColor: swatch.hex }}
                      >
                        {isCopied && (
                          <span className="px-2 py-0.5 rounded bg-black/80 text-emerald-400 text-[10px] font-bold font-mono flex items-center gap-1 shadow">
                            <Check className="w-3 h-3" /> Copied!
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-200 truncate">
                          {swatch.name}
                        </span>
                        <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-cyan-400 uppercase">
                          {swatch.role}
                        </span>
                      </div>

                      <div className="text-[10px] font-mono font-bold text-slate-400 mt-0.5 flex items-center justify-between">
                        <span>{swatch.hex}</span>
                        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400 transition" />
                      </div>
                    </div>

                    <p className="text-[9px] text-slate-500 mt-2 line-clamp-2 leading-relaxed border-t border-slate-800/80 pt-1.5">
                      {swatch.psychology}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Cinematography & Lighting Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lighting Profile Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold font-mono">
                <Sun className="w-4 h-4" />
                <span>Cinematic Lighting & Shadow Physics</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">COLOR TEMPERATURE</span>
                  <span className="text-slate-200 font-bold">{activeProfile.lightingProfile.kelvin}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">CONTRAST RATIO</span>
                  <span className="text-amber-300 font-bold">{activeProfile.lightingProfile.contrastRatio}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-start space-x-1.5">
                  <span className="text-slate-400 font-mono text-[10px] w-20 shrink-0">Key Light:</span>
                  <span className="text-slate-200 font-medium">{activeProfile.lightingProfile.keyType}</span>
                </div>
                <div className="flex items-start space-x-1.5">
                  <span className="text-slate-400 font-mono text-[10px] w-20 shrink-0">Shadow Tone:</span>
                  <span className="text-slate-300">{activeProfile.lightingProfile.shadowTone}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/90 p-2 rounded border border-slate-800">
                {activeProfile.lightingProfile.description}
              </p>
            </div>

            {/* Visual Theme Notes & Diffusion Anchors Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold font-mono">
                <Sparkles className="w-4 h-4" />
                <span>Visual Theme Directive & Prompt Anchor</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block">CEL-SHADING THEME DIRECTIVE:</span>
                <p className="text-xs text-slate-200 font-serif leading-relaxed bg-slate-900 p-2.5 rounded border border-slate-800/80 italic">
                  "{activeProfile.visualThemeNoteTemplate}"
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block">POSITIVE DIFFUSION TRIGGER ANCHORS:</span>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[10px] text-cyan-300 leading-normal select-all">
                  {activeProfile.diffusionTags.positive}
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Apply & Integrate into Scene Visual Theme Notes */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
                  Apply to Scene Visual Theme Notes
                </span>
                <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  <label className="cursor-pointer flex items-center space-x-1">
                    <input 
                      type="radio" 
                      name="applyMode" 
                      checked={applyMode === 'append'} 
                      onChange={() => setApplyMode('append')}
                      className="accent-cyan-500"
                    />
                    <span>Append</span>
                  </label>
                  <span className="text-slate-600">|</span>
                  <label className="cursor-pointer flex items-center space-x-1">
                    <input 
                      type="radio" 
                      name="applyMode" 
                      checked={applyMode === 'replace'} 
                      onChange={() => setApplyMode('replace')}
                      className="accent-cyan-500"
                    />
                    <span>Replace Block</span>
                  </label>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 max-w-xl">
                Writes color hex swatches, lighting ratio, and prompt directives directly into <code className="text-cyan-300">scene.styleNotes</code> and <code className="text-cyan-300">scene.visualThemeNotes</code>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onUpdateProjectShots && (
                <button
                  onClick={handlePropagateToShots}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 text-xs font-semibold transition"
                  title="Inject palette anchors into all storyboard shots of this scene"
                >
                  <Film className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {isPropagatedSuccess ? '✓ Propagated to Shots!' : 'Sync to Storyboard Shots'}
                  </span>
                </button>
              )}

              <button
                onClick={handleApplyToSceneNotes}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs shadow-lg transition"
              >
                {isAppliedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                    <span>✓ Injected into Scene Notes!</span>
                  </>
                ) : (
                  <>
                    <Palette className="w-4 h-4 text-slate-950" />
                    <span>Apply Color Palette to Scene</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
