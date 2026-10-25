import React from 'react';
import { ProjectStyle } from '../types';
import { PRESET_STYLES } from '../data/sampleProjects';
import { 
  Clapperboard, 
  Sparkles, 
  LayoutDashboard, 
  FileText, 
  Users, 
  Film, 
  Mic, 
  Download, 
  Video,
  Wand2, 
  Clock, 
  ShieldCheck,
  HardDrive,
  Save,
  Cpu,
  Zap,
  Sliders,
  BookOpen,
  Palette,
  AudioWaveform,
  Scroll,
  PenTool,
  Terminal,
  Gauge,
  Bot,
  FolderGit2,
  Eraser,
  Check,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  title: string;
  seriesTitle: string;
  targetDurationMin: number;
  currentStyle: ProjectStyle;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onStyleChange: (style: ProjectStyle) => void;
  onAutoGenerateAll: () => void;
  isGenerating: boolean;
  hasUnsavedChanges?: boolean;
  onManualSaveSession?: () => void;
  onOpenSelfHealing?: () => void;
  isAutoSaveEnabled?: boolean;
  onToggleAutoSave?: () => void;
  onOpenProjectManager?: () => void;
  onClearExamples?: () => void;
  lastSavedAt?: string;
  projectsCount?: number;
  hasExamples?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  seriesTitle,
  targetDurationMin,
  currentStyle,
  activeTab,
  setActiveTab,
  onStyleChange,
  onAutoGenerateAll,
  isGenerating,
  hasUnsavedChanges = false,
  onManualSaveSession,
  onOpenSelfHealing,
  isAutoSaveEnabled = true,
  onToggleAutoSave,
  onOpenProjectManager,
  onClearExamples,
  lastSavedAt,
  projectsCount = 1,
  hasExamples = false
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'controller-hub', label: 'Suite Controller & Prompts', icon: Bot },
    { id: 'series-bible', label: 'Series Bible', icon: BookOpen },
    { id: 'style-matrix', label: 'Style Matrix', icon: Palette },
    { id: 'style-delta', label: 'Style Delta', icon: Gauge },
    { id: 'script', label: 'Script Doctor', icon: FileText },
    { id: 'cast', label: 'Cast Retention', icon: Users },
    { id: 'storyboard', label: 'Storyboard', icon: Film },
    { id: 'filmora-editor', label: 'Omni Video Editor', icon: Video },
    { id: 'frame-editor', label: 'Photoshop Frame Studio', icon: PenTool },
    { id: 'manga-publisher', label: 'Manga & Webtoon', icon: Scroll },
    { id: 'dubbing', label: 'Voice Dubbing', icon: Mic },
    { id: 'audio-timeline', label: 'Audio & Lip-Sync', icon: Sliders },
    { id: 'voice-vault', label: 'Voice Vault', icon: AudioWaveform },
    { id: 'export', label: 'Export Suite', icon: Download },
    { id: 'generator', label: 'AI Video Generator (Pinokio)', icon: Video },
    { id: 'vault', label: 'Model Vault', icon: HardDrive },
    { id: 'local-settings', label: 'Local AI Settings', icon: Sliders },
    { id: 'go-harness', label: 'Go Harness Terminal', icon: Terminal },
    { id: 'continuance', label: 'Story Continuance', icon: Save },
    { id: 'orchestrator', label: 'AI Director', icon: Cpu },
  ];

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 sticky top-0 z-50 shadow-xl backdrop-blur-md bg-opacity-95">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title, Series & Project Switcher */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenProjectManager}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-rose-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all cursor-pointer group"
            title="Open Project Manager & Autosave Center"
          >
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center group-hover:bg-slate-900 transition-colors">
              <FolderGit2 className="w-5 h-5 text-cyan-400" />
            </div>
          </button>
          
          <div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenProjectManager}
                className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase tracking-wider hover:bg-cyan-900 transition cursor-pointer flex items-center gap-1"
                title="Switch projects or manage workspace"
              >
                <span>{seriesTitle}</span>
                <ChevronDown className="w-3 h-3 text-cyan-400" />
              </button>
              
              <span className="text-xs text-slate-400 hidden sm:flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Target: {targetDurationMin}m</span>
              </span>

              {hasExamples && onClearExamples && (
                <button
                  onClick={onClearExamples}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 transition cursor-pointer flex items-center gap-1"
                  title="Clear all example scenes, cast, and shots to start with a blank slate"
                >
                  <Eraser className="w-3 h-3 text-rose-400" />
                  <span>Clear Examples</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 mt-0.5">
              <h1 
                onClick={onOpenProjectManager}
                className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2 hover:text-cyan-300 transition cursor-pointer"
                title="Click to manage or switch projects"
              >
                <span>{title}</span>
              </h1>
              <button
                onClick={onOpenProjectManager}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer flex items-center gap-1"
              >
                <span>Projects ({projectsCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Middle: Style LoRA Selector */}
        <div className="hidden lg:flex items-center space-x-3 bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 px-3">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <div className="text-xs">
            <span className="text-slate-400 block font-mono">Style LoRA:</span>
            <select
              value={currentStyle.id}
              onChange={(e) => {
                const s = PRESET_STYLES.find(st => st.id === e.target.value);
                if (s) onStyleChange(s);
              }}
              className="bg-transparent text-slate-200 font-semibold text-xs focus:outline-none cursor-pointer"
            >
              {PRESET_STYLES.map((st) => (
                <option key={st.id} value={st.id} className="bg-slate-900 text-slate-200">
                  {st.name} ({st.frameRate}fps)
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-1 pl-2 border-l border-slate-800">
            {currentStyle.colorPalette.map((col, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full border border-slate-700"
                style={{ backgroundColor: col }}
                title={`Color ${col}`}
              />
            ))}
          </div>
        </div>

        {/* Right: Autosave Controls, Manual Save Button & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* User Requested: Autosave Button (Toggle & Status) */}
          {onToggleAutoSave && (
            <button
              onClick={onToggleAutoSave}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold shadow-md transition-all cursor-pointer ${
                isAutoSaveEnabled
                  ? 'bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/60 shadow-cyan-500/10'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
              title={isAutoSaveEnabled ? "Autosave is ON. Click to toggle OFF." : "Autosave is OFF. Click to turn ON."}
            >
              <Zap className={`w-3.5 h-3.5 ${isAutoSaveEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
              <span>{isAutoSaveEnabled ? 'Autosave: ON' : 'Autosave: OFF'}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isAutoSaveEnabled ? 'bg-cyan-400' : 'bg-slate-600'}`} />
            </button>
          )}

          {/* User Requested: Manual Save Now Button */}
          {onManualSaveSession && (
            <button
              onClick={onManualSaveSession}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold shadow-md transition-all cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-400 shadow-amber-500/20 animate-pulse hover:animate-none'
                  : 'bg-slate-850 hover:bg-slate-800 text-emerald-400 border border-slate-750'
              }`}
              title={hasUnsavedChanges ? "You have unsynced edits. Click to save project now." : "Project is fully synced. Click to force snapshot."}
            >
              {hasUnsavedChanges ? (
                <>
                  <Save className="w-3.5 h-3.5 text-slate-950" />
                  <span>Save Project</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved</span>
                </>
              )}
            </button>
          )}

          {/* Projects Hub / Switcher Button */}
          {onOpenProjectManager && (
            <button
              onClick={onOpenProjectManager}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono font-semibold transition cursor-pointer"
              title="Open Project Manager to switch projects or create a blank one"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Projects</span>
            </button>
          )}

          {/* Self-Healing System Active Button */}
          {onOpenSelfHealing && (
            <button
              onClick={onOpenSelfHealing}
              className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/50 text-xs font-mono font-bold shadow-lg transition-all cursor-pointer"
              title="Click to run self-healing diagnostic sweep"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Self-Healing</span>
            </button>
          )}

          <button
            onClick={onAutoGenerateAll}
            disabled={isGenerating}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg transition-all duration-200 ${
              isGenerating
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-rose-500 text-white hover:opacity-95 shadow-cyan-500/20 active:scale-95'
            }`}
          >
            <Wand2 className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating...' : 'Production'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 border-t border-slate-900 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2.5 px-4 text-xs font-medium border-b-2 transition-all duration-150 whitespace-nowrap ${
                isActive
                  ? 'border-cyan-400 text-cyan-400 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
