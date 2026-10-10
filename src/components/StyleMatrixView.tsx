import React, { useState } from 'react';
import { 
  Palette, 
  Sparkles, 
  Sliders, 
  Users, 
  Sun, 
  Moon, 
  CheckCircle, 
  Copy, 
  Wand2, 
  Layers, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  Eye, 
  Film, 
  Plus, 
  Trash2,
  Lock,
  ArrowRight,
  Zap,
  SlidersHorizontal,
  Box,
  Terminal,
  Gauge
} from 'lucide-react';
import { EpisodeProject, ProjectStyle, CharacterAnchor, ShotItem } from '../types';
import { PRESET_STYLES } from '../data/sampleProjects';
import { StyleDeltaVisualizer } from './StyleDeltaVisualizer';
import { calculateProjectStyleDeltaSummary } from '../utils/styleDeltaEngine';

interface StyleMatrixViewProps {
  project: EpisodeProject;
  onUpdateProject: (updated: Partial<EpisodeProject>) => void;
}

export const StyleMatrixView: React.FC<StyleMatrixViewProps> = ({
  project,
  onUpdateProject
}) => {
  const [activeTabSection, setActiveTabSection] = useState<'matrix' | 'style-delta' | 'characters' | 'lighting' | 'compiler' | 'audit'>('matrix');
  
  // Local state for active style editing
  const currentStyle = project.style || PRESET_STYLES[0];
  const [styleForm, setStyleForm] = useState<ProjectStyle>(currentStyle);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [auditSuccessMsg, setAuditSuccessMsg] = useState<string | null>(null);

  // Project-wide Style Delta calculations
  const projectDeltaSummary = calculateProjectStyleDeltaSummary(project);

  // Prompt Compiler Workbench State
  const [selectedCompilerChar, setSelectedCompilerChar] = useState<string>(project.cast[0]?.id || '');
  const [selectedCompilerLighting, setSelectedCompilerLighting] = useState<string>('cyber-neon');
  const [selectedShotType, setSelectedShotType] = useState<string>('Medium Shot');
  const [compilerActionPrompt, setCompilerActionPrompt] = useState<string>('standing on a high-tech balcony overlooking the rain-soaked neo-tokyo cityscape at midnight');

  // Lighting Matrix Presets
  const LIGHTING_PRESETS = [
    {
      id: 'cyber-neon',
      name: 'Cyberpunk Neon Rim',
      tempK: 6500,
      contrast: 'Dramatic',
      description: 'High-contrast dual cyan and magenta rim light with dark background bokeh.',
      promptSuffix: 'cyberpunk neon rim lighting, cyan and magenta highlights, volumetric dark atmospheric fog'
    },
    {
      id: 'golden-hour',
      name: 'Golden Hour Sunset',
      tempK: 3200,
      contrast: 'Medium',
      description: 'Warm amber sunlight with soft lens flares and long gentle shadows.',
      promptSuffix: 'warm golden hour sunset lighting, soft lens flare, amber glow, gentle atmospheric rim light'
    },
    {
      id: 'gothic-rain',
      name: 'Gothic Noir Rain',
      tempK: 8000,
      contrast: 'High',
      description: 'Cool blue rainy atmosphere with intense shadow contrast and wet surface reflections.',
      promptSuffix: 'cold moonlight rain, high-contrast chiaroscuro shadows, wet ground reflections, gloomy volumetric mist'
    },
    {
      id: 'studio-cel',
      name: 'Clean Anime Studio Cel',
      tempK: 5500,
      contrast: 'Low',
      description: 'Evenly balanced bright studio key lighting for sharp line definition.',
      promptSuffix: 'bright clean anime studio key lighting, crisp cel shading lines, vibrant balanced colors'
    }
  ];

  // Sync form when project style changes
  React.useEffect(() => {
    setStyleForm(project.style || PRESET_STYLES[0]);
  }, [project.style]);

  // Handler to save style changes to project
  const handleSaveStyleConfig = (updatedStyle: ProjectStyle) => {
    setStyleForm(updatedStyle);
    onUpdateProject({ style: updatedStyle });
  };

  // Select a preset style
  const handleSelectPresetStyle = (preset: ProjectStyle) => {
    handleSaveStyleConfig(preset);
  };

  // Add custom color to style palette
  const handleAddPaletteColor = (colorHex: string) => {
    if (!colorHex) return;
    const updated = {
      ...styleForm,
      colorPalette: [...(styleForm.colorPalette || []), colorHex]
    };
    handleSaveStyleConfig(updated);
  };

  // Remove color from style palette
  const handleRemovePaletteColor = (index: number) => {
    const newPalette = [...(styleForm.colorPalette || [])];
    newPalette.splice(index, 1);
    const updated = { ...styleForm, colorPalette: newPalette };
    handleSaveStyleConfig(updated);
  };

  // Character Anchor attribute change helper
  const handleUpdateCharacterStyle = (charId: string, updates: Partial<CharacterAnchor>) => {
    const updatedCast = project.cast.map(c => c.id === charId ? { ...c, ...updates } : c);
    onUpdateProject({ cast: updatedCast });
  };

  // Compile full master prompt for selected test variables
  const activeCharObj = project.cast.find(c => c.id === selectedCompilerChar) || project.cast[0];
  const activeLightingObj = LIGHTING_PRESETS.find(l => l.id === selectedCompilerLighting) || LIGHTING_PRESETS[0];

  const compiledMasterPrompt = [
    styleForm.loraTag,
    activeCharObj ? activeCharObj.loraEmbedding : '',
    `${selectedShotType} of ${activeCharObj ? activeCharObj.name : 'character'}`,
    compilerActionPrompt,
    activeLightingObj.promptSuffix,
    `masterpiece, highest quality anime keyframe render, aspect ratio ${styleForm.aspectRatio}`
  ].filter(Boolean).join(', ');

  // Copy Master Prompt
  const handleCopyCompiledPrompt = () => {
    navigator.clipboard.writeText(compiledMasterPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Audit Shots for Style Drift
  const shotsOutofSync = project.shots.filter(shot => {
    const hasStyleLora = shot.actionPrompt.includes(styleForm.loraTag) || shot.actionPrompt.includes(styleForm.id);
    return !hasStyleLora;
  });

  // Enforce Art Direction Across All Project Shots
  const handleEnforceStyleAcrossShots = () => {
    const normalizedShots: ShotItem[] = project.shots.map(shot => {
      // Clean up legacy LoRA tags or prefix with current master style LoRA
      let cleanPrompt = shot.actionPrompt;
      if (!cleanPrompt.includes(styleForm.loraTag)) {
        cleanPrompt = `${styleForm.loraTag}, ${cleanPrompt}`;
      }
      return {
        ...shot,
        actionPrompt: cleanPrompt,
        renderingPreset: styleForm.name
      };
    });

    onUpdateProject({ shots: normalizedShots });
    setAuditSuccessMsg(`Successfully updated and locked all ${normalizedShots.length} shot prompts to style matrix "${styleForm.name}".`);
    setTimeout(() => setAuditSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Global Visual Anchor
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Episode Project: <strong className="text-slate-200">{project.title}</strong>
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
              <Palette className="w-7 h-7 text-cyan-400" />
              Styles &amp; Art Direction Matrix
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl font-sans">
              Centralized aesthetic control engine. Define LoRA weight anchors, character visual seeds, lighting conditions, color swatches, and prompt composition rules across your entire anime production.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleEnforceStyleAcrossShots}
              className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
            >
              <Wand2 className="w-4 h-4" />
              <span>Enforce Style Matrix Across All Shots</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation sub-bar */}
        <div className="flex items-center space-x-2 border-t border-slate-800/80 pt-4 mt-6 overflow-x-auto">
          {[
            { id: 'matrix', label: 'Master Style Presets', icon: Layers },
            { id: 'style-delta', label: 'Real-Time Style Delta', icon: Gauge, badge: projectDeltaSummary.flaggedShotsCount },
            { id: 'characters', label: 'Character Consistency Matrix', icon: Users },
            { id: 'lighting', label: 'Lighting & Atmosphere', icon: Sun },
            { id: 'compiler', label: 'AI Prompt Compiler', icon: Terminal },
            { id: 'audit', label: 'Art Direction Auditor', icon: ShieldCheck, badge: shotsOutofSync.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTabSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabSection(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
                    tab.id === 'style-delta' ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-amber-950 text-amber-400 border-amber-800'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {auditSuccessMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 p-4 rounded-xl flex items-center space-x-3 shadow-lg font-mono text-xs">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{auditSuccessMsg}</span>
        </div>
      )}

      {/* SECTION 1: MASTER STYLE PRESETS & ACTIVE CONFIG */}
      {activeTabSection === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Preset Selector Grid */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Preset Style Libraries ({PRESET_STYLES.length})</span>
            </h3>

            <div className="space-y-3">
              {PRESET_STYLES.map((preset) => {
                const isSelected = styleForm.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPresetStyle(preset)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/30 shadow-xl'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          {preset.name}
                          {isSelected && (
                            <span className="text-[9px] bg-cyan-950 text-cyan-400 font-mono px-2 py-0.5 rounded border border-cyan-800">
                              ACTIVE LOCK
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-sans mt-1 line-clamp-2">
                          {preset.description}
                        </p>
                      </div>
                    </div>

                    {/* Color Swatch Strip */}
                    <div className="flex items-center space-x-1.5 mt-3 pt-2 border-t border-slate-800/80">
                      {preset.colorPalette.map((hex, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 rounded-full border border-slate-700 shadow-sm"
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                      <span className="text-[10px] font-mono text-slate-500 ml-auto">
                        {preset.frameRate} FPS • {preset.aspectRatio}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 2 Columns: Detailed Style Form Editor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 uppercase font-mono tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Active Style Matrix Parameters
                  </h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Configure the exact LoRA tags, quality modifiers, and negative prompt boundaries injected into every shot generation.
                  </p>
                </div>
                <button
                  onClick={() => handleSaveStyleConfig(styleForm)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs px-3.5 py-2 rounded-lg transition-all"
                >
                  Save Active Style Matrix
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                    Style Matrix Preset Name
                  </label>
                  <input
                    type="text"
                    value={styleForm.name}
                    onChange={(e) => setStyleForm({ ...styleForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-sans focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                    Aspect Ratio Lock
                  </label>
                  <select
                    value={styleForm.aspectRatio}
                    onChange={(e) => setStyleForm({ ...styleForm, aspectRatio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="16:9">16:9 (Standard Widescreen Anime)</option>
                    <option value="21:9">21:9 (Cinematic Ultra-Wide Anamorphic)</option>
                    <option value="4:3">4:3 (90s Retro CRT Ratio)</option>
                    <option value="9:16">9:16 (Vertical Short-Form Story)</option>
                  </select>
                </div>
              </div>

              {/* LoRA Tag Anchor */}
              <div>
                <label className="block text-xs font-mono font-bold text-cyan-400 mb-1 flex items-center justify-between">
                  <span>Style LoRA Tag &amp; Quality Injection Prefix</span>
                  <span className="text-[10px] text-slate-500">Auto-prepended to all AI prompts</span>
                </label>
                <textarea
                  rows={3}
                  value={styleForm.loraTag}
                  onChange={(e) => setStyleForm({ ...styleForm, loraTag: e.target.value })}
                  className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl p-3 text-xs text-cyan-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-400"
                  placeholder="<lora:style_tag:0.85>, dynamic keyframe, anime render..."
                />
              </div>

              {/* Negative Prompt Boundaries */}
              <div>
                <label className="block text-xs font-mono font-bold text-rose-400 mb-1 flex items-center justify-between">
                  <span>Global Negative Prompt Filter</span>
                  <span className="text-[10px] text-slate-500">Excludes unwanted visual artifacts</span>
                </label>
                <textarea
                  rows={2}
                  value={styleForm.negativePrompt}
                  onChange={(e) => setStyleForm({ ...styleForm, negativePrompt: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-rose-200/90 font-mono focus:outline-none focus:border-rose-500"
                  placeholder="blurry, low quality, 3d render, photorealistic..."
                />
              </div>

              {/* Interactive Color Palette Swatches */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-mono font-bold text-slate-300">
                  Global Project Color Palette Swatches
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {styleForm.colorPalette.map((hex, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5"
                    >
                      <div
                        className="w-5 h-5 rounded-lg border border-slate-700 shadow-inner"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-xs font-mono text-slate-300">{hex}</span>
                      <button
                        onClick={() => handleRemovePaletteColor(idx)}
                        className="text-slate-500 hover:text-rose-400 p-0.5 ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add New Palette Color Input */}
                  <div className="flex items-center space-x-1">
                    <input
                      type="color"
                      id="new-color-picker"
                      defaultValue="#06b6d4"
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer p-0"
                      onChange={(e) => handleAddPaletteColor(e.target.value)}
                    />
                    <label htmlFor="new-color-picker" className="text-[11px] font-mono text-cyan-400 hover:underline cursor-pointer">
                      + Add Swatch
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: REAL-TIME STYLE DELTA VISUALIZER */}
      {activeTabSection === 'style-delta' && (
        <StyleDeltaVisualizer
          project={project}
          onUpdateProject={onUpdateProject}
        />
      )}

      {/* SECTION 2: CHARACTER CONSISTENCY MATRIX */}
      {activeTabSection === 'characters' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Cast Anchor Visual Matrix ({project.cast.length} Characters)</span>
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Ensure exact character design, facial seed, hair style, costume, and LoRA embedding consistency across all scene renders.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.cast.map((character) => (
              <div
                key={character.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all"
              >
                {/* Character Header */}
                <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
                    {character.turnaroundUrl ? (
                      <img
                        src={character.turnaroundUrl}
                        alt={character.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold">
                        {character.name[0]}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      {character.name}
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                        {character.role}
                      </span>
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Seed: <span className="text-amber-400">{character.seed}</span>
                    </p>
                  </div>
                </div>

                {/* LoRA Tag Input */}
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-300 mb-1">
                    Character LoRA Anchor Trigger
                  </label>
                  <input
                    type="text"
                    value={character.loraEmbedding}
                    onChange={(e) => handleUpdateCharacterStyle(character.id, { loraEmbedding: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Character Attributes Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-500 block">Hair Style</span>
                    <input
                      type="text"
                      value={character.hairStyle}
                      onChange={(e) => handleUpdateCharacterStyle(character.id, { hairStyle: e.target.value })}
                      className="w-full bg-transparent text-slate-200 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-500 block">Eye Color</span>
                    <input
                      type="text"
                      value={character.eyeColor}
                      onChange={(e) => handleUpdateCharacterStyle(character.id, { eyeColor: e.target.value })}
                      className="w-full bg-transparent text-slate-200 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Outfit Description */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 block">Signature Costume Outfit</span>
                  <textarea
                    rows={2}
                    value={character.outfit}
                    onChange={(e) => handleUpdateCharacterStyle(character.id, { outfit: e.target.value })}
                    className="w-full bg-transparent text-slate-300 text-xs focus:outline-none resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: LIGHTING & ATMOSPHERE MATRIX */}
      {activeTabSection === 'lighting' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Lighting &amp; Environment Atmosphere Matrix</span>
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Standardize color temperature (Kelvin), shadow contrast ratios, and atmospheric volumetric particles across scene environments.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LIGHTING_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    {preset.name}
                    <span className="text-[10px] font-mono font-bold bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800">
                      {preset.tempK}K
                    </span>
                  </h4>
                  <span className="text-xs font-mono text-slate-400">
                    Contrast: <strong>{preset.contrast}</strong>
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {preset.description}
                </p>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-amber-300/90 leading-relaxed">
                  <span className="text-[10px] text-slate-500 block mb-0.5 uppercase">Prompt Lighting Modifier:</span>
                  "{preset.promptSuffix}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: AI PROMPT COMPILER WORKBENCH */}
      {activeTabSection === 'compiler' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Interactive Prompt Composition &amp; Consistency Tester</span>
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Test combining your active style matrix, character anchors, shot types, and lighting parameters into token-ready AI prompts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1">Select Character Anchor</label>
              <select
                value={selectedCompilerChar}
                onChange={(e) => setSelectedCompilerChar(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              >
                {project.cast.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1">Select Shot Type</label>
              <select
                value={selectedShotType}
                onChange={(e) => setSelectedShotType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="Extreme Close-Up">Extreme Close-Up</option>
                <option value="Close-Up Shot">Close-Up Shot</option>
                <option value="Medium Shot">Medium Shot</option>
                <option value="Wide Shot">Wide Shot</option>
                <option value="Dutch Angle Action Shot">Dutch Angle Action Shot</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1">Select Lighting Matrix</label>
              <select
                value={selectedCompilerLighting}
                onChange={(e) => setSelectedCompilerLighting(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              >
                {LIGHTING_PRESETS.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.tempK}K)</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1">Scene Action Prompt</label>
            <input
              type="text"
              value={compilerActionPrompt}
              onChange={(e) => setCompilerActionPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-sans focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Compiled Output Block */}
          <div className="bg-slate-950 border border-cyan-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 font-bold uppercase">Compiled AI Generation Master Prompt:</span>
              <button
                onClick={handleCopyCompiledPrompt}
                className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-3 py-1 rounded-lg hover:bg-cyan-900 transition-all flex items-center gap-1.5"
              >
                {copiedPrompt ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrompt ? 'Copied to Clipboard!' : 'Copy Master Prompt'}</span>
              </button>
            </div>
            <p className="text-xs font-mono text-cyan-200/90 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800 select-all">
              {compiledMasterPrompt}
            </p>
          </div>
        </div>
      )}

      {/* SECTION 5: ART DIRECTION DRIFT AUDITOR */}
      {activeTabSection === 'audit' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Art Direction Consistency Diagnostic</span>
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Audit all episode storyboard shots to verify that every prompt incorporates your active Style LoRA tag and character anchors.
              </p>
            </div>
            <button
              onClick={handleEnforceStyleAcrossShots}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono px-4 py-2 rounded-xl transition-all shadow-lg"
            >
              Sync &amp; Lock Style Matrix Across All Shots ({project.shots.length})
            </button>
          </div>

          {shotsOutofSync.length === 0 ? (
            <div className="bg-emerald-950/40 border border-emerald-800/60 p-6 rounded-2xl text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-sm font-bold text-emerald-300">Perfect Style Consistency Achieved!</h4>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                All {project.shots.length} shots in your episode project strictly conform to style matrix preset "<strong>{styleForm.name}</strong>".
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-amber-950/40 border border-amber-800/60 p-3 rounded-xl text-xs text-amber-300 font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Found {shotsOutofSync.length} shot prompts with un-synchronized or missing style matrix tags.</span>
              </div>

              <div className="space-y-2">
                {shotsOutofSync.map(shot => (
                  <div key={shot.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-amber-400 font-bold">SHOT #{shot.shotNumber} (Scene {shot.sceneNumber}):</span>
                      <p className="text-slate-400 font-sans text-xs mt-0.5 line-clamp-1">{shot.actionPrompt}</p>
                    </div>
                    <span className="text-[10px] text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800 shrink-0 ml-4">
                      Missing Style LoRA Tag
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
